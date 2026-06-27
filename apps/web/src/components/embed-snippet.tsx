"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Shows the iframe embed snippet with the live origin pre-filled (no placeholder to guess at). */
export function EmbedSnippet({ token }: { token: string }) {
  const [origin, setOrigin] = useState("https://your-confidium-domain");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<iframe
  src="${origin}/embed?token=${token}"
  width="420"
  height="600"
  style="border:0;border-radius:16px"
></iframe>`;

  return (
    <div className="group relative mt-4">
      <pre className="overflow-x-auto rounded-xl border border-hairline bg-surface-2 p-4 pr-16 font-mono text-xs leading-relaxed text-zinc-300">
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy embed snippet"}
        onClick={() => {
          void navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={`absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
          copied
            ? "border-success/30 bg-success-soft text-success"
            : "border-hairline bg-surface text-zinc-300 hover:border-hairline-strong hover:bg-elevated"
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
