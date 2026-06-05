import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Play, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Career() {
  const { slots, loadSlots, loadFromSlot, deleteSlot } = useGame();
  const { isGuest, user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { loadSlots(); }, [loadSlots]);

  const slotArr = Array.from({ length: 5 }, (_, i) => slots.find(s => s.slot === i) ?? null);

  const handleLoad = async (slot: number) => {
    await loadFromSlot(slot);
    toast.success('Career loaded');
    nav('/app');
  };

  return (
    <div className="min-h-screen max-w-screen-md mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-sm text-muted-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <span className="text-xs text-muted-foreground">{user ? user.email : isGuest ? 'Guest mode' : ''}</span>
      </div>
      <h1 className="font-display text-3xl font-bold mb-1">Your Careers</h1>
      <p className="text-sm text-muted-foreground mb-6">{user ? 'Saves sync to your account.' : 'Guest saves stored on this device.'}</p>

      <Button asChild size="lg" className="w-full bg-gradient-pitch shadow-elegant mb-6 font-display tracking-wide">
        <Link to="/new-career"><Plus className="mr-2 h-5 w-5" /> Start New Career</Link>
      </Button>

      <div className="space-y-3">
        {slotArr.map((s, i) => (
          <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-md bg-secondary flex items-center justify-center font-display font-bold text-lg">
              {i === 0 ? 'A' : i}
            </div>
            <div className="flex-1 min-w-0">
              {s ? (
                <>
                  <div className="font-display font-bold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.clubName} · Season {s.season}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Empty slot {i === 0 ? '(Autosave)' : ''}</div>
              )}
            </div>
            {s && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleLoad(i)}><Play className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteSlot(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
