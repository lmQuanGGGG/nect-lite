'use client';

import { MatchModel } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface ChatListItemProps {
  match: MatchModel;
  currentUserId: string;
  peerName?: string;
  peerAvatar?: string;
  onClick?: () => void;
}

function toDate(value?: any): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : new Date(time);
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    if ('_seconds' in value && typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
  }
  return null;
}

function formatTime(ts?: Timestamp | string): string {
  if (!ts) return '';
  const date = toDate(ts);
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function ChatListItem({
  match,
  currentUserId,
  peerName,
  peerAvatar,
  onClick,
}: ChatListItemProps) {
  const isUnread =
    match.lastMessageSenderId !== currentUserId && match.lastMessageRead === false;
  const fallbackSeed = encodeURIComponent(peerName ?? match.id);
  const previewText = match.lastMediaUrl
    ? match.lastIsVideo
      ? 'Đã gửi video'
      : 'Đã gửi hình ảnh'
    : match.lastMessage ?? 'Bắt đầu trò chuyện...';

  return (
    <div
      className="chat-item neo-box"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        cursor: 'pointer',
        background: isUnread ? '#FFF7ED' : '#fff',
        minHeight: 84,
      }}
    >
      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        {peerAvatar ? (
          <img src={peerAvatar} alt={peerName} className="neo-avatar" style={{ width: '58px', height: '58px' }} />
        ) : (
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`}
            alt={peerName ?? 'Người dùng'}
            className="neo-avatar"
            style={{ width: '58px', height: '58px' }}
          />
        )}
        {isUnread && (
          <span
            style={{
              position: 'absolute',
              right: -1,
              top: -1,
              width: 14,
              height: 14,
              borderRadius: 99,
              background: 'var(--accent-pink)',
              border: '2px solid #fff',
              boxShadow: '0 0 0 2px var(--neo-border)',
            }}
          />
        )}
      </div>

      <div className="chat-item-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <p className="chat-item-name" style={{ fontWeight: 900, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {peerName ?? 'Người dùng'}
          </p>
          {match.isMentorMatch && (
            <span style={{ flex: '0 0 auto', fontSize: '0.62rem', fontWeight: 900, color: '#fff', background: 'var(--accent-orange)', border: '2px solid var(--neo-border)', borderRadius: 999, padding: '1px 6px' }}>
              MENTOR
            </span>
          )}
        </div>
        <p className="chat-item-last" style={{ color: isUnread ? '#111' : 'var(--text-secondary)', fontWeight: isUnread ? 900 : 700, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '6px' }}>
          {previewText}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flex: '0 0 auto' }}>
        <span
          className="chat-item-time"
          style={{
            minWidth: 38,
            textAlign: 'center',
            fontSize: '0.7rem',
            fontWeight: 900,
            color: isUnread ? '#fff' : 'var(--accent-orange)',
            background: isUnread ? 'var(--accent-pink)' : '#FFF7ED',
            border: '2px solid var(--neo-border)',
            borderRadius: 999,
            padding: '2px 6px',
          }}
        >
          {formatTime(match.lastMessageTime)}
        </span>
        {match.lastMediaUrl && (
          <div
            style={{
              width: 34,
              height: 34,
              border: '2px solid var(--neo-border)',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#eee',
            }}
          >
            <img
              src={match.lastMediaUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
