'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLikedMeUserIds, getSwipedUserIds } from '@/services/recommendation.service';
import { getUser } from '@/services/profile.service';
import { UserModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cacheKey, readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';



export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [likedMeUsers, setLikedMeUsers] = useState<UserModel[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let isMounted = true;

    (async () => {
      const cacheKeyStr = cacheKey('matches', user.uid);
      const cached = readPersistentCache<{
        likedMeUsers: UserModel[];
        isPremium: boolean;
        error: string | null;
        timestamp: number;
      }>(cacheKeyStr);

      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setLikedMeUsers(cached.likedMeUsers);
        setIsPremium(cached.isPremium);
        setError(cached.error);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        const [likedMeIds, swipedIds, myProfile] = await Promise.all([
          getLikedMeUserIds(user.uid),
          getSwipedUserIds(user.uid),
          getUser(user.uid),
        ]);
        // Exclude those we already swiped on (which includes confirmed matches)
        const swipedSet = new Set(swipedIds);
        const filteredIds = likedMeIds.filter(id => !swipedSet.has(id));

        const users: UserModel[] = [];
        await Promise.all(
          filteredIds.map(async (id) => {
            const u = await getUser(id);
            if (u) users.push(u);
          })
        );

        const cacheKeyStr = cacheKey('matches', user.uid);
        writePersistentCache(cacheKeyStr, {
          likedMeUsers: users,
          isPremium: myProfile?.isPremium ?? false,
          error: null,
          timestamp: Date.now(),
        });

        if (!isMounted) return;
        setLikedMeUsers(users);
        setIsPremium(myProfile?.isPremium ?? false);
      } catch (e) {
        console.error(e);
        const message = 'Không thể tải danh sách lượt thích. Vui lòng thử lại.';
        const cacheKeyStr = cacheKey('matches', user.uid);
        writePersistentCache(cacheKeyStr, {
          likedMeUsers: [],
          isPremium: false,
          error: message,
          timestamp: Date.now(),
        });
        
        if (!isMounted) return;
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header title="Lượt Thích" />
        <div className="page">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title="Lượt Thích" />
      <div className="page">
        <div className="page-content">
          {error ? (
            <EmptyState
              icon="!"
              title="Lỗi tải lượt thích"
              description={error}
              action={
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </button>
              }
            />
          ) : likedMeUsers.length === 0 ? (
            <EmptyState
              icon="♥"
              title="Chưa có lượt thích"
              description="Hãy tiếp tục vuốt để tăng cơ hội match nhé!"
              action={
                <Link href="/discover" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  Khám phá ngay
                </Link>
              }
            />
          ) : (
            <>
              {!isPremium && (
                <div className="neo-box" style={{ background: 'var(--accent-dim)', marginBottom: '16px', padding: '16px', textAlign: 'center' }}>
                  <h3 style={{ margin: '8px 0', fontSize: '1rem' }}>Nâng cấp Premium</h3>
                  <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
                    Chỉ thành viên Premium mới xem được ai đã thích mình.
                  </p>
                  <button className="neo-btn" style={{ width: '100%', fontSize: '0.875rem' }} onClick={() => toast('Tính năng đang phát triển')}>
                    Nâng cấp ngay
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {likedMeUsers.map((peer) => {
                  const card = (
                    <div className="neo-box" style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', padding: 0 }}>
                      {peer.avatarUrl ? (
                        <img
                          src={peer.avatarUrl}
                          alt={isPremium ? peer.username : 'Ẩn danh'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isPremium ? 'none' : 'blur(10px)',
                            transform: isPremium ? 'none' : 'scale(1.1)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'var(--accent-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 900,
                            filter: isPremium ? 'none' : 'blur(10px)',
                          }}
                        >
                          {peer.username?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      {!isPremium && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 48, height: 48, borderRadius: 16, border: '3px solid var(--neo-border)', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-neo-sm)', fontSize: '1.3rem', fontWeight: 900 }}>
                          ?
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          padding: '16px 8px 8px 8px',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                        }}
                      >
                        {isPremium ? peer.username : 'Ẩn danh'}
                      </div>
                    </div>
                  );

                  return isPremium ? (
                    <Link key={peer.id} href={`/profile/${peer.id}`} style={{ textDecoration: 'none' }}>
                      {card}
                    </Link>
                  ) : (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => toast.error('Cần nâng cấp Premium để xem chi tiết!')}
                      style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
                    >
                      {card}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
