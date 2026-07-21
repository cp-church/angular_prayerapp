import { capturePostHogEvent } from '../../../lib/posthog';
import type { PracticeSessionResult } from '../../services/memorization.service';
import type { MemorizationPracticeMode, MemorizedItem } from '../../types/memorization';
import { isBibleBooksMemorizationItem } from './bibleBooksMemorization';

function memorizationPracticeEventProperties(
  item: MemorizedItem,
  mode: MemorizationPracticeMode
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    mode,
    item_kind: isBibleBooksMemorizationItem(item) ? 'bibleBooks' : 'verse',
  };
  if (isBibleBooksMemorizationItem(item)) {
    properties['bible_books_scope'] = item.bibleBooksScope;
  }
  return properties;
}

export function trackMemorizationPracticeStarted(
  item: MemorizedItem,
  mode: MemorizationPracticeMode
): void {
  capturePostHogEvent(
    'memorization_practice_started',
    memorizationPracticeEventProperties(item, mode)
  );
}

export function trackMemorizationPracticeCompleted(
  item: MemorizedItem,
  mode: MemorizationPracticeMode,
  result: PracticeSessionResult
): void {
  capturePostHogEvent('memorization_practice_completed', {
    ...memorizationPracticeEventProperties(item, mode),
    wrong_attempts: result.wrongAttempts,
    correct_keystrokes: result.correctKeystrokes,
  });
}
