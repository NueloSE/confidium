import type { Address, ContractFunctionParameters, PublicClient } from "viem";
import { getAddress } from "viem";
import { erc20Abi, erc7984Abi, registryAbi } from "./abis";
import { ERC7984_INTERFACE_ID, REGISTRY_ADDRESS, type SupportedChainId } from "./chains";
import type { EnrichedPair, RegistryPair, TokenMeta } from "./types";
import { computeBadge, looksMock } from "./verify";

/** Read every pair from the on-chain registry (length + single slice = 2 calls). */
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

type McResult = { status: "success"; result: unknown } | { status: "failure"; error: Error };

const FIELDS_PER_PAIR = 9;

/**
 * Read + enrich every registry pair using a SINGLE multicall for all metadata +
 * verification reads (atomic → fast and stable, no per-field flapping).
 */
export async function getEnrichedPairs(
  client: PublicClient,
  chainId: SupportedChainId,
): Promise<EnrichedPair[]> {
  return enrichPairs(client, await readRegistryPairs(client, chainId));
}

/** Enrich an arbitrary list of pairs (registry OR custom) with metadata + verification badges. */
export async function enrichPairs(
  client: PublicClient,
  pairs: RegistryPair[],
): Promise<EnrichedPair[]> {
  if (pairs.length === 0) return [];

  const contracts: ContractFunctionParameters[] = pairs.flatMap((p) => [
    { address: p.wrapper, abi: erc7984Abi, functionName: "symbol" },
    { address: p.wrapper, abi: erc7984Abi, functionName: "name" },
    { address: p.wrapper, abi: erc7984Abi, functionName: "decimals" },
    { address: p.underlying, abi: erc20Abi, functionName: "symbol" },
    { address: p.underlying, abi: erc20Abi, functionName: "name" },
    { address: p.underlying, abi: erc20Abi, functionName: "decimals" },
    {
      address: p.wrapper,
      abi: erc7984Abi,
      functionName: "supportsInterface",
      args: [ERC7984_INTERFACE_ID],
    },
    { address: p.wrapper, abi: erc7984Abi, functionName: "rate" },
    {
      address: REGISTRY_ADDRESS[p.chainId],
      abi: registryAbi,
      functionName: "getTokenAddress",
      args: [p.wrapper],
    },
  ]);

  const results = (await client.multicall({
    contracts,
    allowFailure: true,
  })) as unknown as McResult[];

  const pick = <T>(idx: number): T | undefined => {
    const r = results[idx];
    return r && r.status === "success" ? (r.result as T) : undefined;
  };

  return pairs.map((p, i) => {
    const b = i * FIELDS_PER_PAIR;
    const wrapperMeta: TokenMeta = {
      symbol: pick<string>(b + 0),
      name: pick<string>(b + 1),
      decimals: pick<number>(b + 2),
    };
    const underlyingMeta: TokenMeta = {
      symbol: pick<string>(b + 3),
      name: pick<string>(b + 4),
      decimals: pick<number>(b + 5),
    };
    const supports7984 = pick<boolean>(b + 6) === true;
    const rate = pick<bigint>(b + 7);
    const reverse = pick<readonly [boolean, Address]>(b + 8);
    const bidirectionalOk = Array.isArray(reverse) && getAddress(reverse[1]) === p.underlying;
    const isMock = looksMock(wrapperMeta, underlyingMeta);
    const badge = computeBadge({
      source: p.source,
      isValid: p.isValid,
      supports7984,
      bidirectionalOk,
      isMock,
    });

    return { ...p, wrapperMeta, underlyingMeta, rate, supports7984, bidirectionalOk, badge };
  });
}
