'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/discover', label: 'Khám phá', icon: '🎮' },
  { href: '/moment', label: 'Feed', icon: '▣' },
  { href: '/matches', label: 'Thích', icon: '♥' },
  { href: '/chat', label: 'Tin nhắn', icon: '💬' },
  { href: '/profile', label: 'Hồ sơ', icon: '●' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMatches, setUnreadMatches] = useState(0);
  const visibleRoutes = new Set(['/discover', '/moment', '/matches', '/chat', '/profile', '/mentor']);
  const isVisible = visibleRoutes.has(pathname) || pathname === '/';

  // Lấy số match/chat chưa đọc (mock cho UI trước)
  useEffect(() => {
    setUnreadMatches(0);
    NAV_ITEMS.forEach((item) => router.prefetch(item.href));
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fab-container"
        style={{
          position: 'fixed',
          right: 'calc(50% - min(215px, 50vw) + 12px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
          zIndex: 120,
        }}
      >
        <Link
          href="/camera"
          className="neo-fab neo-fab-orange"
          aria-label="Camera"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '3px solid var(--neo-border, #000)',
            boxShadow: '3px 3px 0 var(--neo-border, #000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: 'var(--accent-orange, #FF6E40)',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>＋</span>
        </Link>
      </div>

      <div
        className="bottom-nav-container"
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'calc(var(--app-max-width, 430px) - 40px)',
          zIndex: 100,
        }}
      >
        <nav
          className="bottom-nav neo-glass neo-box"
          role="navigation"
          aria-label="Main navigation"
          style={{
            height: 72,
            borderRadius: 40,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-evenly',
            padding: '0 8px',
            background: 'rgba(255,255,255,0.62)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '3px solid var(--neo-border, #000)',
            boxShadow: '4px 4px 0 var(--neo-border, #000)',
            overflow: 'visible',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href) || 
              (item.href === '/discover' && pathname === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                id={`nav-${item.label.toLowerCase()}`}
                className={`nav-item${isActive ? ' active' : ''}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  color: isActive ? 'var(--text-primary, #000)' : 'var(--text-muted, #8E8E93)',
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  className="nav-item-icon"
                  role="img"
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    fontSize: '1.35rem',
                    background: isActive ? 'var(--accent-orange, #FF6E40)' : 'transparent',
                    color: isActive ? '#fff' : 'inherit',
                    border: isActive ? '2px solid var(--neo-border, #000)' : '2px solid transparent',
                    boxShadow: isActive ? '2px 2px 0 var(--neo-border, #000)' : 'none',
                  }}
                >
                  {item.icon}
                  {item.href === '/chat' && unreadMatches > 0 && (
                    <span className="neo-badge">{unreadMatches}</span>
                  )}
                </span>
                <span className="nav-item-label" style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
