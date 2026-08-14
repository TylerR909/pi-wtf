import { describe, expect, it } from "vitest";
import { collapseRows, type HotkeyEntry } from "./rows";

describe("collapseRows", () => {
  it("joins keys that share a label", () => {
    const entries: HotkeyEntry[] = [
      { id: "a", key: "←", label: "Pick" },
      { id: "b", key: "→", label: "Pick" },
      { id: "c", key: "F", label: "Fullscreen" },
    ];
    expect(collapseRows(entries)).toEqual([
      { key: "← →", label: "Pick" },
      { key: "F", label: "Fullscreen" },
    ]);
  });
});
