"use client";

import Image from "next/image";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ShieldAlert } from "lucide-react";
import { SEPOLIA_CHAIN_ID } from "@confidium/core";
import { ConnectButton } from "@/components/connect-button";
import { DecryptBalance } from "@/components/decrypt-balance";
import { UnwrapCard, WrapCard } from "@/components/pair-actions";
import { cn } from "@/components/ui/cn";
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
        <div className="flex items-center gap-2">
          <Image src="/confidium-mark.png" alt="" width={20} height={23} className="h-5 w-auto" />
          <span className="text-sm font-semibold text-zinc-100">{symbol}</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
            confidential
          </span>
        </div>
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-hairline bg-surface p-5 text-sm text-zinc-400">
          Connect your wallet to wrap or unwrap {symbol}.
        </div>
      ) : wrongNetwork ? (
        <div className="flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm text-warn">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>
            Wrong network.{" "}
            <button
              className="font-medium underline underline-offset-2 hover:text-warn/80"
              onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            >
              Switch to Sepolia
            </button>
          </span>
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
          <div className="flex gap-1 rounded-lg border border-hairline bg-surface-2 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("wrap")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors duration-150",
                tab === "wrap" ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100",
              )}
            >
              Wrap
            </button>
            <button
              type="button"
              onClick={() => setTab("unwrap")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors duration-150",
                tab === "unwrap" ? "bg-white/8 text-zinc-100" : "text-zinc-400 hover:text-zinc-100",
              )}
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
        className="mt-auto pt-2 text-center text-xs text-zinc-600 transition-colors duration-150 hover:text-zinc-400"
      >
        Powered by Confidium ↗
      </a>
    </div>
  );
}
