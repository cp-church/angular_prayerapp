import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  RECITE_MAX_VERSES,
  computeReciteModeAvailable,
  computeReciteModeVisible,
  isReciteSupportedScriptureReference,
} from './integration';
import * as whisperSupport from '../lib/memorization/isWhisperReciteSupported';

const baseOptions = {
  settingsLoaded: true,
  enabled: true,
  isBibleBooks: false,
} as const;

describe('isReciteSupportedScriptureReference', () => {
  it('allows single verses and ranges up to the limit', () => {
    expect(isReciteSupportedScriptureReference('John 3:16')).toBe(true);
    expect(isReciteSupportedScriptureReference('John 3:16-18')).toBe(true);
    expect(isReciteSupportedScriptureReference(`John 3:16-${15 + RECITE_MAX_VERSES}`)).toBe(
      true
    );
  });

  it('rejects ranges over the limit and chapter-only refs', () => {
    expect(isReciteSupportedScriptureReference(`John 3:16-${16 + RECITE_MAX_VERSES}`)).toBe(
      false
    );
    expect(isReciteSupportedScriptureReference('Psalm 23')).toBe(false);
  });
});

describe('computeReciteModeVisible', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the browser cannot record for Whisper', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(false);

    expect(computeReciteModeVisible(baseOptions)).toBe(false);
  });

  it('returns true when settings and browser support pass', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(computeReciteModeVisible(baseOptions)).toBe(true);
    expect(
      computeReciteModeVisible({
        ...baseOptions,
        isBibleBooks: true,
      })
    ).toBe(true);
  });
});

describe('computeReciteModeAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the browser cannot record for Whisper', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(false);

    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        reference: 'John 3:16',
      })
    ).toBe(false);
  });

  it('returns true when settings, reference, and browser support all pass', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        reference: 'John 3:16',
      })
    ).toBe(true);
  });

  it('returns true for short multi-verse references within the limit', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        reference: 'John 3:16-18',
      })
    ).toBe(true);
  });

  it('returns false for references over the verse limit while visible remains true', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(computeReciteModeVisible(baseOptions)).toBe(true);
    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        reference: 'John 3:16-22',
      })
    ).toBe(false);
  });

  it('returns true for bible books items without a verse reference', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        isBibleBooks: true,
        reference: 'Bible Books (OT)',
      })
    ).toBe(true);
  });
});
