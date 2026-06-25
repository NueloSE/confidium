import { getEnrichedPairs, type SupportedChainId } from "@confidium/core";
import { getServerClient } from "./clients";
import { toUiPair, type UiPair } from "./pair";

type Entry = { at: number; pairs: UiPair[] };

const cache = new Map<number, Entry>();
const TTL_MS = 60_000;

/**
 * Cached registry read. Avoids re-fetching on every navigation and serves the
 * last-good snapshot if a transient RPC failure occurs (so the UI never flashes
 * an error or empty state once it has loaded once).
 */
export async function getPairsCached(
  chainId: SupportedChainId,
): Promise<{ pairs: UiPair[]; stale: boolean }> {
  const now = Date.now();
  const hit = cache.get(chainId);
  if (hit && now - hit.at < TTL_MS) return { pairs: hit.pairs, stale: false };

  try {
    const enriched = await getEnrichedPairs(getServerClient(chainId), chainId);
    const pairs = enriched.map(toUiPair);
    cache.set(chainId, { at: now, pairs });
    return { pairs, stale: false };
  } catch {
    if (hit) return { pairs: hit.pairs, stale: true };
    return { pairs: [], stale: false };
  }
}
