import { describe, expect, it } from "vitest";
import { matchHotkey } from "./match";

function key(partial: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: "",
    code: "",
    shiftKey: false,
    ...partial,
  } as KeyboardEvent;
}

describe("matchHotkey", () => {
  it("maps letters case-insensitively", () => {
    expect(matchHotkey("F", key({ key: "f" }))).toBe(true);
    expect(matchHotkey("R", key({ key: "R" }))).toBe(true);
  });

  it("maps arrows, space, and +/− aliases", () => {
    expect(matchHotkey("←", key({ key: "ArrowLeft" }))).toBe(true);
    expect(matchHotkey("Space", key({ key: " ", code: "Space" }))).toBe(true);
    expect(matchHotkey("+", key({ key: "=" }))).toBe(true);
    expect(matchHotkey("-", key({ key: "_" }))).toBe(true);
    expect(matchHotkey("+", key({ code: "NumpadAdd" }))).toBe(true);
  });

  it("treats Shift+/ as ?", () => {
    expect(matchHotkey("?", key({ key: "?" }))).toBe(true);
    expect(matchHotkey("?", key({ key: "/", code: "Slash", shiftKey: true }))).toBe(true);
    expect(matchHotkey("?", key({ key: "/", shiftKey: false }))).toBe(false);
  });
});
