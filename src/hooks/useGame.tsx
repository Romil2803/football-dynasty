import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { GameState, SaveSlot } from '@/game/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { computeStandings } from '@/game/engine';

interface GameCtx {
  state: GameState | null;
  setState: (s: GameState) => void;
  update: (mut: (s: GameState) => void) => void;
  slots: SaveSlot[];
  loadSlots: () => Promise<void>;
  saveToSlot: (slot: number, name: string) => Promise<void>;
  loadFromSlot: (slot: number) => Promise<void>;
  deleteSlot: (slot: number) => Promise<void>;
  newGame: (state: GameState) => void;
  autosave: () => Promise<void>;
}

const Ctx = createContext<GameCtx>(null!);
const LOCAL_KEY = 'fd_state_v1';
const LOCAL_SLOTS = 'fd_slots_v1';

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [state, setStateRaw] = useState<GameState | null>(() => {
    try { const raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback((s: GameState) => {
    setStateRaw(s);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch {}
  }, []);

  const update = useCallback((mut: (s: GameState) => void) => {
    if (!stateRef.current) return;
    const copy: GameState = JSON.parse(JSON.stringify(stateRef.current));
    mut(copy);
    copy.standings = computeStandings(copy);
    copy.updatedAt = new Date().toISOString();
    setState(copy);
  }, [setState]);

  const loadSlots = useCallback(async () => {
    if (user) {
      const { data } = await supabase.from('game_saves').select('*').order('slot');
      setSlots((data ?? []).map((r: any) => ({ id: r.id, slot: r.slot, name: r.name, clubName: r.club_name, season: r.season, updatedAt: r.updated_at, state: r.state })));
    } else {
      try { const raw = localStorage.getItem(LOCAL_SLOTS); setSlots(raw ? JSON.parse(raw) : []); } catch { setSlots([]); }
    }
  }, [user]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const saveToSlot = useCallback(async (slot: number, name: string) => {
    const s = stateRef.current; if (!s) return;
    const payload = { slot, name, club_name: s.clubs[s.myClubId]?.name ?? '—', season: s.season, state: s as any };
    if (user) {
      await supabase.from('game_saves').upsert({ user_id: user.id, ...payload } as any, { onConflict: 'user_id,slot' });
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_SLOTS) ?? '[]') as SaveSlot[];
      const filtered = existing.filter(e => e.slot !== slot);
      filtered.push({ slot, name, clubName: payload.club_name, season: s.season, updatedAt: new Date().toISOString(), state: s });
      localStorage.setItem(LOCAL_SLOTS, JSON.stringify(filtered));
    }
    await loadSlots();
  }, [user, loadSlots]);

  const loadFromSlot = useCallback(async (slot: number) => {
    if (user) {
      const { data } = await supabase.from('game_saves').select('state').eq('slot', slot).maybeSingle();
      if (data?.state) setState(data.state as unknown as GameState);
    } else {
      const arr = JSON.parse(localStorage.getItem(LOCAL_SLOTS) ?? '[]') as SaveSlot[];
      const s = arr.find(e => e.slot === slot);
      if (s) setState(s.state);
    }
  }, [user, setState]);

  const deleteSlot = useCallback(async (slot: number) => {
    if (user) { await supabase.from('game_saves').delete().eq('slot', slot); }
    else {
      const arr = JSON.parse(localStorage.getItem(LOCAL_SLOTS) ?? '[]') as SaveSlot[];
      localStorage.setItem(LOCAL_SLOTS, JSON.stringify(arr.filter(e => e.slot !== slot)));
    }
    await loadSlots();
  }, [user, loadSlots]);

  const autosave = useCallback(async () => {
    await saveToSlot(0, 'Autosave');
  }, [saveToSlot]);

  const newGame = useCallback((s: GameState) => { setState(s); }, [setState]);

  return <Ctx.Provider value={{ state, setState, update, slots, loadSlots, saveToSlot, loadFromSlot, deleteSlot, newGame, autosave }}>{children}</Ctx.Provider>;
}

export const useGame = () => useContext(Ctx);
