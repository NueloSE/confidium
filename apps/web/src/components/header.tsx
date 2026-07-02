"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/connect-button";
import { cn } from "@/components/ui/cn";

const NAV = [
  { href: "/registry", label: "Registry" },
  { href: "/activity", label: "Activity" },
  { href: "/decrypt", label: "Decrypt" },
  { href: "/developers", label: "Developers" },
];

export function Header() {
  const pathname = usePathname();
  // The embeddable widget renders chrome-free so other sites can iframe it.
  if (pathname?.startsWith("/embed")) return null;

  // Keep "Registry" lit while browsing an individual pair (it's part of that flow).
  const isActive = (href: string) =>
    href === "/registry"
      ? Boolean(pathname?.startsWith("/registry") || pathname?.startsWith("/pair"))
      : Boolean(pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/70 backdrop-blur-xl">
      <div className="relative flex h-14 items-center justify-between px-5 lg:px-8">
        {/* Left edge: wordmark */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/confidium-mark.png"
            alt="Confidium"
            width={28}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100">Confidium</span>
        </Link>

        {/* Center: navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-sm md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-medium transition-colors duration-150",
                  active
                    ? "bg-white/5 text-zinc-100"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right edge: wallet */}
        <ConnectButton />
      </div>
    </header>
  );
}
