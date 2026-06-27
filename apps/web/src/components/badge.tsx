import { BADGE_META, type Badge } from "@confidium/core";
import { InfoTip } from "./ui/tooltip";
import { cn } from "./ui/cn";

/** Per-provenance color + a plain-language explanation surfaced on hover. */
const STYLES: Record<Badge, { pill: string; dot: string; help: string }> = {
  official: {
    pill: "bg-success-soft text-success ring-success/25",
    dot: "bg-success",
    help: "Present in the on-chain Zama registry, valid, and implements the ERC-7984 confidential-token interface.",
  },
  mock: {
    pill: "bg-info-soft text-info ring-info/25",
    dot: "bg-info",
    help: "An official testnet mock token — mint some from the faucet to try the wrap/unwrap flow on Sepolia.",
  },
  custom: {
    pill: "bg-accent-soft text-accent-hover ring-accent/30",
    dot: "bg-accent",
    help: "Added via the in-app form or committed config — never shown as Official. The on-chain registry stays the source of truth.",
  },
  unverified: {
    pill: "bg-warn-soft text-warn ring-warn/25",
    dot: "bg-warn",
    help: "In the registry but failed a check (ERC-165 interface or the bidirectional underlying↔wrapper link).",
  },
  revoked: {
    pill: "bg-danger-soft text-danger ring-danger/25",
    dot: "bg-danger",
    help: "No longer valid in the registry.",
  },
};

export function BadgePill({ badge, showDot = true }: { badge: Badge; showDot?: boolean }) {
  const meta = BADGE_META[badge];
  const s = STYLES[badge];
  return (
    <InfoTip label={s.help}>
      <span
        className={cn(
          "inline-flex cursor-default items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
          s.pill,
        )}
      >
        {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />}
        {meta.label}
      </span>
    </InfoTip>
  );
}
