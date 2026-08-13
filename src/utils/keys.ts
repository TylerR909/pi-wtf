/** True when the event originated in a field we shouldn't steal keys from. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // Do NOT treat BUTTON as a typing target — mode-selector buttons stay
  // focused after click and would swallow Space / arrows / mash keys.
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Blur so the clicked control doesn't eat the next keypress. */
export function blurActive(): void {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) el.blur();
}
