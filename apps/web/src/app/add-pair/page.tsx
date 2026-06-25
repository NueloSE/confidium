"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAddress, isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { ERC7984_INTERFACE_ID, SEPOLIA_CHAIN_ID, erc7984Abi } from "@confidium/core";
import {
  addLocalCustomPair,
  getLocalCustomPairs,
  removeLocalCustomPair,
  type CustomPair,
} from "@/lib/custom-pairs";

const inputCls =
  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-neutral-600";

export default function AddPairPage() {
  const [underlying, setUnderlying] = useState("");
  const [wrapper, setWrapper] = useState("");
  const [label, setLabel] = useState("");
  const [pairs, setPairs] = useState<CustomPair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const client = usePublicClient();

  useEffect(() => {
    setPairs(getLocalCustomPairs());
  }, []);

  async function add() {
    setError(null);
    if (!isAddress(underlying.trim()) || !isAddress(wrapper.trim())) {
      setError("Both addresses must be valid (0x…).");
      return;
    }
    if (!client) {
      setError("Connect your wallet first.");
      return;
    }
    setBusy(true);
    try {
      const w = getAddress(wrapper.trim());
      const u = getAddress(underlying.trim());
      const ok = await client
        .readContract({
          address: w,
          abi: erc7984Abi,
          functionName: "supportsInterface",
          args: [ERC7984_INTERFACE_ID],
        })
        .catch(() => false);
      if (ok !== true) {
        setError("The wrapper address isn't an ERC-7984 confidential token.");
        return;
      }
      const next = addLocalCustomPair({
        chainId: SEPOLIA_CHAIN_ID,
        underlying: u,
        wrapper: w,
        label: label.trim() || undefined,
      });
      setPairs(next);
      setUnderlying("");
      setWrapper("");
      setLabel("");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Failed to add pair.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Add a custom pair</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Declare an ERC-20 ↔ ERC-7984 pair that isn’t in the official registry. It’s saved in your
        browser and labeled <span className="text-sky-300">Custom</span> — the on-chain registry
        always stays the source of truth.
      </p>

      <div className="mt-6 grid gap-3 rounded-xl border border-neutral-900 bg-neutral-950/40 p-5">
        <input
          className={inputCls}
          value={underlying}
          onChange={(e) => setUnderlying(e.target.value)}
          placeholder="Underlying ERC-20 address (0x…)"
        />
        <input
          className={inputCls}
          value={wrapper}
          onChange={(e) => setWrapper(e.target.value)}
          placeholder="Confidential ERC-7984 wrapper address (0x…)"
        />
        <input
          className={inputCls.replace("font-mono ", "")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40"
          >
            {busy ? "Checking…" : "Add pair"}
          </button>
          {error && <span className="text-xs text-rose-400">{error}</span>}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-neutral-300">Your custom pairs</h2>
      {pairs.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">None yet — add one above.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {pairs.map((p) => (
            <li
              key={p.wrapper}
              className="flex items-center justify-between rounded-lg border border-neutral-900 bg-neutral-950/40 px-4 py-3 text-sm"
            >
              <div>
                <div className="text-neutral-200">{p.label ?? "Custom pair"}</div>
                <div className="font-mono text-xs text-neutral-500">
                  {p.wrapper.slice(0, 10)}… ← {p.underlying.slice(0, 10)}…
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/pair/${p.wrapper}?u=${p.underlying}`}
                  className="text-xs text-sky-300 hover:underline"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => setPairs(removeLocalCustomPair(p.wrapper))}
                  className="text-xs text-neutral-500 transition hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-neutral-600">
        Prefer a repo-level pair (shared with everyone)? Add it to the{" "}
        <code className="text-neutral-400">committedCustomPairs</code> array in{" "}
        <code className="text-neutral-400">apps/web/src/lib/custom-pairs.ts</code> and it shows up in
        the registry list server-side.
      </p>
    </main>
  );
}
