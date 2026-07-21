import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeReciteModeAvailable, computeReciteModeVisible } from './integration';
import * as whisperSupport from '../lib/memorization/isWhisperReciteSupported';

const baseOptions = {
  settingsLoaded: true,
  enabled: true,
  isBibleBooks: false,
} as const;

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

  it('returns false for multi-verse references while visible remains true', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(computeReciteModeVisible(baseOptions)).toBe(true);
    expect(
      computeReciteModeAvailable({
        ...baseOptions,
        reference: 'John 3:16-18',
      })
    ).toBe(false);
  });
});
