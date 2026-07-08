import { describe, it, expect } from 'vitest';
import {
  formatApiBibleJsonPassageContent,
  formatApiBiblePassageContent,
  formatApiBiblePassageText,
  normalizeScriptureCachedText,
  type ApiBibleContentNode,
} from './api-bible-format';

describe('formatApiBibleJsonPassageContent', () => {
  it('formats para nodes with verse markers', () => {
    const root: ApiBibleContentNode[] = [
      {
        name: 'para',
        items: [
          { name: 'verse', attrs: { number: '1' } },
          { type: 'text', text: 'In the beginning' },
          { name: 'verse', attrs: { number: '2' } },
          { type: 'text', text: 'the earth was' },
        ],
      },
    ];
    const result = formatApiBibleJsonPassageContent(root);
    expect(result).toContain('[1] In the beginning');
    expect(result).toContain('[2] the earth was');
  });

  it('skips footnote nodes', () => {
    const root: ApiBibleContentNode[] = [
      {
        name: 'para',
        items: [
          { name: 'verse', attrs: { number: '1' } },
          { type: 'text', text: 'Hello' },
          { name: 'note', items: [{ type: 'text', text: 'footnote' }] },
        ],
      },
    ];
    expect(formatApiBibleJsonPassageContent(root)).toBe('[1] Hello');
  });

  it('joins multiple paragraphs with blank lines', () => {
    const root: ApiBibleContentNode[] = [
      {
        name: 'para',
        items: [{ type: 'text', text: 'Para one' }],
      },
      {
        name: 'para',
        items: [{ type: 'text', text: 'Para two' }],
      },
    ];
    expect(formatApiBibleJsonPassageContent(root)).toBe('Para one\n\nPara two');
  });

  it('handles non-para root nodes', () => {
    const root: ApiBibleContentNode[] = [
      { type: 'text', text: 'Standalone text' },
    ];
    expect(formatApiBibleJsonPassageContent(root)).toBe('Standalone text');
  });
});

describe('formatApiBiblePassageText', () => {
  it('passes through text that already has bracket verses', () => {
    expect(formatApiBiblePassageText('[1] Hello [2] World')).toBe('[1] Hello [2] World');
  });

  it('parses line-numbered plain text', () => {
    const input = '1 In the beginning\n2 And the earth';
    expect(formatApiBiblePassageText(input)).toBe('[1] In the beginning [2] And the earth');
  });

  it('parses verses array JSON', () => {
    const json = JSON.stringify({
      verses: [
        { verse: 1, text: 'First' },
        { number: 2, text: 'Second' },
      ],
    });
    expect(formatApiBiblePassageText(json)).toBe('[1] First [2] Second');
  });

  it('parses API.Bible content tree JSON string', () => {
    const json = JSON.stringify([
      {
        name: 'para',
        items: [
          { name: 'verse', attrs: { number: '3' } },
          { type: 'text', text: 'Verse three' },
        ],
      },
    ]);
    expect(formatApiBiblePassageText(json)).toBe('[3] Verse three');
  });

  it('strips hash-wrapped dashes', () => {
    expect(formatApiBiblePassageText('[1] Hello #—# world')).toBe('[1] Hello — world');
  });

  it('collapses whitespace within paragraphs', () => {
    expect(formatApiBiblePassageText('[1] Hello   world\n\n[2] Next   para')).toBe(
      '[1] Hello world\n\n[2] Next para'
    );
  });

  it('returns empty for empty input', () => {
    expect(formatApiBiblePassageText('')).toBe('');
    expect(formatApiBiblePassageText('   ')).toBe('');
  });

  it('handles non-JSON plain text without line numbers', () => {
    expect(formatApiBiblePassageText('plain passage text')).toBe('plain passage text');
  });

  it('handles invalid JSON gracefully', () => {
    expect(formatApiBiblePassageText('{not valid json')).toBe('{not valid json');
  });
});

describe('formatApiBiblePassageContent', () => {
  it('accepts node array directly', () => {
    const nodes: ApiBibleContentNode[] = [
      {
        name: 'para',
        items: [{ type: 'text', text: 'Direct nodes' }],
      },
    ];
    expect(formatApiBiblePassageContent(nodes)).toBe('Direct nodes');
  });

  it('delegates string input to string formatter', () => {
    expect(formatApiBiblePassageContent('[1] Test')).toBe('[1] Test');
  });
});

describe('normalizeScriptureCachedText', () => {
  it('re-normalizes cached text', () => {
    expect(normalizeScriptureCachedText('[1] Hello   world')).toBe('[1] Hello world');
    expect(normalizeScriptureCachedText('[1] A #–# B')).toBe('[1] A – B');
  });
});
