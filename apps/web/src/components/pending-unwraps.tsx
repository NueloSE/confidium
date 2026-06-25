"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { encodeFunctionData, type Address } from "viem";
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
    <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/10 px-5 py-4">
      <div className="text-sm font-semibold text-amber-300">Pending unwraps to finalize</div>
      <p className="mt-1 text-xs text-neutral-500">
        These {symbol} unwraps were burned but never finalized (e.g. the tab closed between the two
        steps). Finalize to release your ERC-20.
      </p>
      {loading && <p className="mt-2 text-xs text-neutral-500">Checking…</p>}
      <ul className="mt-3 space-y-2">
        {pending.map((id) => (
          <li key={id} className="flex items-center justify-between gap-3 text-xs">
            <span className="font-mono text-neutral-400">{id.slice(0, 16)}…</span>
            <button
              type="button"
              onClick={() => finalize(id)}
              disabled={busyId === id}
              className="rounded-lg bg-emerald-400 px-3 py-1.5 font-medium text-black transition hover:bg-emerald-300 disabled:opacity-40"
            >
              {busyId === id ? "Finalizing…" : "Finalize"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
