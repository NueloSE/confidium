import type { Address } from "viem";
import type { SupportedChainId } from "./chains";

export type PairSource = "registry" | "custom";

/**
 * Provenance + trust label rendered in the UI.
 * - official: in registry, valid, ERC-165 ok, bidirectional match, not a mock
 * - mock: valid testnet mock (public mint) — fine for trying flows
 * - custom: declared via local config / in-app form (never shown as official)
 * - revoked: registry validity flag = false
 * - unverified: ERC-165 fails or bidirectional mismatch
 */
export type Badge = "official" | "mock" | "custom" | "revoked" | "unverified";

export interface RegistryPair {
  chainId: SupportedChainId;
  underlying: Address;
  wrapper: Address;
  isValid: boolean;
  source: PairSource;
}

export interface TokenMeta {
  name?: string;
  symbol?: string;
  decimals?: number;
}

export interface EnrichedPair extends RegistryPair {
  wrapperMeta: TokenMeta;
  underlyingMeta: TokenMeta;
  /** 10^(underlyingDecimals − wrapperDecimals); 1 when equal. */
  rate?: bigint;
  supports7984: boolean;
  bidirectionalOk: boolean;
  badge: Badge;
}
