import { describe, expect, it } from "vitest";
import { isKeepChrome } from "./useChromeVisibility";

describe("isKeepChrome", () => {
  it("pins chrome on the Random control", () => {
    const btn = document.createElement("button");
    btn.setAttribute("data-keep-chrome", "");
    const span = document.createElement("span");
    btn.append(span);
    expect(isKeepChrome(btn)).toBe(true);
    expect(isKeepChrome(span)).toBe(true);
    expect(isKeepChrome(document.createElement("div"))).toBe(false);
  });
});
