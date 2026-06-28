"use client";

import { useState } from "react";
import { cn } from "./ui/cn";

/* ----------------------------------------------------------------------------
   Real token logos. Arbitrary ERC-7984 wrappers carry no logo on-chain, so we
   map recognizable underlying assets to their official mark (Trust Wallet CDN),
   draw ZAMA by hand, and fall back to a deterministic colored avatar otherwise.
---------------------------------------------------------------------------- */
const tw = (addr: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${addr}/logo.png`;

const LOGOS: Record<string, string> = {
  USDC: tw("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  USDT: tw("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  DAI: tw("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  WETH: tw("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  ETH: tw("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  WBTC: tw("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
  XAUT: tw("0x68749665FF8D2d112Fa859AA293F07A622782F38"),
  LINK: tw("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
  UNI: tw("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"),
  AAVE: tw("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"),
};

/** Lookup keys for a symbol: strip the confidential "c" prefix and any "Mock" suffix. */
function candidates(symbol?: string): string[] {
  const s = (symbol ?? "").trim();
  if (!s) return [];
  const out = new Set<string>();
  const push = (v: string) => {
    const up = v.toUpperCase();
    out.add(up);
    out.add(up.replace(/MOCK$/, ""));
  };
  push(s);
  if (s.length > 1 && s[0] === "c") push(s.slice(1));
  return [...out].filter(Boolean);
}

function logoFor(symbol?: string): string | null {
  for (const key of candidates(symbol)) {
    const url = LOGOS[key];
    if (url) return url;
  }
  return null;
}

function isZama(symbol?: string): boolean {
  return candidates(symbol).includes("ZAMA");
}

function hueFromAddress(address: string): number {
  let h = 0;
  const s = address.toLowerCase();
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

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

/** Hand-drawn ZAMA mark (yellow disc, black "Z") — no public CDN logo exists. */
function ZamaMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="16" fill="#FFD209" />
      <path
        d="M10.5 11.5 H21.5 L10.5 20.5 H21.5"
        fill="none"
        stroke="#0a0a0b"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [imgFailed, setImgFailed] = useState(false);
  const logo = logoFor(symbol);
  const zama = isZama(symbol);

  const base = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full",
    SIZES[size],
    className,
  );

  if (zama) {
    return (
      <span className={base} aria-hidden>
        <ZamaMark />
      </span>
    );
  }

  if (logo && !imgFailed) {
    return (
      <span className={cn(base, "bg-surface-2")} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  // Fallback: deterministic colored avatar with the token's initial.
  const hue = hueFromAddress(address);
  return (
    <span
      aria-hidden
      style={{
        backgroundColor: `hsl(${hue} 52% 15%)`,
        color: `hsl(${hue} 88% 70%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 60% 50% / 0.35)`,
      }}
      className={cn(base, "font-mono font-semibold tracking-tight")}
    >
      {tokenInitial(symbol)}
    </span>
  );
}
