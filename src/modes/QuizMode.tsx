import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { burstConfetti } from "../components/PiOclock";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { useNarrow } from "../hooks/useNarrow";
import { useSwipe } from "../hooks/useSwipe";
import { useHotkey } from "../hotkeys/HotkeyContext";
import { formatOrdinal } from "../utils/ordinal";
import { pickOne, randInt, shuffleInPlace, wrongDigit } from "../utils/random";
import { pickRandomGag, randomTrainerSide } from "./trainer-random";

type QuizStyle = "input" | "lr";

interface Question {
  index: number;
  correct: string;
  style: QuizStyle;
  left?: string;
  right?: string;
  correctSide?: "left" | "right";
  leftDisplay?: string;
  rightDisplay?: string;
  /** True when one side is an emoji/letter chaos decoy. */
  decoy?: boolean;
}

interface LiveStats {
  correct: number;
  wrong: number;
  total: number;
}

const EMOJIS = ["π", "🍕", "🦕", "👀", "🫠", "✨", "圆", "∞", "?", "Z", "e", "φ", "🐢", "🍌"];

const GENERIC_HINTS = [
  `It's not Z!`,
  `Not an emoji. Usually.`,
  `Somewhere between 0 and 9 inclusive. Wild.`,
  `Hint: look at your keyboard's number row.`,
  `It's on the row between Escape and the letters. You're welcome.`,
  `Same keys as !@#$%^&*() — just don't hold Shift.`,
  `The numpad also works. If you have one. If you don't, number row.`,
  `It's printed on a key you already own.`,
  `F-keys are too high. Letters are too low. Warm.`,
  `If your keyboard is Dvorak this hint is unchanged.`,
  `It's an Arabic numeral. Not Roman. We checked.`,
  `Base 10. We're not monsters.`,
  `One character. From the number row. That's two hints.`,
  `It's on the same row as minus and equals, which is also this quiz.`,
  `Try the row that starts at 1 and ends in backspace-adjacent despair.`,
  `Not Caps Lock. Adjacent, spiritually.`,
  `If you can count to nine without taking off a shoe, you have the shortlist.`,
  `Archimedes knew this one. Allegedly.`,
  `If you guess randomly you have a 10% chance. Do better.`,
  `Have you tried asking π nicely?`,
  `Hint expired. Pay $0 to renew.`,
  `It's the one you're thinking of. Or the other one.`,
  `Consult your local circle.`,
  `The answer has fewer than two characters.`,
  `A professional would already know this.`,
  `It is a digit. That's the whole hint.`,
  `Close your eyes and guess. We're not helping.`,
  `NASA is not going to call you either way.`,
  `The circle called. It wants this back.`,
  `Hot take: it's even. Or odd.`,
  `Your calculator is laughing.`,
  `This one is famous in some timelines.`,
  `Skip it. No, wait, don't. Or do.`,
  `We wrote this hint at 3am.`,
  `Statistically you will be wrong. Prove us wrong.`,
  `It's the digit after the previous one. Unhelpful? Yes.`,
  `Blink twice if you want a real hint. Too late.`,
  `The FBI also does not know.`,
  `Try the one you didn't click last time. Unless you already did.`,
  `π is irrational. This hint is also irrational.`,
  `Have you considered a career that doesn't involve guessing?`,
  `We ran out of good hints in 2024.`,
  `Count the holes in a pretzel. Unrelated.`,
  `The digit is camera-shy.`,
  `If this were hex you'd have more letters to be wrong with.`,
  `A coin flip would be more confident than you.`,
  `Imagine you're a circle. Still no.`,
  `This hint is gluten-free and also useless.`,
  `Ask a child. Then ignore them.`,
  `The answer exists. Your certainty does not.`,
  `We believe in you the way we believe in cold fusion.`,
  `It's probably not 7. Unless it is.`,
  `Write it in the fog on a window. Then guess.`,
  `This is the easiest question you'll miss today.`,
  `Your future self is already disappointed.`,
  `Not the number of fingers you're holding up.`,
  `π day is 3/14. This is not a hint. Or is it.`,
  `Consult the I Ching. Or don't. Same result.`,
  `There's a 10% chance this sentence helped.`,
  `We could tell you. We won't.`,
];

/** 50/50 only. Shown only when the correct button is Left. */
const LEFT_HINTS = [
  `The digit has left to get milk.`,
  `Pick a number, any number, except the right one. That's the spirit.`,
  `There's something left for you to do.`,
  `I left the answer over here.`,
  `Look left. That's the hint. Yes, really.`,
  `What's left is the answer.`,
  `Nothing right about the other one.`,
  `Take a left. We are not being metaphorical.`,
  `The answer packed up and left.`,
];

/** 50/50 only. Shown only when the correct button is Right. */
const RIGHT_HINTS = [
  `There's nothing left for you to do.`,
  `Alright alright alright.`,
  `Don't worry, it'll be alright.`,
  `You have the right to remain correct.`,
  `Hang a right.`,
  `Two wrongs don't make a right. One of these does.`,
  `If it feels right, it is.`,
  `All's well that ends right.`,
  `The right answer is, inconveniently, right.`,
];

const genericHintBag: string[] = [];
const leftHintBag: string[] = [];
const rightHintBag: string[] = [];

function buildHint(correct: string, side?: "left" | "right"): string {
  const wrongPool = "0123456789".split("").filter((d) => d !== correct);
  const notA = pickOne(wrongPool);
  const notB = pickOne(wrongPool.filter((d) => d !== notA));
  const notC = pickOne(wrongPool.filter((d) => d !== notA && d !== notB));
  // ~12% of 50/50 hints are real side clues. Check first so other rolls don't stack.
  if (side && Math.random() < 0.12) {
    return side === "left"
      ? takeFromBag(leftHintBag, LEFT_HINTS)
      : takeFromBag(rightHintBag, RIGHT_HINTS);
  }
  if (Math.random() < 0.18) return `Not ${notA}!`;
  if (Math.random() < 0.12) {
    return pickOne([
      `Definitely not ${notB}.`,
      `Not ${notA} and also not ${notB}. You're welcome.`,
      `Not ${notC}. We checked twice.`,
      `Imagine a pie. Now forget the pie. It's ${notA}? No.`,
      `It's ${notA}! Wait no. The opposite of that.`,
      `Not ${notA}, not ${notB}, not ${notC}. Three down. Seven to go.`,
    ]);
  }
  return takeFromBag(genericHintBag, GENERIC_HINTS);
}

/** Draw without replacement; reshuffle when the bag is empty. */
function takeFromBag<T>(bag: T[], pool: readonly T[]): T {
  if (bag.length === 0) bag.push(...shuffleInPlace(pool.slice()));
  return bag.pop() ?? pickOne(pool);
}

type WrongLine = (n: number, pretty: string) => string;

const WRONG_LINES: readonly WrongLine[] = [
  () => `You've literally had a 50/50 shot to get any of these right.`,
  (n, pretty) => `The odds of you getting ${n} in a row wrong is 1/2^${n} = ${pretty}%.`,
  (n) => `${n} wrong. A coin is considering a restraining order.`,
  () => `At this point the 50/50 is a courtesy we should revoke.`,
  () => `You could pick at random and still outperform this. Oh wait, evidently not.`,
  (n) => `${n} misses. That's not unlucky. That's a lifestyle.`,
  () => `Heads. Tails. You invented a third option: miss.`,
  () => `Oh wow you finally got one ri-... oh, nevermind.`,
];
const WRONG_DECOY: WrongLine = () =>
  `Even with the occasional emoji decoy it's still two doors. One is correct.`;

const CHAOS_LINES = [
  `That was not a 50/50. That was a digit and a prop.`,
  `You picked the decoy. It was not being subtle.`,
  `One of those was a number. You did not select the number.`,
  `π does not contain that. We had it checked.`,
  `The fake one. You chose the fake one.`,
  `Digits don't look like that. This is taught in schools.`,
  `You saw the shiny object and abandoned mathematics.`,
  `There were two doors. One had a digit. You picked art.`,
  `That option was decorative. The other one was the answer.`,
  `A professional would have noticed it wasn't a digit.`,
];

/** They clicked π. That is, in fact, a number. Just not a digit of π. */
const CHAOS_PI = [
  `Okay, π is a number. It is not a digit of π. Sit with that.`,
  `You selected the entire constant. We asked for one digit.`,
  `You picked π on a π quiz. That's either poetry or a cry for help.`,
  `Recursive. Wrong. Iconic.`,
  `Fair. That one was more number than the other one was specific.`,
  `π contains digits. It is not itself a digit. Kindergarten and philosophy.`,
];

/** e / φ / ∞ — also numbers, still not digits. */
const CHAOS_MATH = [
  `That is a number. Just not a digit, and not this one.`,
  `Wrong constant. Read the room.`,
  `A professional would have noticed we asked for a digit.`,
  `Infinity, e, and φ are numbers. They are also not on the number row.`,
  `You picked a celebrity number. We wanted a civilian.`,
];

type WinLine = (n: number) => string;
const WIN_LINES: readonly WinLine[] = [
  () => `Wow another failu-... wait, what?`,
  () => `A broken clock is right twice a day. You're at one.`,
  () => `Congratulations. The law of large numbers took pity.`,
  () => `We'd clap but we don't want to startle the one correct answer.`,
  (n) => `${n} wrong, then this. Growth. Microscopic, but growth.`,
  () => `Was that on purpose or did your hand slip the right way?`,
  () => `Don't let this go to your head. It was still 50/50.`,
  () => `A win is a win. We checked. Barely.`,
];

const wrongBag: WrongLine[] = [];
const chaosBag: string[] = [];
const chaosPiBag: string[] = [];
const chaosMathBag: string[] = [];
const winBag: WinLine[] = [];

function roastWrong(n: number, seenDecoy: boolean): string {
  const pct = 100 / 2 ** n;
  const pretty = pct >= 1 ? pct.toFixed(2) : pct.toPrecision(3);
  const pool = seenDecoy ? [...WRONG_LINES, WRONG_DECOY] : WRONG_LINES;
  return takeFromBag(wrongBag, pool)(n, pretty);
}

function roastChaos(picked?: string): string {
  if (picked === "π") return takeFromBag(chaosPiBag, CHAOS_PI);
  if (picked === "e" || picked === "φ" || picked === "∞") {
    return takeFromBag(chaosMathBag, CHAOS_MATH);
  }
  return takeFromBag(chaosBag, CHAOS_LINES);
}

function roastFinally(n: number): string {
  return takeFromBag(winBag, WIN_LINES)(n);
}

let quizSerial = 0;

function pickIndex(): number {
  quizSerial += 1;
  const max = Math.max(3, PI_DIGIT_COUNT - 1);
  // 50% the FIRST question is 1st / 2nd / 3rd
  if (quizSerial === 1 && Math.random() < 0.5) {
    return randInt(0, 2);
  }
  // Immediately after (or if first wasn't tiny): jump to the 500k–1.2M band
  if (quizSerial <= 2) {
    const lo = Math.min(500_000, max);
    const hi = Math.min(1_200_000, max);
    if (hi > lo) return randInt(lo, hi);
  }
  // True-random thereafter; 1st/2nd/3rd are very rare
  if (Math.random() < 0.015) return randInt(0, 2);
  return randInt(3, max);
}

function makeQuestion(style: QuizStyle): Question {
  const index = pickIndex();
  const correct = PI_DIGITS[index] ?? "0";

  if (style === "input") return { index, correct, style };

  const wrong = wrongDigit(correct);
  const chaos = Math.random() < 0.08; // ~8% emoji/letter decoy
  const wrongDisplay = chaos ? pickOne(EMOJIS) : wrong;
  const correctSide: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  const left = correctSide === "left" ? correct : wrong;
  const right = correctSide === "right" ? correct : wrong;
  return {
    index,
    correct,
    style,
    left,
    right,
    correctSide,
    leftDisplay: correctSide === "left" ? correct : wrongDisplay,
    rightDisplay: correctSide === "right" ? correct : wrongDisplay,
    decoy: chaos,
  };
}

export function QuizMode() {
  const narrow = useNarrow();
  const narrowRef = useRef(narrow);
  narrowRef.current = narrow;
  const [style, setStyle] = useState<QuizStyle>("lr");
  const [hintsOn, setHintsOn] = useState(false);
  useHotkey({ key: "←", label: t`Pick a side`, enabled: style === "lr" });
  useHotkey({ key: "→", label: t`Pick a side`, enabled: style === "lr" });
  const [q, setQ] = useState<Question>(() => {
    quizSerial = 0;
    return makeQuestion("lr");
  });
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [glow, setGlow] = useState<"ok" | "no" | null>(null);
  const [stats, setStats] = useState<LiveStats>({ correct: 0, wrong: 0, total: 0 });
  const [hitSide, setHitSide] = useState<"left" | "right" | null>(null);
  const [roast, setRoast] = useState<{ text: string; win: boolean; out?: boolean } | null>(null);
  const roastRef = useRef(roast);
  roastRef.current = roast;
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const wrongRun = useRef(0);
  const randomMisses = useRef(0);
  const roasting = useRef(false);
  const seenDecoy = useRef(false);
  const busy = useRef(false);
  const styleRef = useRef(style);
  styleRef.current = style;
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    return () => {
      for (const id of timers.current) window.clearTimeout(id);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refocus after each question
  useEffect(() => {
    // Mobile uses the on-screen pad — autofocus pops the OS keyboard and snaps the chrome.
    if (style !== "input" || narrow) return;
    const focus = () => inputRef.current?.focus();
    focus();
    // After mounting via the mode tab, wait a frame so we win any leftover blur.
    const id = window.requestAnimationFrame(focus);
    return () => cancelAnimationFrame(id);
  }, [style, q.index, narrow]);

  const hint = useMemo(() => (hintsOn ? buildHint(q.correct, q.correctSide) : null), [q, hintsOn]);
  const ordinal = useMemo(() => formatOrdinal(q.index + 1), [q.index]);

  const nextQ = useCallback((s?: QuizStyle) => {
    const next = makeQuestion(s ?? styleRef.current);
    if (next.decoy) seenDecoy.current = true;
    setQ(next);
    setInput("");
    setFeedback(null);
    setGlow(null);
    setHitSide(null);
    // Keep roast on screen after correct/incorrect fades
    busy.current = false;
    if (!narrowRef.current) requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const finish = useCallback(
    (ok: boolean, side?: "left" | "right", via?: "random") => {
      if (busy.current) return;
      busy.current = true;
      if (side) setHitSide(side);
      // Win quip lasts through the next question, then fades on this pick
      if (roastRef.current?.win && !roastRef.current.out) {
        setRoast((cur) => (cur?.win ? { ...cur, out: true } : cur));
        later(() => setRoast((cur) => (cur?.out ? null : cur)), 420);
      }
      let party = false;
      if (ok) {
        randomMisses.current = 0;
        if (styleRef.current === "lr" && wrongRun.current >= 5) {
          party = true;
          burstConfetti();
          setRoast({ text: roastFinally(wrongRun.current), win: true });
        } else if (roastRef.current && !roastRef.current.win) {
          setRoast(null);
        }
        wrongRun.current = 0;
        roasting.current = false;
      } else {
        wrongRun.current += 1;
        if (via === "random") {
          randomMisses.current += 1;
          setRoast({ text: pickRandomGag(randomMisses.current), win: false });
        } else if (styleRef.current === "lr") {
          randomMisses.current = 0;
          if (q.decoy) roasting.current = true;
          if (wrongRun.current >= 5) roasting.current = true;
          if (roasting.current) {
            const picked = side === "left" ? q.leftDisplay : q.rightDisplay;
            setRoast({
              text: q.decoy ? roastChaos(picked) : roastWrong(wrongRun.current, seenDecoy.current),
              win: false,
            });
          }
        }
      }
      setStats((s) => ({
        correct: s.correct + (ok ? 1 : 0),
        wrong: s.wrong + (ok ? 0 : 1),
        total: s.total + 1,
      }));
      setGlow(ok ? "ok" : "no");
      later(() => setGlow(null), ok ? 650 : 500);
      setFeedback({
        ok,
        text: ok ? t`Correct! It was ${q.correct}` : t`Nope — it was ${q.correct}`,
      });
      later(() => nextQ(), party ? 2800 : ok ? 1400 : 1100);
    },
    [nextQ, q.correct, q.decoy, q.leftDisplay, q.rightDisplay, later],
  );

  const tryDigit = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 1);
    if (!d || busy.current || q.style !== "input") return;
    finish(d === q.correct);
  };

  const pickSide = useCallback(
    (side: "left" | "right", via?: "random") => {
      if (busy.current || q.style === "input") return;
      finish(side === q.correctSide, side, via);
    },
    [finish, q.correctSide, q.style],
  );

  const rollRandom = useCallback(() => {
    if (!q.correctSide) return;
    pickSide(randomTrainerSide(q.correctSide), "random");
  }, [pickSide, q.correctSide]);

  useSwipe(
    swipeRef,
    () => pickSide("left"),
    () => pickSide("right"),
    q.style === "lr",
  );

  useEffect(() => {
    if (q.style === "input") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pickSide("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        pickSide("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickSide, q.style]);

  const changeStyle = (s: QuizStyle) => {
    busy.current = false;
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    // Pro Mode misses must not count toward 50/50 fanfare
    wrongRun.current = 0;
    randomMisses.current = 0;
    roasting.current = false;
    setRoast(null);
    setStyle(s);
    styleRef.current = s;
    nextQ(s);
  };

  useHotkey({
    key: "P",
    label: t`50/50 / Pro`,
    ignoreTyping: false,
    onPress: () => changeStyle(styleRef.current === "lr" ? "input" : "lr"),
  });
  useHotkey({
    key: "H",
    label: t`Hints`,
    ignoreTyping: false,
    onPress: () => setHintsOn((v) => !v),
  });
  useHotkey({
    key: "A",
    label: t`R(a)ndom`,
    enabled: style === "lr",
    ignoreTyping: false,
    onPress: rollRandom,
  });

  return (
    <div
      className={`mode quiz-mode ${glow === "ok" ? "quiz-ok" : ""} ${glow === "no" ? "quiz-no" : ""}`}
      aria-label={t`Quiz: what digit is at position N`}
    >
      <div className="quiz-score-row" aria-live="polite">
        <span className="quiz-stat">
          <em>
            <Trans>Score</Trans>
          </em>{" "}
          {stats.correct}
          <span className="quiz-stat-muted"> / {stats.total}</span>
        </span>
        <span className="quiz-stat">
          <em>
            <Trans>Wrong</Trans>
          </em>{" "}
          {stats.wrong}
        </span>
      </div>

      <div className="quiz-toolbar">
        <div className="seg">
          <button
            type="button"
            className={style === "lr" ? "active" : ""}
            onClick={() => changeStyle("lr")}
          >
            <Trans>50/50</Trans>
          </button>
          <button
            type="button"
            className={style === "input" ? "active" : ""}
            onClick={() => changeStyle("input")}
          >
            <Trans>Pro Mode</Trans>
          </button>
        </div>
        <button
          type="button"
          className={`toggle-btn ${hintsOn ? "active" : ""}`}
          aria-pressed={hintsOn}
          onClick={() => setHintsOn((v) => !v)}
        >
          <Trans>Hints</Trans>
        </button>
        {style === "lr" ? (
          <button
            type="button"
            className="toggle-btn quiz-random-toolbar"
            data-keep-chrome
            disabled={busy.current}
            onClick={rollRandom}
          >
            <Trans>Random</Trans>
          </button>
        ) : null}
      </div>

      <h2 className="quiz-question">
        <span className="quiz-q-lead">
          <Trans>What&apos;s the</Trans>
        </span>{" "}
        <span className="quiz-ordinal" key={q.index}>
          <span className="quiz-ordinal-num">{ordinal.num}</span>
          <span className="quiz-ordinal-suf">{ordinal.suf}</span>
        </span>{" "}
        <span className="quiz-q-tail">
          <Trans>digit of π?</Trans>
        </span>
      </h2>

      <div className="quiz-hint-slot" aria-live="polite">
        {hintsOn && hint ? <p className="quiz-hint">{hint}</p> : null}
      </div>

      <div className="quiz-play">
        {q.style === "input" ? (
          <>
            {!narrow && (
              <input
                ref={inputRef}
                // biome-ignore lint/a11y/noAutofocus: quiz flow
                autoFocus
                inputMode="numeric"
                maxLength={1}
                value={input}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  setInput(v);
                  if (v) tryDigit(v);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label={t`Your guess`}
                className="quiz-input"
                placeholder={focused || input ? "" : "?"}
              />
            )}
            <div className="quiz-keypad" aria-label={t`Number pad`}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
                <button
                  key={d}
                  type="button"
                  className="quiz-key"
                  disabled={busy.current}
                  onClick={() => tryDigit(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div ref={swipeRef} className="trainer-board quiz-lr quiz-swipe">
            <button
              type="button"
              className={`trainer-choice ${hitSide === "left" ? (glow === "ok" ? "hit-ok" : glow === "no" ? "hit-no" : "") : ""}`}
              onClick={() => pickSide("left")}
              disabled={busy.current}
            >
              <kbd>←</kbd>
              <span className="choice-digit">{q.leftDisplay}</span>
            </button>
            <button
              type="button"
              className="toggle-btn quiz-random-board"
              data-keep-chrome
              disabled={busy.current}
              onClick={rollRandom}
            >
              <Trans>Random</Trans>
            </button>
            <div className="trainer-current">
              <div className="trainer-prompt">
                <Trans>Pick one</Trans>
              </div>
              <p className="quiz-swipe-hint">
                <Trans>Swipe or tap</Trans>
              </p>
            </div>
            <button
              type="button"
              className={`trainer-choice ${hitSide === "right" ? (glow === "ok" ? "hit-ok" : glow === "no" ? "hit-no" : "") : ""}`}
              onClick={() => pickSide("right")}
              disabled={busy.current}
            >
              <kbd>→</kbd>
              <span className="choice-digit">{q.rightDisplay}</span>
            </button>
          </div>
        )}
      </div>

      <div className="quiz-feedback-slot" aria-live="polite">
        {roast && (
          <p
            className={`quiz-roast ${roast.win ? "is-win" : "is-burn"} ${roast.out ? "is-out" : ""}`}
          >
            {roast.text}
          </p>
        )}
        {feedback && (
          <p className={`quiz-feedback ${feedback.ok ? "is-ok" : "is-no"}`}>
            {feedback.ok && <span className="quiz-fanfare">✦ </span>}
            {feedback.text}
            {feedback.ok && <span className="quiz-fanfare"> ✦</span>}
          </p>
        )}
      </div>
    </div>
  );
}
