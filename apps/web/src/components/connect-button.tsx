"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Loader2, LogOut, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  // Close the picker once a wallet connects.
  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  // Escape closes the picker.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isConnected) {
    // EIP-6963 announces every installed wallet as its own connector; dedupe by name just in case.
    const wallets = connectors.filter(
      (c, i, arr) => arr.findIndex((x) => x.name === c.name) === i,
    );

    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <Wallet className="h-4 w-4" />
          Connect wallet
        </Button>

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Connect a wallet"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-sm rounded-2xl border border-hairline-strong bg-elevated p-5 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-100">Connect a wallet</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Choose how you’d like to connect. Confidential actions run on Sepolia.
              </p>

              {wallets.length === 0 ? (
                <div className="mt-4 rounded-xl border border-hairline bg-surface p-4 text-sm leading-relaxed text-zinc-400">
                  No wallet detected. Install{" "}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-hover underline underline-offset-2"
                  >
                    MetaMask
                  </a>
                  , Coinbase Wallet, Brave, or Rabby — then refresh.
                </div>
              ) : (
                <div className="mt-4 space-y-1.5">
                  {wallets.map((c) => (
                    <button
                      key={c.uid}
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setPendingUid(c.uid);
                        connect({ connector: c });
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-left transition-colors duration-150 hover:border-hairline-strong hover:bg-elevated disabled:opacity-60"
                    >
                      {c.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.icon} alt="" className="h-7 w-7 rounded-lg" />
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-zinc-400">
                          <Wallet className="h-4 w-4" />
                        </span>
                      )}
                      <span className="flex-1 text-sm font-medium text-zinc-100">{c.name}</span>
                      {pendingUid === c.uid && isPending && (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-3 text-xs text-danger">{error.message.split("\n")[0]}</p>
              )}
            </div>
          </div>
        )}
      </>
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
