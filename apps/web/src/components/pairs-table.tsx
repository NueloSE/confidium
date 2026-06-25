"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { UiPair } from "@/lib/pair";
import { BadgePill } from "./badge";
import { AddressChip } from "./address-chip";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

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
  if (!rate) return { text: "—", title: "" };
  if (rate === "1") return { text: "1:1", title: "1 confidential unit = 1 underlying token" };
  return {
    text: `1e${rate.length - 1}`,
    title: `1 confidential unit = ${rate} underlying base units (6-decimal conversion)`,
  };
}

export function PairsTable({ pairs }: { pairs: UiPair[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? pairs.filter((p) => matches(p, term)) : pairs;
  }, [pairs, query]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by symbol, name, or address…"
          className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <span className="shrink-0 text-xs text-neutral-500">
          {filtered.length} of {pairs.length} pairs
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-900">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-900 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3 font-medium">Confidential</th>
              <th className="px-4 py-3 font-medium">Underlying</th>
              <th className="px-4 py-3 font-medium">Dec</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Wrapper</th>
              <th className="px-4 py-3 font-medium">Underlying addr</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.wrapper}
                className="border-b border-neutral-900/60 transition hover:bg-neutral-900/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pair/${p.wrapper}`}
                      className="font-medium text-neutral-100 hover:underline"
                    >
                      {p.wrapperMeta.symbol ?? "—"}
                    </Link>
                    <BadgePill badge={p.badge} />
                  </div>
                  <div className="text-xs text-neutral-500">{p.wrapperMeta.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-neutral-300">{p.underlyingMeta.symbol ?? "—"}</div>
                  <div className="text-xs text-neutral-500">{p.underlyingMeta.name}</div>
                </td>
                <td className="px-4 py-3 text-neutral-400">{p.wrapperMeta.decimals ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400" title={rateLabel(p.rate).title}>
                  {rateLabel(p.rate).text}
                </td>
                <td className="px-4 py-3">
                  <AddressChip address={p.wrapper} explorerBase={SEPOLIA_EXPLORER} />
                </td>
                <td className="px-4 py-3">
                  <AddressChip address={p.underlying} explorerBase={SEPOLIA_EXPLORER} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span title="ERC-165 supportsInterface">
                      {p.supports7984 ? "✓ 7984" : "✗ 7984"}
                    </span>
                    <span title="Registry bidirectional match">
                      {p.bidirectionalOk ? "✓ link" : "✗ link"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-500">
                  No pairs match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
