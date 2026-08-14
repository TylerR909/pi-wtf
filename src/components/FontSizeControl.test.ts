import { describe, expect, it } from "vitest";
import { cycleFontSize } from "./FontSizeControl";

describe("cycleFontSize", () => {
  it("steps s → xl and clamps", () => {
    expect(cycleFontSize("s", 1)).toBe("m");
    expect(cycleFontSize("m", 1)).toBe("l");
    expect(cycleFontSize("l", 1)).toBe("xl");
    expect(cycleFontSize("xl", 1)).toBe("xl");
  });

  it("steps xl → s and clamps", () => {
    expect(cycleFontSize("xl", -1)).toBe("l");
    expect(cycleFontSize("s", -1)).toBe("s");
  });
});
