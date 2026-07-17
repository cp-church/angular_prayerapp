import { describe, it, expect } from 'vitest';
import {
  BIBLE_TRANSLATION_CODES,
  isBibleTranslation,
  isMemorizationListenTranslation,
} from './memorization';

describe('isBibleTranslation', () => {
  it('returns true for all supported codes', () => {
    for (const code of BIBLE_TRANSLATION_CODES) {
      expect(isBibleTranslation(code)).toBe(true);
    }
  });

  it('returns false for unknown or empty values', () => {
    expect(isBibleTranslation('msg')).toBe(false);
    expect(isBibleTranslation('')).toBe(false);
    expect(isBibleTranslation(null)).toBe(false);
    expect(isBibleTranslation(undefined)).toBe(false);
  });
});

describe('isMemorizationListenTranslation', () => {
  it('returns true only for esv', () => {
    expect(isMemorizationListenTranslation('esv')).toBe(true);
    expect(isMemorizationListenTranslation('niv')).toBe(false);
    expect(isMemorizationListenTranslation('kjv')).toBe(false);
  });
});
