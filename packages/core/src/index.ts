/**
 * @confidium/core — framework-agnostic SDK for the Confidential Wrappers Registry.
 * Read/verify layer validated against live Sepolia (see docs/zama-integration-reference.md §13).
 */
export * from "./abis";
export * from "./chains";
export * from "./types";
export * from "./verify";
export * from "./registry";

export const CONFIDIUM = "confidium" as const;
