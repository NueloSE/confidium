/**
 * Validate the REAL @confidium/core read/verify code against live Sepolia.
 * Run: pnpm exec tsx scripts/spike-core.ts
 */
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { getEnrichedPairs, SEPOLIA_CHAIN_ID, BADGE_META } from "@confidium/core";

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || undefined),
});

async function main() {
  console.log("\n=== @confidium/core getEnrichedPairs(Sepolia) ===\n");
  const pairs = await getEnrichedPairs(client, SEPOLIA_CHAIN_ID);
  for (const p of pairs) {
    const b = BADGE_META[p.badge];
    console.log(
      `[${b.label.padEnd(10)}] ${(p.wrapperMeta.symbol ?? "?").padEnd(12)} ` +
        `(${p.wrapperMeta.decimals}d) <- ${(p.underlyingMeta.symbol ?? "?").padEnd(10)} ` +
        `(${p.underlyingMeta.decimals}d) rate=${p.rate} 7984=${p.supports7984} bidir=${p.bidirectionalOk}`,
    );
  }
  console.log(`\n${pairs.length} pairs enriched.\n`);
}

main().catch((e) => {
  console.error("CORE SPIKE FAILED:", e);
  process.exit(1);
});
