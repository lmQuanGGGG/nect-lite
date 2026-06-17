import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Nect Lite by GameNect',
  description:
    'Nect Lite by GameNect helps you connect through real moments, discover people you vibe with, and share public highlights.',
  keywords: ['GameNect', 'Nect Lite', 'dating', 'moments', 'gaming', 'social'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Nect Lite by GameNect',
    description: 'Connect through real moments. Discover people you vibe with.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <BottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#16161F',
                color: '#F0F0F8',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                fontSize: '0.9rem',
                maxWidth: '380px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
