"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useSignTypedData } from "wagmi";
import { formatUnits } from "viem";
import { erc7984Abi } from "@confidium/core";
import { getFhevmInstance } from "@/lib/fhevm";

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
}: {
  token: DecryptToken;
  /** Reports the revealed balance (base units) to a parent, or null when hidden/stale. */
  onValue?: (clear: bigint | null) => void;
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
            onClick={() => {
              setValue(null);
              onValue?.(null);
            }}
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
