import { describe, expect, it } from "vitest";
import { simulateEvent } from "./simulation";
import type { EventSnapshot, Team } from "./types";

const teams: Team[] = ["a", "b"].map((id) => ({
  id,
  name: id,
  shortName: id,
  country: "Test",
  group: "alpha",
  logoUrl: ""
}));

const snapshot: EventSnapshot = {
  eventId: "test",
  name: "Test",
  sourceUrl: "https://example.com",
  sourceUpdatedAt: null,
  fetchedAt: "2026-01-01T00:00:00Z",
  teams,
  matches: [
    {
      id: "a-b",
      group: "alpha",
      teamAId: "a",
      teamBId: "b",
      scheduledAt: "2026-01-01T00:00:00Z",
      status: "scheduled",
      maps: []
    }
  ]
};

describe("simulateEvent", () => {
  it("is reproducible with the same seed", () => {
    const first = simulateEvent(snapshot, 100, 42);
    const second = simulateEvent(snapshot, 100, 42);
    expect(first.probabilities).toEqual(second.probabilities);
  });
});

