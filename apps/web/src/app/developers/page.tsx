import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Code2, GitBranch, Globe, Info, Package } from "lucide-react";
import { EmbedSnippet } from "@/components/embed-snippet";
import { SdkExamples } from "@/components/sdk-examples";

export const metadata: Metadata = {
  title: "Developers — Confidium",
  description: "Build on the Confidium SDK, or embed confidential wrapping into any app.",
};

const REPO = "https://github.com/NueloSE/confidium";
const NPM = "https://www.npmjs.com/package/@confidium/core";
const SAMPLE_TOKEN = "0x4E7B06D78965594eB5EF5414c357ca21E1554491"; // cUSDTMock

const RESOURCES = [
  { label: "npm package", note: "@confidium/core — install & README", href: NPM, Icon: Package },
  { label: "Documentation", note: "README & guides", href: `${REPO}#readme`, Icon: BookOpen },
  { label: "ERC-7984", note: "The confidential-token standard", href: "https://docs.zama.ai/protocol", Icon: Globe },
  { label: "GitHub", note: "Open-source monorepo", href: REPO, Icon: GitBranch },
] as const;

const PACKAGE_INFO = [
  ["Package", "@confidium/core"],
  ["Version", "0.1.1"],
  ["License", "MIT"],
  ["Requires", "viem ^2"],
  ["Networks", "Sepolia · Ethereum"],
] as const;

export default function DevelopersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-zinc-300">
          <Code2 className="h-3.5 w-3.5 text-accent" />
          SDK
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">Developers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Integrate confidential ERC-7984 tokens with{" "}
          <a
            href={NPM}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-accent-hover underline-offset-2 hover:underline"
          >
            @confidium/core
          </a>{" "}
          — or drop confidential wrapping into any app with one <code className="font-mono">&lt;iframe&gt;</code>.
        </p>
      </div>

      {/* SDK: install + examples · resources + package info */}
      <section className="mt-9 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SdkExamples />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Resources</div>
            <div className="mt-3 space-y-1">
              {RESOURCES.map(({ label, note, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-zinc-400 group-hover:text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-100">{label}</span>
                    <span className="block truncate text-xs text-zinc-500">{note}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-300" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Package className="h-3.5 w-3.5" />
              Package info
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              {PACKAGE_INFO.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="font-mono text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

        </div>
      </section>

      {/* Networks note — full width, balances the SDK row above */}
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-hairline bg-surface p-4 text-xs leading-relaxed text-zinc-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
        <span>
          Confidential ops run on <span className="text-zinc-300">Sepolia</span>. Ethereum is
          read-only today — mainnet writes are on the roadmap (one config away).
        </span>
      </div>

      {/* Embeddable widget + live preview */}
      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Embeddable wrap widget</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Add a wrap/unwrap box to your own site with one <code className="font-mono text-zinc-300">&lt;iframe&gt;</code>.
            Your users connect their wallet and wrap/unwrap directly — the FHE encryption is handled
            by Confidium, invisibly.
          </p>
          <EmbedSnippet token={SAMPLE_TOKEN} />

          <div className="mt-6">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Parameters
            </div>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-mono text-accent-hover">token</dt>
                <dd className="text-zinc-400">
                  ERC-7984 wrapper address <span className="text-zinc-600">· required</span>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-mono text-accent-hover">u</dt>
                <dd className="text-zinc-400">Underlying ERC-20 — only for custom pairs</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-mono text-accent-hover">action</dt>
                <dd className="text-zinc-400">
                  <code className="font-mono text-zinc-300">wrap</code> (default) or{" "}
                  <code className="font-mono text-zinc-300">unwrap</code>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-hairline bg-surface p-4 text-xs leading-relaxed text-zinc-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
            <span>
              Cross-origin embedding requires the host page to send a{" "}
              <code className="font-mono text-zinc-400">Cross-Origin-Embedder-Policy</code> header (the
              FHE SDK needs cross-origin isolation). Same-origin embeds work out of the box.
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs text-zinc-500">Live preview — this is a real iframe</div>
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
              className="h-150 w-full bg-canvas"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
