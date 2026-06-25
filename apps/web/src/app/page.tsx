import { SEPOLIA_CHAIN_ID } from "@confidium/core";
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

export default async function Home() {
  const { pairs } = await getPairsCached(SEPOLIA_CHAIN_ID);
  const official = pairs.filter((p) => p.badge === "official").length;
  const mock = pairs.filter((p) => p.badge === "mock").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Confidential Wrappers Registry</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Every ERC-20 ↔ ERC-7984 pair in the official Zama registry on Sepolia, read live from chain.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Stat label="Pairs" value={pairs.length} />
          <Stat label="Official" value={official} />
          <Stat label="Mock" value={mock} />
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Sepolia
          </span>
        </div>
      </section>

      {pairs.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-10 text-center text-sm text-neutral-400">
          Loading the registry from chain… refresh in a moment if it doesn’t appear.
        </div>
      ) : (
        <PairsTable pairs={pairs} />
      )}
    </main>
  );
}
