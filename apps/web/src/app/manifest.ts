import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notenn',
    short_name: 'Notenn',
    description: 'Tablatures pour accordéon, guitare et flûte · Tabs for accordion, guitar and whistle',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6fb',
    theme_color: '#1d2363',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
