'use client';

import { UserModel } from '@/lib/types';

interface MatchModalProps {
  me: UserModel;
  other: UserModel;
  onClose: () => void;
  onChat: () => void;
  matchId: string;
}

export default function MatchModal({ me, other, onClose, onChat }: MatchModalProps) {
  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Confetti-style sparks */}
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>

        <div className="match-avatars">
          <div className="match-avatar-wrap">
            {me.avatarUrl ? (
              <img src={me.avatarUrl} alt={me.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
            )}
          </div>
          <div className="match-avatar-wrap" style={{ marginLeft: -16 }}>
            {other.avatarUrl ? (
              <img src={other.avatarUrl} alt={other.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
            )}
          </div>
        </div>

        <h2>It&apos;s a Match!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Bạn và <strong style={{ color: 'var(--text-primary)' }}>{other.username}</strong> đã match nhau 🔥
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button id="btn-start-chat" className="btn btn-primary btn-full" onClick={onChat}>
            💬 Nhắn tin ngay
          </button>
          <button id="btn-keep-swiping" className="btn btn-secondary btn-full" onClick={onClose}>
            Tiếp tục khám phá
          </button>
        </div>
      </div>
    </div>
  );
}
