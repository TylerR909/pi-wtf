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

export const BASE_PRESETS = [
  { base: 2, label: "Binary" },
  { base: 3, label: "Ternary" },
  { base: 8, label: "Octal" },
  { base: 10, label: "Decimal" },
  { base: 12, label: "Dozenal" },
  { base: 16, label: "Hex" },
  { base: 36, label: "Base36" },
] as const;
