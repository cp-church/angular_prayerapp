import { describe, it, expect } from 'vitest';
import {
  maxVerseNumberInChapterText,
  verseCountForChapterReference,
} from './chapterVerseCount';

describe('maxVerseNumberInChapterText', () => {
  it('returns highest bracketed verse number', () => {
    expect(maxVerseNumberInChapterText('[1] In the beginning [2] And the earth')).toBe(2);
  });

  it('returns 0 when no verse markers', () => {
    expect(maxVerseNumberInChapterText('plain text')).toBe(0);
    expect(maxVerseNumberInChapterText('')).toBe(0);
  });
});

describe('verseCountForChapterReference', () => {
  it('returns verse count from static canon', () => {
    expect(verseCountForChapterReference('Genesis 1')).toBe(31);
    expect(verseCountForChapterReference('John 3')).toBe(36);
  });

  it('is case-insensitive for book name', () => {
    expect(verseCountForChapterReference('genesis 1')).toBe(31);
  });

  it('falls back to chapter text when canon lookup fails', () => {
    const text = '[1] Verse one [2] Verse two [3] Verse three';
    expect(verseCountForChapterReference('Unknown Book 1', text)).toBe(3);
  });

  it('returns 0 when no data available', () => {
    expect(verseCountForChapterReference('invalid')).toBe(0);
    expect(verseCountForChapterReference('invalid', 'no markers')).toBe(0);
  });
});
