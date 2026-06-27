import { Check, Loader2, X } from "lucide-react";
import { cn } from "./ui/cn";

type StepState = "upcoming" | "active" | "processing" | "complete" | "error";

const STEPS = [
  { key: "burn", label: "Burn", desc: "Encrypt the amount and sign the burn" },
  { key: "decrypt", label: "Decrypt", desc: "Publicly decrypt the burned amount" },
  { key: "finalize", label: "Finalize", desc: "Release your ERC-20 (one more signature)" },
] as const;

/** Derive each step's visual state from the existing unwrap `phase` (read-only). */
function statesFor(phase: string): Record<string, StepState> {
  const burnDone = ["decrypting", "decryptFailed", "finalizeReady", "finalizing"].includes(phase);
  const decryptDone = ["finalizeReady", "finalizing"].includes(phase);
  return {
    burn: burnDone
      ? "complete"
      : phase === "error"
        ? "error"
        : phase === "burning" || phase === "encrypting"
          ? "processing"
          : phase === "ready"
            ? "active"
            : "upcoming",
    decrypt: decryptDone
      ? "complete"
      : phase === "decryptFailed"
        ? "error"
        : phase === "decrypting"
          ? "processing"
          : "upcoming",
    finalize:
      phase === "finalizing"
        ? "processing"
        : phase === "finalizeReady"
          ? "active"
          : "upcoming",
  };
}

function Node({ state, index }: { state: StepState; index: number }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-1 transition-colors duration-200",
        state === "complete" && "bg-success-soft text-success ring-success/30",
        state === "error" && "bg-danger-soft text-danger ring-danger/30",
        (state === "active" || state === "processing") && "bg-accent-soft text-accent-hover ring-accent/40",
        state === "upcoming" && "bg-white/3 text-zinc-600 ring-hairline",
      )}
    >
      {state === "complete" ? (
        <Check className="h-3.5 w-3.5" />
      ) : state === "error" ? (
        <X className="h-3.5 w-3.5" />
      ) : state === "processing" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        index + 1
      )}
    </span>
  );
}

export function UnwrapSteps({ phase }: { phase: string }) {
  const states = statesFor(phase);
  return (
    <ol className="mt-3 space-y-0">
      {STEPS.map((step, i) => {
        const state = states[step.key] ?? "upcoming";
        const active = state === "active" || state === "processing";
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Node state={state} index={i} />
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "my-0.5 w-px flex-1 transition-colors duration-200",
                    state === "complete" ? "bg-success/30" : "bg-hairline",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-3", i === STEPS.length - 1 && "pb-0")}>
              <div
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  state === "complete" && "text-zinc-300",
                  state === "error" && "text-danger",
                  active && "text-zinc-100",
                  state === "upcoming" && "text-zinc-500",
                )}
              >
                {step.label}
              </div>
              <div className="text-xs text-zinc-500">{step.desc}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
