import DOMPurify from 'dompurify';

/** Sanitize HTML for safe use with dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
