import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-900 bg-black/60 px-6 py-3 backdrop-blur">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="text-lg font-bold tracking-tight">Confidium</span>
        <span className="hidden text-xs text-neutral-500 sm:inline">
          the home of confidential tokens
        </span>
      </Link>
      <ConnectButton />
    </header>
  );
}
