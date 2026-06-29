"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { TokenIcon } from "./token-icon";
import { cn } from "./ui/cn";

export type SwitcherPair = { wrapper: string; symbol?: string; name?: string };

/** Token-selector dropdown to hop between pairs without returning to the registry. */
export function PairSwitcher({
  pairs,
  current,
  currentSymbol,
}: {
  pairs: SwitcherPair[];
  current: string;
  currentSymbol?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch pair"
        className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-zinc-100 transition-colors duration-150 hover:border-hairline-strong hover:bg-elevated"
      >
        <TokenIcon address={current} symbol={currentSymbol} size="sm" confidential />
        <span className="max-w-32 truncate">{currentSymbol ?? "Switch pair"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-500 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-fade-up absolute right-0 z-30 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-hairline-strong bg-elevated p-1.5 shadow-2xl shadow-black/50"
        >
          {pairs.map((p) => {
            const isCurrent = p.wrapper.toLowerCase() === current.toLowerCase();
            return (
              <button
                key={p.wrapper}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  setOpen(false);
                  if (!isCurrent) router.push(`/pair/${p.wrapper}`);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150",
                  isCurrent ? "bg-accent-soft" : "hover:bg-white/5",
                )}
              >
                <TokenIcon address={p.wrapper} symbol={p.symbol} size="sm" confidential />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {p.symbol ?? "—"}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">{p.name}</span>
                </span>
                {isCurrent && <Check className="h-4 w-4 shrink-0 text-accent-hover" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
