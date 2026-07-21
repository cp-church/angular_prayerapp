import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { MemorizationRecitePracticeComponent } from './memorization-recite-practice.component';
import { MemorizationReciteService } from '../services/memorization-recite.service';
import { MemorizationReciteSettingsService } from '../services/memorization-recite-settings.service';
import { UserSessionService } from '../services/user-session.service';

const componentDir = dirname(fileURLToPath(import.meta.url));

function readComponentResource(url: string): string {
  const path = join(componentDir, url);
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  throw new Error(`Component resource not found: ${url}`);
}

describe('MemorizationRecitePracticeComponent', () => {
  let fixture: ComponentFixture<MemorizationRecitePracticeComponent>;
  let component: MemorizationRecitePracticeComponent;
  let cancelRecording: ReturnType<typeof vi.fn>;
  let stopRecordingCapture: ReturnType<typeof vi.fn>;
  let transcribeCapturedRecording: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    await resolveComponentResources((url) => Promise.resolve(readComponentResource(url)));
  });

  beforeEach(async () => {
    cancelRecording = vi.fn().mockResolvedValue(undefined);
    stopRecordingCapture = vi.fn();
    transcribeCapturedRecording = vi.fn();

    await TestBed.configureTestingModule({
      imports: [MemorizationRecitePracticeComponent],
      providers: [
        {
          provide: MemorizationReciteService,
          useValue: {
            startRecording: vi.fn(),
            stopRecordingCapture,
            transcribeCapturedRecording,
            stopAndTranscribe: vi.fn(),
            cancelRecording,
          },
        },
        {
          provide: MemorizationReciteSettingsService,
          useValue: {
            getSettingsFromServer: vi.fn().mockResolvedValue({ enabled: true }),
          },
        },
        {
          provide: UserSessionService,
          useValue: {
            isSessionInitialized: vi.fn(() => true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemorizationRecitePracticeComponent);
    component = fixture.componentInstance;
    component.tokens = [{ kind: 'word', text: 'In', index: 0 }];
    component.typableIndices = [0];
    component.reference = 'John 3:16';
    component.itemId = 'item-1';
    component.roundIndex = 0;
    component.hiddenIndices = new Set();
    component.revealed = new Set();
    component.hintPeekIndices = new Set();
    component.settingsLoaded = true;
    component.enabled = true;
    component.phase = 'recording';
  });

  it('prepareClose stops an active recording before the parent destroys the child', async () => {
    await component.prepareClose();

    expect(cancelRecording).toHaveBeenCalled();
    expect(component.phase).toBe('ready');
  });

  it('prepareClose aborts in-flight transcription', async () => {
    component.phase = 'transcribing';
    component.inFlightStop = new Promise(() => {
      // hang
    });

    await component.prepareClose();

    expect(cancelRecording).toHaveBeenCalled();
    expect(component.phase).toBe('ready');
  });

  it('ignores duplicate stop taps during capture tail', async () => {
    let resolveCapture!: (value: { blob: Blob; audioSeconds: number }) => void;
    stopRecordingCapture.mockReturnValue(
      new Promise((resolve) => {
        resolveCapture = resolve;
      })
    );
    transcribeCapturedRecording.mockResolvedValue('in the beginning');

    const firstStop = component.stopRecording();
    const secondStop = component.stopRecording();

    resolveCapture({ blob: new Blob(['audio']), audioSeconds: 1 });
    await Promise.all([firstStop, secondStop]);

    expect(stopRecordingCapture).toHaveBeenCalledTimes(1);
    expect(transcribeCapturedRecording).toHaveBeenCalledTimes(1);
    expect(component.phase).toBe('results');
  });

  it('omits whisper prompt for bible books transcription', async () => {
    component.isBibleBooks = true;
    component.reference = 'Bible Books (OT)';
    component.tokens = [
      { kind: 'word', text: 'Genesis' },
      { kind: 'punct', text: ' ' },
      { kind: 'word', text: 'Exodus' },
    ];
    component.typableIndices = [0, 2];
    stopRecordingCapture.mockResolvedValue({ blob: new Blob(['audio']), audioSeconds: 2 });
    transcribeCapturedRecording.mockResolvedValue('Genesis Exodus');

    await component.stopRecording();

    expect(transcribeCapturedRecording).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: '',
        memorizedItemId: 'item-1',
      })
    );
  });
});
