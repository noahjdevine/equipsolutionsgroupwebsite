import type { APIRoute } from 'astro';
import { createLeadRoute } from '../../lib/yardley/lead-route';

export const prerender = false;
// Read private settings explicitly in Astro; runtime values allow hosted rotation.
export const POST: APIRoute = (context) => createLeadRoute({
  key: process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY,
})(context);
