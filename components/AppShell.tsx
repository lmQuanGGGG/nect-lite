'use client';

import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <>
      <main
        className="app-shell"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'var(--app-max-width, 430px)',
          minHeight: '100dvh',
          background: 'var(--bg-base, #F5F5F7)',
          overflowX: 'hidden',
        }}
      >
        {children}
      </main>
    </>
  );
}
