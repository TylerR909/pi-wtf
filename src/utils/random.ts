/** Inclusive integer in [min, max]. */
export function randInt(min: number, max: number, rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pickOne<T>(arr: readonly T[], rng = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function shuffleInPlace<T>(arr: T[], rng = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Wrong digit 0–9, not equal to correct. */
export function wrongDigit(correct: string, rng = Math.random): string {
  let d: string;
  do {
    d = String(randInt(0, 9, rng));
  } while (d === correct);
  return d;
}
