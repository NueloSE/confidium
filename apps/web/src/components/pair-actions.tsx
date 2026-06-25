"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWatchAsset,
  useWriteContract,
} from "wagmi";
import { bytesToHex, encodeFunctionData, formatUnits, parseEventLogs, parseUnits } from "viem";
import { erc20Abi, erc7984Abi, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { getFhevmInstance } from "@/lib/fhevm";
import type { UiPair } from "@/lib/pair";

const inputCls =
  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600";
const btnCls =
  "shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">{title}</h3>
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
    <p className="mt-2 text-xs text-neutral-500">
      {isConfirming ? "Confirming…" : isConfirmed ? "✓ Confirmed" : "Submitted"}{" "}
      <a
        className="underline transition hover:text-neutral-300"
        href={`https://sepolia.etherscan.io/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
      >
        view tx
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-900 bg-neutral-950/40 px-5 py-4">
      <div>
        <div className="text-xs text-neutral-500">Your {symbol} balance</div>
        <div className="text-lg font-semibold text-neutral-100">
          {formatted} <span className="text-sm text-neutral-500">{symbol}</span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-200 transition hover:bg-neutral-900"
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
        Add {symbol} to MetaMask
      </button>
    </div>
  );
}

function FaucetCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
  const dec = pair.underlyingMeta.decimals ?? 18;
  const [amount, setAmount] = useState("1000");
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) onDone();
  }, [isConfirmed, onDone]);

  function claim() {
    if (!address) return;
    writeContract({
      address: pair.underlying as `0x${string}`,
      abi: erc20Abi,
      functionName: "mint",
      args: [address, safeParse(amount, dec)],
    });
  }

  return (
    <Card title={`Faucet — get test ${pair.underlyingMeta.symbol ?? "tokens"}`}>
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
      {error && <p className="mt-2 text-xs text-rose-400">{error.message.split("\n")[0]}</p>}
      <TxStatus hash={hash} isConfirming={isConfirming} isConfirmed={isConfirmed} />
      <p className="mt-2 text-xs text-neutral-600">Mints mock underlying tokens (max 1,000,000 / call).</p>
    </Card>
  );
}

function WrapCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
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

  const needsApproval = allowance == null || allowance < amountWei;

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      void refetchAllowance();
      onDone();
    }
  }, [isConfirmed, onDone, refetchAllowance]);

  function approve() {
    writeContract({
      address: pair.underlying as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [pair.wrapper as `0x${string}`, amountWei],
    });
  }

  function wrap() {
    if (!address) return;
    writeContract({
      address: pair.wrapper as `0x${string}`,
      abi: erc7984Abi,
      functionName: "wrap",
      args: [address, amountWei],
    });
  }

  return (
    <Card title={`Wrap → ${pair.wrapperMeta.symbol ?? "confidential"}`}>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
        {needsApproval ? (
          <button className={btnCls} onClick={approve} disabled={isPending || amountWei === 0n}>
            {isPending ? "…" : "Approve"}
          </button>
        ) : (
          <button className={btnCls} onClick={wrap} disabled={isPending || amountWei === 0n}>
            {isPending ? "…" : "Wrap"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error.message.split("\n")[0]}</p>}
      <TxStatus hash={hash} isConfirming={isConfirming} isConfirmed={isConfirmed} />
      <p className="mt-2 text-xs text-neutral-600">
        {needsApproval
          ? "Approve the wrapper to spend your tokens, then wrap."
          : "Wrap into the confidential token — your balance becomes encrypted."}
      </p>
    </Card>
  );
}

type DecryptSession = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimeStamp: number;
  durationDays: number;
  contractAddresses: string[];
};

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const decryptSessions = new Map<string, DecryptSession>();

function RevealBalance({ pair, refreshKey }: { pair: UiPair; refreshKey: number }) {
  const dec = pair.wrapperMeta.decimals ?? 6;
  const symbol = pair.wrapperMeta.symbol ?? "cToken";
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [value, setValue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: handle } = useReadContract({
    address: pair.wrapper as `0x${string}`,
    abi: erc7984Abi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  // Hide a previously-revealed value when the balance handle changes (e.g. after wrap).
  useEffect(() => {
    setValue(null);
  }, [handle, refreshKey]);

  async function reveal() {
    if (!address || !handle) return;
    setError(null);
    if (handle === ZERO_HANDLE) {
      setValue("0");
      return;
    }
    setBusy(true);
    try {
      const instance = await getFhevmInstance();
      const wrapper = pair.wrapper;
      const key = `${address}:${wrapper}`;
      let session = decryptSessions.get(key);

      if (!session) {
        const keypair = instance.generateKeypair();
        const startTimeStamp = Math.floor(Date.now() / 1000);
        const durationDays = 10;
        const contractAddresses = [wrapper];
        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimeStamp,
          durationDays,
        ) as unknown as {
          domain: Record<string, unknown>;
          types: { UserDecryptRequestVerification: unknown };
          message: Record<string, unknown>;
        };
        const signature = await signTypedDataAsync({
          domain: eip712.domain,
          types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          primaryType: "UserDecryptRequestVerification",
          message: eip712.message,
        } as unknown as Parameters<typeof signTypedDataAsync>[0]);

        session = {
          publicKey: keypair.publicKey,
          privateKey: keypair.privateKey,
          signature: signature.replace("0x", ""),
          startTimeStamp,
          durationDays,
          contractAddresses,
        };
        decryptSessions.set(key, session);
      }

      const result = (await instance.userDecrypt(
        [{ handle: handle as string, contractAddress: wrapper }],
        session.privateKey,
        session.publicKey,
        session.signature,
        session.contractAddresses,
        address,
        session.startTimeStamp,
        session.durationDays,
      )) as unknown as Record<string, bigint | boolean | string>;

      const clear = result[handle];
      setValue(formatUnits(BigInt(clear ?? 0), dec));
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Decryption failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-neutral-500">Your confidential {symbol} balance</div>
          <div className="text-lg font-semibold text-neutral-100">
            {value != null ? (
              <>
                {value} <span className="text-sm text-neutral-500">{symbol}</span>
              </>
            ) : (
              <span className="text-neutral-400">🔒 encrypted</span>
            )}
          </div>
        </div>
        {value != null ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-200 transition hover:bg-neutral-900"
          >
            Hide
          </button>
        ) : (
          <button
            type="button"
            onClick={reveal}
            disabled={busy || !handle}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40"
          >
            {busy ? "Decrypting…" : "👁 Reveal"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      <p className="mt-2 text-xs text-neutral-600">
        Decrypted privately via EIP-712 — only you can read this value.
      </p>
    </div>
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

function UnwrapCard({ pair, onDone }: { pair: UiPair; onDone: () => void }) {
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
      console.error("[unwrap] publicDecrypt error:", e);
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
        setPhase("done");
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
        <button
          className="shrink-0 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-300"
          onClick={confirmBurn}
        >
          Confirm unwrap
        </button>
      );
    }
    if (phase === "finalizeReady") {
      return (
        <button
          className="shrink-0 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-300"
          onClick={finalize}
        >
          Finalize → release
        </button>
      );
    }
    if (phase === "decryptFailed") {
      return (
        <button
          className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-300"
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
    <Card title={`Unwrap → ${symbol}`}>
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
      {phase === "ready" && (
        <p className="mt-2 text-xs text-emerald-400">
          Encrypted ✓ — click <span className="font-medium">Confirm unwrap</span> to sign the burn.
        </p>
      )}
      {phase === "decrypting" && (
        <p className="mt-2 text-xs text-amber-400">Burned ✓ — decrypting the amount…</p>
      )}
      {phase === "finalizeReady" && (
        <p className="mt-2 text-xs text-emerald-400">
          Decrypted ✓ — click <span className="font-medium">Finalize</span> to release your {symbol}{" "}
          (one more signature).
        </p>
      )}
      {hash && (
        <p className="mt-2 text-xs text-neutral-500">
          <a
            className="underline transition hover:text-neutral-300"
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            view tx ↗
          </a>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      {phase === "done" && (
        <p className="mt-2 text-xs text-emerald-400">✓ Unwrapped — your {symbol} balance is back up.</p>
      )}
      <p className="mt-2 text-xs text-neutral-600">
        Burns confidential tokens, decrypts the amount, then releases the ERC-20 (2 signatures).
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
  const bump = () => setRefreshKey((k) => k + 1);

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 text-sm text-neutral-400">
        Connect your wallet to use the faucet and wrap/unwrap.
      </p>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 text-sm text-amber-300">
        Wrong network.{" "}
        <button className="underline" onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}>
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <BalanceBar pair={pair} refreshKey={refreshKey} />
      <RevealBalance pair={pair} refreshKey={refreshKey} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FaucetCard pair={pair} onDone={bump} />
        <WrapCard pair={pair} onDone={bump} />
        <UnwrapCard pair={pair} onDone={bump} />
      </div>
    </div>
  );
}
