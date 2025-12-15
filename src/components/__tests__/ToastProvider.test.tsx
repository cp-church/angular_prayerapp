import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider } from '../ToastProvider';
import { ToastContext } from '../../contexts/ToastContext';

// Test component that consumes the toast context
const TestConsumer = () => {
  const context = React.useContext(ToastContext);
  const showToast = context?.showToast || (() => {});

  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Success Toast
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error Toast
      </button>
      <button onClick={() => showToast('Info message')}>
        Show Info Toast
      </button>
    </div>
  );
};

describe('ToastProvider Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ToastProvider>
        <div>Test Child</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success Toast')).toBeInTheDocument();
  });

  it('shows toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct styles for success toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    const toast = screen.getByText('Test message').closest('div');
    expect(toast).toHaveClass('bg-green-100');
    expect(toast).toHaveClass('text-green-800');
    expect(toast).toHaveClass('border-green-200');
  });

  it('applies correct styles for error toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error Toast');
    fireEvent.click(button);

    const toast = screen.getByText('Error message').closest('div');
    expect(toast).toHaveClass('bg-red-100');
    expect(toast).toHaveClass('text-red-800');
    expect(toast).toHaveClass('border-red-200');
  });

  it('applies default styles for info toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info Toast');
    fireEvent.click(button);

    const toast = screen.getByText('Info message').closest('div');
    expect(toast).toHaveClass('bg-blue-100');
    expect(toast).toHaveClass('text-blue-800');
    expect(toast).toHaveClass('border-blue-200');
  });

  it('includes close button for each toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    const closeButton = screen.getByRole('button', { name: '' }); // Close button has no text
    expect(closeButton).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('auto-removes toast after 5 seconds', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Fast-forward 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('shows multiple toasts', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const successButton = screen.getByText('Show Success Toast');
    const errorButton = screen.getByText('Show Error Toast');

    fireEvent.click(successButton);
    fireEvent.click(errorButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('positions toast container correctly', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    const container = screen.getByText('Test message').closest('.fixed');
    expect(container).toHaveClass('right-4');
    expect(container).toHaveClass('bottom-4');
    expect(container).toHaveClass('md:top-4');
    expect(container).toHaveClass('md:bottom-auto');
  });

  it('includes check circle icon in toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success Toast');
    fireEvent.click(button);

    // The CheckCircle icon should be present
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
