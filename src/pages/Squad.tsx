import { useMemo, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { PlayerRow } from '@/components/PlayerRow';
import { PlayerDetailModal } from '@/components/PlayerDetailModal';
import { Player } from '@/game/types';
import { FORMATIONS } from '@/game/data';
import { selectStartingXI, listPlayer } from '@/game/engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Squad() {
  const { state, update } = useGame();
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<'ovr'|'age'|'value'>('ovr');

  if (!state) return null;
  const myClub = state.clubs[state.myClubId];
  const players = useMemo(() => myClub.playerIds.map(id => state.players[id]).filter(Boolean), [state, myClub]);

  const xi = myClub.startingXI.map(id => state.players[id]).filter(Boolean);
  const bench = myClub.bench.map(id => state.players[id]).filter(Boolean);
  const xiIds = new Set(myClub.startingXI);
  const benchIds = new Set(myClub.bench);
  const reserves = players.filter(p => !xiIds.has(p.id) && !benchIds.has(p.id));

  const filtered = reserves
    .filter(p => filter ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(filter.toLowerCase()) : true)
    .filter(p => posFilter === 'ALL' ? true : p.position === posFilter)
    .sort((a, b) => sort === 'ovr' ? b.overall - a.overall : sort === 'age' ? a.age - b.age : b.value - a.value);

  const changeFormation = (f: string) => {
    update(s => {
      const c = s.clubs[s.myClubId];
      c.formation = f;
      const sel = selectStartingXI(c, c.playerIds.map(id => s.players[id]));
      c.startingXI = sel.startingXI; c.bench = sel.bench;
    });
  };

  const autoPick = () => {
    update(s => {
      const c = s.clubs[s.myClubId];
      const sel = selectStartingXI(c, c.playerIds.map(id => s.players[id]));
      c.startingXI = sel.startingXI; c.bench = sel.bench;
    });
    toast.success('Best XI selected');
  };

  const listForSale = (p: Player) => {
    const price = Math.floor(p.value * 1.1);
    update(s => listPlayer(s, p.id, price));
    toast.success(`${p.lastName} listed for €${(price/1e6).toFixed(1)}M`);
    setSelected(null);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="glass rounded-xl p-3 flex items-center gap-2">
        <div className="text-xs text-muted-foreground">Formation</div>
        <Select value={myClub.formation} onValueChange={changeFormation}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.keys(FORMATIONS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={autoPick}>Auto Pick</Button>
      </div>

      <Section title={`Starting XI (${xi.length})`}>
        {xi.map(p => <PlayerRow key={p.id} player={p} onClick={() => setSelected(p)} />)}
      </Section>

      <Section title={`Bench (${bench.length})`}>
        {bench.map(p => <PlayerRow key={p.id} player={p} onClick={() => setSelected(p)} />)}
      </Section>

      <Section title={`Reserves (${reserves.length})`}>
        <div className="flex gap-2 mb-2">
          <Input placeholder="Search name…" value={filter} onChange={e => setFilter(e.target.value)} className="h-9" />
          <Select value={posFilter} onValueChange={setPosFilter}>
            <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {['GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ovr">OVR</SelectItem>
              <SelectItem value="age">Age</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.map(p => <PlayerRow key={p.id} player={p} onClick={() => setSelected(p)} />)}
      </Section>

      <PlayerDetailModal player={selected} onClose={() => setSelected(null)}
        action={selected && selected.clubId === myClub.id ? (
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="destructive" onClick={() => listForSale(selected)}>List for Sale</Button>
          </div>
        ) : undefined}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
