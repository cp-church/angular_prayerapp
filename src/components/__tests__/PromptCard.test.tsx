import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptCard } from '../PromptCard';

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

describe('PromptCard Component', () => {
  const mockPrompt = {
    id: '1',
    title: 'Daily Prayer',
    type: 'Guidance' as const,
    description: 'Take time to seek God\'s guidance for your day',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockOnDelete = vi.fn();
  const mockOnTypeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming delete
  });

  it('renders prompt details correctly', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
      />
    );

    expect(screen.getByText('Daily Prayer')).toBeInTheDocument();
    expect(screen.getByText('Take time to seek God\'s guidance for your day')).toBeInTheDocument();
    expect(screen.getByText('Guidance')).toBeInTheDocument();
  });

  it('displays type badge with correct styling', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    expect(typeButton).toHaveClass('bg-gray-100');
    expect(typeButton).toHaveClass('text-gray-700');
  });

  it('shows selected type badge styling when isTypeSelected is true', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
        isTypeSelected={true}
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    expect(typeButton).toHaveClass('bg-[#988F83]');
    expect(typeButton).toHaveClass('text-white');
  });

  it('calls onTypeClick when type button is clicked', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
        onTypeClick={mockOnTypeClick}
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    fireEvent.click(typeButton);

    expect(mockOnTypeClick).toHaveBeenCalledWith('Guidance');
  });

  it('shows delete button for admin users', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('hides delete button for non-admin users', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.queryByRole('button', { name: /delete prompt/i });
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('hides delete button when onDelete is not provided', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
      />
    );

    const deleteButton = screen.queryByRole('button', { name: /delete prompt/i });
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this prayer prompt?');
  });

  it('calls onDelete when confirmation is accepted', async () => {
    mockOnDelete.mockResolvedValue(undefined);
    mockConfirm.mockReturnValue(true);

    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });
  });

  it('does not call onDelete when confirmation is cancelled', () => {
    mockConfirm.mockReturnValue(false);

    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('handles delete error gracefully', async () => {
    mockOnDelete.mockRejectedValue(new Error('Delete failed'));
    mockConfirm.mockReturnValue(true);

    // Mock console.error to avoid test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting prompt:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('applies correct CSS classes for card styling', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
      />
    );

    const card = screen.getByText('Daily Prayer').closest('.prompt-card');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('dark:bg-gray-800');
    expect(card).toHaveClass('!border-[#988F83]');
  });

  it('displays lightbulb icon', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
      />
    );

    // Check for the Lightbulb icon by looking for an SVG with the appropriate title or structure
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays tag icon in type badge', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
      />
    );

    // Check that there are multiple icons (lightbulb + tag)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(1);
  });

  it('preserves whitespace in description', () => {
    const promptWithWhitespace = {
      ...mockPrompt,
      description: 'Line 1\nLine 2\n  Indented line'
    };

    render(
      <PromptCard
        prompt={promptWithWhitespace}
        isAdmin={false}
      />
    );

    const description = screen.getByText((content, element) => {
      return element?.textContent === 'Line 1\nLine 2\n  Indented line';
    });
    expect(description).toHaveClass('whitespace-pre-wrap');
  });

  it('has correct accessibility attributes', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={true}
        onDelete={mockOnDelete}
        onTypeClick={mockOnTypeClick}
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    expect(typeButton).toHaveAttribute('title', 'Filter by Guidance');

    const deleteButton = screen.getByRole('button', { name: /delete prompt/i });
    expect(deleteButton).toHaveAttribute('title', 'Delete prompt');
  });

  it('shows correct title for selected type button', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
        onTypeClick={mockOnTypeClick}
        isTypeSelected={true}
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    expect(typeButton).toHaveAttribute('title', 'Remove Guidance filter');
  });

  it('handles missing onTypeClick gracefully', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        isAdmin={false}
        // onTypeClick is intentionally omitted
      />
    );

    const typeButton = screen.getByRole('button', { name: /guidance/i });
    // Should not throw error when clicked
    expect(() => fireEvent.click(typeButton)).not.toThrow();
  });

  it('renders with different prompt types', () => {
    const differentTypePrompt = {
      ...mockPrompt,
      type: 'Thanksgiving' as const
    };

    render(
      <PromptCard
        prompt={differentTypePrompt}
        isAdmin={false}
      />
    );

    expect(screen.getByText('Thanksgiving')).toBeInTheDocument();
  });

  it('maintains card structure with long descriptions', () => {
    const longDescriptionPrompt = {
      ...mockPrompt,
      description: 'A'.repeat(500) // Very long description
    };

    render(
      <PromptCard
        prompt={longDescriptionPrompt}
        isAdmin={false}
      />
    );

    const description = screen.getByText('A'.repeat(500));
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('whitespace-pre-wrap');
  });
});
