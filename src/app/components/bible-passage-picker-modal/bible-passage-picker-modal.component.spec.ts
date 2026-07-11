import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { BiblePassagePickerModalComponent } from './bible-passage-picker-modal.component';
import { BIBLE_BOOKS_PUBLIC } from '../../lib/memorization/bibleCanonPublic';

describe('BiblePassagePickerModalComponent', () => {
  let component: BiblePassagePickerModalComponent;

  const romans = BIBLE_BOOKS_PUBLIC.find((b) => b.id === 'ROM')!;

  beforeEach(() => {
    localStorage.clear();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    component = new BiblePassagePickerModalComponent();
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.querySelectorAll('.safe-area-viewport').forEach((el) => {
      const html = el as HTMLElement;
      html.style.overflow = '';
      html.style.touchAction = '';
    });
    vi.restoreAllMocks();
  });

  it('selects a verse on first click', () => {
    component.onVerseClick(4);
    expect(component.verseStart).toBe(4);
    expect(component.verseEnd).toBeNull();
    expect(component.inRange(4)).toBe(true);
  });

  it('deselects a verse when clicking the same verse again', () => {
    component.onVerseClick(4);
    component.onVerseClick(4);
    expect(component.verseStart).toBeNull();
    expect(component.verseEnd).toBeNull();
    expect(component.inRange(4)).toBe(false);
  });

  it('builds a range when clicking a second different verse', () => {
    component.onVerseClick(4);
    component.onVerseClick(7);
    expect(component.verseStart).toBe(4);
    expect(component.verseEnd).toBe(7);
    expect(component.inRange(5)).toBe(true);
  });

  it('starts a new selection on third verse click when range already set', () => {
    component.onVerseClick(4);
    component.onVerseClick(7);
    component.onVerseClick(10);
    expect(component.verseStart).toBe(10);
    expect(component.verseEnd).toBeNull();
  });

  it('inRange returns false when verseStart is null', () => {
    expect(component.inRange(1)).toBe(false);
  });

  it('filters books by testament tab', () => {
    component.testament = 'nt';
    expect(component.filteredBooks.every((b) => b.testament === 'nt')).toBe(true);
    component.testament = 'ot';
    expect(component.filteredBooks.every((b) => b.testament === 'ot')).toBe(true);
  });

  it('verseNumbers reflects verseCount', () => {
    component.verseCount = 3;
    expect(component.verseNumbers).toEqual([1, 2, 3]);
    component.verseCount = 0;
    expect(component.verseNumbers).toEqual([]);
  });

  it('canConfirm requires book, chapter, and not busy', () => {
    expect(component.canConfirm).toBe(false);
    component.selectedBookId = 'ROM';
    component.selectedChapterNum = 8;
    expect(component.canConfirm).toBe(true);
    component.busy = true;
    expect(component.canConfirm).toBe(false);
  });

  it('confirm emits built reference', () => {
    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);
    component.selectedBookId = romans.id;
    component.selectedBookName = romans.name;
    component.selectedChapterNum = 8;
    component.verseStart = 28;
    component.verseEnd = 29;
    component.confirm();
    expect(confirmed).toHaveBeenCalledWith('Romans 8:28-29');
  });

  it('confirm does nothing when canConfirm is false', () => {
    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);
    component.confirm();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('setTestament persists tab and resets selection', () => {
    component.selectedBookId = 'gen';
    component.expandedBookId = 'gen';
    component.setTestament('nt');
    expect(component.testament).toBe('nt');
    expect(localStorage.getItem('prayer_app_memorize_add_testament')).toBe('nt');
    expect(component.expandedBookId).toBeNull();
    expect(component.selectedBookId).toBeNull();
  });

  it('readTestament restores nt from localStorage on open', () => {
    localStorage.setItem('prayer_app_memorize_add_testament', 'nt');
    component.ngOnChanges({
      isOpen: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
    });
    expect(component.testament).toBe('nt');
  });

  it('toggleBook collapses when already expanded', () => {
    component.expandedBookId = 'ROM';
    component.toggleBook(romans);
    expect(component.expandedBookId).toBeNull();
  });

  it('onChapterClick sets verse grid count', () => {
    const ch = romans.chapters[0]!;
    component.onChapterClick(romans, ch.id, +ch.number);
    expect(component.selectedBookId).toBe('ROM');
    expect(component.selectedChapterId).toBe(ch.id);
    expect(component.selectedChapterNum).toBe(+ch.number);
    expect(component.verseCount).toBe(ch.verseCount);
    expect(component.verseStart).toBeNull();
  });

  it('onEscape emits close when open', () => {
    const close = vi.fn();
    component.close.subscribe(close);
    component.isOpen = true;
    component.onEscape();
    expect(close).toHaveBeenCalled();
    component.isOpen = false;
    close.mockClear();
    component.onEscape();
    expect(close).not.toHaveBeenCalled();
  });

  it('scrolls expanded book row into view in the book list scroller', () => {
    const scroller = document.createElement('div');
    const row = document.createElement('div');
    row.setAttribute('data-book-id', 'rom');
    scroller.appendChild(row);
    const scrollIntoView = vi.fn();
    row.scrollIntoView = scrollIntoView;

    (component as unknown as { bookListScroller: { nativeElement: HTMLElement } }).bookListScroller = {
      nativeElement: scroller,
    };
    (component as unknown as { scrollElementIntoScroller: (el: HTMLElement) => void }).scrollElementIntoScroller(
      row
    );
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'start' })
    );
  });

  it('scheduleScrollBookRow scrolls matching row after toggleBook', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const scroller = document.createElement('div');
    const row = document.createElement('div');
    row.setAttribute('data-book-id', romans.id);
    row.scrollIntoView = vi.fn();
    scroller.appendChild(row);
    (component as unknown as { bookListScroller: { nativeElement: HTMLElement } }).bookListScroller = {
      nativeElement: scroller,
    };
    component.toggleBook(romans);
    expect(row.scrollIntoView).toHaveBeenCalled();
  });

  it('sorts chapters numerically', () => {
    const book = {
      id: 'gen',
      name: 'Genesis',
      testament: 'ot' as const,
      chapters: [
        { id: 'gen-2', number: '2', verseCount: 25 },
        { id: 'gen-10', number: '10', verseCount: 32 },
        { id: 'gen-1', number: '1', verseCount: 31 },
      ],
    };
    const sorted = component.sortedChapters(book);
    expect(sorted.map((c) => c.number)).toEqual(['1', '2', '10']);
  });

  it('resets chapter selection when expanding a different book', () => {
    component.selectedBookId = 'gen';
    component.selectedChapterId = 'gen-1';
    component.selectedChapterNum = 1;
    component.verseCount = 31;

    component.toggleBook({
      id: 'exo',
      name: 'Exodus',
      testament: 'ot',
      chapters: [{ id: 'exo-1', number: '1', verseCount: 22 }],
    });

    expect(component.expandedBookId).toBe('exo');
    expect(component.selectedChapterId).toBeNull();
    expect(component.verseCount).toBeNull();
  });

  it('locks page scroll while open and restores on close', async () => {
    const viewport = document.createElement('div');
    viewport.className = 'safe-area-viewport';
    viewport.style.overflow = 'auto';
    viewport.style.touchAction = 'auto';
    document.body.appendChild(viewport);

    const { fixture } = await render(BiblePassagePickerModalComponent, {
      componentInputs: { isOpen: true },
      container: viewport,
    });

    expect(viewport.style.overflow).toBe('hidden');
    expect(viewport.style.touchAction).toBe('none');
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    expect(viewport.style.overflow).toBe('auto');
    expect(viewport.style.touchAction).toBe('auto');
    expect(document.body.style.overflow).toBe('');

    viewport.remove();
  });

  it('restores documentElement overflow when no safe-area-viewport (admin shell)', async () => {
    document.querySelectorAll('.safe-area-viewport').forEach((el) => el.remove());
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    const { fixture } = await render(BiblePassagePickerModalComponent, {
      componentInputs: { isOpen: true },
    });

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('blocks touchmove on footer chrome (e.g. Add button) while open', async () => {
    const { fixture } = await render(BiblePassagePickerModalComponent, {
      componentInputs: { isOpen: true, confirmLabel: 'Add' },
    });
    const addButton = screen.getByRole('button', { name: 'Add' });
    const event = new TouchEvent('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: addButton, writable: false });
    const preventSpy = vi.spyOn(event, 'preventDefault');

    fixture.componentInstance.onModalTouchMove(event);

    expect(preventSpy).toHaveBeenCalled();
  });

  it('registers capture-phase touchmove guard while open', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(addSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), {
      passive: false,
      capture: true,
    });

    addSpy.mockRestore();
  });

  it('renders dialog when isOpen', async () => {
    await render(BiblePassagePickerModalComponent, {
      componentInputs: { isOpen: true, confirmLabel: 'Add' },
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Pick Chapter')).toBeTruthy();
  });
});
