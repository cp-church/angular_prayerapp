import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import posthog from 'posthog-js';
import {
  capturePostHogException,
  initializePostHog,
  resetPostHogForTesting,
} from './posthog';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    captureException: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

vi.mock('../environments/environment', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../environments/environment')>();
  return {
    environment: {
      ...mod.environment,
      posthogKey: 'phc_test_key',
    },
  };
});

describe('posthog', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetPostHogForTesting();
    vi.mocked(posthog.init).mockClear();
    vi.mocked(posthog.capture).mockClear();
    vi.mocked(posthog.captureException).mockClear();
    vi.mocked(posthog.init).mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    resetPostHogForTesting();
  });

  describe('initializePostHog', () => {
    it('should initialize PostHog with project key and host', () => {
      initializePostHog();

      expect(posthog.init).toHaveBeenCalledWith(
        'phc_test_key',
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
        })
      );
      expect((window as Window & { posthog?: typeof posthog }).posthog).toBe(posthog);
    });

    it('should not throw when init fails', () => {
      vi.mocked(posthog.init).mockImplementation(() => {
        throw new Error('init failed');
      });
      resetPostHogForTesting();
      expect(() => initializePostHog()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('capturePostHogException', () => {
    it('should capture exceptions after initialization', () => {
      initializePostHog();
      const err = new Error('test');
      capturePostHogException(err, { source: 'test' });

      expect(posthog.captureException).toHaveBeenCalledWith(err, { source: 'test' });
    });
  });
});
