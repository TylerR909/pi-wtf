import { Trans } from "@lingui/react/macro";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { pickOne, randInt, wrongDigit } from "../utils/random";
import { EMPTY_QUIZ_STATS, loadJson, type QuizStats, saveJson } from "../utils/storage";

type QuizStyle = "input" | "lr" | "chaos";

interface Question {
  /** 0-based index into PI_DIGITS (0 = integer 3) */
  index: number;
  correct: string;
  style: QuizStyle;
  left?: string;
  right?: string;
  correctSide?: "left" | "right";
  /** For chaos: display strings which may be emoji */
  leftDisplay?: string;
  rightDisplay?: string;
}

const USELESS_HINTS = [
  "It's not Z!",
  "Not an emoji. Usually.",
  "Somewhere between 0 and 9 inclusive. Wild.",
  "Definitely a digit. Unless chaos mode.",
  "Hint: look at your keyboard's number row.",
  "It's not 🍕. Or is it?",
  "Archimedes knew this one. Allegedly.",
  "The answer is a character. Probably.",
  "If you guess randomly you have a 10% chance. Do better.",
  "Not 3! (except when it is)",
  "i.e. Not 3!",
  "Have you tried asking π nicely?",
  "Hint expired. Pay $0 to renew.",
  "It's the one you're thinking of. Or the other one.",
  "Consult your local circle.",
];

const EMOJIS = ["π", "🍕", "🦕", "👀", "🫠", "✨", "圆", "∞", "?", "Z", "e", "φ"];

function formatOrdinal(n: number): string {
  // For display: "387,267th digit" — we treat index as the digit position
  // index 0 = 1st digit "3", index 1 = 2nd digit "1", etc.
  const pos = n + 1;
  const s = pos.toLocaleString("en-US");
  const mod100 = pos % 100;
  const mod10 = pos % 10;
  let suf = "th";
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suf = "st";
    else if (mod10 === 2) suf = "nd";
    else if (mod10 === 3) suf = "rd";
  }
  return `${s}${suf}`;
}

function makeQuestion(style: QuizStyle): Question {
  const index = randInt(0, Math.min(PI_DIGIT_COUNT - 1, 9999));
  const correct = PI_DIGITS[index]!;

  if (style === "input") {
    return { index, correct, style };
  }

  // left/right or chaos
  let wrong: string;
  let wrongDisplay: string;
  if (style === "chaos" && Math.random() < 0.35) {
    wrong = wrongDigit(correct);
    wrongDisplay = pickOne(EMOJIS);
  } else {
    wrong = wrongDigit(correct);
    wrongDisplay = wrong;
  }
  const correctSide: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  const left = correctSide === "left" ? correct : wrong;
  const right = correctSide === "right" ? correct : wrong;
  const leftDisplay = correctSide === "left" ? correct : wrongDisplay;
  const rightDisplay = correctSide === "right" ? correct : wrongDisplay;

  return {
    index,
    correct,
    style,
    left,
    right,
    correctSide,
    leftDisplay,
    rightDisplay,
  };
}

export function QuizMode() {
  const [style, setStyle] = useState<QuizStyle>("input");
  const [hintsOn, setHintsOn] = useState(false);
  const [q, setQ] = useState<Question>(() => makeQuestion("input"));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats>(() => loadJson("quiz-stats", EMPTY_QUIZ_STATS));

  const hint = useMemo(() => {
    if (!hintsOn) return null;
    // Sometimes useful, often useless
    if (Math.random() < 0.35 && q.correct !== "3") {
      return "i.e. Not 3!";
    }
    if (q.correct === "3" && Math.random() < 0.5) {
      return "Okay fine, it might actually be 3.";
    }
    return pickOne(USELESS_HINTS);
  }, [q, hintsOn]);

  const record = useCallback((ok: boolean) => {
    setStats((s) => {
      const next = {
        correct: s.correct + (ok ? 1 : 0),
        wrong: s.wrong + (ok ? 0 : 1),
        total: s.total + 1,
      };
      saveJson("quiz-stats", next);
      return next;
    });
  }, []);

  const nextQ = useCallback(
    (s: QuizStyle = style) => {
      setQ(makeQuestion(s));
      setInput("");
      setFeedback(null);
    },
    [style],
  );

  const submitInput = (e: FormEvent) => {
    e.preventDefault();
    const guess = input.trim();
    if (!guess) return;
    const ok = guess === q.correct;
    record(ok);
    setFeedback(ok ? `Correct — ${q.correct}` : `Nope. It was ${q.correct}.`);
    window.setTimeout(() => nextQ(), 900);
  };

  const pickSide = (side: "left" | "right") => {
    const ok = side === q.correctSide;
    record(ok);
    setFeedback(ok ? "Nice." : `It was ${q.correct}.`);
    window.setTimeout(() => nextQ(), 700);
  };

  const changeStyle = (s: QuizStyle) => {
    setStyle(s);
    nextQ(s);
  };

  return (
    <div className="mode quiz-mode" aria-label="Quiz: what digit is at position N">
      <div className="quiz-toolbar">
        <div className="seg">
          <button
            type="button"
            className={style === "input" ? "active" : ""}
            onClick={() => changeStyle("input")}
          >
            <Trans>Type it</Trans>
          </button>
          <button
            type="button"
            className={style === "lr" ? "active" : ""}
            onClick={() => changeStyle("lr")}
          >
            <Trans>L / R</Trans>
          </button>
          <button
            type="button"
            className={style === "chaos" ? "active" : ""}
            onClick={() => changeStyle("chaos")}
          >
            <Trans>Chaos</Trans>
          </button>
        </div>
        <label className="hint-toggle">
          <input type="checkbox" checked={hintsOn} onChange={(e) => setHintsOn(e.target.checked)} />
          <Trans>Hints</Trans>
        </label>
        <span className="digit-meta">
          {stats.correct}/{stats.total}
        </span>
      </div>

      <h2 className="quiz-question">
        <Trans>What&apos;s the {formatOrdinal(q.index)} digit of π?</Trans>
      </h2>

      {hintsOn && hint && <p className="quiz-hint">{hint}</p>}

      {q.style === "input" ? (
        <form className="quiz-form" onSubmit={submitInput}>
          <input
            // biome-ignore lint/a11y/noAutofocus: intentional for quiz flow
            autoFocus
            inputMode="numeric"
            maxLength={2}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2))}
            aria-label="Your guess"
            className="quiz-input"
            placeholder="?"
          />
          <button type="submit" className="btn">
            <Trans>Submit</Trans>
          </button>
        </form>
      ) : (
        <div className="trainer-board quiz-lr">
          <button type="button" className="trainer-choice" onClick={() => pickSide("left")}>
            <kbd>←</kbd>
            <span className="choice-digit">{q.leftDisplay}</span>
          </button>
          <div className="trainer-current">
            <div className="trainer-prompt">
              <Trans>Pick one</Trans>
            </div>
          </div>
          <button type="button" className="trainer-choice" onClick={() => pickSide("right")}>
            <span className="choice-digit">{q.rightDisplay}</span>
            <kbd>→</kbd>
          </button>
        </div>
      )}

      {feedback && (
        <p className="quiz-feedback" aria-live="polite">
          {feedback}
        </p>
      )}

      <p className="mode-hint">
        <Trans>Positions are 1-indexed from the leading 3.</Trans>
      </p>
    </div>
  );
}
