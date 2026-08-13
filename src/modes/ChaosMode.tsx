import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { PI_DIGITS } from "../data/pi-digits";
import { useNarrow } from "../hooks/useNarrow";
import { useOptions } from "../options/OptionsContext";

/**
 * Rain of π digits. Pure canvas for butter-smooth 144hz-ish animation.
 */
export function ChaosMode() {
  const { isFullscreen } = useOptions({ fullscreen: true });
  const narrow = useNarrow();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chromeOn, setChromeOn] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
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
    let cachedBg = "#0e0e10";
    let cachedFg = "#e2b714";
    let cachedMuted = "#8b8b9a";
    let cachedHot = "#ff4d6d";
    let celestia = false;

    // Teal → lavender → pink → mint → gold (her mane)
    const MANE: ReadonlyArray<readonly [number, number, number]> = [
      [62, 200, 196],
      [201, 160, 232],
      [240, 176, 216],
      [110, 212, 168],
      [232, 192, 74],
    ];

    const maneRgb = (t: number): string => {
      const n = MANE.length;
      const x = ((t % 1) + 1) % 1;
      const f = x * n;
      const i = Math.floor(f) % n;
      const u = f - i;
      const a = MANE[i]!;
      const b = MANE[(i + 1) % n]!;
      const r = (a[0] + (b[0] - a[0]) * u) | 0;
      const g = (a[1] + (b[1] - a[1]) * u) | 0;
      const bl = (a[2] + (b[2] - a[2]) * u) | 0;
      return `rgb(${r},${g},${bl})`;
    };

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      cachedBg = style.getPropertyValue("--bg").trim() || "#0e0e10";
      cachedFg = style.getPropertyValue("--accent").trim() || "#e2b714";
      cachedMuted = style.getPropertyValue("--fg-muted").trim() || "#8b8b9a";
      cachedHot = style.getPropertyValue("--pi-hot").trim() || "#ff4d6d";
      celestia = document.documentElement.dataset.theme === "celestia";
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colW = 18;
      const cols = Math.max(1, Math.floor(w / colW));
      const prev = drops;
      drops = Array.from({ length: cols }, (_, i) => {
        const keep = prev[i];
        if (keep) {
          keep.x = i * colW + 4;
          return keep;
        }
        return {
          x: i * colW + 4,
          y: Math.random() * h,
          speed: 40 + Math.random() * 120,
          size: 12 + Math.random() * 10,
          idx: Math.floor(Math.random() * PI_DIGITS.length),
          len: 8 + Math.floor(Math.random() * 18),
        };
      });
    };

    let last = performance.now();
    let last1592 = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.fillStyle = cachedBg;
      ctx.fillRect(0, 0, w, h);

      if (now - last1592 > 60_000 && drops.length) {
        const forced = drops[(Math.random() * drops.length) | 0]!;
        // idx 6 → head is "2", trail up is 9,5,1 → 1592 top-to-bottom
        forced.idx = 6;
        forced.len = Math.max(forced.len, 10);
        forced.y = Math.min(forced.y, h * 0.35);
        last1592 = now;
      }

      for (const d of drops) {
        d.y += d.speed * dt;
        if (d.y - d.len * d.size > h) {
          d.y = -Math.random() * 100;
          d.idx = Math.floor(Math.random() * PI_DIGITS.length);
          d.speed = 40 + Math.random() * 120;
        }
        const nPi = PI_DIGITS.length;
        const hot = new Set<number>();
        const glow = new Set<number>();
        for (let i = 0; i < d.len - 2; i++) {
          if (
            PI_DIGITS[(d.idx - i + nPi * 8) % nPi] === "4" &&
            PI_DIGITS[(d.idx - (i + 1) + nPi * 8) % nPi] === "1" &&
            PI_DIGITS[(d.idx - (i + 2) + nPi * 8) % nPi] === "3"
          ) {
            hot.add(i);
            hot.add(i + 1);
            hot.add(i + 2);
          }
        }
        for (let i = 0; i < d.len - 3; i++) {
          const a = PI_DIGITS[(d.idx - i + nPi * 8) % nPi];
          const b = PI_DIGITS[(d.idx - (i + 1) + nPi * 8) % nPi];
          const c = PI_DIGITS[(d.idx - (i + 2) + nPi * 8) % nPi];
          const e = PI_DIGITS[(d.idx - (i + 3) + nPi * 8) % nPi];
          if (a === "2" && b === "9" && c === "5" && e === "1") {
            glow.add(i);
            glow.add(i + 1);
            glow.add(i + 2);
            glow.add(i + 3);
            last1592 = now;
          }
        }
        // Head (bright) is at the BOTTOM. Older digits trail UP so π
        // does not read top-to-bottom as the drop falls.
        for (let i = 0; i < d.len; i++) {
          const ch = PI_DIGITS[(d.idx - i + nPi * 8) % nPi]!;
          const yy = d.y - i * d.size;
          if (yy < -20 || yy > h + 20) continue;
          const isGlow = glow.has(i);
          const isHot = !isGlow && hot.has(i);
          if (isGlow) {
            const pulse = 0.55 + 0.45 * Math.sin(now / 160);
            ctx.fillStyle = `rgba(255, 36, 56, ${pulse})`;
            ctx.shadowColor = "rgba(255, 36, 56, 0.9)";
            ctx.shadowBlur = 12 + 8 * pulse;
          } else if (celestia) {
            const hue = now / 14000 + d.x / Math.max(1, w) + i * 0.07;
            ctx.fillStyle = maneRgb(hue);
            ctx.shadowColor = i === 0 ? ctx.fillStyle : "transparent";
            ctx.shadowBlur = i === 0 ? 10 : 0;
          } else {
            ctx.fillStyle = isHot ? cachedHot : i === 0 ? cachedFg : cachedMuted;
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = isGlow || isHot || i === 0 ? 1 : Math.max(0.15, 1 - i / d.len);
          ctx.font = `${isGlow || isHot ? "bold " : ""}${d.size}px ui-monospace, monospace`;
          ctx.fillText(ch, d.x, yy);
        }
        if (Math.random() < 0.02) d.idx = (d.idx + 1) % PI_DIGITS.length;
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    };

    readColors();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    raf = requestAnimationFrame(frame);

    let idle: ReturnType<typeof setTimeout> | null = null;
    const poke = () => {
      setChromeOn(true);
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => setChromeOn(false), 2500);
    };
    poke();
    window.addEventListener("mousemove", poke, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("mousemove", poke);
      if (idle) clearTimeout(idle);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`mode chaos-mode ${isFullscreen ? "is-fs" : ""} ${chromeOn ? "chrome-on" : "chrome-off"}`}
      aria-label={t`Digit rain`}
    >
      <canvas ref={canvasRef} className="chaos-canvas" />
      {!isFullscreen && (
        <p className={`mode-hint chaos-hint ${chromeOn ? "" : "is-hidden"}`}>
          <Trans>Matrix, but it&apos;s just π. You&apos;re welcome.</Trans>
        </p>
      )}
      {narrow && (
        <p className={`mode-hint chaos-hint chaos-shake-hint ${chromeOn ? "" : "is-hidden"}`}>
          <Trans>Shake to change theme</Trans>
        </p>
      )}
    </div>
  );
}
