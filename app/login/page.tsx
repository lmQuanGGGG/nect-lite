'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail, signInWithGoogle } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/moment');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      toast.error(msg.includes('invalid-credential') ? 'Email hoặc mật khẩu sai' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/moment');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎮</div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-orange)' }}>gamenect</h1>
        <p style={{ fontWeight: 600, marginTop: '8px' }}>Chơi game có hội, thả thính có đôi!</p>
      </div>

      <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Email</label>
          <input
            id="login-email"
            type="email"
            className="neo-input"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Mật khẩu</label>
          <input
            id="login-password"
            type="password"
            className="neo-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          id="btn-login"
          type="submit"
          className="neo-btn neo-btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div style={{ textAlign: 'center', fontWeight: 800, margin: '16px 0', color: 'var(--text-muted)' }}>HOẶC</div>

        <button
          id="btn-google-login"
          type="button"
          className="neo-btn"
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', gap: '12px' }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng nhập với Google
        </button>
      </form>

      <div style={{ textAlign: 'center', fontWeight: 700, padding: '24px 0' }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" style={{ color: 'var(--accent-orange)' }}>Đăng ký ngay</Link>
      </div>
    </div>
  );
}
