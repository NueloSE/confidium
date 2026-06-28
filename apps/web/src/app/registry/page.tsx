import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Lock } from "lucide-react";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { PairsTable } from "@/components/pairs-table";
import { cn } from "@/components/ui/cn";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Registry — Confidium",
  description: "Every ERC-20 ↔ ERC-7984 pair in the Zama Wrappers Registry, read live from chain.",
};

function NetworkSegment({ isMainnet }: { isMainnet: boolean }) {
  const base = "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150";
  return (
    <div className="inline-flex rounded-lg border border-hairline bg-surface-2 p-1">
      <Link
        href="/registry"
        aria-current={!isMainnet ? "true" : undefined}
        className={cn(base, !isMainnet ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100")}
      >
        Sepolia
      </Link>
      <Link
        href="/registry?chain=mainnet"
        aria-current={isMainnet ? "true" : undefined}
        className={cn(base, isMainnet ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100")}
      >
        Ethereum
      </Link>
    </div>
  );
}

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain } = await searchParams;
  const isMainnet = chain === "mainnet" || chain === "1";
  const chainId: SupportedChainId = isMainnet ? MAINNET_CHAIN_ID : SEPOLIA_CHAIN_ID;
  const explorerBase = isMainnet ? "https://etherscan.io" : "https://sepolia.etherscan.io";

  const { pairs } = await getPairsCached(chainId);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <Boxes className="h-3.5 w-3.5" />
            Live registry
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              Confidential wrappers
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Live
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Every ERC-20 ↔ ERC-7984 pair on {isMainnet ? "Ethereum mainnet" : "Sepolia"}, read live
            from chain.{" "}
            {isMainnet
              ? "Mainnet is read-only — wrap, unwrap, and decrypt run on Sepolia."
              : "Open any pair to faucet, wrap, send, reveal, and unwrap."}
          </p>
        </div>
        <NetworkSegment isMainnet={isMainnet} />
      </div>

      {pairs.length === 0 ? (
        <div className="bg-dotgrid flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface/40 px-6 py-16 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-zinc-200">Reading the registry from chain…</p>
          <p className="max-w-xs text-xs text-zinc-500">
            This loads on-chain in one multicall. Refresh in a moment if it doesn’t appear.
          </p>
        </div>
      ) : (
        <PairsTable pairs={pairs} explorerBase={explorerBase} linkDetails={!isMainnet} />
      )}
    </main>
  );
}
