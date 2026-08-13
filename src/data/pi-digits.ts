/**
 * Public π API.
 *
 * 5k digits ship in the bundle (`pi-seed.ts`) for instant paint.
 * `hydratePi()` streams `/pi.txt` (~1e6) in the background and grows the
 * chunk table. Don't `await` it before first render.
 */
export { PI_CHUNK, PI_DIGIT_COUNT, PI_DIGITS, hydratePi, piAt, piLength, piSlice, subscribePi } from "./pi";

/** @deprecated use hydratePi — kept so older imports don't explode */
export { hydratePi as loadPiDigits } from "./pi";
