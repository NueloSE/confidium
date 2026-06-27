import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers — Confidium",
  description: "Composable privacy: embed confidential wrapping, or build on the Confidium SDK.",
};

// cUSDTMock on Sepolia — used for the live embed preview.
const SAMPLE_TOKEN = "0x4E7B06D78965594eB5EF5414c357ca21E1554491";

const SNIPPET = `<iframe
  src="https://YOUR-CONFIDIUM-URL/embed?token=${SAMPLE_TOKEN}"
  width="420"
  height="600"
  style="border:0;border-radius:16px"
></iframe>`;

export default function DevelopersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Build on Confidium</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Composable privacy — drop confidential wrapping into any app, or build on the registry SDK.
      </p>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">Embeddable wrap widget</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Add a wrap/unwrap box to your own site with one line. Your users connect their wallet and
            wrap/unwrap — all the FHE encryption is handled by Confidium, invisibly.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-300">
            <code>{SNIPPET}</code>
          </pre>
          <p className="mt-3 text-xs text-neutral-500">
            Params: <code className="text-neutral-300">token</code> (ERC-7984 address), optional{" "}
            <code className="text-neutral-300">u</code> (underlying, for custom pairs), and{" "}
            <code className="text-neutral-300">action</code> (<code>wrap</code> | <code>unwrap</code>).
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            Note: cross-origin embedding requires the host page to send a
            <code className="mx-1 text-neutral-400">Cross-Origin-Embedder-Policy</code>
            header (the FHE SDK needs cross-origin isolation).
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs text-neutral-500">Live preview ↓ (this is an iframe)</div>
          <iframe
            src={`/embed?token=${SAMPLE_TOKEN}`}
            title="Confidium wrap widget"
            className="h-[600px] w-full rounded-xl border border-neutral-800 bg-black"
          />
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5">
          <h3 className="font-semibold text-neutral-100">@confidium/core</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Framework-agnostic SDK: registry reads, pair enrichment + verification, ABIs, addresses,
            and the Sepolia relayer config. Zero React/Next dependencies.
          </p>
        </div>
        <a
          href="/api/token-list"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 transition hover:border-neutral-700"
        >
          <h3 className="font-semibold text-neutral-100">Token list ↗</h3>
          <p className="mt-1 text-sm text-neutral-400">
            A tokenlists.org-schema export of the verified confidential wrappers. Import Confidium’s
            canonical list into any app with one URL.
          </p>
        </a>
      </section>
    </main>
  );
}
