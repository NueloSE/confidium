import type { Badge, EnrichedPair, TokenMeta } from "@confidium/core";

/** Client-safe pair shape (bigint `rate` serialized to string for the RSC boundary). */
export interface UiPair {
  chainId: number;
  underlying: string;
  wrapper: string;
  isValid: boolean;
  source: "registry" | "custom";
  badge: Badge;
  wrapperMeta: TokenMeta;
  underlyingMeta: TokenMeta;
  rate: string | null;
  supports7984: boolean;
  bidirectionalOk: boolean;
}

export function toUiPair(p: EnrichedPair): UiPair {
  return {
    chainId: p.chainId,
    underlying: p.underlying,
    wrapper: p.wrapper,
    isValid: p.isValid,
    source: p.source,
    badge: p.badge,
    wrapperMeta: p.wrapperMeta,
    underlyingMeta: p.underlyingMeta,
    rate: p.rate != null ? p.rate.toString() : null,
    supports7984: p.supports7984,
    bidirectionalOk: p.bidirectionalOk,
  };
}
