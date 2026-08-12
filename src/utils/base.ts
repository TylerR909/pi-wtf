import { PI_DIGITS } from "../data/pi-digits";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Convert the fractional expansion of π from decimal digits into another base.
 * Uses long-multiplication style arithmetic on the known decimal expansion so
 * we stay accurate for thousands of digits without floating-point loss.
 *
 * Returns a string like "11.001001000011..." for base 2 (integer part + frac).
 */
export function piInBase(base: number, fracDigits: number): string {
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    throw new Error(`Base must be integer 2–36, got ${base}`);
  }
  if (fracDigits < 0) throw new Error("fracDigits must be >= 0");

  // Integer part of π is 3 in every base we care about for display purposes
  // (3 < base for base >= 4; for base 2 and 3 we convert 3 properly).
  const intPart = convertInteger(3, base);

  if (fracDigits === 0) return intPart;

  // Fractional decimal digits as array of 0–9
  const decFrac = PI_DIGITS.slice(1); // drop leading "3"
  // Work with enough decimal digits for the requested base digits
  // log10(base) digits of decimal ≈ 1 base digit
  const need = Math.ceil(fracDigits * Math.log10(base)) + 8;
  const digits = decFrac
    .slice(0, Math.min(decFrac.length, need))
    .split("")
    .map((c) => c.charCodeAt(0) - 48);

  // Multiply-by-base repeatedly on the fractional decimal array
  const out: string[] = [];
  const work = digits.slice();
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

export const BASE_PRESETS = [
  { base: 2, label: "Binary" },
  { base: 8, label: "Octal" },
  { base: 10, label: "Decimal" },
  { base: 12, label: "Dozenal" },
  { base: 16, label: "Hex" },
  { base: 36, label: "Base36" },
] as const;
