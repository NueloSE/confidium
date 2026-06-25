import { createConfig, fallback, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

/**
 * Wallet connectors come from EIP-6963 multi-injected-provider discovery (default on in
 * wagmi v3) — MetaMask, Rabby, Coinbase, etc. announce themselves, so we avoid importing
 * the `wagmi/connectors` barrel (which pulls optional deps like `porto`).
 */
export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: fallback([http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL), http()]),
    [mainnet.id]: fallback([http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL), http()]),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
