import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserSessionService } from './user-session.service';
import { isWhisperReciteSupported } from '../lib/memorization/isWhisperReciteSupported';

export const RECITE_MAX_DURATION_MS = 3 * 60 * 1000;
export const RECITE_MIN_DURATION_MS = 1000;
/** Brief tail after stop tap so trailing reference words are not clipped. */
export const RECITE_STOP_TAIL_MS = 400;

export type ReciteRecordingCallbacks = {
  onDurationMs?: (ms: number) => void;
  onMaxDurationReached?: () => void;
};

export type ReciteCapturedRecording = {
  blob: Blob;
  audioSeconds: number;
};

@Injectable({
  providedIn: 'root',
})
export class MemorizationReciteService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartedAt = 0;
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private recordingCallbacks: ReciteRecordingCallbacks | undefined;
  private recordingActive = false;
  private recordingStartToken = 0;
  private stopInFlight: Promise<string> | null = null;
  private captureInFlight: Promise<ReciteCapturedRecording> | null = null;
  private transcribeAbort: AbortController | null = null;

  constructor(
    private supabase: SupabaseService,
    private userSession: UserSessionService
  ) {}

  async startRecording(callbacks?: ReciteRecordingCallbacks): Promise<void> {
    if (!isWhisperReciteSupported()) {
      throw new Error('Recording is not supported in this browser. Use HTTPS or try another browser.');
    }
    const startToken = ++this.recordingStartToken;
    await this.cleanup();
    this.recordingStartedAt = Date.now();
    this.recordingCallbacks = callbacks;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (startToken !== this.recordingStartToken) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }
      this.mediaStream = stream;
      const mimeType = this.pickRecorderMimeType();
      this.audioChunks = [];
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      recorder.start();
      this.mediaRecorder = recorder;

      if (startToken !== this.recordingStartToken) {
        await this.cleanup();
        return;
      }

      this.recordingActive = true;
      this.startDurationTimer();
    } catch (err) {
      await this.cleanup();
      throw err;
    }
  }

  async stopRecordingCapture(): Promise<ReciteCapturedRecording> {
    if (this.captureInFlight) {
      return this.captureInFlight;
    }

    this.captureInFlight = this.finishStopCapture().finally(() => {
      this.captureInFlight = null;
    });
    return this.captureInFlight;
  }

  async transcribeCapturedRecording(params: {
    blob: Blob;
    audioSeconds: number;
    memorizedItemId?: string;
    prompt?: string;
  }): Promise<string> {
    return this.transcribeWhisper(params);
  }

  async stopAndTranscribe(params: {
    memorizedItemId?: string;
    prompt?: string;
  }): Promise<string> {
    if (this.stopInFlight) {
      return this.stopInFlight;
    }

    this.stopInFlight = (async () => {
      const captured = await this.stopRecordingCapture();
      return this.transcribeCapturedRecording({
        blob: captured.blob,
        audioSeconds: captured.audioSeconds,
        memorizedItemId: params.memorizedItemId,
        prompt: params.prompt,
      });
    })().finally(() => {
      this.stopInFlight = null;
    });
    return this.stopInFlight;
  }

  async cancelRecording(): Promise<void> {
    this.recordingStartToken += 1;
    this.transcribeAbort?.abort();
    const inFlight = this.stopInFlight;
    const capture = this.captureInFlight;
    await this.cleanup();
    if (capture) {
      void capture.catch(() => {
        // ignore errors from an in-flight capture cancelled by cleanup
      });
    }
    if (inFlight) {
      try {
        await inFlight;
      } catch {
        // ignore errors from an in-flight stop cancelled by cleanup
      }
    }
  }

  private async finishStopCapture(): Promise<ReciteCapturedRecording> {
    if (!this.recordingActive) {
      await this.cleanup();
      throw new Error('No active recording.');
    }
    this.recordingActive = false;

    const durationMs = Math.max(0, Date.now() - this.recordingStartedAt);
    if (durationMs < RECITE_MIN_DURATION_MS) {
      await this.cleanup();
      throw new Error('Recording is too short. Try again.');
    }
    const maxAudioSeconds = RECITE_MAX_DURATION_MS / 1000;
    const audioSeconds = Math.min(durationMs / 1000, maxAudioSeconds);

    const captureToken = this.recordingStartToken;
    await this.delay(RECITE_STOP_TAIL_MS);
    if (captureToken !== this.recordingStartToken) {
      throw new Error('Recording cancelled.');
    }
    const blob = await this.stopMediaRecorder();
    await this.stopMediaStream();
    this.clearTimers();
    if (!blob || blob.size === 0) {
      throw new Error('No audio recorded. Try again.');
    }

    return { blob, audioSeconds };
  }

  private async transcribeWhisper(params: {
    blob: Blob;
    memorizedItemId?: string;
    prompt?: string;
    audioSeconds: number;
  }): Promise<string> {
    const apikey = this.supabase.getSupabaseKey();
    const session = await this.supabase.client.auth.getSession();
    const userEmail = await this.getUserEmail();
    if (!session.data.session?.access_token && !userEmail) {
      throw new Error('Sign in to use Recite mode.');
    }

    let mfaEmail: string | null = null;
    try {
      mfaEmail = localStorage.getItem('mfa_authenticated_email')?.toLowerCase().trim() ?? null;
    } catch {
      // ignore
    }
    const useMfaAuth = !!mfaEmail && userEmail === mfaEmail;
    const bearerToken = useMfaAuth ? null : session.data.session?.access_token ?? null;

    const form = new FormData();
    form.append('audio', params.blob, this.whisperUploadFilename(params.blob));
    form.append('audio_seconds', String(params.audioSeconds));
    if (userEmail) {
      form.append('user_email', userEmail);
    }
    if (useMfaAuth) {
      const mfaSessionStart = localStorage.getItem('mfa_session_start');
      if (!mfaSessionStart) {
        throw new Error('Session expired. Sign in again to use Recite mode.');
      }
      form.append('mfa_session_start', mfaSessionStart);
    }
    if (params.memorizedItemId) {
      form.append('memorized_item_id', params.memorizedItemId);
    }
    if (params.prompt) {
      form.append('prompt', params.prompt);
    }

    this.transcribeAbort = new AbortController();
    const signal = this.transcribeAbort.signal;
    try {
      const response = await fetch(
        `${this.supabase.getSupabaseUrl()}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            apikey,
            Authorization: `Bearer ${bearerToken ?? apikey}`,
          },
          body: form,
          signal,
        }
      );

      const payload = (await response.json()) as { transcript?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Transcription failed');
      }
      const transcript = payload.transcript?.trim() ?? '';
      if (!transcript) {
        throw new Error('No speech detected in the recording.');
      }
      return transcript;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Transcription cancelled.');
      }
      throw err;
    } finally {
      this.transcribeAbort = null;
    }
  }

  private async getUserEmail(): Promise<string | null> {
    try {
      const mfaEmail = localStorage.getItem('mfa_authenticated_email')?.toLowerCase().trim();
      if (mfaEmail) {
        return mfaEmail;
      }
    } catch {
      // ignore
    }

    const session = this.userSession.getCurrentSession();
    if (session?.email) return session.email.toLowerCase();
    const { data } = await this.supabase.client.auth.getUser();
    return data.user?.email?.toLowerCase() ?? null;
  }

  private pickRecorderMimeType(): string | undefined {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return undefined;
  }

  private whisperUploadFilename(blob: Blob): string {
    const type = blob.type.toLowerCase();
    if (type.includes('mp4') || type.includes('m4a')) return 'recording.m4a';
    if (type.includes('mpeg') || type.includes('mp3')) return 'recording.mp3';
    if (type.includes('wav')) return 'recording.wav';
    if (type.includes('ogg')) return 'recording.ogg';
    return 'recording.webm';
  }

  private startDurationTimer(): void {
    this.clearTimers();
    this.durationTimer = setInterval(() => {
      this.recordingCallbacks?.onDurationMs?.(Date.now() - this.recordingStartedAt);
    }, 250);
    this.maxDurationTimer = setTimeout(() => {
      this.recordingCallbacks?.onMaxDurationReached?.();
    }, RECITE_MAX_DURATION_MS);
  }

  private clearTimers(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  private stopMediaRecorder(): Promise<Blob | null> {
    const recorder = this.mediaRecorder;
    this.mediaRecorder = null;
    if (!recorder || recorder.state === 'inactive') {
      const type = this.audioChunks[0]?.type || 'audio/webm';
      return Promise.resolve(
        this.audioChunks.length ? new Blob(this.audioChunks, { type }) : null
      );
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || this.audioChunks[0]?.type || 'audio/webm';
        resolve(this.audioChunks.length ? new Blob(this.audioChunks, { type }) : null);
      };
      recorder.stop();
    });
  }

  private async stopMediaStream(): Promise<void> {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
  }

  private async cleanup(): Promise<void> {
    this.clearTimers();
    this.recordingCallbacks = undefined;
    this.recordingActive = false;
    this.transcribeAbort?.abort();
    this.transcribeAbort = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    await this.stopMediaStream();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
