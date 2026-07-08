import { describe, it, expect } from 'vitest';
import { isBibleTranslation, isMemorizationListenTranslation } from './memorization';

describe('isBibleTranslation', () => {
  it('returns true for esv', () => {
    expect(isBibleTranslation('esv')).toBe(true);
  });

  it('returns false for unknown or empty values', () => {
    expect(isBibleTranslation('niv')).toBe(false);
    expect(isBibleTranslation('')).toBe(false);
    expect(isBibleTranslation(null)).toBe(false);
    expect(isBibleTranslation(undefined)).toBe(false);
  });
});

describe('isMemorizationListenTranslation', () => {
  it('returns true for esv', () => {
    expect(isMemorizationListenTranslation('esv')).toBe(true);
  });
});
