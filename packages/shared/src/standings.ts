import type { MapScore, Match, Standing, Team } from "./types";

function emptyStanding(teamId: string): Standing {
  return {
    teamId,
    wins: 0,
    losses: 0,
    mapsWon: 0,
    mapsLost: 0,
    roundsWon: 0,
    roundsLost: 0
  };
}

function matchWinner(match: Match): string {
  let teamAMaps = 0;
  let teamBMaps = 0;
  for (const map of match.maps) {
    if (map.teamARounds > map.teamBRounds) teamAMaps += 1;
    else teamBMaps += 1;
  }
  return teamAMaps > teamBMaps ? match.teamAId : match.teamBId;
}

function addMap(standingA: Standing, standingB: Standing, map: MapScore): void {
  standingA.roundsWon += map.teamARounds;
  standingA.roundsLost += map.teamBRounds;
  standingB.roundsWon += map.teamBRounds;
  standingB.roundsLost += map.teamARounds;
  if (map.teamARounds > map.teamBRounds) {
    standingA.mapsWon += 1;
    standingB.mapsLost += 1;
  } else {
    standingB.mapsWon += 1;
    standingA.mapsLost += 1;
  }
}

export function calculateStandings(teams: Team[], matches: Match[]): Map<string, Standing> {
  const standings = new Map(teams.map((team) => [team.id, emptyStanding(team.id)]));
  for (const match of matches) {
    if (match.status !== "completed") continue;
    const standingA = standings.get(match.teamAId);
    const standingB = standings.get(match.teamBId);
    if (!standingA || !standingB || match.maps.length === 0) continue;
    for (const map of match.maps) addMap(standingA, standingB, map);
    if (matchWinner(match) === match.teamAId) {
      standingA.wins += 1;
      standingB.losses += 1;
    } else {
      standingB.wins += 1;
      standingA.losses += 1;
    }
  }
  return standings;
}

type Criterion = (teamId: string, tiedIds: Set<string>) => number;

export function rankGroup(
  teams: Team[],
  matches: Match[],
  randomOrder: ReadonlyMap<string, number> = new Map()
): Standing[] {
  const standings = calculateStandings(teams, matches);
  const completed = matches.filter((match) => match.status === "completed");
  const byWins = new Map<number, string[]>();
  for (const team of teams) {
    const wins = standings.get(team.id)?.wins ?? 0;
    byWins.set(wins, [...(byWins.get(wins) ?? []), team.id]);
  }

  const h2hStanding = (teamId: string, tiedIds: Set<string>): Standing => {
    const tiedTeams = teams.filter((team) => tiedIds.has(team.id));
    const tiedMatches = completed.filter(
      (match) => tiedIds.has(match.teamAId) && tiedIds.has(match.teamBId)
    );
    return calculateStandings(tiedTeams, tiedMatches).get(teamId) ?? emptyStanding(teamId);
  };

  const criteria: Criterion[] = [
    (teamId, tiedIds) => h2hStanding(teamId, tiedIds).wins,
    (teamId, tiedIds) => {
      const row = h2hStanding(teamId, tiedIds);
      return row.mapsWon - row.mapsLost;
    },
    (teamId, tiedIds) => {
      const row = h2hStanding(teamId, tiedIds);
      return row.roundsWon - row.roundsLost;
    },
    (teamId) => {
      const row = standings.get(teamId) ?? emptyStanding(teamId);
      return row.mapsWon - row.mapsLost;
    },
    (teamId) => {
      const row = standings.get(teamId) ?? emptyStanding(teamId);
      return row.roundsWon - row.roundsLost;
    }
  ];

  const resolveTie = (ids: string[], criterionIndex: number): string[] => {
    if (ids.length <= 1) return ids;
    if (criterionIndex >= criteria.length) {
      return [...ids].sort(
        (a, b) => (randomOrder.get(a) ?? 0) - (randomOrder.get(b) ?? 0)
      );
    }
    const criterion = criteria[criterionIndex];
    if (!criterion) return ids;
    const tiedIds = new Set(ids);
    const values = ids.map((id) => criterion(id, tiedIds));
    const highest = Math.max(...values);
    const top = ids.filter((id, index) => values[index] === highest);
    if (top.length === ids.length) return resolveTie(ids, criterionIndex + 1);
    const rest = ids.filter((id) => !top.includes(id));
    return [...resolveTie(top, 0), ...resolveTie(rest, 0)];
  };

  return [...byWins.entries()]
    .sort(([winsA], [winsB]) => winsB - winsA)
    .flatMap(([, ids]) => resolveTie(ids, 0))
    .map((id) => standings.get(id) ?? emptyStanding(id));
}

