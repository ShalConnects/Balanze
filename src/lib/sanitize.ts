import DOMPurify from 'dompurify';

/** Sanitize HTML for safe use with dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/** Escape text for safe interpolation into HTML templates (e.g. print windows). */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
