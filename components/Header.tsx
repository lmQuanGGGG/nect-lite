'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  right?: ReactNode;
  left?: ReactNode;
}

export default function Header({ title, showBack, backHref, right, left }: HeaderProps) {
  const iconButtonStyle = {
    width: 40,
    height: 40,
    border: '2px solid var(--neo-border, #000)',
    borderRadius: 10,
    background: 'var(--bg-surface, #fff)',
    color: 'var(--accent-orange, #FF6E40)',
    boxShadow: '2px 2px 0 var(--neo-border, #000)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 900,
    textDecoration: 'none',
  } as const;

  return (
    <header
      className="header"
      style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        maxWidth: 'var(--app-max-width, 430px)',
        height: 'var(--header-height, 60px)',
        background: 'rgba(245,245,247,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 110,
      }}
    >
      {/* Left slot */}
      <div className="header-action" style={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
        {left ?? (
          showBack ? (
            <Link
              href={backHref ?? '/'}
              className="header-icon-btn"
              aria-label="Go back"
              style={iconButtonStyle}
            >
              ←
            </Link>
          ) : (
            <div
              className="header-brand"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 900,
                fontSize: '1.25rem',
                textTransform: 'lowercase',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--accent-orange)' }}>▰</span>
              <span style={{ fontSize: '1.25rem' }}>gamenect</span>
            </div>
          )
        )}
      </div>

      {/* Title (Only show if explicitly provided and we are showing back button, otherwise empty or center title) */}
      <div className="header-title" style={{ flex: 1, textAlign: 'center', fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase' }}>
        {title && <span>{title}</span>}
      </div>

      {/* Right slot */}
      <div className="header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 40, justifyContent: 'flex-end' }}>
        {right ?? (
          <>
            {!showBack && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="premium-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--accent-orange)' }}>◆</span>
                  Nâng cấp
                </span>
                <Link href="/discover/settings" className="header-icon-btn" aria-label="Cài đặt" style={iconButtonStyle}>
                  ⚙️
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
