/**
 * Phase-1 READ spike — validate the live Sepolia Wrappers Registry against our assumptions.
 * No private key / gas required. Run: pnpm exec tsx scripts/spike-read.ts
 *
 * Resolves (reference §12): registry return shapes, supportsInterface id, metadata/decimals,
 * bidirectional lookups, and whether `confidentialBalanceOf(address)` exists + returns a handle.
 */
import { createPublicClient, http, type Address, getAddress } from "viem";
import { sepolia } from "viem/chains";

const REGISTRY: Address = "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";
const ERC7984_INTERFACE_ID = "0x4958f2a4";
const ZERO: Address = "0x0000000000000000000000000000000000000000";

const registryAbi = [
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsSlice",
    stateMutability: "view",
    inputs: [
      { name: "fromIndex", type: "uint256" },
      { name: "toIndex", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
  {
    type: "function",
    name: "getTokenAddress",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "token", type: "address" },
    ],
  },
] as const;

const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

const erc7984Abi = [
  ...erc20Abi,
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ type: "bytes4" }],
    outputs: [{ type: "bool" }],
  },
  { type: "function", name: "rate", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || undefined),
});

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    console.log(`   ⚠️  ${label}: ${(e as Error).message.split("\n")[0]}`);
    return undefined;
  }
}

async function main() {
  console.log(`\n=== Confidium Phase-1 READ spike (Sepolia) ===`);
  console.log(`RPC: ${client.transport.url ?? "viem default"}`);
  console.log(`Registry: ${REGISTRY}\n`);

  const length = (await client.readContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsLength",
  })) as bigint;
  console.log(`Registry pairs length: ${length}`);

  const pairs = (await client.readContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsSlice",
    args: [0n, length],
  })) as ReadonlyArray<{ tokenAddress: Address; confidentialTokenAddress: Address; isValid: boolean }>;

  console.log(`Slice(0, ${length}) returned ${pairs.length} pairs\n`);

  for (const [i, p] of pairs.entries()) {
    console.log(`#${i}  isValid=${p.isValid}`);
    console.log(`   underlying : ${p.tokenAddress}`);
    console.log(`   wrapper    : ${p.confidentialTokenAddress}`);

    const wSym = await safe("wrapper.symbol", () =>
      client.readContract({ address: p.confidentialTokenAddress, abi: erc7984Abi, functionName: "symbol" }),
    );
    const wDec = await safe("wrapper.decimals", () =>
      client.readContract({ address: p.confidentialTokenAddress, abi: erc7984Abi, functionName: "decimals" }),
    );
    const uSym = await safe("underlying.symbol", () =>
      client.readContract({ address: p.tokenAddress, abi: erc20Abi, functionName: "symbol" }),
    );
    const uDec = await safe("underlying.decimals", () =>
      client.readContract({ address: p.tokenAddress, abi: erc20Abi, functionName: "decimals" }),
    );
    const supports = await safe("supportsInterface(0x4958f2a4)", () =>
      client.readContract({
        address: p.confidentialTokenAddress,
        abi: erc7984Abi,
        functionName: "supportsInterface",
        args: [ERC7984_INTERFACE_ID],
      }),
    );
    const rate = await safe("wrapper.rate()", () =>
      client.readContract({ address: p.confidentialTokenAddress, abi: erc7984Abi, functionName: "rate" }),
    );
    const reverse = await safe("registry.getTokenAddress(wrapper)", () =>
      client.readContract({
        address: REGISTRY,
        abi: registryAbi,
        functionName: "getTokenAddress",
        args: [p.confidentialTokenAddress],
      }),
    );
    const bidirOk =
      Array.isArray(reverse) && getAddress(reverse[1] as Address) === getAddress(p.tokenAddress);

    console.log(
      `   meta: wrapper=${wSym}(${wDec}d) underlying=${uSym}(${uDec}d) supports7984=${supports} rate=${rate} bidirOk=${bidirOk}`,
    );
  }

  // Does confidentialBalanceOf exist + return a handle? Probe with the zero address.
  console.log(`\n--- confidentialBalanceOf probe (zero address) ---`);
  const probeWrapper = pairs[0]?.confidentialTokenAddress;
  if (probeWrapper) {
    const handle = await safe("confidentialBalanceOf(0x0)", () =>
      client.readContract({
        address: probeWrapper,
        abi: erc7984Abi,
        functionName: "confidentialBalanceOf",
        args: [ZERO],
      }),
    );
    console.log(`   ${probeWrapper}.confidentialBalanceOf(0x0) = ${handle}`);
  }

  console.log(`\n=== FINDINGS (write back into docs/zama-integration-reference.md) ===`);
  console.log(`- length/slice + tuple{token,wrapper,isValid} shape: see above`);
  console.log(`- supportsInterface(0x4958f2a4): see per-pair 'supports7984'`);
  console.log(`- confidentialBalanceOf(address)->bytes32 exists?: see probe`);
  console.log(`- bidirectional lookup consistency: see per-pair 'bidirOk'`);
  console.log(`\nDone.\n`);
}

main().catch((e) => {
  console.error("SPIKE FAILED:", e);
  process.exit(1);
});
