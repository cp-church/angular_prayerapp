import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordChange } from '../PasswordChange';

describe('PasswordChange Component', () => {
  const mockOnPasswordChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the password change form', () => {
    render(<PasswordChange onPasswordChange={mockOnPasswordChange} />);

    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('shows password as hidden by default', () => {
    render(<PasswordChange onPasswordChange={mockOnPasswordChange} />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('includes proper ARIA labels and icons', () => {
    render(<PasswordChange onPasswordChange={mockOnPasswordChange} />);

    // Check for lock icons
    const lockIcons = document.querySelectorAll('svg');
    expect(lockIcons.length).toBeGreaterThan(0);

    // Check for proper form labels
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });
});
