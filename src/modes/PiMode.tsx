// Copyright (c) 2026 TylerR909. All Rights Reserved.
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useRef } from "react";
import { PI_DIGITS, piLength, piSlice, subscribePi } from "../data/pi-digits";
import { useOptions } from "../options/OptionsContext";
import { getProgress, reportProgress, subscribeProgress } from "../progress";
import { isTypingTarget } from "../utils/keys";
import { buildPiBody, growShownChars, piDisplayBudget } from "./pi-grid";
import { digitRangeFromDisplay, formatPiSelTip } from "./pi-selection";

/** Display string index 0='3', 1='.', 2+=PI_DIGITS[1…] */
function displayLenForDigitIndex(digitIndex: number): number {
  if (digitIndex <= 0) return 2; // "3."
  return 2 + digitIndex; // "3." + digitIndex fractional digits (PI_DIGITS[1..digitIndex])
}

/** Count of non-newline chars from the start of `root` to (node, offset). */
function displayIndexAt(root: Node, node: Node, offset: number): number {
  const r = document.createRange();
  try {
    r.setStart(root, 0);
    r.setEnd(node, offset);
  } catch {
    return 0;
  }
  const text = r.toString();
  let n = 0;
  for (let i = 0; i < text.length; i++) if (text[i] !== "\n") n++;
  return n;
}

function tipLocale(locale: string): string {
  if (locale === "es") return "es";
  return "en-US";
}

export function PiMode() {
  const { i18n } = useLingui();
  const { fontPx } = useOptions({
    fontSize: true,
    defaultFontSize: "m",
    idle: false,
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef(0);
  const hiRef = useRef(0);
  const gridRef = useRef({ cols: 0, rows: 0, body: "" });
  const shownCharsRef = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = preRef.current;
    const probe = probeRef.current;
    if (!wrap || !el || !probe) return;

    const INITIAL_SCREENS = 2;
    const GROW_SCREENS = 2;
    let cols = 20;
    let rowsPerScreen = 24;
    let paintKey = "";

    const measure = () => {
      probe.style.fontSize = `${fontPx}px`;
      probe.textContent = "0000000000";
      const sample = probe.getBoundingClientRect().width;
      const charW = sample > 0 ? sample / 10 : 9;
      const cs = getComputedStyle(el);
      const fontSize = Number.parseFloat(cs.fontSize) || 16;
      const lhRaw = Number.parseFloat(cs.lineHeight);
      const lineHeight = Number.isFinite(lhRaw) ? lhRaw : fontSize * 1.15;
      const padX =
        (Number.parseFloat(cs.paddingLeft) || 0) + (Number.parseFloat(cs.paddingRight) || 0);
      const width = Math.max(1, (wrap.clientWidth || window.innerWidth) - padX);
      const height = wrap.clientHeight || window.innerHeight;
      // Floor minus 1px so letter-spacing / subpixels don't force a horizontal bar.
      cols = Math.max(20, Math.floor((width - 1) / charW));
      rowsPerScreen = Math.max(8, Math.ceil(height / lineHeight));
    };

    const cap = () => piDisplayBudget(piLength());

    const ensureFloor = () => {
      const floor = cols * rowsPerScreen * INITIAL_SCREENS;
      const budget = cap();
      if (shownCharsRef.current <= 0) shownCharsRef.current = Math.min(budget, floor);
      else shownCharsRef.current = Math.min(budget, Math.max(shownCharsRef.current, 0));
    };

    const nearBottom = () => {
      // Half a screen — must be less than the leftover from INITIAL_SCREENS
      // or hydrate would keep appending without the user scrolling.
      const slack = wrap.clientHeight * 0.5;
      return wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < slack;
    };

    const grow = (): boolean => {
      const next = growShownChars(shownCharsRef.current, cols, rowsPerScreen, cap(), GROW_SCREENS);
      if (next <= shownCharsRef.current) return false;
      shownCharsRef.current = next;
      return true;
    };

    const paintGrid = (): boolean => {
      measure();
      ensureFloor();
      const key = `${cols}:${shownCharsRef.current}`;
      if (key === paintKey && gridRef.current.body) return false;
      paintKey = key;
      const body = buildPiBody(cols, shownCharsRef.current, piSlice);
      const rows = body ? body.split("\n").length : 0;
      gridRef.current = { cols, rows, body };
      return true;
    };

    const paintHighlight = () => {
      const { body, cols } = gridRef.current;
      if (!body) return;
      const imported = displayLenForDigitIndex(getProgress());
      // Continue from Tape (etc.), not from "3."
      if (typedRef.current < imported) typedRef.current = imported;
      const hi = typedRef.current;
      hiRef.current = hi;

      // Apply color-only spans. Newlines don't count toward digit progress.
      // Walk the body; count only non-newline chars against `hi`.
      const frag = document.createDocumentFragment();
      let seen = 0;
      let buf = "";
      let inHi = hi > 0;
      const flush = (asHi: boolean) => {
        if (!buf) return;
        const span = document.createElement("span");
        span.className = asHi ? "pi-hi" : "pi-rest";
        span.textContent = buf;
        frag.appendChild(span);
        buf = "";
      };
      for (let i = 0; i < body.length; i++) {
        const ch = body[i]!;
        if (ch === "\n") {
          flush(inHi);
          frag.appendChild(document.createTextNode("\n"));
          continue;
        }
        const nowHi = seen < hi;
        if (nowHi !== inHi) {
          flush(inHi);
          inHi = nowHi;
        }
        buf += ch;
        seen++;
        void cols;
      }
      flush(inHi);
      const y = wrap.scrollTop;
      el.replaceChildren(frag);
      wrap.scrollTop = y;
    };

    const rebuild = () => {
      if (paintGrid()) paintHighlight();
    };

    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(wrap);
    const unsub = subscribeProgress(paintHighlight);

    let piTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubPi = subscribePi(() => {
      if (piTimer) return;
      piTimer = setTimeout(() => {
        piTimer = null;
        const floor = Math.min(cap(), cols * rowsPerScreen * INITIAL_SCREENS);
        if (shownCharsRef.current < floor) {
          shownCharsRef.current = floor;
          rebuild();
          return;
        }
        if (nearBottom() && grow()) rebuild();
      }, 200);
    });

    const expected = (n: number): string => {
      if (n === 0) return "3";
      if (n === 1) return ".";
      return PI_DIGITS[n - 1] ?? "";
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key.length !== 1) return;
      const want = expected(typedRef.current);
      if (key === want) {
        typedRef.current += 1;
        if (typedRef.current >= 2) reportProgress(typedRef.current - 2);
        paintHighlight();
      }
    };
    const onCopy = (e: ClipboardEvent) => {
      const raw = window.getSelection()?.toString();
      if (!raw?.includes("\n")) return;
      e.preventDefault();
      e.clipboardData?.setData("text/plain", raw.replace(/\n/g, ""));
    };

    const hideTip = () => {
      const tip = tipRef.current;
      if (!tip) return;
      tip.hidden = true;
      tip.textContent = "";
    };

    const placeTip = (range: Range) => {
      const tip = tipRef.current;
      if (!tip) return;
      const rects = range.getClientRects();
      if (!rects.length) {
        hideTip();
        return;
      }
      const first = rects[0]!;
      const last = rects[rects.length - 1]!;
      tip.hidden = false;
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      const gap = 8;
      const flip = first.top < tipH + gap + 12;
      tip.dataset.place = flip ? "below" : "above";
      let left = first.left + first.width / 2;
      const pad = 8 + tipW / 2;
      left = Math.min(window.innerWidth - pad, Math.max(pad, left));
      const top = flip ? last.bottom + gap : first.top - gap;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    const syncTip = () => {
      const tip = tipRef.current;
      if (!tip) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        hideTip();
        return;
      }
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) {
        hideTip();
        return;
      }
      const start = displayIndexAt(el, range.startContainer, range.startOffset);
      const end = displayIndexAt(el, range.endContainer, range.endOffset);
      if (end <= start) {
        hideTip();
        return;
      }
      const span = digitRangeFromDisplay(start, end - 1);
      const loc = tipLocale(i18n.locale);
      tip.replaceChildren();
      if (!span) {
        tip.textContent = t`decimal point`;
      } else {
        const digits = range.toString().replace(/\D/g, "");
        const pack = formatPiSelTip(span[0], span[1], digits, loc);
        const head = document.createElement("div");
        head.className = "tip-range";
        head.textContent = pack.range;
        tip.append(head);
        for (const line of pack.facts) {
          const row = document.createElement("div");
          row.className = "tip-fact";
          row.textContent = line;
          tip.append(row);
        }
      }
      placeTip(range);
    };

    const onScroll = () => {
      syncTip();
      if (nearBottom() && grow()) rebuild();
    };

    window.addEventListener("keydown", onKey);
    el.addEventListener("copy", onCopy);
    document.addEventListener("selectionchange", syncTip);
    wrap.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncTip);

    return () => {
      ro.disconnect();
      unsub();
      unsubPi();
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("copy", onCopy);
      document.removeEventListener("selectionchange", syncTip);
      wrap.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncTip);
    };
  }, [fontPx, i18n.locale]);

  return (
    <div
      ref={wrapRef}
      className="mode pi-mode"
      style={{ ["--pi-fs" as string]: `${fontPx}px` }}
      aria-label={t`Scrollable digits of pi`}
    >
      <span ref={probeRef} className="pi-probe" aria-hidden>
        0000000000
      </span>
      <pre ref={preRef} className="pi-stream" />
      <div ref={tipRef} className="pi-sel-tip" hidden role="status" aria-live="polite" />
    </div>
  );
}
