import type {
  EventPayload,
  GroupId,
  Match,
  SimulationResult,
  Standing,
  Team,
  TeamProbability
} from "@vct-sim/shared";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const EVENTS = [
  { id: "vct-2026-pacific-stage-2", label: "Stage 2" }
] as const;

const EVENT_ID = EVENTS[0].id;
const GROUPS: GroupId[] = ["alpha", "omega"];
const TRACK_POINTS = [4, 11, 18, 25];

type ApiTeam = Partial<Team>;
type ApiStanding = Partial<Standing>;
type ApiProbability = Omit<Partial<TeamProbability>, "positions"> & {
  positions?: Array<number | null>;
};
type ApiPayload = Omit<
  Partial<EventPayload>,
  "teams" | "matches" | "simulation" | "standings"
> & {
  teams?: ApiTeam[];
  matches?: Array<Partial<Match>>;
  simulation?: Omit<Partial<SimulationResult>, "probabilities"> & {
    probabilities?: ApiProbability[];
  };
  standings?: Partial<Record<GroupId, ApiStanding[]>>;
};

type TabItem = {
  id: string;
  panelId: string;
  label: string;
  kind: "event" | "explain";
};

const TABS: TabItem[] = [
  ...EVENTS.map((event) => ({
    id: `tab-${event.id}`,
    panelId: `panel-${event.id}`,
    label: event.label,
    kind: "event" as const
  })),
  {
    id: "tab-explain",
    panelId: "panel-explain",
    label: "説明",
    kind: "explain" as const
  }
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const textOrMissing = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : "欠損";

const numberOrMissing = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "欠損";

const isProbability = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

const tone = (value: number) => {
  if (value >= 1) return "settled";
  if (value <= 0) return "none";
  if (value < 0.12) return "low";
  if (value < 0.4) return "mid";
  return "high";
};

const numericValue = (value: number) => {
  if (value <= 0) return "0";
  if (value >= 1) return "100";
  if (value < 0.005) return "<1";
  return String(Math.round(value * 100));
};

const fullValue = (value: number) => {
  if (value <= 0) return "0%";
  if (value >= 1) return "100%";
  if (value < 0.001) return "0.1%未満";
  return `${(value * 100).toFixed(1)}%`;
};

function Track({ dim = false, x }: { dim?: boolean; x: number }) {
  const ink = dim ? "var(--ink-faint)" : "var(--ink-dim)";
  const dot = dim ? "var(--ink-dim)" : "var(--amber)";

  return (
    <svg width="29" height="10" viewBox="0 0 29 10" aria-hidden="true">
      <line x1="2" y1="5" x2="27" y2="5" stroke={ink} strokeWidth="1" />
      {TRACK_POINTS.map((point) => (
        <line
          key={point}
          x1={point}
          y1="2.5"
          x2={point}
          y2="7.5"
          stroke={ink}
          strokeWidth="1"
        />
      ))}
      <circle cx={x} cy="5" r="3" fill={dot} />
    </svg>
  );
}

const DESTINATIONS = [
  {
    at: [0],
    name: "bye",
    short: "bye",
    full: "Playoffs Upper Bracket 準決勝へbye",
    x: 25
  },
  {
    at: [1],
    name: "PO 1回戦",
    short: "PO1",
    full: "Playoffs Upper Bracket 1回戦",
    x: 18
  },
  {
    at: [2, 3],
    name: "PI 2回戦",
    short: "PI2",
    full: "Play-In Upper Bracket 2回戦",
    x: 11
  },
  {
    at: [4, 5],
    name: "PI 1回戦",
    short: "PI1",
    full: "Play-In Upper Bracket 1回戦",
    x: 4
  }
] as const;

function ProbabilityCell({
  className,
  label,
  value
}: {
  className?: string;
  label: string;
  value: unknown;
}) {
  if (!isProbability(value)) {
    return (
      <td className={className} title={`${label} 欠損`}>
        <span className="v" data-t="missing">
          <span className="sr">{label} </span>
          欠損
        </span>
      </td>
    );
  }

  const width = value <= 0 ? 0 : Math.max(9, Math.round(value * 100));

  return (
    <td className={className} title={`${label} ${fullValue(value)}`}>
      <span className="v" data-t={tone(value)}>
        <span className="sr">{label} </span>
        {numericValue(value)}
        <span className="gauge" style={{ width: `${width}%` }} aria-hidden="true" />
      </span>
    </td>
  );
}

function MissingRow() {
  return (
    <tr>
      <th className="missing-row" scope="row" colSpan={8}>
        欠損
      </th>
    </tr>
  );
}

function ProbabilityTable({
  group,
  payload
}: {
  group: GroupId;
  payload: ApiPayload;
}) {
  const teams = new Map(
    (payload.teams ?? []).map((team) => [team?.id, team] as const)
  );
  const probabilities = new Map(
    (payload.simulation?.probabilities ?? []).map((probability) => [
      probability?.teamId,
      probability
    ])
  );
  const standings = payload.standings?.[group];
  const rows = Array.isArray(standings) ? standings : null;
  const title = `GROUP ${group.toUpperCase()}`;

  return (
    <section className="board" aria-labelledby={`heading-${group}`}>
      <div className="board-head">
        <h2 id={`heading-${group}`}>{title}</h2>
      </div>
      <table>
        <caption className="sr">{title}の順位別確率</caption>
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "9.66%" }} />
          <col style={{ width: "9.66%" }} />
          <col style={{ width: "9.66%" }} />
          <col style={{ width: "9.66%" }} />
          <col style={{ width: "9.66%" }} />
          <col style={{ width: "12.7%" }} />
        </colgroup>
        <thead>
          <tr className="band">
            <td colSpan={2} />
            {DESTINATIONS.map((destination) => (
              <th
                key={destination.name}
                className="col-band"
                scope="colgroup"
                colSpan={destination.at.length}
              >
                <Track x={destination.x} />
                <span className="band-short">{destination.short}</span>
                <span className="band-full">{destination.name}</span>
              </th>
            ))}
          </tr>
          <tr>
            <th className="col-team" scope="col">
              チーム
            </th>
            <th className="col-direct" scope="col">
              直通
            </th>
            {[1, 2, 3, 4, 5, 6].map((position) => (
              <th className="col-pos" scope="col" key={position}>
                {position}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((rawStanding, index) => {
              const standing = rawStanding ?? {};
              const team = teams.get(standing.teamId);
              const probability = probabilities.get(standing.teamId);
              const shortName = textOrMissing(team?.shortName);
              const teamName = textOrMissing(team?.name);

              return (
                <tr key={`${standing.teamId ?? "missing"}-${index}`}>
                  <th className="col-team" scope="row">
                    <span className="pos">{index + 1}</span>
                    <span className={`team${shortName === "欠損" ? " missing" : ""}`}>
                      {shortName}
                    </span>
                    <span className="record">
                      <span className="record-full">{teamName} · </span>
                      {numberOrMissing(standing.wins)}-{numberOrMissing(standing.losses)}
                    </span>
                  </th>
                  <ProbabilityCell
                    className="col-direct direct"
                    label="直通確率"
                    value={probability?.directPlayoffs}
                  />
                  {[0, 1, 2, 3, 4, 5].map((position) => (
                    <ProbabilityCell
                      className="col-pos"
                      key={position}
                      label={`${position + 1}位`}
                      value={
                        Array.isArray(probability?.positions)
                          ? probability.positions[position]
                          : undefined
                      }
                    />
                  ))}
                </tr>
              );
            })
          ) : (
            <MissingRow />
          )}
        </tbody>
      </table>
    </section>
  );
}

function KeyBlock() {
  return (
    <div className="key">
      <h3>行き先の読み方</h3>
      <ul>
        {DESTINATIONS.map((destination) => (
          <li key={destination.name}>
            <Track x={destination.x} />
            <b>{destination.name}</b>
            {destination.full}
          </li>
        ))}
      </ul>
      <ul style={{ marginTop: 9 }}>
        <li>
          <b>白い数字</b>その順位で確定しています
        </li>
        <li>
          <b>下線</b>長さが確率の大きさです
        </li>
      </ul>
    </div>
  );
}

function EventBoards({ payload }: { payload: ApiPayload }) {
  return (
    <>
      {GROUPS.map((group) => (
        <ProbabilityTable key={group} group={group} payload={payload} />
      ))}
      <KeyBlock />
    </>
  );
}

function ExplainPanel({
  iterations,
  sourceUrl
}: {
  iterations: unknown;
  sourceUrl: unknown;
}) {
  const source = textOrMissing(sourceUrl);
  const iterationText =
    typeof iterations === "number" && Number.isFinite(iterations)
      ? iterations.toLocaleString("en-US")
      : "欠損";

  return (
    <div className="explain">
      <h2>この数字は何か</h2>
      <p>
        残っている試合の勝敗をすべて五分（50%）と置き、グループの全試合を
        <strong>{iterationText}回</strong>くり返し組み立て直したときに、各チームがその順位で終わった割合です。
        予想ではなく、今の勝敗表から機械的に数えた結果です。
      </p>

      <h2>順位が決めるもの</h2>
      <p>
        このグループステージで敗退するチームはありません。12チーム全員が次へ進み、
        順位は<strong>どこから始めるか</strong>だけを決めます。
      </p>
      <ul>
        <li>1位 — Playoffs Upper Bracket 準決勝へ bye</li>
        <li>2位 — Playoffs Upper Bracket 1回戦</li>
        <li>3・4位 — Play-In Upper Bracket 2回戦</li>
        <li>5・6位 — Play-In Upper Bracket 1回戦</li>
      </ul>

      <h2>同率のとき</h2>
      <p>公式規定の順で判定しています。</p>
      <ol>
        <li>直接対決の勝敗</li>
        <li>直接対決のマップ差</li>
        <li>直接対決のラウンド差</li>
        <li>マップ差</li>
        <li>ラウンド差</li>
      </ol>
      <p>
        3チーム以上が並んだ場合は、上位と判定できたチームを切り離し、残りをひとつの組として
        最初の基準からやり直します。これも公式規定どおりです。
      </p>

      <h2>正確でないところ</h2>
      <p>
        残り試合を一律50%としているため、チームの実力差は反映されません。
        マップ数とラウンド数の生成も簡略化しており、同率の判定に影響します。
        分析用途には向きません。
      </p>

      <div className="foot">
        データ出典{" "}
        {source === "欠損" ? (
          <span className="missing">欠損</span>
        ) : (
          <a href={source} target="_blank" rel="noreferrer">
            Liquipedia VALORANT Wiki
          </a>
        )}
        （CC BY-SA 3.0）。 Riot Games、VALORANT Esports、Liquipediaとは無関係の非公式サイトです。
      </div>
    </div>
  );
}

function Loading() {
  return (
    <main className="state-screen" aria-live="polite">
      <div className="loader" aria-hidden="true" />
      <p>通過確率を読み込んでいます</p>
    </main>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="state-screen error-state" aria-live="assertive">
      <h1>データを取得できません</h1>
      <p>集計データを取得できませんでした。</p>
      <button type="button" onClick={onRetry}>
        再試行
      </button>
    </main>
  );
}

function eventStamp(payload: ApiPayload) {
  if (!Array.isArray(payload.matches) || payload.matches.length === 0) {
    return "試合数 欠損";
  }

  const remaining = payload.matches.filter((match) => match?.status !== "completed").length;
  return remaining === 0
    ? `全${payload.matches.length}試合 消化済み`
    : `残り${remaining}試合`;
}

function DataView({ payload }: { payload: ApiPayload }) {
  const [activeTab, setActiveTab] = useState(TABS[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTab = (index: number) => {
    const nextTab = TABS[index];
    if (!nextTab) return;
    setActiveTab(nextTab.id);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTab((index + 1) % TABS.length);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTab((index - 1 + TABS.length) % TABS.length);
    }
  };

  return (
    <main className="shell">
      <div className="top">
        <h1>
          Pacific Stage 2 <span className="jp">通過確率</span>
        </h1>
        <span className="stamp">{eventStamp(payload)}</span>
      </div>

      <div className="tabs" role="tablist" aria-label="表示を選ぶ">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tab.id}
            aria-controls={tab.panelId}
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.panelId}
          id={tab.panelId}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.kind === "event" ? (
            <EventBoards payload={payload} />
          ) : (
            <ExplainPanel
              iterations={payload.simulation?.iterations}
              sourceUrl={payload.sourceUrl}
            />
          )}
        </div>
      ))}
    </main>
  );
}

export function App() {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`${API_BASE}/api/events/${EVENT_ID}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const body: unknown = await response.json();
        return (isRecord(body) ? body : {}) as ApiPayload;
      })
      .then((nextPayload) => {
        setPayload(nextPayload);
        setError(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(true);
      });

    return () => controller.abort();
  }, [retryCount]);

  const retry = () => {
    setPayload(null);
    setError(false);
    setRetryCount((count) => count + 1);
  };

  if (error) return <ErrorState onRetry={retry} />;
  if (!payload) return <Loading />;
  return <DataView payload={payload} />;
}
