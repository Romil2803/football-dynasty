import { useGame } from '@/hooks/useGame';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function League() {
  const { state } = useGame();
  if (!state) return null;
  const myClub = state.clubs[state.myClubId];
  const div = myClub.division;
  const standings = state.standings[div] ?? [];
  const upcoming = state.fixtures.filter(f => !f.played).slice(0, 10);
  const past = state.fixtures.filter(f => f.played).slice(-10).reverse();

  return (
    <div className="p-4 space-y-3 animate-fade-in">
      <Tabs defaultValue="table">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-3">
          <div className="glass rounded-xl overflow-hidden">
            <div className="grid grid-cols-[28px_1fr_24px_24px_24px_24px_36px_28px] text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 border-b border-border/60">
              <span>#</span><span>Club</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span><span className="text-center">GD</span><span className="text-center">Pts</span>
            </div>
            {standings.map((row, i) => {
              const c = state.clubs[row.clubId];
              const isMe = row.clubId === myClub.id;
              const zone = i < 3 ? 'border-l-2 border-primary' : i >= standings.length - 3 ? 'border-l-2 border-destructive' : 'border-l-2 border-transparent';
              return (
                <div key={row.clubId} className={`grid grid-cols-[28px_1fr_24px_24px_24px_24px_36px_28px] items-center text-xs px-2 py-2 border-b border-border/30 ${isMe ? 'bg-primary/10 font-bold' : ''} ${zone}`}>
                  <span className="text-muted-foreground">{i + 1}</span>
                  <span className="flex items-center gap-1.5 min-w-0"><span>{c.badge}</span><span className="truncate">{c.name}</span></span>
                  <span className="text-center">{row.played}</span>
                  <span className="text-center">{row.wins}</span>
                  <span className="text-center">{row.draws}</span>
                  <span className="text-center">{row.losses}</span>
                  <span className="text-center">{row.gf - row.ga}</span>
                  <span className="text-center font-display font-bold">{row.points}</span>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="fixtures" className="mt-3 space-y-1.5">
          {upcoming.map(m => (
            <div key={m.id} className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-8">W{m.week}</span>
              <span className="flex-1 truncate text-right">{state.clubs[m.homeId].name}</span>
              <span className="text-muted-foreground mx-2">vs</span>
              <span className="flex-1 truncate">{state.clubs[m.awayId].name}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="results" className="mt-3 space-y-1.5">
          {past.map(m => (
            <div key={m.id} className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-8">W{m.week}</span>
              <span className="flex-1 truncate text-right">{state.clubs[m.homeId].name}</span>
              <span className="font-display font-bold mx-2">{m.homeGoals} - {m.awayGoals}</span>
              <span className="flex-1 truncate">{state.clubs[m.awayId].name}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
