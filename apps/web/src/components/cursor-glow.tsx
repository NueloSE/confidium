"use client";

import { useEffect, useRef } from "react";

/**
 * An amber glow (the theme color) that smoothly follows the cursor across its
 * parent section. Decorative, GPU-only (transform), and skipped on touch.
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
    target.y = cur.y = rect0.height * 0.4;
    el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.12;
      cur.y += (target.y - cur.y) * 0.12;
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
      <div
        ref={ref}
        className="absolute -left-[320px] -top-[320px] h-[640px] w-[640px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(255,153,0,0.22), rgba(255,153,0,0.06) 42%, transparent 66%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
