import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMemorizationPracticeStartDedupeForTesting,
  trackMemorizationPracticeCompleted,
  trackMemorizationPracticeSessionStart,
  trackMemorizationPracticeStarted,
} from './memorizationPracticeAnalytics';
import type { MemorizedItem } from '../../types/memorization';

const capturePostHogEventMock = vi.fn();

vi.mock('../../../lib/posthog', () => ({
  capturePostHogEvent: (...args: unknown[]) => capturePostHogEventMock(...args),
}));

const verseItem: MemorizedItem = {
  id: 'v1',
  reference: 'John 3:16',
  text: '',
  translation: 'esv',
  dateAdded: Date.now(),
  lastPracticedAt: null,
  practiceSessions: [],
};

const bibleBooksItem: MemorizedItem = {
  id: 'bb1',
  reference: 'Bible Books (OT)',
  text: 'Genesis Exodus',
  translation: 'esv',
  dateAdded: Date.now(),
  lastPracticedAt: null,
  practiceSessions: [],
  kind: 'bibleBooks',
  bibleBooksScope: 'ot',
};

describe('memorizationPracticeAnalytics', () => {
  beforeEach(() => {
    capturePostHogEventMock.mockClear();
    resetMemorizationPracticeStartDedupeForTesting();
  });

  it('tracks practice started for verse items', () => {
    trackMemorizationPracticeStarted(verseItem, 'word');

    expect(capturePostHogEventMock).toHaveBeenCalledWith('memorization_practice_started', {
      mode: 'word',
      item_kind: 'verse',
    });
  });

  it('tracks practice started for bible books items', () => {
    trackMemorizationPracticeStarted(bibleBooksItem, 'reorder');

    expect(capturePostHogEventMock).toHaveBeenCalledWith('memorization_practice_started', {
      mode: 'reorder',
      item_kind: 'bibleBooks',
      bible_books_scope: 'ot',
    });
  });

  it('tracks practice completed with session metrics', () => {
    trackMemorizationPracticeCompleted(verseItem, 'type', {
      wrongAttempts: 2,
      correctKeystrokes: 40,
      completed: true,
    });

    expect(capturePostHogEventMock).toHaveBeenCalledWith('memorization_practice_completed', {
      mode: 'type',
      item_kind: 'verse',
      wrong_attempts: 2,
      correct_keystrokes: 40,
    });
  });

  it('tracks session start once per session seed', () => {
    trackMemorizationPracticeSessionStart('seed-a', verseItem, 'reorder');
    trackMemorizationPracticeSessionStart('seed-a', verseItem, 'reorder');

    expect(capturePostHogEventMock).toHaveBeenCalledTimes(1);
    expect(capturePostHogEventMock).toHaveBeenCalledWith('memorization_practice_started', {
      mode: 'reorder',
      item_kind: 'verse',
    });
  });

  it('includes resumed on hydrated session starts', () => {
    trackMemorizationPracticeSessionStart('seed-b', verseItem, 'reorder', { resumed: true });

    expect(capturePostHogEventMock).toHaveBeenCalledWith('memorization_practice_started', {
      mode: 'reorder',
      item_kind: 'verse',
      resumed: true,
    });
  });
});
