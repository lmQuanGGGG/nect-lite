'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToUser, updateUser } from '@/services/profile.service';
import { uploadAvatar } from '@/services/storage.service';
import { signOut } from '@/services/auth.service';
import { cacheKey, readPersistentCache, writePersistentCache, removePersistentCache } from '@/lib/persistent-cache';
import { UserModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const CACHE_TTL_MS = 5 * 60 * 1000;

const profileCache: {
  userId: string;
  profile: UserModel | null;
  timestamp: number;
  hasFetched: boolean;
} = {
  userId: '',
  profile: null,
  timestamp: 0,
  hasFetched: false,
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    
    const profileCacheKey = cacheKey('profile', user.uid);
    const cachedProfile = readPersistentCache<{ profile: UserModel; timestamp: number }>(profileCacheKey);

    if (cachedProfile && Date.now() - cachedProfile.timestamp < CACHE_TTL_MS) {
      setProfile(cachedProfile.profile);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsub = subscribeToUser(user.uid, (u) => {
      if (u) {
        setProfile(u);
        writePersistentCache(profileCacheKey, { profile: u, timestamp: Date.now() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateUser(user.uid, { avatarUrl: url });
      toast.success('Ảnh đại diện đã được cập nhật!');
    } catch {
      toast.error('Không thể tải ảnh lên');
    }
  };

  const handleSignOut = async () => {
    if (user) {
      removePersistentCache(cacheKey('profile', user.uid));
    }
    await signOut();
    router.replace('/login');
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header />
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p>Đang tải...</p>
        </div>
      </AppShell>
    );
  }

  if (!profile) return null;

  return (
    <AppShell>
      <Header />
      <div className="page page-content">
        {/* Header Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.username} 
              alt={profile.username} 
              className="neo-avatar"
              style={{ width: '80px', height: '80px' }}
            />
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <button 
              className="neo-btn-circle" 
              style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '32px', height: '32px', fontSize: '12px', border: '2px solid #000', background: '#fff' }}
              onClick={() => document.getElementById('profile-avatar-input')?.click()}
            >
              +
            </button>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{profile.username}</h2>
            <button className="neo-btn" style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem' }}>
              Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Ví GameNect Block */}
        <div className="neo-box" style={{ background: '#A855F7', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="neo-avatar" style={{ width: '48px', height: '48px', background: '#FCD34D', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', color: '#D97706' }}>
              $
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Ví GameNect</p>
              <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{profile.coinBalance || 0} Coin</p>
            </div>
          </div>
          <button className="neo-btn" style={{ height: '40px', fontSize: '0.875rem', background: '#fff' }}>Quản lý</button>
        </div>



        {/* Location Block */}
        <div className="neo-box" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '16px' }}>
            <span style={{ color: 'var(--accent-orange)' }}>◆</span> Vị trí & Khoảng cách
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vị trí hiện tại:</p>
          <p style={{ fontWeight: 800, marginBottom: '16px' }}>{profile.address || profile.city || profile.location || 'Chưa cập nhật'}</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Khoảng cách tìm kiếm:</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>{profile.maxDistance || 50}km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Độ tuổi:</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>{profile.minAge || 18} - {profile.maxAge || 99} tuổi</span>
          </div>
        </div>

        <button className="neo-btn" style={{ width: '100%', color: 'red', marginTop: '24px' }} onClick={handleSignOut}>
          Đăng xuất
        </button>

      </div>
    </AppShell>
  );
}
