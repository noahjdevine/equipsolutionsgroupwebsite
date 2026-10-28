import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIContext } from 'astro';
import { POST } from '../../src/pages/api/guide';
import { fitJob } from '../../src/data/fit';
import { knownJob } from './fixtures';

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
