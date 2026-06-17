'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { UserModel } from '@/lib/types';
import GameTag from './GameTag';
import InterestTag from './InterestTag';

interface SwipeCardProps {
  user: UserModel;
  onLike: () => void;
  onDislike: () => void;
  isTop?: boolean;
}

type GestureMode = 'idle' | 'horizontal' | 'vertical';

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{title}</h3>
      <div
        style={{
          background: '#fff',
          border: '3px solid var(--neo-border, #000)',
          borderRadius: 16,
          boxShadow: '3px 3px 0 var(--neo-border, #000)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | number | null; icon: string }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '2px solid rgba(0,0,0,0.12)',
      }}
    >
      <span style={{ width: 22, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 900, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StatCard({ title, value, unit, icon }: { title: string; value?: string | number; unit: string; icon: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: 14,
        border: '3px solid var(--neo-border, #000)',
        borderRadius: 16,
        boxShadow: '3px 3px 0 var(--neo-border, #000)',
        background: '#fff',
      }}
    >
      <div style={{ color: 'var(--accent-orange, #FF6E40)', fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-secondary, #4A4A52)' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 900 }}>{value ?? 0}</span>
        <span style={{ fontSize: 12, fontWeight: 900 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function SwipeCard({ user, onLike, onDislike, isTop = false }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const gestureMode = useRef<GestureMode>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  const photos = [
    ...(user.avatarUrl ? [user.avatarUrl] : []),
    ...(user.additionalPhotos || []),
  ].filter(Boolean);
  const mainPhoto = photos[photoIndex] || photos[0] || null;

  const goToPreviousPhoto = useCallback(() => {
    setPhotoIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextPhoto = useCallback(() => {
    setPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));
  }, [photos.length]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTop) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    gestureMode.current = 'idle';
    setDragging(true);
  }, [isTop]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !isTop) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (gestureMode.current === 'idle') {
      if (absY > 8 && absY > absX * 1.15) {
        gestureMode.current = 'vertical';
        setDragX(0);
        return;
      }

      if (absX > 10 && absX > absY * 1.15) {
        gestureMode.current = 'horizontal';
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Pointer may already be released on some browsers.
        }
      }
    }

    if (gestureMode.current !== 'horizontal') return;
    e.preventDefault();
    setDragX(dx);
  }, [dragging, isTop]);

  const onPointerUp = useCallback(() => {
    if (!dragging || !isTop) return;
    const wasHorizontal = gestureMode.current === 'horizontal';
    setDragging(false);
    gestureMode.current = 'idle';

    if (wasHorizontal) {
      if (dragX > 90) {
        onLike();
      } else if (dragX < -90) {
        onDislike();
      }
    }
    setDragX(0);
  }, [dragging, dragX, isTop, onLike, onDislike]);

  const rotation = dragX * 0.08;
  const likeOpacity = Math.max(0, Math.min(1, dragX / 90));
  const nopeOpacity = Math.max(0, Math.min(1, -dragX / 90));

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={{
        position: 'absolute',
        inset: 0,
        border: '4px solid var(--neo-border, #000)',
        borderRadius: 30,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.92)',
        transform: isTop ? `translateX(${dragX}px) rotate(${rotation}deg)` : undefined,
        transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: isTop ? 2 : 1,
        boxShadow: isTop ? 'var(--shadow-card, 8px 8px 0 #000)' : 'var(--shadow-neo, 4px 4px 0 #000)',
        cursor: isTop ? (gestureMode.current === 'horizontal' ? 'grabbing' : 'grab') : 'default',
        touchAction: 'pan-y',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {isTop && (
        <>
          <span className="swipe-label-like" style={{ opacity: likeOpacity }}>LIKE</span>
          <span className="swipe-label-nope" style={{ opacity: nopeOpacity }}>NOPE</span>
        </>
      )}

      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: isTop ? 108 : 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 4',
            minHeight: 360,
            background: 'linear-gradient(135deg, var(--bg-card, #fff), var(--accent-dim, #FFE0D5))',
          }}
        >
          {mainPhoto ? (
            <Image
              src={mainPhoto}
              alt={user.username}
              draggable={false}
              fill
              sizes="(max-width: 768px) 100vw, 430px"
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                fontWeight: 900,
              }}
            >
              👤
            </div>
          )}

          {photos.length > 1 && (
            <div style={{ position: 'absolute', top: 14, left: 18, right: 18, display: 'flex', gap: 4 }}>
              {photos.slice(0, 5).map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: index === photoIndex ? 'var(--accent-orange, #FF6E40)' : 'rgba(255,255,255,0.62)',
                    border: '1px solid rgba(0,0,0,0.25)',
                  }}
                />
              ))}
            </div>
          )}

          {photos.length > 1 && isTop && (
            <>
              <button
                type="button"
                aria-label="Ảnh trước"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousPhoto();
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '42%',
                  border: 0,
                  background: 'transparent',
                  cursor: photoIndex > 0 ? 'pointer' : 'default',
                }}
              />
              <button
                type="button"
                aria-label="Ảnh tiếp theo"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPhoto();
                }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '42%',
                  border: 0,
                  background: 'transparent',
                  cursor: photoIndex < photos.length - 1 ? 'pointer' : 'default',
                }}
              />
            </>
          )}

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '72px 20px 22px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.86), rgba(0,0,0,0.25), transparent)',
              color: '#fff',
            }}
          >
            <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>
              {user.username}{user.age ? `, ${user.age}` : ''}
            </h2>
            {(user.city || user.country || user.location) && (
              <p style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 800, fontSize: '0.85rem', marginTop: 4 }}>
                📍 {[user.city || user.location, user.country].filter(Boolean).join(', ')}
              </p>
            )}
            {user.rank && (
              <p style={{ color: 'var(--accent-orange, #FF6E40)', fontWeight: 900, fontSize: '0.95rem', marginTop: 4 }}>
                {user.rank}
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: 22 }}>
          <InfoSection title="Thông tin cơ bản">
            <InfoRow icon="🎂" label="Tuổi" value={user.age ? `${user.age} tuổi` : null} />
            <InfoRow icon="↕" label="Chiều cao" value={user.height ? `${user.height} cm` : null} />
            <InfoRow icon="●" label="Giới tính" value={user.gender} />
            <InfoRow icon="⌖" label="Khoảng cách" value={user.distanceKm != null ? `${user.distanceKm.toFixed(1)} km` : null} />
          </InfoSection>

          <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            <StatCard title="Thời gian chơi" value={user.playTime} unit="p/n" icon="⏱" />
            <StatCard title="Tỷ lệ thắng" value={user.winRate} unit="%" icon="↗" />
          </div>

          {user.bio && (
            <section style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Giới thiệu</h3>
              <p style={{ color: '#000', fontSize: 15, fontWeight: 800, lineHeight: 1.45 }}>
                {user.bio}
              </p>
            </section>
          )}

          <InfoSection title="Thông tin game">
            <InfoRow icon="🎮" label="Phong cách" value={user.gameStyle} />
            <InfoRow icon="★" label="Rank" value={user.rank} />
            <InfoRow icon="⌕" label="Mục đích" value={user.lookingFor} />
          </InfoSection>

          {(user.favoriteGames || []).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Game yêu thích</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(user.favoriteGames || []).map((game) => (
                  <GameTag key={game} gameName={game} />
                ))}
              </div>
            </section>
          )}

          {(user.interests || []).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Sở thích khác</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(user.interests || []).map((interest) => (
                  <InterestTag key={interest} label={interest} />
                ))}
              </div>
            </section>
          )}

          {(user.location || user.city || user.country) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 15 }}>
              <span style={{ color: 'var(--accent-orange, #FF6E40)' }}>◆</span>
              {[user.location || user.city, user.country].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      {isTop && (
        <div
          className="swipe-actions"
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            pointerEvents: 'none',
          }}
        >
          <button
            id="btn-dislike"
            className="neo-btn-circle"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDislike(); }}
            aria-label="Dislike"
            style={{ width: 64, height: 64, border: '4px solid var(--neo-border, #000)', borderRadius: '50%', boxShadow: '4px 4px 0 var(--neo-border, #000)', background: '#fff', fontSize: '1.7rem', pointerEvents: 'auto' }}
          >
            ✕
          </button>
          <button
            id="btn-like"
            className="neo-btn-circle"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            aria-label="Like"
            style={{ width: 64, height: 64, border: '4px solid var(--neo-border, #000)', borderRadius: '50%', boxShadow: '4px 4px 0 var(--neo-border, #000)', background: 'var(--accent-red, #FF2D55)', color: '#fff', fontSize: '1.8rem', pointerEvents: 'auto' }}
          >
            ♥
          </button>
        </div>
      )}
    </div>
  );
}
