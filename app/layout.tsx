import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

const inter = Inter({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'שפרה ופועה',
  description: 'מערכת ניהול ארוחות לאחר לידה — ביחד אנחנו חזקות',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'שפרה ופועה',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#91006A',
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
        <meta name="theme-color" content="#91006A" />


        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <script
            async
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=iw`}
          ></script>
        )}
      </head>
      <body
        className={`${inter.variable} antialiased font-sans`}
        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'pan-y' }}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
