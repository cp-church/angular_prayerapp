import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MEMORIZE_LISTEN_REPEAT_GAP_MS,
  MEMORIZE_LISTEN_SPEED_STORAGE_KEY,
  MEMORIZE_LISTEN_SPEEDS,
  formatMemorizeListenSpeedLabel,
  normalizeMemorizeListenSpeed,
  readMemorizeListenSpeedFromStorage,
  writeMemorizeListenSpeedToStorage,
  applyMemorizeListenPlaybackRateToMediaElement,
  MEMORIZE_IOS_WEB_SPEECH_RATE_SCALE,
  toMemorizeWebSpeechUtteranceRate,
} from './memorizeListenSpeedStorage';

describe('constants', () => {
  it('exports expected presets', () => {
    expect(MEMORIZE_LISTEN_REPEAT_GAP_MS).toBe(650);
    expect(MEMORIZE_LISTEN_SPEED_STORAGE_KEY).toBe('prayer-app:memorize-listen-speed');
    expect(MEMORIZE_LISTEN_SPEEDS).toContain(1);
    expect(MEMORIZE_IOS_WEB_SPEECH_RATE_SCALE).toBe(0.82);
  });
});

describe('formatMemorizeListenSpeedLabel', () => {
  it('formats preset speeds', () => {
    expect(formatMemorizeListenSpeedLabel(1)).toBe('1x');
    expect(formatMemorizeListenSpeedLabel(1.5)).toBe('1.5x');
    expect(formatMemorizeListenSpeedLabel(2)).toBe('2x');
  });

  it('defaults unknown rate to 1x label', () => {
    expect(formatMemorizeListenSpeedLabel(0.9)).toBe('1x');
  });
});

describe('normalizeMemorizeListenSpeed', () => {
  it('returns 1 for null, empty, invalid, or non-preset values', () => {
    expect(normalizeMemorizeListenSpeed(null)).toBe(1);
    expect(normalizeMemorizeListenSpeed('')).toBe(1);
    expect(normalizeMemorizeListenSpeed('bad')).toBe(1);
    expect(normalizeMemorizeListenSpeed('0.9')).toBe(1);
  });

  it('accepts valid preset speeds', () => {
    expect(normalizeMemorizeListenSpeed('1.5')).toBe(1.5);
    expect(normalizeMemorizeListenSpeed('2')).toBe(2);
    expect(normalizeMemorizeListenSpeed('0.75')).toBe(0.75);
  });
});

describe('localStorage read/write', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads default when storage is empty', () => {
    expect(readMemorizeListenSpeedFromStorage()).toBe(1);
  });

  it('reads stored preset speed', () => {
    store.set(MEMORIZE_LISTEN_SPEED_STORAGE_KEY, '1.5');
    expect(readMemorizeListenSpeedFromStorage()).toBe(1.5);
  });

  it('writes preset speed to storage', () => {
    writeMemorizeListenSpeedToStorage(1.25);
    expect(store.get(MEMORIZE_LISTEN_SPEED_STORAGE_KEY)).toBe('1.25');
  });
});

describe('readMemorizeListenSpeedFromStorage without window', () => {
  it('returns 1 when window is undefined', () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    delete globalThis.window;
    expect(readMemorizeListenSpeedFromStorage()).toBe(1);
    globalThis.window = original;
  });
});

describe('applyMemorizeListenPlaybackRateToMediaElement', () => {
  it('sets playback rate on media element', () => {
    const el = { playbackRate: 1 } as HTMLMediaElement;
    applyMemorizeListenPlaybackRateToMediaElement(el, 1.5);
    expect(el.playbackRate).toBe(1.5);
  });

  it('ignores invalid rates', () => {
    const el = { playbackRate: 1 } as HTMLMediaElement;
    applyMemorizeListenPlaybackRateToMediaElement(el, 0);
    applyMemorizeListenPlaybackRateToMediaElement(el, NaN);
    expect(el.playbackRate).toBe(1);
  });

  it('sets preservesPitch when supported', () => {
    const el = { playbackRate: 1, preservesPitch: false } as HTMLMediaElement & {
      preservesPitch: boolean;
    };
    applyMemorizeListenPlaybackRateToMediaElement(el, 1.5);
    expect(el.preservesPitch).toBe(true);
  });
});

describe('toMemorizeWebSpeechUtteranceRate', () => {
  it('scales rate on iOS web', () => {
    expect(toMemorizeWebSpeechUtteranceRate(1, true)).toBeCloseTo(0.82);
    expect(toMemorizeWebSpeechUtteranceRate(2, true)).toBe(1.64);
  });

  it('uses preset directly on non-iOS', () => {
    expect(toMemorizeWebSpeechUtteranceRate(1.5, false)).toBe(1.5);
  });

  it('clamps to valid range', () => {
    expect(toMemorizeWebSpeechUtteranceRate(2, false)).toBe(2);
    expect(toMemorizeWebSpeechUtteranceRate(0.75, false)).toBe(0.75);
  });
});
