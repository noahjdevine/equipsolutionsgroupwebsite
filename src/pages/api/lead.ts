import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { formDataToObject, formatLeadEmail, parseLead } from '../../data/lead';

export const prerender = false;

const FROM = 'Equip Solutions Group <paul@equipsolutionsgroup.com>';
const TO = 'paul@equipsolutionsgroup.com';
const REPLY_TO = 'paul@equipsolutionsgroup.com';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function readBody(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }
  if (
    type.includes('application/x-www-form-urlencoded') ||
    type.includes('multipart/form-data')
  ) {
    return formDataToObject(await request.formData());
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const raw = await readBody(request);
  if (!raw || typeof raw !== 'object') {
    return json({ ok: false, errors: [{ field: 'form', message: 'Send the form as JSON or form data.' }] }, 400);
  }

  const parsed = parseLead(raw);
  if (!parsed.ok) {
    return json({ ok: false, errors: parsed.errors }, 400);
  }

  if (parsed.spam) {
    return json({ ok: true });
  }

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) {
    return json({
      ok: false,
      errors: [{ field: 'form', message: 'The request could not be sent. Call or email instead.' }],
    }, 500);
  }

  const { subject, text } = formatLeadEmail(parsed.lead);
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: REPLY_TO,
    subject,
    text,
  });

  if (error) {
    return json({
      ok: false,
      errors: [{ field: 'form', message: 'The request could not be sent. Call or email instead.' }],
    }, 502);
  }

  return json({ ok: true });
};
