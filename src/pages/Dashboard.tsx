import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Wallet, Calendar, ChevronRight } from 'lucide-react';
import { topScorers } from '@/game/engine';

export default function Dashboard() {
  const { state } = useGame();
  const nav = useNavigate();
  if (!state) { nav('/career'); return null; }

  const myClub = state.clubs[state.myClubId];
  const standings = state.standings[myClub.division] ?? [];
  const myRow = standings.find(r => r.clubId === myClub.id);
  const myPos = myRow ? standings.indexOf(myRow) + 1 : '—';

  const nextMatch = state.fixtures.find(f => !f.played && (f.homeId === myClub.id || f.awayId === myClub.id));
  const recent = state.fixtures.filter(f => f.played && (f.homeId === myClub.id || f.awayId === myClub.id)).slice(-3).reverse();
  const myPlayers = myClub.playerIds.map(id => state.players[id]).filter(Boolean);
  const topScorer = myPlayers.sort((a, b) => b.goals - a.goals)[0];
  const leagueTopScorer = topScorers(state, 1)[0];

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Next match hero */}
      {nextMatch ? (
        <div className="glass rounded-2xl p-5 bg-gradient-pitch/10 border-primary/30 shadow-elegant">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" /> Next Match · Week {nextMatch.week}</div>
          <div className="flex items-center justify-between gap-3">
            <TeamMini club={state.clubs[nextMatch.homeId]} />
            <div className="font-display text-2xl font-bold text-muted-foreground">VS</div>
            <TeamMini club={state.clubs[nextMatch.awayId]} reverse />
          </div>
          <Button asChild className="w-full mt-4 bg-gradient-pitch shadow-glow font-display tracking-wider" size="lg">
            <Link to="/app/match">PLAY MATCH</Link>
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-5">
          <div className="font-display font-bold mb-2">Season {state.season} complete</div>
          <Button asChild className="w-full bg-gradient-gold" size="lg"><Link to="/app/league">View final table</Link></Button>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<Trophy className="h-4 w-4" />} label="League" value={`${myPos}${typeof myPos==='number'?ord(myPos):''}`} hint={`Div ${myClub.division}`} />
        <Tile icon={<Wallet className="h-4 w-4" />} label="Budget" value={`€${(myClub.budget/1e6).toFixed(1)}M`} hint="Transfer fund" />
        <Tile icon={<Target className="h-4 w-4" />} label="Top Scorer" value={topScorer ? `${topScorer.goals}` : '0'} hint={topScorer?.lastName ?? '—'} />
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-display font-bold">Recent Form</div>
          <Link to="/app/league" className="text-xs text-muted-foreground flex items-center">All <ChevronRight className="h-3 w-3" /></Link>
        </div>
        {recent.length === 0 ? <div className="text-xs text-muted-foreground">No matches played yet.</div> :
          recent.map(m => {
            const h = state.clubs[m.homeId]; const a = state.clubs[m.awayId];
            const isHome = m.homeId === myClub.id;
            const gf = isHome ? m.homeGoals! : m.awayGoals!;
            const ga = isHome ? m.awayGoals! : m.homeGoals!;
            const res = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
            const resColor = res === 'W' ? 'bg-primary text-primary-foreground' : res === 'L' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary';
            return (
              <div key={m.id} className="flex items-center gap-2 py-2 border-t border-border/40 first:border-t-0 text-sm">
                <span className={`stat-pill ${resColor} w-7`}>{res}</span>
                <span className="flex-1 truncate text-xs">{h.shortName} <span className="font-bold">{m.homeGoals}-{m.awayGoals}</span> {a.shortName}</span>
                <span className="text-[10px] text-muted-foreground">W{m.week}</span>
              </div>
            );
          })
        }
      </div>

      {/* League top scorer */}
      {leagueTopScorer && (
        <div className="glass rounded-2xl p-4">
          <div className="font-display font-bold mb-2">🏆 Golden Boot</div>
          <div className="flex items-center gap-3">
            <div className="stat-pill bg-gradient-gold text-accent-foreground text-base">{leagueTopScorer.goals}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{leagueTopScorer.firstName} {leagueTopScorer.lastName}</div>
              <div className="text-xs text-muted-foreground">{state.clubs[leagueTopScorer.clubId]?.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ord(n: number) { return n===1?'st':n===2?'nd':n===3?'rd':'th'; }

function TeamMini({ club, reverse }: { club: any; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${reverse?'flex-row-reverse text-right':''}`}>
      <div className="h-12 w-12 rounded-md flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: club.primaryColor, color: club.secondaryColor }}>{club.badge}</div>
      <div className="min-w-0">
        <div className="font-display font-bold text-sm truncate">{club.name}</div>
        <div className="text-[10px] text-muted-foreground">Rep {'★'.repeat(club.reputation)}</div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="font-display text-xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
    </div>
  );
}
