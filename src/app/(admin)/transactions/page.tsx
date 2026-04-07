'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt } from '@/lib/utils';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import type { Transaction, PaginatedResponse } from '@/types';

const STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) qs.set('status', statusFilter);
      const data = await apiFetch<PaginatedResponse<Transaction>>('GET', `/transactions?${qs}`);
      setTransactions(data.data);
      setTotal(data.pagination.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push('/login'); return; }
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => { load(); }, [load]);

  const roStyle: React.CSSProperties = { opacity: 0.5, pointerEvents: 'none' };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input" style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['ID', 'Claim ID', 'Amount', 'Currency', 'Status', 'Stripe Intent', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No transactions found</td></tr>
            ) : transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>{t.id.slice(0, 8)}…</td>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>{t.claim_id ? t.claim_id.slice(0, 8) + '…' : '—'}</td>
                <td style={{ ...td, fontWeight: 600 }}>{t.currency ? (((t.amount ?? 0) / 100).toFixed(2)) : (t.amount ?? '—')}</td>
                <td style={{ ...td, textTransform: 'uppercase', fontSize: 12 }}>{t.currency || '—'}</td>
                <td style={td}><Badge value={t.status} /></td>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>{t.stripe_payment_intent_id ? t.stripe_payment_intent_id.slice(0, 18) + '…' : '—'}</td>
                <td style={td}>{fmt(t.created_at)}</td>
                <td style={td}>
                  <button onClick={() => setViewTx(t)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="View">🔎</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      {viewTx && (
        <Modal title="Transaction Details" open onClose={() => setViewTx(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {([
              ['Transaction ID', viewTx.id],
              ['Claim ID', viewTx.claim_id ?? ''],
              ['Stripe Payment Intent', viewTx.stripe_payment_intent_id ?? ''],
            ] as const).map(([label, val]) => (
              <div key={label} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
                <input value={val} readOnly className="admin-input" style={{ ...roStyle, fontSize: 11 }} />
              </div>
            ))}
            {([
              ['Amount (pence/cents)', String(viewTx.amount ?? '')],
              ['Currency', (viewTx.currency ?? '').toUpperCase()],
              ['Status', viewTx.status ?? ''],
              ['Venue Share', String(viewTx.venue_share ?? '—')],
              ['Platform Share', String(viewTx.platform_share ?? '—')],
              ['Created', viewTx.created_at ?? ''],
              ['Updated', viewTx.updated_at ?? ''],
            ] as const).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
                <input value={val} readOnly className="admin-input" style={roStyle} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
