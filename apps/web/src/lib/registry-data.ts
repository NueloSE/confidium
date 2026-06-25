import { enrichPairs, getEnrichedPairs, type RegistryPair, type SupportedChainId } from "@confidium/core";
import { getAddress } from "viem";
import { getServerClient } from "./clients";
import { committedCustomPairs } from "./custom-pairs";
import { toUiPair, type UiPair } from "./pair";

type Entry = { at: number; pairs: UiPair[] };

const cache = new Map<number, Entry>();
const TTL_MS = 60_000;

/**
 * Cached registry read = on-chain registry (source of truth) + committed custom/dev pairs,
 * enriched the same way and labeled by provenance. Serves the last-good snapshot on a transient
 * RPC failure so the UI never flashes empty once it has loaded.
 */
export async function getPairsCached(
  chainId: SupportedChainId,
): Promise<{ pairs: UiPair[]; stale: boolean }> {
  const now = Date.now();
  const hit = cache.get(chainId);
  if (hit && now - hit.at < TTL_MS) return { pairs: hit.pairs, stale: false };

  try {
    const client = getServerClient(chainId);
    const registry = await getEnrichedPairs(client, chainId);

    const customInputs: RegistryPair[] = committedCustomPairs
      .filter((c) => c.chainId === chainId)
      .map((c) => ({
        chainId,
        underlying: getAddress(c.underlying),
        wrapper: getAddress(c.wrapper),
        isValid: true,
        source: "custom" as const,
      }));
    const custom = customInputs.length ? await enrichPairs(client, customInputs) : [];

    const pairs = [...registry, ...custom].map(toUiPair);
    cache.set(chainId, { at: now, pairs });
    return { pairs, stale: false };
  } catch {
    if (hit) return { pairs: hit.pairs, stale: true };
    return { pairs: [], stale: false };
  }
}
