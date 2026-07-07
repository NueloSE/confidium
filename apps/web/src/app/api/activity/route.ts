import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbiItem, zeroAddress } from "viem";
import { SEPOLIA_CHAIN_ID } from "@confidium/core";
import { getServerClient } from "@/lib/clients";
import { getPairsCached } from "@/lib/registry-data";

export const revalidate = 30;
// Public-RPC log scanning can take longer than Vercel's default 10s function limit; allow more.
export const maxDuration = 60;

// Every ERC-7984 balance change emits this (verified on-chain). All three fields are indexed;
// `amount` is an encrypted handle, so amounts stay private — we never surface a number.
const confidentialTransfer = parseAbiItem(
  "event ConfidentialTransfer(address indexed from, address indexed to, bytes32 indexed amount)",
);

export type ActivityKind = "wrap" | "unwrap" | "send" | "receive";

export interface ActivityItem {
  kind: ActivityKind;
  wrapper: string;
  symbol: string;
  counterparty: string; // the other party for send/receive; "" for wrap/unwrap
  txHash: string;
  blockNumber: string;
  timestamp: number | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user");
  if (!user || !isAddress(user)) {
    return NextResponse.json({ items: [], error: "bad params" }, { status: 400 });
  }

  try {
    const u = getAddress(user);
    const lower = u.toLowerCase();
    const client = getServerClient(SEPOLIA_CHAIN_ID);
    const { pairs } = await getPairsCached(SEPOLIA_CHAIN_ID);
    if (pairs.length === 0) return NextResponse.json({ items: [] });

    const symbolByWrapper = new Map(
      pairs.map((p) => [p.wrapper.toLowerCase(), p.wrapperMeta.symbol ?? "cToken"]),
    );
    const wrappers = pairs.map((p) => getAddress(p.wrapper));

    // A dedicated RPC (Alchemy/Infura) allows wide getLogs ranges → a few big windows (fast).
    // Public RPCs hard-cap at ~1000 blocks → many small windows (reliable, slower). Cached either way.
    const dedicatedRpc = Boolean(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
    const CHUNK = dedicatedRpc ? 9_000n : 950n;
    const WINDOWS = dedicatedRpc ? 6 : 28;
    const CONCURRENCY = 5;
    const latest = await client.getBlockNumber();

    const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
    let cursor = latest;
    for (let i = 0; i < WINDOWS; i++) {
      const fromBlock = cursor > CHUNK ? cursor - CHUNK : 0n;
      ranges.push({ fromBlock, toBlock: cursor });
      if (fromBlock === 0n) break;
      cursor = fromBlock - 1n;
    }

    async function windowLogs(fromBlock: bigint, toBlock: bigint) {
      try {
        return await client.getLogs({ address: wrappers, event: confidentialTransfer, fromBlock, toBlock });
      } catch {
        return [] as const;
      }
    }
    type TransferLog = Awaited<ReturnType<typeof windowLogs>>[number];

    const collected: TransferLog[] = [];
    for (let i = 0; i < ranges.length; i += CONCURRENCY) {
      const batch = await Promise.all(
        ranges.slice(i, i + CONCURRENCY).map((r) => windowLogs(r.fromBlock, r.toBlock)),
      );
      for (const arr of batch) collected.push(...arr);
    }

    const seen = new Set<string>();
    const mine = collected.filter((l) => {
      const key = `${l.transactionHash}:${l.logIndex}`;
      if (seen.has(key)) return false;
      seen.add(key);
      const from = l.args.from?.toLowerCase();
      const to = l.args.to?.toLowerCase();
      return from === lower || to === lower;
    });

    const shaped: ActivityItem[] = mine.map((l) => {
      const from = (l.args.from ?? zeroAddress) as string;
      const to = (l.args.to ?? zeroAddress) as string;
      let kind: ActivityKind;
      let counterparty = "";
      if (from === zeroAddress) {
        kind = "wrap";
      } else if (to === zeroAddress) {
        kind = "unwrap";
      } else if (from.toLowerCase() === lower) {
        kind = "send";
        counterparty = to;
      } else {
        kind = "receive";
        counterparty = from;
      }
      return {
        kind,
        wrapper: l.address,
        symbol: symbolByWrapper.get(l.address.toLowerCase()) ?? "cToken",
        counterparty,
        txHash: l.transactionHash,
        blockNumber: l.blockNumber.toString(),
        timestamp: null,
      };
    });

    shaped.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)));
    const items = shaped.slice(0, 40);

    // Best-effort timestamps for the (few) blocks in view.
    const uniqueBlocks = [...new Set(items.map((i) => i.blockNumber))];
    const ts = new Map<string, number>();
    await Promise.all(
      uniqueBlocks.map(async (bn) => {
        try {
          const block = await client.getBlock({ blockNumber: BigInt(bn) });
          ts.set(bn, Number(block.timestamp));
        } catch {
          /* skip */
        }
      }),
    );
    for (const item of items) item.timestamp = ts.get(item.blockNumber) ?? null;

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: (e as Error).message }, { status: 500 });
  }
}
