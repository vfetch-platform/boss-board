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
import type { Item, Venue, PaginatedResponse } from '@/types';

const CATEGORIES = ['phones', 'wallets', 'keys', 'bags', 'clothing', 'jewelry', 'electronics', 'cards', 'documents', 'other'];
const STATUSES = ['available', 'claimed', 'collected', 'expired'];

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

interface ItemForm {
  title: string; description: string; category: string; status: string;
  color: string; brand: string; model: string; serial_number: string; location_found: string;
}

function emptyForm(): ItemForm {
  return { title: '', description: '', category: 'phones', status: 'available', color: '', brand: '', model: '', serial_number: '', location_found: '' };
}

function itemToForm(i: Item): ItemForm {
  return { title: i.title, description: i.description, category: i.category, status: i.status, color: i.color ?? '', brand: i.brand ?? '', model: i.model ?? '', serial_number: i.serial_number ?? '', location_found: i.location_found ?? '' };
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const [venueMap, setVenueMap] = useState<Record<string, Venue>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load venue list once to resolve venue_id → venue details
  useEffect(() => {
    apiFetch<PaginatedResponse<Venue>>('GET', '/venues?limit=200')
      .then((data) => {
        const map: Record<string, Venue> = {};
        data.data.forEach((v) => { map[v.id] = v; });
        setVenueMap(map);
      })
      .catch(() => {}); // non-critical; falls back to UUID display
  }, []);

  function handleCopyId(id: string) {
    copyText(id, () => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) qs.set('status', statusFilter);
      if (categoryFilter) qs.set('category', categoryFilter);
      const data = await apiFetch<PaginatedResponse<Item>>('GET', `/items?${qs}`);
      setItems(data.data);
      setTotal(data.pagination.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push('/login'); return; }
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, router]);

  useEffect(() => { load(); }, [load]);

  function openEdit(i: Item) { setEditItem(i); setForm(itemToForm(i)); setModalOpen(true); }

  async function handleSave() {
    if (!editItem) return;
    setSaving(true);
    try {
      await apiFetch('PUT', `/items/${editItem.id}`, {
        title: form.title, description: form.description, category: form.category, status: form.status,
        color: form.color || undefined, brand: form.brand || undefined, model: form.model || undefined,
        serial_number: form.serial_number || undefined, location_found: form.location_found || undefined,
      });
      toast.success('Item updated');
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm) return;
    await apiFetch('DELETE', `/items/${confirm.id}`);
    toast.success('Item deleted');
    setConfirm(null);
    load();
  }

  function F({ label, id, full, rows }: { label: string; id: keyof ItemForm; full?: boolean; rows?: number }) {
    return (
      <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
        {rows ? (
          <textarea rows={rows} value={form[id]} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" style={{ resize: 'vertical' }} />
        ) : (
          <input value={form[id]} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" />
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input" style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="admin-input" style={{ width: 'auto' }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Title', 'Category', 'Status', 'Venue', 'Date Found', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No items found</td></tr>
            ) : items.map((i) => (
              <tr key={i.id}>
                <td style={td}>
                  <span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={i.title}>{i.title}</span>
                  <button
                    onClick={() => handleCopyId(i.id)}
                    title="Copy item ID"
                    style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-alt, rgba(255,255,255,.06))', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 10, color: copiedId === i.id ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'monospace', transition: 'color .2s' }}
                  >
                    {copiedId === i.id ? '✓ copied' : `${i.id.slice(0, 8)}…`}
                  </button>
                </td>
                <td style={td}><Badge value={i.category} /></td>
                <td style={td}><Badge value={i.status} /></td>
                <td style={{ ...td, maxWidth: 160 }}>
                  {i.venue_id && venueMap[i.venue_id] ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{venueMap[i.venue_id].name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{venueMap[i.venue_id].city}</div>
                    </div>
                  ) : i.venue_id ? (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{i.venue_id.slice(0, 8)}…</span>
                  ) : '—'}
                </td>
                <td style={td}>{fmt(i.date_found)}</td>
                <td style={td}>{fmt(i.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(i)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="Edit">✏️</button>
                    <button onClick={() => setConfirm({ id: i.id, title: i.title })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      <Modal title="Edit Item" open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} saving={saving}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Copyable ID */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Item ID</span>
            <button
              onClick={() => editItem && handleCopyId(editItem.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-alt, rgba(255,255,255,.06))', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12, color: editItem && copiedId === editItem.id ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'monospace', transition: 'color .2s' }}
              title="Click to copy full ID"
            >
              {editItem && copiedId === editItem.id ? '✓ copied' : editItem?.id ?? ''}
            </button>
          </div>

          {/* Venue info (read-only) */}
          {editItem?.venue_id && venueMap[editItem.venue_id] && (() => {
            const v = venueMap[editItem.venue_id!]!;
            return (
              <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 8 }}>Venue</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</span>
                  <Badge value={v.status} />
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{v.address}, {v.city}{v.postal_code ? ` ${v.postal_code}` : ''}</div>
              </div>
            );
          })()}

          <F label="Title" id="title" full />
          <F label="Description" id="description" full rows={3} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="admin-input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="admin-input">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <F label="Color" id="color" />
          <F label="Brand" id="brand" />
          <F label="Model" id="model" />
          <F label="Serial Number" id="serial_number" />
          <F label="Location Found" id="location_found" full />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete Item"
        message={`Permanently delete "${confirm?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
