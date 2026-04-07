'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { section: 'Overview', items: [{ label: 'Dashboard', icon: '📊', href: '/' }] },
  {
    section: 'Data',
    items: [
      { label: 'Venues', icon: '🏢', href: '/venues' },
      { label: 'Lost Items', icon: '📦', href: '/items' },
      { label: 'Claims', icon: '📋', href: '/claims' },
    ],
  },
  {
    section: 'Users',
    items: [
      { label: 'Customers', icon: '👤', href: '/users' },
      { label: 'Venue Staff', icon: '🔑', href: '/venue-users' },
    ],
  },
  { section: 'Operations', items: [{ label: 'Queries', icon: '🔍', href: '/queries' }] },
  { section: 'Finance', items: [{ label: 'Transactions', icon: '💳', href: '/transactions' }] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.4px',
            margin: 0,
          }}
        >
          VFetch
        </h1>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Admin Console
        </span>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map((group) => (
          <div key={group.section}>
            <div
              style={{
                padding: '8px 20px 4px',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    background: isActive ? 'rgba(99,102,241,.12)' : 'transparent',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export { NAV };
