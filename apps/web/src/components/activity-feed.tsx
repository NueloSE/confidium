"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Inbox,
  Loader2,
  Lock,
  Package,
  PackageOpen,
  RefreshCw,
} from "lucide-react";
import { TokenIcon } from "@/components/token-icon";
import { cn } from "@/components/ui/cn";
import type { ActivityItem, ActivityKind } from "@/app/api/activity/route";

const KIND: Record<ActivityKind, { label: string; Icon: typeof Package; dir: "in" | "out" }> = {
  wrap: { label: "Wrapped", Icon: Package, dir: "in" },
  unwrap: { label: "Unwrapped", Icon: PackageOpen, dir: "out" },
  send: { label: "Sent", Icon: ArrowUpRight, dir: "out" },
  receive: { label: "Received", Icon: ArrowDownLeft, dir: "in" },
};

const EXPLORER = "https://sepolia.etherscan.io";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function relTime(ts: number | null): string {
  if (!ts) return "";
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

const FILTERS: { key: ActivityKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wrap", label: "Wrapped" },
  { key: "unwrap", label: "Unwrapped" },
  { key: "send", label: "Sent" },
  { key: "receive", label: "Received" },
];

/** Day bucket for grouping (items arrive newest-first). */
function bucketOf(ts: number | null): string {
  if (!ts) return "Earlier";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  if (ts >= startToday) return "Today";
  if (ts >= startToday - 86400) return "Yesterday";
  if (ts >= startToday - 7 * 86400) return "This week";
  return "Earlier";
}

export function ActivityFeed() {
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityKind | "all">("all");
  const [limit, setLimit] = useState(12);

  const cacheKey = address ? `confidium.activity.${address.toLowerCase()}` : null;

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/activity?user=${address}`);
      const json = (await res.json()) as { items?: ActivityItem[]; error?: string };
      const next = json.items ?? [];
      setItems(next);
      try {
        localStorage.setItem(`confidium.activity.${address.toLowerCase()}`, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      if (json.error) setError(json.error);
    } catch {
      setError("Couldn't load your activity.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Show the last cached feed instantly, then refresh in the background — the on-chain
  // reconstruction can take 10-15s on public RPCs, so we don't block the UI on it.
  useEffect(() => {
    if (!cacheKey) {
      setItems([]);
      return;
    }
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setItems(JSON.parse(cached) as ActivityItem[]);
    } catch {
      /* ignore */
    }
    void load();
  }, [cacheKey, load]);

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-8 text-center text-sm text-zinc-400">
        Connect your wallet to see your confidential activity.
      </div>
    );
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const visible = filtered.slice(0, limit);
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of visible) {
    const b = bucketOf(item.timestamp);
    const g = groups[groups.length - 1];
    if (g && g.label === b) g.items.push(item);
    else groups.push({ label: b, items: [item] });
  }
  const filterLabel = FILTERS.find((f) => f.key === filter)?.label ?? "";

  return (
    <div className="rounded-2xl border border-hairline bg-surface">
      {/* Toolbar: filter pills + refresh */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2.5 sm:px-4">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setLimit(12);
              }}
              aria-current={filter === f.key ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150",
                filter === f.key
                  ? "bg-accent-soft text-accent-hover"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          aria-label="Refresh"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-elevated disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="divide-y divide-hairline">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <Inbox className="h-6 w-6 text-zinc-600" />
          <p className="text-sm text-zinc-400">No recent activity.</p>
          <p className="text-xs text-zinc-600">
            Wrap, unwrap, or send a confidential token to see it here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <Inbox className="h-6 w-6 text-zinc-600" />
          <p className="text-sm text-zinc-400">No {filterLabel.toLowerCase()} activity yet.</p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-xs font-medium text-accent-hover transition-colors hover:text-accent"
          >
            Show all
          </button>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label}>
              <div className="border-b border-hairline bg-surface-2/30 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {group.label}
              </div>
              <ul className="divide-y divide-hairline">
                {group.items.map((item, i) => {
                  const k = KIND[item.kind];
                  return (
                    <li key={`${item.txHash}-${i}`} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="relative">
                        <TokenIcon address={item.wrapper} symbol={item.symbol} size="md" />
                        <span
                          className={cn(
                            "absolute -bottom-1 -left-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-surface",
                            k.dir === "in" ? "bg-success text-black" : "bg-surface-2 text-zinc-300",
                          )}
                        >
                          <k.Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-100">
                          <span className="font-medium">{k.label}</span>
                          <span className="text-zinc-400">{item.symbol}</span>
                        </div>
                        <div className="mt-0.5 truncate font-mono text-xs text-zinc-500">
                          {item.counterparty
                            ? `${item.kind === "send" ? "to" : "from"} ${short(item.counterparty)}`
                            : item.kind === "wrap"
                              ? "from your ERC-20"
                              : "to your ERC-20"}
                        </div>
                      </div>

                      <span className="hidden items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-zinc-400 sm:inline-flex">
                        <Lock className="h-3 w-3" /> encrypted
                      </span>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-zinc-500">{relTime(item.timestamp)}</span>
                        <a
                          href={`${EXPLORER}/tx/${item.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-200"
                        >
                          tx <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {visible.length < filtered.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + 12)}
          className="w-full border-t border-hairline px-5 py-3 text-xs font-medium text-accent-hover transition-colors hover:bg-white/5 hover:text-accent"
        >
          Show {filtered.length - limit} more
        </button>
      )}

      {error && items.length === 0 && (
        <p className="border-t border-hairline px-5 py-3 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
