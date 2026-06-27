import { getAddress } from "viem";
import { enrichPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { EmbedWidget } from "@/components/embed-widget";
import { getServerClient } from "@/lib/clients";
import { toUiPair } from "@/lib/pair";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-2xl border border-hairline bg-surface p-5 text-sm leading-relaxed text-zinc-400 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-zinc-300">
        {children}
      </div>
    </main>
  );
}

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; u?: string; action?: string }>;
}) {
  const { token, u, action } = await searchParams;

  let target: `0x${string}` | null = null;
  try {
    target = token ? getAddress(token) : null;
  } catch {
    target = null;
  }
  if (!target) {
    return <Notice>Pass a <code>?token=0x…</code> ERC-7984 address to embed the widget.</Notice>;
  }

  const { pairs } = await getPairsCached(SEPOLIA_CHAIN_ID);
  let pair = pairs.find((p) => p.wrapper.toLowerCase() === target.toLowerCase());

  // Custom pair: resolve from the provided underlying.
  if (!pair && u) {
    try {
      const underlying = getAddress(u);
      const [enriched] = await enrichPairs(getServerClient(SEPOLIA_CHAIN_ID), [
        { chainId: SEPOLIA_CHAIN_ID, underlying, wrapper: target, isValid: true, source: "custom" },
      ]);
      if (enriched) pair = toUiPair(enriched);
    } catch {
      /* fall through */
    }
  }

  if (!pair) {
    return (
      <Notice>
        Token not in the registry. Add <code>?u=0x…</code> (its underlying ERC-20) to embed a custom
        pair.
      </Notice>
    );
  }

  return <EmbedWidget pair={pair} defaultAction={action === "unwrap" ? "unwrap" : "wrap"} />;
}
