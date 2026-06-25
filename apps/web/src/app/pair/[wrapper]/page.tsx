import Link from "next/link";
import { notFound } from "next/navigation";
import { getAddress } from "viem";
import { enrichPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { AddressChip } from "@/components/address-chip";
import { BadgePill } from "@/components/badge";
import { PairActions } from "@/components/pair-actions";
import { getServerClient } from "@/lib/clients";
import { toUiPair } from "@/lib/pair";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

const EXPLORER = "https://sepolia.etherscan.io";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-200">{children}</span>
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-xs text-neutral-500 transition hover:text-neutral-300">
        ← All pairs
      </Link>

      <div className="mb-6 mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{pair.wrapperMeta.symbol ?? "Pair"}</h1>
        <BadgePill badge={pair.badge} />
      </div>

      <div className="mb-6 grid gap-2 rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 text-sm">
        <Row label="Confidential (ERC-7984)">
          <AddressChip address={pair.wrapper} explorerBase={EXPLORER} />
        </Row>
        <Row label="Underlying (ERC-20)">
          <AddressChip address={pair.underlying} explorerBase={EXPLORER} />
        </Row>
        <Row label="Decimals">{pair.wrapperMeta.decimals ?? "—"}</Row>
        <Row label="Rate">{pair.rate ?? "—"}</Row>
      </div>

      <PairActions pair={pair} />
    </main>
  );
}
