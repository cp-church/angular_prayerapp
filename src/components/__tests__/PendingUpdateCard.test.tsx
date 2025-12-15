import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PendingUpdateCard } from '../PendingUpdateCard';

// Mock the Planning Center library
vi.mock('../../lib/planningcenter', () => ({
  lookupPersonByEmail: vi.fn(),
  formatPersonName: vi.fn(() => 'John Doe')
}));

describe('PendingUpdateCard Component', () => {
  const mockUpdate = {
    id: '1',
    prayer_id: '100',
    content: 'Great update on this prayer',
    author: 'Jane Smith',
    author_email: 'jane@example.com',
    created_at: new Date().toISOString(),
    prayer_title: 'Prayer for John Doe'
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

  it('renders update details correctly', () => {
    const updateWithoutEmail = { ...mockUpdate, author_email: undefined as unknown as string };

    render(
      <PendingUpdateCard
        update={updateWithoutEmail}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Prayer Update')).toBeInTheDocument();
    expect(screen.getByText('Great update on this prayer')).toBeInTheDocument();
    expect(screen.getByText('By Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Update for: Prayer for John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Email:')).not.toBeInTheDocument();
  });

  it('shows action buttons when not editing', () => {
    render(
      <PendingUpdateCard
        update={mockUpdate}
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
      <PendingUpdateCard
        update={mockUpdate}
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
      <PendingUpdateCard
        update={mockUpdate}
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
      <PendingUpdateCard
        update={mockUpdate}
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
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Great update on this prayer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
  });

  it('pre-fills edit form with current update data', () => {
    render(
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Great update on this prayer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
  });

  it('resets edit form when cancel is clicked', () => {
    render(
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Modify a field
    const contentTextarea = screen.getByDisplayValue('Great update on this prayer');
    fireEvent.change(contentTextarea, { target: { value: 'Modified content' } });

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Should go back to view mode with original data
    expect(screen.getByText('Great update on this prayer')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Modified content')).not.toBeInTheDocument();
  });

  it('disables all buttons during loading operations', () => {
    mockOnApprove.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Start an approve operation
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    // All buttons should be disabled during operation
    expect(approveButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /deny/i })).toBeDisabled();
  });

  it('formats date correctly', () => {
    const updateWithDate = {
      ...mockUpdate,
      created_at: '2023-12-14T15:30:00Z'
    };

    render(
      <PendingUpdateCard
        update={updateWithDate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Should show formatted date
    expect(screen.getByText(/Submitted/)).toBeInTheDocument();
  });

  it('hides prayer title when not provided', () => {
    const updateWithoutPrayerTitle = { ...mockUpdate, prayer_title: undefined };

    render(
      <PendingUpdateCard
        update={updateWithoutPrayerTitle}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Update for:')).not.toBeInTheDocument();
  });

  it('hides email section when no email provided', () => {
    const updateWithoutEmail = { ...mockUpdate, author_email: undefined as unknown as string };

    render(
      <PendingUpdateCard
        update={updateWithoutEmail}
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
      <PendingUpdateCard
        update={mockUpdate}
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

  it('shows mark as answered indicator when flag is set', () => {
    const updateWithMarkAsAnswered = { ...mockUpdate, mark_as_answered: true };

    render(
      <PendingUpdateCard
        update={updateWithMarkAsAnswered}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Will mark prayer as answered')).toBeInTheDocument();
  });

  it('hides edit button when onEdit is not provided', () => {
    render(
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        // onEdit is intentionally omitted
      />
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('shows cancel edit button when in editing mode', () => {
    render(
      <PendingUpdateCard
        update={mockUpdate}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
