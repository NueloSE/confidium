import { NextResponse } from "next/server";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;
export const maxDuration = 60;

/**
 * tokenlists.org-compatible export of the verified confidential wrappers, so any other dApp can
 * import Confidium's canonical list with one URL. Official pairs only by default; ?include=mock
 * adds testnet mocks; ?chainId=11155111|1 narrows to one network.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeMock = searchParams.get("include") === "mock";
  const chainParam = searchParams.get("chainId");

  const chains: SupportedChainId[] =
    chainParam === "1"
      ? [MAINNET_CHAIN_ID]
      : chainParam === "11155111"
        ? [SEPOLIA_CHAIN_ID]
        : [SEPOLIA_CHAIN_ID, MAINNET_CHAIN_ID];

  const tokens: Array<Record<string, unknown>> = [];
  for (const chainId of chains) {
    const { pairs } = await getPairsCached(chainId);
    for (const p of pairs) {
      const include = p.badge === "official" || (includeMock && p.badge === "mock");
      if (!include) continue;
      tokens.push({
        chainId,
        address: p.wrapper,
        symbol: p.wrapperMeta.symbol ?? "",
        name: p.wrapperMeta.name ?? "",
        decimals: p.wrapperMeta.decimals ?? 6,
        tags: ["confidential", "erc7984", p.badge],
        extensions: { underlying: p.underlying },
      });
    }
  }

  return NextResponse.json({
    name: "Confidium Confidential Wrappers",
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: 0, patch: 0 },
    keywords: ["confidential", "erc7984", "fhevm", "zama"],
    tags: {
      confidential: { name: "Confidential", description: "ERC-7984 confidential fungible token" },
      erc7984: { name: "ERC-7984", description: "Implements the ERC-7984 interface (0x4958f2a4)" },
      official: { name: "Official", description: "In the official Zama Wrappers Registry" },
      mock: { name: "Mock", description: "Testnet mock token" },
    },
    tokens,
  });
}
