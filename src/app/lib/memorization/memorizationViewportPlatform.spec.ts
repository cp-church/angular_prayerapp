import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMemorizeAndroidWebHost,
  isProfileResourceListenControlAvailable,
  isMemorizeIosWebHost,
  isProfileResourceSearchContentTouchBlurHost,
} from './memorizationViewportPlatform';

function mockNavigator(userAgent: string, platform = 'Win32', maxTouchPoints = 0) {
  vi.stubGlobal('navigator', { userAgent, platform, maxTouchPoints });
}

describe('isMemorizeAndroidWebHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true for Android user agent', () => {
    mockNavigator('Mozilla/5.0 (Linux; Android 13)');
    expect(isMemorizeAndroidWebHost()).toBe(true);
  });

  it('returns false for non-Android', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isMemorizeAndroidWebHost()).toBe(false);
  });

  it('returns false when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined);
    expect(isMemorizeAndroidWebHost()).toBe(false);
  });
});

describe('isMemorizeIosWebHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true for iPhone user agent', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isMemorizeIosWebHost()).toBe(true);
  });

  it('returns true for iPadOS desktop UA', () => {
    mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5);
    expect(isMemorizeIosWebHost()).toBe(true);
  });

  it('returns false for desktop Chrome', () => {
    mockNavigator('Mozilla/5.0 (Windows NT 10.0)', 'Win32', 0);
    expect(isMemorizeIosWebHost()).toBe(false);
  });
});

describe('isProfileResourceListenControlAvailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false on Android', () => {
    mockNavigator('Mozilla/5.0 (Linux; Android 13)');
    expect(isProfileResourceListenControlAvailable()).toBe(false);
  });

  it('is true on desktop', () => {
    mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
    expect(isProfileResourceListenControlAvailable()).toBe(true);
  });
});

describe('isProfileResourceSearchContentTouchBlurHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is true on iOS or Android', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isProfileResourceSearchContentTouchBlurHost()).toBe(true);

    mockNavigator('Mozilla/5.0 (Linux; Android 13)');
    expect(isProfileResourceSearchContentTouchBlurHost()).toBe(true);
  });

  it('is false on desktop', () => {
    mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
    expect(isProfileResourceSearchContentTouchBlurHost()).toBe(false);
  });
});
