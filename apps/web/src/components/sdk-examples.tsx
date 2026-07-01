"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/components/ui/cn";

const INSTALL = "npm install @confidium/core viem";

const TABS = {
  Read: `import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { getEnrichedPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";

const client = createPublicClient({ chain: sepolia, transport: http() });

// Every ERC-20 ↔ ERC-7984 pair, enriched + verified, in one call
const pairs = await getEnrichedPairs(client, SEPOLIA_CHAIN_ID);`,
  Verify: `import { enrichPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";

// Validate any pair: metadata, ERC-165 check, provenance badge
const [pair] = await enrichPairs(client, [
  { chainId: SEPOLIA_CHAIN_ID, underlying: "0x…", wrapper: "0x…",
    isValid: true, source: "custom" },
]);

pair.badge;         // "official" | "mock" | "custom" | "unverified"
pair.supports7984;  // true`,
  Addresses: `import {
  REGISTRY_ADDRESS,
  SEPOLIA_CHAIN_ID,
  ERC7984_INTERFACE_ID, // 0x4958f2a4
  erc7984Abi,
  registryAbi,
} from "@confidium/core";

REGISTRY_ADDRESS[SEPOLIA_CHAIN_ID];
// 0x2f0750Bbb0A246059d80e94c454586a7F27a128e`,
} as const;

type Tab = keyof typeof TABS;

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy"}
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
        copied
          ? "border-success/30 bg-success-soft text-success"
          : "border-hairline bg-surface text-zinc-300 hover:border-hairline-strong hover:bg-elevated",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SdkExamples() {
  const [tab, setTab] = useState<Tab>("Read");

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Install</div>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 px-4 py-3">
        <Terminal className="h-4 w-4 shrink-0 text-zinc-500" />
        <code className="flex-1 overflow-x-auto font-mono text-sm text-zinc-200">{INSTALL}</code>
        <CopyButton text={INSTALL} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Code examples
          </span>
          <div className="flex gap-1">
            {(Object.keys(TABS) as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                  tab === t
                    ? "bg-accent-soft text-accent-hover"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto p-4 pr-16 font-mono text-xs leading-relaxed text-zinc-300">
            <code>{TABS[tab]}</code>
          </pre>
          <CopyButton text={TABS[tab]} className="absolute right-2 top-2" />
        </div>
      </div>
    </div>
  );
}
