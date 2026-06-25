"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

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
      <button
        type="button"
        disabled={isPending || !injected}
        onClick={() => injected && connect({ connector: injected })}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  const wrongNetwork = chainId !== sepolia.id;

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork && (
        <button
          type="button"
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-medium text-black transition hover:bg-amber-400"
        >
          Switch to Sepolia
        </button>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-900"
      >
        {address ? short(address) : "Disconnect"}
      </button>
    </div>
  );
}
