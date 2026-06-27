"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/connect-button";
import { cn } from "@/components/ui/cn";

const NAV = [
  { href: "/", label: "Registry" },
  { href: "/decrypt", label: "Decrypt" },
  { href: "/add-pair", label: "Add pair" },
  { href: "/developers", label: "Developers" },
];

export function Header() {
  const pathname = usePathname();
  // The embeddable widget renders chrome-free so other sites can iframe it.
  if (pathname?.startsWith("/embed")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/confidium-mark.png"
              alt="Confidium"
              width={28}
              height={32}
              className="h-7 w-auto"
              priority
            />
            <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
              Confidium
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
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
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
