import { useEffect, useRef } from "react";
import { PI_DIGITS } from "../data/pi-digits";

/**
 * Rain of π digits. Pure canvas for butter-smooth 144hz-ish animation.
 */
export function ChaosMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    type Drop = {
      x: number;
      y: number;
      speed: number;
      size: number;
      idx: number;
      len: number;
    };

    let drops: Drop[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.floor(w / 18);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * 18 + 4,
        y: Math.random() * h,
        speed: 40 + Math.random() * 120,
        size: 12 + Math.random() * 10,
        idx: Math.floor(Math.random() * PI_DIGITS.length),
        len: 8 + Math.floor(Math.random() * 18),
      }));
    };

    const bg = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--bg").trim() || "#0e0e10";
    };
    const fg = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--accent").trim() || "#e2b714";
    };
    const muted = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--fg-muted").trim() || "#8b8b9a";
    };

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.fillStyle = bg();
      ctx.fillRect(0, 0, w, h);

      const accent = fg();
      const dim = muted();
      ctx.font = "14px ui-monospace, monospace";

      for (const d of drops) {
        d.y += d.speed * dt;
        if (d.y - d.len * d.size > h) {
          d.y = -Math.random() * 100;
          d.idx = Math.floor(Math.random() * PI_DIGITS.length);
          d.speed = 40 + Math.random() * 120;
        }
        for (let i = 0; i < d.len; i++) {
          const ch = PI_DIGITS[(d.idx + i) % PI_DIGITS.length]!;
          const yy = d.y - i * d.size;
          if (yy < -20 || yy > h + 20) continue;
          ctx.fillStyle = i === 0 ? accent : dim;
          ctx.globalAlpha = i === 0 ? 1 : Math.max(0.15, 1 - i / d.len);
          ctx.font = `${d.size}px ui-monospace, monospace`;
          ctx.fillText(ch, d.x, yy);
        }
        // advance stream content slowly
        if (Math.random() < 0.02) d.idx = (d.idx + 1) % PI_DIGITS.length;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="mode chaos-mode" aria-label="Digit rain">
      <canvas ref={canvasRef} className="chaos-canvas" />
      <p className="mode-hint chaos-hint">Matrix, but it&apos;s just π. You&apos;re welcome.</p>
    </div>
  );
}
