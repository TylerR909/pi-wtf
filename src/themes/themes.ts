export type ThemeId =
  | "midnight"
  | "terminal"
  | "paper"
  | "hotdog"
  | "cotton"
  | "vaporwave"
  | "chillwave"
  | "celestia"
  | "chalkboard"
  | "blueprint"
  | "amber"
  | "raspberry"
  | "noir"
  | "diner"
  | "hazard"
  | "pokeball"
  | "america";

export interface Theme {
  id: ThemeId;
  label: string;
  /** CSS custom properties applied to :root */
  vars: Record<string, string>;
}

export const THEMES: readonly Theme[] = [
  {
    id: "midnight",
    label: "🌙 Midnight",
    vars: {
      "--bg": "#0e0e10",
      "--bg-elevated": "#16161a",
      "--fg": "#e8e8ed",
      "--fg-muted": "#8b8b9a",
      "--fg-faint": "#55556a",
      "--accent": "#e2b714",
      "--accent-dim": "#9a7b0a",
      "--correct": "#6aaa64",
      "--wrong": "#c94c4c",
      "--chrome-bg": "rgba(14, 14, 16, 0.85)",
      "--border": "#2a2a32",
      "--digit": "#e8e8ed",
      "--tape": "#e2b714",
      "--pi-hot": "#ff4d6d",
      "--font-mono": '"JetBrains Mono", "SF Mono", "Fira Code", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, -apple-system, sans-serif',
    },
  },
  {
    id: "terminal",
    label: "💻 Terminal",
    vars: {
      "--bg": "#0a0f0a",
      "--bg-elevated": "#101810",
      "--fg": "#33ff66",
      "--fg-muted": "#1a9940",
      "--fg-faint": "#0f5c26",
      "--accent": "#33ff66",
      "--accent-dim": "#1a9940",
      "--correct": "#66ff99",
      "--wrong": "#ff4444",
      "--chrome-bg": "rgba(10, 15, 10, 0.9)",
      "--border": "#1a3320",
      "--digit": "#33ff66",
      "--tape": "#99ffaa",
      "--pi-hot": "#ffff66",
      "--font-mono": '"IBM Plex Mono", "Courier New", monospace',
      "--font-sans": '"IBM Plex Mono", monospace',
    },
  },
  {
    id: "paper",
    label: "📄 Paper",
    vars: {
      "--bg": "#f4f1ea",
      "--bg-elevated": "#fffdf8",
      "--fg": "#1a1a1a",
      "--fg-muted": "#666660",
      "--fg-faint": "#a8a89e",
      "--accent": "#c45c26",
      "--accent-dim": "#8a3f18",
      "--correct": "#2d6a4f",
      "--wrong": "#9b2226",
      "--chrome-bg": "rgba(244, 241, 234, 0.92)",
      "--border": "#d9d4c8",
      "--digit": "#1a1a1a",
      "--tape": "#c45c26",
      "--pi-hot": "#9b2226",
      "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
      "--font-sans": '"Literata", "Georgia", serif',
    },
  },
  {
    id: "vaporwave",
    label: "🌴 Vaporwave",
    vars: {
      "--bg": "#1a0a2e",
      "--bg-elevated": "#2d1b4e",
      "--fg": "#f0e6ff",
      "--fg-muted": "#c77dff",
      "--fg-faint": "#7b2cbf",
      "--accent": "#ff71ce",
      "--accent-dim": "#01cdfe",
      "--correct": "#05ffa1",
      "--wrong": "#ff4499",
      "--chrome-bg": "rgba(26, 10, 46, 0.9)",
      "--border": "#5a189a",
      "--digit": "#01cdfe",
      "--tape": "#ff71ce",
      "--pi-hot": "#05ffa1",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "chillwave",
    label: "🌅 Chillwave",
    vars: {
      "--bg": "#14242c",
      "--bg-elevated": "#1c313c",
      "--fg": "#f3eadc",
      "--fg-muted": "#8aadb4",
      "--fg-faint": "#4e6d76",
      "--accent": "#f08a7a",
      "--accent-dim": "#c45f56",
      "--correct": "#6ec4b4",
      "--wrong": "#e07080",
      "--chrome-bg": "rgba(20, 36, 44, 0.92)",
      "--border": "#2e4a54",
      "--digit": "#ffe8d2",
      "--tape": "#7ec8d4",
      "--pi-hot": "#e878a0",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "celestia",
    label: "🦄 Princess Celestia",
    vars: {
      "--bg": "#fff6f8",
      "--bg-elevated": "#ffffff",
      "--fg": "#3d2a42",
      "--fg-muted": "#8a6a88",
      "--fg-faint": "#c4a8b8",
      "--accent": "#e8c04a",
      "--accent-dim": "#c9a04a",
      "--correct": "#5ec4a0",
      "--wrong": "#e07090",
      "--chrome-bg": "rgba(255, 246, 248, 0.94)",
      "--border": "#e8d0a8",
      "--digit": "#3d2a42",
      "--tape": "#6ec8c8",
      "--pi-hot": "#e89ad0",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "hotdog",
    label: "🌭 Hotdog Stand",
    vars: {
      "--bg": "#ff0000",
      "--bg-elevated": "#cc0000",
      "--fg": "#ffff00",
      "--fg-muted": "#ffcc00",
      "--fg-faint": "#cc9900",
      "--accent": "#ffff00",
      "--accent-dim": "#cccc00",
      "--correct": "#00ff00",
      "--wrong": "#0000ff",
      "--chrome-bg": "rgba(200, 0, 0, 0.9)",
      "--border": "#ffff00",
      "--digit": "#ffff00",
      "--tape": "#ffffff",
      "--pi-hot": "#00ffff",
      "--font-mono": '"Comic Sans MS", "Chalkboard SE", cursive',
      "--font-sans": '"Comic Sans MS", "Chalkboard SE", cursive',
    },
  },
  {
    id: "cotton",
    label: "🍭 Cotton Candy",
    vars: {
      "--bg": "#1a1028",
      "--bg-elevated": "#241538",
      "--fg": "#f8e8ff",
      "--fg-muted": "#c9a0dc",
      "--fg-faint": "#7a5a90",
      "--accent": "#ff8ec8",
      "--accent-dim": "#cc5a9a",
      "--correct": "#8ef0c8",
      "--wrong": "#ff6b8a",
      "--chrome-bg": "rgba(26, 16, 40, 0.9)",
      "--border": "#3a2550",
      "--digit": "#f8e8ff",
      "--tape": "#ff8ec8",
      "--pi-hot": "#ffe566",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "chalkboard",
    label: "✏️ Chalkboard",
    vars: {
      "--bg": "#24382a",
      "--bg-elevated": "#2d4634",
      "--fg": "#f3edd4",
      "--fg-muted": "#c5d4a8",
      "--fg-faint": "#7a8c6e",
      "--accent": "#ffe566",
      "--accent-dim": "#c4b04a",
      "--correct": "#b8e986",
      "--wrong": "#ff8a80",
      "--chrome-bg": "rgba(36, 56, 42, 0.92)",
      "--border": "#4a6b52",
      "--digit": "#f7f3e4",
      "--tape": "#ffe566",
      "--pi-hot": "#ffb347",
      "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
      "--font-sans": '"Literata", "Georgia", serif',
    },
  },
  {
    id: "blueprint",
    label: "📐 Blueprint",
    vars: {
      "--bg": "#0a1f4d",
      "--bg-elevated": "#122a5c",
      "--fg": "#e8f1ff",
      "--fg-muted": "#8eb4e8",
      "--fg-faint": "#4d6fa8",
      "--accent": "#7ee0ff",
      "--accent-dim": "#3aa8c9",
      "--correct": "#7dffb3",
      "--wrong": "#ff6b8a",
      "--chrome-bg": "rgba(10, 31, 77, 0.92)",
      "--border": "#2a4d8a",
      "--digit": "#f4f8ff",
      "--tape": "#ffd24a",
      "--pi-hot": "#ff6b4a",
      "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
      "--font-sans": '"IBM Plex Mono", monospace',
    },
  },
  {
    id: "amber",
    label: "📺 Amber CRT",
    vars: {
      "--bg": "#140e08",
      "--bg-elevated": "#1e1610",
      "--fg": "#ffb000",
      "--fg-muted": "#c47e00",
      "--fg-faint": "#6b4500",
      "--accent": "#ffb000",
      "--accent-dim": "#c47e00",
      "--correct": "#e8c060",
      "--wrong": "#ff5533",
      "--chrome-bg": "rgba(20, 14, 8, 0.92)",
      "--border": "#3d2a12",
      "--digit": "#ffc833",
      "--tape": "#ff8c00",
      "--pi-hot": "#ff5533",
      "--font-mono": '"IBM Plex Mono", "Courier New", monospace',
      "--font-sans": '"IBM Plex Mono", monospace',
    },
  },
  {
    id: "raspberry",
    label: "🍓 Raspberry",
    vars: {
      "--bg": "#1c0810",
      "--bg-elevated": "#2a0e18",
      "--fg": "#ffe4ec",
      "--fg-muted": "#e07090",
      "--fg-faint": "#7a3048",
      "--accent": "#ff2d6a",
      "--accent-dim": "#c41850",
      "--correct": "#c6f542",
      "--wrong": "#ff6b4a",
      "--chrome-bg": "rgba(28, 8, 16, 0.92)",
      "--border": "#5a1830",
      "--digit": "#ffd0dc",
      "--tape": "#c6f542",
      "--pi-hot": "#ff2d6a",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "noir",
    label: "🕶️ Noir",
    vars: {
      "--bg": "#080808",
      "--bg-elevated": "#141414",
      "--fg": "#f2f0ea",
      "--fg-muted": "#8a8880",
      "--fg-faint": "#4a4844",
      "--accent": "#c41e3a",
      "--accent-dim": "#8a1528",
      "--correct": "#e8e4d8",
      "--wrong": "#c41e3a",
      "--chrome-bg": "rgba(8, 8, 8, 0.92)",
      "--border": "#2a2a2a",
      "--digit": "#f7f5f0",
      "--tape": "#c41e3a",
      "--pi-hot": "#c41e3a",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "diner",
    label: "☕ Diner",
    vars: {
      "--bg": "#1c1014",
      "--bg-elevated": "#2a181e",
      "--fg": "#fff5e8",
      "--fg-muted": "#e8a0b0",
      "--fg-faint": "#7a4a58",
      "--accent": "#ff4d8d",
      "--accent-dim": "#c2185b",
      "--correct": "#7dffc3",
      "--wrong": "#ff7043",
      "--chrome-bg": "rgba(28, 16, 20, 0.92)",
      "--border": "#5a2838",
      "--digit": "#ffe8c8",
      "--tape": "#7dffc3",
      "--pi-hot": "#ffcc33",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "hazard",
    label: "⚠️ Caution Tape",
    vars: {
      "--bg": "#12110c",
      "--bg-elevated": "#1c1a12",
      "--fg": "#ffe566",
      "--fg-muted": "#c4b04a",
      "--fg-faint": "#6b6020",
      "--accent": "#ffe566",
      "--accent-dim": "#c4a000",
      "--correct": "#7dff3a",
      "--wrong": "#ff3333",
      "--chrome-bg": "rgba(18, 17, 12, 0.92)",
      "--border": "#ffe566",
      "--digit": "#fff3a0",
      "--tape": "#ffe566",
      "--pi-hot": "#ff6600",
      "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "pokeball",
    label: "🔴 Pokéball",
    vars: {
      "--bg": "#ee1515",
      "--bg-elevated": "#c40f0f",
      "--fg": "#ffffff",
      "--fg-muted": "#ffd0d0",
      "--fg-faint": "#ff9a9a",
      "--accent": "#ffffff",
      "--accent-dim": "#ffd6d6",
      "--correct": "#ffffff",
      "--wrong": "#1a1a1a",
      "--chrome-bg": "rgba(238, 21, 21, 0.92)",
      "--border": "#1a1a1a",
      "--digit": "#ffffff",
      "--tape": "#ffffff",
      "--pi-hot": "#1a1a1a",
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
  {
    id: "america",
    label: "🦅 America (hell yeah!)",
    vars: {
      "--bg": "#0a1f5c",
      "--bg-elevated": "#122a78",
      "--fg": "#ffffff",
      "--fg-muted": "#b8c8ff",
      "--fg-faint": "#6a7ab8",
      "--accent": "#e0162b",
      "--accent-dim": "#a01020",
      "--correct": "#ffffff",
      "--wrong": "#e0162b",
      "--chrome-bg": "rgba(10, 31, 92, 0.92)",
      "--border": "#ffffff",
      "--digit": "#ffffff",
      "--tape": "#e0162b",
      "--pi-hot": "#ffcc00",
      "--font-mono": '"Impact", "Arial Black", system-ui, sans-serif',
      "--font-sans": '"Impact", "Arial Black", system-ui, sans-serif',
    },
  },
] as const;

export const DEFAULT_THEME: ThemeId = "midnight";
export const THEME_STORAGE_KEY = "pi-wtf-theme";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

const THEME_VAR_KEYS = Object.keys(THEMES[0]!.vars);
/** Celestia mane — let CSS animate these instead of pinning them inline. */
const ANIMATED_VARS = new Set(["--accent", "--tape", "--pi-hot"]);

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const key of THEME_VAR_KEYS) {
    if (theme.id === "celestia" && ANIMATED_VARS.has(key)) {
      root.style.removeProperty(key);
      continue;
    }
    const value = theme.vars[key];
    if (value) root.style.setProperty(key, value);
    else root.style.removeProperty(key);
  }
  root.dataset.theme = theme.id;
}

export function loadStoredThemeId(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem("pi-trainer-theme");
    if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId;
  } catch {
    /* private mode */
  }
  return DEFAULT_THEME;
}

export function storeThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Cycle themes. dir +1 = next (ArrowDown), -1 = prev (ArrowUp). */
export function cycleThemeId(current: ThemeId, dir: 1 | -1): ThemeId {
  const i = THEMES.findIndex((t) => t.id === current);
  const n = THEMES.length;
  const next = ((i < 0 ? 0 : i) + dir + n) % n;
  return THEMES[next]!.id;
}

/** A different theme than `current` (so `r` always does something). */
export function randomThemeId(current: ThemeId, rng = Math.random): ThemeId {
  const others = THEMES.filter((t) => t.id !== current);
  if (others.length === 0) return current;
  return others[Math.floor(rng() * others.length)]!.id;
}
