import { capturePostHogEvent } from '../../../lib/posthog';
import type { PracticeSessionResult } from '../../services/memorization.service';
import type { MemorizationPracticeMode, MemorizedItem } from '../../types/memorization';
import { isBibleBooksMemorizationItem } from './bibleBooksMemorization';

const PRACTICE_SESSION_START_DEDUPE_PREFIX = 'memorization_practice_started:';

/** Clears session-start dedupe keys for unit tests only. */
export function resetMemorizationPracticeStartDedupeForTesting(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(PRACTICE_SESSION_START_DEDUPE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}

function memorizationPracticeEventProperties(
  item: MemorizedItem,
  mode: MemorizationPracticeMode,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    mode,
    item_kind: isBibleBooksMemorizationItem(item) ? 'bibleBooks' : 'verse',
    ...extra,
  };
  if (isBibleBooksMemorizationItem(item)) {
    properties['bible_books_scope'] = item.bibleBooksScope;
  }
  return properties;
}

function practiceSessionStartDedupeKey(sessionSeed: string): string {
  return `${PRACTICE_SESSION_START_DEDUPE_PREFIX}${sessionSeed}`;
}

function hasTrackedPracticeSessionStart(sessionSeed: string): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(practiceSessionStartDedupeKey(sessionSeed)) === '1';
}

function markPracticeSessionStartTracked(sessionSeed: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(practiceSessionStartDedupeKey(sessionSeed), '1');
}

export function trackMemorizationPracticeStarted(
  item: MemorizedItem,
  mode: MemorizationPracticeMode,
  extra?: Record<string, unknown>
): void {
  capturePostHogEvent(
    'memorization_practice_started',
    memorizationPracticeEventProperties(item, mode, extra)
  );
}

/** Emits started once per practice session seed (survives modal reopen; deduped in sessionStorage). */
export function trackMemorizationPracticeSessionStart(
  sessionSeed: string,
  item: MemorizedItem,
  mode: MemorizationPracticeMode,
  options?: { resumed?: boolean }
): void {
  if (!sessionSeed.trim() || hasTrackedPracticeSessionStart(sessionSeed)) {
    return;
  }
  markPracticeSessionStartTracked(sessionSeed);
  trackMemorizationPracticeStarted(
    item,
    mode,
    options?.resumed ? { resumed: true } : undefined
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
