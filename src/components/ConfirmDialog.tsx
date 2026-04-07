'use client';

import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(4px)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: 28,
          width: 'min(420px, 95vw)', boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        }}
      >
        <h4 style={{ fontSize: 15, marginBottom: 8 }}>{title}</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              cursor: 'pointer', background: 'transparent',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              cursor: busy ? 'not-allowed' : 'pointer',
              background: 'rgba(239,68,68,.15)', color: 'var(--danger)', border: 'none',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Please wait…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
