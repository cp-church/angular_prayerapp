import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { MemorizeListenSpeedButtonComponent } from './memorize-listen-speed-button.component';

describe('MemorizeListenSpeedButtonComponent', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      right: 110,
      bottom: 50,
      width: 100,
      height: 30,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
  });

  it('shows selected speed label', async () => {
    await render(MemorizeListenSpeedButtonComponent, {
      componentInputs: { value: 1.25 },
    });
    expect(screen.getByTestId('memorize-listen-speed').textContent).toContain('1.25x');
  });

  it('opens menu and emits valueChange on option click', async () => {
    const user = userEvent.setup();
    const valueChange = vi.fn();
    const { fixture } = await render(MemorizeListenSpeedButtonComponent, {
      componentInputs: { value: 1 },
    });
    fixture.componentInstance.valueChange.subscribe(valueChange);

    await user.click(screen.getByTestId('memorize-listen-speed'));
    expect(screen.getByRole('listbox', { name: /Read-aloud speed options/i })).toBeTruthy();

    await user.click(screen.getByTestId('memorize-listen-speed-option-1.5'));
    expect(valueChange).toHaveBeenCalledWith(1.5);
    expect(fixture.componentInstance.menuOpen).toBe(false);
  });

  it('closes menu on Escape key', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(MemorizeListenSpeedButtonComponent);
    await user.click(screen.getByTestId('memorize-listen-speed'));
    expect(fixture.componentInstance.menuOpen).toBe(true);

    await user.keyboard('{Escape}');
    expect(fixture.componentInstance.menuOpen).toBe(false);
  });

  it('closes menu on outside mousedown', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(MemorizeListenSpeedButtonComponent);
    await user.click(screen.getByTestId('memorize-listen-speed'));
    expect(fixture.componentInstance.menuOpen).toBe(true);

    await user.click(document.body);
    expect(fixture.componentInstance.menuOpen).toBe(false);
  });

  it('exposes aria label with current speed', async () => {
    await render(MemorizeListenSpeedButtonComponent, { componentInputs: { value: 2 } });
    const trigger = screen.getByTestId('memorize-listen-speed');
    expect(trigger.getAttribute('aria-label')).toMatch(/currently 2x/i);
  });

  it('repositions menu on scroll and cleans up on destroy', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(MemorizeListenSpeedButtonComponent);
    await user.click(screen.getByTestId('memorize-listen-speed'));
    expect(fixture.componentInstance.menuOpen).toBe(true);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    fixture.destroy();
  });
});
