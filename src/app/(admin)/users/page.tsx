'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { fmt } from '@/lib/utils';
import { Badge, ActiveBadge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pagination } from '@/components/Pagination';
import type { User, PaginatedResponse } from '@/types';

const ROLES = ['user', 'venue_staff', 'admin'];

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', fontWeight: 600 };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

interface UserForm {
  first_name: string; last_name: string; phone_number: string; role: string; is_active: string;
}

function userToForm(u: User): UserForm {
  return { first_name: u.first_name, last_name: u.last_name, phone_number: u.phone_number ?? '', role: u.role, is_active: u.is_active ? 'true' : 'false' };
}

export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ first_name: '', last_name: '', phone_number: '', role: 'user', is_active: 'true' });
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      const data = await apiFetch<PaginatedResponse<User>>('GET', `/users?${qs}`);
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

  function openEdit(u: User) { setEditUser(u); setForm(userToForm(u)); setModalOpen(true); }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    try {
      await apiFetch('PUT', `/users/${editUser.id}`, {
        first_name: form.first_name, last_name: form.last_name,
        phone_number: form.phone_number || undefined, role: form.role,
        is_active: form.is_active === 'true',
      });
      toast.success('User updated');
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm) return;
    await apiFetch('DELETE', `/users/${confirm.id}`);
    toast.success('User deactivated');
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
              {['Name', 'Email', 'Role', 'Status', 'Provider', 'Created', 'Actions'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><span className="spinner" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.first_name} {u.last_name}</td>
                <td style={td}><span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={u.email}>{u.email}</span></td>
                <td style={td}><Badge value={u.role} /></td>
                <td style={td}><ActiveBadge value={u.is_active} /></td>
                <td style={td}>{u.provider || 'email'}</td>
                <td style={td}>{fmt(u.created_at)}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(u)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }} title="Edit">✏️</button>
                    <button onClick={() => setConfirm({ id: u.id, name: u.first_name })} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.15)', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="Deactivate">🚫</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} limit={20} onPageChange={setPage} />
      </div>

      {editUser && (
        <Modal title="Edit Customer" open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Email (read-only)</label>
              <input value={editUser.email} readOnly className="admin-input" style={roStyle} />
            </div>
            {(['first_name', 'last_name', 'phone_number'] as const).map((id) => (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                <input value={form[id]} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} className="admin-input" />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="admin-input">
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Active</label>
              <select value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))} className="admin-input">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Deactivate User"
        message={`Deactivate "${confirm?.name}"? They will not be able to log in.`}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
