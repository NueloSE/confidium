import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Lock, ShieldCheck } from "lucide-react";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { PairsTable } from "@/components/pairs-table";
import { SplineBackground } from "@/components/spline-background";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

// The 3D background scene. Lazy-loaded, purely decorative, with a graceful fallback.
const SPLINE_SCENE = "https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-2xl font-semibold tracking-tight text-zinc-50">{value}</span>
      <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function NetworkSegment({ isMainnet }: { isMainnet: boolean }) {
  const base = "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150";
  return (
    <div className="inline-flex rounded-lg border border-hairline bg-surface-2 p-1">
      <Link
        href="/"
        aria-current={!isMainnet ? "true" : undefined}
        className={cn(base, !isMainnet ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100")}
      >
        Sepolia
      </Link>
      <Link
        href="/?chain=mainnet"
        aria-current={isMainnet ? "true" : undefined}
        className={cn(base, isMainnet ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100")}
      >
        Ethereum
      </Link>
    </div>
  );
}

/** Flowing brand "confidential token" coin — the right-side hero visual. */
function HeroCoin() {
  return (
    <div aria-hidden className="relative hidden items-center justify-center lg:flex">
      {/* Amber glow */}
      <div className="absolute h-72 w-72 rounded-full bg-accent/20 blur-[90px]" />
      <div className="animate-float relative grid h-60 w-60 place-items-center rounded-full bg-surface/70 ring-1 ring-accent/30 shadow-[0_35px_90px_-20px_rgba(255,153,0,0.45)] backdrop-blur-sm">
        {/* Inner rim + top sheen */}
        <div className="absolute inset-3 rounded-full ring-1 ring-hairline" />
        <div className="absolute inset-x-10 top-4 h-10 rounded-full bg-white/10 blur-xl" />
        <Image
          src="/confidium-mark.png"
          alt=""
          width={120}
          height={140}
          className="relative h-28 w-auto drop-shadow-[0_6px_24px_rgba(255,153,0,0.5)]"
        />
        {/* Confidential shield badge */}
        <span className="absolute bottom-7 right-7 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-fg ring-4 ring-canvas">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain } = await searchParams;
  const isMainnet = chain === "mainnet" || chain === "1";
  const chainId: SupportedChainId = isMainnet ? MAINNET_CHAIN_ID : SEPOLIA_CHAIN_ID;
  const explorerBase = isMainnet ? "https://etherscan.io" : "https://sepolia.etherscan.io";

  const { pairs } = await getPairsCached(chainId);
  const official = pairs.filter((p) => p.badge === "official").length;
  const mock = pairs.filter((p) => p.badge === "mock").length;

  return (
    <main>
      {/* Hero — 3D Spline background, amber-themed, content bottom-left + flowing coin */}
      <section className="relative flex min-h-[86vh] items-end overflow-hidden border-b border-hairline bg-canvas">
        {/* 3D background */}
        <SplineBackground scene={SPLINE_SCENE} />
        {/* Theme + legibility overlays: darken bottom-left, let the 3D show top-right, amber wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-canvas via-canvas/85 to-canvas/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-[460px] w-[640px] rounded-full bg-accent/12 blur-[120px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-14 pt-32 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span
              className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface/70 px-3 py-1 text-xs font-medium text-zinc-300 opacity-0 backdrop-blur"
              style={{ animationDelay: "0.1s" }}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Powered by Zama FHE · ERC-7984
            </span>
            <h1
              className="animate-fade-up mt-5 text-[clamp(2.75rem,7vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.04em] text-zinc-50 opacity-0"
              style={{ animationDelay: "0.2s" }}
            >
              The home of
              <br />
              <span className="text-accent">confidential</span> tokens.
            </h1>
            <p
              className="animate-fade-up mt-5 max-w-md text-base leading-relaxed text-zinc-300 opacity-0 sm:text-lg"
              style={{ animationDelay: "0.35s" }}
            >
              Browse every ERC-20 ↔ ERC-7984 pair in the live Zama registry, then wrap, reveal, and
              unwrap — amounts stay encrypted end-to-end.
            </p>
            <div
              className="animate-fade-up mt-7 flex flex-wrap items-center gap-3 opacity-0"
              style={{ animationDelay: "0.5s" }}
            >
              <Link href="#registry" className={cn(buttonVariants({ size: "lg" }))}>
                Explore the registry
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/decrypt"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
              >
                <Eye className="h-4 w-4" />
                Decrypt any token
              </Link>
            </div>
            <div
              className="animate-fade-up mt-10 flex flex-wrap gap-x-8 gap-y-4 opacity-0"
              style={{ animationDelay: "0.65s" }}
            >
              <Stat value={pairs.length} label="Pairs in registry" />
              <Stat value={official} label="Official" />
              <Stat value={mock} label="Testnet mocks" />
              <Stat value="2" label="Networks" />
            </div>
          </div>
          <HeroCoin />
        </div>
      </section>

      {/* Registry */}
      <section id="registry" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
              Confidential wrappers registry
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Every pair on {isMainnet ? "Ethereum mainnet" : "Sepolia"}, read live from chain.
              {isMainnet && " Mainnet is read-only — wrap, unwrap, and decrypt run on Sepolia."}
            </p>
          </div>
          <NetworkSegment isMainnet={isMainnet} />
        </div>

        {pairs.length === 0 ? (
          <div className="bg-dotgrid flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface/40 px-6 py-16 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
              <Lock className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-zinc-200">Reading the registry from chain…</p>
            <p className="max-w-xs text-xs text-zinc-500">
              This loads on-chain in one multicall. Refresh in a moment if it doesn’t appear.
            </p>
          </div>
        ) : (
          <PairsTable pairs={pairs} explorerBase={explorerBase} linkDetails={!isMainnet} />
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium text-zinc-300">Confidium</span> — composable privacy for any
            ERC-7984 token.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="/api/token-list"
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-150 hover:text-zinc-200"
            >
              Token list ↗
            </a>
            <Link href="/developers" className="transition-colors duration-150 hover:text-zinc-200">
              Developers
            </Link>
            <span className="font-mono text-xs text-zinc-600">@confidium/core</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
