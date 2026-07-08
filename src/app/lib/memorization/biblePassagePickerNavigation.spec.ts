import { describe, it, expect } from 'vitest';
import {
  pickerAdjacentOpensInChapterView,
  adjacentPickerPassage,
  pickerPassageHasPrevious,
  pickerPassageHasNext,
  adjacentChapterPassage,
} from './biblePassagePickerNavigation';

describe('pickerAdjacentOpensInChapterView', () => {
  it('returns true when initialChapterView flag is set', () => {
    expect(
      pickerAdjacentOpensInChapterView({ reference: 'John 3:16', initialChapterView: true })
    ).toBe(true);
  });

  it('returns true for chapter-only references', () => {
    expect(
      pickerAdjacentOpensInChapterView({ reference: 'Genesis 1', initialChapterView: false })
    ).toBe(true);
  });

  it('returns false for verse references without flag', () => {
    expect(
      pickerAdjacentOpensInChapterView({ reference: 'John 3:16', initialChapterView: false })
    ).toBe(false);
  });
});

describe('adjacentPickerPassage', () => {
  it('navigates to next chapter from chapter-only ref', () => {
    const next = adjacentPickerPassage('Genesis 1', 'next');
    expect(next).toEqual({ reference: 'Genesis 2', initialChapterView: true });
  });

  it('navigates to prev chapter from chapter-only ref', () => {
    const prev = adjacentPickerPassage('Genesis 2', 'prev');
    expect(prev).toEqual({ reference: 'Genesis 1', initialChapterView: true });
  });

  it('navigates to next verse within chapter', () => {
    const next = adjacentPickerPassage('John 3:16', 'next');
    expect(next).toEqual({ reference: 'John 3:17', initialChapterView: false });
  });

  it('navigates to prev verse within chapter', () => {
    const prev = adjacentPickerPassage('John 3:16', 'prev');
    expect(prev).toEqual({ reference: 'John 3:15', initialChapterView: false });
  });

  it('crosses chapter boundary forward', () => {
    const lastVerse = adjacentPickerPassage('John 3:36', 'next');
    expect(lastVerse?.reference).toBe('John 4:1');
    expect(lastVerse?.initialChapterView).toBe(false);
  });

  it('crosses chapter boundary backward', () => {
    const firstVerse = adjacentPickerPassage('John 4:1', 'prev');
    expect(firstVerse?.reference).toBe('John 3:36');
    expect(firstVerse?.initialChapterView).toBe(false);
  });

  it('returns null at book boundaries', () => {
    expect(adjacentPickerPassage('Genesis 1:1', 'prev')).toBeNull();
    expect(adjacentPickerPassage('Revelation 22:21', 'next')).toBeNull();
    expect(adjacentPickerPassage('Genesis 1', 'prev')).toBeNull();
  });

  it('returns null for invalid reference', () => {
    expect(adjacentPickerPassage('Not A Book 1:1', 'next')).toBeNull();
  });

  it('handles verse ranges using anchor verses', () => {
    const next = adjacentPickerPassage('John 3:16-18', 'next');
    expect(next?.reference).toBe('John 3:19');
  });
});

describe('pickerPassageHasPrevious / pickerPassageHasNext', () => {
  it('detects navigability', () => {
    expect(pickerPassageHasPrevious('John 3:16')).toBe(true);
    expect(pickerPassageHasNext('John 3:16')).toBe(true);
    expect(pickerPassageHasPrevious('Genesis 1:1')).toBe(false);
    expect(pickerPassageHasNext('Revelation 22:21')).toBe(false);
  });
});

describe('adjacentChapterPassage', () => {
  it('returns next chapter from verse ref', () => {
    expect(adjacentChapterPassage('Acts 20:28', 'next')).toBe('Acts 21');
  });

  it('returns prev chapter from verse ref', () => {
    expect(adjacentChapterPassage('Acts 21:1', 'prev')).toBe('Acts 20');
  });

  it('returns null at book boundaries', () => {
    expect(adjacentChapterPassage('Genesis 1:1', 'prev')).toBeNull();
    expect(adjacentChapterPassage('Revelation 22', 'next')).toBeNull();
  });

  it('returns null for invalid reference', () => {
    expect(adjacentChapterPassage('invalid', 'next')).toBeNull();
  });
});
