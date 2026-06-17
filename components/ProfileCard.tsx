'use client';

import { UserModel } from '@/lib/types';
import Image from 'next/image';
import InterestTag from './InterestTag';
import GameTag from './GameTag';
import Link from 'next/link';

interface ProfileCardProps {
  user: UserModel;
  showActions?: boolean;
}

export default function ProfileCard({ user, showActions }: ProfileCardProps) {
  return (
    <div className="animate-fadeIn">
      {/* Hero photo */}
      <div className="profile-hero">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.username} fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--bg-card), var(--accent-dim))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
            }}
          >
            👤
          </div>
        )}
        <div className="profile-hero-overlay">
          <div className="flex items-center gap-2">
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              {user.username}
            </h2>
            {user.age ? (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.25rem' }}>{user.age}</span>
            ) : null}
            {user.isVerified && <span className="badge badge-verified">✓</span>}
            {user.isPremium && <span className="badge badge-premium">⭐</span>}
          </div>
          {(user.city || user.country) && (
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: '0.875rem' }}>
              📍 {[user.city, user.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="card p-4 mb-4">
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{user.bio}</p>
        </div>
      )}

      {/* Stats row */}
      <div
        className="card mb-4"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          textAlign: 'center',
          padding: '16px 0',
        }}
      >
        {[
          { label: 'Likes', value: user.likeCount },
          { label: 'Matches', value: user.matchCount },
          { label: 'Friends', value: user.friendCount },
        ].map((s) => (
          <div key={s.label} style={{ padding: '0 12px' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', margin: 0 }}>
              {s.value ?? 0}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card p-4 mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { icon: '🎮', label: 'Game Style', value: user.gameStyle },
          { icon: '💫', label: 'Looking For', value: user.lookingFor },
          { icon: '🏅', label: 'Rank', value: user.rank },
          { icon: '📏', label: 'Height', value: user.height ? `${user.height} cm` : null },
        ]
          .filter((r) => r.value)
          .map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', minWidth: 90 }}>{r.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                {r.value}
              </span>
            </div>
          ))}
      </div>

      {/* Interests */}
      {user.interests.length > 0 && (
        <div className="card p-4 mb-4">
          <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Sở thích</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.interests.map((i) => (
              <InterestTag key={i} label={i} />
            ))}
          </div>
        </div>
      )}

      {/* Games */}
      {user.favoriteGames.length > 0 && (
        <div className="card p-4 mb-4">
          <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Game yêu thích</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.favoriteGames.map((g) => (
              <GameTag key={g} gameName={g} />
            ))}
          </div>
        </div>
      )}

      {/* Additional photos */}
      {user.additionalPhotos.length > 0 && (
        <div className="card p-4 mb-4">
          <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Ảnh</h4>
          <div className="grid-2">
            {user.additionalPhotos.map((url, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--bg-input)',
                }}
              >
                <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <Link href="/profile" className="btn btn-secondary btn-full mb-4" style={{ textDecoration: 'none' }}>
          ✏️ Chỉnh sửa hồ sơ
        </Link>
      )}
    </div>
  );
}
