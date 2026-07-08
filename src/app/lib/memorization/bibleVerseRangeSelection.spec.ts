import { describe, it, expect } from 'vitest';
import {
  EMPTY_VERSE_RANGE_SELECTION,
  nextVerseRangeSelection,
  isVerseInRange,
  verseNumbersInRange,
  formatVerseRangeSelectionLabel,
} from './bibleVerseRangeSelection';

describe('EMPTY_VERSE_RANGE_SELECTION', () => {
  it('starts with null verse range', () => {
    expect(EMPTY_VERSE_RANGE_SELECTION).toEqual({ verseStart: null, verseEnd: null });
  });
});

describe('nextVerseRangeSelection', () => {
  it('selects first verse when empty', () => {
    expect(nextVerseRangeSelection(EMPTY_VERSE_RANGE_SELECTION, 5)).toEqual({
      verseStart: 5,
      verseEnd: null,
    });
  });

  it('extends range on second tap', () => {
    const first = { verseStart: 3, verseEnd: null };
    expect(nextVerseRangeSelection(first, 7)).toEqual({
      verseStart: 3,
      verseEnd: 7,
    });
    expect(nextVerseRangeSelection(first, 1)).toEqual({
      verseStart: 1,
      verseEnd: 3,
    });
  });

  it('ignores re-tap of same verse', () => {
    const first = { verseStart: 3, verseEnd: null };
    expect(nextVerseRangeSelection(first, 3)).toBe(first);
  });

  it('starts new selection when range is complete', () => {
    const range = { verseStart: 1, verseEnd: 5 };
    expect(nextVerseRangeSelection(range, 10)).toEqual({
      verseStart: 10,
      verseEnd: null,
    });
  });
});

describe('isVerseInRange', () => {
  it('returns false when no selection', () => {
    expect(isVerseInRange(1, EMPTY_VERSE_RANGE_SELECTION)).toBe(false);
  });

  it('matches single verse', () => {
    expect(isVerseInRange(3, { verseStart: 3, verseEnd: null })).toBe(true);
    expect(isVerseInRange(4, { verseStart: 3, verseEnd: null })).toBe(false);
  });

  it('matches inclusive range', () => {
    const sel = { verseStart: 3, verseEnd: 7 };
    expect(isVerseInRange(3, sel)).toBe(true);
    expect(isVerseInRange(5, sel)).toBe(true);
    expect(isVerseInRange(7, sel)).toBe(true);
    expect(isVerseInRange(2, sel)).toBe(false);
    expect(isVerseInRange(8, sel)).toBe(false);
  });
});

describe('verseNumbersInRange', () => {
  it('returns empty for no selection', () => {
    expect(verseNumbersInRange(EMPTY_VERSE_RANGE_SELECTION)).toEqual([]);
  });

  it('returns single verse', () => {
    expect(verseNumbersInRange({ verseStart: 3, verseEnd: null })).toEqual([3]);
  });

  it('returns inclusive range', () => {
    expect(verseNumbersInRange({ verseStart: 3, verseEnd: 5 })).toEqual([3, 4, 5]);
    expect(verseNumbersInRange({ verseStart: 5, verseEnd: 3 })).toEqual([3, 4, 5]);
  });
});

describe('formatVerseRangeSelectionLabel', () => {
  it('returns null when no selection', () => {
    expect(formatVerseRangeSelectionLabel(EMPTY_VERSE_RANGE_SELECTION)).toBeNull();
  });

  it('formats single verse', () => {
    expect(formatVerseRangeSelectionLabel({ verseStart: 3, verseEnd: null })).toBe(
      'Verse 3'
    );
  });

  it('formats verse range', () => {
    expect(formatVerseRangeSelectionLabel({ verseStart: 3, verseEnd: 7 })).toBe(
      'Verses 3–7'
    );
  });
});
