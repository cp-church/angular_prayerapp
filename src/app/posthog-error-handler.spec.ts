import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { providePostHogErrorHandler } from './posthog-error-handler';

const capturePostHogExceptionMock = vi.fn();

vi.mock('../lib/posthog', () => ({
  capturePostHogException: (...args: unknown[]) => capturePostHogExceptionMock(...args),
}));

describe('PostHogErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    capturePostHogExceptionMock.mockClear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [providePostHogErrorHandler()],
    });
    errorHandler = TestBed.inject(ErrorHandler);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function handleError(error: unknown): void {
    errorHandler.handleError(error);
  }

  describe('providePostHogErrorHandler', () => {
    it('returns an ErrorHandler provider', () => {
      const provider = providePostHogErrorHandler();
      expect(provider.provide).toBe(ErrorHandler);
      expect(provider).toHaveProperty('useClass');
    });
  });

  describe('handleError', () => {
    it('captures a plain Error and logs the original', () => {
      const err = new Error('plain error');
      handleError(err);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(err);
      expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    });

    it('captures a string error', () => {
      handleError('string error');

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith('string error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('string error');
    });

    it('captures HttpErrorResponse with Error body', () => {
      const innerError = new Error('http body error');
      const response = new HttpErrorResponse({ error: innerError, status: 500 });

      handleError(response);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(innerError);
    });

    it('captures HttpErrorResponse with ErrorEvent message', () => {
      const errorEvent = new ErrorEvent('error', { message: 'network failed' });
      const response = new HttpErrorResponse({ error: errorEvent, status: 0 });

      handleError(response);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith('network failed');
    });

    it('captures HttpErrorResponse with string body', () => {
      const response = new HttpErrorResponse({ error: 'bad request', status: 400 });

      handleError(response);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(
        'Server returned code 400 with body "bad request"'
      );
    });

    it('falls back to HttpErrorResponse message when body is not extractable', () => {
      const response = new HttpErrorResponse({
        error: { unexpected: true },
        status: 502,
        statusText: 'Bad Gateway',
      });

      handleError(response);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(response.message);
    });

    it('unwraps zone.js ngOriginalError before extraction', () => {
      const original = new Error('zone wrapped');
      handleError({ ngOriginalError: original });

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(original);
    });

    it('captures error-like objects with name, message, and stack', () => {
      const errorLike = {
        name: 'CustomError',
        message: 'custom message',
        stack: 'at custom()',
      };

      handleError(errorLike);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith(errorLike);
    });

    it('captures "Unknown error" for null', () => {
      handleError(null);

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith('Unknown error');
    });

    it('captures "Unknown error" for unrecognized objects', () => {
      handleError({ foo: 'bar' });

      expect(capturePostHogExceptionMock).toHaveBeenCalledWith('Unknown error');
    });
  });
});
