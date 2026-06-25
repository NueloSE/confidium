import type { Address, PublicClient } from "viem";
import { getAddress } from "viem";
import { erc20Abi, erc7984Abi, registryAbi } from "./abis";
import { ERC7984_INTERFACE_ID, REGISTRY_ADDRESS, type SupportedChainId } from "./chains";
import type { EnrichedPair, RegistryPair, TokenMeta } from "./types";
import { computeBadge, looksMock } from "./verify";

async function tryRead<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}

/** Read every pair from the on-chain registry (length + single slice). */
export async function readRegistryPairs(
  client: PublicClient,
  chainId: SupportedChainId,
): Promise<RegistryPair[]> {
  const registry = REGISTRY_ADDRESS[chainId];

  const length = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsLength",
  });
  if (length === 0n) return [];

  const raw = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsSlice",
    args: [0n, length],
  });

  return raw.map((p) => ({
    chainId,
    underlying: getAddress(p.tokenAddress),
    wrapper: getAddress(p.confidentialTokenAddress),
    isValid: p.isValid,
    source: "registry" as const,
  }));
}

async function readTokenMeta(client: PublicClient, address: Address): Promise<TokenMeta> {
  const [name, symbol, decimals] = await Promise.all([
    tryRead(() => client.readContract({ address, abi: erc20Abi, functionName: "name" })),
    tryRead(() => client.readContract({ address, abi: erc20Abi, functionName: "symbol" })),
    tryRead(() => client.readContract({ address, abi: erc20Abi, functionName: "decimals" })),
  ]);
  return { name, symbol, decimals };
}

/** Enrich a pair with metadata + verification facts → badge. Resilient per-field. */
export async function enrichPair(
  client: PublicClient,
  pair: RegistryPair,
): Promise<EnrichedPair> {
  const [wrapperMeta, underlyingMeta, supports, rate, reverse] = await Promise.all([
    readTokenMeta(client, pair.wrapper),
    readTokenMeta(client, pair.underlying),
    tryRead(() =>
      client.readContract({
        address: pair.wrapper,
        abi: erc7984Abi,
        functionName: "supportsInterface",
        args: [ERC7984_INTERFACE_ID],
      }),
    ),
    tryRead(() =>
      client.readContract({ address: pair.wrapper, abi: erc7984Abi, functionName: "rate" }),
    ),
    tryRead(() =>
      client.readContract({
        address: REGISTRY_ADDRESS[pair.chainId],
        abi: registryAbi,
        functionName: "getTokenAddress",
        args: [pair.wrapper],
      }),
    ),
  ]);

  const supports7984 = supports === true;
  const bidirectionalOk =
    Array.isArray(reverse) && getAddress(reverse[1] as Address) === pair.underlying;
  const isMock = looksMock(wrapperMeta, underlyingMeta);
  const badge = computeBadge({
    source: pair.source,
    isValid: pair.isValid,
    supports7984,
    bidirectionalOk,
    isMock,
  });

  return { ...pair, wrapperMeta, underlyingMeta, rate, supports7984, bidirectionalOk, badge };
}

/** Convenience: read + enrich every registry pair for a chain. */
export async function getEnrichedPairs(
  client: PublicClient,
  chainId: SupportedChainId,
): Promise<EnrichedPair[]> {
  const pairs = await readRegistryPairs(client, chainId);
  return Promise.all(pairs.map((p) => enrichPair(client, p)));
}
