import type { Metadata } from "next";
import { ArrowUpRight, Code2, Package } from "lucide-react";
import { EmbedSnippet } from "@/components/embed-snippet";

export const metadata: Metadata = {
  title: "Developers — Confidium",
  description: "Composable privacy: embed confidential wrapping, or build on the Confidium SDK.",
};

// cUSDTMock on Sepolia — used for the live embed preview.
const SAMPLE_TOKEN = "0x4E7B06D78965594eB5EF5414c357ca21E1554491";

export default function DevelopersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-zinc-300">
          <Code2 className="h-3.5 w-3.5 text-accent" />
          Composable privacy
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">Build on Confidium</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Drop confidential wrapping into any app with one line, or build on the framework-agnostic
          registry SDK. The FHE encryption is handled by Confidium, invisibly.
        </p>
      </div>

      <section className="mt-9 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Embeddable wrap widget</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Add a wrap/unwrap box to your own site with one <code className="font-mono text-zinc-300">&lt;iframe&gt;</code>.
            Your users connect their wallet and wrap/unwrap directly.
          </p>
          <EmbedSnippet token={SAMPLE_TOKEN} />
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Params: <code className="font-mono text-zinc-300">token</code> (ERC-7984 address),
            optional <code className="font-mono text-zinc-300">u</code> (underlying, for custom
            pairs), and <code className="font-mono text-zinc-300">action</code> (
            <code className="font-mono">wrap</code> | <code className="font-mono">unwrap</code>).
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            Note: cross-origin embedding requires the host page to send a{" "}
            <code className="font-mono text-zinc-400">Cross-Origin-Embedder-Policy</code> header (the
            FHE SDK needs cross-origin isolation).
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs text-zinc-500">Live preview — this is a real iframe</div>
          {/* Device-framed showcase */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-3 py-2.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </span>
              <span className="ml-2 flex-1 truncate rounded-md bg-canvas px-2.5 py-1 text-center font-mono text-[11px] text-zinc-500">
                your-site.com
              </span>
            </div>
            <iframe
              src={`/embed?token=${SAMPLE_TOKEN}`}
              title="Confidium wrap widget"
              className="h-[600px] w-full bg-canvas"
            />
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
              <Package className="h-4 w-4" />
            </span>
            <h3 className="font-mono text-sm font-semibold text-zinc-100">@confidium/core</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Framework-agnostic SDK: registry reads, pair enrichment + verification, ABIs, addresses,
            and the Sepolia relayer config. Zero React/Next dependencies.
          </p>
        </div>
        <a
          href="/api/token-list"
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-hairline bg-surface p-5 transition-colors duration-200 hover:border-hairline-strong"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">Token list</h3>
            <ArrowUpRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-zinc-200" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            A tokenlists.org-schema export of the verified confidential wrappers. Import Confidium’s
            canonical list into any app with one URL.
          </p>
        </a>
      </section>
    </main>
  );
}
