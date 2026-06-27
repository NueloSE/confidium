"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "./ui/cn";

export function AddressChip({
  address,
  explorerBase,
}: {
  address: string;
  explorerBase?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <span className="group inline-flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 font-mono text-xs text-zinc-400 transition-colors duration-150 hover:border-hairline hover:bg-white/3">
      {explorerBase ? (
        <a
          href={`${explorerBase}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          title={address}
          className="transition-colors duration-150 hover:text-zinc-100"
        >
          {short}
        </a>
      ) : (
        <span title={address}>{short}</span>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy address"}
        className={cn(
          "grid h-5 w-5 place-items-center rounded transition-colors duration-150",
          copied ? "text-success" : "text-zinc-600 hover:text-zinc-200",
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
