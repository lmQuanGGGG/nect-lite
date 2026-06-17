'use client';

import Image from 'next/image';
import { MomentModel } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import React from 'react';

interface MomentCardProps {
  moment: MomentModel;
  authorName?: string;
  authorAvatar?: string;
  onClick?: () => void;
  onReact?: (momentId: string, emoji: string) => void;
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

function formatTime(ts: any): string {
  if (!ts) return '';
  const date = toDate(ts);
  if (!date) return '';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function MomentCard({ moment, authorName, authorAvatar, onClick, onReact }: MomentCardProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const EMOJIS = ['❤️', '😍', '😂', '😮', '😢', '👏', '🔥', '🎉'];

  const totalReactions = moment.reactions?.length || 0;
  const uniqueEmojis = Array.from(new Set(moment.reactions?.map(r => r.emoji) || []));
  const displayEmojis = uniqueEmojis.slice(0, 3);
  const hasMoreEmojis = uniqueEmojis.length > 3;

  return (
    <div className="neo-box animate-fadeIn" onClick={onClick} role="button" tabIndex={0} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Image / Video */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', background: '#000' }}>
        {moment.isVideo ? (
          <video
            src={moment.mediaUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            playsInline
            loop
            preload="metadata"
          />
        ) : (
          <Image
            src={moment.mediaUrl}
            alt={moment.caption ?? 'Moment'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Footer Info */}
      <div style={{ background: '#fff', padding: '18px', borderTop: '3px solid var(--neo-border)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {authorAvatar && (
              <img
                src={authorAvatar}
                alt={authorName ?? 'user'}
                className="neo-avatar"
                style={{ width: 42, height: 42, boxShadow: 'none' }}
              />
            )}
            <h2 style={{ fontSize: '1.5rem', textTransform: 'lowercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authorName ?? 'user'}</h2>
          </div>
          
          <button 
            className="neo-btn-circle" 
            onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(true); }}
            style={{ width: '56px', height: '56px', background: 'var(--accent-red)', color: '#fff', fontSize: '1.25rem', border: '3px solid var(--neo-border)', boxShadow: '3px 3px 0px var(--neo-border)' }}
          >
            ♥
          </button>
        </div>
        
        {moment.caption && (
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '12px', lineHeight: 1.4 }}>
            {moment.caption}
          </p>
        )}
        
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '12px' }}>
          {formatTime(moment.createdAt)}
        </div>

        {totalReactions > 0 && (
          <div style={{ display: 'flex', marginTop: '12px' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                padding: '4px 12px', 
                fontSize: '0.9rem', 
                fontWeight: 900, 
                background: '#FCE7F3',
                border: '3px solid var(--neo-border)',
                borderRadius: '16px',
                boxShadow: '3px 3px 0 var(--neo-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {displayEmojis.map((emj, i) => (
                  <span key={i} style={{ marginLeft: i > 0 ? '-4px' : '0', zIndex: 3 - i }}>{emj}</span>
                ))}
                {hasMoreEmojis && <span style={{ marginLeft: '2px', fontSize: '0.8rem' }}>+</span>}
              </div>
              <span style={{ marginLeft: '4px' }}>{totalReactions}</span>
            </div>
          </div>
        )}

      </div>

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
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
          onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0px 10px 30px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: '#E0E0E0', borderRadius: '2px', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>CHỌN CẢM XÚC</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%' }}>
              {EMOJIS.map((emj) => (
                <button
                  key={emj}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReact) onReact(moment.id, emj);
                    setShowEmojiPicker(false);
                  }}
                  style={{
                    fontSize: '2rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: '3px solid var(--neo-border)',
                    boxShadow: '3px 3px 0 var(--neo-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff'
                  }}>
                    {emj}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
