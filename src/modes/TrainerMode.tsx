import { Trans } from "@lingui/react/macro";
import { useCallback, useEffect, useState } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { wrongDigit } from "../utils/random";
import { EMPTY_TRAINER_STATS, loadJson, saveJson, type TrainerStats } from "../utils/storage";

interface Round {
  /** Index of the digit we're asking for (1 = first fractional digit "1") */
  index: number;
  current: string;
  left: string;
  right: string;
  correctSide: "left" | "right";
}

function makeRound(afterIndex: number): Round {
  const next = Math.min(afterIndex + 1, PI_DIGIT_COUNT - 1);
  const correct = PI_DIGITS[next]!;
  const decoy = wrongDigit(correct);
  const correctSide: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  return {
    index: next,
    current: afterIndex === 0 ? "3." : PI_DIGITS[afterIndex]!,
    left: correctSide === "left" ? correct : decoy,
    right: correctSide === "right" ? correct : decoy,
    correctSide,
  };
}

export function TrainerMode() {
  const [stats, setStats] = useState<TrainerStats>(() =>
    loadJson("trainer-stats", EMPTY_TRAINER_STATS),
  );
  const [round, setRound] = useState<Round>(() => makeRound(0));
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);

  const answer = useCallback(
    (side: "left" | "right") => {
      const ok = side === round.correctSide;
      setFlash(ok ? "ok" : "no");
      setStats((s) => {
        const next: TrainerStats = {
          correct: s.correct + (ok ? 1 : 0),
          wrong: s.wrong + (ok ? 0 : 1),
          streak: ok ? s.streak + 1 : 0,
          bestStreak: ok ? Math.max(s.bestStreak, s.streak + 1) : s.bestStreak,
          totalAnswered: s.totalAnswered + 1,
        };
        saveJson("trainer-stats", next);
        return next;
      });
      // Advance on correct; stay / reshuffle on wrong after a beat
      window.setTimeout(() => {
        setFlash(null);
        if (ok) {
          setRound(makeRound(round.index));
        } else {
          setRound(makeRound(round.index - 1 < 0 ? 0 : round.index - 1));
        }
      }, 220);
    },
    [round],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        answer("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        answer("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const reset = () => {
    const empty = { ...EMPTY_TRAINER_STATS };
    setStats(empty);
    saveJson("trainer-stats", empty);
    setRound(makeRound(0));
  };

  return (
    <div
      className={`mode trainer-mode ${flash ? `flash-${flash}` : ""}`}
      aria-label="Trainer: pick the next digit"
    >
      <div className="trainer-score" aria-live="polite">
        <span>
          <Trans>Correct</Trans> {stats.correct}
        </span>
        <span>
          <Trans>Wrong</Trans> {stats.wrong}
        </span>
        <span>
          <Trans>Streak</Trans> {stats.streak}
          {stats.bestStreak > 0 ? ` (best ${stats.bestStreak})` : ""}
        </span>
        <button type="button" className="linkish" onClick={reset}>
          <Trans>Reset</Trans>
        </button>
      </div>

      <div className="trainer-board">
        <button
          type="button"
          className="trainer-choice"
          onClick={() => answer("left")}
          aria-label={`Left candidate ${round.left}`}
        >
          <kbd>←</kbd>
          <span className="choice-digit">{round.left}</span>
        </button>

        <div className="trainer-current">
          <div className="trainer-current-digit">{round.current}</div>
          <div className="trainer-prompt">
            <Trans>Next digit?</Trans>
          </div>
          <div className="digit-meta">#{round.index === 0 ? 0 : round.index}</div>
        </div>

        <button
          type="button"
          className="trainer-choice"
          onClick={() => answer("right")}
          aria-label={`Right candidate ${round.right}`}
        >
          <span className="choice-digit">{round.right}</span>
          <kbd>→</kbd>
        </button>
      </div>

      <p className="mode-hint">
        <Trans>← / → or click</Trans>
      </p>
    </div>
  );
}
