import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { BibleTranslation } from '../../types/memorization';
import { SCRIPTURE_ATTRIBUTION_NOTICES } from '../../lib/memorization/scripture-attributions';

const LINK_CLASS =
  'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline';

@Component({
  selector: 'app-scripture-attribution',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      data-testid="scripture-attribution"
      [class]="wrapperClass"
    >
      <p [class]="textClass">
        <span>{{ notice.text }}</span>
        @if (notice.links.length) {
          @for (link of notice.links; track link.href; let i = $index) {
            @if (i > 0) {
              <span> and </span>
            } @else {
              <span> </span>
            }
            <a
              [href]="link.href"
              target="_blank"
              rel="noopener noreferrer"
              [class]="linkClass"
            >
              {{ link.label }}
            </a>
          }
          <span>{{ notice.suffix ?? '' }}</span>
        }
      </p>
    </div>
  `,
})
export class ScriptureAttributionComponent {
  @Input({ required: true }) translation!: BibleTranslation;
  @Input() variant: 'inline' | 'privacy' = 'inline';

  readonly linkClass = LINK_CLASS;

  get wrapperClass(): string {
    return this.variant === 'privacy'
      ? ''
      : 'mt-2 pt-1.5 border-t border-gray-100/80 dark:border-gray-700/40';
  }

  get textClass(): string {
    return this.variant === 'privacy'
      ? 'text-sm text-gray-600 dark:text-gray-300'
      : 'w-full text-[10px] leading-snug text-gray-400/90 dark:text-gray-500/90';
  }

  get notice() {
    return SCRIPTURE_ATTRIBUTION_NOTICES[this.translation];
  }
}
