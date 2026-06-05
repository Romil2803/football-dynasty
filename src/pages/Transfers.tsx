import { useMemo, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { PlayerRow } from '@/components/PlayerRow';
import { PlayerDetailModal } from '@/components/PlayerDetailModal';
import { Player } from '@/game/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { buyPlayer, generateTransferMarket } from '@/game/engine';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export default function Transfers() {
  const { state, update } = useGame();
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState('');
  const [pos, setPos] = useState('ALL');
  const [sort, setSort] = useState<'price'|'ovr'|'age'>('ovr');

  if (!state) return null;
  const myClub = state.clubs[state.myClubId];

  const listed = useMemo(() => state.transferList
    .filter(l => state.players[l.playerId])
    .map(l => ({ player: state.players[l.playerId], price: l.askingPrice }))
    .filter(({ player }) => player.clubId !== myClub.id), [state, myClub.id]);

  const filtered = listed
    .filter(x => filter ? `${x.player.firstName} ${x.player.lastName}`.toLowerCase().includes(filter.toLowerCase()) : true)
    .filter(x => pos === 'ALL' ? true : x.player.position === pos)
    .sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'ovr' ? b.player.overall - a.player.overall : a.player.age - b.player.age);

  const selectedListing = selected ? state.transferList.find(l => l.playerId === selected.id) : null;

  const handleBuy = () => {
    if (!selected) return;
    let result: { ok: boolean; reason?: string } = { ok: false };
    update(s => { result = buyPlayer(s, selected.id); });
    if (result.ok) { toast.success(`Signed ${selected.firstName} ${selected.lastName}`); setSelected(null); }
    else toast.error(result.reason ?? 'Failed');
  };

  const refresh = () => { update(s => generateTransferMarket(s)); toast.success('Market refreshed'); };

  return (
    <div className="p-4 space-y-3 animate-fade-in">
      <div className="glass rounded-xl p-3 flex items-center gap-2">
        <div className="text-xs text-muted-foreground">Budget</div>
        <div className="font-display font-bold text-primary">€{(myClub.budget/1e6).toFixed(1)}M</div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search players…" value={filter} onChange={e => setFilter(e.target.value)} className="h-9" />
        <Select value={pos} onValueChange={setPos}>
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
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="age">Age</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">No players match.</div>}
        {filtered.map(({ player, price }) => (
          <PlayerRow key={player.id} player={player} onClick={() => setSelected(player)}
            right={<div className="text-right text-xs"><div className="font-bold text-accent">€{(price/1e6).toFixed(1)}M</div><div className="text-muted-foreground">ask</div></div>}
          />
        ))}
      </div>

      <PlayerDetailModal player={selected} onClose={() => setSelected(null)}
        action={selectedListing && selected && selected.clubId !== myClub.id ? (
          <div className="space-y-2 pt-3">
            <div className="text-center text-sm">Asking price: <span className="font-display font-bold text-accent">€{(selectedListing.askingPrice/1e6).toFixed(1)}M</span></div>
            <Button onClick={handleBuy} className="w-full bg-gradient-pitch" disabled={myClub.budget < selectedListing.askingPrice}>
              {myClub.budget < selectedListing.askingPrice ? 'Insufficient funds' : 'Sign player'}
            </Button>
          </div>
        ) : undefined}
      />
    </div>
  );
}
