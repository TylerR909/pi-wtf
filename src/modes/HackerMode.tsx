import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useRef } from "react";
import { PI_DIGITS } from "../data/pi-digits";
import { useOptions } from "../options/OptionsContext";
import { beginMode, reportProgress } from "../progress";
import { isTypingTarget } from "../utils/keys";

export function HackerMode() {
  useLingui();
  const { fontPx } = useOptions({
    fullscreen: true,
    fullscreenKey: false,
    themeKey: false,
    fontSize: true,
    defaultFontSize: "m",
  });
  const streamRef = useRef<HTMLPreElement>(null);
  const cursor = useRef(0);
  const countRef = useRef<HTMLDivElement>(null);
  const dumpRef = useRef<(n: number) => void>(() => {});

  useEffect(() => {
    beginMode("hacker");
    const stream = streamRef.current;
    if (!stream) return;

    stream.textContent = "3.";
    cursor.current = 1;

    const take = (n: number): string => {
      let chunk = "";
      for (let i = 0; i < n; i++) {
        const idx = 1 + ((cursor.current - 1 + i) % (PI_DIGITS.length - 1));
        chunk += PI_DIGITS[idx]!;
      }
      cursor.current += n;
      return chunk;
    };

    const trim = () => {
      const max = 14000;
      if ((stream.textContent?.length ?? 0) > max) {
        const txt = stream.textContent ?? "";
        stream.textContent = txt.slice(txt.length - max);
      }
    };

    const scroll = () => {
      stream.parentElement?.scrollTo({
        top: stream.parentElement.scrollHeight,
        behavior: "instant" as ScrollBehavior,
      });
    };

    const updateCount = () => {
      if (countRef.current) {
        const n = cursor.current - 1;
        countRef.current.textContent = t`${n} digits spilled`;
      }
      reportProgress(cursor.current - 1);
    };

    updateCount();

    const dumpN = (n: number) => {
      stream.append(take(n));
      trim();
      scroll();
      updateCount();
    };
    dumpRef.current = dumpN;

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isTypingTarget(e.target)) return;
      if (e.key.startsWith("Arrow")) return;
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      if (e.key === "Tab" || e.key === "Escape") return;
      e.preventDefault();

      if (e.key === "Enter") {
        // Fast dump, not a real newline
        dumpN(80 + Math.floor(Math.random() * 21));
        return;
      }

      if (e.key === " " || e.code === "Space") {
        dumpN(20 + Math.floor(Math.random() * 13));
        return;
      }

      if (Math.random() < 0.015) {
        dumpN(50 + Math.floor(Math.random() * 31));
        return;
      }

      dumpN(3 + Math.floor(Math.random() * 5));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="mode hacker-mode"
      style={{ ["--hacker-fs" as string]: `${fontPx}px` }}
      aria-label={t`Hacker typer: mash keys or tap for pi`}
    >
      <div
        className="hacker-scroll"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dumpRef.current(3 + Math.floor(Math.random() * 8));
        }}
      >
        <pre ref={streamRef} className="hacker-stream" />
        <span className="hacker-cursor" aria-hidden>
          █
        </span>
      </div>
      <div ref={countRef} className="digit-meta">
        {t`${0} digits spilled`}
      </div>
    </div>
  );
}
