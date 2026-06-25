import { SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";

export interface CustomPair {
  chainId: SupportedChainId;
  underlying: `0x${string}`;
  wrapper: `0x${string}`;
  label?: string;
}

/**
 * Committed custom / dev-only pairs (the documented "add a pair via config" path).
 * Add an ERC-20 ↔ ERC-7984 pair here that isn't (yet) in the official on-chain registry and it
 * shows up in the explorer labeled "Custom". The on-chain registry always remains the source of
 * truth — these are clearly marked as custom and never shown as Official.
 *
 * Example:
 *   { chainId: SEPOLIA_CHAIN_ID, underlying: "0xUnderlying…", wrapper: "0xWrapper…", label: "My dev token" },
 */
export const committedCustomPairs: CustomPair[] = [];

// keep the import referenced so the example type-checks and editors autocomplete the chain id
void SEPOLIA_CHAIN_ID;

const LS_KEY = "confidium.customPairs";

/** User-added custom pairs (browser only), declared live via the in-app "Add a pair" form. */
export function getLocalCustomPairs(): CustomPair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as CustomPair[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLocalCustomPair(pair: CustomPair): CustomPair[] {
  const next = [
    ...getLocalCustomPairs().filter((e) => e.wrapper.toLowerCase() !== pair.wrapper.toLowerCase()),
    pair,
  ];
  window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next;
}

export function removeLocalCustomPair(wrapper: string): CustomPair[] {
  const next = getLocalCustomPairs().filter(
    (e) => e.wrapper.toLowerCase() !== wrapper.toLowerCase(),
  );
  window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next;
}
