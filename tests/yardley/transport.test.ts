import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ConversationTransport } from '../../src/lib/yardley/transport';
import { scriptedConversation } from '../../src/lib/yardley/replies';
import { emptyJob } from '../../src/data/yardley-job';
import type { ConversationInput } from '../../src/data/yardley-conversation';

const request = (): ConversationInput => ({ version: 2, requestId: randomUUID(), job: emptyJob(), message: 'What is bin capacity?', history: [], skipped: [], step: 'work' });
const answer = (input: ConversationInput) => new Response(JSON.stringify(scriptedConversation(input, 'not-configured')));

test('duplicate sends are ignored while a request is pending', async () => {
  const transport = new ConversationTransport(); const input = request();
  let complete!: (response: Response) => void; let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return await new Promise((resolve) => { complete = resolve; }); };
  const first = transport.send(input, fetcher);
  assert.equal(await transport.send(input, fetcher), undefined);
  complete(answer(input));
  assert.equal((await first)?.requestId, input.requestId);
  assert.equal(calls, 1); assert.equal(transport.busy, false);
});

test('a canceled old request cannot overwrite a newer answer even if the fetcher ignores abort', async () => {
  const transport = new ConversationTransport(); const oldInput = request(), newInput = request();
  let completeOld!: (response: Response) => void;
  const old = transport.send(oldInput, async () => await new Promise((resolve) => { completeOld = resolve; }));
  transport.cancel();
  const newer = await transport.send(newInput, async () => answer(newInput));
  completeOld(answer(oldInput));
  assert.equal(await old, undefined); assert.equal(newer?.requestId, newInput.requestId);
});

test('malformed, mismatched and oversized responses fail without corrupting the transport', async () => {
  const transport = new ConversationTransport(); const input = request();
  for (const response of [new Response('{'), answer(request()), new Response('x'.repeat(32769)), new Response('', { status: 429 })]) {
    await assert.rejects(transport.send(input, async () => response));
    assert.equal(transport.busy, false);
  }
  assert.equal((await transport.send(input, async () => answer(input)))?.requestId, input.requestId);
});

test('browser turn limit caps automatic model requests while allowing local guided continuation', async () => {
  const transport = new ConversationTransport(); const input = request(); let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return answer(input); };
  for (let i = 0; i < 24; i++) await transport.send(input, fetcher);
  await assert.rejects(transport.send(input, fetcher), /session-limit/);
  assert.equal(calls, 24);
  assert.match(scriptedConversation(input, 'session-limit').reply, /Bin capacity/);
});
