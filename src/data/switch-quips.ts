import { shuffleInPlace } from "../utils/random";
import type { DigitQuipBehavior } from "./quips";

export type DigitQuipFamily = "hold" | "spam" | "click" | "tap";

export function quipFamily(b: DigitQuipBehavior): DigitQuipFamily {
  if (b === "space-hold" || b === "pointer-hold") return "hold";
  return b;
}

export function isKeyboardBehavior(b: DigitQuipBehavior): boolean {
  return b === "space-hold" || b === "spam";
}

/** Same physical press going from peck → hold. Not a bit. */
export function isSamePressEscalation(from: DigitQuipBehavior, to: DigitQuipBehavior): boolean {
  return (
    (from === "spam" && to === "space-hold") ||
    (from === "click" && to === "pointer-hold") ||
    (from === "tap" && to === "pointer-hold")
  );
}

export function isCrossInput(from: DigitQuipBehavior, to: DigitQuipBehavior): boolean {
  if (from === "click" && to === "tap") return true;
  if (from === "tap" && to === "click") return true;
  return isKeyboardBehavior(from) !== isKeyboardBehavior(to);
}

type Pair = `${DigitQuipBehavior}>${DigitQuipBehavior}`;
type FamilyPair = `${DigitQuipFamily}>${DigitQuipFamily}`;

/** Specific from→to, when we know the exact buttons. */
const SWITCH_MOCKS: Partial<Record<Pair, readonly string[]>> = {
  "space-hold>click": [
    "Aww did you get tired of holding spacebar? Need to click now?",
    "Spacebar too heavy? Welcome to Click Town.",
    "Oh the hold was a bit much. Fine. Click. Like an animal.",
    "Wrist give out? Here's a mouse. Enjoy the manual labor.",
    "From “I can hold forever” to one-digit-per-click. Character development.",
    "The spacebar will miss you. The mouse will not.",
    "Auto-repeat wasn't good enough. Had to make it a job.",
    "Commitment issues. Classic. Click away.",
  ],
  "space-hold>tap": [
    "Aww spacebar too far? Gotta poke the glass now?",
    "From key to screen. Evolution. Backwards.",
    "Finger left the keyboard. The keyboard is grateful.",
    "Hold retired. Tap career just started. Tragic.",
    "The spacebar was right there. You chose a window.",
  ],
  "space-hold>spam": [
    "Finger get bored of holding? Gotta spam, spam, spam, now?",
    "The hold was free. Now you're working for it.",
    "Released. Immediately mashing. We see you.",
    "Couldn't just stay. Had to peck.",
    "Turbo off. Woodpecker on.",
    "You had one job (hold). You chose violence (tap-tap-tap).",
    "Look at you, earning every digit.",
  ],
  "pointer-hold>spam": [
    "Finger get bored of holding? Gotta spam, spam, spam, now?",
    "The screen was right there. Now you're attacking a key.",
    "Lifted off. Immediately unwell.",
    "Touch hold cancelled. Spacebar abuse initiated.",
    "You can just rest it. Or you can go to war with plastic.",
  ],
  "pointer-hold>click": [
    "Aww did you get tired of holding? Need to click now?",
    "You can just keep it down. But no. Click. Click. Click.",
    "The hold was free. You chose employment.",
    "Finger got bored of sitting. Now it has a commute.",
    "We had turbo. You picked piecework.",
  ],
  "pointer-hold>tap": [
    "You were already on the glass. You just had to bounce.",
    "Hold was an option. You picked drum solo.",
    "Lift, tap, lift, tap. We had a good thing.",
    "The screen didn't move. You did. Worse.",
  ],
  "pointer-hold>space-hold": [
    "Finger quit. Spacebar drafted.",
    "New button, same disease.",
    "Migrated the hold. Very enterprise.",
    "Screen wasn't clingy enough? Try a key.",
  ],
  "space-hold>pointer-hold": [
    "Spacebar filed for divorce. Finger got the kids.",
    "New surface, same refusal to let go.",
    "Keyboard wasn't enough. Had to pin the screen too.",
    "Same bit. Different furniture.",
  ],
  "click>space-hold": [
    "Oh no did you break your mouse?",
    "OHHH you found the hold. Welcome.",
    "Tired of clicking? The spacebar was here the whole time.",
    "Manual labor era: over. Parasite era: begun.",
    "Look who discovered auto-repeat. Proud of you. Sort of.",
    "Clicks were a choice. This is a lifestyle.",
  ],
  "click>spam": [
    "Oh no did you break your mouse?",
    "Clicks weren't fast enough? Spacebar go brrr. Sure.",
    "Mouse retired. Key is in danger.",
    "From artisan clicks to industrial mash.",
    "The cursor is taking a personal day.",
  ],
  "click>tap": [
    "Oh no did you break your mouse?",
    "Mouse too fancy? Just slap the screen.",
    "We have a cursor. You chose finger.",
    "Pointer resigned. Thumb hired.",
  ],
  "click>pointer-hold": [
    "Oh no did you break your mouse?",
    "Oh you can just… stay. Yes. That.",
    "Clicking was a bit much. Holding is right there.",
    "Finally. The feature was the whole time.",
    "Look at you. Reading the room. Sitting on it.",
  ],
  "tap>space-hold": [
    "Glass wasn't enough. You needed a key to sit on.",
    "Thumb clocked out. Spacebar clocked in.",
    "From poke to park. Growth? Decline? Yes.",
  ],
  "tap>spam": [
    "Screen to spacebar. Same energy. Worse accuracy.",
    "Couldn't poke glass so you poke plastic. Growth.",
    "New surface to annoy. Proud of you.",
  ],
  "tap>click": [
    "Finger off the glass. Now it's a mouse problem.",
    "We invented touch and you went back.",
    "Thumb quit. Cursor drafted.",
  ],
  "tap>pointer-hold": [
    "You can just rest it there. There you go.",
    "The bouncing was optional. Holding is free.",
    "Drum solo cancelled. Slump initiated.",
  ],
  "spam>space-hold": [
    "Oh you can just hold it. We were waiting.",
    "Mash era concluded. Sloth era commenced.",
    "Look who read the manual (there is no manual).",
    "Finger got tired of jumping. Now it just… sits.",
    "Pecking retired. Parasite hired.",
  ],
  "spam>click": [
    "Spacebar survived. The mouse did not ask for this.",
    "From mash to click. Still not holding. Impressive.",
    "Pecking, but fancier.",
    "Aww did the key fight back? Here's a mouse.",
  ],
  "spam>tap": [
    "Keyboard wasn't punching back so you tried glass.",
    "New surface to annoy.",
    "Same spam. Shinier victim.",
  ],
  "spam>pointer-hold": [
    "You can sit still. On the screen. Revolutionary.",
    "Mash cancelled. Slump initiated.",
    "The key is grateful. The glass is not.",
  ],
};

const SWITCH_FALLBACK: Partial<Record<FamilyPair, readonly string[]>> = {
  "hold>click": [
    "Aww did you get tired of holding? Need to click now?",
    "Hold cancelled. Manual mode. Bold downgrade.",
  ],
  "hold>tap": [
    "Aww did you get tired of holding? Gotta tap now?",
    "The hold was free. You picked bouncing.",
  ],
  "hold>spam": [
    "Finger get bored of holding? Gotta spam, spam, spam, now?",
    "Released. Immediately unwell.",
  ],
  "hold>hold": ["New surface. Same refusal to let go.", "You moved the hold. That's not growth."],
  "click>hold": ["OHHH you found the hold. Welcome.", "Clicks were a phase. This is the bit."],
  "click>spam": [
    "Mouse down. Key in danger.",
    "From click to mash. Still allergic to sitting still.",
  ],
  "click>tap": ["Cursor fired. Finger hired.", "We had a mouse. You chose a window."],
  "tap>hold": [
    "You can just rest it. There. That's the whole feature.",
    "Poke era over. Slump era on.",
  ],
  "tap>spam": ["Glass to plastic. Same chaos.", "New thing to peck. Congrats."],
  "tap>click": ["Thumb quit. Mouse drafted.", "Back to the cursor. Tradition."],
  "spam>hold": ["Oh you can just hold it. We were waiting.", "Mash retired. The sit-in begins."],
  "spam>click": ["Spacebar lived. Mouse did not consent.", "Mash → click. Still not the hold."],
  "spam>tap": ["Keyboard survived. Glass is next.", "Same spam. Different victim."],
};

export function switchMockLines(from: DigitQuipBehavior, to: DigitQuipBehavior): readonly string[] {
  if (from === to) return [];
  const specific = SWITCH_MOCKS[`${from}>${to}`];
  if (specific?.length) return specific;
  return SWITCH_FALLBACK[`${quipFamily(from)}>${quipFamily(to)}`] ?? [];
}

export function shouldMockSwitch(
  from: DigitQuipBehavior,
  to: DigitQuipBehavior,
  settledForMs: number,
  samePress: boolean,
): boolean {
  if (from === to) return false;
  if (samePress && isSamePressEscalation(from, to)) return false;
  if (switchMockLines(from, to).length === 0) return false;
  const need = isCrossInput(from, to) ? 700 : 1800;
  return settledForMs >= need;
}

export function createSwitchMockPicker() {
  const bags = new Map<string, string[]>();
  return {
    pick(from: DigitQuipBehavior, to: DigitQuipBehavior, rng = Math.random): string | null {
      const lines = switchMockLines(from, to);
      if (lines.length === 0) return null;
      const key = `${from}>${to}`;
      let bag = bags.get(key);
      if (!bag?.length) {
        bag = lines.slice();
        shuffleInPlace(bag, rng);
        bags.set(key, bag);
      }
      return bag.pop() ?? null;
    },
  };
}
