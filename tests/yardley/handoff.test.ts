import test from 'node:test';
import assert from 'node:assert/strict';
import { YardleyHandoff } from '../../src/lib/yardley/handoff';
import { formatGuideEmail, parseGuideSubmission } from '../../src/data/lead';
import { contact, knownJob } from './fixtures';

const draft = () => ({ contact, brief: { version: 1, job: knownJob() } });
function accept(init?: RequestInit): Response {
  const parsed = parseGuideSubmission(JSON.parse(String(init?.body)));assert(parsed.ok);
  return Response.json({ ok: true, receipt: { version: 1, submissionId: parsed.submission.submissionId, messageId: 'provider-id', ...formatGuideEmail(parsed.submission) } });
}
test('pending duplicate clicks do not send twice; editing live state cannot rewrite a submitted receipt', async () => {
  const handoff = new YardleyHandoff();const live = draft();let release!: (r: Response) => void;let calls = 0;
  const fetcher = (async (_url, init) => { calls++; const response = accept(init);return new Promise<Response>((resolve) => { release = () => resolve(response); }); }) as typeof fetch;
  const pending = handoff.submit(live, fetcher);
  assert.equal(await handoff.submit(live, fetcher), undefined);
  live.brief.job.notes = 'Edited later';release(new Response());
  const receipt = await pending;assert(receipt);assert.equal(calls, 1);assert(!receipt.text.includes('Edited later'));
  assert(Object.isFrozen(receipt));const prepared = handoff.prepare(live);assert(prepared.ok);assert(!prepared.alreadyAccepted);
});
test('uncertain sends keep the same exact request for explicit retry; accepted snapshots cannot resend', async () => {
  const handoff = new YardleyHandoff();const live = draft();const bodies: string[] = [];
  const fetcher = (async (_url, init) => { bodies.push(String(init?.body));if (bodies.length === 1) throw new Error('lost response');return accept(init); }) as typeof fetch;
  await assert.rejects(handoff.submit(live, fetcher), /could not confirm/);
  await handoff.submit(live, fetcher);assert.equal(bodies[0], bodies[1]);
  await handoff.submit(live, fetcher);assert.equal(bodies.length, 2);
  await handoff.submit({ ...live, contact: { ...contact, name: 'Revised buyer' } }, fetcher);
  assert.notEqual(JSON.parse(bodies[1]).submissionId, JSON.parse(bodies[2]).submissionId);
});
test('malformed, mismatched and fake-success responses never create a receipt', async () => {
  for (const body of [{ ok: true }, { ok: false }, { ok: true, receipt: { version: 1, submissionId: crypto.randomUUID(), messageId: 'x', subject: 'fake', text: 'fake' } }]) {
    const handoff = new YardleyHandoff();await assert.rejects(handoff.submit(draft(), (async () => Response.json(body)) as typeof fetch));assert.equal(handoff.receipt, undefined);
  }
});
test('same-reference receipts must also match the reviewed text exactly', async () => {
  const handoff = new YardleyHandoff();
  await assert.rejects(handoff.submit(draft(), (async (_url, init) => {
    const body = await accept(init).json();body.receipt.text += '\nChanged after review';return Response.json(body);
  }) as typeof fetch));
  assert.equal(handoff.receipt, undefined);
});
test('old uncertain attempts cannot silently retry after the safe provider window', async (t) => {
  let now = 1000000;t.mock.method(Date, 'now', () => now);
  const handoff = new YardleyHandoff();const live = draft();let calls = 0;
  const fetcher = (async () => { calls++;throw new Error('lost confirmation'); }) as typeof fetch;
  await assert.rejects(handoff.submit(live, fetcher));now += 24 * 60 * 60 * 1000;
  await assert.rejects(handoff.submit(live, fetcher), /too old/);assert.equal(calls, 1);
});
