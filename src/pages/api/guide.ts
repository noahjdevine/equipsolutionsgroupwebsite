/**
 * Authoritative scripted fit endpoint during the Yardley rebuild.
 * Accepts version-1 job state or the legacy five-field guide request.
 * Grounded model conversation returns in stage 4; generated prose cannot remove caveats.
 */
import type { APIRoute } from 'astro';
import { fitJob, fitModel } from '../../data/fit';
import { explainFit, QUESTION_COPY } from '../../data/guide';
import { legacyGuideSchema, parseYardleyJob } from '../../data/yardley-job';

export const prerender = false;
const MAX_BODY_BYTES = 32_768;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function readJson(request: Request): Promise<{ raw: unknown; status?: number }> {
  if (!request.headers.get('content-type')?.includes('application/json')) return { raw: null, status: 415 };
  const reader = request.body?.getReader();
  if (!reader) return { raw: null, status: 400 };
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { raw: null, status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { raw: JSON.parse(text) };
  } catch {
    return { raw: null, status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export const POST: APIRoute = async ({ request }) => {
  const { raw, status } = await readJson(request);
  if (status) return json({ note: QUESTION_COPY['job-details'], errors: [{ field: 'job', message: 'Send valid job details as JSON.' }] }, status);
  if (raw && typeof raw === 'object' && 'version' in raw) {
    const parsed = parseYardleyJob(raw);
    if (!parsed.ok) return json({ note: QUESTION_COPY['job-details'], errors: parsed.errors }, 400);
    const fit = fitJob(parsed.job);
    return json({ version: 1, note: explainFit(fit), fit });
  }
  const legacy = legacyGuideSchema.safeParse(raw);
  if (!legacy.success) return json({ note: QUESTION_COPY['job-details'] }, 400);
  const fit = fitModel(legacy.data);
  return json({ version: 1, note: explainFit(fit), fit });
};
