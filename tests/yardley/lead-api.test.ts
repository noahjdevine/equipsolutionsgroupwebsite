import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { APIContext } from 'astro';
import { createLeadRoute, type LeadDependencies } from '../../src/lib/yardley/lead-route';
import { knownJob, contact, legacyMixer } from './fixtures';

const input = () => ({ version: 2, source: 'mixer-guide', submissionId: randomUUID(), contact, brief: { version: 1, job: knownJob() } });
async function post(route: ReturnType<typeof createLeadRoute>, raw: unknown, headers: Record<string, string> = {}) {
  return route({ request: new Request('https://test.example/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof raw === 'string' ? raw : JSON.stringify(raw) }) } as APIContext);
}
test('server recomputes the reviewed email, preserves addresses and passes stable provider idempotency options', async () => {
  const mails: Parameters<NonNullable<LeadDependencies['send']>>[] = [];
  const route = createLeadRoute({ send: async (...args) => { mails.push(args); return { data: { id: 'provider-id' } }; } });
  const raw = input(); const first = await post(route, raw); const body = await first.json();
  assert.equal(first.status, 200);assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.equal(body.receipt.text, mails[0][0].text);assert.equal(body.receipt.submissionId, raw.submissionId);
  assert.equal(mails[0][0].from, 'Equip Solutions Group <paul@equipsolutionsgroup.com>');
  assert.equal(mails[0][0].to, 'paul@equipsolutionsgroup.com');assert.equal(mails[0][0].replyTo, 'paul@equipsolutionsgroup.com');
  await post(route, raw);assert.equal(mails[0][1].idempotencyKey, `yardley/${raw.submissionId}`);
  assert.equal(mails[1][1].idempotencyKey, mails[0][1].idempotencyKey);assert.deepEqual(mails[0][0], mails[1][0]);
});
test('ordinary mixer, parts and sourcing requests still reach the same mail provider contract', async () => {
  const messages: string[] = [];
  const route = createLeadRoute({ send: async (mail, options) => { assert.equal(options.idempotencyKey, undefined);messages.push(mail.text);return { data: { id: 'provider-id' } }; } });
  for (const fields of [legacyMixer, { intent: 'parts', modelId: 'not-sure', partNeeded: 'Chain', urgency: 'scheduled' }, { intent: 'sourcing', whatSought: 'Equipment', quantity: '1', sourcingTimeline: 'researching', destinationRegion: 'Customer supplied' }]) {
    assert.equal((await post(route, { ...contact, ...fields })).status, 200);
  }
  assert.equal(messages.length, 3);assert(messages.every((m) => m.includes('test@example.com')));
});
test('bad input, forged data, unsupported versions, cross-site requests and large bodies never send', async () => {
  let calls = 0;const route = createLeadRoute({ send: async () => { calls++;return { data: { id: 'x' } }; } });
  const raw = input();
  for (const invalid of ['{', { ...raw, version: 3 }, { ...raw, primaryId: '880-s' }, { ...raw, contact: {} }, { ...raw, brief: { ...raw.brief, reasons: ['fake'] } }]) assert.equal((await post(route, invalid)).status, 400);
  assert.equal((await post(route, 'x'.repeat(32769))).status, 413);
  assert.equal((await post(route, raw, { Origin: 'https://elsewhere.example' })).status, 403);
  assert.equal((await post(route, raw, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal(calls, 0);
});
test('honeypot short-circuits without mail or a fabricated provider receipt', async () => {
  const route = createLeadRoute({ send: async () => { throw new Error('must not run'); } });
  const result = await (await post(route, { website: 'spam' })).json();assert.equal(result.ok, true);assert.equal(result.receipt, undefined);
});
test('bounded URL-encoded and multipart quote submissions retain multi-select mix values', async () => {
  const route = createLeadRoute({ send: async (mail) => { assert(mail.text.includes('Standard'));assert(mail.text.includes('Rapid-set'));return { data: { id: 'provider-id' } }; } });
  const fields = { ...contact, ...legacyMixer };
  for (const multipart of [false, true]) {
    const data = multipart ? new FormData() : new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) if (key !== 'mixTypes') data.append(key, String(value));
    data.append('mixTypes', 'standard');data.append('mixTypes', 'rapid-set');
    const result = await route({ request: new Request('https://test.example/api/lead', { method: 'POST', body: data }) } as APIContext);
    assert.equal(result.status, 200);
  }
});
test('provider idempotency conflicts remain actionable failures rather than fake acceptance', async () => {
  for (const name of ['invalid_idempotent_request', 'concurrent_idempotent_requests']) {
    const response = await post(createLeadRoute({ send: async () => ({ error: { name } }) }), input());
    assert.equal(response.status, 409);assert.equal((await response.json()).ok, false);
  }
});
test('missing key, provider rejection, thrown error, missing provider ID and timeout cannot produce success', async () => {
  assert.equal((await post(createLeadRoute(), input())).status, 503);
  for (const send of [async () => ({ error: { name: 'application_error' } }), async () => { throw new Error('transport'); }, async () => ({ data: null })]) {
    const response = await post(createLeadRoute({ send }), input());assert.equal(response.status, 502);assert.equal((await response.json()).ok, false);
  }
  const timeout = await post(createLeadRoute({ timeoutMs: 10, send: async (_mail, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))) }), input());
  assert.equal(timeout.status, 502);assert.equal((await timeout.json()).code, 'send-unconfirmed');
});
