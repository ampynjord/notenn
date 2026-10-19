import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notenn',
    short_name: 'Notenn',
    description: 'Tablatures pour accordéon diatonique en Système Argoat · Diatonic accordion tabs in Système Argoat',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f3f4',
    theme_color: '#1f3f8f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
