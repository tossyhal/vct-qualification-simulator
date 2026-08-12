import type {
  EventPayload,
  GroupId,
  Match,
  SimulationResult,
  Standing,
  Team,
  TeamProbability
} from "@vct-sim/shared";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode
} from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const EVENTS = [
  { id: "vct-2026-pacific-stage-2", label: "Pacific" }
] as const;

const EVENT_ID = EVENTS[0].id;
const GROUPS: GroupId[] = ["alpha", "omega"];

type PublicView = "board" | "about";
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

type LoadState = "loading" | "success" | "error";

declare const __ENABLE_ADMIN_PAGE__: boolean;

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

const readPublicView = (): PublicView =>
  new URLSearchParams(window.location.search).get("page") === "about"
    ? "about"
    : "board";

function SiteMasthead({
  view,
  onViewChange
}: {
  view: PublicView;
  onViewChange: (nextView: PublicView) => void;
}) {
  const selectView = (
    event: MouseEvent<HTMLAnchorElement>,
    nextView: PublicView
  ) => {
    event.preventDefault();
    if (view === nextView) return;
    onViewChange(nextView);
  };

  return (
    <header className="masthead">
      <div className="masthead-title">
        <h1>VCT QUALIFICATION</h1>
      </div>
      <nav className="page-nav" aria-label="ページ">
        {view === "about" ? (
          <a
            className="page-link"
            href="/"
            onClick={(event) => selectView(event, "board")}
          >
            Pacific
          </a>
        ) : null}
        <a
          className="page-link"
          href="?page=about"
          aria-current={view === "about" ? "page" : undefined}
          onClick={(event) => selectView(event, "about")}
        >
          説明
        </a>
      </nav>
    </header>
  );
}

function moveInTabList(
  index: number,
  direction: -1 | 1,
  length: number,
  focus: (nextIndex: number) => void
) {
  if (length === 0) return;
  focus((index + direction + length) % length);
}

function TournamentTabs({
  activeEvent,
  onSelect
}: {
  activeEvent: string;
  onSelect: (eventId: string) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const event = EVENTS[index];
    if (!event) return;
    onSelect(event.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveInTabList(index, 1, EVENTS.length, focusTab);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveInTabList(index, -1, EVENTS.length, focusTab);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(EVENTS.length - 1);
    }
  };

  return (
    <div className="tournament-tabs" role="tablist" aria-label="大会選択">
      {EVENTS.map((event, index) => (
        <button
          key={event.id}
          ref={(element) => {
            tabRefs.current[index] = element;
          }}
          type="button"
          className="content-tab tournament-tab"
          role="tab"
          id={`tournament-tab-${event.id}`}
          aria-controls={`tournament-panel-${event.id}`}
          aria-selected={activeEvent === event.id}
          tabIndex={activeEvent === event.id ? 0 : -1}
          onClick={() => onSelect(event.id)}
          onKeyDown={(eventKey) => handleKeyDown(eventKey, index)}
        >
          {event.label}
        </button>
      ))}
    </div>
  );
}

function GroupTabs({
  activeGroup,
  onSelect,
  eventId
}: {
  activeGroup: GroupId;
  onSelect: (group: GroupId) => void;
  eventId: string;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const group = GROUPS[index];
    if (!group) return;
    onSelect(group);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveInTabList(index, 1, GROUPS.length, focusTab);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveInTabList(index, -1, GROUPS.length, focusTab);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(GROUPS.length - 1);
    }
  };

  return (
    <div className="group-tabs" role="tablist" aria-label="グループ選択">
      {GROUPS.map((group, index) => {
        const label = group === "alpha" ? "Alpha" : "Omega";
        return (
          <button
            key={group}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            className="content-tab group-tab"
            role="tab"
            id={`${eventId}-group-tab-${group}`}
            aria-controls={`${eventId}-group-panel-${group}`}
            aria-selected={activeGroup === group}
            tabIndex={activeGroup === group ? 0 : -1}
            onClick={() => onSelect(group)}
            onKeyDown={(eventKey) => handleKeyDown(eventKey, index)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

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
      <td className={`${className ?? ""} missing-cell`} title={`${label} 欠損`}>
        <span className="value missing-value">
          <span className="sr-only">{label} </span>
          欠損
        </span>
      </td>
    );
  }

  return (
    <td className={className} title={`${label} ${fullValue(value)}`}>
      <div className="prob">
        <span className={`value${value === 0 ? " zero" : ""}`}>
          <span className="sr-only">{label} </span>
          {numericValue(value)}
          <span className="sr-only">%</span>
        </span>
      </div>
    </td>
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
  const title = group === "alpha" ? "Alpha" : "Omega";

  return (
    <table>
        <caption className="sr-only">{title}の順位別確率</caption>
        <colgroup>
          <col style={{ width: "27%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "10.1667%" }} />
          <col style={{ width: "10.1667%" }} />
          <col style={{ width: "10.1667%" }} />
          <col style={{ width: "10.1667%" }} />
          <col style={{ width: "10.1667%" }} />
          <col style={{ width: "10.1667%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">現在順位・成績</th>
            <th scope="col">Playoff</th>
            {[1, 2, 3, 4, 5, 6].map((position) => (
              <th scope="col" key={position}>
                {position}位
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
                  <th scope="row">
                    <div className="team-cell">
                      <span className="rank">{index + 1}</span>
                      <span>
                        <span
                          className={`short${shortName === "欠損" ? " missing" : ""}`}
                          title={teamName}
                        >
                          {shortName}
                        </span>
                        <span className="record">
                          {numberOrMissing(standing.wins)}–
                          {numberOrMissing(standing.losses)}
                        </span>
                      </span>
                    </div>
                  </th>
                  <ProbabilityCell
                    className="direct"
                    label="Playoff確率"
                    value={probability?.directPlayoffs}
                  />
                  {[0, 1, 2, 3, 4, 5].map((position) => (
                    <ProbabilityCell
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
            <tr>
              <th className="missing-row" scope="row" colSpan={8}>
                欠損
              </th>
            </tr>
          )}
        </tbody>
    </table>
  );
}

function LoadingState() {
  return (
    <div className="event-state" role="status" aria-live="polite">
      <p>通過確率を読み込んでいます</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="event-state error-state" role="alert" aria-live="assertive">
      <h2>データを取得できません</h2>
      <p>集計データを取得できませんでした。</p>
      <button type="button" className="retry-button" onClick={onRetry}>
        再試行
      </button>
    </div>
  );
}

function EventPanel({
  activeGroup,
  eventId,
  onGroupSelect,
  payload,
  state,
  onRetry
}: {
  activeGroup: GroupId;
  eventId: string;
  onGroupSelect: (group: GroupId) => void;
  payload: ApiPayload | null;
  state: LoadState;
  onRetry: () => void;
}) {
  return (
    <section
      id={`tournament-panel-${eventId}`}
      role="tabpanel"
      aria-labelledby={`tournament-tab-${eventId}`}
      tabIndex={0}
    >
      <div className="group">
        <div className="group-head">
          <GroupTabs
            activeGroup={activeGroup}
            eventId={eventId}
            onSelect={onGroupSelect}
          />
        </div>
        {GROUPS.map((group) => (
          <div
            key={group}
            className="group-panel"
            id={`${eventId}-group-panel-${group}`}
            role="tabpanel"
            aria-labelledby={`${eventId}-group-tab-${group}`}
            tabIndex={0}
            hidden={activeGroup !== group}
          >
            {state === "loading" ? <LoadingState /> : null}
            {state === "error" ? <ErrorState onRetry={onRetry} /> : null}
            {state === "success" && payload ? (
              <ProbabilityTable
                group={group}
                payload={payload}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="about-page" aria-labelledby="about-title">
      <div className="reading-column">
        <section className="about-section">
          <h2 id="about-title">この数字が何か</h2>
          <p>
            残っている試合の勝敗をすべて五分（50%）と置き、グループの全試合を
            100,000回くり返し組み立て直したときに、各チームがその順位で終わった割合です。
            予想ではなく、今の勝敗表から機械的に数えた結果です。
          </p>
        </section>
        <section className="about-section">
          <h2>順位が決めるもの</h2>
          <p>
            このグループステージで敗退するチームはありません。12チーム全員が次へ進み、
            順位はどこから始めるかだけを決めます。
          </p>
          <dl className="placement-list">
            <dt>1位</dt>
            <dd>Playoffs Upper Bracket 準決勝へ bye</dd>
            <dt>2位</dt>
            <dd>Playoffs Upper Bracket 1回戦</dd>
            <dt>3・4位</dt>
            <dd>Play-In Upper Bracket 2回戦</dd>
            <dt>5・6位</dt>
            <dd>Play-In Upper Bracket 1回戦</dd>
          </dl>
        </section>
        <section className="about-section">
          <h2>同率のとき</h2>
          <p>
            公式規定の順で判定します。3チーム以上が並んだ場合は、上位と判定できたチームを
            切り離し、残りをひとつの組として最初の基準からやり直します。
          </p>
          <ol className="tie-list">
            <li>
              <span className="tie-index">①</span>
              <span>直接対決の勝敗</span>
            </li>
            <li>
              <span className="tie-index">②</span>
              <span>直接対決のマップ差</span>
            </li>
            <li>
              <span className="tie-index">③</span>
              <span>直接対決のラウンド差</span>
            </li>
            <li>
              <span className="tie-index">④</span>
              <span>マップ差</span>
            </li>
            <li>
              <span className="tie-index">⑤</span>
              <span>ラウンド差</span>
            </li>
          </ol>
        </section>
        <section className="about-section">
          <h2>正確でないところ</h2>
          <p>
            残り試合を一律50%としているため実力差が反映されません。マップ数とラウンド数の
            生成も簡略化しており、同率の判定に影響します。分析用途には向きません。
          </p>
        </section>
        <section className="about-section">
          <h2>出典</h2>
          <p className="source-note">
            <a
              href="https://liquipedia.net/valorant/VCT/2026/Pacific_League/Stage_2"
              target="_blank"
              rel="noreferrer"
            >
              Liquipedia VALORANT Wiki
            </a>
            （CC BY-SA 3.0）。Riot Games、VALORANT Esports、Liquipediaとは無関係の非公式サイトです。
          </p>
        </section>
      </div>
    </section>
  );
}

function PublicPage() {
  const [view, setView] = useState<PublicView>(readPublicView);
  const [activeEvent, setActiveEvent] = useState<string>(EVENT_ID);
  const [activeGroup, setActiveGroup] = useState<GroupId>("alpha");
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");

    void fetch(`${API_BASE}/api/events/${EVENT_ID}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const body: unknown = await response.json();
        return (isRecord(body) ? body : {}) as ApiPayload;
      })
      .then((nextPayload) => {
        setPayload(nextPayload);
        setState("success");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setPayload(null);
        setState("error");
      });

    return () => controller.abort();
  }, [retryCount]);

  useEffect(() => {
    const handlePopState = () => setView(readPublicView());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const changeView = (nextView: PublicView) => {
    const nextUrl = new URL(window.location.href);
    if (nextView === "about") nextUrl.searchParams.set("page", "about");
    else nextUrl.searchParams.delete("page");
    window.history.pushState({}, "", nextUrl);
    setView(nextView);
    window.scrollTo(0, 0);
  };

  const retry = () => {
    setPayload(null);
    setState("loading");
    setRetryCount((count) => count + 1);
  };

  return (
    <main className="stage">
      <section className="canvas v5">
        <SiteMasthead view={view} onViewChange={changeView} />
        {view === "about" ? (
          <AboutPage />
        ) : (
          <>
            <TournamentTabs
              activeEvent={activeEvent}
              onSelect={setActiveEvent}
            />
            {EVENTS.map((event) => (
              <div key={event.id} hidden={activeEvent !== event.id}>
                <EventPanel
                  activeGroup={activeGroup}
                  eventId={event.id}
                  onGroupSelect={setActiveGroup}
                  onRetry={retry}
                  payload={event.id === EVENT_ID ? payload : null}
                  state={event.id === EVENT_ID ? state : "error"}
                />
              </div>
            ))}
            <p className="font-credit">
              書体: Public Sans（英字・記号）＋ Work Sans（数字） / SIL Open Font License 1.1
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function AdminRoute() {
  const [AdminPage, setAdminPage] = useState<(() => ReactNode) | null>(null);

  useEffect(() => {
    let mounted = true;
    void import("./AdminPage").then(({ AdminPage: nextAdminPage }) => {
      if (mounted) setAdminPage(() => nextAdminPage);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!AdminPage) {
    return (
      <main className="stage">
        <section className="canvas v5">
          <header className="masthead">
            <div className="masthead-title">
              <h1>VCT QUALIFICATION</h1>
            </div>
          </header>
          <div className="event-state" role="status" aria-live="polite">
            <p>管理者ページを読み込んでいます</p>
          </div>
        </section>
      </main>
    );
  }

  return <AdminPage />;
}

export function App() {
  if (
    __ENABLE_ADMIN_PAGE__ &&
    (window.location.pathname === "/admin" ||
      window.location.pathname === "/admin/")
  ) {
    return <AdminRoute />;
  }

  return <PublicPage />;
}
