'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt, copyText } from '@/lib/utils';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pagination } from '@/components/Pagination';
import type { Claim, Query, PaginatedResponse } from '@/types';

const STATUSES = ['pending', 'approved', 'rejected', 'collected', 'expired'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

interface ClaimModalState {
  claim: Claim;
  linkedQuery: Query | null;
  status: string;
  notes: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ClaimModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) qs.set('status', statusFilter);
      const data = await apiFetch<PaginatedResponse<Claim>>('GET', `/claims?${qs}`);
      setClaims(data.data);
      setTotal(data.pagination.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push('/login'); return; }
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => { load(); }, [load]);

  async function openEdit(claim: Claim) {
    let linkedQuery: Query | null = null;
    if (claim.notes && UUID_RE.test(claim.notes.trim())) {
      try {
        linkedQuery = await apiFetch<Query>('GET', `/queries/${claim.notes.trim()}`);
      } catch { /* ignore */ }
    }
    setModal({ claim, linkedQuery, status: claim.status, notes: claim.notes ?? '' });
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      await apiFetch('PUT', `/claims/${modal.claim.id}`, { status: modal.status, notes: modal.notes || undefined });
      toast.success('Claim updated');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm) return;
    await apiFetch('DELETE', `/claims/${confirm.id}`);
    toast.success('Claim deleted');
    setConfirm(null);
    load();
  }

  const roStyle: React.CSSProperties = { opacity: 0.5, pointerEvents: 'none' };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input" style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['ID', 'Item', 'User', 'Status', 'Payment', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No claims found</td></tr>
            ) : claims.map((c) => (
              <tr key={c.id}>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.id.slice(0, 8)}…</span>
                  <button
                    onClick={() => copyText(c.id, () => { setCopiedId(c.id); setTimeout(() => setCopiedId(null), 1500); })}
                    style={{ marginLeft: 4, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)' }}
                    title="Copy claim ID"
                  >
                    {copiedId === c.id ? '✅' : '📋'}
                  </button>
                </td>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>
                  {c.item_id ? (
                    <button
                      onClick={() => copyText(c.item_id, () => { setCopiedItemId(c.item_id); setTimeout(() => setCopiedItemId(null), 1500); })}
                      style={{ background: 'var(--surface-alt, rgba(255,255,255,.06))', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 10, color: copiedItemId === c.item_id ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'monospace', transition: 'color .2s' }}
                      title="Copy item ID"
                    >
                      {copiedItemId === c.item_id ? '✓ copied' : `${c.item_id.slice(0, 8)}…`}
                    </button>
                  ) : '—'}
                </td>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>{c.user_id ? c.user_id.slice(0, 8) + '…' : '—'}</td>
                <td style={td}><Badge value={c.status} /></td>
                <td style={td}><Badge value={c.payment_status} /></td>
                <td style={td}>{fmt(c.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="Edit">✏️</button>
                    <button onClick={() => setConfirm({ id: c.id })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      {modal && (
        <Modal title="Edit Claim" open onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Claim ID</label>
              <input value={modal.claim.id} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Item ID</label>
              <button
                onClick={() => copyText(modal.claim.item_id, () => { setCopiedItemId(modal.claim.item_id); setTimeout(() => setCopiedItemId(null), 1500); })}
                style={{ textAlign: 'left', background: 'var(--surface-alt, rgba(255,255,255,.06))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: copiedItemId === modal.claim.item_id ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'monospace', transition: 'color .2s' }}
                title="Click to copy item ID"
              >
                {copiedItemId === modal.claim.item_id ? '✓ copied' : modal.claim.item_id}
              </button>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>User ID</label>
              <input value={modal.claim.user_id} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Status</label>
              <select value={modal.status} onChange={(e) => setModal((m) => m ? { ...m, status: e.target.value } : m)} className="admin-input">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Payment Status (read-only)</label>
              <input value={modal.claim.payment_status} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Pickup Code</label>
              <input value={modal.claim.pickup_code ?? ''} readOnly className="admin-input" style={roStyle} />
            </div>
            {modal.linkedQuery ? (
              <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: 12, border: '1px solid var(--border)' }}>
                <label style={{ color: 'var(--accent)', marginBottom: 8, display: 'block', fontSize: 12, fontWeight: 500 }}>📋 Linked Query</label>
                <div style={{ fontSize: 13, lineHeight: 1.6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                  <span><b>Name:</b> {modal.linkedQuery.name}</span>
                  <span><b>Email:</b> {modal.linkedQuery.email}</span>
                  <span><b>Phone:</b> {modal.linkedQuery.phone}</span>
                  <span><b>Location:</b> {modal.linkedQuery.location}</span>
                  <span><b>Check-in:</b> {modal.linkedQuery.dates_of_stay?.checkin || '—'}</span>
                  <span><b>Check-out:</b> {modal.linkedQuery.dates_of_stay?.checkout || '—'}</span>
                  <span style={{ gridColumn: '1 / -1' }}><b>Item Description:</b> {modal.linkedQuery.item_description}</span>
                </div>
              </div>
            ) : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Notes</label>
                <textarea rows={2} value={modal.notes} onChange={(e) => setModal((m) => m ? { ...m, notes: e.target.value } : m)} className="admin-input" style={{ resize: 'vertical' }} />
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete Claim"
        message={`Permanently delete claim ${confirm?.id.slice(0, 8)}…? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
