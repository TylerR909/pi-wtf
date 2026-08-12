import { useEffect, useRef } from "react";
import { PI_DIGITS } from "../data/pi-digits";

/**
 * Flood the viewport with π digits. Renders once into a canvas-like pre block;
 * no React updates after mount.
 */
export function PrintMode() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const paint = () => {
      const cs = getComputedStyle(el);
      const fontSize = Number.parseFloat(cs.fontSize) || 14;
      const lineHeight = Number.parseFloat(cs.lineHeight) || fontSize * 1.15;
      const charW = fontSize * 0.62; // mono approx
      const cols = Math.max(20, Math.floor(window.innerWidth / charW));
      const rows = Math.max(10, Math.ceil(window.innerHeight / lineHeight) + 2);
      const need = cols * rows;

      // "3." then fractional digits repeating/cycling through our table
      let out = "3.";
      const frac = PI_DIGITS.slice(1);
      let i = 0;
      while (out.length < need + 2) {
        out += frac[i % frac.length]!;
        i++;
      }

      // Word-wrap into fixed columns without spaces
      const lines: string[] = [];
      for (let r = 0; r < rows; r++) {
        lines.push(out.slice(r * cols, (r + 1) * cols));
      }
      el.textContent = lines.join("\n");
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="mode print-mode" aria-label="Fullscreen digits of pi">
      <pre ref={ref} className="print-stream" />
    </div>
  );
}
