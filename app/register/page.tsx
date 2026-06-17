'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail } from '@/services/auth.service';
import { createUserProfile } from '@/services/profile.service';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password);
      // Create blank user profile in Firestore (matching Flutter schema)
      await createUserProfile(user.uid, {});
      router.replace('/onboarding');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
      if (msg.includes('email-already-in-use')) {
        toast.error('Email này đã được sử dụng');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '30px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎮</div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Đăng Ký</h1>
        <p style={{ fontWeight: 600, marginTop: '8px' }}>Tham gia Nect Lite by GameNect</p>
      </div>

      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Email</label>
          <input
            id="reg-email"
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
            id="reg-password"
            type="password"
            className="neo-input"
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Xác nhận mật khẩu</label>
          <input
            id="reg-confirm"
            type="password"
            className="neo-input"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          id="btn-register"
          type="submit"
          className="neo-btn neo-btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontWeight: 700, padding: '24px 0 8px' }}>
        Đã có tài khoản?{' '}
        <Link href="/login" style={{ color: 'var(--accent-orange)' }}>Đăng nhập</Link>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        Bằng cách đăng ký, bạn đồng ý với{' '}
        <Link href="/terms" style={{ color: 'var(--text-primary)' }}>Điều khoản</Link> và{' '}
        <Link href="/privacy" style={{ color: 'var(--text-primary)' }}>Chính sách</Link>
      </div>
    </div>
  );
}
