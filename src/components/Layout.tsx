import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, Trophy, ArrowLeftRight, BarChart3, Wallet, LogOut, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { to: '/app', icon: Home, label: 'Hub', end: true },
  { to: '/app/squad', icon: Users, label: 'Squad' },
  { to: '/app/league', icon: Trophy, label: 'League' },
  { to: '/app/transfers', icon: ArrowLeftRight, label: 'Market' },
  { to: '/app/stats', icon: BarChart3, label: 'Stats' },
];

export default function Layout() {
  const { user, isGuest, signOut } = useAuth();
  const { state, autosave } = useGame();
  const nav = useNavigate();
  const myClub = state ? state.clubs[state.myClubId] : null;

  const handleLogout = async () => { await signOut(); nav('/'); };
  const handleSave = async () => { await autosave(); toast.success('Autosaved'); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {myClub && (
              <div className="h-9 w-9 rounded-md flex items-center justify-center text-xl shrink-0"
                   style={{ backgroundColor: myClub.primaryColor, color: myClub.secondaryColor }}>
                {myClub.badge}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-display font-bold truncate text-sm leading-tight">{myClub?.name ?? 'Football Dynasty'}</div>
              {state && <div className="text-[10px] text-muted-foreground">S{state.season} · W{state.week} · {isGuest ? 'Guest' : user?.email}</div>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={handleSave} title="Save"><Save className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={handleLogout} title="Exit"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-md w-full mx-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/60">
        <div className="max-w-screen-md mx-auto grid grid-cols-5 px-1">
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
