// PROTOTYPE — throwaway.
import type { EventPayload } from "@vct-sim/shared";
import { useState } from "react";
import { DESTINATIONS, GROUPS, pct, pctFull, rowsFor, weightOf } from "./shared";

export const nameC = "行き先集約";

/**
 * 案C: 列を「順位」ではなく「行き先」の4区分にする。数値列が4つになるので
 * 狭い画面に余裕が出る。1〜6位の内訳は行を開いて見せる。
 */
export function VariantC({ payload }: { payload: EventPayload }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="pv pv-c">
      {GROUPS.map((group) => (
        <section key={group} className="pv-group">
          <h2>Group {group === "alpha" ? "Alpha" : "Omega"}</h2>
          <table className="pv-table">
            <thead>
              <tr>
                <th scope="col" className="pv-rank">#</th>
                <th scope="col" className="pv-team">チーム</th>
                {DESTINATIONS.map((destination) => (
                  <th key={destination.short} scope="col" className="pv-num">
                    <span className="pv-dest-head">{destination.short}</span>
                    <small>{destination.positions.map((p) => p + 1).join("・")}位</small>
                  </th>
                ))}
                <th scope="col" className="pv-toggle-head">
                  <span className="pv-sr">内訳</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsFor(payload, group).map(({ rank, team, standing, probability }) => {
                const open = openId === team.id;
                const totals = DESTINATIONS.map((destination) =>
                  destination.positions.reduce<number>(
                    (sum, position) => sum + (probability.positions[position] ?? 0),
                    0
                  )
                );
                return [
                  <tr key={team.id}>
                    <td className="pv-rank">{rank}</td>
                    <th scope="row" className="pv-team">
                      <span className="pv-name-long">{team.name}</span>
                      <span className="pv-name-short">{team.shortName}</span>
                      <small>{standing.wins}-{standing.losses}</small>
                    </th>
                    {totals.map((value, index) => (
                      <td key={index} className="pv-num" data-weight={weightOf(value)}>
                        <span className="pv-sr">{DESTINATIONS[index]!.label} </span>
                        {pct(value)}
                      </td>
                    ))}
                    <td className="pv-toggle-cell">
                      <button
                        type="button"
                        className="pv-toggle"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : team.id)}
                      >
                        <span className="pv-sr">{team.name}の順位内訳を</span>
                        {open ? "閉じる" : "内訳"}
                      </button>
                    </td>
                  </tr>,
                  open ? (
                    <tr key={`${team.id}-detail`} className="pv-detail-row">
                      <td colSpan={7}>
                        <ol className="pv-detail">
                          {probability.positions.map((value, index) => (
                            <li key={index}>
                              <span>{index + 1}位</span>
                              <strong>{pctFull(value)}</strong>
                            </li>
                          ))}
                        </ol>
                      </td>
                    </tr>
                  ) : null
                ];
              })}
            </tbody>
          </table>
        </section>
      ))}
      <dl className="pv-legend">
        {DESTINATIONS.map((destination) => (
          <div key={destination.short}>
            <dt>{destination.short}</dt>
            <dd>{destination.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
