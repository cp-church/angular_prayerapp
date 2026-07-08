import { describe, it, expect } from 'vitest';
import {
  isBibleBooksMemorizationItem,
  booksForScope,
  bibleBooksPlainText,
  bibleBooksReferenceLabel,
  bibleBooksAddedSuccessMessage,
  bibleBooksDuplicateErrorMessage,
  bibleBooksCountLabel,
  bibleBooksTestamentsForScope,
} from './bibleBooksMemorization';
import type { MemorizedItem } from '../../types/memorization';

const baseItem: MemorizedItem = {
  id: '1',
  reference: 'Bible Books',
  text: 'Genesis Exodus',
  translation: 'esv',
  dateAdded: Date.now(),
  lastPracticedAt: null,
  practiceSessions: [],
};

describe('isBibleBooksMemorizationItem', () => {
  it('returns true for bibleBooks items with scope', () => {
    expect(
      isBibleBooksMemorizationItem({
        ...baseItem,
        kind: 'bibleBooks',
        bibleBooksScope: 'all',
      })
    ).toBe(true);
  });

  it('returns false for verse items or missing scope', () => {
    expect(isBibleBooksMemorizationItem(baseItem)).toBe(false);
    expect(
      isBibleBooksMemorizationItem({ ...baseItem, kind: 'bibleBooks' })
    ).toBe(false);
  });
});

describe('booksForScope', () => {
  it('returns all books for all scope', () => {
    const all = booksForScope('all');
    const ot = booksForScope('ot');
    const nt = booksForScope('nt');
    expect(all.length).toBe(ot.length + nt.length);
    expect(ot.every((b) => b.testament === 'ot')).toBe(true);
    expect(nt.every((b) => b.testament === 'nt')).toBe(true);
  });
});

describe('bibleBooksPlainText', () => {
  it('joins book names with spaces', () => {
    const books = booksForScope('ot');
    const text = bibleBooksPlainText('ot');
    expect(text).toContain('Genesis');
    expect(text).toBe(books.map((b) => b.name).join(' '));
  });
});

describe('bibleBooksReferenceLabel', () => {
  it('returns scope-specific labels', () => {
    expect(bibleBooksReferenceLabel('all')).toBe('Bible Books');
    expect(bibleBooksReferenceLabel('ot')).toBe('Bible Books (OT)');
    expect(bibleBooksReferenceLabel('nt')).toBe('Bible Books (NT)');
  });
});

describe('bible books toast messages', () => {
  it('builds added success messages from reference labels', () => {
    expect(bibleBooksAddedSuccessMessage('all')).toBe(
      'Added Bible Books to your memorization list.'
    );
    expect(bibleBooksAddedSuccessMessage('ot')).toBe(
      'Added Bible Books (OT) to your memorization list.'
    );
    expect(bibleBooksAddedSuccessMessage('nt')).toBe(
      'Added Bible Books (NT) to your memorization list.'
    );
  });

  it('builds duplicate error messages from reference labels', () => {
    expect(bibleBooksDuplicateErrorMessage('all')).toBe(
      'Bible Books is already in your memorization list.'
    );
    expect(bibleBooksDuplicateErrorMessage('ot')).toBe(
      'Bible Books (OT) is already in your memorization list.'
    );
    expect(bibleBooksDuplicateErrorMessage('nt')).toBe(
      'Bible Books (NT) is already in your memorization list.'
    );
  });
});

describe('bibleBooksCountLabel', () => {
  it('pluralizes book count', () => {
    const count = booksForScope('nt').length;
    expect(bibleBooksCountLabel('nt')).toBe(`${count} books`);
    expect(bibleBooksCountLabel('all')).toMatch(/books$/);
  });
});

describe('bibleBooksTestamentsForScope', () => {
  it('returns testament tabs per scope', () => {
    expect(bibleBooksTestamentsForScope('ot')).toEqual(['ot']);
    expect(bibleBooksTestamentsForScope('nt')).toEqual(['nt']);
    expect(bibleBooksTestamentsForScope('all')).toEqual(['ot', 'nt']);
  });
});
