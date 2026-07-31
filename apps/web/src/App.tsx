import type {
  EventPayload,
  GroupId,
  Standing,
  Team,
  TeamProbability
} from "@vct-sim/shared";
import { useEffect, useState } from "react";

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

function ProbabilityRow({
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
    <tr>
      <td className="rank-cell">{rank}</td>
      <th scope="row" className="team-cell">
        <strong>{team.name}</strong>
      </th>
      <td className="record-cell">
        {standing.wins}–{standing.losses}
        <small>MAP {standing.mapsWon}–{standing.mapsLost}</small>
      </td>
      <td className="playoffs-cell">{percent(probability.directPlayoffs)}</td>
      {probability.positions.map((value, index) => (
        <td key={index} className={index < 2 ? "qualifying-position" : undefined}>
          {percent(value)}
        </td>
      ))}
    </tr>
  );
}

function ProbabilityTable({
  payload,
  group
}: {
  payload: EventPayload;
  group: GroupId;
}) {
  const teams = new Map(payload.teams.map((team) => [team.id, team]));
  const probabilities = new Map(
    payload.simulation.probabilities.map((probability) => [
      probability.teamId,
      probability
    ])
  );

  return (
    <section className="probability-section">
      <div className="table-heading">
        <h2>GROUP {group.toUpperCase()}</h2>
        <p>上位2チームがPlayoffsへ直通</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">順位</th>
              <th scope="col">チーム</th>
              <th scope="col">現在成績</th>
              <th scope="col" className="playoffs-heading">直通確率</th>
              <th scope="col">1位</th>
              <th scope="col">2位</th>
              <th scope="col">3位</th>
              <th scope="col">4位</th>
              <th scope="col">5位</th>
              <th scope="col">6位</th>
            </tr>
          </thead>
          <tbody>
            {payload.standings[group].map((standing, index) => {
              const team = teams.get(standing.teamId);
              const probability = probabilities.get(standing.teamId);
              return team && probability ? (
                <ProbabilityRow
                  key={team.id}
                  team={team}
                  standing={standing}
                  probability={probability}
                  rank={index + 1}
                />
              ) : null;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Loading() {
  return (
    <main className="state-screen">
      <div className="loader" />
      <p>通過確率を読み込んでいます</p>
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
        setError("集計データを取得できませんでした。");
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <main className="state-screen error-state">
        <h1>データを取得できません</h1>
        <p>{error}</p>
      </main>
    );
  }
  if (!payload) return <Loading />;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div>
            <p>VCT 2026</p>
            <h1>Pacific Stage 2 通過確率</h1>
          </div>
          <div className="update-info">
            <span>最終更新</span>
            <strong>{dateTime(payload.fetchedAt)}</strong>
          </div>
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
              Group {id === "alpha" ? "Alpha" : "Omega"}
            </button>
          ))}
        </div>
        <ProbabilityTable payload={payload} group={group} />
        <p className="source-note">
          Data:{" "}
          <a href={payload.sourceUrl} target="_blank" rel="noreferrer">
            Liquipedia
          </a>
          {" "}· 非公式サイト
        </p>
      </main>
    </>
  );
}
