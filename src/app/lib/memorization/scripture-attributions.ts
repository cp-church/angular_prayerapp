import type { BibleTranslation } from '../../types/memorization';
import { ESV_COPYRIGHT_NOTICE, ESV_ORG_URL } from './esv-copyright';

export interface ScriptureAttributionLink {
  label: string;
  href: string;
}

/** Inline copyright notice shown with passage text in Memorize practice / intro. */
export interface ScriptureAttributionNotice {
  text: string;
  links: ScriptureAttributionLink[];
  /** Punctuation or words after the last link (e.g. NIV ends with a period). */
  suffix?: string;
}

/**
 * Publisher / API.Bible attribution text.
 * API.Bible translations: [API.Bible Terms Appendix B](https://api.bible/terms-and-conditions)
 * and publisher “permission to quote” pages (Lockman, LSBible.org, etc.).
 * ESV: [Crossway ESV API](https://api.esv.org).
 */
export const SCRIPTURE_ATTRIBUTION_NOTICES: Record<BibleTranslation, ScriptureAttributionNotice> =
  {
    esv: {
      text: ESV_COPYRIGHT_NOTICE,
      links: [{ label: 'www.esv.org', href: ESV_ORG_URL }],
    },
    kjv: {
      text: 'Scripture quotations taken from the King James Version (KJV) of the Holy Bible, which is in the public domain.',
      links: [],
    },
    nasb: {
      text: 'Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved.',
      links: [{ label: 'www.lockman.org', href: 'https://www.lockman.org' }],
    },
    lsb: {
      text: 'Scripture quotations taken from the (LSB®) Legacy Standard Bible®, Copyright © 2021 by The Lockman Foundation. Used by permission. All rights reserved. Managed in partnership with Three Sixteen Publishing Inc.',
      links: [
        { label: 'LSBible.org', href: 'https://www.lsbible.org' },
        { label: '316publishing.com', href: 'https://316publishing.com' },
      ],
    },
    niv: {
      text: 'The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by Permission of Biblica, Inc.® All rights reserved worldwide. To learn more, visit',
      links: [
        { label: 'biblica.com', href: 'https://www.biblica.com' },
        { label: 'facebook.com/Biblica', href: 'https://www.facebook.com/Biblica' },
      ],
      suffix: '.',
    },
    nlt: {
      text: 'Holy Bible, New Living Translation, Copyright © 2014 by Tyndale House Publishers. All rights reserved.',
      links: [{ label: 'tyndale.com', href: 'https://www.tyndale.com' }],
    },
    csb: {
      text: 'Scripture quotations taken from the Christian Standard Bible®. Christian Standard Bible® and CSB® are federally registered trademarks of Holman Bible Publishers. Copyright © 2017 by Holman Bible Publishers. Used by permission. All rights reserved.',
      links: [{ label: 'bhpublishinggroup.com', href: 'https://bhpublishinggroup.com' }],
    },
  };

/** Full ESV notice for the privacy / copyright page (includes 500-verse limitation). */
export { ESV_COPYRIGHT_NOTICE, ESV_ORG_URL };

/** API.Bible-sourced translations for the privacy page copyright section. */
export const API_BIBLE_ATTRIBUTION_TRANSLATIONS = [
  'kjv',
  'nasb',
  'lsb',
  'niv',
  'nlt',
  'csb',
] as const satisfies readonly BibleTranslation[];
