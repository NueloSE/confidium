# @confidium/core

Framework-agnostic SDK for the **Zama Confidential Wrappers Registry** (ERC-7984). Read the on-chain registry, enrich + verify pairs, and get canonical addresses and ABIs — using your own [viem](https://viem.sh) client. Zero React/framework dependencies.

Powers [**Confidium**](https://github.com/NueloSE/confidium) — the home of confidential tokens.

## Install

```bash
npm install @confidium/core viem
```

## Usage

### Read the registry (live, enriched, verified)

```ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { getEnrichedPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";

const client = createPublicClient({ chain: sepolia, transport: http() });

const pairs = await getEnrichedPairs(client, SEPOLIA_CHAIN_ID);
// [{ wrapper, underlying,
//    badge: "official" | "mock" | "custom" | "unverified",
//    wrapperMeta: { symbol, name, decimals }, underlyingMeta, rate, ... }]
```

### Verify an arbitrary ERC-20 ↔ ERC-7984 pair

```ts
import { enrichPairs, SEPOLIA_CHAIN_ID } from "@confidium/core";

const [pair] = await enrichPairs(client, [
  { chainId: SEPOLIA_CHAIN_ID, underlying: "0x…", wrapper: "0x…", isValid: true, source: "custom" },
]);
console.log(pair.badge, pair.supports7984, pair.bidirectionalOk);
```

### Addresses, ABIs, and constants

```ts
import {
  REGISTRY_ADDRESS,
  SEPOLIA_CHAIN_ID,
  MAINNET_CHAIN_ID,
  ERC7984_INTERFACE_ID, // 0x4958f2a4
  erc7984Abi,
  registryAbi,
} from "@confidium/core";
```

## What it does

- **Registry reads** — the full ERC-20 ↔ ERC-7984 pair set for a network, in one multicall.
- **Enrichment** — token metadata (symbol, name, decimals), conversion rate, an ERC-165 interface check, and a bidirectional-link check.
- **Provenance** — every pair labeled `official` / `mock` / `custom` / `unverified`.
- **Primitives** — registry + token ABIs, canonical addresses, the ERC-7984 interface id.

> This is the read / verify / metadata layer. Confidential wrap · unwrap · decrypt (FHE) run through the [Zama relayer SDK](https://docs.zama.ai/protocol) in the app.

## License

MIT
