'use client';

import { useEffect, useState } from 'react';
import { getGameImage } from '@/services/rawg.service';

interface GameTagProps {
  gameName: string;
}

export default function GameTag({ gameName }: GameTagProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    getGameImage(gameName).then((url) => {
      if (!alive) return;
      setImageUrl(url);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [gameName]);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '100%',
        minHeight: 36,
        padding: '6px 10px',
        border: '2px solid var(--neo-border, #000)',
        borderRadius: 12,
        boxShadow: '2px 2px 0 var(--neo-border, #000)',
        background: '#fff',
        color: '#000',
        fontSize: 14,
        fontWeight: 900,
      }}
      title={gameName}
    >
      {loading ? (
        <span
          style={{
            width: 24,
            height: 24,
            border: '3px solid var(--neo-border, #000)',
            borderTopColor: 'var(--accent-orange, #FF6E40)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            objectFit: 'cover',
            border: '1.5px solid var(--neo-border, #000)',
            flexShrink: 0,
          }}
        />
      ) : (
        <span style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>🎮</span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {gameName}
      </span>
    </span>
  );
}
