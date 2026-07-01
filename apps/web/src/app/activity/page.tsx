import type { Metadata } from "next";
import { History } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";

export const metadata: Metadata = {
  title: "Activity — Confidium",
  description: "Your confidential token activity — amounts stay encrypted on-chain.",
};

export default function ActivityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-zinc-300">
          <History className="h-3.5 w-3.5 text-accent" />
          Your activity
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50">Confidential activity</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Your recent wraps, unwraps, sends, and receives across the registry — reconstructed from
          on-chain events, with amounts kept encrypted unless you reveal them.
        </p>
      </div>

      <div className="mt-8">
        <ActivityFeed />
      </div>
    </main>
  );
}
