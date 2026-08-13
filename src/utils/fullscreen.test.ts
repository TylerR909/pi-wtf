import { afterEach, describe, expect, it } from "vitest";
import { isFullscreenNow, toggleFullscreen } from "./fullscreen";

describe("app fullscreen fallback", () => {
  afterEach(() => {
    delete document.documentElement.dataset.appFs;
  });

  it("toggles CSS fullscreen when the native API is absent", async () => {
    expect(isFullscreenNow()).toBe(false);
    await toggleFullscreen();
    expect(isFullscreenNow()).toBe(true);
    expect(document.documentElement.dataset.appFs).toBe("1");
    await toggleFullscreen();
    expect(isFullscreenNow()).toBe(false);
  });
});
