import { isWhisperReciteSupported } from '../lib/memorization/isWhisperReciteSupported';
import { scriptureReferenceVerseCount } from '../lib/memorization/parse-scripture-reference';
import type { MemorizationPracticeMode } from '../types/memorization';

/** Practice mode value for Verse Recite (beta). Search `@removal-recite` to find all integration points. */
export const MEMORIZATION_RECITE_PRACTICE_MODE = 'recite' as const satisfies MemorizationPracticeMode;

export const RECITE_MAX_VERSES = 5;

export function isRecitePracticeMode(
  mode: MemorizationPracticeMode | null | undefined
): mode is typeof MEMORIZATION_RECITE_PRACTICE_MODE {
  return mode === MEMORIZATION_RECITE_PRACTICE_MODE;
}

export const RECITE_VERSE_LIMIT_MESSAGE = `Due to transcription limitations, Recite mode only works for passages of up to ${RECITE_MAX_VERSES} verses.`;

export function isReciteSupportedScriptureReference(reference: string): boolean {
  const count = scriptureReferenceVerseCount(reference);
  return count !== null && count <= RECITE_MAX_VERSES;
}

export function computeReciteModeVisible(options: {
  settingsLoaded: boolean;
  enabled: boolean;
  isBibleBooks: boolean;
}): boolean {
  return (
    isWhisperReciteSupported() &&
    options.settingsLoaded &&
    options.enabled
  );
}

export function computeReciteModeAvailable(options: {
  settingsLoaded: boolean;
  enabled: boolean;
  isBibleBooks: boolean;
  reference: string;
}): boolean {
  return (
    computeReciteModeVisible(options) &&
    (options.isBibleBooks || isReciteSupportedScriptureReference(options.reference))
  );
}
