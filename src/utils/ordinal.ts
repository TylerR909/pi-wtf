/** 1 → { num: "1", suf: "st" } */
export function formatOrdinal(pos: number, locale = "en-US"): { num: string; suf: string } {
  const s = pos.toLocaleString(locale);
  const mod100 = pos % 100;
  const mod10 = pos % 10;
  let suf = "th";
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suf = "st";
    else if (mod10 === 2) suf = "nd";
    else if (mod10 === 3) suf = "rd";
  }
  return { num: s, suf };
}

export function formatOrdinalWord(pos: number, locale = "en-US"): string {
  const { num, suf } = formatOrdinal(pos, locale);
  return `${num}${suf}`;
}
