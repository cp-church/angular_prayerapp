import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PendingPrayerCard } from '../PendingPrayerCard';

// Mock the Planning Center library
vi.mock('../../lib/planningcenter', () => ({
  lookupPersonByEmail: vi.fn(),
  formatPersonName: vi.fn(() => 'John Doe')
}));

describe('PendingPrayerCard Component', () => {
  const mockPrayer = {
    id: '1',
    title: 'Prayer for John',
    prayer_for: 'John Doe',
    description: 'Please pray for healing',
    requester: 'Jane Smith',
    email: 'jane@example.com',
    status: 'current' as const,
    date_requested: new Date().toISOString(),
    is_anonymous: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockOnApprove = vi.fn();
  const mockOnDeny = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders prayer details correctly', () => {
    const prayerWithoutEmail = { ...mockPrayer, email: undefined as unknown as string };

    render(
      <PendingPrayerCard
        prayer={prayerWithoutEmail}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Prayer for John Doe')).toBeInTheDocument();
    expect(screen.getByText('Please pray for healing')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Email:')).not.toBeInTheDocument();
  });

  it('shows anonymous indicator when prayer is anonymous', () => {
    const anonymousPrayer = { ...mockPrayer, is_anonymous: true };

    render(
      <PendingPrayerCard
        prayer={anonymousPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('(Anonymous Request)')).toBeInTheDocument();
  });

  it('shows action buttons when not editing', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deny/i })).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    mockOnApprove.mockResolvedValue(undefined);

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith('1');
  });

  it('shows deny form when deny button is clicked', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const denyButton = screen.getByRole('button', { name: /deny/i });
    fireEvent.click(denyButton);

    expect(screen.getByText('Reason for denial (required):')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm denial/i })).toBeInTheDocument();
  });

  it('does not submit deny form without reason', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Open deny form
    const denyButton = screen.getByRole('button', { name: /deny/i });
    fireEvent.click(denyButton);

    // Try to submit without reason
    const confirmButton = screen.getByRole('button', { name: /confirm denial/i });
    fireEvent.click(confirmButton);

    expect(mockOnDeny).not.toHaveBeenCalled();
  });

  it('shows edit form when edit button is clicked', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Please pray for healing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
  });

  it('pre-fills edit form with current prayer data', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Please pray for healing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
  });

  it('resets edit form when cancel is clicked', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Modify a field
    const descriptionTextarea = screen.getByDisplayValue('Please pray for healing');
    fireEvent.change(descriptionTextarea, { target: { value: 'Modified description' } });

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Should go back to view mode with original data
    expect(screen.getByText('Please pray for healing')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Modified description')).not.toBeInTheDocument();
  });

  it('validates required fields in edit form', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Clear required fields by finding them by their current values
    const descriptionTextarea = screen.getByDisplayValue('Please pray for healing');
    const requesterInput = screen.getByDisplayValue('Jane Smith');
    const prayerForInput = screen.getByDisplayValue('John Doe');

    fireEvent.change(descriptionTextarea, { target: { value: '' } });
    fireEvent.change(requesterInput, { target: { value: '' } });
    fireEvent.change(prayerForInput, { target: { value: '' } });

    // Try to submit
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('disables all buttons during loading operations', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Start an approve operation
    mockOnApprove.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    // All buttons should be disabled
    expect(approveButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /deny/i })).toBeDisabled();
  });

  it('formats date correctly', () => {
    const prayerWithDate = {
      ...mockPrayer,
      date_requested: '2023-12-14T15:30:00Z'
    };

    render(
      <PendingPrayerCard
        prayer={prayerWithDate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Should show formatted date
    expect(screen.getByText(/Requested/)).toBeInTheDocument();
  });

  it('hides email section when no email provided', () => {
    const prayerWithoutEmail = { 
      ...mockPrayer, 
      email: undefined as unknown as string
    };

    render(
      <PendingPrayerCard
        prayer={prayerWithoutEmail}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Email:')).not.toBeInTheDocument();
    expect(screen.queryByText('Checking Planning Center...')).not.toBeInTheDocument();
  });

  it('handles cancel deny form', () => {
    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Open deny form
    const denyButton = screen.getByRole('button', { name: /deny/i });
    fireEvent.click(denyButton);

    expect(screen.getByText('Reason for denial (required):')).toBeInTheDocument();

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Reason for denial (required):')).not.toBeInTheDocument();
  });
});
