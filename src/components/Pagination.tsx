interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ total, page, limit, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));

  const btnStyle = (disabled: boolean) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
    fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'transparent', color: disabled ? 'var(--border)' : 'var(--text-muted)',
    border: '1px solid var(--border)', opacity: disabled ? 0.5 : 1,
  } as React.CSSProperties);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, padding: 16, borderTop: '1px solid var(--border)',
        fontSize: 13, color: 'var(--text-muted)',
      }}
    >
      <span>{total} total</span>
      <button
        style={btnStyle(page <= 1)}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹ Prev
      </button>
      <span>Page {page} / {pages}</span>
      <button
        style={btnStyle(page >= pages)}
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next ›
      </button>
    </div>
  );
}

// React import for CSSProperties
import type React from 'react';
