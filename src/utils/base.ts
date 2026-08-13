import { PI_DIGITS } from "../data/pi-digits";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * True base-b expansion of the *value* π (∑ d_k b^k), not a digit-by-digit
 * remapping of 3.14159… (that would be BCD).
 *
 * Integer part: divide 3 by b, remainders.
 * Fractional part: start with {π}=π−3 and repeatedly × b; the integer part
 * of each product is the next digit (long multiplication on the decimal frac).
 */
export function piInBase(base: number, fracDigits: number): string {
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    throw new Error(`Base must be integer 2–36, got ${base}`);
  }
  if (fracDigits < 0) throw new Error("fracDigits must be >= 0");

  const intPart = convertInteger(3, base);
  if (fracDigits === 0) return intPart;

  // Enough decimal places of {π} so the last output digit is stable.
  const need = Math.ceil(fracDigits * Math.log10(base)) + 16;
  const decFrac = PI_DIGITS.slice(1, 1 + Math.min(PI_DIGITS.length - 1, need));
  const work = decFrac.split("").map((c) => c.charCodeAt(0) - 48);

  const out: string[] = [];
  for (let i = 0; i < fracDigits; i++) {
    let carry = 0;
    for (let j = work.length - 1; j >= 0; j--) {
      const v = work[j]! * base + carry;
      work[j] = v % 10;
      carry = (v / 10) | 0;
    }
    out.push(DIGITS[carry] ?? "?");
  }

  return `${intPart}.${out.join("")}`;
}

function convertInteger(n: number, base: number): string {
  if (n === 0) return "0";
  let x = n;
  const parts: string[] = [];
  while (x > 0) {
    parts.push(DIGITS[x % base]!);
    x = (x / base) | 0;
  }
  return parts.reverse().join("");
}

/** Standard Roman for a positive integer. 0 is N (nulla). Caps at 3999. */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 3999) {
    throw new Error(`Roman range is 0–3999, got ${n}`);
  }
  if (n === 0) return "N";
  const table: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let x = n;
  let out = "";
  for (const [v, s] of table) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out;
}

const ROMAN_DIGIT = ["N", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"] as const;

/**
 * Not a real base. Integer 3 → III; each fractional decimal digit is I–IX
 * (N for 0), smashed together. Unreadable on purpose.
 */
export function piInRoman(fracDigits: number): string {
  if (fracDigits < 0) throw new Error("fracDigits must be >= 0");
  if (fracDigits === 0) return "III";
  const frac = PI_DIGITS.slice(1, 1 + Math.min(PI_DIGITS.length - 1, fracDigits));
  const parts: string[] = ["III"];
  for (const ch of frac) {
    parts.push(ROMAN_DIGIT[ch.charCodeAt(0) - 48] ?? "?");
  }
  return parts.join("");
}

export const BASE_PRESETS = [
  { base: 2, label: "Binary" },
  { base: 3, label: "Ternary" },
  { base: 8, label: "Octal" },
  { base: 10, label: "Decimal" },
  { base: 12, label: "Dozenal" },
  { base: 16, label: "Hex" },
  { base: 36, label: "Base36" },
] as const;
