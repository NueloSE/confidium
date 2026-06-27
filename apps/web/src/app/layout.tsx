import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
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
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
