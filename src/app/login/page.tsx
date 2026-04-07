'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '40px 36px',
          width: 'min(400px, 95vw)', boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}
      >
        <h2
          style={{
            fontSize: 22, fontWeight: 700, marginBottom: 4,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          VFetch Admin
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          Sign in with your admin account to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
              className="admin-input"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="admin-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 11, fontSize: 14, fontWeight: 600,
              marginTop: 8, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-sm)', fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 12 }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
