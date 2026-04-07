'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar, NAV } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ToastContainer } from '@/components/Toast';

function getTitle(pathname: string): string {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.href === '/') {
        if (pathname === '/') return item.label;
      } else if (pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
        }}
      >
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Checking session…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 'var(--sidebar-w)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Topbar title={getTitle(pathname)} />
        <div style={{ padding: 28, flex: 1 }}>
          {children}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
