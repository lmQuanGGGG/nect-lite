'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSpotlightFeed, toggleLikeMentorMedia, getApprovedMentors } from '@/services/spotlight.service';
import { MentorMedia } from '@/lib/types';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import SpotlightCard from '@/components/SpotlightCard';
import EmptyState from '@/components/EmptyState';

const INITIAL_SPOTLIGHT_LIMIT = 8;
const NEXT_SPOTLIGHT_LIMIT = 2;

export default function SpotlightPage() {
  const { user, loading: authLoading } = useAuth();
  const [feed, setFeed] = useState<MentorMedia[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, { username: string; avatarUrl: string }>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadTriggerRef = useRef<HTMLDivElement | null>(null);

  const loadMoreSpotlight = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      const page = await getSpotlightFeed(NEXT_SPOTLIGHT_LIMIT, lastDoc);
      setFeed((prev) => [...prev, ...page.posts]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch {
      setError('Không thể tải thêm Spotlight');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, lastDoc, loadingMore]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        setLoading(true);
        const [page, mentors] = await Promise.all([
          getSpotlightFeed(INITIAL_SPOTLIGHT_LIMIT),
          getApprovedMentors(),
        ]);
        setFeed(page.posts);
        setLastDoc(page.lastDoc);
        setHasMore(page.hasMore);

        const map: Record<string, { username: string; avatarUrl: string }> = {};
        mentors.forEach((m) => {
          map[m.userId] = { username: m.username, avatarUrl: m.avatarUrl };
        });
        setAuthorMap(map);
      } catch {
        setError('Không thể tải Spotlight');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  useEffect(() => {
    const trigger = loadTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreSpotlight();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [feed.length, loadMoreSpotlight]);

  const handleLike = async (media: MentorMedia) => {
    if (!user) return;
    const liked = media.likes?.includes(user.uid) ?? false;
    await toggleLikeMentorMedia(media.id, user.uid, liked);
    // Optimistic update
    setFeed((prev) =>
      prev.map((m) =>
        m.id === media.id
          ? {
              ...m,
              likes: liked
                ? m.likes.filter((id) => id !== user.uid)
                : [...(m.likes ?? []), user.uid],
            }
          : m
      )
    );
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header title="✨ Spotlight" />
        <div className="page">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
            <p>Đang tải Spotlight...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title="✨ Spotlight" />
      <div className="page">
        <div style={{ padding: '8px 12px 16px' }}>
          {/* Subtitle */}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Nect Lite by GameNect — Public highlights từ creators
          </p>

          {error ? (
            <EmptyState icon="⚠️" title="Lỗi" description={error} />
          ) : feed.length === 0 ? (
            <EmptyState
              icon="✨"
              title="Chưa có Spotlight"
              description="Các creators chưa đăng nội dung nào. Hãy quay lại sau!"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {feed.map((media, index) => {
                const author = authorMap[media.mentorId];
                const loadTriggerIndex = Math.max(0, feed.length - 3);
                return (
                  <div key={media.id} ref={index === loadTriggerIndex ? loadTriggerRef : null}>
                    <SpotlightCard
                      posts={[media]}
                      mentorMap={authorMap as any}
                      unseenIds={[]}
                      currentUserId={user?.uid}
                      onLike={(postId, isLiked) => handleLike(media)}
                    />
                    {loadingMore && index === feed.length - 1 && (
                      <div className="loading-screen" style={{ padding: '8px 0 20px' }}>
                        <div className="spinner" style={{ width: 28, height: 28 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
