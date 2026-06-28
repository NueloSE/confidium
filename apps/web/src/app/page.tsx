import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, Lock, Send, ShieldCheck, Unlock } from "lucide-react";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { CursorGlow } from "@/components/cursor-glow";
import { PairsTable } from "@/components/pairs-table";
import { SplineBackground } from "@/components/spline-background";
import { UnwrapSteps } from "@/components/unwrap-steps";
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

/** Decorative blur→reveal teaser, shown under the coin. */
function HeroRevealCard() {
  return (
    <div
      aria-hidden
      className="w-full max-w-[19rem] rounded-2xl border border-hairline bg-surface/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Your confidential balance</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
          <Lock className="h-3 w-3" /> encrypted
        </span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="font-mono text-2xl font-semibold text-zinc-100">
          <span className="encrypted-blur">847,210</span>{" "}
          <span className="text-sm text-zinc-500">cUSDC</span>
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg">
          <Eye className="h-3.5 w-3.5" /> Reveal
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Only you can reveal it — via EIP-712.
      </div>
    </div>
  );
}

/** Flowing brand "confidential token" coin — the right-side hero visual. */
function HeroCoin() {
  return (
    <div aria-hidden className="relative flex items-center justify-center">
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

/* ---- App-snapshot mockups (static replicas of the real action cards) ---- */
const mockCard = "rounded-2xl border border-hairline bg-surface p-5 shadow-2xl shadow-black/40";
const mockTitle = "mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200";
const mockInput =
  "flex h-10 w-full items-center rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-zinc-100";
const mockAmber =
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg";
const mockGreen =
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-success px-4 text-sm font-medium text-black";
const mockHelp = "mt-2 text-xs text-zinc-600";

function WrapMock() {
  return (
    <div className={mockCard}>
      <h4 className={mockTitle}>
        <Lock className="h-4 w-4 text-zinc-400" /> Wrap → cUSDC
      </h4>
      <div className="flex gap-2">
        <div className={mockInput}>100</div>
        <span className={mockAmber}>Approve</span>
      </div>
      <p className={mockHelp}>Approve the wrapper to spend your tokens, then wrap.</p>
    </div>
  );
}

function RevealMock() {
  return (
    <div className="rounded-2xl border border-success/25 bg-surface px-5 py-4 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500">Your confidential cUSDC balance</div>
          <div className="mt-1.5 animate-reveal font-mono text-2xl font-semibold text-success">
            8,420.00 <span className="text-sm font-normal text-zinc-500">cUSDC</span>
          </div>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-white/3 px-3 text-xs font-medium text-zinc-200">
          <Eye className="h-3.5 w-3.5" /> Hide
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        Decrypted privately via EIP-712 — only you can read this value.
      </p>
    </div>
  );
}

function SendMock() {
  return (
    <div className={mockCard}>
      <h4 className={mockTitle}>
        <Send className="h-4 w-4 text-zinc-400" /> Send cUSDC privately
      </h4>
      <div className="grid gap-2">
        <div className={cn(mockInput, "text-zinc-400")}>0x9a3f…E21b</div>
        <div className="flex gap-2">
          <div className={mockInput}>25</div>
          <span className={mockGreen}>Confirm send</span>
        </div>
      </div>
      <p className={mockHelp}>
        Transfers your confidential cUSDC — the amount is never revealed publicly.
      </p>
    </div>
  );
}

function UnwrapMock() {
  return (
    <div className={mockCard}>
      <h4 className={mockTitle}>
        <Unlock className="h-4 w-4 text-zinc-400" /> Unwrap → USDC
      </h4>
      <div className="flex gap-2">
        <div className={mockInput}>50</div>
        <span className={mockAmber}>Prepare unwrap</span>
      </div>
      <UnwrapSteps phase="decrypting" />
      <p className={mockHelp}>
        Burns confidential tokens, decrypts the amount, then releases the ERC-20.
      </p>
    </div>
  );
}

type Feature = {
  eyebrow: string;
  icon: typeof Lock;
  title: string;
  body: string;
  mock: React.ReactNode;
  reverse?: boolean;
};

function FeatureRow({ eyebrow, icon: Icon, title, body, mock, reverse }: Feature) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(reverse && "lg:order-2")}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h3 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-[2.5rem] sm:leading-[1.08]">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">{body}</p>
      </div>
      <div className={cn("flex justify-center lg:justify-end", reverse && "lg:order-1 lg:justify-start")}>
        <div className="relative w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/[0.06] blur-2xl" />
          {mock}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const features: Feature[] = [
    {
      eyebrow: "Wrap",
      icon: Lock,
      title: "Make your balance private.",
      body: "Wrapping turns a public ERC-20 into its confidential ERC-7984 twin. Approve the wrapper once, then wrap any amount — from that moment your balance lives encrypted on-chain. The total supply stays public; what you personally hold does not. Only you can decrypt it.",
      mock: <WrapMock />,
    },
    {
      eyebrow: "Reveal",
      icon: Eye,
      title: "Only you can see it.",
      body: "Your confidential balance reads as “encrypted” to everyone — including block explorers. Tap Reveal and Confidium decrypts it locally with a one-time EIP-712 signature, just for you. The cleartext never touches the chain, and the session is cached so you only sign once.",
      mock: <RevealMock />,
      reverse: true,
    },
    {
      eyebrow: "Send privately",
      icon: Send,
      title: "Send without revealing the amount.",
      body: "Transfer a confidential token to any address in a single transaction — the amount is encrypted end-to-end. Observers see that a transfer happened, never how much. No decrypt step, no reveal: it's privacy by default.",
      mock: <SendMock />,
    },
    {
      eyebrow: "Unwrap",
      icon: Unlock,
      title: "Convert back, safely.",
      body: "Unwrapping returns your ERC-20 through a guided, fail-safe flow: burn the confidential amount, publicly decrypt it, then finalize to release the tokens. If a tab closes mid-way, Confidium detects the pending unwrap and lets you finish it — funds never get stuck.",
      mock: <UnwrapMock />,
      reverse: true,
    },
  ];

  return (
    <section id="how" className="scroll-mt-20 border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            From a public token to a private one — and back.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">
            Four moves, each fully confidential. Here&apos;s what actually happens — and what it looks
            like in the app.
          </p>
        </div>

        <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
          {features.map((f) => (
            <FeatureRow key={f.eyebrow} {...f} />
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-8 text-sm text-zinc-400">
          <span className="text-zinc-500">Also:</span>
          <Link href="/decrypt" className="inline-flex items-center gap-1 transition-colors hover:text-accent-hover">
            Decrypt any ERC-7984 <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/add-pair" className="inline-flex items-center gap-1 transition-colors hover:text-accent-hover">
            Add a custom pair <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/developers" className="inline-flex items-center gap-1 transition-colors hover:text-accent-hover">
            Embed the widget <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
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
      {/* Hero — 3D Spline background, amber-themed, content + flowing coin */}
      <section className="relative flex min-h-[40rem] items-center overflow-hidden border-b border-hairline bg-canvas">
        {/* 3D background, hue-shifted toward the brand amber */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ filter: "hue-rotate(-80deg) saturate(1.15)" }}
        >
          <SplineBackground scene={SPLINE_SCENE} />
        </div>
        {/* Legibility overlays: darken left, let the 3D show right */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-canvas via-canvas/80 to-canvas/25" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-canvas via-transparent to-transparent" />
        {/* Amber glow that follows the cursor */}
        <CursorGlow />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr]">
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
              Browse every ERC-20 ↔ ERC-7984 pair in the live Zama registry — then wrap, send,
              reveal, and unwrap any confidential token, with amounts encrypted end-to-end.
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

          {/* Right: flowing coin + reveal teaser */}
          <div className="hidden flex-col items-center gap-6 lg:flex">
            <HeroCoin />
            <HeroRevealCard />
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Registry */}
      <section id="registry" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Confidential wrappers registry
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Live
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Every pair on {isMainnet ? "Ethereum mainnet" : "Sepolia"}, read live from chain.{" "}
              {isMainnet
                ? "Mainnet is read-only — wrap, unwrap, and decrypt run on Sepolia."
                : "Open any pair to faucet, wrap, send, reveal, and unwrap."}
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
