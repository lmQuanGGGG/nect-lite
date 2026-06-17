'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subscribeToMessages, sendMessage, sendMediaMessage, markAsRead } from '@/services/chat.service';
import { getUser } from '@/services/profile.service';
import { uploadChatMedia } from '@/services/storage.service';
import { MessageModel, UserModel } from '@/lib/types';
import { cacheKey, readPersistentCache, writePersistentCache } from '@/lib/persistent-cache';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import MessageBubble from '@/components/MessageBubble';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

export default function ChatDetailPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [peer, setPeer] = useState<UserModel | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Get match info to find peer
  useEffect(() => {
    if (!user || !matchId) return;
    import('firebase/firestore').then(({ getDoc, doc }) => {
      import('@/lib/firebase').then(({ db }) => {
        getDoc(doc(db, 'matches', matchId)).then(async (snap) => {
          if (!snap.exists()) return;
          const ids: string[] = snap.data().userIds ?? [];
          const peerId = ids.find((id) => id !== user.uid);
          if (peerId) {
            const peerUser = await getUser(peerId);
            setPeer(peerUser);
          }
        });
      });
    });
  }, [user, matchId]);

  // Subscribe to messages
  useEffect(() => {
    if (!matchId || !user) return;

    // Load from cache first
    const cached = readPersistentCache<MessageModel[]>(cacheKey('chat-messages', matchId));
    if (cached && cached.length > 0) {
      setMessages(cached);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 10);
    }

    const unsub = subscribeToMessages(matchId, (msgs) => {
      setMessages(msgs);
      writePersistentCache(cacheKey('chat-messages', matchId), msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    // Mark as read
    markAsRead(matchId, user.uid).catch(() => {});
    return () => unsub();
  }, [matchId, user]);

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    const t = text.trim();
    setText('');
    try {
      await sendMessage(matchId, user.uid, t);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const url = await uploadChatMedia(matchId, file);
      await sendMediaMessage(matchId, user.uid, url, file.type.startsWith('video'));
    } catch {
      toast.error('Gửi file thất bại');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <AppShell showNav={false}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--app-max-width, 430px)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          zIndex: 110,
          borderBottom: '1px solid #eee'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => window.history.back()}
            style={{ 
              width: 36, height: 36, borderRadius: 999, 
              border: '2px solid #000', background: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, cursor: 'pointer'
            }}
          >
            {'<'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img 
              src={peer?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer?.username || 'User'}`} 
              alt={peer?.username || 'User'} 
              style={{ width: 40, height: 40, borderRadius: 999, border: '2px solid #000', objectFit: 'cover', background: '#eee' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: '1rem', lineHeight: '1.2' }}>{peer?.username || 'Đang tải...'}</span>
              <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Chạm ghé</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: 999, border: '2px solid #000', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>📞</button>
          <button style={{ width: 32, height: 32, borderRadius: 999, border: '2px solid #000', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>📹</button>
          <button style={{ width: 32, height: 32, borderRadius: 999, border: '2px solid #000', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 900 }}>i</button>
        </div>
      </header>

      {/* Messages */}
      <div
        className="page page-no-header"
        style={{
          paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))',
          paddingBottom: 72,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="messages-wrapper" style={{ flex: 1, paddingBottom: 16 }}>
          {messages.length === 0 && !loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <EmptyState 
                icon="👋" 
                title="Bắt đầu trò chuyện" 
                description={`Hãy gửi lời chào đến ${peer?.username ?? 'người bạn mới'} để bắt đầu cuộc trò chuyện nhé!`} 
              />
            </div>
          ) : (
            messages
              .filter((m) => m.type !== 'react')
              .map((m) => (
                <MessageBubble key={m.id} message={m} isSent={m.senderId === user?.uid} peerAvatar={peer?.avatarUrl} />
              ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
        <div
          style={{
            position: 'fixed',
            bottom: 'env(safe-area-inset-bottom, 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 'calc(var(--app-max-width, 430px) - 32px)',
            background: '#fff',
            border: '3px solid #000',
            borderRadius: 999,
            padding: '6px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}
        >
          <button
            id="btn-media-attach"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={{ 
              flexShrink: 0, width: 40, height: 40, padding: 0, 
              borderRadius: 999, background: '#F3F4F6', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', cursor: 'pointer'
            }}
          >
            +
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMedia} />

          <input
            id="chat-input"
            type="text"
            style={{ 
              flex: 1, height: '40px', background: 'transparent', border: 'none', 
              outline: 'none', fontSize: '0.95rem', padding: '0 4px'
            }}
            placeholder="iMessage"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />

          <button
            id="btn-send-message"
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || loading}
            style={{ 
              flexShrink: 0, width: 40, height: 40, padding: 0, 
              borderRadius: 999, background: '#FF8A65', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: '#fff', cursor: 'pointer'
            }}
          >
            🎙️
          </button>
        </div>
    </AppShell>
  );
}
