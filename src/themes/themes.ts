export type ThemeId = "midnight" | "terminal" | "paper" | "hotdog" | "cotton";

export interface Theme {
  id: ThemeId;
  label: string;
  /** CSS custom properties applied to :root */
  vars: Record<string, string>;
}

export const THEMES: readonly Theme[] = [
  {
    id: "midnight",
    label: "Midnight",
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
      "--font-mono": '"JetBrains Mono", "SF Mono", "Fira Code", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, -apple-system, sans-serif',
    },
  },
  {
    id: "terminal",
    label: "Terminal",
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
      "--font-mono": '"IBM Plex Mono", "Courier New", monospace',
      "--font-sans": '"IBM Plex Mono", monospace',
    },
  },
  {
    id: "paper",
    label: "Paper",
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
      "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
      "--font-sans": '"Literata", "Georgia", serif',
    },
  },
  {
    id: "hotdog",
    label: "Hotdog Stand",
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
      "--font-mono": '"Comic Sans MS", "Chalkboard SE", cursive',
      "--font-sans": '"Comic Sans MS", "Chalkboard SE", cursive',
    },
  },
  {
    id: "cotton",
    label: "Cotton Candy",
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
      "--font-mono": '"JetBrains Mono", ui-monospace, monospace',
      "--font-sans": '"Inter", system-ui, sans-serif',
    },
  },
] as const;

export const DEFAULT_THEME: ThemeId = "midnight";
export const THEME_STORAGE_KEY = "pi-trainer-theme";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.theme = theme.id;
}

export function loadStoredThemeId(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
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
