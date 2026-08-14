// Copyright (c) 2026 TylerR909. All Rights Reserved.
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChromeBottom } from "./components/ChromeBottom";
import { MODES, ModeSelector } from "./components/ModeSelector";
import { PiOclock } from "./components/PiOclock";
import { useChromeVisibility } from "./hooks/useChromeVisibility";
import { useNarrow } from "./hooks/useNarrow";
import { useShake } from "./hooks/useShake";
import { useWakeLock } from "./hooks/useWakeLock";
import { HotkeyProvider, useHotkey } from "./hotkeys/HotkeyContext";
import { activateLocale, type LocaleId, loadStoredLocale, storeLocale } from "./i18n";
import { BaseMode } from "./modes/BaseMode";
import { ChaosMode } from "./modes/ChaosMode";
import { DigitMode } from "./modes/DigitMode";
import { HackerMode } from "./modes/HackerMode";
import { PiMode } from "./modes/PiMode";
import { QuizMode } from "./modes/QuizMode";
import { TapeMode } from "./modes/TapeMode";
import { TrainerMode } from "./modes/TrainerMode";
import type { ModeId } from "./modes/types";
import {
  OptionsHost,
  OptionsProvider,
  useIdleChrome,
  useThemeHotkey,
} from "./options/OptionsContext";
import { beginMode } from "./progress";
import {
  applyTheme,
  cycleThemeId,
  getTheme,
  loadStoredThemeId,
  randomThemeId,
  storeThemeId,
  type ThemeId,
} from "./themes/themes";
import { isFullscreenNow, subscribeFullscreen } from "./utils/fullscreen";
import { shouldHoldWakeLock } from "./utils/wake-lock";

const initialTheme = loadStoredThemeId();
applyTheme(getTheme(initialTheme));

function ModeStage({ mode }: { mode: ModeId }) {
  switch (mode) {
    case "pi":
      return <PiMode />;
    case "digit":
      return <DigitMode />;
    case "trainer":
      return <TrainerMode />;
    case "tape":
      return <TapeMode />;
    case "hacker":
      return <HackerMode />;
    case "quiz":
      return <QuizMode />;
    case "base":
      return <BaseMode />;
    case "chaos":
      return <ChaosMode />;
    default:
      return <PiMode />;
  }
}

export default function App() {
  return (
    <OptionsProvider>
      <HotkeyProvider>
        <AppChrome />
      </HotkeyProvider>
    </OptionsProvider>
  );
}

function AppChrome() {
  const { _, i18n } = useLingui();
  const idleOk = useIdleChrome();
  const themeHotkey = useThemeHotkey();
  const [mode, setMode] = useState<ModeId>("digit");
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme);

  useEffect(() => {
    applyTheme(getTheme(themeId));
    storeThemeId(themeId);
  }, [themeId]);
  const [locale, setLocale] = useState<LocaleId>(() => loadStoredLocale());
  const activeLocale = (i18n.locale as LocaleId) || locale;

  const immersive = useMemo(() => MODES.find((m) => m.id === mode)?.immersive ?? false, [mode]);
  const narrow = useNarrow();
  const [docFs, setDocFs] = useState(() => isFullscreenNow());
  // Phones keep chrome up — idle/focus fade is a desktop “get out of the way” trick.
  const { chromeVisible } = useChromeVisibility(immersive, docFs, !idleOk || narrow);
  useShake(narrow, narrow, () => {
    setThemeId((cur) => randomThemeId(cur));
  });
  // Screen stay-awake only. A PWA cannot run in the background.
  useWakeLock(shouldHoldWakeLock(mode, docFs));
  const [fsExitOn, setFsExitOn] = useState(true);

  useEffect(() => subscribeFullscreen(() => setDocFs(isFullscreenNow())), []);

  useEffect(() => {
    if (!docFs) {
      setFsExitOn(true);
      return;
    }
    setFsExitOn(true);
    // Phones have no mouse to revive Exit — keep it up, below the status bar.
    if (narrow) return;
    let t = window.setTimeout(() => setFsExitOn(false), 2800);
    const onMove = () => {
      setFsExitOn(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setFsExitOn(false), 2800);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", onMove);
    };
  }, [docFs, narrow]);

  const changeLocale = useCallback(async (id: LocaleId) => {
    await activateLocale(id);
    storeLocale(id);
    setLocale(id);
  }, []);

  const changeMode = useCallback((id: ModeId) => {
    beginMode(id);
    setMode(id);
  }, []);

  useHotkey({
    key: "R",
    label: _(msg`Random theme`),
    enabled: themeHotkey && mode !== "hacker",
    onPress: () => setThemeId((cur) => randomThemeId(cur)),
  });
  useHotkey({
    key: "↑",
    label: _(msg`Cycle theme`),
    onPress: () => setThemeId((cur) => cycleThemeId(cur, -1)),
  });
  useHotkey({
    key: "↓",
    label: _(msg`Cycle theme`),
    onPress: () => setThemeId((cur) => cycleThemeId(cur, 1)),
  });

  return (
    <div
      className={`app ${docFs ? "is-fs" : ""}`}
      data-mode={mode}
      data-locale={activeLocale}
      data-chrome={chromeVisible ? "1" : "0"}
      data-fs-ui={docFs && fsExitOn ? "1" : "0"}
      data-narrow={narrow ? "1" : "0"}
    >
      <a className="skip-link" href="#main">
        {_(msg`Skip to content`)}
      </a>
      <PiOclock />

      <header className="chrome-top">
        {!docFs && (
          <>
            <div className="brand" data-visible={chromeVisible ? "1" : "0"}>
              <span className="brand-mark" aria-hidden>
                π
              </span>
              <span className="brand-name">piwtf</span>
            </div>
            <ModeSelector
              mode={mode}
              onChange={changeMode}
              visible={chromeVisible}
              locale={activeLocale}
            />
          </>
        )}
        <OptionsHost
          visible={docFs ? narrow || fsExitOn : chromeVisible}
          exitOnly={docFs}
          fontSize={!narrow}
        />
      </header>

      <main id="main" className="stage">
        <ModeStage key={`${activeLocale}:${mode}`} mode={mode} />
      </main>

      {!docFs && (
        <ChromeBottom
          visible={chromeVisible}
          locale={activeLocale}
          themeId={themeId}
          onLocale={changeLocale}
          onTheme={setThemeId}
        />
      )}
    </div>
  );
}
