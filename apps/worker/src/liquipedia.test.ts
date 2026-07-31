import { TEAMS } from "@vct-sim/shared";
import { describe, expect, it } from "vitest";
import { parseLiquipediaHtml } from "./liquipedia";

const sourceName: Record<string, string> = {
  "gen-g": "Gen.G Esports",
  "kiwoom-drx": "DRX"
};

function card(teamAId: string, teamBId: string, timestamp: number, completed: boolean): string {
  const teamA = TEAMS.find((team) => team.id === teamAId)!;
  const teamB = TEAMS.find((team) => team.id === teamBId)!;
  const nameA = sourceName[teamAId] ?? teamA.name;
  const nameB = sourceName[teamBId] ?? teamB.name;
  const finished = completed ? ' data-finished="finished"' : "";
  const scores = completed
    ? `<div class="brkts-popup-body-detailed-scores-main-score">13</div>
       <div class="brkts-popup-body-detailed-scores-main-score">7</div>
       <div class="brkts-popup-body-detailed-scores-main-score">13</div>
       <div class="brkts-popup-body-detailed-scores-main-score">9</div>`
    : "";
  return `<div class="brkts-matchlist-match brkts-match-has-details brkts-match-popup-wrapper">
    <div class="brkts-matchlist-cell brkts-matchlist-opponent" aria-label="${nameA}"></div>
    <div class="brkts-matchlist-cell brkts-matchlist-score" aria-label="${nameA}">
      <div class="brkts-matchlist-cell-content">${completed ? "2" : ""}</div>
    </div>
    <div class="brkts-matchlist-cell brkts-matchlist-score" aria-label="${nameB}">
      <div class="brkts-matchlist-cell-content">${completed ? "0" : ""}</div>
    </div>
    <div class="brkts-matchlist-cell brkts-matchlist-opponent" aria-label="${nameB}"></div>
    <span data-timestamp="${timestamp}"${finished}></span>${scores}
  </div>`;
}

describe("parseLiquipediaHtml", () => {
  it("parses all 30 round-robin matches", () => {
    const cards: string[] = [];
    let timestamp = 1_784_188_800;
    for (const group of ["alpha", "omega"] as const) {
      const teams = TEAMS.filter((team) => team.group === group);
      for (let i = 0; i < teams.length; i += 1) {
        for (let j = i + 1; j < teams.length; j += 1) {
          cards.push(card(teams[i]!.id, teams[j]!.id, timestamp++, cards.length === 0));
        }
      }
    }
    const snapshot = parseLiquipediaHtml(cards.join(""), 123, "2026-01-01T00:00:00Z");
    expect(snapshot.matches).toHaveLength(30);
    expect(snapshot.matches.filter((match) => match.status === "completed")).toHaveLength(1);
    expect(snapshot.matches[0]?.maps).toEqual([
      { teamARounds: 13, teamBRounds: 7 },
      { teamARounds: 13, teamBRounds: 9 }
    ]);
  });
});

