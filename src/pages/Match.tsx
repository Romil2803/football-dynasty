import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { advanceWeek, endSeason, generateTransferMarket, simulateMatch } from '@/game/engine';
import { Match, MatchEvent } from '@/game/types';
import { ArrowLeft, FastForward } from 'lucide-react';
import { toast } from 'sonner';

export default function MatchPage() {
  const { state, update, autosave } = useGame();
  const nav = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [minute, setMinute] = useState(0);
  const [shownEvents, setShownEvents] = useState<MatchEvent[]>([]);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const timerRef = useRef<number | null>(null);

  if (!state) { nav('/career'); return null; }
  const myClub = state.clubs[state.myClubId];
  const next = state.fixtures.find(f => !f.played && (f.homeId === myClub.id || f.awayId === myClub.id));

  if (!next && !finalMatch) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">No upcoming match this season.</p>
        <Button onClick={() => endAndContinue()} className="bg-gradient-gold">End Season</Button>
      </div>
    );
  }

  const home = state.clubs[(finalMatch ?? next!).homeId];
  const away = state.clubs[(finalMatch ?? next!).awayId];

  const playMatch = () => {
    if (!next) return;
    // Simulate full match silently then play back events
    const sim = simulateMatch({ ...next }, JSON.parse(JSON.stringify(state)));
    setFinalMatch(sim);
    setPlaying(true);
    setMinute(0);
    setShownEvents([]);
    let i = 0;
    let currentMin = 0;
    timerRef.current = window.setInterval(() => {
      currentMin++;
      setMinute(currentMin);
      
      while (i < (sim.events?.length ?? 0) && sim.events![i].minute <= currentMin) {
        const event = sim.events![i];
        setShownEvents(arr => [event, ...arr]);
        i++;
      }
      
      if (currentMin >= 90) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlaying(false);
        commitResult(sim);
      }
    }, 70) as unknown as number;
  };

  const skip = () => {
    if (!next) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const sim = simulateMatch({ ...next }, JSON.parse(JSON.stringify(state)));
    setFinalMatch(sim);
    setShownEvents([...(sim.events ?? [])].reverse());
    setMinute(90);
    setPlaying(false);
    commitResult(sim);
  };

  const commitResult = (sim: Match) => {
    // Run the whole week through the engine for AI matches + stats consistency
    update(s => {
      const advanced = advanceWeek(s, sim);
      Object.assign(s, advanced);
      generateTransferMarket(s);
    });
    autosave();
  };

  const endAndContinue = () => {
    update(s => {
      const advanced = endSeason(s);
      Object.assign(s, advanced);
    });
    autosave();
    toast.success('New season begins!');
    nav('/app');
  };

  const continueClicked = () => {
    if (state.fixtures.every(f => f.played)) endAndContinue();
    else nav('/app');
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const match = finalMatch ?? next!;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <button onClick={() => nav('/app')} className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back</button>

      <div className="glass rounded-2xl p-5 bg-gradient-pitch/10 border-primary/30">
        <div className="text-center text-[10px] uppercase tracking-widest text-primary font-bold mb-3">{home.stadium} · Week {match.week}</div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <Side club={home} />
          <div className="text-center">
            {finalMatch ? (
              <div className="font-display text-5xl font-bold">{match.homeGoals}<span className="text-muted-foreground mx-2">-</span>{match.awayGoals}</div>
            ) : (
              <div className="font-display text-3xl font-bold text-muted-foreground">VS</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">{minute > 0 ? `${minute}'` : ''}</div>
          </div>
          <Side club={away} reverse />
        </div>

        {!finalMatch && (
          <div className="flex gap-2">
            <Button onClick={playMatch} disabled={playing} className="flex-1 bg-gradient-pitch font-display tracking-wider" size="lg">
              {playing ? 'PLAYING…' : 'KICK OFF'}
            </Button>
            <Button onClick={skip} variant="outline" size="lg"><FastForward className="h-4 w-4" /></Button>
          </div>
        )}

        {finalMatch && !playing && (
          <Button onClick={continueClicked} className="w-full bg-gradient-gold font-display tracking-wider" size="lg">
            Continue
          </Button>
        )}
      </div>

      <div className="glass rounded-xl p-3">
        <div className="font-display font-bold text-sm mb-2">Timeline</div>
        <div className="space-y-1.5 max-h-80 overflow-auto no-scrollbar">
          {shownEvents.length === 0 && <div className="text-xs text-muted-foreground">Match events will appear here…</div>}
          {shownEvents.map((e, i) => (
            <div key={i} className="text-xs flex gap-2 items-center">
              <span className="stat-pill bg-secondary text-secondary-foreground w-9">{e.minute}'</span>
              <span className="flex-1">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Side({ club, reverse }: { club: any; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${reverse ? 'flex-row-reverse text-right' : ''}`}>
      <div className="h-14 w-14 rounded-md flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: club.primaryColor, color: club.secondaryColor }}>{club.badge}</div>
      <div className="min-w-0">
        <div className="font-display font-bold truncate">{club.shortName}</div>
        <div className="text-[10px] text-muted-foreground truncate">{club.name}</div>
      </div>
    </div>
  );
}
