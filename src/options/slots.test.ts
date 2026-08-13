import { describe, expect, it } from "vitest";
import { activeSlot, type OptionsSlot, replaceSlot, slotWantsFullscreen } from "./slots";

const fs: OptionsSlot = {
  id: "digit",
  fullscreen: true,
  fontSize: false,
  idle: true,
  themeKey: true,
};
const no: OptionsSlot = {
  id: "base",
  fullscreen: false,
  fontSize: false,
  idle: false,
  themeKey: true,
};

describe("options slots", () => {
  it("drops a leftover fullscreen slot when the next mode registers", () => {
    expect(replaceSlot([fs], no)).toEqual([no]);
    expect(slotWantsFullscreen(replaceSlot([fs], no))).toBe(false);
  });

  it("only the active mode can show the fullscreen control", () => {
    expect(slotWantsFullscreen([fs, no])).toBe(false);
    expect(slotWantsFullscreen([no, fs])).toBe(true);
    expect(slotWantsFullscreen([fs], false)).toBe(false);
    expect(activeSlot([fs, no])?.id).toBe("base");
  });
});
