import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    service = new ThemeService();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('theme$ observable', () => {
    it('should emit theme values', async () => {
      const theme = await firstValueFrom(service.theme$);
      expect(['light', 'dark', 'system']).toContain(theme);
    });

    it('should default to system theme', async () => {
      const theme = await firstValueFrom(service.theme$);
      expect(theme).toBe('system');
    });

    it('should emit different themes when setTheme is called', async () => {
      const themes: string[] = [];
      service.theme$.subscribe(theme => themes.push(theme));

      service.setTheme('light');
      await new Promise(resolve => setTimeout(resolve, 10));

      service.setTheme('dark');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(themes).toContain('system');
      expect(themes).toContain('light');
      expect(themes).toContain('dark');
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', async () => {
      service.setTheme('light');
      const theme = await firstValueFrom(service.theme$);
      expect(theme).toBe('light');
    });

    it('should update theme to dark', async () => {
      service.setTheme('dark');
      const theme = await firstValueFrom(service.theme$);
      expect(theme).toBe('dark');
    });

    it('should update theme to system', async () => {
      service.setTheme('light');
      service.setTheme('system');
      const theme = await firstValueFrom(service.theme$);
      expect(theme).toBe('system');
    });

    it('should persist theme to localStorage', () => {
      service.setTheme('dark');
      const savedTheme = localStorage.getItem('theme');
      expect(savedTheme).toBe('dark');
    });

    it('should apply dark class to HTML element when dark theme is set', () => {
      service.setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from HTML element when light theme is set', () => {
      service.setTheme('dark');
      service.setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply system theme based on matchMedia when system is set', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      service.setTheme('system');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('getTheme', () => {
    it('should return current theme value', () => {
      expect(service.getTheme()).toBe('system');
      
      service.setTheme('light');
      expect(service.getTheme()).toBe('light');
      
      service.setTheme('dark');
      expect(service.getTheme()).toBe('dark');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(service.getTheme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.getTheme()).toBe('light');
    });

    it('should toggle from system to different theme', () => {
      service.setTheme('system');
      const currentTheme = service.getTheme();
      service.toggleTheme();
      const newTheme = service.getTheme();
      
      // When toggling from system, it should switch between light and dark
      expect(['light', 'dark']).toContain(newTheme);
      expect(newTheme).not.toBe(currentTheme);
    });

    it('should persist toggle to localStorage', () => {
      service.setTheme('light');
      service.toggleTheme();
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should apply correct class after toggle', () => {
      service.setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      service.toggleTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('setSystemTheme', () => {
    it('should set theme to system', () => {
      service.setTheme('light');
      service.setSystemTheme();
      expect(service.getTheme()).toBe('system');
    });

    it('should apply system preference when set to system', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      service.setSystemTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('isDark', () => {
    it('should return true when dark theme is set', () => {
      service.setTheme('dark');
      expect(service.isDark()).toBe(true);
    });

    it('should return false when light theme is set', () => {
      service.setTheme('light');
      expect(service.isDark()).toBe(false);
    });

    it('should use system preference when system theme is set', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)' ? false : true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      service.setTheme('system');
      expect(service.isDark()).toBe(false);
    });

    it('should use system preference for dark mode when system theme is set', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      service.setTheme('system');
      expect(service.isDark()).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should restore theme from localStorage on initialization', () => {
      localStorage.setItem('theme', 'dark');
      const newService = new ThemeService();
      expect(newService.getTheme()).toBe('dark');
    });

    it('should use default theme if localStorage is invalid', () => {
      localStorage.setItem('theme', 'invalid' as any);
      const newService = new ThemeService();
      expect(newService.getTheme()).toBe('system');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('theme', '');
      const newService = new ThemeService();
      expect(newService.getTheme()).toBe('system');
    });
  });

  describe('DOM manipulation', () => {
    it('should add dark class to document element for dark theme', () => {
      document.documentElement.classList.remove('dark');
      service.setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document element for light theme', () => {
      document.documentElement.classList.add('dark');
      service.setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should not duplicate dark class on multiple sets', () => {
      service.setTheme('dark');
      service.setTheme('dark');
      const darkClassCount = (document.documentElement.className.match(/dark/g) || []).length;
      expect(darkClassCount).toBe(1);
    });
  });
});
