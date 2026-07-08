import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddMemorizedVerseModalComponent } from './add-memorized-verse-modal.component';
import type { ScriptureService } from '../../services/scripture.service';
import type { MemorizationService } from '../../services/memorization.service';
import type { ToastService } from '../../services/toast.service';

describe('AddMemorizedVerseModalComponent', () => {
  let scripture: { getPassage: ReturnType<typeof vi.fn> };
  let memorization: { addVerse: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let component: AddMemorizedVerseModalComponent;

  beforeEach(() => {
    scripture = { getPassage: vi.fn() };
    memorization = { addVerse: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };
    component = new AddMemorizedVerseModalComponent(
      scripture as unknown as ScriptureService,
      memorization as unknown as MemorizationService,
      toast as unknown as ToastService
    );
  });

  it('adds verse and emits on success', async () => {
    scripture.getPassage.mockResolvedValue({ reference: 'John 3:16', text: 'For God so loved', translation: 'esv' });
    memorization.addVerse.mockResolvedValue({ ok: true, item: { id: '1' } });
    const added = vi.fn();
    const onClose = vi.fn();
    component.added.subscribe(added);
    component.onClose.subscribe(onClose);

    await component.onPassageConfirmed('John 3:16');

    expect(memorization.addVerse).toHaveBeenCalledWith('John 3:16', 'esv');
    expect(toast.success).toHaveBeenCalledWith('Added to memorization list.');
    expect(added).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(component.adding).toBe(false);
  });

  it('shows duplicate toast when passage already exists', async () => {
    scripture.getPassage.mockResolvedValue({ reference: 'John 3:16', text: 'text', translation: 'esv' });
    memorization.addVerse.mockResolvedValue({ ok: false, reason: 'duplicate' });

    await component.onPassageConfirmed('John 3:16');
    expect(toast.error).toHaveBeenCalledWith('This passage is already in your memorization list.');
  });

  it('shows error when passage has no text', async () => {
    scripture.getPassage.mockResolvedValue({ reference: 'John 3:16', text: '  ', translation: 'esv' });

    await component.onPassageConfirmed('John 3:16');
    expect(toast.error).toHaveBeenCalledWith('No text returned for this passage.');
    expect(memorization.addVerse).not.toHaveBeenCalled();
  });

  it('shows error when scripture fetch fails', async () => {
    scripture.getPassage.mockRejectedValue(new Error('Network down'));

    await component.onPassageConfirmed('John 3:16');
    expect(toast.error).toHaveBeenCalledWith('Network down');
  });

  it('shows generic error for db failure', async () => {
    scripture.getPassage.mockResolvedValue({ reference: 'John 3:16', text: 'text', translation: 'esv' });
    memorization.addVerse.mockResolvedValue({ ok: false, reason: 'db_error' });

    await component.onPassageConfirmed('John 3:16');
    expect(toast.error).toHaveBeenCalledWith('Could not save this passage.');
  });

  it('ignores concurrent confirmation while adding', async () => {
    component.adding = true;
    await component.onPassageConfirmed('John 3:16');
    expect(scripture.getPassage).not.toHaveBeenCalled();
  });
});
