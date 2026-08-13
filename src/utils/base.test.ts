import { describe, expect, it } from "vitest";
import { piInBase, piInRoman, toRoman } from "./base";

describe("piInBase", () => {
  it("returns decimal-ish for base 10", () => {
    const s = piInBase(10, 20);
    expect(s.startsWith("3.14159265358979323846")).toBe(true);
  });

  it("converts to binary with known prefix", () => {
    // π = 11.00100100001111110110101010001000100001…₂
    const s = piInBase(2, 40);
    expect(s.startsWith("11.00100100001111110110101010001000100001")).toBe(true);
  });

  it("converts to ternary with known prefix", () => {
    // π = 10.01021101222201021100211111022122222…₃
    const s = piInBase(3, 35);
    expect(s.startsWith("10.01021101222201021100211111022122222")).toBe(true);
  });

  it("converts to hex with known prefix", () => {
    // π = 3.243F6A8885A308D313198A2E03707344…₁₆
    const s = piInBase(16, 32).toLowerCase();
    expect(s.startsWith("3.243f6a8885a308d313198a2e03707344")).toBe(true);
  });

  it("rejects invalid bases", () => {
    expect(() => piInBase(1, 10)).toThrow();
    expect(() => piInBase(37, 10)).toThrow();
  });
});

describe("Roman", () => {
  it("converts integers the usual way", () => {
    expect(toRoman(0)).toBe("N");
    expect(toRoman(3)).toBe("III");
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(9)).toBe("IX");
    expect(toRoman(1994)).toBe("MCMXCIV");
  });

  it("writes π as one smashed Roman soup", () => {
    expect(piInRoman(0)).toBe("III");
    expect(piInRoman(5)).toBe("IIIIIVIVIX");
  });
});
