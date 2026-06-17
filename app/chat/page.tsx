'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToMatches, subscribeToMessages } from '@/services/chat.service';
import { getUser } from '@/services/profile.service';
import { MatchModel, MessageModel, UserModel } from '@/lib/types';
import { cacheKey, readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import ChatListItem from '@/components/ChatListItem';
import EmptyState from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

const chatCache: {
  userId: string;
  matches: MatchModel[];
  peerMap: Record<string, UserModel>;
  messageMap: Record<string, MessageModel[]>;
  hasFetched: boolean;
} = {
  userId: '',
  matches: [],
  peerMap: {},
  messageMap: {},
  hasFetched: false,
};

const chatListCacheKey = (userId: string) => cacheKey('chat-list', userId);
const chatMessagesCacheKey = (matchId: string) => cacheKey('chat-messages', matchId);

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchModel[]>([]);
  const [peerMap, setPeerMap] = useState<Record<string, UserModel>>({});
  const [messageMap, setMessageMap] = useState<Record<string, MessageModel[]>>({});
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    const cached = readPersistentCache<{
      matches: MatchModel[];
      peerMap: Record<string, UserModel>;
      messageMap: Record<string, MessageModel[]>;
    }>(chatListCacheKey(user.uid));

    if (chatCache.hasFetched && chatCache.userId === user.uid) {
      setMatches(chatCache.matches);
      setPeerMap(chatCache.peerMap);
      setMessageMap(chatCache.messageMap);
      setLoading(false);
    } else if (cached) {
      chatCache.userId = user.uid;
      chatCache.matches = cached.matches ?? [];
      chatCache.peerMap = cached.peerMap ?? {};
      chatCache.messageMap = cached.messageMap ?? {};
      chatCache.hasFetched = true;

      setMatches(chatCache.matches);
      setPeerMap(chatCache.peerMap);
      setMessageMap(chatCache.messageMap);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const messageUnsubs = new Map<string, () => void>();

    const unsub = subscribeToMatches(user.uid, async (newMatches) => {
      const confirmed = newMatches.filter((m) => m.status === 'confirmed');

      const peerIds = confirmed.map((m) =>
        m.userIds.find((id) => id !== user.uid) ?? ''
      ).filter(Boolean);

      const newMap: Record<string, UserModel> = chatCache.userId === user.uid
        ? { ...chatCache.peerMap }
        : {};
      await Promise.all(
        peerIds
          .filter((id) => !newMap[id])
          .map(async (id) => {
            const u = await getUser(id);
            if (u) newMap[id] = u;
          })
      );

      chatCache.userId = user.uid;
      chatCache.matches = confirmed;
      chatCache.peerMap = newMap;
      chatCache.messageMap = { ...chatCache.messageMap };
      chatCache.hasFetched = true;

      setMatches(confirmed);
      setPeerMap(newMap);
      writePersistentCache(chatListCacheKey(user.uid), {
        matches: chatCache.matches,
        peerMap: chatCache.peerMap,
        messageMap: chatCache.messageMap,
      });

      const preloadIds = confirmed.slice(0, 8).map((m) => m.id);
      Array.from(messageUnsubs.keys()).forEach((id) => {
        if (!preloadIds.includes(id)) {
          messageUnsubs.get(id)?.();
          messageUnsubs.delete(id);
        }
      });
      
      // Cleanup old chat message caches to prevent localStorage overflow
      try {
        const allKeys = Object.keys(window.localStorage);
        allKeys.forEach((k) => {
          if (k.startsWith('gamenect-lite:v1:chat-messages:')) {
            const id = k.replace('gamenect-lite:v1:chat-messages:', '');
            if (!preloadIds.includes(id)) {
              window.localStorage.removeItem(k);
            }
          }
        });
      } catch (e) {
        // noop
      }

      preloadIds.forEach((id) => {
        if (messageUnsubs.has(id)) return;

        const cachedMessages = readPersistentCache<MessageModel[]>(chatMessagesCacheKey(id));
        if (cachedMessages?.length) {
          chatCache.messageMap = { ...chatCache.messageMap, [id]: cachedMessages };
          setMessageMap(chatCache.messageMap);
        }

        const unsubMessages = subscribeToMessages(id, (msgs) => {
          const recentMessages = msgs.slice(-15);
          chatCache.messageMap = { ...chatCache.messageMap, [id]: recentMessages };
          writePersistentCache(chatMessagesCacheKey(id), recentMessages);
          writePersistentCache(chatListCacheKey(user.uid), {
            matches: chatCache.matches,
            peerMap: chatCache.peerMap,
            messageMap: chatCache.messageMap,
          });
          setMessageMap(chatCache.messageMap);
        }, 15);
        messageUnsubs.set(id, unsubMessages);
      });

      setLoading(false);
    });

    return () => {
      unsub();
      messageUnsubs.forEach((stop) => stop());
    };
  }, [user, authLoading]);

  const filteredMatches = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => {
      const peerId = m.userIds.find((id) => id !== user?.uid) ?? '';
      const peer = peerMap[peerId];
      const cachedMessages = messageMap[m.id] ?? [];
      const lastCached = cachedMessages[cachedMessages.length - 1];
      const cachedText = lastCached?.text ?? lastCached?.caption;
      return (
        peer?.username?.toLowerCase().includes(q) ||
        m.lastMessage?.toLowerCase().includes(q) ||
        cachedText?.toLowerCase().includes(q)
      );
    });
  }, [matches, messageMap, peerMap, queryText, user?.uid]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <Header title="Tin nhắn" />
        <div className="page page-content">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title="Tin nhắn" />
      <div className="page" style={{ padding: '16px 14px calc(var(--nav-height) + 40px + env(safe-area-inset-bottom))' }}>
        <div style={{ marginBottom: '16px' }}>
          <div
            className="neo-box"
            style={{
              position: 'relative',
              padding: 0,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1rem',
                fontWeight: 900,
                color: 'var(--accent-orange)',
              }}
            >
              //
            </span>
            <input 
              type="text" 
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Tìm tên hoặc tin nhắn..." 
              style={{
                width: '100%',
                height: 48,
                border: 0,
                outline: 0,
                padding: '0 16px 0 48px',
                background: 'transparent',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            />
          </div>
        </div>

        <div
          className="neo-box"
          style={{
            padding: '14px',
            marginBottom: '16px',
            background: '#FFF7ED',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>
              Tương hợp mới
            </h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--accent-orange)' }}>
              {matches.length}
            </span>
          </div>
          {matches.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Chưa có tương hợp mới nào.</p>
          ) : (
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '2px 2px 8px' }}>
              {matches.slice(0, 12).map(m => {
                const peerId = m.userIds.find(id => id !== user?.uid) ?? '';
                const peer = peerMap[peerId];
                if (!peer) return null;
                return (
                  <button
                    key={`new-${m.id}`}
                    type="button"
                    style={{
                      width: 68,
                      border: 0,
                      padding: 0,
                      background: 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      flex: '0 0 auto',
                    }}
                    onClick={() => router.push(`/chat/${m.id}`)}
                  >
                    <img 
                      src={peer.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + peer.username} 
                      className="neo-avatar" 
                      style={{ width: '60px', height: '60px', borderColor: 'var(--accent-orange)' }} 
                      alt={peer.username}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '64px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {peer.username}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 2px 12px', color: 'var(--text-secondary)' }}>
            Tin nhắn
          </h3>
          {matches.length === 0 ? (
            <EmptyState
              icon="💬"
              title="Chưa có cuộc trò chuyện"
              description="Match với ai đó trong Khám phá để bắt đầu nhắn tin!"
            />
          ) : filteredMatches.length === 0 ? (
            <EmptyState
              icon="?"
              title="Không tìm thấy"
              description="Thử tìm bằng tên hoặc nội dung tin nhắn khác nhé."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMatches.map((m) => {
                const peerId = m.userIds.find((id) => id !== user?.uid) ?? '';
                const peer = peerMap[peerId];
                return (
                  <ChatListItem
                    key={m.id}
                    match={m}
                    currentUserId={user?.uid ?? ''}
                    peerName={peer?.username}
                    peerAvatar={peer?.avatarUrl}
                    onClick={() => router.push(`/chat/${m.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
