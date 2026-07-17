import { describe, it, expect } from 'vitest';
import { PrivacyComponent } from './privacy.component';
import { SCRIPTURE_ATTRIBUTION_NOTICES } from '../../lib/memorization/scripture-attributions';
import { ESV_COPYRIGHT_NOTICE } from '../../lib/memorization/esv-copyright';

describe('PrivacyComponent', () => {
  it('should create', () => {
    const component = new PrivacyComponent();
    expect(component).toBeDefined();
  });

  it('exposes full ESV copyright text for the privacy page section', () => {
    const component = new PrivacyComponent();
    expect(component.esvOrgUrl).toBe('https://www.esv.org');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.esv.text).toContain('ESV® Bible');
    expect(ESV_COPYRIGHT_NOTICE).toContain('500 verses');
  });

  it('exposes API.Bible attribution notices for the privacy page', () => {
    const component = new PrivacyComponent();
    expect(component.apiBibleTranslations).toContain('niv');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.nlt.text).toContain('Tyndale House Publishers');
    expect(SCRIPTURE_ATTRIBUTION_NOTICES.csb.text).toContain('Holman Bible Publishers');
  });
});
