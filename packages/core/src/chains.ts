import type { Address } from "viem";

export const ERC7984_INTERFACE_ID = "0x4958f2a4" as const;

export const SEPOLIA_CHAIN_ID = 11155111 as const;
export const MAINNET_CHAIN_ID = 1 as const;
export type SupportedChainId = typeof SEPOLIA_CHAIN_ID | typeof MAINNET_CHAIN_ID;

export const SUPPORTED_CHAIN_IDS: readonly SupportedChainId[] = [
  SEPOLIA_CHAIN_ID,
  MAINNET_CHAIN_ID,
];

/** Networks where write actions (faucet/wrap/unwrap/decrypt) are enabled. */
export const WRITE_ENABLED_CHAIN_IDS: readonly SupportedChainId[] = [SEPOLIA_CHAIN_ID];

export const CHAIN_LABEL: Record<SupportedChainId, string> = {
  [SEPOLIA_CHAIN_ID]: "Sepolia",
  [MAINNET_CHAIN_ID]: "Ethereum",
};

/** Confidential Token Wrappers Registry (verified live, spike §13). */
export const REGISTRY_ADDRESS: Record<SupportedChainId, Address> = {
  [SEPOLIA_CHAIN_ID]: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
  [MAINNET_CHAIN_ID]: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
};

/** Zama relayer-sdk config for Sepolia testnet (reference §2). */
export const SEPOLIA_SDK_CONFIG = {
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  chainId: SEPOLIA_CHAIN_ID,
  gatewayChainId: 55815,
  relayerUrl: "https://relayer.testnet.zama.cloud",
} as const;

export function isSupportedChainId(id: number): id is SupportedChainId {
  return (SUPPORTED_CHAIN_IDS as readonly number[]).includes(id);
}

export function isWriteEnabled(id: number): boolean {
  return (WRITE_ENABLED_CHAIN_IDS as readonly number[]).includes(id);
}
