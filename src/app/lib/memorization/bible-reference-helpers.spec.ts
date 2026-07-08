import { describe, it, expect } from 'vitest';
import {
  referenceBookNameFromApiBook,
  bibleBookNameToSpeechText,
} from './bible-reference-helpers';

describe('referenceBookNameFromApiBook', () => {
  it('returns trimmed book name', () => {
    expect(referenceBookNameFromApiBook('GEN', 'Genesis')).toBe('Genesis');
    expect(referenceBookNameFromApiBook('GEN', '  Genesis  ')).toBe('Genesis');
  });
});

describe('bibleBookNameToSpeechText', () => {
  it('converts numbered books to ordinal speech', () => {
    expect(bibleBookNameToSpeechText('1 John')).toBe('first John');
    expect(bibleBookNameToSpeechText('2 Corinthians')).toBe('second Corinthians');
    expect(bibleBookNameToSpeechText('3 John')).toBe('third John');
  });

  it('returns trimmed name for unnumbered books', () => {
    expect(bibleBookNameToSpeechText('John')).toBe('John');
    expect(bibleBookNameToSpeechText('  Romans  ')).toBe('Romans');
  });

  it('returns original for unsupported ordinals', () => {
    expect(bibleBookNameToSpeechText('4 Maccabees')).toBe('4 Maccabees');
  });
});
