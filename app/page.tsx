'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/moment');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="loading-screen">
      <div className="brand-logo" style={{ fontSize: '3rem' }}>⚡</div>
      <div className="spinner" />
      <p>Nect Lite by GameNect</p>
    </div>
  );
}
