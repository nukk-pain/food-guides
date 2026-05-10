/**
 * Default marker popup builder: bold name on top, optional dim subtitle below.
 * Each guide can compose its own subtitle (post office name, sbiz id, etc.).
 */
export function buildPopupHtml(name: string, subtitle?: string): string {
  if (subtitle) return `<strong>${escapeHtml(name)}</strong><br><small>${escapeHtml(subtitle)}</small>`
  return `<strong>${escapeHtml(name)}</strong>`
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
