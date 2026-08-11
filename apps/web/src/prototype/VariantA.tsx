// PROTOTYPE — throwaway.
import type { EventPayload } from "@vct-sim/shared";
import { DESTINATIONS, GROUPS, destinationOf, pct, pctFull, rowsFor, weightOf } from "./shared";

export const nameA = "順位マトリクス";

/**
 * 案A: 1〜6位を列に置いた全マトリクス。現行に最も近い構造だが、
 * 狭い画面では短縮名と整数％で列数を保ったまま収める。
 */
export function VariantA({ payload }: { payload: EventPayload }) {
  return (
    <div className="pv pv-a">
      {GROUPS.map((group) => (
        <section key={group} className="pv-group">
          <h2>Group {group === "alpha" ? "Alpha" : "Omega"}</h2>
          <table className="pv-table">
            <thead>
              <tr>
                <th scope="col" className="pv-rank">#</th>
                <th scope="col" className="pv-team">チーム</th>
                <th scope="col" className="pv-direct">直通</th>
                {[1, 2, 3, 4, 5, 6].map((position) => (
                  <th key={position} scope="col" className="pv-num">
                    {position}
                    <span className="pv-dest-mark" aria-hidden="true">
                      {destinationOf(position - 1).mark}
                    </span>
                  </th>
                ))}
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
                  <td className="pv-direct" data-weight={weightOf(probability.directPlayoffs)}>
                    <span className="pv-sr">直通確率 </span>
                    {pct(probability.directPlayoffs)}
                  </td>
                  {probability.positions.map((value, index) => (
                    <td key={index} className="pv-num" data-weight={weightOf(value)}>
                      <span className="pv-sr">{index + 1}位 </span>
                      <span title={pctFull(value)}>{pct(value)}</span>
                    </td>
                  ))}
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

export function Legend() {
  return (
    <dl className="pv-legend">
      {DESTINATIONS.map((destination) => (
        <div key={destination.short}>
          <dt>
            <span aria-hidden="true">{destination.mark}</span>{" "}
            {destination.positions.map((p) => `${p + 1}位`).join("・")}
          </dt>
          <dd>{destination.label}</dd>
        </div>
      ))}
    </dl>
  );
}
