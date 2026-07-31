import {
  EVENT_ID,
  EVENT_NAME,
  LIQUIPEDIA_PAGE,
  LIQUIPEDIA_SOURCE_URL,
  TEAMS,
  TEAM_NAME_TO_ID,
  type EventSnapshot,
  type MapScore,
  type Match
} from "@vct-sim/shared";

const API_URL = "https://liquipedia.net/valorant/api.php";
const USER_AGENT =
  "VCTQualificationSimulator/0.1 (https://github.com/tossyhal/vct-qualification-simulator)";

interface LiquipediaResponse {
  parse?: {
    revid?: number;
    text?: string;
  };
  error?: {
    code?: string;
    info?: string;
  };
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&nbsp;", " ");
}

function parseScore(value: string): number | null {
  const normalized = value.replace(/<[^>]*>/g, "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function teamIdFor(sourceName: string): string {
  const id = TEAM_NAME_TO_ID.get(decodeHtml(sourceName).trim().toLowerCase());
  if (!id) throw new Error(`Unknown Liquipedia team: ${sourceName}`);
  return id;
}

function parseMatchChunk(chunk: string, index: number): Match | null {
  const opponentMatches = [
    ...chunk.matchAll(
      /brkts-matchlist-cell brkts-matchlist-opponent[^"]*" aria-label="([^"]+)"/g
    )
  ];
  const scoreMatches = [
    ...chunk.matchAll(
      /brkts-matchlist-cell brkts-matchlist-score[^"]*"[^>]*>[\s\S]*?<div class="brkts-matchlist-cell-content">([\s\S]*?)<\/div>/g
    )
  ];
  const timestamp = chunk.match(/data-timestamp="(\d+)"/)?.[1];
  if (!opponentMatches[0]?.[1] || !opponentMatches[1]?.[1] || !timestamp) return null;

  const teamAId = teamIdFor(opponentMatches[0][1]);
  const teamBId = teamIdFor(opponentMatches[1][1]);
  const teamA = TEAMS.find((team) => team.id === teamAId);
  const teamB = TEAMS.find((team) => team.id === teamBId);
  if (!teamA || !teamB || teamA.group !== teamB.group) {
    throw new Error(`Invalid group matchup: ${teamAId} vs ${teamBId}`);
  }

  const matchScoreA = scoreMatches[0]?.[1] ? parseScore(scoreMatches[0][1]) : null;
  const matchScoreB = scoreMatches[1]?.[1] ? parseScore(scoreMatches[1][1]) : null;
  const mapScores = [
    ...chunk.matchAll(
      /brkts-popup-body-detailed-scores-main-score">(\d+)<\/div>/g
    )
  ].map((match) => Number(match[1]));
  const maps: MapScore[] = [];
  for (let mapIndex = 0; mapIndex + 1 < mapScores.length; mapIndex += 2) {
    maps.push({
      teamARounds: mapScores[mapIndex]!,
      teamBRounds: mapScores[mapIndex + 1]!
    });
  }

  const completed =
    chunk.includes('data-finished="finished"') &&
    matchScoreA !== null &&
    matchScoreB !== null &&
    Math.max(matchScoreA, matchScoreB) === 2 &&
    maps.length === matchScoreA + matchScoreB;

  return {
    id: `${timestamp}-${teamAId}-${teamBId}-${index}`,
    group: teamA.group,
    teamAId,
    teamBId,
    scheduledAt: new Date(Number(timestamp) * 1_000).toISOString(),
    status: completed ? "completed" : "scheduled",
    maps: completed ? maps : []
  };
}

export function parseLiquipediaHtml(
  html: string,
  revisionId: number | undefined,
  fetchedAt = new Date().toISOString()
): EventSnapshot {
  const chunks = html.split(
    '<div class="brkts-matchlist-match brkts-match-has-details brkts-match-popup-wrapper">'
  );
  const matches = chunks
    .slice(1)
    .map((chunk, index) => parseMatchChunk(chunk, index))
    .filter((match): match is Match => match !== null);

  const unique = new Map<string, Match>();
  for (const match of matches) {
    const key = [match.teamAId, match.teamBId].sort().join(":");
    if (!unique.has(key)) unique.set(key, match);
  }
  if (unique.size !== 30) {
    throw new Error(`Expected 30 group matches, received ${unique.size}`);
  }

  return {
    eventId: EVENT_ID,
    name: EVENT_NAME,
    sourceUrl: LIQUIPEDIA_SOURCE_URL,
    sourceUpdatedAt: revisionId ? `revision:${revisionId}` : null,
    fetchedAt,
    teams: TEAMS,
    matches: [...unique.values()].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt)
    )
  };
}

export async function fetchLiquipediaSnapshot(): Promise<EventSnapshot> {
  const url = new URL(API_URL);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", LIQUIPEDIA_PAGE);
  url.searchParams.set("prop", "text|revid");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT
    }
  });
  if (!response.ok) throw new Error(`Liquipedia returned HTTP ${response.status}`);
  const body = (await response.json()) as LiquipediaResponse;
  if (body.error) {
    throw new Error(`Liquipedia API error: ${body.error.code ?? body.error.info}`);
  }
  if (!body.parse?.text) throw new Error("Liquipedia response did not include parsed HTML");
  return parseLiquipediaHtml(body.parse.text, body.parse.revid);
}
