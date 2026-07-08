import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddMemorizedBibleBooksModalComponent } from './add-memorized-bible-books-modal.component';
import type { MemorizationService } from '../../services/memorization.service';
import type { ToastService } from '../../services/toast.service';
import {
  bibleBooksAddedSuccessMessage,
  bibleBooksDuplicateErrorMessage,
  type BibleBooksMemorizationScope,
} from '../../lib/memorization/bibleBooksMemorization';

const SCOPES: BibleBooksMemorizationScope[] = ['all', 'ot', 'nt'];

describe('AddMemorizedBibleBooksModalComponent', () => {
  let memorization: { addBibleBooks: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let component: AddMemorizedBibleBooksModalComponent;

  beforeEach(() => {
    memorization = { addBibleBooks: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };
    component = new AddMemorizedBibleBooksModalComponent(
      memorization as unknown as MemorizationService,
      toast as unknown as ToastService
    );
    component.isOpen = true;
  });

  it.each(SCOPES)('handleAdd succeeds and shows scope-specific toast for %s', async (scope) => {
    component.scope = scope;
    memorization.addBibleBooks.mockResolvedValue({ ok: true, item: { id: 'bb' } });
    const added = vi.fn();
    const onClose = vi.fn();
    component.added.subscribe(added);
    component.onClose.subscribe(onClose);

    await component.handleAdd();

    expect(memorization.addBibleBooks).toHaveBeenCalledWith(scope, 'esv');
    expect(toast.success).toHaveBeenCalledWith(bibleBooksAddedSuccessMessage(scope));
    expect(added).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(component.submitting).toBe(false);
  });

  it.each(SCOPES)('shows scope-specific duplicate error for %s', async (scope) => {
    component.scope = scope;
    memorization.addBibleBooks.mockResolvedValue({ ok: false, reason: 'duplicate' });

    await component.handleAdd();

    expect(toast.error).toHaveBeenCalledWith(bibleBooksDuplicateErrorMessage(scope));
  });

  it('shows generic error on other failures', async () => {
    memorization.addBibleBooks.mockResolvedValue({ ok: false, reason: 'db_error' });
    await component.handleAdd();
    expect(toast.error).toHaveBeenCalledWith('Could not save bible books list.');
  });

  it('shows error when addBibleBooks throws', async () => {
    memorization.addBibleBooks.mockRejectedValue(new Error('Network down'));
    await component.handleAdd();
    expect(toast.error).toHaveBeenCalledWith('Network down');
    expect(component.submitting).toBe(false);
  });

  it('exposes scope options and count label helper', () => {
    expect(component.scopeOptions).toHaveLength(3);
    expect(component.bibleBooksCountLabel('nt')).toMatch(/27 books/);
  });
});
