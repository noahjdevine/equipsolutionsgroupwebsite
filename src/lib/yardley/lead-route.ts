import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { formDataToObject, formatLeadEmail, parseLead, parseGuideSubmission, formatGuideEmail, type GuideReceipt } from '../../data/lead';

const FROM = 'Equip Solutions Group <paul@equipsolutionsgroup.com>';
const TO = 'paul@equipsolutionsgroup.com';
const REPLY_TO = 'paul@equipsolutionsgroup.com';
const MAX_BYTES = 32_768;
interface Mail { from: string; to: string; replyTo: string; subject: string; text: string }
interface MailResult { data?: { id: string } | null; error?: { name?: string } | null }
export interface LeadDependencies {
  key?: string;
  send?: (mail: Mail, options: { idempotencyKey?: string; signal: AbortSignal }) => Promise<MailResult>;
  timeoutMs?: number;
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
function failure(message: string, status: number, code = 'send-failed'): Response {
  return json({ ok: false, code, errors: [{ field: 'form', message }] }, status);
}
async function readBody(request: Request): Promise<{ raw?: unknown; status?: number }> {
  const type = request.headers.get('content-type') || '';
  if (!['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'].some((allowed) => type.toLowerCase().startsWith(allowed))) return { status: 415 };
  const reader = request.body?.getReader();
  if (!reader) return { status: 400 };
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return { status: 413 }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    if (type.startsWith('application/json')) return { raw: JSON.parse(new TextDecoder().decode(bytes)) };
    return { raw: formDataToObject(await new Response(bytes, { headers: { 'Content-Type': type } }).formData()) };
  } catch { return { status: 400 }; }
  finally { reader.releaseLock(); }
}
export function createLeadRoute(dependencies: LeadDependencies = {}): APIRoute {
  return async ({ request }) => {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return failure('Use the request form on this website.', 403);
    const body = await readBody(request);
    if (body.status) return failure(body.status === 413 ? 'The request is too long. Shorten the notes and try again.' : 'Send valid request details.', body.status);
    const raw = body.raw;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return failure('Send valid request details.', 400);
    if ('website' in raw && typeof raw.website === 'string' && raw.website.trim()) return json({ ok: true });
    let mail: { subject: string; text: string };
    let submissionId: string | undefined;
    if ('version' in raw) {
      const parsed = parseGuideSubmission(raw);
      if (!parsed.ok) return json({ ok: false, errors: parsed.errors.slice(0, 12) }, 400);
      submissionId = parsed.submission.submissionId;
      mail = formatGuideEmail(parsed.submission);
    } else {
      const parsed = parseLead(raw);
      if (!parsed.ok) return json({ ok: false, errors: parsed.errors }, 400);
      if (parsed.spam) return json({ ok: true });
      mail = formatLeadEmail(parsed.lead);
    }
    if (!dependencies.key && !dependencies.send) return failure('Email is unavailable right now. Your brief is still here. Call Paul or try again later.', 503);
    const send = dependencies.send ?? ((payload, options) => new Resend(dependencies.key).emails.send(payload, options));
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('send-timeout')); }, dependencies.timeoutMs ?? 12_000);
    });
    try {
      const result = await Promise.race([send({ from: FROM, to: TO, replyTo: REPLY_TO, ...mail }, {
        ...(submissionId ? { idempotencyKey: `yardley/${submissionId}` } : {}), signal: controller.signal,
      }), deadline]);
      if (result.error) {
        if (result.error.name === 'invalid_idempotent_request') return failure('This request reference belongs to a different brief. Review a revised inquiry or call Paul.', 409, 'snapshot-changed');
        if (result.error.name === 'concurrent_idempotent_requests') return failure('This brief is already being processed. Wait a moment, then retry the same brief.', 409, 'send-pending');
        return failure('The email service did not accept the request. Your brief is still here. Retry or call Paul.', 502);
      }
      if (!result.data?.id) return failure('We could not confirm the send. Retry the same brief or call Paul.', 502);
      if (!submissionId) return json({ ok: true });
      const receipt: GuideReceipt = { version: 1, submissionId, messageId: result.data.id, ...mail };
      return json({ ok: true, receipt });
    } catch { return failure('We could not confirm the send. Your brief is still here. Retry the same brief or call Paul.', 502, 'send-unconfirmed'); }
    finally { if (timer) clearTimeout(timer); }
  };
}
