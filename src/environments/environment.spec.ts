import { describe, it, expect } from 'vitest';
import { environment } from './environment';

describe('environment', () => {
  it('should be defined', () => {
    expect(environment).toBeDefined();
  });

  it('should have production set to false', () => {
    expect(environment.production).toBe(false);
  });

  it('should have supabaseUrl defined', () => {
    expect(environment.supabaseUrl).toBeDefined();
    expect(typeof environment.supabaseUrl).toBe('string');
    expect(environment.supabaseUrl).toBe('https://jcdhajfqtzipltvfslhu.supabase.co');
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
});
