import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { EmailSubscriberTimestampComponent } from './email-subscriber-timestamp.component';

describe('EmailSubscriberTimestampComponent', () => {
  it('renders mobile one-line and desktop stacked timestamps when value is set', async () => {
    await render(EmailSubscriberTimestampComponent, {
      componentInputs: {
        value: '2024-06-15T14:30:00Z',
        titlePrefix: 'Joined: ',
      },
    });
    expect(screen.getByTestId('email-subscriber-timestamp-mobile')).toBeTruthy();
    expect(screen.getByTestId('email-subscriber-timestamp-desktop')).toBeTruthy();
    expect(screen.queryByTestId('email-subscriber-timestamp-empty')).toBeNull();
  });

  it('renders empty state when value is missing', async () => {
    await render(EmailSubscriberTimestampComponent, {
      componentInputs: {
        value: null,
        titlePrefix: 'Last active: ',
      },
    });
    expect(screen.getByTestId('email-subscriber-timestamp-empty').textContent?.trim()).toBe(
      'No activity'
    );
    expect(screen.queryByTestId('email-subscriber-timestamp-mobile')).toBeNull();
    expect(screen.queryByTestId('email-subscriber-timestamp-desktop')).toBeNull();
  });
});
