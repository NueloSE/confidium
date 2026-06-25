import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbiItem } from "viem";
import { SEPOLIA_CHAIN_ID } from "@confidium/core";
import { getServerClient } from "@/lib/clients";

const requestedEvent = parseAbiItem(
  "event UnwrapRequested(address indexed receiver, bytes32 indexed unwrapRequestId, bytes32 amount)",
);
const finalizedEvent = parseAbiItem(
  "event UnwrapFinalized(address indexed receiver, bytes32 indexed unwrapRequestId, bytes32 encryptedAmount, uint64 cleartextAmount)",
);

/**
 * Server-side detection of unwraps that were burned but never finalized, for a given wrapper +
 * user. Done server-side because public RPCs 403 browser-origin `eth_getLogs`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wrapper = searchParams.get("wrapper");
  const user = searchParams.get("user");
  if (!wrapper || !user || !isAddress(wrapper) || !isAddress(user)) {
    return NextResponse.json({ pending: [], error: "bad params" }, { status: 400 });
  }

  try {
    const client = getServerClient(SEPOLIA_CHAIN_ID);
    // Public RPCs cap eth_getLogs at a 10k-block range; a recent window covers interrupted unwraps.
    const latest = await client.getBlockNumber();
    const fromBlock = latest > 9_500n ? latest - 9_500n : 0n;
    const [reqs, fins] = await Promise.all([
      client.getLogs({
        address: getAddress(wrapper),
        event: requestedEvent,
        args: { receiver: getAddress(user) },
        fromBlock,
      }),
      client.getLogs({
        address: getAddress(wrapper),
        event: finalizedEvent,
        args: { receiver: getAddress(user) },
        fromBlock,
      }),
    ]);
    const done = new Set(fins.map((l) => l.args.unwrapRequestId as string));
    const pending = [
      ...new Set(
        reqs
          .map((l) => l.args.unwrapRequestId as string)
          .filter((id) => Boolean(id) && !done.has(id)),
      ),
    ];
    return NextResponse.json({ pending });
  } catch (e) {
    return NextResponse.json({ pending: [], error: (e as Error).message }, { status: 500 });
  }
}
