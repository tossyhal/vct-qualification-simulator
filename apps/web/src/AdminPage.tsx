import { useEffect, useRef, useState } from "react";

type AdminState = "success" | "unchanged" | "failure" | "running";
type ManualResult = Exclude<AdminState, "running"> | null;

const ADMIN_STATE_DATA: Record<
  AdminState,
  {
    label: string;
    summary: string;
    start: string;
    end: string;
    duration: string;
    error: string;
  }
> = {
  success: {
    label: "成功",
    summary: "最新の取得とシミュレーション生成が完了しています。",
    start: "2026-08-12 06:00:00 JST",
    end: "2026-08-12 06:00:12 JST",
    duration: "12.4秒",
    error: "なし"
  },
  unchanged: {
    label: "変更なし",
    summary: "取得元を確認しましたが、新しいスナップショットはありません。",
    start: "2026-08-11 06:00:00 JST",
    end: "2026-08-11 06:00:04 JST",
    duration: "4.1秒",
    error: "なし"
  },
  failure: {
    label: "失敗",
    summary: "更新ジョブがスナップショットの取得途中で停止しています。",
    start: "2026-08-10 06:00:00 JST",
    end: "2026-08-10 06:00:09 JST",
    duration: "9.0秒",
    error: "スナップショットの取得に失敗しました。"
  },
  running: {
    label: "実行中",
    summary: "手動更新を実行しています。完了するまでこの操作は使えません。",
    start: "2026-08-12 06:15:00 JST",
    end: "—",
    duration: "実行中",
    error: "—"
  }
};

function AdminMasthead() {
  return (
    <header className="masthead">
      <div className="masthead-title">
        <h1>VCT QUALIFICATION</h1>
      </div>
      <nav className="page-nav" aria-label="ページ">
        <a className="page-link" href="/">
          公開ページ
        </a>
      </nav>
    </header>
  );
}

function AdminStatusBadge({ state }: { state: AdminState }) {
  return (
    <span className="status-badge" data-state={state}>
      {ADMIN_STATE_DATA[state].label}
    </span>
  );
}

function AdminJobRow({ state, current }: { state: AdminState; current: boolean }) {
  const data = ADMIN_STATE_DATA[state];

  return (
    <li className={`job-row${current ? " current" : ""}`}>
      <div className="job-row-header">
        <strong>更新ジョブ</strong>
        <AdminStatusBadge state={state} />
      </div>
      <dl className="job-details">
        <div>
          <dt>開始時刻</dt>
          <dd>{data.start}</dd>
        </div>
        <div>
          <dt>終了時刻</dt>
          <dd>{data.end}</dd>
        </div>
        <div>
          <dt>実行時間</dt>
          <dd>{data.duration}</dd>
        </div>
        <div>
          <dt>エラー概要</dt>
          <dd>{data.error}</dd>
        </div>
      </dl>
    </li>
  );
}

export function AdminPage() {
  const [adminState, setAdminState] = useState<AdminState>("success");
  const [manualResult, setManualResult] = useState<ManualResult>(null);
  const timerRef = useRef<number | null>(null);
  const data = ADMIN_STATE_DATA[adminState];
  const updateDisabled = adminState === "running";
  const historyStates = [
    adminState,
    "success",
    "unchanged",
    "failure"
  ].filter((state, index, states) => states.indexOf(state) === index) as AdminState[];

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const runManualUpdate = () => {
    if (updateDisabled) return;
    if (!window.confirm("最新データを取り込みます。実行しますか？")) return;

    setAdminState("running");
    setManualResult(null);
    timerRef.current = window.setTimeout(() => {
      setAdminState("success");
      setManualResult("success");
      timerRef.current = null;
    }, 1200);
  };

  const manualMessage = updateDisabled
    ? "実行中です。完了するまで再度実行できません。"
    : manualResult === "success"
      ? "実行結果：成功。最新スナップショットとシミュレーションを更新しました。"
      : manualResult === "unchanged"
        ? "実行結果：変更なし。公開データはそのままです。"
        : manualResult === "failure"
          ? "実行結果：失敗。エラー概要を確認してから再試行してください。"
          : "実行前に確認を表示します。";

  return (
    <main className="stage">
      <section className="canvas v5">
        <AdminMasthead />
        <section className="admin-page" aria-labelledby="admin-title">
          <div className="admin-heading">
            <h2 id="admin-title">管理者ページ</h2>
          </div>

          <section className="admin-block" aria-labelledby="latest-job-title">
            <div className="admin-block-heading">
              <h3 id="latest-job-title">直近の更新</h3>
              <AdminStatusBadge state={adminState} />
            </div>
            <p className="admin-summary">{data.summary}</p>
            {adminState === "failure" ? (
              <>
                <p className="error-summary">
                  <strong>エラー概要</strong>
                  {data.error}
                </p>
                <p className="next-step">
                  次にすること：取得元の更新を確認し、必要なら手動更新を再実行してください。
                  秘密情報や外部レスポンスは表示しません。
                </p>
              </>
            ) : null}
          </section>

          <section className="admin-block" aria-labelledby="job-history-title">
            <h3 id="job-history-title">更新ジョブの履歴</h3>
            <ul className="job-list">
              {historyStates.map((historyState, index) => (
                <AdminJobRow
                  key={historyState}
                  state={historyState}
                  current={index === 0}
                />
              ))}
            </ul>
          </section>

          <section className="admin-block" aria-labelledby="snapshot-title">
            <h3 id="snapshot-title">最新スナップショット</h3>
            <dl className="metadata-grid">
              <div>
                <dt>取得日時</dt>
                <dd>2026-08-12 06:00:11 JST</dd>
              </div>
              <div>
                <dt>source revision</dt>
                <dd>2026-08-12-stage2</dd>
              </div>
              <div>
                <dt>content hash</dt>
                <dd>sha256: 7b2f9c1d…a48e</dd>
              </div>
            </dl>
          </section>

          <section className="admin-block" aria-labelledby="simulation-title">
            <h3 id="simulation-title">最新シミュレーション</h3>
            <dl className="metadata-grid">
              <div>
                <dt>生成日時</dt>
                <dd>2026-08-12 06:00:24 JST</dd>
              </div>
              <div>
                <dt>seed</dt>
                <dd>pacific-s2-20260812</dd>
              </div>
              <div>
                <dt>iterations</dt>
                <dd>100,000</dd>
              </div>
              <div>
                <dt>実行時間</dt>
                <dd>11.8秒</dd>
              </div>
            </dl>
          </section>

          <section className="admin-block" aria-labelledby="manual-title">
            <h3 id="manual-title">手動更新</h3>
            <p className="admin-summary">
              最新データを取得し、変更があればシミュレーションを生成します。実行前に確認を挟みます。
            </p>
            <button
              type="button"
              className="manual-update"
              disabled={updateDisabled}
              onClick={runManualUpdate}
            >
              {updateDisabled ? "取り込み中…" : "手動で取り込む"}
            </button>
            <p className="manual-status" aria-live="polite">
              {manualMessage}
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}
