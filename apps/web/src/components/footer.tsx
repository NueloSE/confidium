"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  // The embeddable widget renders chrome-free.
  if (pathname?.startsWith("/embed")) return null;

  return (
    <footer className="mt-12 border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-zinc-300">Confidium</span> — composable privacy for any
          ERC-7984 token.
        </p>
        <div className="flex items-center gap-5">
          <a
            href="/api/token-list"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 hover:text-zinc-200"
          >
            Token list ↗
          </a>
          <Link href="/developers" className="transition-colors duration-150 hover:text-zinc-200">
            Developers
          </Link>
          <span className="font-mono text-xs text-zinc-600">@confidium/core</span>
        </div>
      </div>
    </footer>
  );
}
