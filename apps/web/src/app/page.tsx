import Link from "next/link";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type SupportedChainId } from "@confidium/core";
import { PairsTable } from "@/components/pairs-table";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 60;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-300">
      <span className="font-semibold text-neutral-100">{value}</span>
      <span className="text-neutral-500">{label}</span>
    </span>
  );
}

function NetworkTab({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      href={to}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-100"
      }`}
    >
      {label}
    </Link>
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Confidential Wrappers Registry</h1>
          <div className="flex gap-1 rounded-lg border border-neutral-800 p-1">
            <NetworkTab to="/" label="Sepolia" active={!isMainnet} />
            <NetworkTab to="/?chain=mainnet" label="Ethereum" active={isMainnet} />
          </div>
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Every ERC-20 ↔ ERC-7984 pair in the official Zama registry on{" "}
          {isMainnet ? "Ethereum mainnet" : "Sepolia"}, read live from chain.
          {isMainnet && " Mainnet is read-only — wrap/unwrap/decrypt run on Sepolia."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Stat label="Pairs" value={pairs.length} />
          <Stat label="Official" value={official} />
          <Stat label="Mock" value={mock} />
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-400">
            <span className={`h-2 w-2 rounded-full ${isMainnet ? "bg-sky-400" : "bg-emerald-400"}`} />
            {isMainnet ? "Ethereum" : "Sepolia"}
          </span>
        </div>
      </section>

      {pairs.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-10 text-center text-sm text-neutral-400">
          Loading the registry from chain… refresh in a moment if it doesn’t appear.
        </div>
      ) : (
        <PairsTable pairs={pairs} explorerBase={explorerBase} linkDetails={!isMainnet} />
      )}

      <footer className="mt-10 border-t border-neutral-900 pt-6 text-xs text-neutral-600">
        Developers: import the verified list →{" "}
        <a
          href="/api/token-list"
          target="_blank"
          rel="noreferrer"
          className="text-neutral-400 underline transition hover:text-neutral-200"
        >
          /api/token-list
        </a>{" "}
        (tokenlists.org schema), or build on the framework-agnostic{" "}
        <span className="text-neutral-400">@confidium/core</span> package.
      </footer>
    </main>
  );
}
