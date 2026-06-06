import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ArrowUpCircle } from 'lucide-react';
import { useGame } from '@/hooks/useGame';
import { PlayerRow } from '@/components/PlayerRow';
import { PlayerDetailModal } from '@/components/PlayerDetailModal';
import { Player } from '@/game/types';
import { FORMATIONS } from '@/game/data';
import { selectStartingXI, listPlayer, swapPlayers, extendContract } from '@/game/engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Squad() {
  const { state, update } = useGame();
  const [selected, setSelected] = useState<Player | null>(null);
  const [swapSourcePlayer, setSwapSourcePlayer] = useState<Player | null>(null);
  const [filter, setFilter] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<'ovr'|'age'|'value'>('ovr');

  const handlePlayerClick = (p: Player) => {
    if (swapSourcePlayer) {
      if (swapSourcePlayer.id === p.id) {
        setSwapSourcePlayer(null);
        toast.info('Swap cancelled');
      } else {
        update(s => swapPlayers(s, swapSourcePlayer.id, p.id));
        toast.success(`Swapped ${swapSourcePlayer.lastName} and ${p.lastName}`);
        setSwapSourcePlayer(null);
      }
    } else {
      setSelected(p);
    }
  };

  const myClub = state?.clubs[state?.myClubId];

  const players = useMemo(() => {
    if (!state || !myClub) return [];
    return myClub.playerIds.map(id => state.players[id]).filter(Boolean);
  }, [state, myClub]);

  const youthPlayers = useMemo(() => {
    if (!state || !myClub) return [];
    return (myClub.youthIds || []).map(id => state.players[id]).filter(Boolean);
  }, [state, myClub]);

  if (!state || !myClub) return null;

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

  const promotePlayer = (p: Player) => {
    update(s => {
      const c = s.clubs[s.myClubId];
      c.youthIds = c.youthIds.filter(id => id !== p.id);
      c.playerIds.push(p.id);
    });
    toast.success(`${p.firstName} ${p.lastName} promoted to the senior squad!`);
    setSelected(null);
  };

  const upgradeAcademy = () => {
    const currentLevel = myClub.academyLevel || 1;
    if (currentLevel >= 5) {
      toast.error('Academy is already at maximum level!');
      return;
    }
    const cost = currentLevel * 5_000_000;
    if (myClub.budget < cost) {
      toast.error(`Not enough funds. Need €${(cost/1e6).toFixed(1)}M.`);
      return;
    }
    update(s => {
      const c = s.clubs[s.myClubId];
      c.budget -= cost;
      c.academyLevel = (c.academyLevel || 1) + 1;
      s.finances.push({ week: s.week, type: 'transferOut', amount: -cost, note: `Academy Upgrade (Lvl ${c.academyLevel})` });
    });
    toast.success(`Academy upgraded to Level ${currentLevel + 1}!`);
  };

  const handleExtendContract = (p: Player) => {
    update(s => {
      const res = extendContract(s, p.id);
      if (res.ok) {
        toast.success(`Contract renewed at €${res.wage?.toLocaleString()}/week for 3 years!`);
      } else {
        toast.error(res.error || 'Failed to renew contract');
      }
    });
    setSelected(null);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <Tabs defaultValue="first-team">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-background/50 border border-border/50">
          <TabsTrigger value="first-team">First Team</TabsTrigger>
          <TabsTrigger value="academy">Youth Academy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="first-team" className="space-y-4 mt-0">
          {swapSourcePlayer && (
            <div className="bg-primary/20 border border-primary/50 text-foreground rounded-xl p-3 flex items-center justify-between text-xs">
              <span>
                Swapping <strong>{swapSourcePlayer.firstName} {swapSourcePlayer.lastName}</strong>.
                Click another player in the list to complete the swap.
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSwapSourcePlayer(null)} className="h-7 text-xs px-2">
                Cancel
              </Button>
            </div>
          )}
          <div className="glass rounded-xl p-3 flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Formation</div>
            <Select value={myClub.formation} onValueChange={changeFormation}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(FORMATIONS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={autoPick}>Auto Pick</Button>
          </div>

          <Section title={`Starting XI (${xi.length})`}>
            {xi.map(p => <PlayerRow key={p.id} player={p} onClick={() => handlePlayerClick(p)} />)}
          </Section>

          <Section title={`Bench (${bench.length})`}>
            {bench.map(p => <PlayerRow key={p.id} player={p} onClick={() => handlePlayerClick(p)} />)}
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
              <Select value={sort} onValueChange={(v: 'ovr'|'age'|'value') => setSort(v)}>
                <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ovr">OVR</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filtered.map(p => <PlayerRow key={p.id} player={p} onClick={() => handlePlayerClick(p)} />)}
          </Section>
        </TabsContent>

        <TabsContent value="academy" className="space-y-4 mt-0">
          <div className="glass rounded-xl p-5 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Youth Academy
              </h3>
              <p className="text-sm text-muted-foreground">Level {myClub.academyLevel || 1} / 5</p>
            </div>
            {(myClub.academyLevel || 1) < 5 && (
              <Button onClick={upgradeAcademy} variant="outline" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade (€{((myClub.academyLevel || 1) * 5)}M)
              </Button>
            )}
          </div>
          
          <Section title={`Prospects (${youthPlayers.length})`}>
            {youthPlayers.length === 0 && <p className="text-sm text-muted-foreground p-2">No youth players currently in the academy. New intake arrives at the end of the season.</p>}
            {youthPlayers.map(p => <PlayerRow key={p.id} player={p} onClick={() => handlePlayerClick(p)} />)}
          </Section>
        </TabsContent>
      </Tabs>

      <PlayerDetailModal player={selected} onClose={() => setSelected(null)}
        action={selected && selected.clubId === myClub.id ? (
          <div className="flex flex-col gap-2 pt-3 border-t border-border/40 mt-2">
            {(myClub.youthIds || []).includes(selected.id) ? (
              <Button onClick={() => promotePlayer(selected)} className="bg-gradient-pitch">Promote to Senior Squad</Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleExtendContract(selected)}>Renew Contract</Button>
                <Button variant="outline" onClick={() => { setSwapSourcePlayer(selected); setSelected(null); }}>Swap Position</Button>
                <Button variant="destructive" onClick={() => listForSale(selected)} className="col-span-2">List for Sale</Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => setSelected(null)} className="w-full">Close</Button>
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
