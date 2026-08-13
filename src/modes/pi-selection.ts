/**
 * Pi wall display: index 0 = "3", 1 = ".", 2+ = rest of the digits.
 * Digit #1 is 3. 3.14 are the first three digits. The point is not a digit.
 */
export function digitNumFromDisplayIndex(displayIdx: number): number | null {
  if (displayIdx < 0) return null;
  if (displayIdx === 0) return 1;
  if (displayIdx === 1) return null;
  return displayIdx;
}

/** First / last Tape digit numbers inside a closed display-index interval. */
export function digitRangeFromDisplay(
  start: number,
  endInclusive: number,
): [number, number] | null {
  if (endInclusive < start) return null;
  let from: number | null = null;
  let to: number | null = null;
  for (let i = start; i <= endInclusive; i++) {
    const n = digitNumFromDisplayIndex(i);
    if (n == null) continue;
    if (from == null) from = n;
    to = n;
  }
  if (from == null || to == null) return null;
  return [from, to];
}

export function formatPiSelRange(from: number, to: number, locale: string): string {
  const a = from.toLocaleString(locale);
  const b = to.toLocaleString(locale);
  if (from === to) return `#${a}`;
  return `#${a} - #${b}`;
}

/** Neighbor's boat. Either endpoint's digit # containing 67. */
export const SIXTY_SEVEN_LINE = "676767676767676767676767676767676767";

export function digitIndexHas67(...nums: number[]): boolean {
  return nums.some((n) => String(n).includes("67"));
}

const YEP = ["you betcha", "sure thing"] as const;

/** Usually yes/no. Sometimes the almanac gets folksy. */
export function yn(v: boolean, rng: () => number = Math.random): string {
  const r = rng();
  if (v) {
    if (r < 0.1) return YEP[0];
    if (r < 0.2) return YEP[1];
    return "yes";
  }
  if (r < 0.18) return "wouldn't count on it";
  return "no";
}

function runLengths(digits: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    if (i === 0 || digits[i] !== digits[i - 1]) out.push(1);
    else out[out.length - 1]! += 1;
  }
  return out;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every useless line we know how to say about a digit span. */
export function allUselessFacts(digits: string, rng: () => number): string[] {
  if (!digits) return [];
  const n = digits.length;
  const vals = [...digits].map((c) => Number(c));
  const sum = vals.reduce((a, b) => a + b, 0);
  const first = vals[0]!;
  const last = vals[n - 1]!;
  const runs = runLengths(digits);
  const maxRun = Math.max(...runs);
  const repeatPairs = runs.filter((r) => r >= 2).length;
  const evens = vals.filter((d) => d % 2 === 0).length;
  const odds = n - evens;
  const distinct = new Set(digits).size;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of vals) counts[d]! += 1;
  const top = counts.indexOf(Math.max(...counts));
  const mid = vals[Math.floor((n - 1) / 2)]!;
  const alt = vals.reduce((a, d, i) => a + (i % 2 === 0 ? d : -d), 0);
  const primes = vals.filter((d) => d === 2 || d === 3 || d === 5 || d === 7).length;
  const pickD = Math.floor(rng() * 10);
  const mod = 2 + Math.floor(rng() * 8);
  const checkMod = 3 + Math.floor(rng() * 10);
  const anyD = Math.floor(rng() * 10);
  let hasD = Math.floor(rng() * 10);
  if (hasD === anyD) hasD = (hasD + 1) % 10;
  const tail = 3 + Math.floor(rng() * 3);
  const hasAsc = n >= 2 && vals.some((d, i) => i > 0 && d === vals[i - 1]! + 1);

  const pool: string[] = [
    `sum: ${sum}`,
    `middle digit: ${mid}`,
    `modulo ${mod}: ${sum % mod}`,
    `count of ${pickD}s: ${counts[pickD]}`,
    `pairs: ${repeatPairs}`,
    `longest run: ${maxRun}`,
    `evens: ${evens}`,
    `odds: ${odds}`,
    `distinct digits: ${distinct}`,
    `most common: ${top}`,
    `length: ${n}`,
    `checksum mod ${checkMod}: ${sum % checkMod}`,
    `first + last: ${first + last}`,
    `first × last: ${first * last}`,
    `mean: ${(sum / n).toFixed(2)}`,
    `alternating sum: ${alt}`,
    `prime digits: ${primes}`,
    `any ${anyD}s: ${yn(counts[anyD]! > 0, rng)}`,
    `three-peats?: ${yn(maxRun >= 3, rng)}`,
    `starts even?: ${yn(first % 2 === 0, rng)}`,
    `ends odd?: ${yn(last % 2 === 1, rng)}`,
    `contains 314?: ${yn(digits.includes("314"), rng)}`,
    `all unique?: ${yn(distinct === n, rng)}`,
    `more evens?: ${yn(evens > odds, rng)}`,
    `has a ${hasD}?: ${yn(counts[hasD]! > 0, rng)}`,
    `boring (all same)?: ${yn(distinct === 1, rng)}`,
    `palindrome?: ${yn(digits === [...digits].reverse().join(""), rng)}`,
    `ascending pair?: ${yn(hasAsc, rng)}`,
    `69 anywhere?: ${yn(digits.includes("69"), rng)}`,
  ];
  if (n >= tail) pool.push(`last ${tail}: ${digits.slice(-tail)}`);
  return pool;
}

export function collectUselessFacts(digits: string, rng: () => number): string[] {
  const pool = allUselessFacts(digits, rng);
  if (!pool.length) return [];
  const want = Math.min(pool.length, digits.length <= 1 ? 2 : 3 + Math.floor(rng() * 3));
  const order = pool.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order.slice(0, want);
}

export function formatPiSelTip(
  from: number,
  to: number,
  digits: string,
  locale: string,
): { range: string; facts: string[] } {
  const range = formatPiSelRange(from, to, locale);
  const rng = mulberry32(hashSeed(`${from}:${to}:${digits}`));
  const facts = collectUselessFacts(digits, rng);
  if (digitIndexHas67(from, to)) facts.unshift(SIXTY_SEVEN_LINE);
  return { range, facts };
}
