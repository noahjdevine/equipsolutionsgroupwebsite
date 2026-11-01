import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIContext } from 'astro';
import { createGuideRoute } from '../../src/pages/api/guide';
import { conversationConfig } from '../../src/lib/yardley/limits';
import { fitJob } from '../../src/data/fit';
import { knownJob } from './fixtures';
import { randomUUID } from 'node:crypto';
const POST = createGuideRoute({ config: conversationConfig({}) });

async function post(body: string, contentType = 'application/json') {
  return await POST({ request: new Request('http://localhost/api/guide', { method: 'POST', headers: { 'Content-Type': contentType }, body }) } as APIContext);
}

test('versioned API and local fit return the same authoritative result without a model call', async () => {
  const job = knownJob({ mixTypes: { state: 'reported', value: ['latex-modified'] } });
  const response = await post(JSON.stringify(job));assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.fit, JSON.parse(JSON.stringify(fitJob(job))));
  assert.match(body.note, /latex dosing configuration/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('the current five-field browser request remains supported', async () => {
  const response = await post(JSON.stringify({ applicationSlug: 'small-pour', pourSizeYd3: 'under-5', poursPerWeek: '10-plus', chassis: 'not-sure', mixTypes: ['standard'] }));
  assert.equal(response.status, 200);
  const body = await response.json();assert.equal(body.fit.primaryId, '425-s');
  assert.match(body.note, /quantity is a range/);
});

test('malformed, oversize, wrong-version and forged requests cannot return a fabricated fit', async () => {
  assert.equal((await post('{')).status, 400);
  assert.equal((await post(JSON.stringify({ version: 2 }))).status, 400);
  assert.equal((await post(JSON.stringify({ ...knownJob(), primaryId: '880-s' }))).status, 400);
  assert.equal((await post('x'.repeat(32769))).status, 413);
  assert.equal((await post('hello', 'text/plain')).status, 415);
});

test('v2 conversation returns a validated guided fallback without credentials and rejects cross-site origins', async () => {
  const input = { version: 2, requestId: randomUUID(), job: knownJob(), message: 'Compare 750 L and 850 S', history: [], skipped: [], step: 'work' };
  const response = await post(JSON.stringify(input));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.requestId, input.requestId); assert.equal(body.mode, 'guided');
  assert.match(body.reply, /not faster/); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await post(JSON.stringify({ ...input, message: 'x'.repeat(2001) }))).status, 400);
  const crossSite = await POST({ request: new Request('http://localhost/api/guide', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' }, body: JSON.stringify(input) }) } as APIContext);
  assert.equal(crossSite.status, 403);
});
