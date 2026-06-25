/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@confidium/core"],
  // The relayer SDK is browser-only (WASM); never bundle it on the server.
  serverExternalPackages: ["@zama-fhe/relayer-sdk"],
  eslint: {
    // Lint is run as its own CI step, not during builds.
    ignoreDuringBuilds: true,
  },
  // The relayer SDK requires a cross-origin-isolated context for its threaded WASM.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
  webpack: (config) => {
    // The /web relayer SDK ships WASM loaded as async modules.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
