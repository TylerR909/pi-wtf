import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  cycleFontSize,
  FontSizeControl,
  type FontSizeId,
  fontSizePx,
} from "../components/FontSizeControl";
import { FullscreenButton } from "../components/FullscreenButton";
import { ProToggle } from "../components/ProToggle";
import { useNarrow } from "../hooks/useNarrow";
import { useHotkey } from "../hotkeys/HotkeyContext";
import { isFullscreenNow, subscribeFullscreen, toggleFullscreen } from "../utils/fullscreen";
import { loadJson, saveJson } from "../utils/storage";
import { activeSlot, replaceSlot, slotWantsFullscreen } from "./slots";

export type OptionsWanted = {
  fullscreen?: boolean;
  fontSize?: boolean;
  defaultFontSize?: FontSizeId;
  /** When false, chrome never idles/hides. Default true. */
  idle?: boolean;
  /** When false, F does not toggle fullscreen (mash-key modes). Default true. */
  fullscreenKey?: boolean;
  /** When false, +/− do not change font size (mash-key modes). Default true. */
  fontSizeKey?: boolean;
  /** When false, R does not randomize the theme (mash-key modes). Default true. */
  themeKey?: boolean;
  /** Header “Pro” toggle (Pi: hide unread digits). */
  pro?: boolean;
};

type Slot = {
  id: string;
  fullscreen: boolean;
  fontSize: boolean;
  idle: boolean;
  themeKey: boolean;
  pro: boolean;
  proOn: boolean;
  setPro: (on: boolean) => void;
  fontValue: FontSizeId;
  setFont: (id: FontSizeId) => void;
};

type Api = {
  register: (slot: Slot) => void;
  unregister: (id: string) => void;
};

const ApiCtx = createContext<Api | null>(null);
const SlotsCtx = createContext<Slot[]>([]);

export function OptionsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Slot[]>([]);

  const register = useCallback((slot: Slot) => {
    setSlots((prev) => {
      const cur = prev.length === 1 ? prev[0] : undefined;
      if (
        cur &&
        cur.id === slot.id &&
        cur.fullscreen === slot.fullscreen &&
        cur.fontSize === slot.fontSize &&
        cur.idle === slot.idle &&
        cur.themeKey === slot.themeKey &&
        cur.pro === slot.pro &&
        cur.proOn === slot.proOn &&
        cur.fontValue === slot.fontValue
      ) {
        return prev;
      }
      return replaceSlot(prev, slot);
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const api = useMemo(() => ({ register, unregister }), [register, unregister]);

  return (
    <ApiCtx.Provider value={api}>
      <SlotsCtx.Provider value={slots}>{children}</SlotsCtx.Provider>
    </ApiCtx.Provider>
  );
}

/**
 * Register header controls for this mode. Buttons mount in the app header
 * (true top-right), not inside the stage.
 *
 *   const { isFullscreen, fontSize } = useOptions({ fullscreen: true, fontSize: true, idle: false })
 */
export function useOptions(wanted: OptionsWanted) {
  const ctx = useContext(ApiCtx);
  if (!ctx) throw new Error("useOptions requires <OptionsProvider>");
  const { _ } = useLingui();
  const id = useId();
  const [fontSize, setFontSize] = useState<FontSizeId>(wanted.defaultFontSize ?? "m");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proOn, setProOn] = useState(() => (wanted.pro ? loadJson("pi-pro", false) : false));
  const idle = wanted.idle !== false;
  const themeKey = wanted.themeKey !== false;
  const pro = Boolean(wanted.pro);
  const fsHot = Boolean(wanted.fullscreen) && wanted.fullscreenKey !== false;
  const fontHot = Boolean(wanted.fontSize) && wanted.fontSizeKey !== false;

  useHotkey({
    key: "F",
    label: _(msg`Fullscreen`),
    enabled: fsHot,
    onPress: () => {
      void toggleFullscreen();
    },
  });
  useHotkey({
    key: "Esc",
    label: _(msg`Exit fullscreen`),
    enabled: Boolean(wanted.fullscreen),
    onPress: () => {
      // Native FS already exits on Esc. CSS fallback (iOS) needs a hand.
      if (document.documentElement.dataset.appFs === "1") void toggleFullscreen();
    },
  });
  useHotkey({
    key: "+",
    label: _(msg`Bigger type`),
    enabled: fontHot,
    onPress: () => setFontSize((cur) => cycleFontSize(cur, 1)),
  });
  useHotkey({
    key: "-",
    label: _(msg`Smaller type`),
    enabled: fontHot,
    onPress: () => setFontSize((cur) => cycleFontSize(cur, -1)),
  });

  useEffect(() => {
    ctx.register({
      id,
      fullscreen: Boolean(wanted.fullscreen),
      fontSize: Boolean(wanted.fontSize),
      idle,
      themeKey,
      pro,
      proOn,
      setPro: setProOn,
      fontValue: fontSize,
      setFont: setFontSize,
    });
    return () => ctx.unregister(id);
  }, [ctx, id, wanted.fullscreen, wanted.fontSize, idle, themeKey, pro, proOn, fontSize]);

  useEffect(() => {
    if (!pro) return;
    saveJson("pi-pro", proOn);
  }, [pro, proOn]);

  useEffect(() => {
    if (!wanted.fullscreen) return;
    const sync = () => setIsFullscreen(isFullscreenNow());
    sync();
    return subscribeFullscreen(sync);
  }, [wanted.fullscreen]);

  return {
    isFullscreen,
    fontSize,
    fontPx: fontSizePx(fontSize),
    pro: proOn,
    setPro: setProOn,
  };
}

/** False when the active mode asked for `idle: false` (e.g. Pi). */
export function useIdleChrome(): boolean {
  return activeSlot(useContext(SlotsCtx))?.idle ?? true;
}

/** False when the active mode asked for `themeKey: false` (e.g. Hacker). */
export function useThemeHotkey(): boolean {
  return activeSlot(useContext(SlotsCtx))?.themeKey ?? true;
}

export function OptionsHost({
  visible = true,
  exitOnly = false,
  fontSize = true,
  fullscreen = true,
}: {
  visible?: boolean;
  /** Fullscreen: only the Exit control, no font-size / filler. */
  exitOnly?: boolean;
  fontSize?: boolean;
  fullscreen?: boolean;
}) {
  const slots = useContext(SlotsCtx);
  const narrow = useNarrow();
  const wantFs = slotWantsFullscreen(slots, fullscreen);
  const active = activeSlot(slots);
  const fontSlot = fontSize && !exitOnly && active?.fontSize ? active : undefined;
  const wantPro = !exitOnly && Boolean(active?.pro);
  if (!wantFs && !fontSlot && !wantPro) return <span className="chrome-top-balance" aria-hidden />;

  return (
    <div className={`options-host ${visible ? "is-visible" : "is-hidden"}`}>
      {fontSlot && <FontSizeControl value={fontSlot.fontValue} onChange={fontSlot.setFont} />}
      {wantPro && active && <ProToggle on={active.proOn} onChange={active.setPro} />}
      {wantFs && <FullscreenButton className="header-fs" iconOnly={narrow} />}
    </div>
  );
}
