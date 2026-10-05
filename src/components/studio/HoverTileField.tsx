import { useEffect, useRef } from "react";

/**
 * Blackbox-style backdrop: a grid of square tiles that glow in the primary
 * (orange) colour around the cursor and slowly settle back to black.
 */
export function HoverTileField({ tile = 80, className = "" }: { tile?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement!;
    const color = getComputedStyle(canvas).color || "rgb(255,110,30)";

    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let raf = 0;
    let running = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / tile);
      rows = Math.ceil(height / tile);
      heat = new Float32Array(cols * rows);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      let active = false;
      for (let i = 0; i < heat.length; i++) {
        const h = heat[i] ?? 0;
        if (h <= 0.01) {
          heat[i] = 0;
          continue;
        }
        active = true;
        ctx.globalAlpha = h * 0.18;
        ctx.fillRect((i % cols) * tile, Math.floor(i / cols) * tile, tile, tile);
        heat[i] = h * 0.955; // settle back to black
      }
      ctx.globalAlpha = 1;
      if (active) raf = requestAnimationFrame(draw);
      else running = false;
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      const cx = Math.floor(x / tile);
      const cy = Math.floor(y / tile);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const gx = cx + dx;
          const gy = cy + dy;
          if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
          const d = Math.hypot(dx, dy);
          if (d > 2.3) continue;
          const v = d === 0 ? 1 : (1 - d / 2.6) * (0.5 + Math.random() * 0.4);
          const idx = gy * cols + gx;
          heat[idx] = Math.max(heat[idx] ?? 0, v);
        }
      }
      kick();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [tile]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 text-primary ${className}`}
    />
  );
}
