import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemorizationReciteService,
  RECITE_STOP_TAIL_MS,
} from './memorization-recite.service';
import { SupabaseService } from './supabase.service';
import { UserSessionService } from './user-session.service';

describe('MemorizationReciteService', () => {
  let service: MemorizationReciteService;

  beforeEach(() => {
    localStorage.clear();
    const supabase = {
      getSupabaseKey: vi.fn(() => 'test-anon-key'),
      getSupabaseUrl: vi.fn(() => 'https://test.supabase.co'),
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      },
    };
    const userSession = {
      getCurrentSession: vi.fn(() => null),
    };

    service = new MemorizationReciteService(
      supabase as unknown as SupabaseService,
      userSession as unknown as UserSessionService
    );
  });

  it('getUserEmail uses mfa_authenticated_email when no Supabase session', async () => {
    localStorage.setItem('mfa_authenticated_email', 'Mfa@Example.com');

    const email = await (service as unknown as { getUserEmail(): Promise<string | null> }).getUserEmail();

    expect(email).toBe('mfa@example.com');
  });

  it('getUserEmail prefers user session email over Supabase JWT lookup', async () => {
    const userSession = {
      getCurrentSession: vi.fn(() => ({
        email: 'session@example.com',
        fullName: 'Session',
        isActive: true,
      })),
    };
    const supabase = {
      getSupabaseKey: vi.fn(() => 'test-anon-key'),
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'jwt@example.com' } },
          }),
        },
      },
    };
    service = new MemorizationReciteService(
      supabase as unknown as SupabaseService,
      userSession as unknown as UserSessionService
    );

    const email = await (service as unknown as { getUserEmail(): Promise<string | null> }).getUserEmail();

    expect(email).toBe('session@example.com');
  });

  it('transcribeWhisper includes mfa_session_start for MFA sessions without JWT', async () => {
    localStorage.setItem('mfa_authenticated_email', 'mfa@example.com');
    localStorage.setItem('mfa_session_start', '1710000000000');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcript: 'hello world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const transcript = await (
      service as unknown as {
        transcribeWhisper(params: {
          blob: Blob;
          audioSeconds: number;
        }): Promise<string>;
      }
    ).transcribeWhisper({
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      audioSeconds: 1,
    });

    expect(transcript).toBe('hello world');
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get('user_email')).toBe('mfa@example.com');
    expect(body.get('mfa_session_start')).toBe('1710000000000');
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.Authorization).toBe('Bearer test-anon-key');

    vi.unstubAllGlobals();
  });

  it('transcribeWhisper prefers MFA proof over a stale Supabase JWT', async () => {
    localStorage.setItem('mfa_authenticated_email', 'mfa@example.com');
    localStorage.setItem('mfa_session_start', '1710000000000');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcript: 'hello world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const supabase = {
      getSupabaseKey: vi.fn(() => 'test-anon-key'),
      getSupabaseUrl: vi.fn(() => 'https://test.supabase.co'),
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'stale-jwt-token' } },
          }),
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      },
    };
    const staleJwtService = new MemorizationReciteService(
      supabase as unknown as SupabaseService,
      { getCurrentSession: vi.fn(() => null) } as unknown as UserSessionService
    );

    await (
      staleJwtService as unknown as {
        transcribeWhisper(params: { blob: Blob; audioSeconds: number }): Promise<string>;
      }
    ).transcribeWhisper({
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      audioSeconds: 1,
    });

    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get('mfa_session_start')).toBe('1710000000000');
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.Authorization).toBe('Bearer test-anon-key');

    vi.unstubAllGlobals();
  });

  it('transcribeWhisper throws when MFA session start is missing', async () => {
    localStorage.setItem('mfa_authenticated_email', 'mfa@example.com');

    await expect(
      (
        service as unknown as {
          transcribeWhisper(params: { blob: Blob; audioSeconds: number }): Promise<string>;
        }
      ).transcribeWhisper({
        blob: new Blob(['audio'], { type: 'audio/webm' }),
        audioSeconds: 1,
      })
    ).rejects.toThrow('Session expired');
  });

  it('cancelRecording does not wait for capture tail delay', async () => {
    vi.useFakeTimers();
    const internal = service as unknown as {
      recordingActive: boolean;
      recordingStartedAt: number;
      mediaRecorder: MediaRecorder | null;
      audioChunks: Blob[];
    };
    internal.recordingActive = true;
    internal.recordingStartedAt = Date.now() - 2000;
    internal.audioChunks = [new Blob(['audio'], { type: 'audio/webm' })];
    internal.mediaRecorder = {
      state: 'recording',
      mimeType: 'audio/webm',
      stop: vi.fn(),
      onstop: null,
    } as unknown as MediaRecorder;

    const capturePromise = service.stopRecordingCapture();
    const cancelPromise = service.cancelRecording();
    const rejection = expect(capturePromise).rejects.toThrow('Recording cancelled.');
    await vi.advanceTimersByTimeAsync(RECITE_STOP_TAIL_MS);
    await rejection;
    await cancelPromise;

    vi.useRealTimers();
  });
});
