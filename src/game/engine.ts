import { Club, FinanceEvent, GameState, LeagueRow, Match, MatchEvent, Player, Position, PositionGroup } from './types';
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

export function teamRating(club: Club, players: Record<string, Player>): number {
  const xi = club.startingXI.map(id => players[id]).filter(Boolean);
  if (!xi.length) return 60;
  const avg = xi.reduce((s, p) => s + p.overall, 0) / xi.length;
  const moraleBoost = xi.reduce((s, p) => s + p.morale, 0) / xi.length / 100 * 5 - 2.5;
  return avg + moraleBoost;
}

// ---- Match Engine ----
export function simulateMatch(match: Match, state: GameState): Match {
  const home = state.clubs[match.homeId];
  const away = state.clubs[match.awayId];
  const homeXI = home.startingXI.map(id => state.players[id]).filter(Boolean);
  const awayXI = away.startingXI.map(id => state.players[id]).filter(Boolean);
  const homeR = teamRating(home, state.players) + 3; // home advantage
  const awayR = teamRating(away, state.players);

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
        events.push({ minute: m, type: 'goal', clubId: home.id, playerId: scorer.id, text: `⚽ GOAL! ${scorer.firstName} ${scorer.lastName} scores for ${home.shortName}` });
      }
    }
    if (Math.random() < expAway / 90 / 1.6) {
      const scorer = pickScorer(awayXI);
      if (scorer) {
        awayGoals++;
        awayScorers.push({ playerId: scorer.id, minute: m });
        events.push({ minute: m, type: 'goal', clubId: away.id, playerId: scorer.id, text: `⚽ GOAL! ${scorer.firstName} ${scorer.lastName} scores for ${away.shortName}` });
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
      if (pl) { pl.injured = rng(1, 4); events.push({ minute: m, type: 'injury', playerId: pl.id, text: `🚑 Injury — ${pl.lastName} (${pl.injured}w)` }); }
    }
  }
  events.push({ minute: 90, type: 'fulltime', text: `Full-time: ${home.shortName} ${homeGoals}-${awayGoals} ${away.shortName}` });

  // Update stats
  for (const p of homeXI) p.appearances++;
  for (const p of awayXI) p.appearances++;
  for (const s of homeScorers) state.players[s.playerId].goals++;
  for (const s of awayScorers) state.players[s.playerId].goals++;
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

  // Division 1: pick 19 presets (excluding any same-name)
  const d1Presets = CLUB_PRESETS_D1.filter(p => p.name !== myClub.name).slice(0, 19);
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

  // Division 2
  for (let i = 0; i < 20; i++) {
    const preset = CLUB_PRESETS_D2[i % CLUB_PRESETS_D2.length];
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
  const fixtures = generateFixtures(d1Ids);
  return { clubs, players, fixtures };
}

function makeClub(id: string, name: string, short: string, badge: string, division: number, strength: number): Club {
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const budget = (division === 1 ? 50_000_000 : 8_000_000) + strength * 500_000;
  return {
    id, name, shortName: short, primaryColor: col.primary, secondaryColor: col.secondary,
    badge, stadium: `${name.split(' ')[0]} Arena`, reputation: division === 1 ? Math.min(5, Math.max(1, Math.round(strength/16))) : 2,
    budget, wageBudget: budget / 8, division,
    playerIds: [], formation: '4-3-3', startingXI: [], bench: [],
  };
}

export function createMyClub(opts: { name: string; short: string; primaryColor: string; secondaryColor: string; badge: string; stadium: string; useExisting?: boolean; division: number }): { club: Club; players: Player[] } {
  const id = 'my_club';
  const club: Club = {
    id, name: opts.name, shortName: opts.short || opts.name.slice(0,3).toUpperCase(),
    primaryColor: opts.primaryColor, secondaryColor: opts.secondaryColor, badge: opts.badge,
    stadium: opts.stadium || `${opts.name} Stadium`,
    reputation: opts.division === 1 ? 3 : 2,
    budget: opts.division === 1 ? 60_000_000 : 12_000_000,
    wageBudget: opts.division === 1 ? 8_000_000 : 2_000_000,
    division: opts.division,
    playerIds: [], formation: '4-3-3', startingXI: [], bench: [],
  };
  const strength = opts.division === 1 ? 72 : 64;
  const players = generateSquad(id, strength);
  return { club, players };
}

// ---- Season progression ----
export function advanceWeek(state: GameState): GameState {
  const week = state.week;
  const weekFixtures = state.fixtures.filter(f => f.week === week && !f.played);
  for (const m of weekFixtures) {
    const sim = simulateMatch(m, state);
    Object.assign(m, sim);
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
  // Standings
  const standings = computeStandings({ ...state, finances });

  const newWeek = week + 1;
  return { ...state, week: newWeek, standings, finances, updatedAt: new Date().toISOString() };
}

export function endSeason(state: GameState): GameState {
  const standings = computeStandings(state);
  const d1 = standings[1] ?? [];
  const champion = d1[0] ? state.clubs[d1[0].clubId].name : '—';
  // Top scorer
  const topPlayer = Object.values(state.players).sort((a, b) => b.goals - a.goals)[0];
  const myRow = d1.find(r => r.clubId === state.myClubId);
  const myPos = myRow ? d1.indexOf(myRow) + 1 : 0;
  // Prize money
  if (myRow) {
    const prize = Math.max(2_000_000, (21 - myPos) * 1_500_000);
    state.clubs[state.myClubId].budget += prize;
    state.finances.push({ week: state.week, type: 'prizeMoney', amount: prize, note: `Position ${myPos}` });
  }
  // Age players, reset stats, refresh contracts
  for (const p of Object.values(state.players)) {
    p.age++;
    p.goals = 0; p.assists = 0; p.appearances = 0; p.cleanSheets = 0; p.yellow = 0; p.red = 0;
    if (p.age < 25 && p.overall < p.potential) p.overall = Math.min(p.potential, p.overall + rng(0, 2));
    if (p.age > 30) p.overall = Math.max(50, p.overall - rng(0, 2));
    p.value = Math.floor((p.overall ** 3) / 18) * 1000 * (p.age < 25 ? 1.4 : p.age > 30 ? 0.5 : 1);
    p.contractYears = Math.max(0, p.contractYears - 1);
  }
  // History
  state.history.push({
    season: state.season, division: state.clubs[state.myClubId].division,
    position: myPos, champion, topScorer: topPlayer ? `${topPlayer.firstName} ${topPlayer.lastName} (${topPlayer.goals})` : '—',
  });

  // Reset fixtures for next season
  const d1Ids = Object.values(state.clubs).filter(c => c.division === 1).map(c => c.id);
  const newFixtures = generateFixtures(d1Ids);

  return { ...state, season: state.season + 1, week: 1, fixtures: newFixtures, standings: computeStandings({ ...state, fixtures: newFixtures }) };
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
