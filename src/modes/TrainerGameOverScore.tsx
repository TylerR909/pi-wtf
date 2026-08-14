import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { burstConfetti } from "../components/PiOclock";
import { SCORE_TICK_MS, shouldCelebrateScore, shuffleScoreFrames } from "./trainer-score";

export function TrainerGameOverScore({
  score,
  high,
  tainted,
  cheat,
}: {
  score: number;
  high: boolean;
  tainted: boolean;
  cheat: string | null;
}) {
  const [shown, setShown] = useState(0);
  const [settled, setSettled] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => {
    const reduce =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      setSettled(true);
      return;
    }
    const frames = shuffleScoreFrames(score);
    let i = 0;
    setShown(frames[0] ?? 0);
    const id = window.setInterval(() => {
      i += 1;
      const next = frames[i];
      if (next == null) {
        window.clearInterval(id);
        setShown(score);
        setSettled(true);
        return;
      }
      setShown(next);
    }, SCORE_TICK_MS);
    return () => window.clearInterval(id);
  }, [score]);

  useEffect(() => {
    if (!settled || celebrated.current) return;
    if (!shouldCelebrateScore(score, tainted)) return;
    celebrated.current = true;
    burstConfetti();
  }, [settled, score, tainted]);

  return (
    <div className="go-score">
      <span className="go-score-label">
        <Trans>Score</Trans>
      </span>
      <span
        className="go-score-value"
        aria-label={t`Score ${score}`}
        style={{ width: `${Math.max(String(score).length, 1)}ch` }}
      >
        {shown}
      </span>
      <p className={`go-high ${settled && high ? "is-on" : ""}`}>
        <Trans>High score!</Trans>
      </p>
      <p className={`go-taint ${tainted && cheat ? "is-on" : ""}`}>{cheat}</p>
    </div>
  );
}
