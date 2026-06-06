import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/hooks/useGame';
import { createMyClub, createWorld, generateTransferMarket } from '@/game/engine';
import { cn } from '@/lib/utils';
import { ArrowLeft, Coins, Award, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { BADGES, CLUB_PRESETS_D1, COLORS, NATIONS, NATIONS_MAP } from '@/game/data';

export default function NewCareer() {
  const { newGame, saveToSlot } = useGame();
  const nav = useNavigate();
  const [managerName, setManagerName] = useState('Manager');
  const [managerNationality, setManagerNationality] = useState('🇬🇧 ENG');
  const [managerFocus, setManagerFocus] = useState<'youth' | 'financial' | 'tactical'>('tactical');
  const [financialBoost, setFinancialBoost] = useState<'none' | 'local' | 'takeover'>('none');

  const [name, setName] = useState('FC Dynasty');
  const [short, setShort] = useState('DYN');
  const [stadium, setStadium] = useState('Dynasty Arena');
  const [badge, setBadge] = useState(BADGES[0]);
  const [colorIdx, setColorIdx] = useState(0);
  const [division, setDivision] = useState(2);

  const [isNationOpen, setIsNationOpen] = useState(false);
  const [nationQuery, setNationQuery] = useState('');

  const filteredNations = Object.entries(NATIONS_MAP).filter(([code, info]) => 
    info.name.toLowerCase().includes(nationQuery.toLowerCase()) || 
    code.toLowerCase().includes(nationQuery.toLowerCase())
  );

  const startOwn = async () => {
    const { primary, secondary } = COLORS[colorIdx];
    const { club, players } = createMyClub({ name, short, primaryColor: primary, secondaryColor: secondary, badge, stadium, division, financialBoost, managerFocus });
    const world = createWorld(club, players);
    // Use the emoji and code format for compatibility with existing player lists
    const nationString = `${NATIONS_MAP[managerNationality]?.emoji ?? '🇬🇧'} ${managerNationality}`;
    const state: GameState = {
      version: 1, managerName, managerNationality: nationString, managerFocus, managerReputation: 50, boardConfidence: 50, isSacked: false, myClubId: club.id, season: 1, week: 1,
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
    const { club, players } = createMyClub({ name: preset.name, short: preset.short, primaryColor: col.primary, secondaryColor: col.secondary, badge: preset.badge, stadium: `${preset.city} Arena`, division: 1, financialBoost, managerFocus });
    const world = createWorld(club, players);
    const nationString = `${NATIONS_MAP[managerNationality]?.emoji ?? '🇬🇧'} ${managerNationality}`;
    const state: GameState = {
      version: 1, managerName, managerNationality: nationString, managerFocus, managerReputation: 50, boardConfidence: 50, isSacked: false, myClubId: club.id, season: 1, week: 1,
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

      <div className="glass rounded-xl p-4 mb-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manager Name</Label>
            <Input value={managerName} onChange={e => setManagerName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manager Nationality</Label>
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setIsNationOpen(!isNationOpen)}
                className="w-full flex items-center justify-between h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-left"
              >
                <div className="flex items-center gap-2">
                  {NATIONS_MAP[managerNationality] && (
                    <img 
                      src={`https://flagcdn.com/w20/${NATIONS_MAP[managerNationality].code2}.png`} 
                      alt={managerNationality} 
                      className="w-4 h-3 rounded-[2px] object-cover" 
                    />
                  )}
                  <span>{NATIONS_MAP[managerNationality]?.name ?? 'England'} ({managerNationality})</span>
                </div>
                <span className="text-[10px] text-muted-foreground">▼</span>
              </button>

              {isNationOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1 space-y-1 glass">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={nationQuery}
                    onChange={e => setNationQuery(e.target.value)}
                    className="w-full h-8 px-2 bg-muted/50 rounded-sm text-xs outline-none border-b border-border mb-1"
                    autoFocus
                  />
                  {filteredNations.map(([code, info]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setManagerNationality(code);
                        setIsNationOpen(false);
                        setNationQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground text-xs text-left"
                    >
                      <img src={`https://flagcdn.com/w20/${info.code2}.png`} alt={code} className="w-4 h-3 rounded-[2px] object-cover" />
                      <span>{info.name} ({code})</span>
                    </button>
                  ))}
                  {filteredNations.length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-2">No countries found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tactical Focus</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <button 
              type="button"
              onClick={() => setManagerFocus('youth')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                managerFocus === 'youth' ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
              )}
            >
              <Award className="h-5 w-5 mb-1 text-primary" />
              <div className="font-semibold text-xs">Youth Developer</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Academy Lvl 2 & +3 youth POT boost</div>
            </button>
            <button 
              type="button"
              onClick={() => setManagerFocus('financial')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                managerFocus === 'financial' ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
              )}
            >
              <Coins className="h-5 w-5 mb-1 text-emerald-500" />
              <div className="font-semibold text-xs">Financial Guru</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">+20% Starting Budget & 5% cheaper contracts</div>
            </button>
            <button 
              type="button"
              onClick={() => setManagerFocus('tactical')}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                managerFocus === 'tactical' ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
              )}
            >
              <Globe className="h-5 w-5 mb-1 text-blue-500" />
              <div className="font-semibold text-xs">Tactician</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Permanent +2.0 match synergy rating boost</div>
            </button>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Backing (Boost)</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <button 
              type="button"
              onClick={() => setFinancialBoost('none')}
              className={cn(
                "py-2 px-3 rounded-md border text-xs font-medium transition-all",
                financialBoost === 'none' ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:border-primary/50"
              )}
            >
              Standard
            </button>
            <button 
              type="button"
              onClick={() => setFinancialBoost('local')}
              className={cn(
                "py-2 px-3 rounded-md border text-xs font-medium transition-all",
                financialBoost === 'local' ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:border-primary/50"
              )}
            >
              Local Backing (+€10M)
            </button>
            <button 
              type="button"
              onClick={() => setFinancialBoost('takeover')}
              className={cn(
                "py-2 px-3 rounded-md border text-xs font-medium transition-all",
                financialBoost === 'takeover' ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:border-primary/50"
              )}
            >
              Takeover (+€50M)
            </button>
          </div>
        </div>
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
