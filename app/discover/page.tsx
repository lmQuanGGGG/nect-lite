'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getRecommendations,
  getSwipedUserIds,
  saveSwipe,
  checkMutualLike,
  createMatch,
  getExistingMatch,
} from '@/services/recommendation.service';
import { getUser } from '@/services/profile.service';
import { UserModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import SwipeCard from '@/components/SwipeCard';
import MatchModal from '@/components/MatchModal';
import { cacheKey, readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';
import toast from 'react-hot-toast';

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [candidates, setCandidates] = useState<UserModel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<{ other: UserModel; matchId: string } | null>(null);
  const [myProfile, setMyProfile] = useState<UserModel | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    
    (async () => {
      const discoverCacheKey = cacheKey('discover', user.uid);
      const cached = readPersistentCache<{ candidates: UserModel[]; currentIndex: number; timestamp: number }>(discoverCacheKey);

      // Use cache if less than 5 minutes old
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        console.log('📦 Tải Discover từ cache...', { index: cached.currentIndex, candidates: cached.candidates.length });
        setCandidates(cached.candidates);
        setCurrentIndex(cached.currentIndex);
        setMyProfile(await getUser(user.uid)); // Quick fetch for my profile
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Đang tải dữ liệu Discover từ server...');
        setLoading(true);
        const [swipedIds, me] = await Promise.all([
          getSwipedUserIds(user.uid),
          getUser(user.uid),
        ]);
        
        if (!me) throw new Error("Không tìm thấy profile");
        setMyProfile(me);
        
        const recs = await getRecommendations(me, swipedIds, 100);
        
        console.log(`✅ Đã tải xong Discover: ${recs.length} người phù hợp`);
        // Update state
        setCandidates(recs);
        setCurrentIndex(0);
        
        // Update cache
        writePersistentCache(discoverCacheKey, {
          candidates: recs,
          currentIndex: 0,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('❌ Lỗi tải Discover:', err);
        toast.error('Không thể tải gợi ý');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  const handleSwipe = async (action: 'like' | 'dislike') => {
    if (!user || processing) return;
    const target = candidates[currentIndex];
    if (!target) return;

    setProcessing(true);
    try {
      await saveSwipe(user.uid, target.id, action);

      if (action === 'like') {
        const isMutual = await checkMutualLike(user.uid, target.id);
        if (isMutual) {
          const existing = await getExistingMatch(user.uid, target.id);
          const matchId = existing ?? await createMatch(user.uid, target.id);
          setMatchData({ other: target, matchId });
        } else {
          toast.success('Like! 🔥', { duration: 1000, icon: '❤️' });
        }
      }

      console.log(`👍 Đã vuốt ${action} cho user: ${target.id}`);
      setCurrentIndex((prev) => {
        const next = prev + 1;
        const discoverCacheKey = cacheKey('discover', user.uid);
        const cached = readPersistentCache<{ candidates: UserModel[]; currentIndex: number; timestamp: number }>(discoverCacheKey);
        if (cached) {
          writePersistentCache(discoverCacheKey, { ...cached, currentIndex: next });
        }
        return next;
      });
    } catch {
      toast.error('Lỗi khi lưu swipe');
    } finally {
      setProcessing(false);
    }
  };

  const currentUser = candidates[currentIndex];
  const nextUser = candidates[currentIndex + 1];

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header />
        <div className="page loading-screen" style={{ minHeight: 'calc(100dvh - var(--header-height, 60px))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
          <p>Đang tìm người phù hợp...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header />
      <div
        className="page page-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minHeight: 'calc(100dvh - var(--header-height, 60px))',
          paddingTop: 18,
        }}
      >
        {/* Swipe Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {currentIndex >= candidates.length || candidates.length === 0 ? (
            <div className="neo-box" style={{ flex: 1, minHeight: 420, padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="empty-state-icon">⌕</div>
              <h3 style={{ marginBottom: '8px' }}>Hết rồi!</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '24px' }}>Bạn đã xem qua tất cả gợi ý. Quay lại sau nhé.</p>
              <button
                className="neo-btn neo-btn-primary"
                onClick={() => {
                  setCurrentIndex(0);
                  setLoading(true);
                  window.location.reload();
                }}
              >
                Làm mới
              </button>
            </div>
          ) : (
            <div
              className="swipe-card-wrapper"
              style={{
                position: 'relative',
                width: '100%',
                height: 'min(660px, calc(100dvh - var(--header-height, 60px) - var(--nav-height, 72px) - 96px))',
                minHeight: 430,
                borderRadius: 30,
              }}
            >
              <div
                className="swipe-card-bg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  top: 6,
                  left: 6,
                  borderRadius: 30,
                  border: '4px solid var(--neo-border, #000)',
                  background: 'var(--bg-surface, #fff)',
                }}
              ></div>
              {/* Background card (next) */}
              {nextUser && (
                <SwipeCard
                  key={nextUser.id}
                  user={nextUser}
                  onLike={() => {}}
                  onDislike={() => {}}
                  isTop={false}
                />
              )}

              {/* Top card (current) */}
              {currentUser && (
                <SwipeCard
                  key={currentUser.id}
                  user={currentUser}
                  onLike={() => handleSwipe('like')}
                  onDislike={() => handleSwipe('dislike')}
                  isTop
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Match Modal */}
      {matchData && myProfile && (
        <MatchModal
          me={myProfile}
          other={matchData.other}
          matchId={matchData.matchId}
          onClose={() => setMatchData(null)}
          onChat={() => {
            setMatchData(null);
            router.push(`/chat/${matchData.matchId}`);
          }}
        />
      )}
    </AppShell>
  );
}
