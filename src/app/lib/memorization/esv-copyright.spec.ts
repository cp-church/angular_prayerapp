import { describe, it, expect } from 'vitest';
import {
  ESV_COPYRIGHT_NOTICE,
  ESV_COPYRIGHT_PARAGRAPH_1,
  ESV_COPYRIGHT_PARAGRAPH_2,
  ESV_ORG_URL,
} from './esv-copyright';

describe('esv-copyright', () => {
  it('exports standard Crossway paragraphs and esv.org URL', () => {
    expect(ESV_ORG_URL).toBe('https://www.esv.org');
    expect(ESV_COPYRIGHT_PARAGRAPH_1).toContain('ESV® Bible');
    expect(ESV_COPYRIGHT_PARAGRAPH_1).toContain('Crossway');
    expect(ESV_COPYRIGHT_PARAGRAPH_2).toContain('500 verses');
    expect(ESV_COPYRIGHT_NOTICE).toContain(ESV_COPYRIGHT_PARAGRAPH_1);
    expect(ESV_COPYRIGHT_NOTICE).toContain(ESV_COPYRIGHT_PARAGRAPH_2);
  });
});
