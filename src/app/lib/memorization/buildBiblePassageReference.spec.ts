import { describe, it, expect } from 'vitest';
import { buildBiblePassageReference } from './buildBiblePassageReference';

describe('buildBiblePassageReference', () => {
  it('builds chapter-only reference', () => {
    expect(buildBiblePassageReference('GEN', 'Genesis', 1, null, null)).toBe('Genesis 1');
  });

  it('builds single verse reference', () => {
    expect(buildBiblePassageReference('JHN', 'John', 3, 16, null)).toBe('John 3:16');
    expect(buildBiblePassageReference('JHN', 'John', 3, 16, 16)).toBe('John 3:16');
  });

  it('builds verse range with normalized order', () => {
    expect(buildBiblePassageReference('GEN', 'Genesis', 1, 3, 1)).toBe('Genesis 1:1-3');
  });

  it('trims book name', () => {
    expect(buildBiblePassageReference('GEN', '  Genesis  ', 1, null, null)).toBe('Genesis 1');
  });
});
