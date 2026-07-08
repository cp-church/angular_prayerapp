import { describe, it, expect, afterEach } from 'vitest';
import { stripHtmlTags } from './stripHtmlTags';

describe('stripHtmlTags', () => {
  afterEach(() => {
    // jsdom provides document; restore after SSR simulation tests
    if (!(globalThis as { document?: Document }).document) {
      (globalThis as { document: Document }).document = document;
    }
  });

  it('returns empty string for nullish or non-string input', () => {
    expect(stripHtmlTags(null as unknown as string)).toBe('');
    expect(stripHtmlTags(undefined as unknown as string)).toBe('');
    expect(stripHtmlTags(42 as unknown as string)).toBe('');
  });

  it('strips HTML tags in the browser', () => {
    expect(stripHtmlTags('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes HTML entities via DOM', () => {
    expect(stripHtmlTags('<span>&amp; &lt;test&gt;</span>')).toBe('& <test>');
  });

  it('falls back to regex stripping when document is undefined (SSR)', () => {
    const saved = globalThis.document;
    // @ts-expect-error simulate SSR
    delete globalThis.document;
    expect(stripHtmlTags('<p>SSR <em>text</em></p>')).toBe('SSR text');
    globalThis.document = saved;
  });
});
