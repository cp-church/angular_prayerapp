import { isWhisperReciteSupported } from '../lib/memorization/isWhisperReciteSupported';
import { isSingleVerseScriptureReference } from '../lib/memorization/parse-scripture-reference';
import type { MemorizationPracticeMode } from '../types/memorization';

/** Practice mode value for Verse Recite (beta). Search `@removal-recite` to find all integration points. */
export const MEMORIZATION_RECITE_PRACTICE_MODE = 'recite' as const satisfies MemorizationPracticeMode;

export function isRecitePracticeMode(
  mode: MemorizationPracticeMode | null | undefined
): mode is typeof MEMORIZATION_RECITE_PRACTICE_MODE {
  return mode === MEMORIZATION_RECITE_PRACTICE_MODE;
}

export function computeReciteModeAvailable(options: {
  settingsLoaded: boolean;
  enabled: boolean;
  isBibleBooks: boolean;
  reference: string;
}): boolean {
  return (
    isWhisperReciteSupported() &&
    options.settingsLoaded &&
    options.enabled &&
    !options.isBibleBooks &&
    isSingleVerseScriptureReference(options.reference)
  );
}
