"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useSignTypedData } from "wagmi";
import { formatUnits } from "viem";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { erc7984Abi } from "@confidium/core";
import { getFhevmInstance } from "@/lib/fhevm";
import { cn } from "./ui/cn";

type DecryptSession = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimeStamp: number;
  durationDays: number;
  contractAddresses: string[];
};

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const sessions = new Map<string, DecryptSession>();

export interface DecryptToken {
  address: `0x${string}`;
  symbol?: string;
  decimals?: number;
}

/**
 * Reveal the connected wallet's confidential balance of ANY ERC-7984 token via EIP-712
 * user-decryption. Reused by the pair page and the universal "decrypt any token" tool.
 */
export function DecryptBalance({
  token,
  onValue,
  embedded = false,
}: {
  token: DecryptToken;
  /** Reports the revealed balance (base units) to a parent, or null when hidden/stale. */
  onValue?: (clear: bigint | null) => void;
  /** When true, drops the outer card so it can sit inside a grouped "Balances" panel. */
  embedded?: boolean;
}) {
  const dec = token.decimals ?? 6;
  const symbol = token.symbol ?? "cToken";
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [value, setValue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: handle } = useReadContract({
    address: token.address,
    abi: erc7984Abi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  // Hide a previously-revealed value when the handle changes (e.g. after wrap/unwrap).
  useEffect(() => {
    setValue(null);
    onValue?.(null);
  }, [handle, onValue]);

  async function reveal() {
    if (!address || !handle) return;
    setError(null);
    if (handle === ZERO_HANDLE) {
      setValue("0");
      onValue?.(0n);
      return;
    }
    setBusy(true);
    try {
      const instance = await getFhevmInstance();
      const key = `${address}:${token.address}`;
      let session = sessions.get(key);

      if (!session) {
        const keypair = instance.generateKeypair();
        const startTimeStamp = Math.floor(Date.now() / 1000);
        const durationDays = 10;
        const contractAddresses = [token.address];
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
        sessions.set(key, session);
      }

      const result = (await instance.userDecrypt(
        [{ handle: handle as string, contractAddress: token.address }],
        session.privateKey,
        session.publicKey,
        session.signature,
        session.contractAddresses,
        address,
        session.startTimeStamp,
        session.durationDays,
      )) as unknown as Record<string, bigint | boolean | string>;

      const clear = result[handle];
      const clearBig = BigInt(clear ?? 0);
      setValue(formatUnits(clearBig, dec));
      onValue?.(clearBig);
    } catch (e) {
      setError((e as Error).message.split("\n")[0] ?? "Decryption failed");
    } finally {
      setBusy(false);
    }
  }

  const revealed = value != null;

  return (
    <div
      className={cn(
        "transition-colors duration-300",
        !embedded &&
          cn("rounded-2xl border bg-surface px-5 py-4", revealed ? "border-success/25" : "border-hairline"),
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Your confidential {symbol} balance</span>
            {!revealed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
                <Lock className="h-3 w-3" /> encrypted
              </span>
            )}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">
            {revealed ? (
              <span className="animate-reveal font-mono tabular-nums text-success">
                {value} <span className="text-sm font-normal text-zinc-500">{symbol}</span>
              </span>
            ) : (
              <span className="font-mono tabular-nums text-zinc-400" aria-hidden>
                <span className="encrypted-blur">8,675,309</span>{" "}
                <span className="text-sm text-zinc-600">{symbol}</span>
              </span>
            )}
          </div>
        </div>
        {revealed ? (
          <button
            type="button"
            onClick={() => {
              setValue(null);
              onValue?.(null);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-white/3 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors duration-150 hover:border-hairline-strong hover:bg-white/6"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide
          </button>
        ) : (
          <button
            type="button"
            onClick={reveal}
            disabled={busy || !handle}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-accent-fg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            {busy ? "Decrypting…" : "Reveal"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <p className="mt-2 text-xs text-zinc-600">
        Decrypted privately via EIP-712 — only you can read this value.
      </p>
    </div>
  );
}
