import { describe, it, expect } from 'vitest';
import { environment } from './environment.prod';
import { environment as devEnvironment } from './environment';

describe('environment.prod', () => {
  it('should be defined', () => {
    expect(environment).toBeDefined();
  });

  it('should have production set to true', () => {
    expect(environment.production).toBe(true);
  });

  it('should have supabaseUrl defined', () => {
    expect(environment.supabaseUrl).toBeDefined();
    expect(typeof environment.supabaseUrl).toBe('string');
    expect(environment.supabaseUrl).toBe('https://eqiafsygvfaifhoaewxi.supabase.co');
  });

  it('should have supabaseAnonKey defined', () => {
    expect(environment.supabaseAnonKey).toBeDefined();
    expect(typeof environment.supabaseAnonKey).toBe('string');
    expect(environment.supabaseAnonKey.length).toBeGreaterThan(0);
  });

  it('should have posthogKey defined', () => {
    expect(environment.posthogKey).toBeDefined();
    expect(typeof environment.posthogKey).toBe('string');
  });

  it('should have posthogHost defined', () => {
    expect(environment.posthogHost).toBeDefined();
    expect(typeof environment.posthogHost).toBe('string');
    expect(environment.posthogHost).toBe('https://us.i.posthog.com');
  });

  it('should have all required properties', () => {
    expect(environment).toHaveProperty('production');
    expect(environment).toHaveProperty('supabaseUrl');
    expect(environment).toHaveProperty('supabaseAnonKey');
    expect(environment).toHaveProperty('posthogKey');
    expect(environment).toHaveProperty('posthogHost');
  });

  it('should have valid Supabase URL format', () => {
    expect(environment.supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it('should have valid PostHog host format', () => {
    expect(environment.posthogHost).toMatch(/^https:\/\/.+\.posthog\.com$/);
  });

  it('should use different Supabase configuration from development', () => {
    expect(environment.supabaseUrl).not.toBe(devEnvironment.supabaseUrl);
    expect(environment.supabaseAnonKey).not.toBe(devEnvironment.supabaseAnonKey);
  });

  it('should use same PostHog host as development', () => {
    expect(environment.posthogHost).toBe(devEnvironment.posthogHost);
  });
});
