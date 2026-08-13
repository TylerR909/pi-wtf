type MotionEventCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
};

/** iOS 13+ needs a user-gesture call. Android / desktop just listen. */
export async function ensureMotionPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") return false;
  const request = (DeviceMotionEvent as MotionEventCtor).requestPermission;
  if (typeof request !== "function") return true;
  try {
    const state = await request.call(DeviceMotionEvent);
    return state === "granted";
  } catch {
    return false;
  }
}

export function motionDelta(
  prev: { x: number; y: number; z: number },
  next: { x: number; y: number; z: number },
): number {
  return Math.abs(next.x - prev.x) + Math.abs(next.y - prev.y) + Math.abs(next.z - prev.z);
}
