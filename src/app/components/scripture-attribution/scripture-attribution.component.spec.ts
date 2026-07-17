import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScriptureAttributionComponent } from './scripture-attribution.component';

describe('ScriptureAttributionComponent', () => {
  let fixture: ComponentFixture<ScriptureAttributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptureAttributionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScriptureAttributionComponent);
    fixture.componentRef.setInput('translation', 'esv');
  });

  it('renders ESV attribution with esv.org link', () => {
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('[data-testid="scripture-attribution"]');
    expect(block).toBeTruthy();
    expect(block?.textContent).toContain('ESV® Bible');
    expect(block?.textContent).toContain('Crossway');
    expect(block?.textContent).toContain('500 verses');

    const link = block?.querySelector('a[href="https://www.esv.org"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders KJV public-domain notice', () => {
    fixture.componentRef.setInput('translation', 'kjv');
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('[data-testid="scripture-attribution"]');
    expect(block?.textContent).toContain('King James Version');
    expect(block?.textContent).toContain('public domain');
  });

  it('renders NASB attribution with lockman.org link', () => {
    fixture.componentRef.setInput('translation', 'nasb');
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('[data-testid="scripture-attribution"]');
    expect(block?.textContent).toContain('(NASB®) New American Standard Bible®');
    expect(block?.querySelector('a[href="https://www.lockman.org"]')).toBeTruthy();
  });

  it('renders NIV attribution with Biblica links', () => {
    fixture.componentRef.setInput('translation', 'niv');
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('[data-testid="scripture-attribution"]');
    expect(block?.textContent).toContain('All rights reserved worldwide');
    expect(block?.textContent).toMatch(/visit\s+biblica\.com/);
    expect(block?.querySelector('a[href="https://www.biblica.com"]')).toBeTruthy();
    expect(block?.querySelector('a[href="https://www.facebook.com/Biblica"]')).toBeTruthy();
  });
});
