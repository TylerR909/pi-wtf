import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useCallback, useEffect, useRef, useState } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { beginMode, reportProgress } from "../progress";
import { blurActive, isTypingTarget } from "../utils/keys";
import { formatOrdinalWord } from "../utils/ordinal";
import { wrongDigit } from "../utils/random";
import { EMPTY_TRAINER_STATS, loadJson, saveJson, type TrainerStats } from "../utils/storage";

type Difficulty = "hardcore" | "endless";
type ControlMode = "classic" | "invert";

interface Round {
  index: number;
  /** Digits already stacked in the center (display string) */
  stack: string;
  left: string;
  right: string;
  correctSide: "left" | "right";
}

function makeRound(stack: string, afterIndex: number): Round {
  const next = Math.min(afterIndex + 1, PI_DIGIT_COUNT - 1);
  const correct = PI_DIGITS[next]!;
  const decoy = wrongDigit(correct);
  const correctSide: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  return {
    index: next,
    stack,
    left: correctSide === "left" ? correct : decoy,
    right: correctSide === "right" ? correct : decoy,
    correctSide,
  };
}

export function TrainerMode() {
  const [stats, setStats] = useState<TrainerStats>(() =>
    loadJson("trainer-stats", EMPTY_TRAINER_STATS),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    loadJson<Difficulty>("trainer-diff", "endless"),
  );
  const [controls, setControls] = useState<ControlMode>(() =>
    loadJson<ControlMode>("trainer-controls", "classic"),
  );
  const [round, setRound] = useState<Round>(() => makeRound("3.", 0));
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [diedAt, setDiedAt] = useState(0);
  const [slide, setSlide] = useState<"left" | "right" | null>(null);
  const [focused, setFocused] = useState(false);
  const locked = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    beginMode("trainer");
    // Fresh run each visit — keep all-time best only
    setStats((s) => {
      const next = { ...EMPTY_TRAINER_STATS, bestStreak: s.bestStreak };
      saveJson("trainer-stats", next);
      return next;
    });
    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    const wake = () => setFocused(false);
    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("focusin", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("focusin", wake);
    };
  }, []);

  const resetRun = useCallback(() => {
    locked.current = false;
    setGameOver(false);
    setFlash(null);
    setSlide(null);
    for (const el of boardRef.current?.querySelectorAll(".hit-ok, .hit-no") ?? []) {
      el.classList.remove("hit-ok", "hit-no");
    }
    setRound(makeRound("3.", 0));
  }, []);

  const hardReset = useCallback(() => {
    const empty = { ...EMPTY_TRAINER_STATS };
    setStats(empty);
    saveJson("trainer-stats", empty);
    resetRun();
  }, [resetRun]);

  const answer = useCallback(
    (side: "left" | "right") => {
      if (locked.current || gameOver) return;
      locked.current = true;

      const ok = side === round.correctSide;
      // DOM flash — skip waiting on React for the green hit
      const clearHits = () => {
        for (const el of boardRef.current?.querySelectorAll(".hit-ok, .hit-no") ?? []) {
          el.classList.remove("hit-ok", "hit-no");
        }
      };
      const btn = boardRef.current?.querySelector<HTMLElement>(`[data-side="${side}"]`);
      if (btn) {
        clearHits();
        void btn.offsetWidth;
        btn.classList.add(ok ? "hit-ok" : "hit-no");
      }
      setFlash(ok ? "ok" : "no");
      setSlide(side);

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

      if (ok) {
        const picked = side === "left" ? round.left : round.right;
        // Keep a trailing window; CSS pins newest digits to the right edge
        const merged = `${round.stack}${picked}`;
        const newStack = merged.length > 24 ? merged.slice(-24) : merged;
        reportProgress(round.index);
        later(() => {
          clearHits();
          setFlash(null);
          setSlide(null);
          blurActive();
          setRound(makeRound(newStack, round.index));
          locked.current = false;
          if (statsRef.current.streak + 1 >= 3) setFocused(true);
        }, 280);
      } else if (difficulty === "hardcore") {
        setDiedAt(statsRef.current.streak);
        later(() => {
          locked.current = false;
          setGameOver(true);
        }, 320);
      } else {
        later(() => {
          clearHits();
          setFlash(null);
          setSlide(null);
          blurActive();
          setRound(makeRound(round.stack, round.index - 1 < 0 ? 0 : round.index - 1));
          locked.current = false;
        }, 320);
      }
    },
    [round, gameOver, difficulty, later],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        hardReset();
        return;
      }
      if (gameOver && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        resetRun();
        return;
      }
      if (gameOver) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        if (controls === "classic") {
          answer(e.key === "ArrowLeft" ? "left" : "right");
        } else {
          // Invert: → pulls left digit onto stack; ← pulls right digit onto stack
          answer(e.key === "ArrowRight" ? "left" : "right");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, controls, gameOver, hardReset, resetRun]);

  const setDiff = (d: Difficulty) => {
    setDifficulty(d);
    saveJson("trainer-diff", d);
    resetRun();
  };

  const setCtrl = (c: ControlMode) => {
    setControls(c);
    saveJson("trainer-controls", c);
  };

  return (
    <div
      className={`mode trainer-mode ${flash ? `flash-${flash}` : ""} ${gameOver ? "is-over" : ""} ${focused ? "is-focused" : ""}`}
      aria-label={t`Trainer: pick the next digit`}
    >
      <div className="trainer-toolbar trainer-chrome">
        <div className="seg">
          <button
            type="button"
            className={difficulty === "endless" ? "active" : ""}
            onClick={() => setDiff("endless")}
          >
            <Trans>Endless</Trans>
          </button>
          <button
            type="button"
            className={difficulty === "hardcore" ? "active" : ""}
            onClick={() => setDiff("hardcore")}
          >
            <Trans>Hardcore</Trans>
          </button>
        </div>
        <div className="seg">
          <button
            type="button"
            className={controls === "classic" ? "active" : ""}
            onClick={() => setCtrl("classic")}
          >
            <Trans>Classic</Trans>
          </button>
          <button
            type="button"
            className={controls === "invert" ? "active" : ""}
            onClick={() => setCtrl("invert")}
            title={t`→ pulls the left card onto the stack · ← pulls the right card`}
          >
            <Trans>Invert</Trans>
          </button>
        </div>
      </div>

      <div className="trainer-score trainer-chrome" aria-live="polite">
        <span>
          <Trans>Correct</Trans> {stats.correct}
        </span>
        <span>
          <Trans>Wrong</Trans> {stats.wrong}
        </span>
        <span>
          <Trans>Streak</Trans> {stats.streak}
          {stats.bestStreak > 0 ? (
            <>
              {" "}
              · <Trans>best {stats.bestStreak}</Trans>
            </>
          ) : null}
        </span>
        <button type="button" className="linkish" onClick={hardReset}>
          <Trans>Reset</Trans>
        </button>
      </div>

      <div ref={boardRef} className={`trainer-board ${slide ? `slide-${slide}` : ""}`}>
        <button
          type="button"
          key={`L-${round.index}-${round.left}-${round.right}`}
          className="trainer-choice"
          data-side="left"
          disabled={gameOver}
          onClick={() => answer("left")}
          aria-label={t`Left candidate ${round.left}`}
        >
          <kbd>{controls === "invert" ? "→" : "←"}</kbd>
          <span className="choice-digit">{round.left}</span>
        </button>

        <div className="trainer-current">
          <div
            className={`trainer-stack ${round.stack.length > 5 ? "is-long" : ""}`}
            aria-live="polite"
          >
            <span className="trainer-stack-text">{round.stack}</span>
          </div>
          <div className="trainer-prompt">
            <Trans>{formatOrdinalWord(round.index + 1)} digit?</Trans>
          </div>
          {flash === "ok" && (
            <div className="trainer-pop" aria-hidden>
              ✓
            </div>
          )}
        </div>

        <button
          type="button"
          key={`R-${round.index}-${round.left}-${round.right}`}
          className="trainer-choice"
          data-side="right"
          disabled={gameOver}
          onClick={() => answer("right")}
          aria-label={t`Right candidate ${round.right}`}
        >
          <kbd>{controls === "invert" ? "←" : "→"}</kbd>
          <span className="choice-digit">{round.right}</span>
        </button>
      </div>

      {gameOver && (
        <div className="game-over" role="alertdialog" aria-labelledby="go-title">
          <h2 id="go-title">
            <Trans>Game Over</Trans>
          </h2>
          <p>
            <Trans>Streak died at {diedAt === 0 ? "zero" : diedAt}.</Trans>
          </p>
          <button type="button" className="btn" onClick={resetRun}>
            <Trans>Try again</Trans> <kbd>Space</kbd>
          </button>
        </div>
      )}

      <p className="mode-hint trainer-chrome">
        {controls === "classic" ? (
          <Trans>← / → pick a side · Backspace reset</Trans>
        ) : (
          <Trans>Invert: → pulls left in, ← pulls right in · Backspace reset</Trans>
        )}
      </p>
    </div>
  );
}
