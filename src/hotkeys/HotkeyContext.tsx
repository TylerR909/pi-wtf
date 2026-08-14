import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { isTypingTarget } from "../utils/keys";
import { matchHotkey } from "./match";
import { collapseRows, type HotkeyEntry } from "./rows";

export type { HotkeyEntry };

type Api = {
  register: (entry: HotkeyEntry) => void;
  unregister: (id: string) => void;
};

const ApiCtx = createContext<Api | null>(null);
const ListCtx = createContext<HotkeyEntry[]>([]);

export function HotkeyProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HotkeyEntry[]>([]);
  const [open, setOpen] = useState(false);

  const register = useCallback((entry: HotkeyEntry) => {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === entry.id);
      if (i >= 0) {
        const cur = prev[i]!;
        if (cur.key === entry.key && cur.label === entry.label) return prev;
        const next = prev.slice();
        next[i] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const api = useMemo(() => ({ register, unregister }), [register, unregister]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (
        isTypingTarget(t) &&
        !(t instanceof HTMLElement && t.classList.contains("pi-pro-input"))
      ) {
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (!matchHotkey("?", e)) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <ApiCtx.Provider value={api}>
      <ListCtx.Provider value={entries}>
        {children}
        {open && <HotkeyCard entries={entries} onDismiss={() => setOpen(false)} />}
      </ListCtx.Provider>
    </ApiCtx.Provider>
  );
}

export function useHotkey(opts: {
  key: string;
  label: string;
  /** When false, the key is hidden and onPress does not fire. */
  enabled?: boolean;
  /** When false, fire even if focus is in an input (mode toggles). Default true. */
  ignoreTyping?: boolean;
  onPress?: (e: KeyboardEvent) => void;
}): { isPressed: boolean } {
  const ctx = useContext(ApiCtx);
  if (!ctx) throw new Error("useHotkey requires <HotkeyProvider>");
  const id = useId();
  const enabled = opts.enabled !== false;
  const onPressRef = useRef(opts.onPress);
  onPressRef.current = opts.onPress;
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    ctx.register({ id, key: opts.key, label: opts.label });
    return () => ctx.unregister(id);
  }, [ctx, id, enabled, opts.key, opts.label]);

  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing =
        isTypingTarget(t) && !(t instanceof HTMLElement && t.classList.contains("pi-pro-input"));
      if (opts.ignoreTyping !== false && typing) return;
      if (!matchHotkey(opts.key, e)) return;
      setIsPressed(true);
      const press = onPressRef.current;
      if (!press) return;
      e.preventDefault();
      press(e);
    };
    const up = (e: KeyboardEvent) => {
      if (matchHotkey(opts.key, e)) setIsPressed(false);
    };
    const clear = () => setIsPressed(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [enabled, opts.key, opts.ignoreTyping]);

  return { isPressed };
}

function HotkeyCard({ entries, onDismiss }: { entries: HotkeyEntry[]; onDismiss: () => void }) {
  const { _ } = useLingui();
  const rows = useMemo(() => collapseRows(entries), [entries]);

  useEffect(() => {
    const onPtr = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest(".hotkey-card")) return;
      onDismiss();
    };
    window.addEventListener("pointerdown", onPtr);
    return () => window.removeEventListener("pointerdown", onPtr);
  }, [onDismiss]);

  return (
    <aside className="hotkey-card" role="dialog" aria-label={_(msg`Hotkeys`)}>
      <p className="hotkey-card-title">
        <Trans>Hotkeys</Trans>
      </p>
      <ul>
        {rows.map((row) => (
          <li key={`${row.key}:${row.label}`}>
            <kbd>{row.key}</kbd>
            <span>{row.label}</span>
          </li>
        ))}
        <li>
          <kbd>?</kbd>
          <span>
            <Trans>Hide this</Trans>
          </span>
        </li>
      </ul>
    </aside>
  );
}
