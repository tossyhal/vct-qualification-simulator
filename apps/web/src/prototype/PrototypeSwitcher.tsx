// PROTOTYPE — throwaway.
import { useEffect } from "react";

export function PrototypeSwitcher({
  variants,
  current,
  labels,
  onChange
}: {
  variants: string[];
  current: string;
  labels: Record<string, string>;
  onChange: (variant: string) => void;
}) {
  const index = Math.max(0, variants.indexOf(current));
  const step = (delta: number) =>
    onChange(variants[(index + delta + variants.length) % variants.length]!);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="pv-switcher">
      <button type="button" onClick={() => step(-1)} aria-label="前の案">
        ←
      </button>
      <span>
        {current} — {labels[current]}
      </span>
      <button type="button" onClick={() => step(1)} aria-label="次の案">
        →
      </button>
    </div>
  );
}
