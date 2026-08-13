/** "3." + every digit after the leading 3. */
export function piDisplayBudget(digitCount: number): number {
  if (digitCount <= 0) return 0;
  return 1 + digitCount;
}

/**
 * Build a wrapped wall of unique π — never loops the seed.
 * `slice(a, b)` is inclusive-exclusive over the digit table (`3` at 0).
 */
export function buildPiBody(
  cols: number,
  chars: number,
  slice: (a: number, b: number) => string,
): string {
  if (cols < 1 || chars < 1) return "";
  const decimals = Math.max(0, chars - 2);
  const out = chars === 1 ? "3" : `3.${slice(1, 1 + decimals)}`;
  const lines: string[] = [];
  for (let i = 0; i < out.length; i += cols) lines.push(out.slice(i, i + cols));
  return lines.join("\n");
}

export function growShownChars(
  shown: number,
  cols: number,
  rowsPerScreen: number,
  cap: number,
  screens = 2,
): number {
  const step = Math.max(cols, cols * Math.max(1, rowsPerScreen) * screens);
  return Math.min(cap, Math.max(shown, 0) + step);
}
