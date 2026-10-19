const NAMES: Record<string, string[]> = {
  fr: ['Do', 'Do#', 'Ré', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'Sib', 'Si'],
  en: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
}

/** Note name without octave in the reader's language: 67 → "Sol" (fr) or "G" (en). */
export function noteName(pitch: number, locale: string): string {
  return (NAMES[locale] ?? NAMES.en!)[((pitch % 12) + 12) % 12]!
}

type Translate = (key: string, values?: Record<string, string | number>) => string

/**
 * Translated row name from its id (the row's key in English: "c", "g", "bb"…) and position on the
 * keyboard: "Rang de Do (intérieur)", "G row (outer)".
 */
export function rowLabel(notes: Translate & { has: (key: string) => boolean }, id: string, index: number, count: number, t: Translate) {
  const key = notes.has(id) ? notes(id) : id.toUpperCase()
  const position =
    count === 2
      ? index === 0
        ? t('rowInner')
        : t('rowOuter')
      : index === 0
        ? t('rowInnermost')
        : index === count - 1
          ? t('rowOuter')
          : t('rowMiddle')
  return t('rowName', { key, position })
}
