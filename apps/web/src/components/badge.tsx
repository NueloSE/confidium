import { BADGE_META, type Badge } from "@confidium/core";

const toneClasses: Record<string, string> = {
  good: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  bad: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function BadgePill({ badge }: { badge: Badge }) {
  const meta = BADGE_META[badge];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}
