import { describe, it, expect } from 'vitest';
import { createMyClub, createWorld, simulateMatch, swapPlayers, advanceWeek, listPlayer } from '../game/engine';
import { GameState } from '../game/types';

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
});
