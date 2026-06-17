'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUser } from '@/services/profile.service';
import { UserModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import ProfileCard from '@/components/ProfileCard';
import EmptyState from '@/components/EmptyState';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const u = await getUser(id);
      setUser(u);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <Header showBack />
        <div className="page">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <Header showBack />
        <div className="page">
          <EmptyState icon="🔍" title="Không tìm thấy người dùng" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title={user.username} showBack />
      <div className="page">
        <div className="page-content">
          <ProfileCard user={user} />
        </div>
      </div>
    </AppShell>
  );
}
