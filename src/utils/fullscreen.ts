/** iOS / iPadOS — document.requestFullscreen is a no-op or throws. */
export function isAppleTouch(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isFullscreenNow(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement) || document.documentElement.dataset.appFs === "1";
}

const EVT = "pi-fs";

function setAppFs(on: boolean) {
  if (on) document.documentElement.dataset.appFs = "1";
  else delete document.documentElement.dataset.appFs;
  window.dispatchEvent(new Event(EVT));
}

export async function toggleFullscreen(el?: HTMLElement | null): Promise<void> {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (document.documentElement.dataset.appFs === "1") {
    setAppFs(false);
    return;
  }
  if (!isAppleTouch()) {
    const node = el ?? document.documentElement;
    const req = node.requestFullscreen?.bind(node);
    if (req) {
      try {
        await req();
        return;
      } catch {
        /* fall through to CSS fullscreen */
      }
    }
  }
  setAppFs(true);
}

export function subscribeFullscreen(fn: () => void): () => void {
  document.addEventListener("fullscreenchange", fn);
  window.addEventListener(EVT, fn);
  return () => {
    document.removeEventListener("fullscreenchange", fn);
    window.removeEventListener(EVT, fn);
  };
}
