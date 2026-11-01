/**
 * Bounded v2 conversation with retained v1 / legacy scripted fit compatibility.
 */
import type { APIRoute } from 'astro';
import { fitJob, fitModel } from '../../data/fit';
import { explainFit, QUESTION_COPY } from '../../data/guide';
import { legacyGuideSchema, parseYardleyJob } from '../../data/yardley-job';
import { conversationInputSchema } from '../../data/yardley-conversation';
import { converse, type ConversationDependencies } from '../../lib/yardley/conversation';
import { conversationConfig, CONVERSATION_LIMITS } from '../../lib/yardley/limits';

export const prerender = false;
const MAX_BODY_BYTES = CONVERSATION_LIMITS.bodyBytes;

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

export function createGuideRoute(dependencies?: ConversationDependencies): APIRoute {
  return async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ note: 'Use the guide on this website.' }, 403);
  const { raw, status } = await readJson(request);
  if (status) return json({ note: QUESTION_COPY['job-details'], errors: [{ field: 'job', message: 'Send valid job details as JSON.' }] }, status);
  if (raw && typeof raw === 'object' && 'version' in raw && raw.version === 2) {
    const parsed = conversationInputSchema.safeParse(raw);
    if (!parsed.success) return json({ note: QUESTION_COPY['job-details'] }, 400);
    // Astro replaces explicit private env reads; spreading import.meta.env omits
    // local secrets. Runtime values take priority so a hosted kill switch works.
    const env = {
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY ?? (import.meta.env && import.meta.env.AI_GATEWAY_API_KEY),
      AI_GATEWAY_MODEL: process.env.AI_GATEWAY_MODEL ?? (import.meta.env && import.meta.env.AI_GATEWAY_MODEL),
      YARDLEY_AI_ENABLED: process.env.YARDLEY_AI_ENABLED ?? (import.meta.env && import.meta.env.YARDLEY_AI_ENABLED),
      YARDLEY_BUDGET_KEY_ID: process.env.YARDLEY_BUDGET_KEY_ID ?? (import.meta.env && import.meta.env.YARDLEY_BUDGET_KEY_ID),
      YARDLEY_RATE_LIMIT_ID: process.env.YARDLEY_RATE_LIMIT_ID ?? (import.meta.env && import.meta.env.YARDLEY_RATE_LIMIT_ID),
    };
    const response = await converse(parsed.data, request.signal, dependencies ?? { config: conversationConfig(env) });
    return json(response);
  }
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
}
export const POST = createGuideRoute();
