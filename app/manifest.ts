import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'שפרה ופועה',
    short_name: 'שפרה ופועה',
    description: 'מערכת ניהול ארוחות לאחר לידה',
    start_url: '/login',
    display: 'standalone',
    background_color: '#FFF7FB',
    theme_color: '#91006A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
