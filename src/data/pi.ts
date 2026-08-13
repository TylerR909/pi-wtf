import { PI_SEED, PI_SEED_COUNT } from "./pi-seed";

/**
 * Chunked π table.
 *
 * `s[i]` on a JS string of ASCII digits is already O(1). Chunks exist so we
 * can grow the table as `/pi.txt` streams in without reallocating a 1MB+
 * string on every packet (progressive “image getting sharper”).
 *
 *   digit i → chunks[⌊i / CHUNK⌋][i % CHUNK]
 */
export const PI_CHUNK = 4096;

const chunks: string[] = [];
let stored = 0;
const listeners = new Set<(ready: number) => void>();

/** Live count — updated as the stream lands. Prefer `piLength()` in new code. */
export let PI_DIGIT_COUNT = 0;

function notify() {
  PI_DIGIT_COUNT = stored;
  for (const fn of listeners) fn(stored);
}

function pushDigits(digits: string) {
  if (!digits) return;
  let offset = 0;
  const last = chunks[chunks.length - 1];
  if (last && last.length < PI_CHUNK) {
    const need = PI_CHUNK - last.length;
    const take = digits.slice(0, need);
    chunks[chunks.length - 1] = last + take;
    stored += take.length;
    offset = take.length;
  }
  while (offset < digits.length) {
    const piece = digits.slice(offset, offset + PI_CHUNK);
    chunks.push(piece);
    stored += piece.length;
    offset += piece.length;
  }
  PI_DIGIT_COUNT = stored;
}

pushDigits(PI_SEED);

export function piLength(): number {
  return stored;
}

export function piAt(i: number): string {
  if (i < 0 || i >= stored) return "";
  const c = chunks[(i / PI_CHUNK) | 0];
  return c?.charAt(i % PI_CHUNK) ?? "";
}

/** Inclusive-exclusive slice — concatenates only the requested window. */
export function piSlice(start = 0, end = stored): string {
  const a = Math.max(0, start);
  const b = Math.min(stored, end);
  if (a >= b) return "";
  const first = (a / PI_CHUNK) | 0;
  const last = ((b - 1) / PI_CHUNK) | 0;
  if (first === last) {
    const local = a % PI_CHUNK;
    return chunks[first]!.slice(local, local + (b - a));
  }
  const parts: string[] = [chunks[first]!.slice(a % PI_CHUNK)];
  for (let c = first + 1; c < last; c++) parts.push(chunks[c]!);
  parts.push(chunks[last]!.slice(0, ((b - 1) % PI_CHUNK) + 1));
  return parts.join("");
}

export function subscribePi(fn: (ready: number) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Stream `/pi.txt` in the background. Does not block first paint.
 * The 5k seed is skipped so we never duplicate.
 */
export async function hydratePi(): Promise<void> {
  const res = await fetch("/pi.txt");
  if (!res.ok) return;

  const ingest = (raw: string, skip: number): number => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return skip;
    if (skip >= digits.length) return skip - digits.length;
    const extra = digits.slice(skip);
    if (extra) {
      pushDigits(extra);
      notify();
    }
    return 0;
  };

  if (res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let skip: number = PI_SEED_COUNT;
    for (;;) {
      const { done, value } = await reader.read();
      const piece = dec.decode(value, { stream: !done });
      skip = ingest(piece, skip);
      if (done) break;
    }
    return;
  }

  ingest(await res.text(), PI_SEED_COUNT);
}

/**
 * String-like view so existing `PI_DIGITS[i]` / `.slice()` / `.length` work
 * against the chunk table — never a 1.3M source literal.
 */
export const PI_DIGITS = new Proxy(Object.create(null) as Record<string, unknown>, {
  get(_t, prop) {
    if (prop === "length") return stored;
    if (prop === "slice") {
      return (a?: number, b?: number) => piSlice(a ?? 0, b ?? stored);
    }
    if (prop === "charAt") return (i: number) => piAt(Number(i));
    if (prop === "startsWith") {
      return (s: string, pos = 0) => piSlice(pos, pos + s.length) === s;
    }
    if (prop === Symbol.toPrimitive || prop === "toString" || prop === "valueOf") {
      return () => piSlice(0, stored);
    }
    if (typeof prop === "string" && prop !== "" && Number.isFinite(+prop)) {
      return piAt(+prop);
    }
    return undefined;
  },
}) as unknown as string;
