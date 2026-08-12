import { useMemo, useState } from "react";
import { Footer } from "./components/Footer";
import { MODES, ModeSelector } from "./components/ModeSelector";
import { ThemePicker } from "./components/ThemePicker";
import { useChromeVisibility } from "./hooks/useChromeVisibility";
import { BaseMode } from "./modes/BaseMode";
import { ChaosMode } from "./modes/ChaosMode";
import { DigitMode } from "./modes/DigitMode";
import { HackerMode } from "./modes/HackerMode";
import { PrintMode } from "./modes/PrintMode";
import { QuizMode } from "./modes/QuizMode";
import { ScreensaverMode } from "./modes/ScreensaverMode";
import { TrainerMode } from "./modes/TrainerMode";
import type { ModeId } from "./modes/types";
import { applyTheme, getTheme, loadStoredThemeId, type ThemeId } from "./themes/themes";

// Apply theme ASAP so first paint isn't wrong-colored
const initialTheme = loadStoredThemeId();
applyTheme(getTheme(initialTheme));

function ModeStage({ mode }: { mode: ModeId }) {
  switch (mode) {
    case "print":
      return <PrintMode />;
    case "digit":
      return <DigitMode />;
    case "trainer":
      return <TrainerMode />;
    case "screensaver":
      return <ScreensaverMode />;
    case "hacker":
      return <HackerMode />;
    case "quiz":
      return <QuizMode />;
    case "base":
      return <BaseMode />;
    case "chaos":
      return <ChaosMode />;
    default:
      return <PrintMode />;
  }
}

export default function App() {
  const [mode, setMode] = useState<ModeId>("digit");
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme);

  const immersive = useMemo(() => MODES.find((m) => m.id === mode)?.immersive ?? false, [mode]);
  const { chromeVisible } = useChromeVisibility(immersive);

  return (
    <div className="app" data-mode={mode}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="chrome-top">
        <div className="brand" data-visible={chromeVisible ? "1" : "0"}>
          <span className="brand-mark" aria-hidden>
            π
          </span>
          <span className="brand-name">Pi Trainer</span>
        </div>
        <ModeSelector mode={mode} onChange={setMode} visible={chromeVisible} />
        <ThemePicker themeId={themeId} onChange={setThemeId} visible={chromeVisible} />
      </header>

      <main id="main" className="stage">
        <ModeStage mode={mode} />
      </main>

      <Footer visible={chromeVisible} />
    </div>
  );
}
