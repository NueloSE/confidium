"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWatchAsset,
  useWriteContract,
} from "wagmi";
import {
  bytesToHex,
  encodeFunctionData,
  formatUnits,
  getAddress,
  isAddress,
  parseEventLogs,
  parseUnits,
} from "viem";
import { erc20Abi, erc7984Abi, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { Check, Droplets, Lock, Send, ShieldAlert, Unlock, Wallet } from "lucide-react";
import { getFhevmInstance } from "@/lib/fhevm";
import { DecryptBalance } from "@/components/decrypt-balance";
import { UnwrapSteps } from "@/components/unwrap-steps";
import type { UiPair } from "@/lib/pair";

const inputCls =
  "h-10 w-full rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-zinc-100 outline-none transition-colors duration-150 placeholder:text-zinc-600 hover:border-hairline-strong focus:border-accent/70 disabled:opacity-50";
// Card primary action (initiate) — violet. Confidential confirm steps use emerald below.
const btnCls =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-40";
// Confidential confirm / release — emerald (the "confirmed" moment).
const confirmCls =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-success px-4 text-sm font-medium text-black transition-[filter,transform] duration-150 ease-out hover:brightness-105 active:translate-y-px";

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

function TxStatus({
  hash,
  isConfirming,
  isConfirmed,
}: {
  hash?: `0x${string}`;
  isConfirming: boolean;
  isConfirmed: boolean;
}) {
  if (!hash) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        {isConfirming && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" />}
        {isConfirming ? "Confirming…" : isConfirmed ? "Confirmed" : "Submitted"}
      </span>
      <a
        className="underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-300"
        href={`https://sepolia.etherscan.io/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
      >
        view tx ↗
      </a>
    </p>
  );
}

/** Persistent success line, decoupled from form state so a card can reset after a tx confirms. */
function ResultLine({ hash, label }: { hash: `0x${string}`; label: string }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
      <Check className="h-3.5 w-3.5" />
      {label} —{" "}
      <a
        className="underline decoration-success/40 underline-offset-2 transition-colors hover:text-success/80"
        href={`https://sepolia.etherscan.io/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
      >
        view tx ↗
      </a>
    </p>
  );
}

function safeParse(value: string, decimals: number): bigint {
  try {
    return parseUnits(value || "0", decimals);
  } catch {
    return 0n;
  }
}

/** The SDK may return ciphertext handles/proofs as Uint8Array or hex string — normalize to hex. */
function toHexHandle(h: unknown): `0x${string}` {
  if (typeof h === "string") return (h.startsWith("0x") ? h : `0x${h}`) as `0x${string}`;
  return bytesToHex(h as Uint8Array);
}

function BalanceBar({ pair, refreshKey }: { pair: UiPair; refreshKey: number }) {
  const dec = pair.underlyingMeta.decimals ?? 18;
  const symbol = pair.underlyingMeta.symbol ?? "TOKEN";
  const { address } = useAccount();
  const { watchAsset } = useWatchAsset();

  const { data: balance, refetch } = useReadContract({
    address: pair.underlying as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  useEffect(() => {
    void refetch();
  }, [refreshKey, refetch]);

  const formatted = balance != null ? formatUnits(balance, dec) : "—";

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface px-5 py-4">
      <div>
        <div className="text-xs text-zinc-500">Your {symbol} balance</div>
        <div className="text-lg font-semibold text-zinc-100">
          <span className="font-mono tabular-nums">{formatted}</span>{" "}
          <span className="text-sm text-zinc-500">{symbol}</span>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-white/3 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors duration-150 hover:border-hairline-strong hover:bg-white/6"
        onClick={() =>
          watchAsset({
            type: "ERC20",
            options: {
              address: pair.underlying as `0x${string}`,
              symbol: symbol.slice(0, 11),
              decimals: dec,
            },
          })
        }
      >
        <Wallet className="h-3.5 w-3.5" />
        Add {symbol} to MetaMask
      </button>
    </div>
  );
}

function FaucetCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
  const dec = pair.underlyingMeta.decimals ?? 18;
  const [amount, setAmount] = useState("1000");
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [doneHash, setDoneHash] = useState<`0x${string}` | undefined>();

  useEffect(() => {
    if (isConfirmed && hash) {
      setDoneHash(hash);
      onDone();
      reset();
    }
  }, [isConfirmed, hash, onDone, reset]);

  function claim() {
    if (!address) return;
    setDoneHash(undefined);
    writeContract({
      address: pair.underlying as `0x${string}`,
      abi: erc20Abi,
      functionName: "mint",
      args: [address, safeParse(amount, dec)],
    });
  }

  return (
    <Card
      title={`Faucet — get test ${pair.underlyingMeta.symbol ?? "tokens"}`}
      icon={<Droplets className="h-4 w-4" />}
    >
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
        <button className={btnCls} onClick={claim} disabled={isPending}>
          {isPending ? "Claiming…" : "Claim"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error.message.split("\n")[0]}</p>}
      <TxStatus hash={hash} isConfirming={isConfirming} isConfirmed={isConfirmed} />
      {doneHash && <ResultLine hash={doneHash} label="Claimed" />}
      <p className="mt-2 text-xs text-zinc-600">Mints mock underlying tokens (max 1,000,000 / call).</p>
    </Card>
  );
}

export function WrapCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
  const dec = pair.underlyingMeta.decimals ?? 18;
  const [amount, setAmount] = useState("100");
  const { address } = useAccount();
  const amountWei = safeParse(amount, dec);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: pair.underlying as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, pair.wrapper as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: balance } = useReadContract({
    address: pair.underlying as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  const needsApproval = allowance == null || allowance < amountWei;
  const insufficient = balance != null && amountWei > 0n && amountWei > balance;

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [lastAction, setLastAction] = useState<"approve" | "wrap" | null>(null);
  const [doneHash, setDoneHash] = useState<`0x${string}` | undefined>();

  useEffect(() => {
    if (!isConfirmed) return;
    void refetchAllowance();
    onDone();
    // Reset only after the wrap itself (not after the approval step).
    if (lastAction === "wrap" && hash) {
      setDoneHash(hash);
      setAmount("100");
      setLastAction(null);
      reset();
    }
  }, [isConfirmed, hash, lastAction, onDone, refetchAllowance, reset]);

  function approve() {
    setDoneHash(undefined);
    setLastAction("approve");
    writeContract({
      address: pair.underlying as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [pair.wrapper as `0x${string}`, amountWei],
    });
  }

  function wrap() {
    if (!address) return;
    setDoneHash(undefined);
    setLastAction("wrap");
    writeContract({
      address: pair.wrapper as `0x${string}`,
      abi: erc7984Abi,
      functionName: "wrap",
      args: [address, amountWei],
    });
  }

  return (
    <Card
      title={`Wrap → ${pair.wrapperMeta.symbol ?? "confidential"}`}
      icon={<Lock className="h-4 w-4" />}
    >
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
        {needsApproval ? (
          <button
            className={btnCls}
            onClick={approve}
            disabled={isPending || amountWei === 0n || insufficient}
          >
            {isPending ? "…" : "Approve"}
          </button>
        ) : (
          <button
            className={btnCls}
            onClick={wrap}
            disabled={isPending || amountWei === 0n || insufficient}
          >
            {isPending ? "…" : "Wrap"}
          </button>
        )}
      </div>
      {insufficient && (
        <p className="mt-2 text-xs text-danger">
          Insufficient {pair.underlyingMeta.symbol ?? "token"} balance — claim from the faucet first.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error.message.split("\n")[0]}</p>}
      <TxStatus hash={hash} isConfirming={isConfirming} isConfirmed={isConfirmed} />
      {doneHash && <ResultLine hash={doneHash} label="Wrapped" />}
      <p className="mt-2 text-xs text-zinc-600">
        {needsApproval
          ? "Approve the wrapper to spend your tokens, then wrap."
          : "Wrap into the confidential token — your balance becomes encrypted."}
      </p>
    </Card>
  );
}

type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type UnwrapPhase =
  | "idle"
  | "encrypting"
  | "ready"
  | "burning"
  | "decrypting"
  | "decryptFailed"
  | "finalizeReady"
  | "finalizing"
  | "done"
  | "error";

export function UnwrapCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
  const dec = pair.wrapperMeta.decimals ?? 6;
  const symbol = pair.underlyingMeta.symbol ?? "ERC-20";
  const [amount, setAmount] = useState("50");
  const { address, connector } = useAccount();
  const [phase, setPhase] = useState<UnwrapPhase>("idle");
  const [prepared, setPrepared] = useState<{ handle: `0x${string}`; proof: `0x${string}` } | null>(
    null,
  );
  const [requestId, setRequestId] = useState<`0x${string}` | null>(null);
  const [finalizeData, setFinalizeData] = useState<{ cleartext: bigint; proof: `0x${string}` } | null>(
    null,
  );
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [doneHash, setDoneHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({ hash });

  /** Send a tx straight through the connected wallet's provider (bypassing wagmi's pre-flight,
   *  which stalls on FHE encrypted inputs) with an explicit gas limit. */
  async function sendTx(data: `0x${string}`, gasLimit: number): Promise<`0x${string}`> {
    const provider = (await connector?.getProvider()) as InjectedProvider | undefined;
    if (!provider) throw new Error("No provider from the connected wallet.");
    return (await provider.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to: pair.wrapper, data, gas: `0x${gasLimit.toString(16)}` }],
    })) as `0x${string}`;
  }

  // After the burn, publicly decrypt the burned amount to get the cleartext + proof for finalize.
  async function runDecrypt(reqId: `0x${string}`) {
    setError(null);
    setPhase("decrypting");
    try {
      const instance = await getFhevmInstance();
      const res = (await instance.publicDecrypt([reqId])) as unknown as {
        clearValues: Record<string, bigint | boolean | string>;
        decryptionProof: `0x${string}`;
      };
      const raw = res.clearValues[reqId] ?? Object.values(res.clearValues)[0];
      const cleartext = typeof raw === "bigint" ? raw : BigInt((raw as string | number | undefined) ?? 0);
      setFinalizeData({ cleartext, proof: res.decryptionProof });
      setPhase("finalizeReady");
    } catch (e) {
      setError(
        (e as Error).message.split("\n")[0] ?? "Couldn't decrypt the amount yet — retry in a moment.",
      );
      setPhase("decryptFailed");
    }
  }

  // Receipt handler for BOTH the burn tx and the finalize tx (distinguished by phase).
  useEffect(() => {
    if (!receipt) return;
    if (phase === "burning") {
      if (receipt.status === "reverted") {
        setError("The unwrap (burn) transaction reverted.");
        setPhase("error");
        return;
      }
      const logs = parseEventLogs({
        abi: erc7984Abi,
        logs: receipt.logs,
        eventName: "UnwrapRequested",
      });
      const reqId = (logs[0]?.args as { unwrapRequestId?: `0x${string}` } | undefined)?.unwrapRequestId;
      if (!reqId) {
        setError("Couldn't find the unwrap request id in the burn transaction.");
        setPhase("error");
        return;
      }
      setRequestId(reqId);
      onDone();
      void runDecrypt(reqId);
    } else if (phase === "finalizing") {
      if (receipt.status === "reverted") {
        setError("The finalize transaction reverted.");
        setPhase("error");
      } else {
        // Success: confirm via doneHash, then reset to a clean idle state.
        setDoneHash(receipt.transactionHash);
        setHash(undefined);
        setRequestId(null);
        setFinalizeData(null);
        setAmount("50");
        setPhase("idle");
        onDone();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  // Step 1 — encrypt the amount (slow WASM). Kept separate so the wallet popup later fires inside a
  // fresh user-gesture (a long async before eth_sendTransaction makes the browser suppress it).
  async function prepare() {
    if (!address) return;
    setError(null);
    setHash(undefined);
    setDoneHash(undefined);
    setRequestId(null);
    setFinalizeData(null);
    try {
      setPhase("encrypting");
      const instance = await getFhevmInstance();
      const input = instance.createEncryptedInput(pair.wrapper, address);
      input.add64(parseUnits(amount || "0", dec));
      const enc = (await input.encrypt()) as unknown as { handles: unknown[]; inputProof: unknown };
      setPrepared({ handle: toHexHandle(enc.handles[0]), proof: toHexHandle(enc.inputProof) });
      setPhase("ready");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Encryption failed");
      setPhase("error");
    }
  }

  // Step 2 — burn (unwrap request). Runs on a fresh click so the popup keeps the user-gesture.
  async function confirmBurn() {
    if (!address || !prepared) return;
    setError(null);
    try {
      const data = encodeFunctionData({
        abi: erc7984Abi,
        functionName: "unwrap",
        args: [address, address, prepared.handle, prepared.proof],
      });
      const txHash = await sendTx(data, 3_000_000);
      setHash(txHash);
      setPrepared(null);
      setPhase("burning");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Unwrap failed");
      setPhase("ready");
    }
  }

  // Step 3 — finalize: release the ERC-20 using the decrypted amount + proof.
  async function finalize() {
    if (!requestId || !finalizeData) return;
    setError(null);
    try {
      const data = encodeFunctionData({
        abi: erc7984Abi,
        functionName: "finalizeUnwrap",
        args: [requestId, finalizeData.cleartext, finalizeData.proof],
      });
      const txHash = await sendTx(data, 2_000_000);
      setHash(txHash);
      setPhase("finalizing");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Finalize failed");
      setPhase("finalizeReady");
    }
  }

  const inputDisabled = !(phase === "idle" || phase === "error" || phase === "done");
  const idleLabel =
    phase === "encrypting"
      ? "Encrypting…"
      : phase === "burning"
        ? "Burning…"
        : phase === "decrypting"
          ? "Decrypting…"
          : phase === "finalizing"
            ? "Finalizing…"
            : "Prepare unwrap";

  function ActionButton() {
    if (phase === "ready") {
      return (
        <button className={confirmCls} onClick={confirmBurn}>
          <Check className="h-4 w-4" />
          Confirm unwrap
        </button>
      );
    }
    if (phase === "finalizeReady") {
      return (
        <button className={confirmCls} onClick={finalize}>
          <Unlock className="h-4 w-4" />
          Finalize → release
        </button>
      );
    }
    if (phase === "decryptFailed") {
      return (
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-warn px-4 text-sm font-medium text-black transition-[filter,transform] duration-150 ease-out hover:brightness-105 active:translate-y-px"
          onClick={() => requestId && runDecrypt(requestId)}
        >
          Retry release
        </button>
      );
    }
    return (
      <button
        className={btnCls}
        onClick={prepare}
        disabled={
          phase === "encrypting" ||
          phase === "burning" ||
          phase === "decrypting" ||
          phase === "finalizing"
        }
      >
        {idleLabel}
      </button>
    );
  }

  return (
    <Card title={`Unwrap → ${symbol}`} icon={<Unlock className="h-4 w-4" />}>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          disabled={inputDisabled}
        />
        <ActionButton />
      </div>

      {/* Guided 2-signature flow — shown once a flow is in progress. */}
      {phase !== "idle" && phase !== "error" && <UnwrapSteps phase={phase} />}

      {phase === "ready" && (
        <p className="mt-2 text-xs text-success">
          Encrypted — click <span className="font-medium">Confirm unwrap</span> to sign the burn.
        </p>
      )}
      {phase === "finalizeReady" && (
        <p className="mt-2 text-xs text-success">
          Decrypted — click <span className="font-medium">Finalize</span> to release your {symbol} (one
          more signature).
        </p>
      )}
      {hash && (
        <p className="mt-2 text-xs text-zinc-500">
          <a
            className="underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-300"
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            view tx ↗
          </a>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {doneHash && <ResultLine hash={doneHash} label={`Unwrapped — your ${symbol} is back`} />}
      <p className="mt-3 text-xs text-zinc-600">
        Burns confidential tokens, decrypts the amount, then releases the ERC-20 (2 signatures).
      </p>
    </Card>
  );
}

type TransferPhase = "idle" | "encrypting" | "ready" | "sending" | "done" | "error";

function TransferCard({
  pair,
  onDone,
  revealedBalance,
}: {
  pair: UiPair;
  onDone: () => void;
  revealedBalance?: bigint | null;
}) {
  const dec = pair.wrapperMeta.decimals ?? 6;
  const symbol = pair.wrapperMeta.symbol ?? "confidential";
  const { address, connector } = useAccount();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("10");
  const [phase, setPhase] = useState<TransferPhase>("idle");
  const [prepared, setPrepared] = useState<{ handle: `0x${string}`; proof: `0x${string}` } | null>(
    null,
  );
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [sentHash, setSentHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({ hash });
  const recipientValid = isAddress(to.trim());
  const amountWei = safeParse(amount, dec);
  const exceedsBalance = revealedBalance != null && amountWei > revealedBalance;

  async function sendTx(data: `0x${string}`, gasLimit: number): Promise<`0x${string}`> {
    const provider = (await connector?.getProvider()) as InjectedProvider | undefined;
    if (!provider) throw new Error("No provider from the connected wallet.");
    return (await provider.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to: pair.wrapper, data, gas: `0x${gasLimit.toString(16)}` }],
    })) as `0x${string}`;
  }

  useEffect(() => {
    if (!receipt || phase !== "sending") return;
    if (receipt.status === "reverted") {
      setError("The transfer transaction reverted.");
      setPhase("error");
    } else {
      // Success: confirm via sentHash, then reset the form to a clean idle state.
      setSentHash(receipt.transactionHash);
      setHash(undefined);
      setPrepared(null);
      setAmount("");
      setPhase("idle");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  // Step 1 — encrypt the amount (kept separate so the wallet popup later fires in a fresh gesture).
  async function prepare() {
    if (!address) return;
    if (!recipientValid) {
      setError("Enter a valid recipient address.");
      return;
    }
    setError(null);
    setHash(undefined);
    setSentHash(undefined);
    try {
      setPhase("encrypting");
      const instance = await getFhevmInstance();
      const input = instance.createEncryptedInput(pair.wrapper, address);
      input.add64(parseUnits(amount || "0", dec));
      const enc = (await input.encrypt()) as unknown as { handles: unknown[]; inputProof: unknown };
      setPrepared({ handle: toHexHandle(enc.handles[0]), proof: toHexHandle(enc.inputProof) });
      setPhase("ready");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Encryption failed");
      setPhase("error");
    }
  }

  // Step 2 — confidentialTransfer (one tx; the amount stays encrypted end-to-end).
  async function confirmSend() {
    if (!prepared || !recipientValid) return;
    setError(null);
    try {
      const data = encodeFunctionData({
        abi: erc7984Abi,
        functionName: "confidentialTransfer",
        args: [getAddress(to.trim()), prepared.handle, prepared.proof],
      });
      const txHash = await sendTx(data, 2_000_000);
      setHash(txHash);
      setPrepared(null);
      setPhase("sending");
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Transfer failed");
      setPhase("ready");
    }
  }

  const busy = phase === "encrypting" || phase === "sending";
  const inputsDisabled = busy || phase === "ready";

  return (
    <Card title={`Send ${symbol} privately`} icon={<Send className="h-4 w-4" />}>
      <div className="grid gap-2">
        <input
          className={inputCls}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient 0x…"
          disabled={inputsDisabled}
        />
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            disabled={inputsDisabled}
          />
          {phase === "ready" ? (
            <button className={confirmCls} onClick={confirmSend}>
              <Check className="h-4 w-4" />
              Confirm send
            </button>
          ) : (
            <button
              className={btnCls}
              onClick={prepare}
              disabled={busy || !recipientValid || exceedsBalance || amountWei === 0n}
            >
              {phase === "encrypting"
                ? "Encrypting…"
                : phase === "sending"
                  ? "Sending…"
                  : "Prepare send"}
            </button>
          )}
        </div>
      </div>
      {exceedsBalance && (
        <p className="mt-2 text-xs text-danger">
          Amount exceeds your confidential balance ({formatUnits(revealedBalance ?? 0n, dec)} {symbol})
          — ERC-7984 would transfer 0. Wrap more, or lower the amount.
        </p>
      )}
      {revealedBalance == null && phase === "idle" && (
        <p className="mt-2 text-xs text-warn/90">
          Tip: reveal your confidential balance above first — sending more than you hold silently
          transfers 0 (no error, by design).
        </p>
      )}
      {phase === "ready" && (
        <p className="mt-2 text-xs text-success">
          Encrypted — click <span className="font-medium">Confirm send</span> to sign.
        </p>
      )}
      {hash && (
        <p className="mt-2 text-xs text-zinc-500">
          <a
            className="underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-300"
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            view tx ↗
          </a>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {sentHash && <ResultLine hash={sentHash} label="Sent — stays encrypted on-chain" />}
      <p className="mt-2 text-xs text-zinc-600">
        Transfers your confidential {symbol} — the amount is never revealed publicly.
      </p>
    </Card>
  );
}

export function PairActions({ pair }: { pair: UiPair }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const wrongNetwork = chainId !== SEPOLIA_CHAIN_ID;
  const [refreshKey, setRefreshKey] = useState(0);
  const [revealed, setRevealed] = useState<bigint | null>(null);
  const bump = () => setRefreshKey((k) => k + 1);

  if (!isConnected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-5 text-sm text-zinc-400">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
          <Wallet className="h-4 w-4" />
        </span>
        Connect your wallet to use the faucet, wrap, unwrap, and send.
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm text-warn">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <span>
          Wrong network — confidential actions run on Sepolia.{" "}
          <button
            className="font-medium underline underline-offset-2 transition-colors hover:text-warn/80"
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
          >
            Switch to Sepolia
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <BalanceBar pair={pair} refreshKey={refreshKey} />
      <DecryptBalance
        token={{
          address: pair.wrapper as `0x${string}`,
          symbol: pair.wrapperMeta.symbol,
          decimals: pair.wrapperMeta.decimals,
        }}
        onValue={setRevealed}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FaucetCard pair={pair} onDone={bump} />
        <WrapCard pair={pair} onDone={bump} />
        <UnwrapCard pair={pair} onDone={bump} />
        <TransferCard pair={pair} onDone={bump} revealedBalance={revealed} />
      </div>
    </div>
  );
}
