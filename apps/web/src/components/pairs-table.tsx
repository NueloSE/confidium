"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Search, X } from "lucide-react";
import type { UiPair } from "@/lib/pair";
import { BadgePill } from "./badge";
import { AddressChip } from "./address-chip";
import { Input } from "./ui/input";
import { InfoTip } from "./ui/tooltip";
import { cn } from "./ui/cn";

function matches(p: UiPair, term: string): boolean {
  const fields = [
    p.wrapperMeta.symbol,
    p.wrapperMeta.name,
    p.underlyingMeta.symbol,
    p.underlyingMeta.name,
    p.wrapper,
    p.underlying,
  ];
  return fields.some((v) => v?.toLowerCase().includes(term));
}

function rateLabel(rate: string | null): { text: string; title: string } {
  if (!rate) return { text: "—", title: "Conversion rate unavailable" };
  if (rate === "1") return { text: "1:1", title: "1 confidential unit = 1 underlying token" };
  return {
    text: `1e${rate.length - 1}`,
    title: `1 confidential unit = ${rate} underlying base units (6-decimal conversion)`,
  };
}

/** Pass/fail verification indicator with an explanatory tooltip. */
function Verify({ ok, label, help }: { ok: boolean; label: string; help: string }) {
  return (
    <InfoTip label={help}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
          ok ? "bg-success-soft text-success ring-success/20" : "bg-danger-soft text-danger ring-danger/20",
        )}
      >
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {label}
      </span>
    </InfoTip>
  );
}

const th = "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500";
const thNum = "px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500";

export function PairsTable({
  pairs,
  explorerBase,
  linkDetails,
}: {
  pairs: UiPair[];
  explorerBase: string;
  linkDetails: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? pairs.filter((p) => matches(p, term)) : pairs;
  }, [pairs, query]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol, name, or address…"
            aria-label="Search pairs"
            className="pl-9"
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {filtered.length}
          <span className="text-zinc-600"> / {pairs.length}</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface/95 backdrop-blur">
              <th className={cn(th, "sticky top-14 z-10 bg-surface/95")}>Confidential</th>
              <th className={cn(th, "sticky top-14 z-10 bg-surface/95")}>Underlying</th>
              <th className={cn(thNum, "sticky top-14 z-10 hidden bg-surface/95 lg:table-cell")}>Dec</th>
              <th className={cn(thNum, "sticky top-14 z-10 hidden bg-surface/95 sm:table-cell")}>Rate</th>
              <th className={cn(th, "sticky top-14 z-10 hidden bg-surface/95 md:table-cell")}>Wrapper</th>
              <th className={cn(th, "sticky top-14 z-10 hidden bg-surface/95 lg:table-cell")}>Underlying addr</th>
              <th className={cn(th, "sticky top-14 z-10 hidden bg-surface/95 md:table-cell")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.wrapper}
                className="group border-b border-hairline/60 transition-colors duration-150 last:border-0 hover:bg-white/2.5"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {linkDetails ? (
                      <Link
                        href={`/pair/${p.wrapper}`}
                        className="inline-flex items-center gap-1 font-medium text-zinc-100 transition-colors hover:text-accent-hover"
                      >
                        {p.wrapperMeta.symbol ?? "—"}
                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-100">{p.wrapperMeta.symbol ?? "—"}</span>
                    )}
                    <BadgePill badge={p.badge} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{p.wrapperMeta.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-zinc-300">{p.underlyingMeta.symbol ?? "—"}</div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{p.underlyingMeta.name}</div>
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 lg:table-cell">
                  {p.wrapperMeta.decimals ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <InfoTip label={rateLabel(p.rate).title}>
                    <span className="cursor-default font-mono text-zinc-400">{rateLabel(p.rate).text}</span>
                  </InfoTip>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <AddressChip address={p.wrapper} explorerBase={explorerBase} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <AddressChip address={p.underlying} explorerBase={explorerBase} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Verify
                      ok={p.supports7984}
                      label="7984"
                      help="Implements the ERC-7984 confidential-token interface (ERC-165 supportsInterface check)."
                    />
                    <Verify
                      ok={p.bidirectionalOk}
                      label="Link"
                      help="The registry's underlying↔wrapper mapping matches in both directions."
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <p className="text-sm text-zinc-300">No pairs match “{query}”.</p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-2 text-xs font-medium text-accent-hover transition-colors hover:text-accent"
                  >
                    Clear search
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
