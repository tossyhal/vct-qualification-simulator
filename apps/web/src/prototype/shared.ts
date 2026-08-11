// PROTOTYPE — throwaway. #8の情報構造比較のためだけのコード。本番へ昇格させない。
import type { EventPayload, GroupId, Standing, Team, TeamProbability } from "@vct-sim/shared";

export interface Row {
  rank: number;
  team: Team;
  standing: Standing;
  probability: TeamProbability;
}

export const GROUPS: GroupId[] = ["alpha", "omega"];

/** 順位が何につながるか。Liquipediaの大会形式より。 */
export const DESTINATIONS = [
  { positions: [0], short: "bye", label: "Playoffs 準決勝へbye", mark: "◎" },
  { positions: [1], short: "PO 1回戦", label: "Playoffs Upper Bracket 1回戦", mark: "○" },
  { positions: [2, 3], short: "PI 2回戦", label: "Play-In Upper Bracket 2回戦", mark: "△" },
  { positions: [4, 5], short: "PI 1回戦", label: "Play-In Upper Bracket 1回戦", mark: "▽" }
] as const;

export function destinationOf(position: number) {
  return DESTINATIONS.find((d) => (d.positions as readonly number[]).includes(position))!;
}

export function rowsFor(payload: EventPayload, group: GroupId): Row[] {
  const teams = new Map(payload.teams.map((t) => [t.id, t]));
  const probabilities = new Map(payload.simulation.probabilities.map((p) => [p.teamId, p]));
  return payload.standings[group].flatMap((standing, index) => {
    const team = teams.get(standing.teamId);
    const probability = probabilities.get(standing.teamId);
    if (!team || !probability) return [];
    return [{ rank: index + 1, team, standing, probability }];
  });
}

/** 狭い画面で桁を揃えるための短縮表記。0と「ごくわずか」を見分けられるようにする。 */
export function pct(value: number): string {
  if (value <= 0) return "–";
  if (value >= 1) return "100";
  if (value < 0.005) return "<1";
  return String(Math.round(value * 100));
}

export function pctFull(value: number): string {
  if (value <= 0) return "0%";
  if (value >= 1) return "100%";
  if (value < 0.001) return "0.1%未満";
  return `${(value * 100).toFixed(1)}%`;
}

/** 確率の高さを段階で示す。色を無効にしても濃淡クラスから判別できるようにする。 */
export function weightOf(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0) return 0;
  if (value < 0.1) return 1;
  if (value < 0.35) return 2;
  if (value < 0.7) return 3;
  return 4;
}
