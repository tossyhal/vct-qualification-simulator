// PROTOTYPE — throwaway.
import type { EventPayload } from "@vct-sim/shared";
import { GROUPS, destinationOf, pct, pctFull, rowsFor } from "./shared";
import { Legend } from "./VariantA";

export const nameB = "分布バー";

/**
 * 案B: 各チームの順位分布を1本の積み上げバーで見せる。
 * 列は「チーム／分布／直通」の3つだけなので、狭い画面でも列が潰れない。
 * 正確な値はバー内のラベルとtitleで補う。
 */
export function VariantB({ payload }: { payload: EventPayload }) {
  return (
    <div className="pv pv-b">
      {GROUPS.map((group) => (
        <section key={group} className="pv-group">
          <h2>Group {group === "alpha" ? "Alpha" : "Omega"}</h2>
          <table className="pv-table">
            <thead>
              <tr>
                <th scope="col" className="pv-rank">#</th>
                <th scope="col" className="pv-team">チーム</th>
                <th scope="col">順位の分布（1位 → 6位）</th>
                <th scope="col" className="pv-direct">直通</th>
              </tr>
            </thead>
            <tbody>
              {rowsFor(payload, group).map(({ rank, team, standing, probability }) => (
                <tr key={team.id}>
                  <td className="pv-rank">{rank}</td>
                  <th scope="row" className="pv-team">
                    <span className="pv-name-long">{team.name}</span>
                    <span className="pv-name-short">{team.shortName}</span>
                    <small>{standing.wins}-{standing.losses}</small>
                  </th>
                  <td className="pv-bar-cell">
                    <div className="pv-bar">
                      {probability.positions.map((value, index) => (
                        <div
                          key={index}
                          className="pv-seg"
                          data-position={index + 1}
                          style={{ flexGrow: value }}
                          title={`${index + 1}位 ${pctFull(value)}／${destinationOf(index).label}`}
                        >
                          <span className="pv-seg-label">
                            {value >= 0.12 ? `${index + 1}位 ${pct(value)}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    <ol className="pv-sr-list">
                      {probability.positions.map((value, index) => (
                        <li key={index}>
                          {index + 1}位 {pctFull(value)}
                        </li>
                      ))}
                    </ol>
                  </td>
                  <td className="pv-direct">{pct(probability.directPlayoffs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <Legend />
    </div>
  );
}
