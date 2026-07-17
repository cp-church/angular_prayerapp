import { describe, it, expect } from 'vitest';
import {
  API_BIBLE_ATTRIBUTION_TRANSLATIONS,
  SCRIPTURE_ATTRIBUTION_NOTICES,
} from './scripture-attributions';
import { BIBLE_TRANSLATION_CODES } from '../../types/memorization';

describe('scripture-attributions', () => {
  it('defines a notice for every Bible translation', () => {
    for (const code of BIBLE_TRANSLATION_CODES) {
      expect(SCRIPTURE_ATTRIBUTION_NOTICES[code].text.length).toBeGreaterThan(10);
    }
  });

  it('uses full ESV notice including 500-verse limitation', () => {
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.esv.text).toContain('500 verses');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.esv.text).toContain('ESV® Bible');
  });

  it('uses API.Bible Appendix B NIV wording', () => {
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.niv.text).toContain(
      'Used by Permission of Biblica, Inc.® All rights reserved worldwide'
    );
  });

  it('uses Lockman NASB and LSB permission-to-quote wording', () => {
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.nasb.text).toContain('(NASB®) New American Standard Bible®');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.lsb.text).toContain('(LSB®) Legacy Standard Bible®');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.lsb.links.map((l) => l.href)).toContain(
      'https://www.lsbible.org'
    );
  });

  it('uses API.Bible Appendix B CSB trademark notice', () => {
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.csb.text).toContain(
      'federally registered trademarks of Holman Bible Publishers'
    );
  });

  it('lists API.Bible translations for the privacy page', () => {
    expect(API_BIBLE_ATTRIBUTION_TRANSLATIONS).not.toContain('esv');
    expect(API_BIBLE_ATTRIBUTION_TRANSLATIONS).toHaveLength(6);
  });
});
