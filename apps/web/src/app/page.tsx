import Link from "next/link";
import { ArrowRight, Eye, Lock, ShieldCheck } from "lucide-react";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { PairsTable } from "@/components/pairs-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

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

/** Decorative teaser of the blur→reveal moment shown in the hero (non-interactive). */
function HeroPreview() {
  return (
    <div aria-hidden className="relative hidden lg:block">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/10 blur-2xl" />
      <div className="rounded-2xl border border-hairline bg-surface/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Your confidential balance</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
            <Lock className="h-3 w-3" /> encrypted
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="font-mono text-3xl font-semibold text-zinc-100">
            <span className="encrypted-blur">847,210</span>{" "}
            <span className="text-base text-zinc-500">cUSDC</span>
          </div>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-black">
            <Eye className="h-3.5 w-3.5" /> Reveal
          </span>
        </div>
        <div className="mt-4 h-px bg-hairline" />
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Decrypted via EIP-712 — only you can read it.
        </div>
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
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden border-b border-hairline">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Powered by Zama FHE · ERC-7984
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-zinc-50 sm:text-[3.25rem]">
              The home of
              <br />
              confidential tokens.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
              Browse every ERC-20 ↔ ERC-7984 pair in the live Zama registry, then wrap, reveal, and
              unwrap — amounts stay encrypted end-to-end.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#registry" className={cn(buttonVariants({ size: "lg" }))}>
                Explore the registry
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/decrypt"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <Eye className="h-4 w-4" />
                Decrypt any token
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <Stat value={pairs.length} label="Pairs in registry" />
              <Stat value={official} label="Official" />
              <Stat value={mock} label="Testnet mocks" />
              <Stat value="2" label="Networks" />
            </div>
          </div>
          <HeroPreview />
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
