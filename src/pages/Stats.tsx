import { useGame } from '@/hooks/useGame';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Stats() {
  const { state } = useGame();
  if (!state) return null;

  const myClub = state.clubs[state.myClubId];
  const div = myClub.division;
  const allPlayers = Object.values(state.players).filter(p => state.clubs[p.clubId]?.division === div);
  const scorers = [...allPlayers].sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 15);
  const assists = [...allPlayers].sort((a, b) => b.assists - a.assists).slice(0, 15);
  const cleanSheets = [...allPlayers].filter(p => p.position === 'GK').sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 15);
  const finances = state.finances.slice(-20).reverse();

  return (
    <div className="p-4 space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Transfer Budget" value={`€${(myClub.budget/1e6).toFixed(2)}M`} />
        <Stat label="Wage Bill / wk" value={`€${(myClub.playerIds.reduce((s,id)=>s+(state.players[id]?.wage??0),0)/1000).toFixed(0)}k`} />
      </div>

      <Tabs defaultValue="scorers">
        <TabsList className="grid grid-cols-4 w-full text-[11px]">
          <TabsTrigger value="scorers">Boot</TabsTrigger>
          <TabsTrigger value="assists">Assists</TabsTrigger>
          <TabsTrigger value="cs">Clean ◯</TabsTrigger>
          <TabsTrigger value="fin">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="scorers" className="mt-3"><Table rows={scorers.map((p, i) => ({ i, name: `${p.firstName} ${p.lastName}`, club: state.clubs[p.clubId]?.shortName ?? '—', value: p.goals }))} valueLabel="G" /></TabsContent>
        <TabsContent value="assists" className="mt-3"><Table rows={assists.map((p, i) => ({ i, name: `${p.firstName} ${p.lastName}`, club: state.clubs[p.clubId]?.shortName ?? '—', value: p.assists }))} valueLabel="A" /></TabsContent>
        <TabsContent value="cs" className="mt-3"><Table rows={cleanSheets.map((p, i) => ({ i, name: `${p.firstName} ${p.lastName}`, club: state.clubs[p.clubId]?.shortName ?? '—', value: p.cleanSheets }))} valueLabel="CS" /></TabsContent>

        <TabsContent value="fin" className="mt-3 space-y-1.5">
          {finances.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">No transactions yet.</div>}
          {finances.map((f, i) => (
            <div key={i} className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-10">W{f.week}</span>
              <span className="flex-1 truncate capitalize">{f.type}{f.note ? ` · ${f.note}` : ''}</span>
              <span className={`font-display font-bold ${f.amount >= 0 ? 'text-primary' : 'text-destructive'}`}>{f.amount >= 0 ? '+' : ''}€{(f.amount/1000).toFixed(0)}k</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {state.history.length > 0 && (
        <div className="glass rounded-xl p-3 mt-4">
          <div className="font-display font-bold mb-2">Career History</div>
          {state.history.map((h, i) => (
            <div key={i} className="text-xs py-1.5 border-t border-border/40 first:border-t-0 flex items-center justify-between">
              <span>S{h.season} · Div {h.division} · {h.position}{ord(h.position)}</span>
              <span className="text-muted-foreground truncate ml-2">🏆 {h.champion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ord(n: number) { return n===1?'st':n===2?'nd':n===3?'rd':'th'; }

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="glass rounded-xl p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-lg font-bold">{value}</div></div>;
}

function Table({ rows, valueLabel }: { rows: { i: number; name: string; club: string; value: number }[]; valueLabel: string }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="grid grid-cols-[28px_1fr_40px_32px] text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 border-b border-border/60">
        <span>#</span><span>Player</span><span>Club</span><span className="text-right">{valueLabel}</span>
      </div>
      {rows.map(r => (
        <div key={r.i} className="grid grid-cols-[28px_1fr_40px_32px] items-center text-xs px-3 py-2 border-b border-border/30">
          <span className="text-muted-foreground">{r.i + 1}</span>
          <span className="truncate">{r.name}</span>
          <span className="text-muted-foreground">{r.club}</span>
          <span className="text-right font-display font-bold">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
