import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { converse, proposalFromPlan } from '../../src/lib/yardley/conversation';
import { conversationInputSchema, conversationPlanSchema, proposalSchema, type ConversationInput, type ConversationPlan } from '../../src/data/yardley-conversation';
import { APPROVED_MODEL, conversationConfig, type ConversationConfig } from '../../src/lib/yardley/limits';
import { emptyJob } from '../../src/data/yardley-job';
import { confirmPatch } from '../../src/lib/yardley/intake';
import { fitJob } from '../../src/data/fit';
import { knownJob } from './fixtures';

const config: ConversationConfig = { enabled: true, key: 'unit-test-not-a-real-key', model: APPROVED_MODEL, budgetKeyId: 'unit-test-budget', rateLimitId: 'unit-test-rule' };
const input = (message = 'Why compare the 750 L and 850 S?'): ConversationInput => ({ version: 2, requestId: randomUUID(), job: emptyJob(), message, history: [], skipped: [], step: 'work' });
const plan = (overrides: Partial<ConversationPlan> = {}): ConversationPlan => ({ acknowledgement: 'question', facts: [], comparisons: [], question: null, updates: [], ...overrides });
const signal = () => new AbortController().signal;

test('provider schema uses supported anyOf unions rather than oneOf', () => {
  const schema = JSON.stringify(z.toJSONSchema(conversationPlanSchema));
  assert.doesNotMatch(schema, /"oneOf"\s*:/);
  assert.match(schema, /"anyOf"\s*:/);
});

test('structured plans render authoritative comparisons, not generated specifications or prose', async () => {
  const reply = await converse(input(), signal(), { config, planner: async () => ({ plan: plan({ acknowledgement: 'details', comparisons: ['750-l', '850-s'] }) }) });
  assert.equal(reply.mode, 'ai');
  assert.match(reply.reply, /10 yd³/); assert.match(reply.reply, /11 yd³/);
  assert.match(reply.reply, /rates match/); assert.match(reply.reply, /not faster/);
  assert.equal(reply.proposal.workTypes, undefined);
  assert.equal(reply.saveMessage, false);
  assert.doesNotMatch(reply.reply, /picked out the job details/);
});

test('model-reported answers become pending proposals and cannot change the current fit', async () => {
  const request = input('Latex bridge overlays, 8 cubic yards per placement.');
  request.job = knownJob();
  const reply = await converse(request, signal(), { config, planner: async () => ({ plan: plan({ acknowledgement: 'details', updates: [
    { field: 'mixTypes', evidence: 'Latex', value: { state: 'reported', value: ['latex-modified'] } },
    { field: 'quantity', evidence: '8 cubic yards per placement', value: { kind: 'reported', yd3: 8, scope: 'placement' } },
  ] }) }) });
  assert.equal(reply.proposal.mixTypes?.state, 'proposed');
  assert.equal(reply.proposal.quantity?.kind, 'proposed');
  assert.equal(fitJob(request.job).primaryId, '327-k');
  const confirmed = confirmPatch(request.job, reply.proposal)!;
  assert.equal(fitJob(confirmed).primaryId, '750-l');
  assert.deepEqual(proposalSchema.parse({}), {});
});

test('unsupported claims and output fields trigger an honest scripted fallback', async () => {
  for (const extra of [{ reply: 'The 327 K is 70 yards for $1 and available tomorrow in Texas.' }, { primaryId: '880-s' }, { facts: ['fake-fact'] }]) {
    const reply = await converse(input('What is the price and lead time?'), signal(), { config, planner: async () => ({ plan: { ...plan(), ...extra } }) });
    assert.equal(reply.reason, 'invalid-output');
    assert.doesNotMatch(reply.reply, /\$1|tomorrow|Texas|70 yards/);
    assert.match(reply.reply, /Paul confirms price/);
  }
});

test('invented quantities, missing thickness, unsupplied units and fabricated customer text are rejected', async () => {
  const cases = [
    { message: 'An 18 by 18 patio', update: { field: 'quantity', evidence: '18 by 18 patio', value: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } } },
    { message: '18 by 18 at 4', update: { field: 'quantity', evidence: '18 by 18 at 4', value: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } } },
    { message: 'Need a small patio', update: { field: 'quantity', evidence: 'small patio', value: { kind: 'reported', yd3: 3, scope: 'placement' } } },
    { message: 'A small patio', update: { field: 'workTypes', evidence: 'not in the message', value: { state: 'reported', value: ['small-pour'] } } },
  ];
  for (const entry of cases) {
    const reply = await converse(input(entry.message), signal(), { config, planner: async () => ({ plan: { ...plan(), updates: [entry.update] } }) });
    assert.equal(reply.reason, 'invalid-output');
  }
});

test('rewritten customer text is replaced with its exact source quote, never a compatibility claim', () => {
  const request = input('My existing pump');
  const extracted = conversationPlanSchema.parse(plan({ updates: [{ field: 'feedSetup', evidence: 'existing pump', value: { state: 'reported', value: 'Certified compatible pump' } }] }));
  assert.deepEqual(proposalFromPlan(request, extracted)?.feedSetup, { state: 'proposed', value: 'existing pump' });
});

test('punctuation-only evidence changes are matched back to the original customer words', () => {
  const request = input('We have an existing gun; setup still needs review.');
  const extracted = conversationPlanSchema.parse(plan({ updates: [{ field: 'feedSetup', evidence: 'We have an existing gun, setup still needs review.', value: { state: 'reported', value: 'existing gun' } }] }));
  assert.deepEqual(proposalFromPlan(request, extracted)?.feedSetup, { state: 'proposed', value: 'existing gun' });
});

test('an unsupported update does not discard independently evidenced valid fields', () => {
  const request = input('Small patios, 18 feet by 18 feet. Thickness is unknown.');
  const extracted = conversationPlanSchema.parse(plan({ updates: [
    { field: 'workTypes', evidence: 'Small patios', value: { state: 'reported', value: ['small-pour'] } },
    { field: 'quantity', evidence: '18 feet by 18 feet', value: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } },
  ] }));
  const proposed = proposalFromPlan(request, extracted)!;
  assert.deepEqual(proposed.workTypes, { state: 'proposed', value: ['small-pour'] });
  assert.equal(proposed.quantity, undefined);
});

test('supplied slab dimensions remain inputs for customer confirmation and code calculation', () => {
  const request = input('18 feet by 18 feet at 4 inches specified thickness');
  const parsed = conversationPlanSchema.parse(plan({ updates: [{ field: 'quantity', evidence: request.message, value: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } }] }));
  const patch = proposalFromPlan(request, parsed)!;
  const confirmed = confirmPatch(knownJob(), patch)!;
  assert.equal(fitJob(confirmed).demand.quantity.yd3, 4);
  assert.equal('yd3' in confirmed.quantity, false);
});

test('missing credentials, budget proof or rate-rule configuration cannot make a paid call', async () => {
  for (const incomplete of [conversationConfig({}), { ...config, enabled: false }, { ...config, key: '' }, { ...config, budgetKeyId: '' }, { ...config, rateLimitId: '' }, { ...config, model: 'unapproved/model' }]) {
    let calls = 0;
    const reply = await converse(input(), signal(), { config: incomplete, planner: async () => { calls++; return { plan: plan() }; } });
    assert.equal(calls, 0); assert.equal(reply.reason, 'not-configured');
    assert.match(reply.reply, /60 yd³\/hr/);
  }
});

test('budget exhaustion, provider failures and rate limits preserve the scripted inquiry', async () => {
  for (const [statusCode, reason] of [[402, 'budget'], [429, 'rate-limit'], [401, 'provider'], [503, 'provider']] as const) {
    const reply = await converse(input('I need latex for bridge work'), signal(), { config, planner: async () => { throw { statusCode, message: 'private upstream detail' }; } });
    assert.equal(reply.reason, reason);
    assert.match(reply.reply, /latex dosing/);
    assert.doesNotMatch(reply.reply, /private upstream/);
    assert.equal(reply.proposal.mixTypes?.state, 'proposed');
  }
});

test('a delayed provider is aborted and an honest timeout fallback is returned', async () => {
  let aborted = false;
  const reply = await converse(input(), signal(), { config, timeoutMs: 10, planner: async (_input, providerSignal) => {
    providerSignal.addEventListener('abort', () => { aborted = true; });
    return await new Promise(() => {});
  } });
  assert.equal(reply.reason, 'timeout'); assert.equal(aborted, true);
});

test('client cancellation aborts provider work without accepting a later result', async () => {
  const controller = new AbortController();
  let abortProvider: (() => void) | undefined;
  const replyPromise = converse(input(), controller.signal, { config, planner: async (_input, providerSignal) => {
    abortProvider = () => assert.equal(providerSignal.aborted, true);
    controller.abort(); return await new Promise(() => {});
  } });
  const reply = await replyPromise;
  assert.equal(reply.reason, 'canceled'); abortProvider!();
});

test('oversized context does not invoke the provider and malformed input fails the contract', async () => {
  const request = input('x'.repeat(2000));
  request.job.notes = 'x'.repeat(2000);
  request.job.openQuestions = Array(12).fill('x'.repeat(240));
  request.history = Array(6).fill({ role: 'user', text: 'x'.repeat(900) });
  let calls = 0;
  assert(conversationInputSchema.safeParse(request).success);
  assert.equal((await converse(request, signal(), { config, planner: async () => { calls++; return { plan: plan() }; } })).reason, 'context-limit');
  assert.equal(calls, 0);
  assert.equal(conversationInputSchema.safeParse({ ...request, primaryId: '880-s' }).success, false);
  assert.equal(conversationInputSchema.safeParse({ ...request, history: Array(7).fill({ role: 'user', text: 'hello' }) }).success, false);
});

test('the model cannot invent comparisons or re-ask an explicitly skipped question', async () => {
  const request = input('I do small repairs'); request.skipped = ['quantity'];
  const reply = await converse(request, signal(), { config, planner: async () => ({ plan: plan({ comparisons: ['880-s'], question: 'quantity' }) }) });
  assert.doesNotMatch(reply.reply, /880 S/);
  assert.notEqual(reply.question, 'quantity');
});

test('unchanged extracted details are not presented as empty confirmation dialogs', () => {
  const request = input('standard concrete'); request.job = knownJob();
  const extracted = conversationPlanSchema.parse(plan({ updates: [{ field: 'mixTypes', evidence: 'standard concrete', value: { state: 'proposed', value: ['standard'] } }] }));
  assert.deepEqual(proposalFromPlan(request, extracted), {});
});
