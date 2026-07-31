export type GroupId = "alpha" | "omega";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  group: GroupId;
  logoUrl: string;
}

export interface MapScore {
  teamARounds: number;
  teamBRounds: number;
}

export interface Match {
  id: string;
  group: GroupId;
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  status: "completed" | "scheduled";
  maps: MapScore[];
}

export interface Standing {
  teamId: string;
  wins: number;
  losses: number;
  mapsWon: number;
  mapsLost: number;
  roundsWon: number;
  roundsLost: number;
}

export interface TeamProbability {
  teamId: string;
  directPlayoffs: number;
  firstPlace: number;
  playInUpper: number;
  playInLower: number;
  positions: [number, number, number, number, number, number];
}

export interface SimulationResult {
  iterations: number;
  seed: number;
  generatedAt: string;
  probabilities: TeamProbability[];
}

export interface EventSnapshot {
  eventId: string;
  name: string;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  teams: Team[];
  matches: Match[];
}

export interface EventPayload extends EventSnapshot {
  simulation: SimulationResult;
  standings: Record<GroupId, Standing[]>;
}
