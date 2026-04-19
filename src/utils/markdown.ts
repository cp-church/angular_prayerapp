import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'ol',
  'ul',
  'li',
  'blockquote',
  'h3',
  'h4',
  'code',
  'pre',
  'a',
  'hr',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

function isSafeHref(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('javascript:')) return false;
  if (trimmed.startsWith('data:') && !trimmed.startsWith('data:text/plain')) return false;
  if (trimmed.startsWith('vbscript:')) return false;
  return true;
}

// Inline styles matter for email clients that ignore <style>/class rules.
// Kept in sync with `RichTextViewComponent` styles so in-app rendering looks the
// same whether the CSS class applies (DOM-rendered) or the inline style wins
// (email HTML). Tags without a visible default in email clients are styled here.
const INLINE_STYLES: Record<string, string> = {
  BLOCKQUOTE:
    'margin: 0.5rem 0; padding: 0.25rem 0.75rem; border-left: 3px solid rgba(57, 112, 77, 0.5); opacity: 0.9;',
  /** Email clients often ignore default `u` styling; matches `RichTextViewComponent` */
  U: 'text-decoration: underline;',
};

/**
 * TipTap's Underline mark serializes as ++text++. Common Markdown parsers do not
 * treat that as underline, so we expand to &lt;u&gt; before `marked` (skipping
 * fenced code blocks so literal ++ in code is preserved).
 */
function expandTiptapUnderlineForMarked(markdown: string): string {
  const segments = markdown.split(/(```[\s\S]*?```)/g);
  return segments
    .map((segment) => {
      if (segment.startsWith('```')) {
        return segment;
      }
      return segment.replace(/\+\+([\s\S]+?)\+\+/g, '<u>$1</u>');
    })
    .join('');
}

let hookInstalled = false;
function ensureDomPurifyHook(): void {
  if (hookInstalled) return;
  if (typeof DOMPurify.addHook !== 'function') return;
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (!isSafeHref(href)) {
        node.removeAttribute('href');
      } else {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    const inline = INLINE_STYLES[node.tagName];
    if (inline && !node.getAttribute('style')) {
      node.setAttribute('style', inline);
    }
  });
  hookInstalled = true;
}

export function markdownToSafeHtml(markdown: string | null | undefined): string {
  if (!markdown) return '';
  ensureDomPurifyHook();
  const preprocessed = expandTiptapUnderlineForMarked(markdown);
  const rawHtml = marked.parse(preprocessed, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ['style', 'class', 'id'],
    KEEP_CONTENT: true,
  });
}

/**
 * Strip markdown syntax to a human-readable plain text string.
 * Used for push notification bodies, email subject/preview lines, and
 * character-count heuristics (e.g. presentation pagination).
 */
export function markdownToPlainText(markdown: string | null | undefined): string {
  if (!markdown) return '';
  let text = String(markdown);
  // Code fences
  text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim());
  // Inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // Bold / italic / strikethrough / underline-ish markers
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/\+\+([\s\S]+?)\+\+/g, '$1');
  // Headings
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // Blockquote markers
  text = text.replace(/^\s{0,3}>\s?/gm, '');
  // List bullets / numbers
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  // Collapse >2 blank lines
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
