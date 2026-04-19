import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { AdminHelpModalComponent } from './admin-help-modal.component';
import { AdminHelpContentService } from '../../services/admin-help-content.service';
import { AdminHelpDriverTourService } from '../../services/admin-help-driver-tour.service';
import type { AdminHelpSection } from '../../types/admin-help-content';
import { of } from 'rxjs';

describe('AdminHelpModalComponent', () => {
  let mockAdminHelp: {
    getSections: ReturnType<typeof vi.fn>;
    isLoading$: ReturnType<typeof of>;
  };
  let sanitizer: DomSanitizer;
  const cdr = { markForCheck: vi.fn() };

  beforeEach(() => {
    mockAdminHelp = {
      getSections: vi.fn(),
      isLoading$: of(false),
    };
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createSection(overrides: Partial<AdminHelpSection> = {}): AdminHelpSection {
    const now = new Date();
    return {
      id: 'test_section',
      title: 'Test topic',
      description: 'Desc',
      icon: '<svg></svg>',
      content: [{ subtitle: 'A', text: 'Body' }],
      order: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'test',
      ...overrides,
    };
  }

  function createComponent(): AdminHelpModalComponent {
    mockAdminHelp.getSections.mockReturnValue(of([createSection()]));
    const mockTour = { destroy: vi.fn() } as unknown as AdminHelpDriverTourService;
    return new AdminHelpModalComponent(
      mockAdminHelp as unknown as AdminHelpContentService,
      sanitizer,
      cdr as never,
      mockTour
    );
  }

  function filterSections(
    comp: AdminHelpModalComponent,
    sections: AdminHelpSection[],
    query: string
  ): AdminHelpSection[] {
    return (comp as unknown as { filterSections(s: AdminHelpSection[], q: string): AdminHelpSection[] }).filterSections(
      sections,
      query
    );
  }

  it('getTrustedEmbedUrl returns null when no video URL', () => {
    const comp = createComponent();
    expect(comp.getTrustedEmbedUrl(createSection())).toBeNull();
  });

  it('getTrustedEmbedUrl returns trusted URL for valid embed', () => {
    const comp = createComponent();
    const section = createSection({
      videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
    expect(comp.getTrustedEmbedUrl(section)).not.toBeNull();
  });

  it('getTrustedEmbedUrl returns null for non-https URL', () => {
    const comp = createComponent();
    expect(
      comp.getTrustedEmbedUrl(
        createSection({ videoEmbedUrl: 'http://www.youtube-nocookie.com/embed/x' })
      )
    ).toBeNull();
  });

  it('getTrustedEmbedUrl returns null for disallowed host', () => {
    const comp = createComponent();
    expect(
      comp.getTrustedEmbedUrl(
        createSection({ videoEmbedUrl: 'https://evil.com/embed/x' })
      )
    ).toBeNull();
  });

  it('getTrustedEmbedUrl normalizes YouTube watch URL to embed', () => {
    const comp = createComponent();
    const trusted = comp.getTrustedEmbedUrl(
      createSection({
        videoEmbedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })
    );
    expect(trusted).not.toBeNull();
  });

  it('toggleVideo toggles visibility and stops propagation', () => {
    const comp = createComponent();
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    expect(comp.isVideoOpen('x')).toBe(false);
    comp.toggleVideo('x', ev);
    expect(comp.isVideoOpen('x')).toBe(true);
    comp.toggleVideo('x', ev);
    expect(comp.isVideoOpen('x')).toBe(false);
    expect(ev.stopPropagation).toHaveBeenCalled();
  });

  it('ngOnChanges clears state when modal closes', () => {
    const comp = createComponent();
    comp.isOpen = true;
    (comp as unknown as { expandedSection: string | null }).expandedSection = 'a';
    (comp as unknown as { videoOpen: Record<string, boolean> }).videoOpen = { a: true };
    comp.searchQuery = 'q';
    comp.isOpen = false;
    comp.ngOnChanges({
      isOpen: {
        currentValue: false,
        previousValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect((comp as unknown as { expandedSection: string | null }).expandedSection).toBeNull();
    expect((comp as unknown as { videoOpen: Record<string, boolean> }).videoOpen).toEqual({});
    expect(comp.searchQuery).toBe('');
  });

  it('ngOnChanges does not reset when isOpen is not in changes', () => {
    const comp = createComponent();
    comp.searchQuery = 'keep';
    comp.ngOnChanges({});
    expect(comp.searchQuery).toBe('keep');
  });

  it('ngOnChanges does not clear when opening modal', () => {
    const comp = createComponent();
    comp.searchQuery = 'q';
    comp.isOpen = true;
    comp.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(comp.searchQuery).toBe('q');
  });

  it('onStartEmailSubscribersOverviewTour emits and stops propagation', () => {
    const comp = createComponent();
    const emitSpy = vi.fn();
    comp.startEmailSubscribersOverviewTour.subscribe(emitSpy);
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    comp.onStartEmailSubscribersOverviewTour(ev);
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('onStartPrayerPromptsTypesTour emits and stops propagation', () => {
    const comp = createComponent();
    const emitSpy = vi.fn();
    comp.startPrayerPromptsTypesTour.subscribe(emitSpy);
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    comp.onStartPrayerPromptsTypesTour(ev);
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('onClose destroys driver tour and emits', () => {
    const comp = createComponent();
    const tour = (comp as unknown as { adminHelpDriverTour: AdminHelpDriverTourService }).adminHelpDriverTour;
    const destroySpy = vi.spyOn(tour, 'destroy');
    const closeSpy = vi.fn();
    comp.closeModal.subscribe(closeSpy);
    comp.onClose();
    expect(destroySpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onStartEmailSubscribersTour emits', () => {
    const comp = createComponent();
    const spy = vi.fn();
    comp.startEmailSubscribersTour.subscribe(spy);
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    comp.onStartEmailSubscribersTour(ev);
    expect(spy).toHaveBeenCalled();
  });

  it('onStartPrayerEditorTour emits', () => {
    const comp = createComponent();
    const spy = vi.fn();
    comp.startPrayerEditorTour.subscribe(spy);
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    comp.onStartPrayerEditorTour(ev);
    expect(spy).toHaveBeenCalled();
  });

  it('onStartPrayerEditorManageTour emits', () => {
    const comp = createComponent();
    const spy = vi.fn();
    comp.startPrayerEditorManageTour.subscribe(spy);
    const ev = { stopPropagation: vi.fn() } as unknown as Event;
    comp.onStartPrayerEditorManageTour(ev);
    expect(spy).toHaveBeenCalled();
  });

  it('getSafeIcon returns trusted HTML', () => {
    const comp = createComponent();
    const html = comp.getSafeIcon('<svg class="x"></svg>');
    expect(html).toBeDefined();
  });

  describe('filterSections', () => {
    it('returns only active sections when query is empty', () => {
      const comp = createComponent();
      const sections = [
        createSection({ id: 'a', isActive: true }),
        createSection({ id: 'b', isActive: false, title: 'Hidden' }),
      ];
      expect(filterSections(comp, sections, '').map(s => s.id)).toEqual(['a']);
    });

    it('matches title', () => {
      const comp = createComponent();
      const sections = [createSection({ id: 'x', title: 'UniqueTitle', isActive: true })];
      expect(filterSections(comp, sections, 'uniquetitle')).toHaveLength(1);
    });

    it('matches description', () => {
      const comp = createComponent();
      const sections = [createSection({ description: 'FindMeDesc', isActive: true })];
      expect(filterSections(comp, sections, 'findme')).toHaveLength(1);
    });

    it('matches content subtitle and text', () => {
      const comp = createComponent();
      const sections = [
        createSection({
          content: [{ subtitle: 'SubMatch', text: 'x' }],
          isActive: true,
        }),
      ];
      expect(filterSections(comp, sections, 'submatch')).toHaveLength(1);
      expect(filterSections(comp, sections, 'x')).toHaveLength(1);
    });

    it('matches examples when present', () => {
      const comp = createComponent();
      const sections = [
        createSection({
          content: [{ subtitle: 'S', text: 'T', examples: ['ExamplePhrase'] }],
          isActive: true,
        }),
      ];
      expect(filterSections(comp, sections, 'examplephrase')).toHaveLength(1);
    });

    it('excludes inactive sections even when query matches', () => {
      const comp = createComponent();
      const sections = [createSection({ title: 'Visible', isActive: false })];
      expect(filterSections(comp, sections, 'visible')).toHaveLength(0);
    });
  });

  describe('onSearchChange and filteredSections$', () => {
    it('filters list when search query updates', async () => {
      mockAdminHelp.getSections.mockReturnValue(
        of([
          createSection({ id: 'one', title: 'Apple', isActive: true }),
          createSection({ id: 'two', title: 'Banana', isActive: true }),
        ])
      );
      const mockTour = { destroy: vi.fn() } as unknown as AdminHelpDriverTourService;
      const comp = new AdminHelpModalComponent(
        mockAdminHelp as unknown as AdminHelpContentService,
        sanitizer,
        cdr as never,
        mockTour
      );
      comp.ngOnInit();
      const emissions: AdminHelpSection[][] = [];
      const sub = comp.filteredSections$.subscribe(sections => emissions.push(sections));
      await vi.waitFor(() => emissions.length >= 1);
      expect(emissions[0]).toHaveLength(2);
      comp.searchQuery = 'banana';
      comp.onSearchChange();
      await vi.waitFor(() => emissions.length >= 2);
      expect(emissions[emissions.length - 1].map(s => s.id)).toEqual(['two']);
      sub.unsubscribe();
    });
  });

  describe('toggleSection and isSectionExpanded', () => {
    it('toggles expanded section id', () => {
      const comp = createComponent();
      expect(comp.isSectionExpanded('test_section')).toBe(false);
      comp.toggleSection('test_section');
      expect(comp.isSectionExpanded('test_section')).toBe(true);
      comp.toggleSection('test_section');
      expect(comp.isSectionExpanded('test_section')).toBe(false);
    });

    it('scrolls content area when expanding', () => {
      vi.useFakeTimers();
      const comp = createComponent();
      comp.ngOnInit();
      const nativeEl = {
        scrollTop: 5,
        getBoundingClientRect: () => ({ top: 20 }),
      };
      (comp as unknown as { contentArea: { nativeElement: typeof nativeEl } }).contentArea = {
        nativeElement: nativeEl,
      };
      vi.spyOn(document, 'querySelector').mockReturnValue({
        getBoundingClientRect: () => ({ top: 100 }),
      } as unknown as HTMLElement);

      comp.toggleSection('test_section');
      vi.runAllTimers();

      expect(document.querySelector).toHaveBeenCalled();
      expect(nativeEl.scrollTop).toBe(85);
      vi.useRealTimers();
    });
  });
});
