export type HotkeyEntry = {
  id: string;
  key: string;
  label: string;
};

/** Merge identical labels so ← and → become one row. */
export function collapseRows(entries: readonly HotkeyEntry[]): { key: string; label: string }[] {
  const byLabel = new Map<string, string[]>();
  const order: string[] = [];
  for (const e of entries) {
    const keys = byLabel.get(e.label);
    if (!keys) {
      byLabel.set(e.label, [e.key]);
      order.push(e.label);
    } else if (!keys.includes(e.key)) {
      keys.push(e.key);
    }
  }
  return order.map((label) => ({ key: byLabel.get(label)!.join(" "), label }));
}
