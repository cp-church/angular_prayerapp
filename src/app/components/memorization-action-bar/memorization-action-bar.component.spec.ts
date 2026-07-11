import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { MemorizationActionBarComponent } from './memorization-action-bar.component';

describe('MemorizationActionBarComponent', () => {
  it('renders add buttons', async () => {
    await render(MemorizationActionBarComponent);
    expect(screen.getByRole('button', { name: /Add Verses/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Bible Books/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Recommended/i })).toBeTruthy();
  });

  it('emits addVerses when Add Verses is clicked', async () => {
    const user = userEvent.setup();
    const addVerses = vi.fn();
    const { fixture } = await render(MemorizationActionBarComponent);
    fixture.componentInstance.addVerses.subscribe(addVerses);

    await user.click(screen.getByRole('button', { name: /Add Verses/i }));
    expect(addVerses).toHaveBeenCalledOnce();
  });

  it('emits addBibleBooks when Bible Books is clicked', async () => {
    const user = userEvent.setup();
    const addBibleBooks = vi.fn();
    const { fixture } = await render(MemorizationActionBarComponent);
    fixture.componentInstance.addBibleBooks.subscribe(addBibleBooks);

    await user.click(screen.getByRole('button', { name: /Bible Books/i }));
    expect(addBibleBooks).toHaveBeenCalledOnce();
  });

  it('emits openRecommended when Recommended is clicked', async () => {
    const user = userEvent.setup();
    const openRecommended = vi.fn();
    const { fixture } = await render(MemorizationActionBarComponent);
    fixture.componentInstance.openRecommended.subscribe(openRecommended);

    await user.click(screen.getByRole('button', { name: /Recommended/i }));
    expect(openRecommended).toHaveBeenCalledOnce();
  });
});
