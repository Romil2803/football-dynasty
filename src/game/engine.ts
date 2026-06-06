import { Club, FinanceEvent, GameState, LeagueRow, Match, MatchEvent, Player, PlayerPersonality, Position, PositionGroup } from './types';
import { BADGES, CLUB_PRESETS_D1, CLUB_PRESETS_D2, COLORS, FIRST_NAMES, FORMATIONS, LAST_NAMES, NATIONS } from './data';

const uid = () => Math.random().toString(36).slice(2, 11);
const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const positionGroup = (p: Position): PositionGroup => {
  if (p === 'GK') return 'GK';
  if (['CB','LB','RB'].includes(p)) return 'DEF';
  if (['CDM','CM','CAM','LM','RM'].includes(p)) return 'MID';
  return 'ATT';
};

const positionsForGroup: Record<PositionGroup, Position[]> = {
  GK: ['GK'],
  DEF: ['CB','CB','LB','RB','CB'],
  MID: ['CDM','CM','CM','CAM','LM','RM'],
  ATT: ['ST','ST','LW','RW'],
};

function statsForPosition(pos: Position, overall: number): Player['stats'] {
  const base = overall;
  const v = (offset: number) => Math.max(30, Math.min(99, base + offset + rng(-5, 5)));
  switch (positionGroup(pos)) {
    case 'GK':  return { pace: v(-15), shooting: v(-25), passing: v(-8), dribbling: v(-15), defending: v(0), physical: v(0) };
    case 'DEF': return { pace: v(-3), shooting: v(-15), passing: v(-5), dribbling: v(-8), defending: v(5), physical: v(3) };
    case 'MID': return { pace: v(0), shooting: v(-3), passing: v(5), dribbling: v(2), defending: v(-3), physical: v(0) };
    case 'ATT': return { pace: v(3), shooting: v(6), passing: v(0), dribbling: v(4), defending: v(-15), physical: v(-2) };
  }
}

export function generatePersonality(age: number, overall: number): PlayerPersonality {
  const loyalty = rng(10, 99);
  const ambition = rng(10, 99);
  const professionalism = rng(10, 99);
  const leadership = age > 25 ? rng(40, 99) : rng(10, 60);
  const temperament = rng(10, 99);
  const ego = rng(10, 99);
  const consistency = rng(10, 99);
  const bigMatch = rng(10, 99);

  let archetype = 'Balanced';
  
  if (age <= 21 && overall >= 75) archetype = 'Wonderkid';
  else if (loyalty > 85 && professionalism > 80) archetype = 'Model Professional';
  else if (leadership > 85 && age >= 26) archetype = 'Team Leader';
  else if (loyalty > 80 && age >= 28) archetype = 'Loyal Servant';
  else if (ambition > 85 && loyalty < 40) archetype = 'Mercenary';
  else if (ego > 85 && overall > 80) archetype = 'Superstar';
  else if (temperament < 30 && ego > 70) archetype = 'Troublemaker';
  else if (professionalism > 80 && ego < 40) archetype = 'Silent Worker';
  else if (consistency > 85) archetype = 'Consistent Performer';

  return { loyalty, ambition, professionalism, leadership, temperament, ego, consistency, bigMatch, archetype };
}

export function generatePlayer(clubId: string, opts: { position?: Position; minOvr?: number; maxOvr?: number; age?: number } = {}): Player {
  const position = opts.position ?? pick<Position>(['GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST']);
  const age = opts.age ?? rng(17, 34);
  const overall = rng(opts.minOvr ?? 55, opts.maxOvr ?? 82);
  const potential = Math.min(99, overall + rng(0, age < 23 ? 12 : age < 28 ? 6 : 2));
  const value = Math.floor((overall ** 3) / 18) * 1000 * (age < 25 ? 1.4 : age > 30 ? 0.5 : 1);
  const wage = Math.floor(value / 200);
  return {
    id: uid(),
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    age,
    nationality: pick(NATIONS),
    position,
    overall,
    potential,
    value,
    wage,
    contractYears: rng(1, 5),
    stats: statsForPosition(position, overall),
    personality: generatePersonality(age, overall),
    morale: rng(60, 90),
    fitness: 100,
    injured: 0,
    clubId,
    goals: 0, assists: 0, appearances: 0, cleanSheets: 0, yellow: 0, red: 0,
  };
}

function generateSquad(clubId: string, strength: number): Player[] {
  // strength 50-85 baseline OVR
  const players: Player[] = [];
  const layout: { pos: Position; count: number }[] = [
    { pos: 'GK', count: 3 },
    { pos: 'CB', count: 5 }, { pos: 'LB', count: 2 }, { pos: 'RB', count: 2 },
    { pos: 'CDM', count: 2 }, { pos: 'CM', count: 4 }, { pos: 'CAM', count: 2 },
    { pos: 'LM', count: 1 }, { pos: 'RM', count: 1 },
    { pos: 'LW', count: 2 }, { pos: 'RW', count: 2 }, { pos: 'ST', count: 3 },
  ];
  for (const { pos, count } of layout) {
    for (let i = 0; i < count; i++) {
      players.push(generatePlayer(clubId, { position: pos, minOvr: strength - 8, maxOvr: strength + 8 }));
    }
  }
  return players;
}

export function selectStartingXI(club: Club, players: Player[]): { startingXI: string[]; bench: string[] } {
  const layout = FORMATIONS[club.formation] ?? FORMATIONS['4-3-3'];
  const groups: Record<PositionGroup, Player[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of players) if (p.clubId === club.id && p.injured === 0) groups[positionGroup(p.position)].push(p);
  for (const g of Object.values(groups)) g.sort((a, b) => b.overall - a.overall);
  const xi: Player[] = [
    ...groups.GK.slice(0, layout.GK),
    ...groups.DEF.slice(0, layout.DEF),
    ...groups.MID.slice(0, layout.MID),
    ...groups.ATT.slice(0, layout.ATT),
  ];
  const xiIds = new Set(xi.map(p => p.id));
  const bench = players.filter(p => p.clubId === club.id && !xiIds.has(p.id) && p.injured === 0)
    .sort((a, b) => b.overall - a.overall).slice(0, 7);
  return { startingXI: xi.map(p => p.id), bench: bench.map(p => p.id) };
}

export function teamRating(club: Club, players: Record<string, Player>, opponent?: Club, managerFocus?: string): number {
  const xi = club.startingXI.map(id => players[id]).filter(Boolean);
  if (!xi.length) return 60;
  
  let totalOvr = 0;
  for (const p of xi) {
    let ovr = p.overall;
    if (p.personality) {
      const variance = (100 - p.personality.consistency) / 10;
      ovr += rng(-Math.floor(variance), Math.floor(variance / 2));
      
      if (opponent && opponent.reputation > club.reputation) {
        if (p.personality.bigMatch > 75) ovr += 2;
        else if (p.personality.bigMatch < 30) ovr -= 2;
      }
    }
    totalOvr += ovr;
  }
  const avg = totalOvr / xi.length;
  const moraleBoost = xi.reduce((s, p) => s + p.morale, 0) / xi.length / 100 * 5 - 2.5;
  
  let synergyBoost = 0;
  for (const p of xi) {
    if (p.personality) {
      if (p.personality.archetype === 'Team Leader') synergyBoost += 0.5;
      else if (p.personality.archetype === 'Model Professional') synergyBoost += 0.2;
      else if (p.personality.archetype === 'Troublemaker') synergyBoost -= 0.5;
    }
    if (p.morale < 30) synergyBoost -= 0.3;
  }
  
  if (club.id === 'my_club' && managerFocus === 'tactical') {
    synergyBoost += 2.0;
  }

  synergyBoost = Math.max(-3, Math.min(3, synergyBoost));

  return avg + moraleBoost + synergyBoost;
}

// ---- Match Engine ----
function pickAssister(xi: Player[], scorer: Player): Player | null {
  const teammates = xi.filter(p => p.id !== scorer.id);
  const weighted: Player[] = [];
  for (const p of teammates) {
    const w = positionGroup(p.position) === 'MID' ? 6 : positionGroup(p.position) === 'ATT' ? 3 : 1;
    for (let i = 0; i < w; i++) weighted.push(p);
  }
  return weighted.length ? pick(weighted) : null;
}

// ---- Match Engine ----
export function simulateMatch(match: Match, state: GameState): Match {
  const home = state.clubs[match.homeId];
  const away = state.clubs[match.awayId];
  const homeXI = home.startingXI.map(id => state.players[id]).filter(Boolean);
  const awayXI = away.startingXI.map(id => state.players[id]).filter(Boolean);
  const homeR = teamRating(home, state.players, away, state.managerFocus) + 3; // home advantage
  const awayR = teamRating(away, state.players, home, state.managerFocus);

  const events: MatchEvent[] = [{ minute: 0, type: 'kickoff', text: `Kick-off at ${home.stadium}` }];
  const homeScorers: { playerId: string; minute: number }[] = [];
  const awayScorers: { playerId: string; minute: number }[] = [];
  let homeGoals = 0, awayGoals = 0;

  const expHome = Math.max(0.3, (homeR - awayR + 20) / 20);
  const expAway = Math.max(0.3, (awayR - homeR + 20) / 20);

  for (let m = 1; m <= 90; m++) {
    if (m === 45) events.push({ minute: 45, type: 'halftime', text: 'Half-time' });
    // Goal chance
    if (Math.random() < expHome / 90 / 1.6) {
      const scorer = pickScorer(homeXI);
      if (scorer) {
        homeGoals++;
        homeScorers.push({ playerId: scorer.id, minute: m });
        let assistId: string | undefined = undefined;
        let eventText = `⚽ GOAL! ${scorer.firstName} ${scorer.lastName} scores for ${home.shortName}`;
        if (Math.random() < 0.7) {
          const assister = pickAssister(homeXI, scorer);
          if (assister) {
            assistId = assister.id;
            eventText += ` (assisted by ${assister.lastName})`;
          }
        }
        events.push({ minute: m, type: 'goal', clubId: home.id, playerId: scorer.id, assistId, text: eventText });
      }
    }
    if (Math.random() < expAway / 90 / 1.6) {
      const scorer = pickScorer(awayXI);
      if (scorer) {
        awayGoals++;
        awayScorers.push({ playerId: scorer.id, minute: m });
        let assistId: string | undefined = undefined;
        let eventText = `⚽ GOAL! ${scorer.firstName} ${scorer.lastName} scores for ${away.shortName}`;
        if (Math.random() < 0.7) {
          const assister = pickAssister(awayXI, scorer);
          if (assister) {
            assistId = assister.id;
            eventText += ` (assisted by ${assister.lastName})`;
          }
        }
        events.push({ minute: m, type: 'goal', clubId: away.id, playerId: scorer.id, assistId, text: eventText });
      }
    }
    // Cards
    if (Math.random() < 0.005) {
      const pl = pick([...homeXI, ...awayXI]);
      if (pl) { pl.yellow++; events.push({ minute: m, type: 'yellow', playerId: pl.id, text: `🟨 Yellow card — ${pl.lastName}` }); }
    }
    if (Math.random() < 0.0008) {
      const pl = pick([...homeXI, ...awayXI]);
      if (pl) { pl.red++; events.push({ minute: m, type: 'red', playerId: pl.id, text: `🟥 Red card — ${pl.lastName}` }); }
    }
    // Injuries
    if (Math.random() < 0.001) {
      const pl = pick([...homeXI, ...awayXI]);
      if (pl) {
        const weeks = rng(1, 4);
        pl.injured = weeks;
        events.push({ minute: m, type: 'injury', playerId: pl.id, injuryWeeks: weeks, text: `🚑 Injury — ${pl.lastName} (${weeks}w)` });
      }
    }
  }
  events.push({ minute: 90, type: 'fulltime', text: `Full-time: ${home.shortName} ${homeGoals}-${awayGoals} ${away.shortName}` });

  // Update stats
  for (const p of homeXI) p.appearances++;
  for (const p of awayXI) p.appearances++;
  for (const s of homeScorers) state.players[s.playerId].goals++;
  for (const s of awayScorers) state.players[s.playerId].goals++;
  
  // Increment assists
  for (const e of events) {
    if (e.type === 'goal' && e.assistId && state.players[e.assistId]) {
      state.players[e.assistId].assists++;
    }
  }

  if (awayGoals === 0) for (const p of homeXI) if (positionGroup(p.position) === 'GK' || positionGroup(p.position) === 'DEF') p.cleanSheets++;
  if (homeGoals === 0) for (const p of awayXI) if (positionGroup(p.position) === 'GK' || positionGroup(p.position) === 'DEF') p.cleanSheets++;

  return { ...match, homeGoals, awayGoals, played: true, events, homeScorers, awayScorers };
}

function pickScorer(xi: Player[]): Player | null {
  const weighted: Player[] = [];
  for (const p of xi) {
    const w = positionGroup(p.position) === 'ATT' ? 6 : positionGroup(p.position) === 'MID' ? 3 : 1;
    for (let i = 0; i < w; i++) weighted.push(p);
  }
  return weighted.length ? pick(weighted) : null;
}

// ---- Fixtures ----
export function generateFixtures(clubIds: string[]): Match[] {
  const n = clubIds.length;
  if (n % 2 !== 0) throw new Error('Need even number of clubs');
  const ids = [...clubIds];
  const rounds: Match[] = [];
  const half = n / 2;
  let rotation = [...ids];
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < half; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];
      rounds.push({ id: uid(), week: round + 1, homeId: round % 2 === 0 ? home : away, awayId: round % 2 === 0 ? away : home, homeGoals: null, awayGoals: null, played: false });
    }
    rotation = [rotation[0], ...rotation.slice(-1), ...rotation.slice(1, -1)];
  }
  // Second half (reverse fixtures)
  const second = rounds.map(m => ({ ...m, id: uid(), week: m.week + (n - 1), homeId: m.awayId, awayId: m.homeId }));
  return [...rounds, ...second];
}

// ---- Standings ----
export function computeStandings(state: GameState): Record<number, LeagueRow[]> {
  const out: Record<number, LeagueRow[]> = {};
  const divisions = new Set(Object.values(state.clubs).map(c => c.division));
  for (const div of divisions) {
    const clubs = Object.values(state.clubs).filter(c => c.division === div);
    const rows: Record<string, LeagueRow> = {};
    for (const c of clubs) rows[c.id] = { clubId: c.id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
    for (const m of state.fixtures) {
      if (!m.played) continue;
      const h = state.clubs[m.homeId]; const a = state.clubs[m.awayId];
      if (!h || !a || h.division !== div) continue;
      const hr = rows[m.homeId]; const ar = rows[m.awayId];
      hr.played++; ar.played++;
      hr.gf += m.homeGoals!; hr.ga += m.awayGoals!;
      ar.gf += m.awayGoals!; ar.ga += m.homeGoals!;
      if (m.homeGoals! > m.awayGoals!) { hr.wins++; ar.losses++; hr.points += 3; }
      else if (m.homeGoals! < m.awayGoals!) { ar.wins++; hr.losses++; ar.points += 3; }
      else { hr.draws++; ar.draws++; hr.points++; ar.points++; }
    }
    out[div] = Object.values(rows).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  }
  return out;
}

// ---- World creation ----
export function createWorld(myClub: Club, myPlayers: Player[]): { clubs: Record<string, Club>; players: Record<string, Player>; fixtures: Match[] } {
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};

  // Add user club
  clubs[myClub.id] = myClub;
  for (const p of myPlayers) players[p.id] = p;

  // Division 1: pick presets (excluding any same-name)
  const d1Count = myClub.division === 1 ? 19 : 20;
  const d1Presets = CLUB_PRESETS_D1.filter(p => p.name !== myClub.name).slice(0, d1Count);
  for (let i = 0; i < d1Presets.length; i++) {
    const preset = d1Presets[i];
    const id = `c_d1_${i}`;
    const strength = 70 + Math.floor(Math.random() * 12) - Math.floor(i / 5);
    const c: Club = makeClub(id, preset.name, preset.short, preset.badge, 1, strength);
    clubs[id] = c;
    const squad = generateSquad(id, strength);
    for (const p of squad) players[p.id] = p;
    c.playerIds = squad.map(p => p.id);
    const sel = selectStartingXI(c, squad);
    c.startingXI = sel.startingXI; c.bench = sel.bench;
  }
  myClub.playerIds = myPlayers.map(p => p.id);
  const mySel = selectStartingXI(myClub, myPlayers);
  myClub.startingXI = mySel.startingXI; myClub.bench = mySel.bench;

  // Division 2: pick presets (excluding any same-name)
  const d2Count = myClub.division === 2 ? 19 : 20;
  const d2Presets = CLUB_PRESETS_D2.filter(p => p.name !== myClub.name).slice(0, d2Count);
  for (let i = 0; i < d2Presets.length; i++) {
    const preset = d2Presets[i];
    const id = `c_d2_${i}`;
    const strength = 58 + Math.floor(Math.random() * 8);
    const c: Club = makeClub(id, preset.name, preset.short, preset.badge, 2, strength);
    clubs[id] = c;
    const squad = generateSquad(id, strength);
    for (const p of squad) players[p.id] = p;
    c.playerIds = squad.map(p => p.id);
    const sel = selectStartingXI(c, squad);
    c.startingXI = sel.startingXI; c.bench = sel.bench;
  }

  const d1Ids = Object.values(clubs).filter(c => c.division === 1).map(c => c.id);
  const d2Ids = Object.values(clubs).filter(c => c.division === 2).map(c => c.id);
  const fixturesD1 = generateFixtures(d1Ids);
  const fixturesD2 = generateFixtures(d2Ids);
  const fixtures = [...fixturesD1, ...fixturesD2];
  return { clubs, players, fixtures };
}

function makeClub(id: string, name: string, short: string, badge: string, division: number, strength: number): Club {
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const budget = (division === 1 ? 50_000_000 : 8_000_000) + strength * 500_000;
  return {
    id, name, shortName: short, primaryColor: col.primary, secondaryColor: col.secondary,
    badge, stadium: `${name.split(' ')[0]} Arena`, reputation: division === 1 ? Math.min(5, Math.max(1, Math.round(strength/16))) : 2,
    budget, wageBudget: budget / 8, division,
    playerIds: [], formation: '4-3-3', startingXI: [], bench: [], academyLevel: 1, youthIds: [],
  };
}

export function createMyClub(opts: {
  name: string;
  short: string;
  primaryColor: string;
  secondaryColor: string;
  badge: string;
  stadium: string;
  useExisting?: boolean;
  division: number;
  financialBoost?: 'none' | 'local' | 'takeover';
  managerFocus?: 'youth' | 'financial' | 'tactical';
}): { club: Club; players: Player[] } {
  const id = 'my_club';
  
  let baseBudget = opts.division === 1 ? 60_000_000 : 12_000_000;
  if (opts.financialBoost === 'local') baseBudget += 10_000_000;
  else if (opts.financialBoost === 'takeover') baseBudget += 50_000_000;
  
  if (opts.managerFocus === 'financial') {
    baseBudget = Math.floor(baseBudget * 1.2);
  }

  const academyLevel = opts.managerFocus === 'youth' ? 2 : 1;

  const club: Club = {
    id, name: opts.name, shortName: opts.short || opts.name.slice(0,3).toUpperCase(),
    primaryColor: opts.primaryColor, secondaryColor: opts.secondaryColor, badge: opts.badge,
    stadium: opts.stadium || `${opts.name} Stadium`,
    reputation: opts.division === 1 ? 3 : 2,
    budget: baseBudget,
    wageBudget: baseBudget / 8,
    division: opts.division,
    playerIds: [], formation: '4-3-3', startingXI: [], bench: [], academyLevel, youthIds: [],
  };
  const strength = opts.division === 1 ? 72 : 64;
  const players = generateSquad(id, strength);

  // Generate initial youth players
  const youthCount = rng(2, 3);
  let youthStrength = (opts.division === 1 ? 55 : 48) + academyLevel * 3;
  if (opts.managerFocus === 'youth') youthStrength += 3;
  
  for (let i = 0; i < youthCount; i++) {
    const p = generatePlayer(id, { minOvr: youthStrength - 10, maxOvr: youthStrength, age: rng(15, 17) });
    if (opts.managerFocus === 'youth') {
      p.potential = Math.min(99, p.potential + 3);
    }
    players.push(p);
    club.youthIds.push(p.id);
  }

  return { club, players };
}

// ---- Season progression ----
export function applyMatchResult(state: GameState, match: Match): void {
  const home = state.clubs[match.homeId];
  const away = state.clubs[match.awayId];
  if (!home || !away) return;

  const homeXI = home.startingXI.map(id => state.players[id]).filter(Boolean);
  const awayXI = away.startingXI.map(id => state.players[id]).filter(Boolean);

  // Update appearances
  for (const p of homeXI) p.appearances++;
  for (const p of awayXI) p.appearances++;

  // Update goals & assists & cards & injuries from events
  if (match.events) {
    for (const e of match.events) {
      if (e.type === 'goal') {
        if (e.playerId && state.players[e.playerId]) {
          state.players[e.playerId].goals++;
        }
        if (e.assistId && state.players[e.assistId]) {
          state.players[e.assistId].assists++;
        }
      } else if (e.type === 'yellow') {
        if (e.playerId && state.players[e.playerId]) {
          state.players[e.playerId].yellow++;
        }
      } else if (e.type === 'red') {
        if (e.playerId && state.players[e.playerId]) {
          state.players[e.playerId].red++;
        }
      } else if (e.type === 'injury') {
        if (e.playerId && state.players[e.playerId]) {
          state.players[e.playerId].injured = e.injuryWeeks ?? 1;
        }
      }
    }
  }

  // Update clean sheets
  if (match.awayGoals === 0) {
    for (const p of homeXI) {
      if (positionGroup(p.position) === 'GK' || positionGroup(p.position) === 'DEF') {
        p.cleanSheets++;
      }
    }
  }
  if (match.homeGoals === 0) {
    for (const p of awayXI) {
      if (positionGroup(p.position) === 'GK' || positionGroup(p.position) === 'DEF') {
        p.cleanSheets++;
      }
    }
  }
}

export function advanceWeek(state: GameState, userMatchResult?: Match): GameState {
  const week = state.week;
  const weekFixtures = state.fixtures.filter(f => f.week === week && !f.played);
  for (const m of weekFixtures) {
    if (userMatchResult && m.id === userMatchResult.id) {
      applyMatchResult(state, userMatchResult);
      Object.assign(m, userMatchResult);
    } else {
      const sim = simulateMatch(m, state);
      Object.assign(m, sim);
    }
  }
  // Morale & Playing Time updates
  for (const club of Object.values(state.clubs)) {
    const xiIds = new Set(club.startingXI);
    const benchIds = new Set(club.bench);
    
    // Find if club played
    const match = weekFixtures.find(m => m.homeId === club.id || m.awayId === club.id);
    let matchResult = 0; // 0=draw/none, 1=win, -1=loss
    if (match && match.played) {
      if (match.homeId === club.id) {
        matchResult = match.homeGoals! > match.awayGoals! ? 1 : match.homeGoals! < match.awayGoals! ? -1 : 0;
      } else {
        matchResult = match.awayGoals! > match.homeGoals! ? 1 : match.awayGoals! < match.homeGoals! ? -1 : 0;
      }
    }

    // Dressing room influence
    const leaderCount = club.playerIds.filter(id => state.players[id]?.personality?.leadership > 75).length;
    const toxicCount = club.playerIds.filter(id => state.players[id]?.personality?.temperament < 40).length;

    for (const pId of club.playerIds) {
      const p = state.players[pId];
      if (!p || !p.personality) continue;
      
      let shift = 0;
      
      // Playing time expectation
      if (xiIds.has(p.id)) {
        shift += 1;
      } else if (benchIds.has(p.id)) {
        if (p.personality.ego > 75 || p.overall > 80) shift -= 1;
      } else {
        // Reserves
        if (p.personality.archetype === 'Model Professional' || p.personality.archetype === 'Loyal Servant') shift -= 1;
        else if (p.personality.archetype === 'Troublemaker' || p.personality.ego > 80) shift -= 4;
        else if (p.overall > 75) shift -= 3;
        else shift -= 2;
      }
      
      // Match result reaction
      if (matchResult === 1) {
        shift += 2 + Math.min(2, leaderCount * 0.5);
      } else if (matchResult === -1) {
        let penalty = 2;
        if (p.personality.archetype === 'Consistent Performer' || p.personality.archetype === 'Model Professional') penalty = 1;
        else if (p.personality.archetype === 'Troublemaker' || p.personality.temperament < 40) penalty = 4;
        
        penalty = Math.max(1, penalty - leaderCount * 0.5 + toxicCount * 0.5);
        shift -= penalty;
      }
      
      // Transfer Demands
      if (p.personality.ambition > 75 && p.personality.loyalty < 40 && p.overall > 75) {
        if (club.division === 2 || club.reputation <= 3) {
           shift -= 2; // Unsettled
        }
      }

      p.morale = Math.max(0, Math.min(100, p.morale + shift));

      // Force transfer list if extremely unhappy
      if (p.morale < 15) {
        if (!state.transferList.find(l => l.playerId === p.id)) {
          const price = Math.floor(p.value * 0.7); // 30% discount if forcing move
          listPlayer(state, p.id, price);
        }
      }
    }
  }

  // Wages each week
  const finances: FinanceEvent[] = [...state.finances];
  const myClub = state.clubs[state.myClubId];
  const wageTotal = myClub.playerIds.reduce((s, id) => s + (state.players[id]?.wage ?? 0), 0);
  myClub.budget -= wageTotal;
  finances.push({ week, type: 'wages', amount: -wageTotal });
  // Match revenue (if our club played)
  const myMatch = weekFixtures.find(m => m.homeId === myClub.id || m.awayId === myClub.id);
  if (myMatch) {
    const isHome = myMatch.homeId === myClub.id;
    const revenue = isHome ? rng(800_000, 2_500_000) : rng(100_000, 400_000);
    myClub.budget += revenue;
    finances.push({ week, type: 'matchRevenue', amount: revenue, note: isHome ? 'Home gate' : 'Away share' });
  }
  // Fitness recovery & injury tick
  for (const p of Object.values(state.players)) {
    if (p.injured > 0) p.injured = Math.max(0, p.injured - 1);
    p.fitness = Math.min(100, p.fitness + 10);
  }

  // AI purchases user players
  const userListed = state.transferList.filter(l => l.listedBy === state.myClubId);
  for (const listing of userListed) {
    // 15% chance per week that an interested AI club buys the listed player
    if (Math.random() < 0.15) {
      const player = state.players[listing.playerId];
      if (player) {
        const buyerClubs = Object.values(state.clubs).filter(c => 
          c.id !== state.myClubId && 
          c.budget >= listing.askingPrice &&
          c.reputation >= (player.overall >= 75 ? 3 : 2)
        );
        if (buyerClubs.length > 0) {
          const buyer = pick(buyerClubs);
          const seller = state.clubs[state.myClubId];
          
          buyer.budget -= listing.askingPrice;
          seller.budget += listing.askingPrice;
          seller.playerIds = seller.playerIds.filter(id => id !== player.id);
          buyer.playerIds.push(player.id);
          player.clubId = buyer.id;
          
          seller.startingXI = seller.startingXI.filter(id => id !== player.id);
          seller.bench = seller.bench.filter(id => id !== player.id);
          
          // Recalculate starting XI and bench for AI buyer
          const buyerSquad = buyer.playerIds.map(id => state.players[id]).filter(Boolean);
          const buyerSel = selectStartingXI(buyer, buyerSquad);
          buyer.startingXI = buyerSel.startingXI;
          buyer.bench = buyerSel.bench;
          
          finances.push({
            week,
            type: 'transferOut',
            amount: listing.askingPrice,
            note: `Sold ${player.firstName} ${player.lastName} to ${buyer.name}`
          });
          
          state.transferList = state.transferList.filter(l => l.playerId !== player.id);
          break;
        }
      }
    }
  }

  // Standings
  const standings = computeStandings({ ...state, finances });

  // Board Confidence (for user club only)
  let newBoardConf = state.boardConfidence ?? 50;
  let isSacked = state.isSacked ?? false;
  
  if (!isSacked) {
    const myDivisionStandings = standings[myClub.division] ?? [];
    const myRank = myDivisionStandings.findIndex(r => r.clubId === myClub.id) + 1;
    
    // Calculate expected position
    const rep = myClub.reputation;
    let expectedPos = 17;
    if (rep >= 5) expectedPos = 3;
    else if (rep === 4) expectedPos = 6;
    else if (rep === 3) expectedPos = 12;

    // Shift based on position vs expected
    if (myRank <= expectedPos) {
      newBoardConf += 1;
    } else {
      const diff = myRank - expectedPos;
      newBoardConf -= (diff * 0.3); // Punish based on how far below we are
    }

    // Shift based on match result (if played)
    if (myMatch && myMatch.played) {
      const isHome = myMatch.homeId === myClub.id;
      const gf = isHome ? myMatch.homeGoals! : myMatch.awayGoals!;
      const ga = isHome ? myMatch.awayGoals! : myMatch.homeGoals!;
      if (gf > ga) newBoardConf += 2;
      else if (gf < ga) newBoardConf -= 3;
      else newBoardConf -= 0.5;
    }

    // Apply toxic squad penalty if morale is very low
    const myPlayers = myClub.playerIds.map(id => state.players[id]).filter(Boolean);
    const avgMorale = myPlayers.reduce((s, p) => s + p.morale, 0) / (myPlayers.length || 1);
    if (avgMorale < 40) newBoardConf -= 2;

    newBoardConf = Math.max(0, Math.min(100, newBoardConf));

    // Check for sacking (only after 5 weeks so we don't sack instantly on bad start)
    if (newBoardConf < 15 && week > 5) {
      isSacked = true;
    }
  }

  const newWeek = week + 1;
  return { ...state, week: newWeek, standings, finances, boardConfidence: newBoardConf, isSacked, updatedAt: new Date().toISOString() };
}

export function endSeason(state: GameState): GameState {
  const standings = computeStandings(state);
  const d1 = standings[1] ?? [];
  const champion = d1[0] ? state.clubs[d1[0].clubId].name : '—';
  // Top scorer
  const topPlayer = Object.values(state.players).sort((a, b) => b.goals - a.goals)[0];
  let myRow = d1.find(r => r.clubId === state.myClubId);
  let myPos = myRow ? d1.indexOf(myRow) + 1 : 0;
  let inD1 = true;
  if (!myRow) {
    const d2 = standings[2] ?? [];
    myRow = d2.find(r => r.clubId === state.myClubId);
    myPos = myRow ? d2.indexOf(myRow) + 1 : 0;
    inD1 = false;
  }

  // Manager Reputation Change
  let repChange = 0;
  if (myPos > 0 && !state.isSacked) {
    const rep = state.clubs[state.myClubId].reputation;
    let expectedPos = 17;
    if (rep >= 5) expectedPos = 3;
    else if (rep === 4) expectedPos = 6;
    else if (rep === 3) expectedPos = 12;
    
    if (myPos === 1) repChange += 5;
    if (myPos <= expectedPos) repChange += 2;
    else {
      const diff = myPos - expectedPos;
      repChange -= Math.min(10, Math.floor(diff / 2));
    }
  }
  const managerReputation = Math.max(1, Math.min(100, (state.managerReputation ?? 50) + repChange));
  const boardConfidence = state.isSacked ? 50 : 60;

  // Prize money
  if (myRow) {
    const prize = Math.max(2_000_000, (21 - myPos) * (inD1 ? 1_500_000 : 500_000));
    state.clubs[state.myClubId].budget += prize;
    state.finances.push({ week: state.week, type: 'prizeMoney', amount: prize, note: `Position ${myPos}` });
  }
  // Age players, reset stats, refresh contracts, handle retirements
  const retiringIds = new Set<string>();
  for (const p of Object.values(state.players)) {
    p.age++;
    p.goals = 0; p.assists = 0; p.appearances = 0; p.cleanSheets = 0; p.yellow = 0; p.red = 0;
    let growthRate = 1;
    let declineRate = 1;
    if (p.personality) {
      if (p.personality.professionalism > 80) { growthRate += 0.5; declineRate -= 0.5; }
      else if (p.personality.professionalism < 30) { growthRate -= 0.5; declineRate += 0.5; }
      
      if (p.personality.ambition > 80) growthRate += 0.3;
      else if (p.personality.ambition < 30) growthRate -= 0.3;
    }

    if (p.age < 25 && p.overall < p.potential) {
      const growth = rng(0, 2);
      if (growth > 0 && Math.random() < growthRate) p.overall = Math.min(p.potential, p.overall + growth);
    }
    if (p.age > 30) {
      const decline = rng(0, 2);
      if (decline > 0 && Math.random() < declineRate) p.overall = Math.max(50, p.overall - decline);
    }
    p.value = Math.floor((p.overall ** 3) / 18) * 1000 * (p.age < 25 ? 1.4 : p.age > 30 ? 0.5 : 1);
    p.contractYears = Math.max(0, p.contractYears - 1);
    
    if (p.age > 34 && Math.random() < 0.3) retiringIds.add(p.id);
    else if (p.age > 38) retiringIds.add(p.id);
  }

  // Remove retiring players
  for (const id of retiringIds) {
    const clubId = state.players[id].clubId;
    if (state.clubs[clubId]) {
      const c = state.clubs[clubId];
      c.playerIds = c.playerIds.filter(pid => pid !== id);
      c.startingXI = c.startingXI.filter(pid => pid !== id);
      c.bench = c.bench.filter(pid => pid !== id);
    }
    delete state.players[id];
    state.transferList = state.transferList.filter(l => l.playerId !== id);
  }

  // Generate Youth Players
  for (const c of Object.values(state.clubs)) {
    const count = rng(2, 3);
    const strength = (c.division === 1 ? 55 : 48) + (c.academyLevel || 1) * 3;
    
    for (let i = 0; i < count; i++) {
      const p = generatePlayer(c.id, { minOvr: strength - 10, maxOvr: strength, age: rng(15, 17) });
      state.players[p.id] = p;
      if (c.id === state.myClubId) {
        if (!c.youthIds) c.youthIds = [];
        c.youthIds.push(p.id);
      } else {
        c.playerIds.push(p.id);
      }
    }
    
    // Recalculate AI squad to account for retirements and new youths
    if (c.id !== state.myClubId) {
       const squad = c.playerIds.map(id => state.players[id]).filter(Boolean);
       const sel = selectStartingXI(c, squad);
       c.startingXI = sel.startingXI;
       c.bench = sel.bench;
    }
  }
  // History
  state.history.push({
    season: state.season, division: state.clubs[state.myClubId].division,
    position: myPos, champion, topScorer: topPlayer ? `${topPlayer.firstName} ${topPlayer.lastName} (${topPlayer.goals})` : '—',
  });

  // Reset fixtures for next season
  const d1Ids = Object.values(state.clubs).filter(c => c.division === 1).map(c => c.id);
  const d2Ids = Object.values(state.clubs).filter(c => c.division === 2).map(c => c.id);
  const newFixturesD1 = generateFixtures(d1Ids);
  const newFixturesD2 = generateFixtures(d2Ids);
  const newFixtures = [...newFixturesD1, ...newFixturesD2];

  return { ...state, season: state.season + 1, week: 1, fixtures: newFixtures, standings: computeStandings({ ...state, fixtures: newFixtures }), managerReputation, boardConfidence };
}

// ---- Transfers ----
export function buyPlayer(state: GameState, playerId: string): { ok: boolean; reason?: string } {
  const listing = state.transferList.find(l => l.playerId === playerId);
  if (!listing) return { ok: false, reason: 'Not listed' };
  const player = state.players[playerId];
  const buyer = state.clubs[state.myClubId];
  if (buyer.budget < listing.askingPrice) return { ok: false, reason: 'Insufficient funds' };
  const seller = state.clubs[listing.listedBy];
  buyer.budget -= listing.askingPrice;
  seller.budget += listing.askingPrice;
  seller.playerIds = seller.playerIds.filter(id => id !== playerId);
  buyer.playerIds.push(playerId);
  player.clubId = buyer.id;

  // Remove player from seller (AI) starting XI and bench
  seller.startingXI = seller.startingXI.filter(id => id !== playerId);
  seller.bench = seller.bench.filter(id => id !== playerId);

  // Recalculate starting XI and bench for AI seller
  const sellerSquad = seller.playerIds.map(id => state.players[id]).filter(Boolean);
  const sellerSel = selectStartingXI(seller, sellerSquad);
  seller.startingXI = sellerSel.startingXI;
  seller.bench = sellerSel.bench;

  state.transferList = state.transferList.filter(l => l.playerId !== playerId);
  state.finances.push({ week: state.week, type: 'transferIn', amount: -listing.askingPrice, note: `Bought ${player.firstName} ${player.lastName}` });
  return { ok: true };
}

export function listPlayer(state: GameState, playerId: string, price: number) {
  const player = state.players[playerId];
  if (!player) return;
  state.transferList = state.transferList.filter(l => l.playerId !== playerId);
  state.transferList.push({ playerId, askingPrice: price, listedBy: player.clubId });
}

export function generateTransferMarket(state: GameState) {
  // AI clubs list some players
  state.transferList = state.transferList.filter(l => state.clubs[l.listedBy] && state.clubs[l.listedBy].playerIds.includes(l.playerId));
  for (const club of Object.values(state.clubs)) {
    if (club.id === state.myClubId) continue;
    if (club.playerIds.length < 16) continue;
    const candidates = club.playerIds.map(id => state.players[id]).filter(Boolean)
      .sort((a, b) => a.overall - b.overall).slice(0, 4);
    for (const p of candidates) {
      if (Math.random() < 0.4 && !state.transferList.find(l => l.playerId === p.id)) {
        const price = Math.floor(p.value * (1 + Math.random() * 0.5));
        state.transferList.push({ playerId: p.id, askingPrice: price, listedBy: club.id });
      }
    }
  }
}

// ---- Top scorers / golden boot ----
export function topScorers(state: GameState, limit = 10): Player[] {
  return Object.values(state.players).sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, limit);
}

// ---- Player swapping helper ----
export function swapPlayers(state: GameState, idA: string, idB: string): void {
  const playerA = state.players[idA];
  const playerB = state.players[idB];
  if (!playerA || !playerB || playerA.clubId !== playerB.clubId) return;
  const club = state.clubs[playerA.clubId];
  if (!club) return;

  const idxA_xi = club.startingXI.indexOf(idA);
  const idxA_bench = club.bench.indexOf(idA);
  const idxB_xi = club.startingXI.indexOf(idB);
  const idxB_bench = club.bench.indexOf(idB);

  if (idxA_xi !== -1 && idxB_xi !== -1) {
    club.startingXI[idxA_xi] = idB;
    club.startingXI[idxB_xi] = idA;
  } else if (idxA_bench !== -1 && idxB_bench !== -1) {
    club.bench[idxA_bench] = idB;
    club.bench[idxB_bench] = idA;
  } else if (idxA_xi !== -1 && idxB_bench !== -1) {
    club.startingXI[idxA_xi] = idB;
    club.bench[idxB_bench] = idA;
  } else if (idxA_bench !== -1 && idxB_xi !== -1) {
    club.bench[idxA_bench] = idB;
    club.startingXI[idxB_xi] = idA;
  } else if (idxA_xi !== -1) {
    club.startingXI[idxA_xi] = idB;
  } else if (idxB_xi !== -1) {
    club.startingXI[idxB_xi] = idA;
  } else if (idxA_bench !== -1) {
    club.bench[idxA_bench] = idB;
  } else if (idxB_bench !== -1) {
    club.bench[idxB_bench] = idA;
  }
}

// ---- Contract Extensions ----
export function extendContract(state: GameState, playerId: string): { ok: boolean; error?: string; wage?: number } {
  const p = state.players[playerId];
  if (!p) return { ok: false, error: 'Player not found' };
  const club = state.clubs[p.clubId];
  if (!club) return { ok: false, error: 'Club not found' };
  
  let wageDemand = Math.floor(p.value / 100);
  if (p.personality) {
    if (p.personality.loyalty > 80) wageDemand = Math.floor(wageDemand * 0.8);
    else if (p.personality.ego > 80 || p.personality.ambition > 80) wageDemand = Math.floor(wageDemand * 1.3);
  }
  
  if (state.managerFocus === 'financial') {
    wageDemand = Math.floor(wageDemand * 0.95);
  }
  
  if (club.budget < wageDemand * 52) {
    return { ok: false, error: `Cannot afford contract of €${wageDemand.toLocaleString()}/week.` };
  }
  
  p.contractYears = 3;
  p.wage = wageDemand;
  return { ok: true, wage: wageDemand };
}
