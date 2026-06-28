"use client";

import { Component, lazy, Suspense, type ReactNode } from "react";

// Browser-only WebGL embed — lazy-loaded client-side so it never blocks first
// paint, and purely decorative (pointer-events-none) so it can't steal clicks.
const Spline = lazy(() => import("@splinetool/react-spline"));

/** If the scene or runtime fails to load, render nothing — the hero still looks great without it. */
class SafeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SplineBackground({ scene }: { scene: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <SafeBoundary>
        <Suspense fallback={null}>
          <Spline scene={scene} className="h-full w-full" />
        </Suspense>
      </SafeBoundary>
    </div>
  );
}
