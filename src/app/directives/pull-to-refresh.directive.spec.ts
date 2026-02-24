import { NgZone } from '@angular/core';
import { PullToRefreshDirective } from './pull-to-refresh.directive';

describe('PullToRefreshDirective', () => {
  let directive: PullToRefreshDirective;
  let element: HTMLElement;
  let zone: NgZone;

  beforeEach(() => {
    element = document.createElement('div');
    // Ensure scrollTop is defined
    Object.defineProperty(element, 'scrollTop', {
      value: 0,
      writable: true
    });

    zone = new NgZone({ enableLongStackTrace: false });
    directive = new PullToRefreshDirective({ nativeElement: element } as any, zone);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should emit refresh when pulled down beyond threshold at top', (done) => {
    directive.refresh.subscribe(() => {
      done();
    });

    // Simulate touch start at y=0
    directive.onTouchStart({
      touches: [{ clientY: 0 }] as any
    } as TouchEvent);

    // Simulate touch move beyond threshold
    directive.onTouchMove({
      touches: [{ clientY: 100 }] as any
    } as TouchEvent);
  });

  it('should not emit refresh when disabled', () => {
    const spy = jest.fn();
    directive.refresh.subscribe(spy);
    directive.appPullToRefreshDisabled = true;

    directive.onTouchStart({
      touches: [{ clientY: 0 }] as any
    } as TouchEvent);

    directive.onTouchMove({
      touches: [{ clientY: 100 }] as any
    } as TouchEvent);

    expect(spy).not.toHaveBeenCalled();
  });
}

