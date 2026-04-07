'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { OverviewStats } from '@/types';

interface StatCard {
  label: string;
  value: number;
  sub?: string;
  color: string;
}

export default function DashboardPage() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch<OverviewStats>('GET', '/stats')
      .then((data) => {
        setCards([
          { label: 'Total Venues', value: data.venues.total, sub: `${data.venues.pending} pending`, color: 'var(--accent)' },
          { label: 'Approved Venues', value: data.venues.approved, sub: `${data.venues.suspended} suspended`, color: 'var(--success)' },
          { label: 'Total Items', value: data.items.total, sub: `${data.items.available} available`, color: 'var(--info)' },
          { label: 'Active Claims', value: data.claims.pending + data.claims.approved, sub: `${data.claims.collected} collected`, color: 'var(--warning)' },
          { label: 'Customers', value: data.users.total, sub: `${data.users.active} active`, color: 'var(--accent)' },
          { label: 'Venue Staff', value: data.venueUsers.total, sub: `${data.venueUsers.active} active`, color: 'var(--info)' },
          { label: 'Public Queries', value: data.queries?.total ?? 0, color: 'var(--info)' },
          { label: 'Rejected Venues', value: data.venues.rejected, color: 'var(--danger)' },
          { label: 'Expired Claims', value: data.claims.expired, color: 'var(--danger)' },
        ]);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          router.push('/login');
          return;
        }
        toast.error('Failed to load stats: ' + e.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <span className="spinner" />
        Loading stats…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: c.color }}>
            {c.value ?? 0}
          </div>
          {c.sub && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
