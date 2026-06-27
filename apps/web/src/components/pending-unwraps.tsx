"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { encodeFunctionData, type Address } from "viem";
import { LifeBuoy, Loader2 } from "lucide-react";
import { erc7984Abi, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { getFhevmInstance } from "@/lib/fhevm";

type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/**
 * Detect unwraps that were burned but never finalized (e.g. the tab closed between the two
 * signatures) and let the user finalize → release the ERC-20. A production-readiness safety net.
 * Log detection is server-side (public RPCs 403 browser-origin eth_getLogs); finalize is client-side.
 */
export function PendingUnwraps({ wrapper, symbol }: { wrapper: Address; symbol: string }) {
  const { address, connector } = useAccount();
  const client = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const [pending, setPending] = useState<`0x${string}`[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pending-unwraps?wrapper=${wrapper}&user=${address}`);
      const json = (await res.json()) as { pending?: `0x${string}`[] };
      setPending(json.pending ?? []);
    } catch {
      setError("Couldn't load pending unwraps.");
    } finally {
      setLoading(false);
    }
  }, [address, wrapper]);

  useEffect(() => {
    void load();
  }, [load]);

  async function finalize(requestId: `0x${string}`) {
    if (!address) return;
    setBusyId(requestId);
    setError(null);
    try {
      const instance = await getFhevmInstance();
      const res = (await instance.publicDecrypt([requestId])) as unknown as {
        clearValues: Record<string, bigint | boolean | string>;
        decryptionProof: `0x${string}`;
      };
      const raw = res.clearValues[requestId] ?? Object.values(res.clearValues)[0];
      const cleartext = typeof raw === "bigint" ? raw : BigInt((raw as string | number | undefined) ?? 0);
      const data = encodeFunctionData({
        abi: erc7984Abi,
        functionName: "finalizeUnwrap",
        args: [requestId, cleartext, res.decryptionProof],
      });
      const provider = (await connector?.getProvider()) as InjectedProvider | undefined;
      if (!provider) throw new Error("No wallet provider.");
      const txHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: wrapper, data, gas: `0x${(2_000_000).toString(16)}` }],
      })) as `0x${string}`;
      await client?.waitForTransactionReceipt({ hash: txHash });
      await load();
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Finalize failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!address || (!loading && pending.length === 0)) return null;

  return (
    <div className="mt-4 rounded-2xl border border-warn/25 bg-warn-soft px-5 py-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-warn">
        <LifeBuoy className="h-4 w-4" />
        Pending unwraps to finalize
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
        These {symbol} unwraps were burned but never finalized (e.g. the tab closed between the two
        steps). Finalize to release your ERC-20 — funds are never stuck.
      </p>
      {loading && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking…
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {pending.map((id) => (
          <li
            key={id}
            className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface/60 px-3 py-2 text-xs"
          >
            <span className="font-mono text-zinc-400">{id.slice(0, 16)}…</span>
            <button
              type="button"
              onClick={() => finalize(id)}
              disabled={busyId === id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 font-medium text-black transition-[filter,transform] duration-150 ease-out hover:brightness-105 active:translate-y-px disabled:pointer-events-none disabled:opacity-40"
            >
              {busyId === id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busyId === id ? "Finalizing…" : "Finalize"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
