// PROTOTYPE — throwaway. 「?variant=A|B|C」で情報構造の3案を切り替える。
// 「?data=final」で全試合消化済みの実データへ切り替える。
import type { EventPayload } from "@vct-sim/shared";
import { useEffect, useState } from "react";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { VariantA, nameA } from "./VariantA";
import { VariantB, nameB } from "./VariantB";
import { VariantC, nameC } from "./VariantC";
import "./prototype.css";

const VARIANTS = ["A", "B", "C"];
const LABELS: Record<string, string> = { A: nameA, B: nameB, C: nameC };

function useSearchParam(key: string, fallback: string) {
  const [value, setValue] = useState(
    () => new URLSearchParams(window.location.search).get(key) ?? fallback
  );
  const update = (next: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, next);
    window.history.replaceState(null, "", `?${params.toString()}`);
    setValue(next);
  };
  return [value, update] as const;
}

export function PrototypeApp() {
  const [variant, setVariant] = useSearchParam("variant", "A");
  const [dataset] = useSearchParam("data", "mid");
  const [payload, setPayload] = useState<EventPayload | null>(null);

  useEffect(() => {
    const file =
      dataset === "final" ? "/prototype-fixture-final.json" : "/prototype-fixture.json";
    fetch(file)
      .then((response) => response.json() as Promise<EventPayload>)
      .then(setPayload);
  }, [dataset]);

  if (!payload) return <p className="pv-loading">読み込み中</p>;

  return (
    <>
      <header className="pv-header">
        <p>VCT 2026</p>
        <h1>Pacific Stage 2 通過確率</h1>
        <p className="pv-note">
          {dataset === "final" ? "全30試合消化済み（実データ）" : "残り10試合の想定"}
        </p>
      </header>
      {variant === "A" && <VariantA payload={payload} />}
      {variant === "B" && <VariantB payload={payload} />}
      {variant === "C" && <VariantC payload={payload} />}
      <PrototypeSwitcher
        variants={VARIANTS}
        current={variant}
        labels={LABELS}
        onChange={setVariant}
      />
    </>
  );
}
