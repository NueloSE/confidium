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
  id: string; // `${txHash}:${logIndex}` — stable, for client-side de-dupe/merge
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

    // Reliability first: small (<1000-block) windows with logs FILTERED by the user (from OR to),
    // so every response is tiny and returns fast — never times out (unfiltered wide scans choke the
    // RPC). Covers ~1 day of recent activity; the client accumulates the rest in local storage.
    const CHUNK = 900n;
    const WINDOWS = 8;
    const CONCURRENCY = 6;
    const latest = await client.getBlockNumber();

    type Query = { args: { from?: `0x${string}`; to?: `0x${string}` }; fromBlock: bigint; toBlock: bigint };
    const queries: Query[] = [];
    let cursor = latest;
    for (let i = 0; i < WINDOWS; i++) {
      const fromBlock = cursor > CHUNK ? cursor - CHUNK : 0n;
      queries.push({ args: { from: u }, fromBlock, toBlock: cursor });
      queries.push({ args: { to: u }, fromBlock, toBlock: cursor });
      if (fromBlock === 0n) break;
      cursor = fromBlock - 1n;
    }

    async function runQuery(q: Query) {
      try {
        return await client.getLogs({
          address: wrappers,
          event: confidentialTransfer,
          args: q.args,
          fromBlock: q.fromBlock,
          toBlock: q.toBlock,
        });
      } catch {
        return [] as const;
      }
    }
    type TransferLog = Awaited<ReturnType<typeof runQuery>>[number];

    const seen = new Set<string>();
    const mine: TransferLog[] = [];
    for (let i = 0; i < queries.length; i += CONCURRENCY) {
      const batch = await Promise.all(queries.slice(i, i + CONCURRENCY).map(runQuery));
      for (const arr of batch) {
        for (const l of arr) {
          const key = `${l.transactionHash}:${l.logIndex}`;
          if (seen.has(key)) continue;
          seen.add(key);
          mine.push(l);
        }
      }
    }

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
        id: `${l.transactionHash}:${l.logIndex}`,
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
