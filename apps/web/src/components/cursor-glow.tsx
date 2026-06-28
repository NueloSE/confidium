"use client";

import { useEffect, useRef } from "react";

/**
 * A bold amber glow (the theme color) that smoothly follows the cursor across
 * its parent section — a bright core + a soft halo. Decorative, GPU-only
 * (transform + screen blend), idle-stops, and is skipped on touch devices.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    let running = false;

    const rect0 = host.getBoundingClientRect();
    target.x = cur.x = rect0.width * 0.5;
    target.y = cur.y = rect0.height * 0.45;
    el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.15;
      cur.y += (target.y - cur.y) * 0.15;
      el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      if (Math.abs(target.x - cur.x) < 0.5 && Math.abs(target.y - cur.y) < 0.5) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    host.addEventListener("mousemove", onMove);
    return () => {
      host.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {/* Moving anchor point — the two glow layers are centered on it. */}
      <div ref={ref} className="absolute left-0 top-0 h-0 w-0 will-change-transform">
        {/* Soft wide halo */}
        <div
          className="absolute -left-[420px] -top-[420px] h-[840px] w-[840px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,153,0,0.20), transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Bright core */}
        <div
          className="absolute -left-[210px] -top-[210px] h-[420px] w-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,176,51,0.55), rgba(255,153,0,0.18) 45%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
