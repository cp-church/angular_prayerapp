import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ESV_COPYRIGHT_NOTICE, ESV_ORG_URL } from '../../lib/memorization/esv-copyright';

const LINK_CLASS =
  'text-inherit underline underline-offset-2 decoration-gray-300/80 dark:decoration-gray-600/80 hover:decoration-gray-400 dark:hover:decoration-gray-500';

@Component({
  selector: 'app-scripture-attribution',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      data-testid="scripture-attribution"
      class="mt-2 pt-1.5 border-t border-gray-100/80 dark:border-gray-700/40"
    >
      <p
        class="w-full text-[10px] leading-snug text-gray-400/90 dark:text-gray-500/90"
      >
        {{ esvNotice }}
        <a
          [href]="esvOrgUrl"
          target="_blank"
          rel="noopener noreferrer"
          [class]="linkClass"
        >
          www.esv.org
        </a>
      </p>
    </div>
  `,
})
export class ScriptureAttributionComponent {
  readonly linkClass = LINK_CLASS;
  readonly esvNotice = ESV_COPYRIGHT_NOTICE;
  readonly esvOrgUrl = ESV_ORG_URL;
}
