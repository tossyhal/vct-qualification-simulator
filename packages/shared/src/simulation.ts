import { rankGroup } from "./standings";
import type {
  EventSnapshot,
  MapScore,
  Match,
  SimulationResult,
  TeamProbability
} from "./types";

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function winningMapScore(random: () => number): [number, number] {
  if (random() < 0.08) {
    const overtime = Math.floor(random() * 3);
    return [14 + overtime, 12 + overtime];
  }
  return [13, 3 + Math.floor(random() * 9)];
}

function simulateMaps(teamAWins: boolean, random: () => number): MapScore[] {
  const losingTeamTakesMap = random() < 0.5;
  const winners = losingTeamTakesMap
    ? [teamAWins, !teamAWins, teamAWins]
    : [teamAWins, teamAWins];
  return winners.map((teamAWinsMap) => {
    const [winnerRounds, loserRounds] = winningMapScore(random);
    return teamAWinsMap
      ? { teamARounds: winnerRounds, teamBRounds: loserRounds }
      : { teamARounds: loserRounds, teamBRounds: winnerRounds };
  });
}

function simulateMatch(match: Match, random: () => number): Match {
  return {
    ...match,
    status: "completed",
    maps: simulateMaps(random() < 0.5, random)
  };
}

export function simulateEvent(
  snapshot: EventSnapshot,
  iterations = 100_000,
  seed = 2_026_072
): SimulationResult {
  const random = mulberry32(seed);
  const positionCounts = new Map<string, number[]>(
    snapshot.teams.map((team) => [team.id, [0, 0, 0, 0, 0, 0]])
  );

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const simulatedMatches = snapshot.matches.map((match) =>
      match.status === "completed" ? match : simulateMatch(match, random)
    );
    for (const group of ["alpha", "omega"] as const) {
      const teams = snapshot.teams.filter((team) => team.group === group);
      const matches = simulatedMatches.filter((match) => match.group === group);
      const randomOrder = new Map(teams.map((team) => [team.id, random()]));
      const ranked = rankGroup(teams, matches, randomOrder);
      ranked.forEach((standing, index) => {
        const counts = positionCounts.get(standing.teamId);
        if (counts) counts[index] = (counts[index] ?? 0) + 1;
      });
    }
  }

  const probabilities: TeamProbability[] = snapshot.teams.map((team) => {
    const counts = positionCounts.get(team.id) ?? [0, 0, 0, 0, 0, 0];
    const positions = counts.map((count) => count / iterations) as TeamProbability["positions"];
    return {
      teamId: team.id,
      firstPlace: positions[0],
      directPlayoffs: positions[0] + positions[1],
      playInUpper: positions[2] + positions[3],
      playInLower: positions[4] + positions[5],
      positions
    };
  });

  return {
    iterations,
    seed,
    generatedAt: new Date().toISOString(),
    probabilities
  };
}

