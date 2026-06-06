import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Player } from '@/game/types';
import { Progress } from '@/components/ui/progress';
import { Flag } from './PlayerRow';

export function PlayerDetailModal({ player, onClose, action }: { player: Player | null; onClose: () => void; action?: React.ReactNode }) {
  if (!player) return null;
  const stats: [string, number][] = [
    ['Pace', player.stats.pace], ['Shooting', player.stats.shooting], ['Passing', player.stats.passing],
    ['Dribbling', player.stats.dribbling], ['Defending', player.stats.defending], ['Physical', player.stats.physical],
  ];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md glass">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-between">
            <span>{player.firstName} {player.lastName}</span>
            <span className="stat-pill bg-gradient-gold text-accent-foreground text-base">{player.overall}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Position</div><div className="font-bold">{player.position}</div></div>
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Age</div><div className="font-bold">{player.age}</div></div>
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Nation</div><div className="font-bold"><Flag nationality={player.nationality} /></div></div>
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Potential</div><div className="font-bold text-primary">{player.potential}</div></div>
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Value</div><div className="font-bold">€{(player.value/1e6).toFixed(1)}M</div></div>
          <div className="glass rounded-md p-2"><div className="text-muted-foreground">Wage</div><div className="font-bold">€{(player.wage/1000).toFixed(0)}k</div></div>
        </div>
        {player.personality && (
          <div className="glass rounded-md p-2 text-xs border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Personality</span>
              <span className="font-bold text-primary tracking-wide">{player.personality.archetype}</span>
            </div>
          </div>
        )}
        <div className="space-y-2 mt-2">
          {stats.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{k}</span><span className="font-bold">{v}</span></div>
              <Progress value={v} className="h-1.5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-border/60">
          <div><div className="text-muted-foreground">Apps</div><div className="font-bold">{player.appearances}</div></div>
          <div><div className="text-muted-foreground">Goals</div><div className="font-bold">{player.goals}</div></div>
          <div><div className="text-muted-foreground">Assists</div><div className="font-bold">{player.assists}</div></div>
          <div><div className="text-muted-foreground">Morale</div><div className="font-bold">{player.morale}</div></div>
        </div>
        {action}
      </DialogContent>
    </Dialog>
  );
}
