/** Header controls one mode at a time — last register wins. */
export type OptionsSlot = {
  id: string;
  fullscreen: boolean;
  fontSize: boolean;
  idle: boolean;
  themeKey: boolean;
};

export function replaceSlot<T extends { id: string }>(_prev: T[], slot: T): T[] {
  return [slot];
}

export function activeSlot<T>(slots: readonly T[]): T | undefined {
  return slots.at(-1);
}

export function slotWantsFullscreen(slots: readonly OptionsSlot[], allowed = true): boolean {
  return allowed && Boolean(activeSlot(slots)?.fullscreen);
}
