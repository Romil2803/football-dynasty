import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Users, BarChart3, ArrowLeftRight } from 'lucide-react';

const features = [
  { icon: Trophy, title: '20-team league', desc: 'Full season simulation with promotions & relegations.' },
  { icon: Users, title: 'Squad management', desc: 'Formations, starting XI, bench, morale & injuries.' },
  { icon: ArrowLeftRight, title: 'Live transfer market', desc: 'AI-driven listings, scouting and bids.' },
  { icon: BarChart3, title: 'Deep stats', desc: 'Golden Boot, clean sheets, ratings and history.' },
];

export default function Index() {
  const { user, isGuest, continueAsGuest } = useAuth();
  const nav = useNavigate();

  const start = () => { if (!user && !isGuest) continueAsGuest(); nav('/career'); };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-screen-md mx-auto px-5 pt-10 pb-20 w-full">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold mb-4">
            <span className="h-px w-8 bg-primary" /> Manager Simulation <span className="h-px w-8 bg-primary" />
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-none mb-3">
            FOOTBALL<br/><span className="text-gradient-gold">DYNASTY</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Take charge of any club. Build legends, lift trophies, and rule the league across decades.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={start} className="bg-gradient-pitch shadow-elegant hover:shadow-glow font-display tracking-wide">
              {user || isGuest ? 'Continue' : 'Play as Guest'}
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline" className="font-display tracking-wide">
                <Link to="/auth">Sign In / Sign Up</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-14">
          {features.map(f => (
            <div key={f.title} className="glass rounded-xl p-4 hover:border-primary/40 transition">
              <f.icon className="h-6 w-6 text-primary mb-2" />
              <div className="font-display font-bold">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center text-[11px] text-muted-foreground mt-10">
          Inspired by classic football management games. Built for mobile and desktop.
        </div>
      </main>
    </div>
  );
}
