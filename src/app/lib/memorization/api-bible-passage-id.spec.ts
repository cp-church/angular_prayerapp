import { describe, it, expect } from 'vitest';
import {
  bookNameToUsfm,
  usfmBookPrefixesForSearchQuery,
  referenceToApiBiblePassageId,
  canonicalScriptureCacheReference,
} from './api-bible-passage-id';

describe('bookNameToUsfm', () => {
  it('maps common book names and aliases', () => {
    expect(bookNameToUsfm('John')).toBe('JHN');
    expect(bookNameToUsfm('Psalm')).toBe('PSA');
    expect(bookNameToUsfm('Psalms')).toBe('PSA');
    expect(bookNameToUsfm('1 Corinthians')).toBe('1CO');
    expect(bookNameToUsfm('Rom')).toBe('ROM');
  });

  it('expands First/Second/Third prefixes', () => {
    expect(bookNameToUsfm('First Samuel')).toBe('1SA');
    expect(bookNameToUsfm('Second John')).toBe('2JN');
    expect(bookNameToUsfm('Third John')).toBe('3JN');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(bookNameToUsfm('  john  ')).toBe('JHN');
  });

  it('returns null for unknown books', () => {
    expect(bookNameToUsfm('Not A Book')).toBeNull();
  });
});

describe('usfmBookPrefixesForSearchQuery', () => {
  it('returns empty for empty query', () => {
    expect(usfmBookPrefixesForSearchQuery('')).toEqual([]);
  });

  it('matches exact alias', () => {
    expect(usfmBookPrefixesForSearchQuery('john')).toContain('JHN');
  });

  it('matches prefix of alias', () => {
    const codes = usfmBookPrefixesForSearchQuery('gen');
    expect(codes).toContain('GEN');
  });

  it('matches word prefix within alias', () => {
    const codes = usfmBookPrefixesForSearchQuery('cor');
    expect(codes).toContain('1CO');
    expect(codes).toContain('2CO');
  });

  it('matches USFM code prefix', () => {
    expect(usfmBookPrefixesForSearchQuery('jhn')).toContain('JHN');
    expect(usfmBookPrefixesForSearchQuery('1co')).toContain('1CO');
  });

  it('compacts spaced letter queries', () => {
    expect(usfmBookPrefixesForSearchQuery('d u t')).toContain('DEU');
  });

  it('ignores single-digit-only queries', () => {
    expect(usfmBookPrefixesForSearchQuery('1')).toEqual([]);
  });

  it('ignores invalid characters', () => {
    expect(usfmBookPrefixesForSearchQuery('john!')).toEqual([]);
  });
});

describe('referenceToApiBiblePassageId', () => {
  it('builds chapter-only passage id', () => {
    expect(referenceToApiBiblePassageId('Psalm 23')).toBe('PSA.23');
  });

  it('builds single verse passage id', () => {
    expect(referenceToApiBiblePassageId('John 3:16')).toBe('JHN.3.16');
  });

  it('builds verse range passage id', () => {
    expect(referenceToApiBiblePassageId('John 3:16-18')).toBe('JHN.3.16-JHN.3.18');
  });

  it('returns null for unparseable or unknown book', () => {
    expect(referenceToApiBiblePassageId('invalid')).toBeNull();
    expect(referenceToApiBiblePassageId('FakeBook 1:1')).toBeNull();
  });
});

describe('canonicalScriptureCacheReference', () => {
  it('returns USFM passage id when parseable', () => {
    expect(canonicalScriptureCacheReference('John 3:16')).toBe('JHN.3.16');
    expect(canonicalScriptureCacheReference('Psalms 23')).toBe('PSA.23');
  });

  it('normalizes en-dash and letter suffixes on fallback', () => {
    expect(canonicalScriptureCacheReference('Unknown 1:2a–3b')).toBe('Unknown 1:2-3');
  });

  it('trims reference on fallback', () => {
    expect(canonicalScriptureCacheReference('  custom ref  ')).toBe('custom ref');
  });
});
