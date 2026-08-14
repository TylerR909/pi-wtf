/** Canonical display keys → KeyboardEvent match. */
export function matchHotkey(key: string, e: KeyboardEvent): boolean {
  switch (key) {
    case "F":
    case "f":
      return e.key === "f" || e.key === "F";
    case "R":
    case "r":
      return e.key === "r" || e.key === "R";
    case "←":
    case "left":
      return e.key === "ArrowLeft";
    case "→":
    case "right":
      return e.key === "ArrowRight";
    case "↑":
      return e.key === "ArrowUp";
    case "↓":
      return e.key === "ArrowDown";
    case "Space":
    case "space":
      return e.key === " " || e.code === "Space";
    case "+":
      return e.key === "+" || e.key === "=" || e.code === "NumpadAdd";
    case "-":
      return e.key === "-" || e.key === "_" || e.code === "NumpadSubtract";
    case "?":
      return e.key === "?" || (e.shiftKey && (e.key === "/" || e.code === "Slash"));
    case "Enter":
      return e.key === "Enter";
    case "Backspace":
      return e.key === "Backspace";
    case "Esc":
    case "Escape":
      return e.key === "Escape";
    default:
      return e.key === key || e.key.toLowerCase() === key.toLowerCase();
  }
}
