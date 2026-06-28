"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, Check, Search, X } from "lucide-react";
import type { UiPair } from "@/lib/pair";
import { BadgePill } from "./badge";
import { TokenIcon } from "./token-icon";
import { AddressChip } from "./address-chip";
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
const cell = "px-4 py-3.5";

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
  const router = useRouter();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? pairs.filter((p) => matches(p, term)) : pairs;
  }, [pairs, query]);

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <div className="relative flex w-full max-w-sm items-center">
          <Search className="pointer-events-none absolute left-0 h-4 w-4 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol, name, or address…"
            aria-label="Search pairs"
            className="w-full bg-transparent pl-7 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {filtered.length}
          <span className="text-zinc-600"> / {pairs.length}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/40">
              <th className={th}>Confidential</th>
              <th className="hidden w-8 sm:table-cell" aria-hidden />
              <th className={th}>Underlying</th>
              <th className={cn(thNum, "hidden lg:table-cell")}>Dec</th>
              <th className={cn(thNum, "hidden sm:table-cell")}>Rate</th>
              <th className={cn(th, "hidden md:table-cell")}>Wrapper</th>
              <th className={cn(th, "hidden lg:table-cell")}>Underlying addr</th>
              <th className={cn(th, "hidden md:table-cell")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.wrapper}
                onClick={linkDetails ? () => router.push(`/pair/${p.wrapper}`) : undefined}
                className={cn(
                  "group border-b border-hairline/50 transition-colors duration-150 last:border-0 hover:bg-accent/5",
                  linkDetails && "cursor-pointer",
                )}
              >
                <td
                  className={cn(
                    cell,
                    "transition-shadow duration-150 group-hover:shadow-[inset_3px_0_0_0_var(--color-accent)]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon
                      address={p.wrapper}
                      symbol={p.wrapperMeta.symbol}
                      size="sm"
                      confidential
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {linkDetails ? (
                          <Link
                            href={`/pair/${p.wrapper}`}
                            className="inline-flex items-center gap-1 font-medium text-zinc-100 transition-colors hover:text-accent-hover"
                          >
                            {p.wrapperMeta.symbol ?? "—"}
                            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-accent-hover" />
                          </Link>
                        ) : (
                          <span className="font-medium text-zinc-100">
                            {p.wrapperMeta.symbol ?? "—"}
                          </span>
                        )}
                        <BadgePill badge={p.badge} />
                      </div>
                      <div className="truncate text-xs text-zinc-500">{p.wrapperMeta.name}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden text-center sm:table-cell">
                  <ArrowLeftRight
                    className="mx-auto h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-accent/70"
                    aria-label="wraps and unwraps"
                  />
                </td>
                <td className={cell}>
                  <div className="flex items-center gap-2.5">
                    <TokenIcon address={p.underlying} symbol={p.underlyingMeta.symbol} size="sm" />
                    <div className="min-w-0">
                      <div className="text-zinc-300">{p.underlyingMeta.symbol ?? "—"}</div>
                      <div className="truncate text-xs text-zinc-500">{p.underlyingMeta.name}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(cell, "hidden text-right font-mono text-zinc-400 lg:table-cell")}>
                  {p.wrapperMeta.decimals ?? "—"}
                </td>
                <td className={cn(cell, "hidden text-right sm:table-cell")}>
                  <InfoTip label={rateLabel(p.rate).title}>
                    <span className="cursor-default font-mono text-zinc-400">{rateLabel(p.rate).text}</span>
                  </InfoTip>
                </td>
                <td className={cn(cell, "hidden md:table-cell")}>
                  <AddressChip address={p.wrapper} explorerBase={explorerBase} />
                </td>
                <td className={cn(cell, "hidden lg:table-cell")}>
                  <AddressChip address={p.underlying} explorerBase={explorerBase} />
                </td>
                <td className={cn(cell, "hidden md:table-cell")}>
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
                <td colSpan={8} className="px-4 py-16 text-center">
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
