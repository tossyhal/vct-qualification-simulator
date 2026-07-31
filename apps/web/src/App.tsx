import type {
  EventPayload,
  GroupId,
  Match,
  Standing,
  Team,
  TeamProbability
} from "@vct-sim/shared";
import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const EVENT_ID = "vct-2026-pacific-stage-2";

const percent = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "percent",
    minimumFractionDigits: value > 0 && value < 0.001 ? 3 : 1,
    maximumFractionDigits: value > 0 && value < 0.001 ? 3 : 1
  }).format(value);

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));

function TeamLogo({ team }: { team: Team }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="logo-fallback">{team.shortName.slice(0, 2)}</span>
  ) : (
    <img
      className="team-logo"
      src={team.logoUrl}
      alt={`${team.name} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function ProbabilityBar({ probability }: { probability: TeamProbability }) {
  return (
    <div className="distribution" aria-label="順位確率">
      {probability.positions.map((value, index) => (
        <span
          key={index}
          className={`position-segment position-${index + 1}`}
          style={{ width: `${value * 100}%` }}
          title={`${index + 1}位 ${percent(value)}`}
        />
      ))}
    </div>
  );
}

function TeamRow({
  team,
  standing,
  probability,
  rank
}: {
  team: Team;
  standing: Standing;
  probability: TeamProbability;
  rank: number;
}) {
  return (
    <article className="team-row">
      <div className="rank">{rank}</div>
      <TeamLogo team={team} />
      <div className="team-identity">
        <strong>{team.name}</strong>
        <span>
          {standing.wins}–{standing.losses} · MAP {standing.mapsWon}–{standing.mapsLost}
        </span>
      </div>
      <div className="chance">
        <span>PLAYOFFS</span>
        <strong>{percent(probability.directPlayoffs)}</strong>
      </div>
      <div className="bar-wrap">
        <ProbabilityBar probability={probability} />
        <div className="position-labels">
          <span>1位 {percent(probability.firstPlace)}</span>
          <span>3–4位 {percent(probability.playInUpper)}</span>
          <span>5–6位 {percent(probability.playInLower)}</span>
        </div>
      </div>
    </article>
  );
}

function GroupPanel({ payload, group }: { payload: EventPayload; group: GroupId }) {
  const teams = new Map(payload.teams.map((team) => [team.id, team]));
  const probabilities = new Map(
    payload.simulation.probabilities.map((probability) => [probability.teamId, probability])
  );
  return (
    <section className="group-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GROUP {group.toUpperCase()}</p>
          <h2>順位と通過確率</h2>
        </div>
        <div className="legend">
          <span><i className="legend-direct" />1–2位</span>
          <span><i className="legend-upper" />3–4位</span>
          <span><i className="legend-lower" />5–6位</span>
        </div>
      </div>
      <div className="team-list">
        {payload.standings[group].map((standing, index) => {
          const team = teams.get(standing.teamId);
          const probability = probabilities.get(standing.teamId);
          return team && probability ? (
            <TeamRow
              key={team.id}
              team={team}
              standing={standing}
              probability={probability}
              rank={index + 1}
            />
          ) : null;
        })}
      </div>
    </section>
  );
}

function MatchCard({ match, teams }: { match: Match; teams: Map<string, Team> }) {
  const teamA = teams.get(match.teamAId);
  const teamB = teams.get(match.teamBId);
  if (!teamA || !teamB) return null;
  const mapsA = match.maps.filter((map) => map.teamARounds > map.teamBRounds).length;
  const mapsB = match.maps.length - mapsA;
  return (
    <article className="match-card">
      <time>{dateTime(match.scheduledAt)}</time>
      <div>
        <span>{teamA.shortName}</span>
        <strong>{match.status === "completed" ? mapsA : "—"}</strong>
      </div>
      <div>
        <span>{teamB.shortName}</span>
        <strong>{match.status === "completed" ? mapsB : "—"}</strong>
      </div>
      <small>{match.status === "completed" ? "FINAL" : "UPCOMING"}</small>
    </article>
  );
}

function Matches({ payload, group }: { payload: EventPayload; group: GroupId }) {
  const teams = new Map(payload.teams.map((team) => [team.id, team]));
  const matches = payload.matches
    .filter((match) => match.group === group)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return (
    <section className="matches-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SCHEDULE</p>
          <h2>試合結果・日程</h2>
        </div>
      </div>
      <div className="match-grid">
        {matches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
      </div>
    </section>
  );
}

function Loading() {
  return (
    <main className="state-screen">
      <div className="radar-loader" />
      <p>最新の集計を読み込んでいます</p>
    </main>
  );
}

export function App() {
  const [payload, setPayload] = useState<EventPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupId>("alpha");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/events/${EVENT_ID}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json() as Promise<EventPayload>;
      })
      .then(setPayload)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("集計データを取得できませんでした。時間を置いて再度お試しください。");
      });
    return () => controller.abort();
  }, []);

  const completedCount = useMemo(
    () => payload?.matches.filter((match) => match.status === "completed").length ?? 0,
    [payload]
  );

  if (error) {
    return (
      <main className="state-screen error-state">
        <span>DATA OFFLINE</span>
        <h1>ただいま更新を確認できません</h1>
        <p>{error}</p>
      </main>
    );
  }
  if (!payload) return <Loading />;

  return (
    <>
      <header className="hero">
        <nav>
          <a className="brand" href="/">QUAL//RADAR</a>
          <span>UNOFFICIAL VCT TOOL</span>
        </nav>
        <div className="hero-content">
          <div>
            <p className="eyebrow live-label"><i />PACIFIC · STAGE 2</p>
            <h1>残された可能性を、<br /><em>100,000</em>の未来から。</h1>
            <p className="hero-copy">
              残り試合はすべて五分。現在の戦績からグループステージの
              最終順位をシミュレーションしています。
            </p>
          </div>
          <div className="hero-stat">
            <span>SIMULATIONS</span>
            <strong>{payload.simulation.iterations.toLocaleString()}</strong>
            <small>50 / 50 MODEL</small>
          </div>
        </div>
        <div className="status-strip">
          <span><b>{completedCount}</b> / 30 MATCHES COMPLETE</span>
          <span>DATA <b>{dateTime(payload.fetchedAt)}</b></span>
          <span>MODEL <b>v0.1</b></span>
        </div>
      </header>

      <main className="content">
        <div className="group-tabs" role="tablist" aria-label="グループ選択">
          {(["alpha", "omega"] as const).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={group === id}
              onClick={() => setGroup(id)}
            >
              GROUP <strong>{id.toUpperCase()}</strong>
            </button>
          ))}
        </div>
        <GroupPanel payload={payload} group={group} />
        <Matches payload={payload} group={group} />
        <section className="method">
          <p className="eyebrow">METHODOLOGY</p>
          <h2>この数字について</h2>
          <div>
            <p>
              完了済みの試合結果を固定し、残りの各試合を両チーム50%として
              100,000回実行しています。チームの強さや過去大会の成績は考慮しません。
            </p>
            <p>
              順位は大会のHead-to-Head、マップ差、ラウンド差を含むタイブレーク規定に
              基づきます。表示上の0%は、100,000回の試行で該当ケースが観測されなかったことを表します。
            </p>
          </div>
        </section>
      </main>

      <footer>
        <strong>QUAL//RADAR</strong>
        <p>
          Data: <a href={payload.sourceUrl} target="_blank" rel="noreferrer">Liquipedia</a>
          {" "}· CC BY-SA 3.0
        </p>
        <p>Riot Games、VALORANT Esports、Liquipediaの公式サービスではありません。</p>
      </footer>
    </>
  );
}

