import { Player } from '@/game/types';
import { cn } from '@/lib/utils';

function ovrColor(o: number) {
  if (o >= 85) return 'bg-gradient-gold text-accent-foreground';
  if (o >= 78) return 'bg-primary text-primary-foreground';
  if (o >= 70) return 'bg-secondary text-secondary-foreground';
  return 'bg-muted text-muted-foreground';
}

export function PlayerRow({ player, onClick, right }: { player: Player; onClick?: () => void; right?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg glass hover:border-primary/50 transition-all text-left">
      <span className={cn("stat-pill min-w-[36px] text-sm font-display", ovrColor(player.overall))}>{player.overall}</span>
      <span className="stat-pill min-w-[42px] bg-muted text-muted-foreground">{player.position}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">{player.firstName} {player.lastName}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <span>{player.nationality}</span> · <span>{player.age}y</span>
          {player.injured > 0 && <span className="text-destructive">🚑 {player.injured}w</span>}
        </div>
      </div>
      {right ?? <div className="text-right text-xs text-muted-foreground">
        <div>€{(player.value/1e6).toFixed(1)}M</div>
        <div>€{(player.wage/1000).toFixed(0)}k/w</div>
      </div>}
    </button>
  );
}
