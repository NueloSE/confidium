"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

        {/* Center: navigation (desktop) */}
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

        {/* Right edge: wallet + mobile menu toggle */}
        <div className="flex items-center gap-2">
          <ConnectButton />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-hairline bg-canvas px-3 py-2 md:hidden">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
      )}
    </header>
  );
}
