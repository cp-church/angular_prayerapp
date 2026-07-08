// Local test helpers — logic duplicated in index.ts (Supabase bundles index.ts only).

const SINGLE_CHAPTER_BOOK_VERSES = new Map<string, number>([
  ['obadiah', 21],
  ['philemon', 25],
  ['2 john', 13],
  ['3 john', 15],
  ['jude', 25],
]);

function parseReference(
  reference: string
): { book: string; chapter: number; verseStart: number | null; verseEnd: number | null } | null {
  const normalized = reference.replace(/–/g, '-').replace(/(\d+)[a-z]+/g, '$1');
  const match = normalized.match(/^(.+?)\s+(\d+)(?::\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) return null;

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verseStart: match[3] ? parseInt(match[3], 10) : null,
    verseEnd: match[4] ? parseInt(match[4], 10) : null,
  };
}

function singleChapterBookVerseCount(book: string): number | null {
  return SINGLE_CHAPTER_BOOK_VERSES.get(book.trim().toLowerCase()) ?? null;
}

export function verseCountFromReference(reference: string): number {
  const parsed = parseReference(reference.trim());
  if (!parsed) return 1;

  if (parsed.verseStart != null && parsed.verseEnd != null) {
    return Math.max(1, parsed.verseEnd - parsed.verseStart + 1);
  }
  if (parsed.verseStart != null) return 1;

  const singleChapterVerses = singleChapterBookVerseCount(parsed.book);
  if (parsed.chapter === 1 && singleChapterVerses != null) {
    return singleChapterVerses;
  }

  return 1;
}

export function verseCountInEsvText(text: string): number {
  const markers = text.match(/\[(\d+)\]/g);
  if (!markers?.length) return 1;
  return new Set(markers.map((marker) => parseInt(marker.slice(1, -1), 10))).size;
}

export function cacheVerseCount(reference: string, passageText: string): number {
  return Math.max(verseCountFromReference(reference), verseCountInEsvText(passageText));
}
