import React, { useState } from 'react';
import { MomentModel, UserModel } from '@/lib/types';

interface MomentPreviewCardProps {
  moments?: MomentModel[];
  authorMap?: Record<string, UserModel>;
  unseenIds?: string[];
  currentUserId?: string;
  onOpen?: () => void;
  onMarkViewed?: (momentId: string) => void;
  onLike?: (momentId: string, isLiked: boolean) => void;
  onViewAll?: () => void;
}

export default function MomentPreviewCard({
  moments = [],
  authorMap = {},
  unseenIds = [],
  currentUserId,
  onOpen,
  onMarkViewed,
  onLike,
  onViewAll,
}: MomentPreviewCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showReactors, setShowReactors] = useState(false);

  const displayPosts = React.useMemo(() => {
    if (!moments || moments.length === 0) return [];
    if (!unseenIds || unseenIds.length === 0) return moments.slice(0, 8);
    const unseen = moments.filter(m => unseenIds.includes(m.id));
    return unseen.length > 0 ? unseen : moments.slice(0, 8);
  }, [moments, unseenIds]);

  if (displayPosts.length === 0) return null;
  const moment = displayPosts[currentIndex] || displayPosts[0];
  const stackCount = unseenIds.length > 0 ? Math.min(unseenIds.length, 3) : 1;
  const unseenCount = unseenIds.length;
  const author = authorMap[moment.userId];

  const previewUrl = moment?.thumbnailUrl || moment?.mediaUrl;
  const reactionCount = moment?.reactions?.length ?? 0;
  const isLiked = currentUserId ? moment?.reactions?.some(r => r.userId === currentUserId) : false;
  
  // Lấy danh sách tối đa 3 user đã thả tim để hiển thị avatar đè lên nhau
  const recentReactors = (moment?.reactions || []).slice(-3).map(r => r.userId);

  const nextMoment = displayPosts[currentIndex + 1];
  const nextPreviewUrl = nextMoment?.thumbnailUrl || nextMoment?.mediaUrl;

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Luôn luôn đánh dấu đã xem ngay khi click
    if (onMarkViewed) onMarkViewed(moment.id);

    if (animating || displayPosts.length <= 1 || isFinished) {
      if (onOpen) onOpen();
      return;
    }
    setAnimating(true);

    setTimeout(() => {
      if (currentIndex >= displayPosts.length - 1) {
        setCurrentIndex(0);
        setIsFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      setAnimating(false);
    }, 400);
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '18px' }}>
            {stackCount >= 3 && (
              <div 
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 8,
                  right: -8,
                  height: '100%',
                  background: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '4px solid var(--neo-border)',
                  zIndex: 0,
                }}
              />
            )}
            {stackCount >= 2 && (
              <div 
                style={{
                  position: 'absolute',
                  top: -4,
                  left: 4,
                  right: -4,
                  height: '100%',
                  background: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '4px solid var(--neo-border)',
                  zIndex: 0,
                }}
              />
            )}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '4px solid var(--neo-border)',
                zIndex: 0,
              }}
            />

      <div
        className="neo-box"
        style={{
          position: 'relative',
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          height: '220px',
          overflow: 'hidden',
          zIndex: 1,
          background: 'var(--bg-surface)',
          borderRadius: '16px',
        }}
      >
        <button
          type="button"
          onClick={handleImageClick}
          style={{
            width: '62%',
            position: 'relative',
            border: 0,
            borderRight: '4px solid var(--neo-border)',
            padding: 0,
            background: '#000',
            cursor: moment ? 'pointer' : 'default',
            overflow: 'hidden'
          }}
        >
          <div className={animating ? 'fly-away' : ''} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            {previewUrl ? (
              moment?.isVideo ? (
                <video
                  src={previewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={moment?.caption || 'Moment'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--accent-dim)',
                  color: 'var(--text-primary)',
                  fontSize: '2rem',
                  fontWeight: 900,
                }}
              >
                +
              </div>
            )}
          </div>

          {/* Preload Next Image */}
          {nextPreviewUrl && (
            <img src={nextPreviewUrl} style={{ display: 'none' }} alt="" />
          )}

          {/* View All Button */}
          {onViewAll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAll();
              }}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '16px',
                padding: '4px 10px',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                zIndex: 3,
                cursor: 'pointer',
              }}
            >
              XEM
            </button>
          )}

          {/* Bottom Bar Info (Overlay) */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              zIndex: 2,
              gap: '6px'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                overflow: 'hidden',
                background: '#FF6E40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {author?.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 900 }}>M</span>
              )}
            </div>
            {moment?.caption && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  flexShrink: 1,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {moment.caption}
                </div>
              </div>
            )}
            
          </div>
        </button>

        <div
          style={{
            width: '38%',
            padding: '12px 12px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {unseenCount > 0 && (
            <div
              style={{
                background: '#FF2D55',
                border: '3px solid var(--neo-border)',
                borderRadius: '14px',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '3px 3px 0 var(--neo-border)',
                marginBottom: '10px',
              }}
            >
              <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>
                {unseenCount > 99 ? '99+' : unseenCount}
              </span>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '0.55rem', letterSpacing: '0.5px' }}>
                MOMENTS
              </span>
            </div>
          )}

          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 8px',
              letterSpacing: '0.5px',
              textAlign: 'left',
            }}
          >
            MOMENT<br />POSTS
          </h2>

          <button
            type="button"
            onClick={() => {
              if (onMarkViewed) onMarkViewed(moment.id);
              if (onOpen) onOpen();
            }}
            className="neo-btn"
            style={{
              background: '#FFF3E0',
              borderWidth: 2,
              borderRadius: '20px',
              boxShadow: 'none',
              height: '34px',
              padding: '0 10px',
              fontSize: '0.6rem',
              whiteSpace: 'nowrap',
            }}
          >
            Chạm ảnh để xem
          </button>

          <div style={{ flex: 1 }} />

          {/* Hàng chứa Like button và Avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <button
              className="neo-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onLike) onLike(moment.id, isLiked);
              }}
              style={{
                background: isLiked ? '#FF2D55' : 'var(--bg-surface)',
                color: isLiked ? 'white' : 'var(--text-primary)',
                padding: '4px 12px',
                height: '36px',
                borderRadius: '10px',
                borderWidth: '3px',
                boxShadow: '3px 3px 0 var(--neo-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{isLiked ? '❤️' : '🤍'}</span>
              {reactionCount > 0 && (
                <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{reactionCount}</span>
              )}
            </button>

            {/* Chùm Avatar những người đã like */}
            {recentReactors.length > 0 && (
              <div 
                style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', marginLeft: '4px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactors(true);
                }}
              >
                {recentReactors.map((uid, idx) => {
                  const reactor = authorMap[uid];
                  return (
                    <div
                      key={`${uid}-${idx}`}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-surface)',
                        marginLeft: '-8px',
                        overflow: 'hidden',
                        background: '#FF6E40',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: idx, // Avatar sau đè lên avatar trước
                      }}
                    >
                      {reactor?.avatarUrl ? (
                        <img src={reactor.avatarUrl} alt="reactor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '10px' }}>👤</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reactors Modal */}
      {showReactors && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowReactors(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              border: '4px solid var(--neo-border)',
              boxShadow: '4px 4px 0 var(--neo-border)',
              width: '100%',
              maxWidth: '320px',
              maxHeight: '70vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '2px solid var(--neo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF3E0' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Lượt thích</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowReactors(false); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(moment?.reactions || []).map((reaction, i) => {
                const reactor = authorMap[reaction.userId];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--neo-border)', flexShrink: 0, background: '#FF6E40' }}>
                      {reactor?.avatarUrl ? (
                        <img src={reactor.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reactor?.username || 'Người dùng ẩn danh'}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem' }}>
                      {reaction.emoji || '❤️'}
                    </div>
                  </div>
                );
              })}
              {(!moment?.reactions || moment.reactions.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                  Chưa có ai bày tỏ cảm xúc
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
