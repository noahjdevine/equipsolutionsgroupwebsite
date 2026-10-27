import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Flat, extensionless URLs: /starmix/, /parts/ — no nesting.
// 'directory' is Astro's default and the most portable across hosts.
// Do not set trailingSlash: 'always' — Vercel has a history of slash loops.
// Do not set output: 'hybrid' — Astro 7 only accepts 'static' | 'server'.
export default defineConfig({
  site: 'https://equipsolutionsgroup.com',
  output: 'static',
  adapter: vercel(),
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path === '/swaploader' || path.startsWith('/swaploader/') || path === '/swaploader.html') {
          return false;
        }
        if (path.startsWith('/api/')) return false;
        return true;
      },
    }),
  ],
  // Page file is in src/archive/. HTTP 301s via the Vercel adapter.
  redirects: {
    '/swaploader': { status: 301, destination: '/' },
    '/swaploader.html': { status: 301, destination: '/' },
  },
});
