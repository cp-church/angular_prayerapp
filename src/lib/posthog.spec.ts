import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import posthog from 'posthog-js';
import { environment } from '../environments/environment';
import {
  capturePostHogException,
  capturePostHogPageview,
  initializePostHog,
  resetPostHogForTesting,
} from './posthog';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    captureException: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../environments/environment', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../environments/environment')>();
  return {
    environment: {
      ...mod.environment,
      posthogKey: 'phc_test_key',
      posthogHost: 'https://t.cp-church.org',
      posthogUiHost: 'https://us.posthog.com',
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
    vi.mocked(posthog.init).mockReturnValue(posthog);
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
          api_host: 'https://t.cp-church.org',
          ui_host: 'https://us.posthog.com',
          capture_pageview: false,
        })
      );
      expect((window as Window & { posthog?: typeof posthog }).posthog).toBe(posthog);
    });

    it('should opt in and register app environment in loaded callback', () => {
      initializePostHog();

      const initOptions = vi.mocked(posthog.init).mock.calls[0]?.[1];
      const ph = {
        opt_in_capturing: vi.fn(),
        register: vi.fn(),
      };
      initOptions?.loaded?.(ph as never);

      expect(ph.opt_in_capturing).toHaveBeenCalled();
      expect(ph.register).toHaveBeenCalledWith({ app_environment: 'development' });
    });

    it('should return early when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      resetPostHogForTesting();

      initializePostHog();

      expect(posthog.init).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('should debug and skip init when project key is not configured', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const originalKey = environment.posthogKey;
      environment.posthogKey = '';
      resetPostHogForTesting();

      initializePostHog();

      expect(posthog.init).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith('PostHog project key not configured');

      environment.posthogKey = originalKey;
      debugSpy.mockRestore();
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

    it('should log when captureException fails', () => {
      initializePostHog();
      vi.mocked(posthog.captureException).mockImplementation(() => {
        throw new Error('capture failed');
      });

      capturePostHogException(new Error('test'));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to capture PostHog exception:',
        expect.any(Error)
      );
    });
  });

  describe('capturePostHogPageview', () => {
    it('should capture pageviews after initialization', () => {
      initializePostHog();

      capturePostHogPageview('/dashboard');

      expect(posthog.capture).toHaveBeenCalledWith('$pageview', { $current_url: '/dashboard' });
    });

    it('should log when pageview capture fails', () => {
      initializePostHog();
      vi.mocked(posthog.capture).mockImplementation(() => {
        throw new Error('pageview failed');
      });

      capturePostHogPageview('/fail');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to capture PostHog pageview:',
        expect.any(Error)
      );
    });
  });
});
