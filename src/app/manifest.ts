import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RizzUp AI — Unfair Dating & Texting Wingman',
    short_name: 'RizzUp AI',
    description: 'Drop a text or screenshot. Get 3 instant, high-chemistry replies tailored to your vibe.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090a0f',
    theme_color: '#ff3e5e',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
