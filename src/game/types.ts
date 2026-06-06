export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface PlayerPersonality {
  loyalty: number; // 1-100
  ambition: number; // 1-100
  professionalism: number; // 1-100
  leadership: number; // 1-100
  temperament: number; // 1-100
  ego: number; // 1-100
  consistency: number; // 1-100
  bigMatch: number; // 1-100
  archetype: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: Position;
  overall: number;
  potential: number;
  value: number; // €
  wage: number; // €/week
  contractYears: number;
  stats: PlayerStats;
  personality: PlayerPersonality;
  morale: number; // 0-100
  fitness: number; // 0-100
  injured: number; // weeks
  clubId: string;
  goals: number;
  assists: number;
  appearances: number;
  cleanSheets: number;
  yellow: number;
  red: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  badge: string; // emoji
  stadium: string;
  reputation: number; // 1-5
  budget: number;
  wageBudget: number;
  division: number; // 1 or 2
  playerIds: string[];
  formation: string;
  startingXI: string[]; // 11 player ids
  bench: string[]; // up to 7
  academyLevel: number; // 1-5
  youthIds: string[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'injury' | 'sub' | 'kickoff' | 'halftime' | 'fulltime';
  clubId?: string;
  playerId?: string;
  assistId?: string;
  injuryWeeks?: number;
  text: string;
}

export interface Match {
  id: string;
  week: number;
  homeId: string;
  awayId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  played: boolean;
  events?: MatchEvent[];
  homeScorers?: { playerId: string; minute: number }[];
  awayScorers?: { playerId: string; minute: number }[];
}

export interface LeagueRow {
  clubId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
}

export interface TransferListing {
  playerId: string;
  askingPrice: number;
  listedBy: string; // clubId
}

export interface FinanceEvent {
  week: number;
  type: 'wages' | 'matchRevenue' | 'transferIn' | 'transferOut' | 'prizeMoney' | 'sponsor';
  amount: number;
  note?: string;
}

export interface GameState {
  version: number;
  managerName: string;
  managerNationality?: string;
  managerFocus?: 'youth' | 'financial' | 'tactical';
  managerReputation: number; // 1-100
  boardConfidence: number; // 0-100
  isSacked: boolean;
  myClubId: string;
  season: number;
  week: number; // 1..38
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  fixtures: Match[];
  standings: Record<number, LeagueRow[]>; // division -> rows
  transferList: TransferListing[];
  finances: FinanceEvent[];
  history: { season: number; division: number; position: number; champion: string; topScorer: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveSlot {
  id?: string;
  slot: number;
  name: string;
  clubName: string;
  season: number;
  updatedAt: string;
  state: GameState;
}
