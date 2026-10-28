import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLead, formatLeadEmail, prepareYardleyBrief } from '../../src/data/lead';
import { contact, legacyMixer, knownJob } from './fixtures';

test('ordinary mixer, parts and sourcing leads retain their existing validation contracts', () => {
  for (const fields of [
    legacyMixer,
    { intent: 'parts', modelId: 'not-sure', partNeeded: 'Conveyor chain', urgency: 'scheduled' },
    { intent: 'sourcing', whatSought: 'Equipment', quantity: '1', sourcingTimeline: 'researching', destinationRegion: 'Customer supplied' },
  ]) {
    const parsed = parseLead({ ...contact, ...fields });
    assert(parsed.ok && !parsed.spam);
    assert.match(formatLeadEmail(parsed.lead).text, /test@example.com/);
  }
});

test('legacy guide email recomputes latex fit and preserves the configuration caveat', () => {
  const parsed = parseLead({ ...contact, ...legacyMixer, source: 'mixer-guide', mixTypes: ['latex-modified'], primaryId: '327-k' });
  assert(parsed.ok && !parsed.spam);
  const text = formatLeadEmail(parsed.lead).text;
  assert.match(text, /Guide primary: 750 L/);
  assert.match(text, /latex dosing configuration/);
  assert.doesNotMatch(text, /Guide primary: 327 K/);
});

test('an unresolved guide configuration is sent as unresolved rather than a fabricated model', () => {
  const parsed = parseLead({ ...contact, ...legacyMixer, source: 'mixer-guide', mixTypes: ['shotcrete-gunite'] });
  assert(parsed.ok && !parsed.spam);
  assert.match(formatLeadEmail(parsed.lead).text, /Guide primary: Pending clarification/);
});

test('phone contact still requires a number and the honeypot still short-circuits spam', () => {
  const bad = parseLead({ ...contact, ...legacyMixer, preferredContact: 'phone' });
  assert(!bad.ok && bad.errors.some((error) => error.field === 'phone'));
  const spam = parseLead({ website: 'spam' });assert(spam.ok && spam.spam);
});

test('the versioned brief permits unknowns and computes fit itself', () => {
  const parsed = prepareYardleyBrief({ version: 1, job: { version: 1 } });
  assert(parsed.ok);
  assert.equal(parsed.brief.fit.status, 'needs-clarification');
  assert.equal(parsed.brief.fit.primaryId, undefined);
  assert.equal(prepareYardleyBrief({ version: 1, job: knownJob(), fit: { primaryId: '880-s' } }).ok, false);
});

test('client-supplied calculated totals are rejected; the trusted brief retains calculation inputs', () => {
  const job = knownJob({ quantity: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } });
  const parsed = prepareYardleyBrief({ version: 1, job });assert(parsed.ok);
  assert.equal(parsed.brief.fit.demand.quantity.yd3, 4);
  assert.equal(prepareYardleyBrief({ version: 1, job: { ...job, quantity: { ...job.quantity, yd3: 1 } } }).ok, false);
});
