import React, { useState } from 'react';
import { MentorMedia, UserModel } from '@/lib/types';
import toast from 'react-hot-toast';

interface SpotlightCardProps {
  posts?: MentorMedia[];
  mentorMap?: Record<string, UserModel>;
  unseenIds?: string[];
  currentUserId?: string;
  onLike?: (postId: string, isLiked: boolean) => void;
  onOpen?: () => void;
  onMarkViewed?: (postId: string) => void;
  onViewAll?: () => void;
}

export default function SpotlightCard({
  posts = [],
  mentorMap = {},
  unseenIds = [],
  currentUserId,
  onLike,
  onOpen,
  onMarkViewed,
  onViewAll,
}: SpotlightCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const displayPosts = React.useMemo(() => {
    if (!posts || posts.length === 0) return [];
    if (!unseenIds || unseenIds.length === 0) return posts.slice(0, 8);
    const unseen = posts.filter(p => unseenIds.includes(p.id));
    return unseen.length > 0 ? unseen : posts.slice(0, 8);
  }, [posts, unseenIds]);

  if (displayPosts.length === 0) return null;
  const post = displayPosts[currentIndex] || displayPosts[0];
  const stackCount = unseenIds.length > 0 ? Math.min(unseenIds.length, 3) : 1;
  const unseenCount = unseenIds.length;
  
  const mentorName = mentorMap[post.mentorId]?.username || 'Mentor';
  const avatarUrl = mentorMap[post.mentorId]?.avatarUrl || '';

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isVideo = post.type === 'video';
  const previewUrl = isVideo ? post.thumbnailUrl || post.url : post.url;

  const nextPost = displayPosts[currentIndex + 1];
  const nextPreviewUrl = nextPost ? (nextPost.type === 'video' ? nextPost.thumbnailUrl || nextPost.url : nextPost.url) : null;

  const handleImageClick = () => {
    // Luôn luôn đánh dấu đã xem ngay khi click
    if (onMarkViewed) onMarkViewed(post.id);

    if (animating || displayPosts.length <= 1 || isFinished) {
      toast('Vuốt hoặc XEM để vào trang Spotlight', { icon: '👆' });
      return;
    }
    setAnimating(true);

    // Mất 400ms để bay đi
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
      {/* Background Stack Layer for 3D effect */}
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
            zIndex: 0
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
            zIndex: 0
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
          zIndex: 0
        }}
      />
      
      {/* Main Card */}
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
        {/* Unseen Badge moved to the right side */}

        {/* Left Side (Media) */}
        <div 
          style={{ width: '62%', position: 'relative', borderRight: '4px solid var(--neo-border)', cursor: 'pointer' }}
          onClick={handleImageClick}
        >
          <div className={animating ? 'fly-away' : ''} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, overflow: 'hidden' }}>
            <img 
              src={previewUrl} 
              alt="Mentor Post" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isVideo && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}>▶️</span>
              </div>
            )}
          </div>

          {/* Preload Next Image */}
          {nextPreviewUrl && (
            <img src={nextPreviewUrl} style={{ display: 'none' }} alt="" />
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
                flexShrink: 0
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px' }}>👤</span>
              )}
            </div>
            {post.caption && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '16px',
                padding: '4px 10px',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                flexShrink: 1,
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.caption}
                </div>
              </div>
              
            )}
          </div>

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

        </div>

        {/* Right Side (Actions & Info) */}
        <div style={{ width: '38%', padding: '12px 12px 0 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          
          {/* Unseen Badge (Top Left of Right Column) */}
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
                marginBottom: '10px'
              }}
            >
              <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>
                {unseenCount > 99 ? '99+' : unseenCount}
              </span>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '0.55rem', letterSpacing: '0.5px' }}>
                CHƯA XEM
              </span>
            </div>
          )}

          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.15, margin: '0 0 8px 0', letterSpacing: '0.5px', textAlign: 'left' }}>
            MENTOR<br />POSTS
          </h2>
          
          <div 
            style={{
              background: '#FFF3E0',
              border: '2px solid var(--neo-border)',
              borderRadius: '20px',
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (onMarkViewed) onMarkViewed(post.id);
              toast('Vuốt hoặc XEM để vào trang Spotlight', { icon: '👆' });
            }}
          >
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#000' }}>
              Chạm ảnh để xem
            </span>
            <span style={{ fontSize: '0.8rem' }}>👆</span>
          </div>

          <div style={{ flex: 1 }} /> {/* Spacer */}

          <div style={{ paddingBottom: '0px' /* no bottom padding to flush with bottom */ }}>
            <button 
              className="neo-btn"
              onClick={() => onLike && onLike(post.id, isLiked)}
              style={{
                background: isLiked ? '#FF2D55' : 'var(--bg-surface)',
                color: isLiked ? 'white' : 'var(--text-primary)',
                padding: '4px 12px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '10px',
                borderWidth: '3px',
                boxShadow: '3px 3px 0 var(--neo-border)',
                alignSelf: 'flex-start'
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{isLiked ? '❤️' : '🤍'}</span>
              {post.likes.length > 0 && (
                <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{post.likes.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
