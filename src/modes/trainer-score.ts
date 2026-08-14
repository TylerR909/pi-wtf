import { pickOne, randInt } from "../utils/random";

export const TRAINER_HIGH_SCORE_KEY = "trainer-high-score-sum";
export const SCORE_CONFETTI_AT = 50;

/** 1415 → 11. The leading 3 is not theirs. */
export function addDigitToScore(score: number, digit: string): number {
  const n = Number(digit);
  if (!Number.isInteger(n) || n < 0 || n > 9) return score;
  return score + n;
}

/** Endless + a miss poisons the Hardcore trophy. Reset is the only cleanse. */
export function nextTaint(taint: boolean, endless: boolean, ok: boolean): boolean {
  return taint || (endless && !ok);
}

export function isNewHighScore(score: number, best: number, taint: boolean): boolean {
  return !taint && score > best;
}

export function shouldCelebrateScore(score: number, taint: boolean): boolean {
  return !taint && score > SCORE_CONFETTI_AT;
}

export const TAINT_QUIPS: readonly string[] = [
  `Nice "score" you dirty cheater.`,
  "Didn't count. I saw what you did.",
  "Endless called. It wants its points back.",
  "Cute. Now try it without the safety net.",
  "I don't give trophies for the easy setting.",
  "You went Endless, you whiffed, you came back. No.",
  "Practice mode doesn't count, champ.",
  "The leaderboard is laughing.",
  "Score vacated. See: unsportsmanlike infinite lives.",
  "I saw the Endless toggle. I'm not blind.",
  "Zero errors was the deal. You broke it.",
  "Bold of you to die on Hardcore after that.",
  "Tainted. Like the run. Like the vibe.",
  "High score? After that little vacation? Please.",
  "Those digits were on easy. Sit down.",
];

/** Why the trophy is void. Tabs stay vague — don't name the other page. */
export type TaintReason = "endless" | "tabs";

export const TAB_TAINT_QUIPS: readonly string[] = [
  "You thought we wouldn't notice?",
  "Cute setup.",
  "I can count to two.",
  "We don't miss much.",
  "Interesting layout you have going.",
  "Whatever that other page is, I saw it.",
  "Bold of you to leave that other tab open.",
  "Two windows. One conscience.",
  "Split-screen. Disqualified.",
];

export function pickTaintQuip(reason: TaintReason = "endless", rng = Math.random): string {
  return pickOne(reason === "tabs" ? TAB_TAINT_QUIPS : TAINT_QUIPS, rng);
}

/** Random values with the same digit count as the score, then the real one last. */
export function shuffleScoreFrames(target: number, rng = Math.random): number[] {
  const width = String(Math.max(target, 0)).length;
  const max = 10 ** width - 1;
  const min = width <= 1 ? 0 : 10 ** (width - 1);
  const frames: number[] = [];
  for (let i = 0; i < 14; i++) frames.push(randInt(min, max, rng));
  frames.push(target);
  return frames;
}

export const SCORE_TICK_MS = 55;
