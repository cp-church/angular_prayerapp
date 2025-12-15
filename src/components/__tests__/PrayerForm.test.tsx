import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrayerForm } from '../PrayerForm';
import * as userInfoStorage from '../../utils/userInfoStorage';

// Mock the user info storage
vi.mock('../../utils/userInfoStorage', () => ({
  getUserInfo: vi.fn(),
  saveUserInfo: vi.fn()
}));

describe('PrayerForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userInfoStorage.getUserInfo).mockReturnValue({
      firstName: '',
      lastName: '',
      email: ''
    });
  });

  afterEach(() => {
    // Ensure any pending timers are cleared to avoid state updates after teardown
    vi.clearAllTimers();
  });

  it('renders when isOpen is true', () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('New Prayer Request')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays all required form fields', () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByPlaceholderText('First name')).toBeDefined();
    expect(screen.getByPlaceholderText('Last name')).toBeDefined();
    expect(screen.getByPlaceholderText('Your email address')).toBeDefined();
    expect(screen.getByPlaceholderText('Who or what this prayer is for')).toBeDefined();
    expect(screen.getByPlaceholderText('Describe the prayer request in detail')).toBeDefined();
  });

  it('loads saved user info on mount', async () => {
    vi.mocked(userInfoStorage.getUserInfo).mockReturnValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    await waitFor(() => {
      const firstNameInput = screen.getByPlaceholderText('First name') as HTMLInputElement;
      const lastNameInput = screen.getByPlaceholderText('Last name') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('Your email address') as HTMLInputElement;

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
    });
  });

  it('updates form fields when user types', () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const prayerForInput = screen.getByPlaceholderText('Who or what this prayer is for') as HTMLInputElement;
    fireEvent.change(prayerForInput, { target: { value: 'My friend' } });

    expect(prayerForInput.value).toBe('My friend');
  });

  it('handles anonymous checkbox toggle', () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const checkbox = screen.getByLabelText(/make this prayer anonymous/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('calls onCancel when Done button is clicked', async () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const doneButton = screen.getByRole('button', { name: /done/i });
    // wrap the click in act to ensure React state updates are flushed during the test
  act(() => {
      fireEvent.click(doneButton);
    });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('submits form with correct data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('First name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText('Last name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), {
      target: { value: 'My healing' }
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), {
      target: { value: 'Please pray for my recovery' }
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    // clicking the submit button triggers async state updates; wrap in act
  act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.prayer_for).toBe('My healing');
    expect(submittedData.description).toBe('Please pray for my recovery');
    expect(submittedData.requester).toBe('John Doe');
    expect(submittedData.email).toBe('john@example.com');
  });

  it('saves user info when form is filled and submitted', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const firstNameInput = screen.getByPlaceholderText('First name');
    const lastNameInput = screen.getByPlaceholderText('Last name');
    const emailInput = screen.getByPlaceholderText('Your email address');
    const prayerForInput = screen.getByPlaceholderText('Who or what this prayer is for');
    const descriptionInput = screen.getByPlaceholderText('Describe the prayer request in detail');

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(prayerForInput, { target: { value: 'Family' } });
    fireEvent.change(descriptionInput, { target: { value: 'Prayers for healing' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    // wrap submission to ensure component state updates are flushed
  act(() => {
      fireEvent.click(submitButton);
    });

    // saveUserInfo should be called during submission
    await waitFor(() => {
      expect(vi.mocked(userInfoStorage.saveUserInfo)).toHaveBeenCalledWith('Jane', 'Smith', 'jane@example.com');
    }, { timeout: 3000 });
  });

  it('resets form after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    const firstNameInput = screen.getByPlaceholderText('First name');
    const lastNameInput = screen.getByPlaceholderText('Last name');
    const emailInput = screen.getByPlaceholderText('Your email address');
    const prayerForInput = screen.getByPlaceholderText('Who or what this prayer is for') as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText('Describe the prayer request in detail') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(prayerForInput, { target: { value: 'Test' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
  act(() => {
      fireEvent.click(submitButton);
    });

    // Wait for submission to complete and form to reset
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Form should clear prayer_for and description (but keeps email)
    await waitFor(() => {
      expect(prayerForInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    }, { timeout: 3000 });
  });

  it('handles submission errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), {
      target: { value: 'Test' }
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
  act(() => {
      fireEvent.click(submitButton);
    });

    // Wait for error handling
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add prayer:', expect.any(Error));
    }, { timeout: 3000 });

    consoleErrorSpy.mockRestore();
  });

  it('shows success message after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    act(() => {
      fireEvent.click(submitButton);
    });

    // Wait for success message to appear
    await waitFor(() => {
      expect(screen.getByText('Prayer request submitted successfully!')).toBeDefined();
    });
  });

  it('shows success state after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for success state to show
    await waitFor(() => {
      expect(screen.getByText('Prayer request submitted successfully!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submitted/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('disables submit button during submission', async () => {
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>(resolve => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockImplementation(() => submitPromise);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    // Submit button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    });

    // Resolve the submission
    resolveSubmit!();

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('does not submit when required fields are empty', async () => {
    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    act(() => {
      fireEvent.click(submitButton);
    });

    // Should not call onSubmit if required fields are empty
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('shows correct button text during submission', async () => {
    // Avoid delayed timers in tests to prevent async state updates after teardown
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <PrayerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Your email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Who or what this prayer is for'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the prayer request in detail'), { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    act(() => {
      fireEvent.click(submitButton);
    });

    // Button text should change during submission
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDefined();

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
