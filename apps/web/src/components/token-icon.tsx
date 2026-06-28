import { cn } from "./ui/cn";

/** Stable 0–359 hue derived from an address, so each token keeps a consistent color. */
function hueFromAddress(address: string): number {
  let h = 0;
  const s = address.toLowerCase();
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

/** Meaningful initial — strips the confidential "c" prefix (cUSDC → "U", ctGBP → "T"). */
function tokenInitial(symbol?: string): string {
  const s = (symbol ?? "").trim();
  if (!s) return "?";
  const core = s.length > 1 && s[0] === "c" ? s.slice(1) : s;
  return (core[0] ?? s[0] ?? "?").toUpperCase();
}

const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-lg",
} as const;

/** Deterministic colored token avatar (no on-chain logo exists for arbitrary ERC-7984 tokens). */
export function TokenIcon({
  address,
  symbol,
  size = "sm",
  className,
}: {
  address: string;
  symbol?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const hue = hueFromAddress(address);
  return (
    <span
      aria-hidden
      style={{
        backgroundColor: `hsl(${hue} 52% 15%)`,
        color: `hsl(${hue} 88% 70%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 60% 50% / 0.35)`,
      }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-mono font-semibold tracking-tight",
        SIZES[size],
        className,
      )}
    >
      {tokenInitial(symbol)}
    </span>
  );
}
