import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScriptureAttributionComponent } from './scripture-attribution.component';

describe('ScriptureAttributionComponent', () => {
  let fixture: ComponentFixture<ScriptureAttributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptureAttributionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScriptureAttributionComponent);
  });

  it('renders full ESV attribution with esv.org link and 500-verse notice', () => {
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const block = root.querySelector('[data-testid="scripture-attribution"]');
    expect(block).toBeTruthy();
    expect(block?.textContent).toContain('ESV® Bible');
    expect(block?.textContent).toContain('Crossway');
    expect(block?.textContent).toContain('500 verses');

    const link = block?.querySelector('a[href="https://www.esv.org"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
