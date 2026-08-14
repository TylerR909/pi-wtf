import { pickOne } from "./random";

export const DEVTOOLS_QUIPS: readonly string[] = [
  "What are you hoping to gain in here?",
  "Ctrl+Shift+I is not a cheat code.",
  "π is in /pi.txt. That's the only secret.",
  "F12 is not a digit of π.",
];

/** π as digits + NBSPs — no box drawing; spaces stay put in the console. */
const NBSP = "\u00A0";
export const PI_ASCII = [
  "3.141592653589793238462643383279",
  "        50                28    ",
  "        84                19    ",
  "        71                69    ",
  "        39                93    ",
  "       75                  10   ",
]
  .map((line) => line.replaceAll(" ", NBSP))
  .join("\n");

export const DEVTOOLS_DOCK_PX = 180;

export function dockedDevtools(
  outerW: number,
  innerW: number,
  outerH: number,
  innerH: number,
  threshold = DEVTOOLS_DOCK_PX,
): boolean {
  return outerW - innerW > threshold || outerH - innerH > threshold;
}

let said = false;

export function printDevtoolsQuip(rng = Math.random): string {
  const line = pickOne(DEVTOOLS_QUIPS, rng);
  if (said) return line;
  said = true;
  console.log(
    `%c${PI_ASCII}`,
    "color:#e2b714;font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;font-size:12px;line-height:1.05",
  );
  console.log(
    `%c${line}`,
    "color:#e2b714;font-size:14px;font-weight:600;font-family:Georgia,'Times New Roman',serif;",
  );
  return line;
}

/** Docked-panel size check. Once per load. No bait objects in the log. */
export function watchDevtools(onOpen: () => void = () => printDevtoolsQuip()): () => void {
  const fire = () => {
    if (said) return;
    onOpen();
  };

  const tick = () => {
    if (said) return;
    if (
      dockedDevtools(window.outerWidth, window.innerWidth, window.outerHeight, window.innerHeight)
    ) {
      fire();
    }
  };
  tick();
  const id = window.setInterval(tick, 800);
  return () => window.clearInterval(id);
}
