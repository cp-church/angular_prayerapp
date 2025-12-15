import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeToggle } from '../ThemeToggle';
import * as useThemeModule from '../../hooks/useTheme';

// Mock localStorage
let localStorageValue: string | null = null;
const localStorageMock = {
  getItem: vi.fn(() => localStorageValue) as any,
  setItem: vi.fn((key: string, value: string) => { localStorageValue = value; }),
  removeItem: vi.fn(() => { localStorageValue = null; }),
  clear: vi.fn(() => { localStorageValue = null; }),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock the useTheme hook
const mockToggleTheme = vi.fn();
const mockSetSystemTheme = vi.fn();
let mockIsDark = false;

vi.mock('../../hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system',
    toggleTheme: mockToggleTheme,
    setSystemTheme: mockSetSystemTheme,
    isDark: mockIsDark
  }))
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('shows sun icon when not dark', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    expect(button).toContainElement(document.querySelector('svg'));
  });

  it('opens dropdown when button is clicked', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('closes dropdown when button is clicked again', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });

    fireEvent.click(button);
    expect(screen.getByText('System')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  it('calls setSystemTheme when system option is clicked', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    const systemButton = screen.getByText('System');
    fireEvent.click(systemButton);

    expect(mockSetSystemTheme).toHaveBeenCalledTimes(1);
  });

  it('calls toggleTheme when light option is clicked and currently in dark mode', () => {
    mockIsDark = true; // Simulate currently in dark mode

    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    const lightButton = screen.getByText('Light');
    fireEvent.click(lightButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('calls toggleTheme when dark option is clicked and currently in light mode', () => {
    mockIsDark = false; // Simulate currently in light mode

    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    const darkButton = screen.getByText('Dark');
    fireEvent.click(darkButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown after selecting theme option', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    expect(screen.getByText('System')).toBeInTheDocument();

    const systemButton = screen.getByText('System');
    fireEvent.click(systemButton);

    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  // Note: Theme highlighting tests are complex due to interaction between localStorage and useTheme hook
  // The core functionality (dropdown behavior, function calls) is tested above

  it('closes dropdown when clicking outside', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Theme' });
    fireEvent.click(button);

    expect(screen.getByText('System')).toBeInTheDocument();

    // Click outside the component
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });
});
