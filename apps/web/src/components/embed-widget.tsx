"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "@confidium/core";
import { ConnectButton } from "@/components/connect-button";
import { DecryptBalance } from "@/components/decrypt-balance";
import { UnwrapCard, WrapCard } from "@/components/pair-actions";
import type { UiPair } from "@/lib/pair";

/**
 * Chrome-free wrap/unwrap widget designed to be embedded in any site via an iframe
 * (`/embed?token=0x…`). Reuses the exact production Wrap/Unwrap cards.
 */
export function EmbedWidget({
  pair,
  defaultAction = "wrap",
}: {
  pair: UiPair;
  defaultAction?: "wrap" | "unwrap";
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [tab, setTab] = useState<"wrap" | "unwrap">(defaultAction);
  const wrongNetwork = chainId !== SEPOLIA_CHAIN_ID;
  const symbol = pair.wrapperMeta.symbol ?? "Confidential";
  const noop = () => {};

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-100">
          {symbol} <span className="text-neutral-500">· wrap</span>
        </div>
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 text-sm text-neutral-400">
          Connect your wallet to wrap or unwrap {symbol}.
        </div>
      ) : wrongNetwork ? (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 text-sm text-amber-300">
          Wrong network.{" "}
          <button className="underline" onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}>
            Switch to Sepolia
          </button>
        </div>
      ) : (
        <>
          <DecryptBalance
            token={{
              address: pair.wrapper as `0x${string}`,
              symbol: pair.wrapperMeta.symbol,
              decimals: pair.wrapperMeta.decimals,
            }}
          />
          <div className="flex gap-1 rounded-lg border border-neutral-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("wrap")}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                tab === "wrap" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400"
              }`}
            >
              Wrap
            </button>
            <button
              type="button"
              onClick={() => setTab("unwrap")}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                tab === "unwrap" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400"
              }`}
            >
              Unwrap
            </button>
          </div>
          {tab === "wrap" ? (
            <WrapCard pair={pair} onDone={noop} />
          ) : (
            <UnwrapCard pair={pair} onDone={noop} />
          )}
        </>
      )}

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mt-auto pt-2 text-center text-xs text-neutral-600 transition hover:text-neutral-400"
      >
        Powered by Confidium ↗
      </a>
    </div>
  );
}
