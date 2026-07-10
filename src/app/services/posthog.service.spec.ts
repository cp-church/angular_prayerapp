import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { NavigationEnd, Router, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { PosthogService } from './posthog.service';

const initializePostHogMock = vi.fn();
const capturePostHogPageviewMock = vi.fn();

vi.mock('../../lib/posthog', () => ({
  initializePostHog: (...args: unknown[]) => initializePostHogMock(...args),
  capturePostHogPageview: (...args: unknown[]) => capturePostHogPageviewMock(...args),
}));

describe('PosthogService', () => {
  let events$: Subject<Event>;
  let runOutsideAngularMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    events$ = new Subject<Event>();
    initializePostHogMock.mockClear();
    capturePostHogPageviewMock.mockClear();
    runOutsideAngularMock = vi.fn((fn: () => void) => fn());

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgZone,
          useValue: {
            runOutsideAngular: runOutsideAngularMock,
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/home',
            events: events$.asObservable(),
          },
        },
      ],
    });
  });

  it('initializes PostHog and captures the initial pageview outside Angular zone', () => {
    TestBed.inject(PosthogService);

    expect(runOutsideAngularMock).toHaveBeenCalled();
    expect(initializePostHogMock).toHaveBeenCalled();
    expect(capturePostHogPageviewMock).toHaveBeenCalledWith('/home');
  });

  it('captures pageviews on NavigationEnd outside Angular zone', () => {
    TestBed.inject(PosthogService);
    capturePostHogPageviewMock.mockClear();
    runOutsideAngularMock.mockClear();

    events$.next(new NavigationEnd(1, '/prayers', '/prayers?tab=active'));

    expect(runOutsideAngularMock).toHaveBeenCalled();
    expect(capturePostHogPageviewMock).toHaveBeenCalledWith('/prayers?tab=active');
  });

  it('ignores non-NavigationEnd router events', () => {
    TestBed.inject(PosthogService);
    capturePostHogPageviewMock.mockClear();

    events$.next({ id: 1, url: '/ignored' } as Event);

    expect(capturePostHogPageviewMock).not.toHaveBeenCalled();
  });
});
