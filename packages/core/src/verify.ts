import type { Badge, PairSource, TokenMeta } from "./types";

/** A pair is a testnet mock if its symbol/name carries the "Mock" marker. */
export function looksMock(...metas: TokenMeta[]): boolean {
  return metas.some((m) =>
    Boolean((m.symbol && /mock/i.test(m.symbol)) || (m.name && /mock/i.test(m.name))),
  );
}

export interface BadgeInput {
  source: PairSource;
  isValid: boolean;
  supports7984: boolean;
  bidirectionalOk: boolean;
  isMock: boolean;
}

/** Pure, deterministic labeling (unit-tested). Order matters. */
export function computeBadge(input: BadgeInput): Badge {
  if (input.source === "custom") return "custom";
  if (!input.isValid) return "revoked";
  if (!input.supports7984 || !input.bidirectionalOk) return "unverified";
  if (input.isMock) return "mock";
  return "official";
}

export const BADGE_META: Record<Badge, { label: string; tone: "good" | "warn" | "info" | "bad" }> = {
  official: { label: "Official", tone: "good" },
  mock: { label: "Mock", tone: "info" },
  custom: { label: "Custom", tone: "info" },
  revoked: { label: "Revoked", tone: "bad" },
  unverified: { label: "Unverified", tone: "warn" },
};
