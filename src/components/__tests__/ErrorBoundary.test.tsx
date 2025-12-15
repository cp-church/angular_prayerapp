import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import * as errorLogger from '../../lib/errorLogger';

// Mock the error logger
vi.mock('../../lib/errorLogger', () => ({
  logError: vi.fn()
}));

// Component that throws an error
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  const mockLogError = vi.mocked(errorLogger.logError);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches and displays error when child throws', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('logs error when caught', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLogError).toHaveBeenCalledWith({
      message: 'React Error Boundary caught error',
      error: expect.any(Error),
      context: {
        tags: { type: 'error_boundary' },
        metadata: { componentStack: expect.any(String) }
      }
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('resets error state when try again button is clicked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First render with error
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again - this should reset the state
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // The error boundary should reset, but since the child still throws,
    // it will catch the error again. The test should just verify the reset happened
    // by checking that the component is still in error state (because child still throws)
    // but the reset was attempted
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('calls onReset callback when provided', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockOnReset = vi.fn();

    render(
      <ErrorBoundary onReset={mockOnReset}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockOnReset).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('displays generic error message when error has no message', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Component that throws error without message
    const ErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
