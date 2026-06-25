import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instancePromise: Promise<FhevmInstance> | null = null;

/**
 * Lazily create the Zama relayer (FHE) instance in the BROWSER only.
 *
 * Uses the pre-bundled build (`/bundle`) where the WASM is self-contained, so Next.js
 * needs no special webpack WASM config. The dynamic import keeps the (large) SDK + WASM
 * out of the server bundle and out of the initial page load — it's only fetched when a
 * user first reveals/decrypts.
 */
export function getFhevmInstance(): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("FHE instance is browser-only"));
  }
  if (!instancePromise) {
    instancePromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import(
        "@zama-fhe/relayer-sdk/web"
      );
      await initSDK(); // load TFHE/KMS WASM
      const network =
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
      return createInstance({ ...SepoliaConfig, network });
    })().catch((e) => {
      instancePromise = null; // allow a retry after a failed init
      throw e;
    });
  }
  return instancePromise;
}
