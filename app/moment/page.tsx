'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMomentsForUser, markMomentViewed, subscribeToMomentsForUser, addReactionToMoment, removeReactionFromMoment } from '@/services/moment.service';
import { getSpotlightFeed, toggleLikeMentorMedia, getApprovedMentors, markSpotlightViewed, subscribeToSpotlightFeed } from '@/services/spotlight.service';
import { getUser } from '@/services/profile.service';
import { MomentModel, UserModel, MentorMedia, MentorModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import MomentCard from '@/components/MomentCard';
import MomentPreviewCard from '@/components/MomentPreviewCard';
import SpotlightCard from '@/components/SpotlightCard';
import EmptyState from '@/components/EmptyState';
import { cacheKey, readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';
import Link from 'next/link';
import { DocumentData, getDocs, QueryDocumentSnapshot, query, collection, where, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const INITIAL_MOMENT_LIMIT = 8;
const NEXT_MOMENT_LIMIT = 2;

async function fetchMatchedIds(userId: string): Promise<string[]> {
  const snap = await getDocs(
    query(
      collection(db, 'matches'),
      where('userIds', 'array-contains', userId),
      where('status', '==', 'confirmed')
    )
  );
  const ids = new Set<string>();
  snap.docs.forEach((d) => {
    const userIds: string[] = d.data().userIds ?? [];
    userIds.forEach((id) => { if (id !== userId) ids.add(id); });
  });
  return [...ids];
}

// We use persistent-cache for the data, but we still need an in-memory ref for pagination state
const paginationState = {
  lastMomentDoc: null as QueryDocumentSnapshot<DocumentData> | null,
  hasMoreMoments: true,
};

export default function MomentPage() {
  const { user, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<MomentModel[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, UserModel>>({});
  
  // Spotlight
  const [spotlightPosts, setSpotlightPosts] = useState<MentorMedia[]>([]);
  const [mentorMap, setMentorMap] = useState<Record<string, UserModel>>({});

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMoments, setHasMoreMoments] = useState(true);
  const [lastMomentDoc, setLastMomentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const momentLoadTriggerRef = useRef<HTMLDivElement | null>(null);

  const [seenSpotlightIds, setSeenSpotlightIds] = useState<string[]>([]);
  const [seenMomentIds, setSeenMomentIds] = useState<string[]>([]);
  
  const [viewMode, setViewMode] = useState<'hub' | 'moment-grid' | 'spotlight-grid'>('hub');
  
  // State for centered modal card in grid views
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [selectedSpotlightId, setSelectedSpotlightId] = useState<string | null>(null);

  const unseenSpotlightIds = useMemo(() => {
    return spotlightPosts.filter(p => !seenSpotlightIds.includes(p.id)).map(p => p.id);
  }, [spotlightPosts, seenSpotlightIds]);

  const unseenMomentIds = useMemo(() => {
    return moments.filter(m => !seenMomentIds.includes(m.id)).map(m => m.id);
  }, [moments, seenMomentIds]);

  const mergeAuthors = useCallback(async (nextMoments: MomentModel[], currentAuthorMap: Record<string, UserModel>) => {
    const authorIds = [...new Set(nextMoments.map((m) => m.userId))];
    const missingIds = authorIds.filter((id) => !currentAuthorMap[id]);
    if (missingIds.length === 0) return currentAuthorMap;

    const authorEntries: Record<string, UserModel> = {};
    await Promise.all(
      missingIds.map(async (id) => {
        const u = await getUser(id);
        if (u) authorEntries[id] = u;
      })
    );

    return { ...currentAuthorMap, ...authorEntries };
  }, []);

  const loadMoreMoments = useCallback(async () => {
    if (!user || loadingMore || !hasMoreMoments || !lastMomentDoc) return;

    try {
      setLoadingMore(true);
      const page = await getMomentsForUser(user.uid, NEXT_MOMENT_LIMIT, lastMomentDoc);
      if (page.moments.length === 0) {
        setHasMoreMoments(false);
        paginationState.hasMoreMoments = false;
        return;
      }

      const nextMoments = [...moments, ...page.moments];
      const nextAuthorMap = await mergeAuthors(page.moments, authorMap);

      paginationState.lastMomentDoc = page.lastDoc;
      paginationState.hasMoreMoments = page.hasMore;

      // Update cache
      if (user) {
        const cachedMoments = nextMoments.slice(0, 20);
        const cachedSpotlights = spotlightPosts.slice(0, 10);
        
        // Clean up maps to only include authors/mentors from cached items
        const cachedAuthorMap: Record<string, UserModel> = {};
        cachedMoments.forEach(m => {
          if (nextAuthorMap[m.userId]) cachedAuthorMap[m.userId] = nextAuthorMap[m.userId];
        });
        const cachedMentorMap: Record<string, any> = {};
        cachedSpotlights.forEach(p => {
          if (mentorMap[p.mentorId]) cachedMentorMap[p.mentorId] = mentorMap[p.mentorId];
        });

        writePersistentCache(cacheKey('moment', user.uid), {
          moments: cachedMoments,
          spotlightPosts: cachedSpotlights,
          authorMap: cachedAuthorMap,
          mentorMap: cachedMentorMap,
          timestamp: Date.now()
        });
      }

      setMoments(nextMoments);
      setAuthorMap(nextAuthorMap);
      setLastMomentDoc(page.lastDoc);
      setHasMoreMoments(page.hasMore);
    } catch (e) {
      console.error('❌ Lỗi tải thêm Moment:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreMoments, lastMomentDoc, loadingMore, mergeAuthors, user, moments, authorMap, spotlightPosts, mentorMap]);

  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      const cacheKeyStr = cacheKey('moment', user.uid);
      const cached = readPersistentCache<{
        moments: MomentModel[];
        spotlightPosts: MentorMedia[];
        authorMap: Record<string, UserModel>;
        mentorMap: Record<string, UserModel>;
        timestamp: number;
      }>(cacheKeyStr);

      // Use cache if less than 5 minutes old
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        console.log('📦 Tải Moment Feed từ cache...');
        setMoments(cached.moments);
        setSpotlightPosts(cached.spotlightPosts);
        setAuthorMap(cached.authorMap);
        setMentorMap(cached.mentorMap);
        
        // Restore pagination state if empty
        setLastMomentDoc(paginationState.lastMomentDoc);
        setHasMoreMoments(paginationState.hasMoreMoments);
        
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Đang tải Moment Feed từ server...');
        setLoading(true);
        // Fetch matches, moments, and spotlight in parallel
        const [, momentPage, spotlightPage, approvedMentors] = await Promise.all([
          fetchMatchedIds(user.uid),
          getMomentsForUser(user.uid, INITIAL_MOMENT_LIMIT),
          getSpotlightFeed(8),
          getApprovedMentors(),
        ]);
        const data = momentPage.moments;
        const spotlightData = spotlightPage.posts;
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setSeenMomentIds(userData.seenMomentIds || []);
          setSeenSpotlightIds(userData.seenSpotlightIds || []);
        }

        console.log('✅ Đã tải xong Moment Feed:', data.length, 'moments,', spotlightData.length, 'spotlight');
        setMoments(data);
        setSpotlightPosts(spotlightData);
        setLastMomentDoc(momentPage.lastDoc);
        setHasMoreMoments(momentPage.hasMore);

        const mMap: Record<string, any> = {};
        approvedMentors.forEach(m => mMap[m.userId] = m);
        setMentorMap(mMap);

        // Fetch moment authors
        const authorIds = [...new Set(data.map((m) => m.userId))];
        const authorEntries: Record<string, UserModel> = {};
        await Promise.all(
          authorIds.map(async (id) => {
            const u = await getUser(id);
            if (u) authorEntries[id] = u;
          })
        );
        setAuthorMap(authorEntries);

        // Save to cache
        const cachedMoments = data.slice(0, 20);
        const cachedSpotlights = spotlightData.slice(0, 10);
        
        const cachedAuthorMap: Record<string, UserModel> = {};
        cachedMoments.forEach(m => {
          if (authorEntries[m.userId]) cachedAuthorMap[m.userId] = authorEntries[m.userId];
        });
        const cachedMentorMap: Record<string, any> = {};
        cachedSpotlights.forEach(p => {
          if (mMap[p.mentorId]) cachedMentorMap[p.mentorId] = mMap[p.mentorId];
        });

        writePersistentCache(cacheKeyStr, {
          moments: cachedMoments,
          spotlightPosts: cachedSpotlights,
          mentorMap: cachedMentorMap,
          authorMap: cachedAuthorMap,
          timestamp: Date.now()
        });
        
        paginationState.lastMomentDoc = momentPage.lastDoc;
        paginationState.hasMoreMoments = momentPage.hasMore;
      } catch (e) {
        console.error('❌ Lỗi tải Moment Feed:', e);
        setError('Không thể tải moments. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  // Thiết lập Subscriptions (onSnapshot) cho số lượng chưa xem
  useEffect(() => {
    if (!user) return;

    // Lắng nghe 100 spotlight mới nhất
    const unsubSpotlight = subscribeToSpotlightFeed(
      100,
      (posts) => {
        console.log('Socket Spotlight nhận data mới:', posts.length, 'bài');
        setSpotlightPosts(posts); // Giữ nguyên toàn bộ mảng thay vì slice để card tự lọc
      },
      (error) => console.error('Error listening to spotlight:', error)
    );

    // Lắng nghe 100 moment mới nhất
    const unsubMoment = subscribeToMomentsForUser(
      user.uid,
      100,
      (realtimeMoments) => {
        console.log('Socket Moment nhận data mới:', realtimeMoments.length, 'bài');
        
        setMoments((prev) => {
          if (prev.length === 0) return realtimeMoments.slice(0, 20);
          
          const newMap = new Map(realtimeMoments.map(m => [m.id, m]));
          const merged = prev.map(m => newMap.has(m.id) ? newMap.get(m.id)! : m);
          const existingIds = new Set(prev.map(m => m.id));
          const brandNew = realtimeMoments.filter(m => !existingIds.has(m.id));
          return [...brandNew, ...merged].sort((a, b) => {
            const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).toMillis();
            const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).toMillis();
            return timeB - timeA;
          });
        });
      },
      (error) => console.error('Error listening to moments:', error)
    );

    return () => {
      unsubSpotlight();
      unsubMoment();
    };
  }, [user]);

  // Tự động fetch Avatar & Tên Mentor nếu chưa có trong mentorMap
  useEffect(() => {
    if (spotlightPosts.length === 0) return;

    const fetchMissingMentors = async () => {
      const missingIds = [...new Set(spotlightPosts.map(p => p.mentorId))].filter(id => !mentorMap[id]);
      if (missingIds.length === 0) return;

      const newEntries: Record<string, UserModel> = {};
      for (const uid of missingIds) {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) newEntries[uid] = snap.data() as UserModel;
        } catch(e) {}
      }

      if (Object.keys(newEntries).length > 0) {
        setMentorMap(prev => ({ ...prev, ...newEntries }));
      }
    };

    fetchMissingMentors();
  }, [spotlightPosts, mentorMap]);

  useEffect(() => {
    const trigger = momentLoadTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreMoments();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [loadMoreMoments, moments.length]);

  const handleSpotlightLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      await toggleLikeMentorMedia(postId, user.uid, isLiked);
      // Firebase onSnapshot sẽ tự động bắn ra data mới (ngay lập tức nhờ local cache) 
      // nên không cần setSpotlightPosts thủ công ở đây để tránh bị duplicate user.uid
    } catch (e) {
      console.error(e);
    }
  };

  const handleMomentLike = async (momentId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      if (isLiked) {
        await removeReactionFromMoment(momentId, user.uid, '❤️');
      } else {
        await addReactionToMoment(momentId, user.uid, '❤️');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMomentReact = async (momentId: string, emoji: string) => {
    if (!user) return;
    try {
      const moment = moments.find(m => m.id === momentId);
      const isReacted = moment?.reactions?.some(r => r.userId === user.uid && r.emoji === emoji);
      if (isReacted) {
        await removeReactionFromMoment(momentId, user.uid, emoji);
      } else {
        await addReactionToMoment(momentId, user.uid, emoji);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header />
        <div className="page">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
            <p>Đang tải moments...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Header />
        <div className="page">
          <EmptyState icon="⚠️" title="Lỗi" description={error} />
        </div>
      </AppShell>
    );
  }

  const latestSpotlight = spotlightPosts[0];
  const spotlightMentor = latestSpotlight ? mentorMap[latestSpotlight.mentorId] : null;
  const latestMoment = moments[0];
  const latestMomentAuthor = latestMoment ? authorMap[latestMoment.userId] : undefined;

  const scrollToLatestMoment = () => {
    if (!latestMoment) return;
    document.getElementById(`moment-${latestMoment.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <AppShell>
      <Header
        title="Moment"
        right={
          <Link
            href="/camera"
            id="btn-add-moment"
            className="header-icon-btn"
            aria-label="Thêm Moment"
          >
            +
          </Link>
        }
      />

      <div 
        className="page" 
        style={{ 
          padding: '12px 0 calc(var(--nav-height) + 40px + env(safe-area-inset-bottom))', 
          height: 'calc(100dvh - var(--header-height))',
          overflowY: 'scroll',
          scrollSnapType: 'none',
          scrollbarWidth: 'none', // hide scrollbar for Firefox
          msOverflowStyle: 'none', // hide scrollbar for IE
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .page::-webkit-scrollbar { display: none; }
        `}} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {viewMode === 'hub' ? (
            <div 
              style={{ 
                minHeight: 'calc(100dvh - var(--header-height) - 12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '28px 16px 8px'
              }}
            >
              {spotlightPosts.length > 0 ? (
                <SpotlightCard 
                  posts={spotlightPosts}
                  mentorMap={mentorMap as any}
                  unseenIds={unseenSpotlightIds}
                  currentUserId={user?.uid}
                  onLike={handleSpotlightLike}
                  onMarkViewed={(id) => {
                    if (!seenSpotlightIds.includes(id)) {
                      setSeenSpotlightIds(prev => [...prev, id]);
                      if (user) markSpotlightViewed(id, user.uid);
                    }
                  }}
                  onViewAll={() => setViewMode('spotlight-grid')}
                />
              ) : (
                 <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Chưa có Mentor Post nào</div>
              )}

              <MomentPreviewCard
                moments={moments}
                authorMap={authorMap}
                unseenIds={unseenMomentIds}
                currentUserId={user?.uid}
                onOpen={scrollToLatestMoment}
                onLike={handleMomentLike}
                onMarkViewed={(id) => {
                  if (!seenMomentIds.includes(id)) {
                    setSeenMomentIds(prev => [...prev, id]);
                    if (user) markMomentViewed(id, user.uid);
                  }
                }}
                onViewAll={() => setViewMode('moment-grid')}
              />
            </div>
          ) : viewMode === 'moment-grid' ? (
            <div style={{ padding: '16px', minHeight: 'calc(100dvh - var(--header-height) - 12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button className="neo-btn" onClick={() => setViewMode('hub')} style={{ padding: '6px 16px' }}>← Quay lại</button>
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>MOMENT POSTS</h2>
                <div style={{ width: '80px' }} />
              </div>
              
              {moments.length === 0 ? (
                <EmptyState
                  icon="📸"
                  title="Chưa có Moment"
                  description="Các moments từ bạn bè sẽ hiện ở đây."
                  action={
                    <Link href="/camera" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                      Đăng Moment đầu tiên
                    </Link>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%' }}>
                  {moments.map((m, index) => {
                    const loadTriggerIndex = Math.max(0, moments.length - 3);
                    return (
                      <div 
                        key={m.id}
                        ref={index === loadTriggerIndex ? momentLoadTriggerRef : null}
                        onClick={() => setSelectedMomentId(m.id)}
                        style={{ 
                          aspectRatio: '3/4', 
                          position: 'relative', 
                          cursor: 'pointer', 
                          background: 'var(--bg-surface)',
                          border: '3px solid var(--neo-border)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '4px 4px 0 var(--neo-border)',
                          transition: 'transform 0.1s'
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.thumbnailUrl || m.mediaUrl} alt="Moment thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {m.isVideo && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>▶️</span>
                          </div>
                        )}
                        {/* Loading spinner for the last item if loadingMore */}
                        {loadingMore && index === moments.length - 1 && (
                          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                            <div className="spinner" style={{ width: 16, height: 16 }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : viewMode === 'spotlight-grid' ? (
            <div style={{ padding: '16px', minHeight: 'calc(100dvh - var(--header-height) - 12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button className="neo-btn" onClick={() => setViewMode('hub')} style={{ padding: '6px 16px' }}>← Quay lại</button>
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>MENTOR POSTS</h2>
                <div style={{ width: '80px' }} />
              </div>
              
              {spotlightPosts.length === 0 ? (
                <EmptyState
                  icon="🌟"
                  title="Chưa có Mentor Post"
                  description="Các bài viết từ Mentor sẽ hiện ở đây."
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%' }}>
                  {spotlightPosts.map((p) => {
                    return (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedSpotlightId(p.id)}
                        style={{ 
                          aspectRatio: '3/4', 
                          position: 'relative', 
                          cursor: 'pointer', 
                          background: 'var(--bg-surface)',
                          border: '3px solid var(--neo-border)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '4px 4px 0 var(--neo-border)',
                          transition: 'transform 0.1s'
                        }}
                      >
                        <img src={p.type === 'video' ? (p.thumbnailUrl || p.url) : p.url} alt="Spotlight thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {p.type === 'video' && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>▶️</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}
          
          {/* Centered Modal Card for Moment */}
          {selectedMomentId && (() => {
            const m = moments.find(x => x.id === selectedMomentId);
            if (!m) return null;
            const author = authorMap[m.userId];
            return (
              <div 
                style={{ 
                  position: 'fixed', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.85)', 
                  zIndex: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '20px',
                  backdropFilter: 'blur(5px)'
                }} 
                onClick={() => setSelectedMomentId(null)}
              >
                <div style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                  <MomentCard
                    moment={m}
                    authorName={author?.username}
                    authorAvatar={author?.avatarUrl}
                    onReact={handleMomentReact}
                  />
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => setSelectedMomentId(null)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 1001,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })()}
          
          {/* Centered Modal Card for Spotlight */}
          {selectedSpotlightId && (() => {
            const p = spotlightPosts.find(x => x.id === selectedSpotlightId);
            if (!p) return null;
            return (
              <div 
                style={{ 
                  position: 'fixed', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.85)', 
                  zIndex: 1000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '20px',
                  backdropFilter: 'blur(5px)'
                }} 
                onClick={() => setSelectedSpotlightId(null)}
              >
                <div style={{ width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                  <SpotlightCard 
                    posts={[p]}
                    mentorMap={mentorMap as any}
                    unseenIds={unseenSpotlightIds}
                    currentUserId={user?.uid}
                    onLike={handleSpotlightLike}
                  />
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => setSelectedSpotlightId(null)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 1001,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })()}

        </div>
      </div>
    </AppShell>
  );
}
