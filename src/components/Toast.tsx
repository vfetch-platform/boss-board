'use client';

import { useEffect, useState } from 'react';
import { subscribeToast } from '@/lib/toast';

interface ToastItem {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToast((msg, type) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${
              t.type === 'success'
                ? 'var(--success)'
                : t.type === 'error'
                ? 'var(--danger)'
                : t.type === 'warning'
                ? 'var(--warning)'
                : 'var(--info)'
            }`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 18px',
            fontSize: 13,
            minWidth: 260,
            maxWidth: 360,
            boxShadow: 'var(--shadow)',
            animation: 'slideIn .25s ease',
            color: 'var(--text)',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
