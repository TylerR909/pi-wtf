import { Trans } from "@lingui/react/macro";

export const FONT_SIZES = [
  { id: "s", label: "A", px: 12 },
  { id: "m", label: "A", px: 16 },
  { id: "l", label: "A", px: 22 },
  { id: "xl", label: "A", px: 32 },
] as const;

export type FontSizeId = (typeof FONT_SIZES)[number]["id"];

interface Props {
  value: FontSizeId;
  onChange: (id: FontSizeId) => void;
}

export function FontSizeControl({ value, onChange }: Props) {
  return (
    <div className="font-size-control">
      <span className="sr-only">
        <Trans>Font size</Trans>
      </span>
      {FONT_SIZES.map((s) => (
        <button
          key={s.id}
          type="button"
          className={value === s.id ? "active" : ""}
          style={{ fontSize: `${10 + FONT_SIZES.indexOf(s) * 3}px` }}
          onClick={() => onChange(s.id)}
          aria-pressed={value === s.id}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function fontSizePx(id: FontSizeId): number {
  return FONT_SIZES.find((s) => s.id === id)?.px ?? 16;
}

/** Clamp at the ends — XL then + stays XL. */
export function cycleFontSize(current: FontSizeId, dir: 1 | -1): FontSizeId {
  const i = FONT_SIZES.findIndex((s) => s.id === current);
  const at = i < 0 ? 1 : i;
  const next = Math.min(FONT_SIZES.length - 1, Math.max(0, at + dir));
  return FONT_SIZES[next]!.id;
}
