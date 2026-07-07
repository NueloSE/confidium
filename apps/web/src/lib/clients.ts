import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { MAINNET_CHAIN_ID, type SupportedChainId } from "@confidium/core";

function transportsFor(envUrl: string | undefined, ...publics: string[]) {
  const urls = [envUrl, ...publics].filter(Boolean) as string[];
  // env (if set) first, then reliable public endpoints, then viem's chain default.
  // Short timeout + no per-transport retries → a slow/misconfigured RPC fails over fast instead of
  // hanging (otherwise a bad primary RPC stalls log scans until the serverless function times out).
  const opts = { timeout: 4_000, retryCount: 0 } as const;
  return fallback([...urls.map((u) => http(u, opts)), http(undefined, opts)], { retryCount: 0 });
}

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: transportsFor(
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://11155111.rpc.thirdweb.com",
  ),
  batch: { multicall: true },
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: transportsFor(
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    "https://ethereum-rpc.publicnode.com",
    "https://1.rpc.thirdweb.com",
  ),
  batch: { multicall: true },
});

/** Server-side viem client for read paths (explorer/indexer). */
export function getServerClient(chainId: SupportedChainId): PublicClient {
  return (chainId === MAINNET_CHAIN_ID ? mainnetClient : sepoliaClient) as PublicClient;
}
