import { readFile } from "node:fs/promises";
import { simulateEvent } from "@vct-sim/shared";
import { parseLiquipediaHtml } from "../src/liquipedia";

const path = process.argv[2];
if (!path) throw new Error("Usage: vite-node scripts/validate-liquipedia.ts <response.json>");

const response = JSON.parse(await readFile(path, "utf8")) as {
  parse: { text: string; revid?: number };
};
const snapshot = parseLiquipediaHtml(response.parse.text, response.parse.revid);
const started = performance.now();
const simulation = simulateEvent(snapshot, 100_000, 42);
console.log(
  JSON.stringify(
    {
      matches: snapshot.matches.length,
      completed: snapshot.matches.filter((match) => match.status === "completed").length,
      scheduled: snapshot.matches.filter((match) => match.status === "scheduled").length,
      simulationMs: Math.round(performance.now() - started),
      probabilityRows: simulation.probabilities.length
    },
    null,
    2
  )
);
