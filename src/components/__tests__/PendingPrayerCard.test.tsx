import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PendingPrayerCard } from '../PendingPrayerCard';
import { lookupPersonByEmail } from '../../lib/planningcenter';

// Mock the Planning Center library
vi.mock('../../lib/planningcenter', () => ({
  lookupPersonByEmail: vi.fn(),
  formatPersonName: vi.fn((person) => {
    if (person && person.attributes) {
      return `${person.attributes.first_name} ${person.attributes.last_name}`;
    }
    return 'John Doe';
  })
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
    // Default mock implementation for Planning Center lookup
    vi.mocked(lookupPersonByEmail).mockResolvedValue({ people: [] });
  });

  afterEach(() => {
    // Clean up
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

  // Additional tests to improve coverage

  it('handles error when approve fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnApprove.mockRejectedValue(new Error('Approval failed'));

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    await fireEvent.click(approveButton);

    // Give it a moment for the error to be logged
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('handles error when deny fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnDeny.mockRejectedValue(new Error('Denial failed'));

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

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(/Explain why this prayer request cannot be approved.../);
    fireEvent.change(reasonTextarea, { target: { value: 'Inappropriate content' } });

    // Submit
    const confirmButton = screen.getByRole('button', { name: /confirm denial/i });
    await fireEvent.click(confirmButton);

    // Give it a moment for the error to be logged
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('calls onDeny with correct parameters when deny form is submitted', async () => {
    mockOnDeny.mockResolvedValue(undefined);

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

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(/Explain why this prayer request cannot be approved.../);
    fireEvent.change(reasonTextarea, { target: { value: 'Test denial reason' } });

    // Submit
    const confirmButton = screen.getByRole('button', { name: /confirm denial/i });
    await fireEvent.click(confirmButton);

    // Give it a moment for the callback to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnDeny).toHaveBeenCalledWith('1', 'Test denial reason');
  });

  it('handles error when edit fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnEdit.mockRejectedValue(new Error('Edit failed'));

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

    // Submit without changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await fireEvent.click(saveButton);

    // Give it a moment for the error to be logged
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('calls onEdit with correct parameters when edit form is submitted', async () => {
    mockOnEdit.mockResolvedValue(undefined);

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

    // Modify fields
    const descriptionTextarea = screen.getByDisplayValue('Please pray for healing');
    fireEvent.change(descriptionTextarea, { target: { value: 'Updated prayer request' } });

    const requesterInput = screen.getByDisplayValue('Jane Smith');
    fireEvent.change(requesterInput, { target: { value: 'Updated Requester' } });

    const prayerForInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(prayerForInput, { target: { value: 'Updated Person' } });

    const emailInput = screen.getByDisplayValue('jane@example.com');
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

    // Submit
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await fireEvent.click(saveButton);

    // Give it a moment for the callback to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnEdit).toHaveBeenCalledWith('1', {
      title: 'Prayer for Updated Person',
      description: 'Updated prayer request',
      requester: 'Updated Requester',
      prayer_for: 'Updated Person',
      email: 'updated@example.com'
    });
  });

  it('shows Planning Center person when lookup succeeds', async () => {
    const mockPerson = {
      id: '123',
      type: 'Person',
      attributes: {
        first_name: 'John',
        last_name: 'Doe'
      }
    };

    vi.mocked(lookupPersonByEmail).mockResolvedValue({ people: [mockPerson] });

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Wait for Planning Center lookup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify the lookup was called
    expect(lookupPersonByEmail).toHaveBeenCalledWith('jane@example.com');
    
    // Check that the PC success indicator is displayed (green badge)
    const pcElements = screen.queryAllByText((content, element) => {
      return element?.textContent?.includes('Planning Center:') || false;
    });
    expect(pcElements.length).toBeGreaterThan(0);
  });

  it('shows not in Planning Center when lookup returns no results', async () => {
    vi.mocked(lookupPersonByEmail).mockResolvedValue({ people: [] });

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Wait for Planning Center lookup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(screen.getByText(/Not in Planning Center/)).toBeInTheDocument();
  });

  it('shows error when Planning Center lookup fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(lookupPersonByEmail).mockRejectedValue(new Error('PC lookup failed'));

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    // Wait for Planning Center lookup to fail
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(screen.getByText(/\(PC lookup failed\)/)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state during Planning Center lookup', () => {
    // Mock a never-resolving promise to keep loading state
    vi.mocked(lookupPersonByEmail).mockImplementation(() => new Promise(() => {}));

    render(
      <PendingPrayerCard
        prayer={mockPrayer}
        onApprove={mockOnApprove}
        onDeny={mockOnDeny}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText(/Checking Planning Center.../)).toBeInTheDocument();
  });

  it('submits edit with null email when email field is empty', async () => {
    mockOnEdit.mockResolvedValue(undefined);

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

    // Clear email field
    const emailInput = screen.getByDisplayValue('jane@example.com');
    fireEvent.change(emailInput, { target: { value: '' } });

    // Submit
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await fireEvent.click(saveButton);

    // Give it a moment for the callback to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnEdit).toHaveBeenCalledWith('1', expect.objectContaining({
      email: null
    }));
  });
});
