"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
    return (
      <Button
        disabled={isPending || !injected}
        onClick={() => injected && connect({ connector: injected })}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isPending ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  const wrongNetwork = chainId !== sepolia.id;
  const avatarHue = address ? parseInt(address.slice(2, 8), 16) % 360 : 210;

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork ? (
        <Button variant="warn" size="sm" onClick={() => switchChain({ chainId: sepolia.id })}>
          <span className="h-1.5 w-1.5 rounded-full bg-black/60" />
          Switch to Sepolia
        </Button>
      ) : (
        <span className="hidden h-9 items-center gap-1.5 rounded-lg border border-hairline bg-white/3 px-2.5 text-xs font-medium text-zinc-300 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_0] shadow-success/60" />
          Sepolia
        </span>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect"
        className="group inline-flex h-9 items-center gap-2 rounded-lg border border-hairline bg-white/3 pl-1.5 pr-2.5 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-hairline-strong hover:bg-white/6"
      >
        <span
          className="h-5 w-5 rounded-full"
          style={{ backgroundColor: `hsl(${avatarHue} 58% 45%)` }}
          aria-hidden
        />
        <span className="font-mono text-xs">{address ? short(address) : "Connected"}</span>
        <LogOut className="h-3.5 w-3.5 text-zinc-500 transition-colors duration-150 group-hover:text-zinc-300" />
      </button>
    </div>
  );
}
