'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt, copyText } from '@/lib/utils';
import { Badge, ActiveBadge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pagination } from '@/components/Pagination';
import type { VenueUser, PaginatedResponse } from '@/types';

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

interface EditForm {
  first_name: string; last_name: string; phone_number: string; role: string; is_active: string;
}

interface AddForm {
  venue_id: string; first_name: string; last_name: string; email: string; password: string; role: string;
}

function vuToEdit(u: VenueUser): EditForm {
  return { first_name: u.first_name, last_name: u.last_name, phone_number: u.phone_number ?? '', role: u.role, is_active: u.is_active ? 'true' : 'false' };
}

function emptyAdd(): AddForm {
  return { venue_id: '', first_name: '', last_name: '', email: '', password: '', role: 'venue_staff' };
}

export default function VenueUsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<VenueUser[]>([]);
  const [filtered, setFiltered] = useState<VenueUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<VenueUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ first_name: '', last_name: '', phone_number: '', role: 'venue_staff', is_active: 'true' });
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd());
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      const data = await apiFetch<PaginatedResponse<VenueUser>>('GET', `/venue-users?${qs}`);
      setAllUsers(data.data);
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
    if (!search) { setFiltered(allUsers); return; }
    const q = search.toLowerCase();
    setFiltered(allUsers.filter((u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)));
  }, [search, allUsers]);

  function openEdit(u: VenueUser) { setEditUser(u); setEditForm(vuToEdit(u)); setEditModal(true); }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    try {
      await apiFetch('PUT', `/venue-users/${editUser.id}`, {
        first_name: editForm.first_name, last_name: editForm.last_name,
        phone_number: editForm.phone_number || undefined, role: editForm.role,
        is_active: editForm.is_active === 'true',
      });
      toast.success('Venue user updated');
      setEditModal(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!addForm.venue_id.trim()) { toast.error('Venue ID is required'); return; }
    setSaving(true);
    try {
      await apiFetch('POST', '/venue-users', {
        firstName: addForm.first_name, lastName: addForm.last_name,
        email: addForm.email, password: addForm.password,
        role: addForm.role, venue_id: addForm.venue_id.trim(),
      });
      toast.success('Venue user created');
      setAddModal(false);
      setAddForm(emptyAdd());
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm) return;
    await apiFetch('DELETE', `/venue-users/${confirm.id}`);
    toast.success('Venue user deleted');
    setConfirm(null);
    load();
  }

  const roStyle: React.CSSProperties = { opacity: 0.5, pointerEvents: 'none' };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="admin-input"
          style={{ width: 'auto', minWidth: 220 }}
        />
        <button onClick={() => { setAddForm(emptyAdd()); setAddModal(true); }} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>
          + Add Venue User
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Name', 'Email', 'Role', 'Venue', 'Status', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No venue users found</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.first_name} {u.last_name}</td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.email}>{u.email}</span>
                  <button
                    onClick={() => copyText(u.email, () => { setCopiedEmail(u.id); setTimeout(() => setCopiedEmail(null), 1500); })}
                    style={{ marginLeft: 4, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)' }}
                    title="Copy email"
                  >
                    {copiedEmail === u.id ? '✅' : '📋'}
                  </button>
                </td>
                <td style={td}><Badge value={u.role} /></td>
                <td style={{ ...td, fontSize: 11, color: 'var(--text-muted)' }}>{u.venue_id ? u.venue_id.slice(0, 10) + '…' : '—'}</td>
                <td style={td}><ActiveBadge value={u.is_active} /></td>
                <td style={td}>{fmt(u.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(u)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="Edit">✏️</button>
                    <button onClick={() => setConfirm({ id: u.id, name: u.first_name })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      {/* Edit Modal */}
      {editUser && (
        <Modal title="Edit Venue Staff" open={editModal} onClose={() => setEditModal(false)} onSave={handleSave} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Email (read-only)</label>
              <input value={editUser.email} readOnly className="admin-input" style={roStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Venue ID (read-only)</label>
              <input value={editUser.venue_id} readOnly className="admin-input" style={roStyle} />
            </div>
            {(['first_name', 'last_name', 'phone_number'] as const).map((id) => (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                <input value={editForm[id]} onChange={(e) => setEditForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} className="admin-input">
                <option value="venue_staff">Venue Staff</option>
                <option value="venue_admin">Venue Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Active</label>
              <select value={editForm.is_active} onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.value }))} className="admin-input">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal title="Add Venue User" open={addModal} onClose={() => setAddModal(false)} onSave={handleCreate} saving={saving}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Venue ID *</label>
            <input value={addForm.venue_id} onChange={(e) => setAddForm((f) => ({ ...f, venue_id: e.target.value }))} placeholder="Paste venue ID" className="admin-input" />
          </div>
          {(['first_name', 'last_name'] as const).map((id) => (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{id === 'first_name' ? 'First Name *' : 'Last Name *'}</label>
              <input value={addForm[id]} onChange={(e) => setAddForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Email *</label>
            <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className="admin-input" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Password * (min 8)</label>
            <input type="password" minLength={8} value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" className="admin-input" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
            <select value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))} className="admin-input">
              <option value="venue_staff">Venue Staff</option>
              <option value="venue_admin">Venue Admin</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete Venue User"
        message={`Permanently delete "${confirm?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
