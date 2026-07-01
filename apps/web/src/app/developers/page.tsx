import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Boxes, Code2, GitBranch, Globe, Info, Package } from "lucide-react";
import { REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID } from "@confidium/core";
import { AddressChip } from "@/components/address-chip";
import { EmbedSnippet } from "@/components/embed-snippet";
import { SdkExamples } from "@/components/sdk-examples";

export const metadata: Metadata = {
  title: "Developers — Confidium",
  description: "Build on the Confidium SDK, or embed confidential wrapping into any app.",
};

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";
const REPO = "https://github.com/NueloSE/confidium";
const SAMPLE_TOKEN = "0x4E7B06D78965594eB5EF5414c357ca21E1554491"; // cUSDTMock

const CONTRACTS = [
  { label: "Wrappers Registry", address: REGISTRY_ADDRESS[SEPOLIA_CHAIN_ID] },
  { label: "cUSDCMock", address: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639" },
  { label: "cUSDTMock", address: "0x4E7B06D78965594eB5EF5414c357ca21E1554491" },
  { label: "cWETHMock", address: "0x46208622DA27d91db4f0393733C8BA082ed83158" },
  { label: "ctGBP", address: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208" },
] as const;

const RESOURCES = [
  { label: "Documentation", note: "README & guides", href: `${REPO}#readme`, Icon: BookOpen },
  { label: "ERC-7984", note: "The confidential-token standard", href: "https://docs.zama.ai/protocol", Icon: Globe },
  { label: "GitHub", note: "Open-source monorepo", href: REPO, Icon: GitBranch },
] as const;

const PACKAGE_INFO = [
  ["Package", "@confidium/core"],
  ["Version", "0.1.0"],
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
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-accent-hover">
            @confidium/core
          </code>{" "}
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

          <div className="flex items-start gap-2.5 rounded-2xl border border-hairline bg-surface p-4 text-xs leading-relaxed text-zinc-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
            <span>
              Confidential ops run on <span className="text-zinc-300">Sepolia</span>. Ethereum is
              read-only today — mainnet writes are on the roadmap (one config away).
            </span>
          </div>
        </div>
      </section>

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
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Params: <code className="font-mono text-zinc-300">token</code> (ERC-7984 address),
            optional <code className="font-mono text-zinc-300">u</code> (underlying, for custom pairs),
            and <code className="font-mono text-zinc-300">action</code> (
            <code className="font-mono">wrap</code> | <code className="font-mono">unwrap</code>).
          </p>
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
              className="h-[600px] w-full bg-canvas"
            />
          </div>
        </div>
      </section>

      {/* Deployed contracts */}
      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-semibold text-zinc-100">Deployed contracts</h2>
          <span className="text-xs text-zinc-500">· Sepolia</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface">
          <ul className="divide-y divide-hairline">
            {CONTRACTS.map(({ label, address }) => (
              <li key={address} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-sm font-medium text-zinc-100">{label}</span>
                <AddressChip address={address} explorerBase={SEPOLIA_EXPLORER} />
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Every registered pair is read live from the Registry — browse them all in the{" "}
          <a href="/registry" className="text-accent-hover underline underline-offset-2 hover:text-accent">
            explorer
          </a>
          .
        </p>
      </section>
    </main>
  );
}
