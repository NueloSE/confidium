"use client";

import { useState } from "react";
import { getAddress, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { ERC7984_INTERFACE_ID, erc7984Abi } from "@confidium/core";
import { DecryptBalance, type DecryptToken } from "@/components/decrypt-balance";

export default function DecryptPage() {
  const [input, setInput] = useState("");
  const [token, setToken] = useState<DecryptToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const { isConnected } = useAccount();
  const client = usePublicClient();

  async function check() {
    setError(null);
    setToken(null);
    const addr = input.trim();
    if (!isAddress(addr)) {
      setError("Enter a valid contract address (0x…).");
      return;
    }
    if (!client) {
      setError("No RPC client available — connect your wallet.");
      return;
    }
    setChecking(true);
    try {
      const address = getAddress(addr);
      const supports = await client
        .readContract({
          address,
          abi: erc7984Abi,
          functionName: "supportsInterface",
          args: [ERC7984_INTERFACE_ID],
        })
        .catch(() => false);
      if (supports !== true) {
        setError("That address doesn't implement the ERC-7984 confidential-token interface.");
        return;
      }
      const [symbol, decimals] = await Promise.all([
        client.readContract({ address, abi: erc7984Abi, functionName: "symbol" }).catch(() => undefined),
        client.readContract({ address, abi: erc7984Abi, functionName: "decimals" }).catch(() => undefined),
      ]);
      setToken({
        address,
        symbol: symbol as string | undefined,
        decimals: decimals as number | undefined,
      });
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Failed to read the token.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Decrypt any ERC-7984 token</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Paste any confidential token address to privately decrypt your own balance — even tokens
        that aren’t in the registry.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… ERC-7984 token address"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-neutral-600"
        />
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40"
        >
          {checking ? "Checking…" : "Check token"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      {!isConnected && (
        <p className="mt-3 text-sm text-neutral-500">Connect your wallet to decrypt your balance.</p>
      )}

      {token && (
        <div className="mt-6 space-y-3">
          <div className="text-sm text-neutral-300">
            ✓ ERC-7984 verified — {token.symbol ?? "Confidential token"}{" "}
            <span className="text-neutral-500">· {token.decimals ?? 6} decimals</span>
          </div>
          <DecryptBalance token={token} />
        </div>
      )}
    </main>
  );
}
