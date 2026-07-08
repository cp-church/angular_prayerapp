import { describe, it, expect } from 'vitest';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  it('should create', () => {
    const component = new PrivacyComponent();
    expect(component).toBeDefined();
  });

  it('exposes full ESV copyright text for the privacy page section', () => {
    const component = new PrivacyComponent();
    expect(component.esvOrgUrl).toBe('https://www.esv.org');
    expect(component.esvNotice).toContain('ESV® Bible');
    expect(component.esvNotice).toContain('500 verses');
  });
});
