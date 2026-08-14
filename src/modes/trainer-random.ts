import { pickOne } from "../utils/random";

export const TRAINER_RANDOM_CORRECT = 0.6;
export const QUIZ_RANDOM_CORRECT = 0.25;

/** Default is Quiz’s 25% hit rate. Trainer passes 60%. */
export function randomTrainerSide(
  correct: "left" | "right",
  rng = Math.random,
  correctChance = QUIZ_RANDOM_CORRECT,
): "left" | "right" {
  if (rng() < correctChance) return correct;
  return correct === "left" ? "right" : "left";
}

const SHY = [
  "Oops…",
  "Sorry.",
  "I thought that was it.",
  "My bad.",
  "Oh no.",
  "Wait—",
  "That was… not it.",
  "Ah.",
  "Hmm. No.",
  "I flinched.",
  "Almost?",
  "That felt right in the room.",
  "Whoops.",
  "I blinked.",
  "Tiny mistake.",
  "Let me try that again. For you.",
];

const GASLIGHT = [
  "YOU should have picked the other one.",
  "That was obviously the other card.",
  "You knew. I know you knew.",
  "Don't look at me. You agreed.",
  "I only pressed the button.",
  "Interesting choice you just made.",
  "I asked you first. In my head.",
  "You hovered over the right one. I saw it.",
  "We both chose this. Mostly you.",
  "I'm just the messenger. You're the decider.",
  "The other card is judging you. Quietly.",
  "That one was a plant. You walked into it.",
  "I thought you wanted that one.",
  "You said Random. This is Random.",
  "If you wanted correct you would have pointed.",
  "I can't pick wrong if you keep hiring me.",
];

const SPAM = [
  "We can stop whenever you want.",
  "This is a choice you're making.",
  "The cards aren't moving. You are.",
  "Random isn't a strategy. It's a mood.",
  "Okay. Again. Sure.",
  "Still trusting me. Bold.",
  "The button works. That's the whole feature.",
  "You've invented a slot machine with worse odds.",
  "I can do this all day. Unfortunately.",
  "Same button. Same hope. Same result.",
  "This is now a bit. I'm contractually in it.",
  "You're not even looking at the cards anymore.",
  "At this point I'm a coin with opinions.",
  "One more? Of course one more.",
  "The law of large numbers is taking notes.",
  "Spam is a valid input. I never said a good one.",
  "We're speedrunning disappointment.",
  "Your finger and I are in a situationship.",
  "I would pick the other one. You won't let me.",
  "This is the opposite of studying π.",
  "A professional would have clicked a card by now.",
  "The Random button is not your tutor.",
  "Okay but what if the next one is right. What if.",
  "You've given me too much power and I am using it poorly.",
  "We could be doing anything else. We're not.",
];

/** Quiz-only roast when Random misses. Shy first, then gaslight, then spam. */
export function pickRandomGag(wrongStreak: number, rng = Math.random): string {
  if (wrongStreak >= 5) return pickOne(SPAM, rng);
  if (wrongStreak >= 3) return pickOne(GASLIGHT, rng);
  return rng() < 0.55 ? pickOne(SHY, rng) : pickOne(GASLIGHT, rng);
}
