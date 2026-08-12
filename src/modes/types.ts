export type ModeId =
  | "print"
  | "digit"
  | "trainer"
  | "screensaver"
  | "hacker"
  | "quiz"
  | "base"
  | "chaos";

export interface ModeMeta {
  id: ModeId;
  /** Short label for the chrome bar */
  label: string;
  /** One-liner for tooltips / help */
  hint: string;
  /** Hide chrome more aggressively once this mode is active */
  immersive?: boolean;
}
