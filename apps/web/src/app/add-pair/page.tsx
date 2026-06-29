"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, Plus, Trash2 } from "lucide-react";
import { getAddress, isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { ERC7984_INTERFACE_ID, SEPOLIA_CHAIN_ID, erc7984Abi } from "@confidium/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addLocalCustomPair,
  getLocalCustomPairs,
  removeLocalCustomPair,
  type CustomPair,
} from "@/lib/custom-pairs";

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/registry"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Registry
      </Link>
      <div className="animate-fade-up mt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-zinc-300">
          <Plus className="h-3.5 w-3.5 text-accent" />
          Hybrid registry
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">Add a custom pair</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Declare an ERC-20 ↔ ERC-7984 pair that isn’t in the official registry. It’s saved in your
          browser and labeled{" "}
          <span className="font-medium text-accent-hover">Custom</span> — the on-chain registry
          always stays the source of truth.
        </p>
      </div>

      <div className="mt-7 grid gap-3 rounded-2xl border border-hairline bg-surface p-5">
        <Input
          className="font-mono"
          value={underlying}
          onChange={(e) => setUnderlying(e.target.value)}
          placeholder="Underlying ERC-20 address (0x…)"
          aria-label="Underlying ERC-20 address"
          spellCheck={false}
          autoComplete="off"
        />
        <Input
          className="font-mono"
          value={wrapper}
          onChange={(e) => setWrapper(e.target.value)}
          placeholder="Confidential ERC-7984 wrapper address (0x…)"
          aria-label="Confidential ERC-7984 wrapper address"
          spellCheck={false}
          autoComplete="off"
        />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          aria-label="Label"
        />
        <div className="flex items-center justify-between gap-3">
          <Button onClick={add} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {busy ? "Checking…" : "Add pair"}
          </Button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </div>

      <h2 className="mt-9 text-sm font-semibold text-zinc-300">Your custom pairs</h2>
      {pairs.length === 0 ? (
        <div className="mt-2 rounded-xl border border-dashed border-hairline bg-surface/40 px-4 py-8 text-center text-sm text-zinc-500">
          None yet — add one above to get a fully-functional detail page.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {pairs.map((p) => (
            <li
              key={p.wrapper}
              className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate text-zinc-200">{p.label ?? "Custom pair"}</div>
                <div className="mt-0.5 truncate font-mono text-xs text-zinc-500">
                  {p.wrapper.slice(0, 10)}… ← {p.underlying.slice(0, 10)}…
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/pair/${p.wrapper}?u=${p.underlying}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-hover transition-colors hover:bg-accent-soft"
                >
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setPairs(removeLocalCustomPair(p.wrapper))}
                  aria-label="Remove pair"
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-9 text-xs leading-relaxed text-zinc-600">
        Prefer a repo-level pair (shared with everyone)? Add it to the{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-zinc-400">
          committedCustomPairs
        </code>{" "}
        array in{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-zinc-400">
          apps/web/src/lib/custom-pairs.ts
        </code>{" "}
        and it shows up in the registry list server-side.
      </p>
    </main>
  );
}
