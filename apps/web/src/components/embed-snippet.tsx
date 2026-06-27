"use client";

import { useEffect, useState } from "react";

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
    <div className="relative mt-4">
      <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 pr-16 text-xs leading-relaxed text-neutral-300">
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-200 transition hover:bg-neutral-800"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
