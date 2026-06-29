import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Confidium — the home of confidential tokens",
  description:
    "Browse, wrap, unwrap, and decrypt ERC-7984 confidential tokens from the Zama Wrappers Registry.",
  icons: { icon: "/confidium-mark.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-canvas text-zinc-100 antialiased">
        <Providers>
          <TooltipProvider delayDuration={150} skipDelayDuration={300}>
            <Header />
            {/* Flex wrapper pins the footer to the bottom on short pages (Header stays sticky). */}
            <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
