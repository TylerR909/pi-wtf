import { useEffect, useRef } from "react";
import { PI_DIGITS } from "../data/pi-digits";

/**
 * hackertyper.net energy: any key dumps 3–7 chars of π.
 * DOM-only appends for 144hz spam-friendly typing.
 */
export function HackerMode() {
  const streamRef = useRef<HTMLPreElement>(null);
  const cursor = useRef(0);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    // seed with "3."
    stream.textContent = "3.";
    cursor.current = 1; // next index in PI_DIGITS (after 3)

    const dump = () => {
      const n = 3 + Math.floor(Math.random() * 5); // 3–7
      let chunk = "";
      for (let i = 0; i < n; i++) {
        const idx = 1 + ((cursor.current - 1 + i) % (PI_DIGITS.length - 1));
        chunk += PI_DIGITS[idx]!;
      }
      cursor.current += n;

      // Direct DOM — no React
      stream.append(chunk);

      // Soft cap DOM size for long sessions
      const max = 12000;
      if ((stream.textContent?.length ?? 0) > max) {
        const t = stream.textContent ?? "";
        stream.textContent = t.slice(t.length - max);
      }

      // Auto-scroll
      stream.parentElement?.scrollTo({
        top: stream.parentElement.scrollHeight,
        behavior: "instant" as ScrollBehavior,
      });

      if (countRef.current) {
        countRef.current.textContent = `${cursor.current - 1} digits spilled`;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) {
        return;
      }
      // Ignore pure modifiers
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") {
        return;
      }
      // Don't block tab for a11y chrome
      if (e.key === "Tab") return;
      e.preventDefault();
      dump();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mode hacker-mode" aria-label="Hacker typer: mash keys for pi">
      <div className="hacker-scroll">
        <pre ref={streamRef} className="hacker-stream" />
        <span className="hacker-cursor" aria-hidden>
          █
        </span>
      </div>
      <div ref={countRef} className="digit-meta">
        0 digits spilled
      </div>
      <p className="mode-hint">Mash any key · 3–7 digits per press · you are a genius hacker</p>
    </div>
  );
}
