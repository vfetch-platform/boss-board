'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pagination } from '@/components/Pagination';
import type { Query, PaginatedResponse } from '@/types';

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

export default function QueriesPage() {
  const router = useRouter();
  const [allQueries, setAllQueries] = useState<Query[]>([]);
  const [filtered, setFiltered] = useState<Query[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewQuery, setViewQuery] = useState<Query | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      const data = await apiFetch<PaginatedResponse<Query>>('GET', `/queries?${qs}`);
      setAllQueries(data.data);
      setFiltered(data.data);
      setTotal(data.pagination.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push('/login'); return; }
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search) { setFiltered(allQueries); return; }
    const q = search.toLowerCase();
    setFiltered(allQueries.filter((x) => (x.name || '').toLowerCase().includes(q) || (x.email || '').toLowerCase().includes(q)));
  }, [search, allQueries]);

  async function handleDelete() {
    if (!confirm) return;
    await apiFetch('DELETE', `/queries/${confirm.id}`);
    toast.success('Query deleted');
    setConfirm(null);
    load();
  }

  const roStyle: React.CSSProperties = { opacity: 0.5, pointerEvents: 'none' };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="admin-input"
          style={{ width: 'auto', minWidth: 220 }}
        />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Name', 'Email', 'Location', 'Item Description', 'Stay Dates', 'Submitted', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No queries found</td></tr>
            ) : filtered.map((q) => (
              <tr key={q.id}>
                <td style={td}>{q.name}</td>
                <td style={td}><span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={q.email}>{q.email}</span></td>
                <td style={td}><span style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{q.location}</span></td>
                <td style={td}><span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={q.item_description}>{q.item_description}</span></td>
                <td style={{ ...td, fontSize: 12 }}>{fmt(q.dates_of_stay?.checkin)} → {fmt(q.dates_of_stay?.checkout)}</td>
                <td style={td}>{fmt(q.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewQuery(q)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="View">🔎</button>
                    <button onClick={() => setConfirm({ id: q.id, name: q.name })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      {viewQuery && (
        <Modal title="Query Details" open onClose={() => setViewQuery(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>ID (read-only)</label>
              <input value={viewQuery.id} readOnly className="admin-input" style={{ ...roStyle, fontSize: 11 }} />
            </div>
            {([['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'], ['booking_reference', 'Booking Reference']] as const).map(([id, label]) => (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
                <input value={(viewQuery as unknown as Record<string, string>)[id] ?? ''} readOnly className="admin-input" style={roStyle} />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Check-in</label>
              <input value={viewQuery.dates_of_stay?.checkin ?? ''} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Check-out</label>
              <input value={viewQuery.dates_of_stay?.checkout ?? ''} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Item Description</label>
              <textarea rows={3} value={viewQuery.item_description} readOnly className="admin-input" style={{ ...roStyle, resize: 'vertical' }} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete Query"
        message={`Permanently delete query from "${confirm?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
