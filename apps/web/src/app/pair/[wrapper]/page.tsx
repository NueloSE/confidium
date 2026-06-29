import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAddress } from "viem";
import { enrichPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { AddressChip } from "@/components/address-chip";
import { BadgePill } from "@/components/badge";
import { TokenIcon } from "@/components/token-icon";
import { PairActions } from "@/components/pair-actions";
import { PairSwitcher } from "@/components/pair-switcher";
import { PendingUnwraps } from "@/components/pending-unwraps";
import { InfoTip } from "@/components/ui/tooltip";
import { getServerClient } from "@/lib/clients";
import { toUiPair } from "@/lib/pair";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

const EXPLORER = "https://sepolia.etherscan.io";

/** Compact rate label — e.g. "1000000000000" → "1e12", "1" → "1:1". */
function formatRate(rate: string | null): string {
  if (!rate) return "—";
  if (rate === "1") return "1:1";
  return `1e${rate.length - 1}`;
}

function Meta({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">
        {help ? (
          <InfoTip label={help}>
            <span className="cursor-default decoration-dotted underline-offset-2 hover:underline">
              {label}
            </span>
          </InfoTip>
        ) : (
          label
        )}
      </span>
      <span className="text-sm text-zinc-200">{children}</span>
    </div>
  );
}

export default async function PairPage({
  params,
  searchParams,
}: {
  params: Promise<{ wrapper: string }>;
  searchParams: Promise<{ u?: string }>;
}) {
  const { wrapper } = await params;
  const { u } = await searchParams;

  let target: `0x${string}` | null = null;
  try {
    target = getAddress(wrapper);
  } catch {
    target = null;
  }
  if (!target) notFound();

  const { pairs } = await getPairsCached(SEPOLIA_CHAIN_ID);
  let pair = pairs.find((p) => p.wrapper.toLowerCase() === target.toLowerCase());

  // Custom pair (added via the in-app form / shared link) carries its underlying as ?u=.
  if (!pair && u) {
    try {
      const underlying = getAddress(u);
      const [enriched] = await enrichPairs(getServerClient(SEPOLIA_CHAIN_ID), [
        { chainId: SEPOLIA_CHAIN_ID, underlying, wrapper: target, isValid: true, source: "custom" },
      ]);
      if (enriched) pair = toUiPair(enriched);
    } catch {
      /* fall through to notFound */
    }
  }

  if (!pair) notFound();

  const symbol = pair.wrapperMeta.symbol ?? "Pair";

  const switcherPairs = pairs.map((p) => ({
    wrapper: p.wrapper,
    symbol: p.wrapperMeta.symbol,
    name: p.wrapperMeta.name,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/registry"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:border-hairline-strong hover:bg-elevated hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          All pairs
        </Link>
        {switcherPairs.length > 0 && (
          <PairSwitcher
            pairs={switcherPairs}
            current={pair.wrapper}
            currentSymbol={pair.wrapperMeta.symbol}
          />
        )}
      </div>

      {/* Token header */}
      <div className="mt-5 rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-start gap-4">
          <TokenIcon address={pair.wrapper} symbol={pair.wrapperMeta.symbol} size="lg" confidential />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{symbol}</h1>
              <BadgePill badge={pair.badge} />
            </div>
            <p className="mt-1 truncate text-sm text-zinc-400">
              {pair.wrapperMeta.name ?? "Confidential ERC-7984 token"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-hairline pt-5 sm:grid-cols-2">
          <Meta
            label="Confidential (ERC-7984)"
            help="The confidential wrapper. Balances and transfers are encrypted on-chain."
          >
            <AddressChip address={pair.wrapper} explorerBase={EXPLORER} />
          </Meta>
          <Meta label="Underlying (ERC-20)" help="The standard token this wrapper represents.">
            <AddressChip address={pair.underlying} explorerBase={EXPLORER} />
          </Meta>
          <Meta label="Decimals">
            <span className="font-mono">{pair.wrapperMeta.decimals ?? "—"}</span>
          </Meta>
          <Meta
            label="Rate"
            help={
              pair.rate && pair.rate !== "1"
                ? `1 confidential unit = ${pair.rate} underlying base units (6-decimal conversion).`
                : "Confidential units per underlying base unit."
            }
          >
            <span className="font-mono">{formatRate(pair.rate)}</span>
          </Meta>
        </div>
      </div>

      <div className="mt-6">
        <PairActions pair={pair} />
        <PendingUnwraps
          wrapper={pair.wrapper as `0x${string}`}
          symbol={pair.underlyingMeta.symbol ?? "token"}
        />
      </div>
    </main>
  );
}
