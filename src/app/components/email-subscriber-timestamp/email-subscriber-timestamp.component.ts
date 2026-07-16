import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-subscriber-timestamp',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (value) {
      <p
        class="text-xs text-gray-500 dark:text-gray-500 tabular-nums whitespace-nowrap sm:hidden"
        [title]="titlePrefix + (value | date:'medium')"
        data-testid="email-subscriber-timestamp-mobile"
      >
        {{ value | date:'short' }}
      </p>
      <div
        class="hidden sm:flex sm:flex-col sm:leading-tight tabular-nums"
        [title]="titlePrefix + (value | date:'medium')"
        data-testid="email-subscriber-timestamp-desktop"
      >
        <span class="text-xs text-gray-500 dark:text-gray-500">{{ value | date:'shortDate' }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-500">{{ value | date:'shortTime' }}</span>
      </div>
    } @else {
      <p
        class="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap"
        [title]="emptyTitle"
        data-testid="email-subscriber-timestamp-empty"
      >
        {{ emptyLabel }}
      </p>
    }
  `,
})
export class EmailSubscriberTimestampComponent {
  @Input() value: string | Date | null | undefined = null;
  @Input({ required: true }) titlePrefix!: string;
  @Input() emptyLabel = 'No activity';
  @Input() emptyTitle = 'User has not accessed the portal yet';
}
