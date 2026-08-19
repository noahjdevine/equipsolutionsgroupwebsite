import { defineConfig } from 'astro/config';

// Flat, extensionless URLs: /swaploader/, /parts/ — no nesting.
// 'directory' is Astro's default and the most portable across hosts.
export default defineConfig({
  build: { format: 'directory' },
});
