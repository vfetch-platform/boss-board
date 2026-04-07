export function fmt(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function trunc(s: string | undefined | null, len = 8): string {
  if (!s) return '—';
  return s.length > len ? s.slice(0, len) + '…' : s;
}

export async function copyText(text: string, onDone?: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone?.();
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); onDone?.(); } finally { document.body.removeChild(ta); }
  }
}

export function parseCoord(val: string): number | undefined {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : undefined;
}
