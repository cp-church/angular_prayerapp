import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { MemorizeListenControlsDialogComponent } from './memorize-listen-controls-dialog.component';

describe('MemorizeListenControlsDialogComponent', () => {
  it('does not render when closed', async () => {
    await render(MemorizeListenControlsDialogComponent, { componentInputs: { open: false } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders controls when open', async () => {
    await render(MemorizeListenControlsDialogComponent, {
      componentInputs: {
        open: true,
        primaryLabel: 'Pause',
        repeatListenOn: true,
        listenPlaybackRate: 1.5,
      },
    });
    expect(screen.getByRole('dialog', { name: /Listen/i })).toBeTruthy();
    expect(screen.getByTestId('memorize-listen-passage').textContent).toContain('Pause');
    expect(screen.getByTestId('memorize-listen-repeat').textContent).toContain('Repeat on');
  });

  it('emits primaryClick and repeatToggle', async () => {
    const user = userEvent.setup();
    const primaryClick = vi.fn();
    const repeatToggle = vi.fn();
    const { fixture } = await render(MemorizeListenControlsDialogComponent, {
      componentInputs: { open: true },
    });
    fixture.componentInstance.primaryClick.subscribe(primaryClick);
    fixture.componentInstance.repeatToggle.subscribe(repeatToggle);

    await user.click(screen.getByTestId('memorize-listen-passage'));
    await user.click(screen.getByTestId('memorize-listen-repeat'));
    expect(primaryClick).toHaveBeenCalledOnce();
    expect(repeatToggle).toHaveBeenCalledOnce();
  });

  it('emits close from close button and backdrop click', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const { fixture } = await render(MemorizeListenControlsDialogComponent, {
      componentInputs: { open: true },
    });
    fixture.componentInstance.close.subscribe(close);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalledOnce();

    close.mockClear();
    const backdrop = fixture.nativeElement.querySelector('[role="presentation"]') as HTMLElement;
    await user.click(backdrop);
    expect(close).toHaveBeenCalledOnce();
  });

  it('emits speedSelect when speed changes', async () => {
    const user = userEvent.setup();
    const speedSelect = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40, x: 0, y: 0, toJSON: () => ({}),
    });
    const { fixture } = await render(MemorizeListenControlsDialogComponent, {
      componentInputs: { open: true, listenPlaybackRate: 1 },
    });
    fixture.componentInstance.speedSelect.subscribe(speedSelect);

    await user.click(screen.getByTestId('memorize-listen-speed'));
    await user.click(screen.getByTestId('memorize-listen-speed-option-1.25'));
    expect(speedSelect).toHaveBeenCalledWith(1.25);
  });

  it('attaches backdrop touch handler when opened', async () => {
    const close = vi.fn();
    const { fixture } = await render(MemorizeListenControlsDialogComponent, {
      componentInputs: { open: true },
    });
    fixture.componentInstance.close.subscribe(close);
    fixture.detectChanges();
    await new Promise((r) => requestAnimationFrame(r));

    const backdrop = fixture.nativeElement.querySelector('[role="presentation"]') as HTMLElement;
    const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: backdrop });
    backdrop.dispatchEvent(event);
    expect(close).toHaveBeenCalled();
  });
});
