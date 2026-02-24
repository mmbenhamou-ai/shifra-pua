import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'שפרה פועה',
  description: 'מערכת ניהול ארוחות לאחר לידה — ביחד אנחנו חזקות',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'שפרה פועה',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#811453',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#811453" />
      </head>
      <body
        className={`${geist.variable} antialiased`}
        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'pan-y' }}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
