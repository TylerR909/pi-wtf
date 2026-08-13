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
import { FontSizeControl, type FontSizeId, fontSizePx } from "../components/FontSizeControl";
import { FullscreenButton } from "../components/FullscreenButton";
import { useNarrow } from "../hooks/useNarrow";
import { isFullscreenNow, subscribeFullscreen, toggleFullscreen } from "../utils/fullscreen";
import { activeSlot, replaceSlot, slotWantsFullscreen } from "./slots";

export type OptionsWanted = {
  fullscreen?: boolean;
  fontSize?: boolean;
  defaultFontSize?: FontSizeId;
  /** When false, chrome never idles/hides. Default true. */
  idle?: boolean;
  /** When false, F does not toggle fullscreen (mash-key modes). Default true. */
  fullscreenKey?: boolean;
  /** When false, R does not randomize the theme (mash-key modes). Default true. */
  themeKey?: boolean;
};

type Slot = {
  id: string;
  fullscreen: boolean;
  fontSize: boolean;
  idle: boolean;
  themeKey: boolean;
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
  const id = useId();
  const [fontSize, setFontSize] = useState<FontSizeId>(wanted.defaultFontSize ?? "m");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idle = wanted.idle !== false;
  const themeKey = wanted.themeKey !== false;

  useEffect(() => {
    ctx.register({
      id,
      fullscreen: Boolean(wanted.fullscreen),
      fontSize: Boolean(wanted.fontSize),
      idle,
      themeKey,
      fontValue: fontSize,
      setFont: setFontSize,
    });
    return () => ctx.unregister(id);
  }, [ctx, id, wanted.fullscreen, wanted.fontSize, idle, themeKey, fontSize]);

  useEffect(() => {
    if (!wanted.fullscreen) return;
    const sync = () => setIsFullscreen(isFullscreenNow());
    sync();
    const unsub = subscribeFullscreen(sync);
    if (wanted.fullscreenKey === false) return unsub;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT"))
        return;
      e.preventDefault();
      void toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unsub();
      window.removeEventListener("keydown", onKey);
    };
  }, [wanted.fullscreen, wanted.fullscreenKey]);

  return {
    isFullscreen,
    fontSize,
    fontPx: fontSizePx(fontSize),
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
  if (!wantFs && !fontSlot) return <span className="chrome-top-balance" aria-hidden />;

  return (
    <div className={`options-host ${visible ? "is-visible" : "is-hidden"}`}>
      {fontSlot && <FontSizeControl value={fontSlot.fontValue} onChange={fontSlot.setFont} />}
      {wantFs && <FullscreenButton className="header-fs" iconOnly={narrow} />}
    </div>
  );
}
