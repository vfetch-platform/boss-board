'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await logout();
    router.push('/login');
  }

  const displayName =
    user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email : '';

  return (
    <header
      style={{
        height: 60,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayName}</span>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(239,68,68,.1)',
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,.2)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
