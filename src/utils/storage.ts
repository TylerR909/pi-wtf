const PREFIX = "pi-trainer-";

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export interface TrainerStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  totalAnswered: number;
}

export const EMPTY_TRAINER_STATS: TrainerStats = {
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  totalAnswered: 0,
};

export interface QuizStats {
  correct: number;
  wrong: number;
  total: number;
}

export const EMPTY_QUIZ_STATS: QuizStats = {
  correct: 0,
  wrong: 0,
  total: 0,
};
