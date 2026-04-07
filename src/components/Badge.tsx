interface BadgeProps {
  value: string | undefined | null;
}

const COLOR_MAP: Record<string, { bg: string; color: string }> = {
  available:   { bg: 'rgba(34,197,94,.15)',   color: 'var(--success)' },
  approved:    { bg: 'rgba(34,197,94,.15)',   color: 'var(--success)' },
  active:      { bg: 'rgba(34,197,94,.15)',   color: 'var(--success)' },
  pending:     { bg: 'rgba(245,158,11,.15)',  color: 'var(--warning)' },
  claimed:     { bg: 'rgba(99,102,241,.15)',  color: 'var(--accent)'  },
  collected:   { bg: 'rgba(59,130,246,.15)',  color: 'var(--info)'    },
  rejected:    { bg: 'rgba(239,68,68,.15)',   color: 'var(--danger)'  },
  expired:     { bg: 'rgba(148,163,184,.15)', color: 'var(--text-muted)' },
  suspended:   { bg: 'rgba(239,68,68,.15)',   color: 'var(--danger)'  },
  inactive:    { bg: 'rgba(148,163,184,.15)', color: 'var(--text-muted)' },
  user:        { bg: 'rgba(59,130,246,.15)',  color: 'var(--info)'    },
  venue_staff: { bg: 'rgba(99,102,241,.15)',  color: 'var(--accent)'  },
  venue_admin: { bg: 'rgba(245,158,11,.15)',  color: 'var(--warning)' },
  admin:       { bg: 'rgba(239,68,68,.15)',   color: 'var(--danger)'  },
  completed:   { bg: 'rgba(34,197,94,.15)',   color: 'var(--success)' },
  failed:      { bg: 'rgba(239,68,68,.15)',   color: 'var(--danger)'  },
  refunded:    { bg: 'rgba(148,163,184,.15)', color: 'var(--text-muted)' },
};

export function Badge({ value }: BadgeProps) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const style = COLOR_MAP[value] ?? { bg: 'rgba(148,163,184,.15)', color: 'var(--text-muted)' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        background: style.bg,
        color: style.color,
      }}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export function ActiveBadge({ value }: { value: boolean }) {
  return <Badge value={value ? 'active' : 'inactive'} />;
}
