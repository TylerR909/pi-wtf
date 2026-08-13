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
      <AppChrome />
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
  const [docFs, setDocFs] = useState(() => Boolean(document.fullscreenElement));
  // Phones keep chrome up — idle/focus fade is a desktop “get out of the way” trick.
  const { chromeVisible } = useChromeVisibility(immersive, docFs, !idleOk || narrow);
  useShake(narrow && mode === "chaos", narrow && docFs && mode === "chaos", () => {
    setThemeId((cur) => randomThemeId(cur));
  });
  const [fsExitOn, setFsExitOn] = useState(true);

  useEffect(() => {
    const sync = () => setDocFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (!docFs) {
      setFsExitOn(true);
      return;
    }
    setFsExitOn(true);
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
  }, [docFs]);

  const changeLocale = useCallback(async (id: LocaleId) => {
    await activateLocale(id);
    storeLocale(id);
    setLocale(id);
  }, []);

  const changeMode = useCallback((id: ModeId) => {
    beginMode(id);
    setMode(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) {
        return;
      }
      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Mash-key modes (Hacker) register themeKey: false — same idea as F.
        if (!themeHotkey || mode === "hacker") return;
        e.preventDefault();
        setThemeId((cur) => randomThemeId(cur));
        return;
      }
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const dir: 1 | -1 = e.key === "ArrowDown" ? 1 : -1;
      setThemeId((cur) => cycleThemeId(cur, dir));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [themeHotkey, mode]);

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
          visible={docFs ? fsExitOn : chromeVisible}
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
