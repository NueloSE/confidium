"use client";

import { useState } from "react";

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
    <span className="inline-flex items-center gap-1 font-mono text-xs text-neutral-400">
      {explorerBase ? (
        <a
          href={`${explorerBase}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-neutral-100"
        >
          {short}
        </a>
      ) : (
        short
      )}
      <button
        type="button"
        onClick={copy}
        title="Copy address"
        className="text-neutral-600 transition hover:text-neutral-300"
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}
