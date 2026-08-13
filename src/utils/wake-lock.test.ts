import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canRequestWakeLock,
  releaseWakeLock,
  requestScreenWakeLock,
  shouldHoldWakeLock,
} from "./wake-lock";

describe("shouldHoldWakeLock", () => {
  it("holds on Rain and Tape without fullscreen", () => {
    expect(shouldHoldWakeLock("chaos", false)).toBe(true);
    expect(shouldHoldWakeLock("tape", false)).toBe(true);
  });

  it("holds on any mode once fullscreen", () => {
    expect(shouldHoldWakeLock("digit", true)).toBe(true);
    expect(shouldHoldWakeLock("quiz", true)).toBe(true);
    expect(shouldHoldWakeLock("trainer", true)).toBe(true);
  });

  it("does not hold on interactive modes windowed", () => {
    expect(shouldHoldWakeLock("digit", false)).toBe(false);
    expect(shouldHoldWakeLock("trainer", false)).toBe(false);
    expect(shouldHoldWakeLock("quiz", false)).toBe(false);
    expect(shouldHoldWakeLock("hacker", false)).toBe(false);
    expect(shouldHoldWakeLock("pi", false)).toBe(false);
    expect(shouldHoldWakeLock("base", false)).toBe(false);
  });
});

describe("requestScreenWakeLock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("is a no-op when the API is missing", async () => {
    vi.stubGlobal("navigator", {});
    expect(canRequestWakeLock()).toBe(false);
    expect(await requestScreenWakeLock()).toBeNull();
  });

  it("skips when the tab is hidden", async () => {
    const request = vi.fn();
    vi.stubGlobal("navigator", { wakeLock: { request } });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    expect(await requestScreenWakeLock()).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it("returns the sentinel and swallows denials", async () => {
    const sentinel = { released: false, release: vi.fn() };
    const request = vi.fn().mockResolvedValue(sentinel);
    vi.stubGlobal("navigator", { wakeLock: { request } });
    expect(await requestScreenWakeLock()).toBe(sentinel);
    expect(request).toHaveBeenCalledWith("screen");

    request.mockRejectedValueOnce(new Error("NotAllowedError"));
    expect(await requestScreenWakeLock()).toBeNull();
  });

  it("release is idempotent", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    expect(await releaseWakeLock(null)).toBeNull();
    expect(await releaseWakeLock({ released: true, release } as unknown as WakeLockSentinel)).toBe(
      null,
    );
    expect(release).not.toHaveBeenCalled();
    expect(await releaseWakeLock({ released: false, release } as unknown as WakeLockSentinel)).toBe(
      null,
    );
    expect(release).toHaveBeenCalledOnce();
  });
});
