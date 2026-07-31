import { describe, expect, it } from "vitest";
import { rankGroup } from "./standings";
import type { Match, Team } from "./types";

const teams: Team[] = ["a", "b", "c", "d"].map((id) => ({
  id,
  name: id.toUpperCase(),
  shortName: id.toUpperCase(),
  country: "Test",
  group: "alpha",
  logoUrl: ""
}));

function match(id: string, teamAId: string, teamBId: string, a: number, b: number): Match {
  return {
    id,
    group: "alpha",
    teamAId,
    teamBId,
    scheduledAt: "2026-01-01T00:00:00Z",
    status: "completed",
    maps: [
      { teamARounds: a, teamBRounds: b },
      { teamARounds: a, teamBRounds: b }
    ]
  };
}

describe("rankGroup", () => {
  it("orders by match wins", () => {
    const ranked = rankGroup(teams, [
      match("1", "a", "b", 13, 8),
      match("2", "a", "c", 13, 8),
      match("3", "b", "c", 13, 8)
    ]);
    expect(ranked.map((row) => row.teamId)).toEqual(["a", "b", "d", "c"]);
  });

  it("uses head-to-head for a two-team tie", () => {
    const ranked = rankGroup(teams, [
      match("1", "b", "a", 13, 8),
      match("2", "a", "c", 13, 8),
      match("3", "a", "d", 13, 8),
      match("4", "b", "c", 13, 8),
      match("5", "d", "b", 13, 8),
      match("6", "c", "d", 13, 8)
    ]);
    expect(ranked.map((row) => row.teamId)).toEqual(["b", "a", "c", "d"]);
  });
});
