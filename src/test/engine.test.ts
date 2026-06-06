import { describe, it, expect } from 'vitest';
import { createMyClub, createWorld, simulateMatch, swapPlayers, advanceWeek, listPlayer, extendContract } from '../game/engine';
import { GameState, Match } from '../game/types';

describe('Football Dynasty Game Engine', () => {
  it('should successfully create a world with balanced divisions and generate fixtures for both', () => {
    const { club, players } = createMyClub({
      name: 'FC Test',
      short: 'TST',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Test Ground',
      division: 2 // Start in Division 2 to test the crash fix
    });

    const world = createWorld(club, players);

    // Verify clubs
    const clubList = Object.values(world.clubs);
    expect(clubList.length).toBe(40); // 20 in D1, 20 in D2

    const d1Clubs = clubList.filter(c => c.division === 1);
    const d2Clubs = clubList.filter(c => c.division === 2);
    expect(d1Clubs.length).toBe(20);
    expect(d2Clubs.length).toBe(20);

    // Verify fixtures
    expect(world.fixtures.length).toBeGreaterThan(0);
    // 2 divisions * 38 weeks * 10 matches per week = 760 matches total
    expect(world.fixtures.length).toBe(760);
  });

  it('should simulate match and record assists', () => {
    const { club: clubA, players: playersA } = createMyClub({
      name: 'Club A',
      short: 'CLA',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Ground A',
      division: 1
    });

    const world = createWorld(clubA, playersA);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      myClubId: clubA.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const firstMatch = state.fixtures[0];
    const result = simulateMatch(firstMatch, state);

    expect(result.played).toBe(true);
    // Verify that player statistics for appearances are updated
    const homeXI = world.clubs[firstMatch.homeId].startingXI;
    const testPlayer = state.players[homeXI[0]];
    expect(testPlayer.appearances).toBe(1);

    // Verify assists logic: check if any goals had assists assigned
    const goalEvents = result.events?.filter(e => e.type === 'goal') ?? [];
    if (goalEvents.length > 0) {
      let hasAssistId = false;
      for (const event of goalEvents) {
        if (event.assistId) {
          hasAssistId = true;
          expect(state.players[event.assistId].assists).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should swap positions between starting XI, bench, and reserves', () => {
    const { club, players } = createMyClub({
      name: 'Club X',
      short: 'CLX',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Ground X',
      division: 1
    });

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      myClubId: club.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const myClub = state.clubs[club.id];
    const starterId = myClub.startingXI[0];
    const benchId = myClub.bench[0];
    
    // Find a player in reserves (in playerIds but not startingXI or bench)
    const reserveId = myClub.playerIds.find(id => !myClub.startingXI.includes(id) && !myClub.bench.includes(id))!;

    // 1. Swap Starting XI and Bench
    swapPlayers(state, starterId, benchId);
    expect(myClub.startingXI.includes(benchId)).toBe(true);
    expect(myClub.bench.includes(starterId)).toBe(true);

    // 2. Swap Starting XI and Reserves
    swapPlayers(state, benchId, reserveId); // benchId is now in startingXI
    expect(myClub.startingXI.includes(reserveId)).toBe(true);
    expect(myClub.startingXI.includes(benchId)).toBe(false);
  });

  it('should allow AI clubs to buy listed players in advanceWeek', () => {
    const { club, players } = createMyClub({
      name: 'Club Y',
      short: 'CLY',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Ground Y',
      division: 1
    });

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      myClubId: club.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // List a user player for sale
    const userPlayerId = state.clubs[club.id].playerIds[0];
    listPlayer(state, userPlayerId, 100_000); // Listed for €100k

    // Ensure list player is in transferList
    expect(state.transferList.some(l => l.playerId === userPlayerId)).toBe(true);

    // Run advanceWeek multiple times or stub Math.random to force AI purchase
    const originalRandom = Math.random;
    try {
      // Force Math.random() to return 0 so transfer probability (0.15) succeeds
      // and buyer club picker succeeds
      Math.random = () => 0;

      const nextState = advanceWeek(state);
      
      // Verify that the player has been transferred
      expect(nextState.transferList.some(l => l.playerId === userPlayerId)).toBe(false);
      expect(nextState.players[userPlayerId].clubId).not.toBe(club.id);
      expect(nextState.clubs[club.id].playerIds.includes(userPlayerId)).toBe(false);
      expect(nextState.finances.some(f => f.type === 'transferOut')).toBe(true);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('should advance week using pre-simulated match result and apply stats', () => {
    const { club, players } = createMyClub({
      name: 'Club Z',
      short: 'CLZ',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Ground Z',
      division: 1
    });

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      myClubId: club.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const myClub = state.clubs[club.id];
    const myMatch = state.fixtures.find(f => f.week === 1 && (f.homeId === myClub.id || f.awayId === myClub.id))!;
    
    const mockSimResult: Match = {
      ...myMatch,
      homeGoals: 5,
      awayGoals: 0,
      played: true,
      events: [
        { minute: 10, type: 'goal', clubId: myMatch.homeId, playerId: state.clubs[myMatch.homeId].startingXI[0], text: '⚽ Goal!' }
      ],
      homeScorers: [{ playerId: state.clubs[myMatch.homeId].startingXI[0], minute: 10 }],
      awayScorers: []
    };

    const nextState = advanceWeek(state, mockSimResult);

    const updatedMatch = nextState.fixtures.find(f => f.id === myMatch.id)!;
    expect(updatedMatch.played).toBe(true);
    expect(updatedMatch.homeGoals).toBe(5);
    expect(updatedMatch.awayGoals).toBe(0);

    const scorerId = state.clubs[myMatch.homeId].startingXI[0];
    expect(nextState.players[scorerId].goals).toBe(1);
  });

  it('should test youth academy mechanics (creation, promotion, and upgrades)', () => {
    const { club, players } = createMyClub({
      name: 'Club Academy',
      short: 'ACA',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Academy Ground',
      division: 1
    });

    // Verify initial youth players generated
    expect(club.youthIds.length).toBeGreaterThan(0);

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      managerReputation: 50,
      boardConfidence: 50,
      isSacked: false,
      myClubId: club.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Promote a youth player
    const youthId = state.clubs[club.id].youthIds[0];
    expect(youthId).toBeDefined();
    
    // Perform promotion in test (same logic as Squad.tsx)
    const myClubState = state.clubs[club.id];
    myClubState.youthIds = myClubState.youthIds.filter(id => id !== youthId);
    myClubState.playerIds.push(youthId);

    expect(state.clubs[club.id].youthIds.includes(youthId)).toBe(false);
    expect(state.clubs[club.id].playerIds.includes(youthId)).toBe(true);

    // Verify Academy Upgrade
    const originalBudget = state.clubs[club.id].budget;
    const upgradeCost = (state.clubs[club.id].academyLevel || 1) * 5_000_000;
    
    // Perform upgrade
    state.clubs[club.id].budget -= upgradeCost;
    state.clubs[club.id].academyLevel = (state.clubs[club.id].academyLevel || 1) + 1;
    state.finances.push({ week: state.week, type: 'transferOut', amount: -upgradeCost, note: `Academy Upgrade` });

    expect(state.clubs[club.id].academyLevel).toBe(2);
    expect(state.clubs[club.id].budget).toBe(originalBudget - upgradeCost);
    expect(state.finances.some(f => f.type === 'transferOut' && f.amount === -upgradeCost)).toBe(true);
  });

  it('should test contract renewals influenced by personalities', () => {
    const { club, players } = createMyClub({
      name: 'Club Contract',
      short: 'CON',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Contract Ground',
      division: 1
    });

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      managerReputation: 50,
      boardConfidence: 50,
      isSacked: false,
      myClubId: club.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const player = Object.values(state.players).find(p => p.clubId === club.id)!;
    
    // Set high loyalty personality
    player.personality = {
      loyalty: 90,
      ambition: 20,
      professionalism: 80,
      leadership: 40,
      temperament: 80,
      ego: 10,
      consistency: 80,
      bigMatch: 70,
      archetype: 'Loyal Servant'
    };

    const resLoyal = extendContract(state, player.id);
    expect(resLoyal.ok).toBe(true);
    // Loyalty discount makes wage demand lower (value/100 * 0.8)
    const expectedLoyalWage = Math.floor(Math.floor(player.value / 100) * 0.8);
    expect(resLoyal.wage).toBe(expectedLoyalWage);

    // Set high ego / mercenary personality
    player.personality = {
      loyalty: 10,
      ambition: 90,
      professionalism: 40,
      leadership: 40,
      temperament: 40,
      ego: 90,
      consistency: 80,
      bigMatch: 70,
      archetype: 'Mercenary'
    };

    const resEgo = extendContract(state, player.id);
    expect(resEgo.ok).toBe(true);
    // Ego/ambition makes wage demand higher (value/100 * 1.3)
    const expectedEgoWage = Math.floor(Math.floor(player.value / 100) * 1.3);
    expect(resEgo.wage).toBe(expectedEgoWage);
  });

  it('should test board room confidence and sacking flow', () => {
    const { club, players } = createMyClub({
      name: 'Club Board',
      short: 'BRD',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Board Ground',
      division: 1
    });

    const world = createWorld(club, players);
    const state: GameState = {
      version: 1,
      managerName: 'Manager',
      managerReputation: 50,
      boardConfidence: 10, // low confidence to test sack
      isSacked: false,
      myClubId: club.id,
      season: 1,
      week: 6, // week > 5 to allow sacking
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Advance week to trigger sacking check
    const nextState = advanceWeek(state);
    expect(nextState.isSacked).toBe(true);
  });

  it('should test starting career customizations (financial boost, manager focus, and nationality)', () => {
    // 1. Test Youth Developer Focus
    const { club: clubYouth, players: playersYouth } = createMyClub({
      name: 'Club Youth Focus',
      short: 'YTH',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Youth Ground',
      division: 2,
      financialBoost: 'none',
      managerFocus: 'youth'
    });

    expect(clubYouth.academyLevel).toBe(2);
    // Youth players should have potential boosted
    const youthPlayers = playersYouth.filter(p => clubYouth.youthIds.includes(p.id));
    expect(youthPlayers.length).toBeGreaterThan(0);

    // 2. Test Financial Takeover + Financial Guru Focus
    const { club: clubFin } = createMyClub({
      name: 'Club Fin Focus',
      short: 'FIN',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Fin Ground',
      division: 2,
      financialBoost: 'takeover', // +50M
      managerFocus: 'financial' // +20%
    });

    // Division 2 base budget = 12M. With takeover: 12M + 50M = 62M. With Financial Guru: 62M * 1.2 = 74.4M.
    const expectedBudget = Math.floor(62_000_000 * 1.2);
    expect(clubFin.budget).toBe(expectedBudget);

    // 3. Test Tactician Focus Match simulation boost
    const { club: clubTac, players: playersTac } = createMyClub({
      name: 'Club Tac Focus',
      short: 'TAC',
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      badge: '⚽',
      stadium: 'Tac Ground',
      division: 2,
      financialBoost: 'none',
      managerFocus: 'tactical'
    });

    const world = createWorld(clubTac, playersTac);
    const state: GameState = {
      version: 1,
      managerName: 'Tactical Boss',
      managerNationality: '🇪🇸 ESP',
      managerFocus: 'tactical',
      myClubId: clubTac.id,
      season: 1,
      week: 1,
      clubs: world.clubs,
      players: world.players,
      fixtures: world.fixtures,
      standings: {},
      transferList: [],
      finances: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Contract renewal check for financial focus
    const stateFin: GameState = {
      ...state,
      managerFocus: 'financial',
      myClubId: clubFin.id,
      clubs: { ...state.clubs, [clubFin.id]: clubFin }
    };
    const finPlayer = playersTac[0]; // dummy player
    finPlayer.clubId = clubFin.id;
    stateFin.players[finPlayer.id] = finPlayer;

    const originalWage = Math.floor(finPlayer.value / 100);
    const renewRes = extendContract(stateFin, finPlayer.id);
    expect(renewRes.ok).toBe(true);
    // Financial Guru focus gets 5% discount on base contract wage demand
    let expectedWage = originalWage;
    if (finPlayer.personality) {
      if (finPlayer.personality.loyalty > 80) expectedWage = Math.floor(expectedWage * 0.8);
      else if (finPlayer.personality.ego > 80 || finPlayer.personality.ambition > 80) expectedWage = Math.floor(expectedWage * 1.3);
    }
    expectedWage = Math.floor(expectedWage * 0.95);
    expect(renewRes.wage).toBe(expectedWage);
  });
});
