import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/hooks/useGame';
import { createMyClub, createWorld, generateTransferMarket } from '@/game/engine';
import { BADGES, CLUB_PRESETS_D1, COLORS } from '@/game/data';
import { GameState } from '@/game/types';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewCareer() {
  const { newGame, saveToSlot } = useGame();
  const nav = useNavigate();
  const [managerName, setManagerName] = useState('Manager');

  // Own club
  const [name, setName] = useState('FC Dynasty');
  const [short, setShort] = useState('DYN');
  const [stadium, setStadium] = useState('Dynasty Arena');
  const [badge, setBadge] = useState(BADGES[0]);
  const [colorIdx, setColorIdx] = useState(0);
  const [division, setDivision] = useState(2);

  const startOwn = async () => {
    const { primary, secondary } = COLORS[colorIdx];
    const { club, players } = createMyClub({ name, short, primaryColor: primary, secondaryColor: secondary, badge, stadium, division });
    const world = createWorld(club, players);
    const state: GameState = {
      version: 1, managerName, myClubId: club.id, season: 1, week: 1,
      clubs: world.clubs, players: world.players, fixtures: world.fixtures,
      standings: {}, transferList: [], finances: [], history: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    generateTransferMarket(state);
    newGame(state);
    await saveToSlot(0, 'Autosave');
    toast.success('Career started');
    nav('/app');
  };

  const startExisting = async (presetName: string) => {
    const preset = CLUB_PRESETS_D1.find(p => p.name === presetName)!;
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    const { club, players } = createMyClub({ name: preset.name, short: preset.short, primaryColor: col.primary, secondaryColor: col.secondary, badge: preset.badge, stadium: `${preset.city} Arena`, division: 1 });
    const world = createWorld(club, players);
    const state: GameState = {
      version: 1, managerName, myClubId: club.id, season: 1, week: 1,
      clubs: world.clubs, players: world.players, fixtures: world.fixtures,
      standings: {}, transferList: [], finances: [], history: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    generateTransferMarket(state);
    newGame(state);
    await saveToSlot(0, 'Autosave');
    toast.success(`Took charge of ${preset.name}`);
    nav('/app');
  };

  return (
    <div className="min-h-screen max-w-screen-md mx-auto px-5 py-6">
      <Link to="/career" className="text-sm text-muted-foreground flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="font-display text-3xl font-bold mb-1">New Career</h1>
      <p className="text-sm text-muted-foreground mb-6">Create your own club or take charge of an existing one.</p>

      <div className="glass rounded-xl p-4 mb-4">
        <Label>Manager Name</Label>
        <Input value={managerName} onChange={e => setManagerName(e.target.value)} />
      </div>

      <Tabs defaultValue="own">
        <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="own">Create Club</TabsTrigger><TabsTrigger value="existing">Existing Club</TabsTrigger></TabsList>

        <TabsContent value="own" className="space-y-4 mt-4">
          <div className="glass rounded-xl p-4 space-y-3">
            <div><Label>Club Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Short</Label><Input value={short} onChange={e => setShort(e.target.value.toUpperCase())} maxLength={4} /></div>
              <div><Label>Stadium</Label><Input value={stadium} onChange={e => setStadium(e.target.value)} /></div>
            </div>
            <div>
              <Label>Badge</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {BADGES.map(b => (
                  <button key={b} onClick={() => setBadge(b)}
                    className={`h-10 w-10 rounded-md text-xl glass ${badge===b?'ring-2 ring-primary':''}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLORS.map((c, i) => (
                  <button key={i} onClick={() => setColorIdx(i)}
                    className={`h-10 w-16 rounded-md border-2 ${colorIdx===i?'border-primary':'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%)` }} />
                ))}
              </div>
            </div>
            <div>
              <Label>Starting Division</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button variant={division===1?'default':'outline'} onClick={() => setDivision(1)} className={division===1?'bg-gradient-pitch':''}>Top Flight</Button>
                <Button variant={division===2?'default':'outline'} onClick={() => setDivision(2)} className={division===2?'bg-gradient-pitch':''}>Second Tier</Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Lower divisions are harder financially but more rewarding.</p>
            </div>
            <Button onClick={startOwn} className="w-full bg-gradient-pitch shadow-elegant font-display tracking-wide" size="lg">Start Career</Button>
          </div>
        </TabsContent>

        <TabsContent value="existing" className="mt-4 grid grid-cols-2 gap-2">
          {CLUB_PRESETS_D1.map(c => (
            <button key={c.name} onClick={() => startExisting(c.name)} className="glass rounded-xl p-3 hover:border-primary transition text-left">
              <div className="text-2xl mb-1">{c.badge}</div>
              <div className="font-display font-bold text-sm truncate">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.city}</div>
            </button>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
