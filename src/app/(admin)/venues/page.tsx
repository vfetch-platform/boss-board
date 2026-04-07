'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt, trunc, copyText, parseCoord } from '@/lib/utils';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pagination } from '@/components/Pagination';
import type { Venue, PaginatedResponse } from '@/types';

const VENUE_TYPES = ['bar', 'club', 'restaurant', 'hotel', 'other'];
const STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

interface VenueForm {
  name: string; type: string; address: string; city: string;
  postal_code: string; phone: string; email: string; website: string;
  status: string; latitude: string; longitude: string;
}

function emptyForm(): VenueForm {
  return { name: '', type: 'bar', address: '', city: '', postal_code: '', phone: '', email: '', website: '', status: 'approved', latitude: '', longitude: '' };
}
function venueToForm(v: Venue): VenueForm {
  return { name: v.name, type: v.type, address: v.address, city: v.city, postal_code: v.postal_code ?? '', phone: v.phone, email: v.email, website: v.website ?? '', status: v.status, latitude: String(v.latitude ?? ''), longitude: String(v.longitude ?? '') };
}

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueForm>(emptyForm());
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) qs.set('status', statusFilter);
      const data = await apiFetch<PaginatedResponse<Venue>>('GET', `/venues?${qs}`);
      setVenues(data.data);
      setTotal(data.pagination.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push('/login'); return; }
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditVenue(null); setForm(emptyForm()); setModalOpen(true); }
  function openEdit(v: Venue) { setEditVenue(v); setForm(venueToForm(v)); setModalOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        name: form.name, type: form.type, address: form.address, city: form.city,
        postal_code: form.postal_code || undefined, phone: form.phone, email: form.email,
        website: form.website || undefined, latitude: parseCoord(form.latitude), longitude: parseCoord(form.longitude),
      };
      if (editVenue) {
        await apiFetch('PUT', `/venues/${editVenue.id}`, body);
        if (form.status !== editVenue.status) {
          await apiFetch('PATCH', `/venues/${editVenue.id}/status`, { status: form.status });
        }
        toast.success('Venue updated');
      } else {
        await apiFetch('POST', '/venues', { ...body, status: form.status });
        toast.success('Venue created');
      }
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
    await apiFetch('DELETE', `/venues/${confirm.id}`);
    toast.success('Venue deleted');
    setConfirm(null);
    load();
  }

  function F({ label, id, type = 'text', full }: { label: string; id: keyof VenueForm; type?: string; full?: boolean }) {
    return (
      <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
        <input type={type} step={type === 'number' ? 'any' : undefined} value={form[id]} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" />
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
        <button onClick={openAdd} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>
          + Add Venue
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Name', 'City', 'Type', 'Status', 'Email', 'ID', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : venues.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No venues found</td></tr>
            ) : venues.map((v) => (
              <tr key={v.id}>
                <td style={td}><span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={v.name}>{v.name}</span></td>
                <td style={td}>{v.city}</td>
                <td style={td}><Badge value={v.type} /></td>
                <td style={td}><Badge value={v.status} /></td>
                <td style={td}><span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={v.email}>{v.email}</span></td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{trunc(v.id)}</span>
                  <button
                    onClick={() => copyText(v.id, () => { setCopiedId(v.id); setTimeout(() => setCopiedId(null), 1500); })}
                    style={{ marginLeft: 4, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)' }}
                    title="Copy venue ID"
                  >
                    {copiedId === v.id ? '✅' : '📋'}
                  </button>
                </td>
                <td style={td}>{fmt(v.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(v)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="Edit">✏️</button>
                    <button onClick={() => setConfirm({ id: v.id, name: v.name })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      <Modal title={editVenue ? 'Edit Venue' : 'Add New Venue'} open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} saving={saving}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <F label="Name" id="name" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="admin-input">
              {VENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <F label="Address" id="address" full />
          <F label="City" id="city" />
          <F label="Postal Code" id="postal_code" />
          <F label="Phone" id="phone" />
          <F label="Email" id="email" type="email" />
          <F label="Website" id="website" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="admin-input">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <F label="Latitude" id="latitude" type="number" />
          <F label="Longitude" id="longitude" type="number" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete Venue"
        message={`Permanently delete "${confirm?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
