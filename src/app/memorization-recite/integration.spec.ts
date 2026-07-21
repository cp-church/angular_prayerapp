import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeReciteModeAvailable } from './integration';
import * as whisperSupport from '../lib/memorization/isWhisperReciteSupported';

describe('computeReciteModeAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the browser cannot record for Whisper', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(false);

    expect(
      computeReciteModeAvailable({
        settingsLoaded: true,
        enabled: true,
        isBibleBooks: false,
        reference: 'John 3:16',
      })
    ).toBe(false);
  });

  it('returns true when settings, reference, and browser support all pass', () => {
    vi.spyOn(whisperSupport, 'isWhisperReciteSupported').mockReturnValue(true);

    expect(
      computeReciteModeAvailable({
        settingsLoaded: true,
        enabled: true,
        isBibleBooks: false,
        reference: 'John 3:16',
      })
    ).toBe(true);
  });
});
