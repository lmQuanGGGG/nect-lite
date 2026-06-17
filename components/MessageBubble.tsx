'use client';

import { MessageModel, UserModel } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface MessageBubbleProps {
  message: MessageModel;
  isSent: boolean;
  peerAvatar?: string;
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

function formatTime(ts?: any): string {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isSent, peerAvatar }: MessageBubbleProps) {
  const timeStr = formatTime(message.timestamp);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isSent ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        padding: '0 16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '85%' }}>
        {!isSent && (
          <img 
            src={peerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} 
            alt="Avatar"
            style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #000', objectFit: 'cover', flexShrink: 0, marginBottom: '2px' }}
          />
        )}
        
        <div 
          style={{
            background: isSent ? '#000' : '#fff',
            color: isSent ? '#fff' : '#000',
            border: isSent ? 'none' : '3px solid #000',
            borderRadius: '24px',
            borderBottomRightRadius: isSent ? '4px' : '24px',
            borderBottomLeftRadius: !isSent ? '4px' : '24px',
            padding: '12px 18px',
            boxShadow: isSent ? 'none' : '4px 4px 0 #000',
            position: 'relative'
          }}
        >
          {message.isRecalled ? (
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Tin nhắn đã bị thu hồi</span>
          ) : (message.type === 'media' || message.type === 'image' || message.type === 'video' || message.mediaUrl || (message as any).imageUrl) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {message.isVideo || message.type === 'video' ? (
              <video
                src={message.mediaUrl || (message as any).imageUrl}
                controls
                playsInline
                style={{ width: '100%', maxWidth: '240px', height: 'auto', borderRadius: '16px', display: 'block', objectFit: 'contain', backgroundColor: '#000' }}
              />
            ) : (
              <img 
                src={message.mediaUrl || (message as any).imageUrl} 
                alt="media" 
                style={{ width: '100%', maxWidth: '240px', height: 'auto', borderRadius: '16px', display: 'block', objectFit: 'contain', backgroundColor: '#eee' }} 
              />
            )}
            {message.caption && <p style={{ marginTop: 8, fontSize: '0.875rem', wordBreak: 'break-word' }}>{message.caption}</p>}
          </div>
        ) : message.type === 'call' ? (
          <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            📞 {message.text}
          </span>
        ) : (
          <span style={{ fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word' }}>{message.text}</span>
        )}
      </div>
      </div>
      <span 
        style={{ 
          fontSize: '0.7rem', 
          color: '#999', 
          marginTop: '6px',
          marginLeft: isSent ? '0' : '40px',
          marginRight: isSent ? '4px' : '0'
        }}
      >
        {timeStr}
      </span>
    </div>
  );
}
