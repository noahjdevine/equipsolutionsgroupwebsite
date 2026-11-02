import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLead, formatLeadEmail, prepareYardleyBrief, parseGuideSubmission, formatGuideEmail } from '../../src/data/lead';
import { randomUUID } from 'node:crypto';
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

const submission = (job = knownJob()) => ({ version: 2, source: 'mixer-guide', submissionId: randomUUID(), contact, brief: { version: 1, job } });
test('reviewed guide permits unknowns and validates the offered contact method without changing legacy rules', () => {
  const phone = { name: 'Buyer', preferredContact: 'whatsapp', preferredLanguage: 'es', phone: '+1 555 555 5555' };
  assert(parseGuideSubmission({ ...submission(), contact: phone }).ok);
  for (const c of [{ ...phone, phone: '' }, { ...phone, email: 'wrong' }, { ...contact, name: 'Header\nBcc: stranger' }, { ...contact, name: 'x'.repeat(101) }]) {
    assert(!parseGuideSubmission({ ...submission(), contact: c }).ok);
  }
  const empty = parseGuideSubmission({ ...submission(), brief: { version: 1, job: { version: 1 } } });
  assert(empty.ok);assert.match(formatGuideEmail(empty.submission).text, /Not sure yet/);
});
test('reviewed guide rejects proposed answers, forged fits and calculated totals', () => {
  const raw = submission();
  assert(!parseGuideSubmission({ ...raw, brief: { ...raw.brief, fit: { primaryId: '880-s' } } }).ok);
  assert(!parseGuideSubmission({ ...raw, brief: { version: 1, job: knownJob({ mixTypes: { state: 'proposed', value: ['latex-modified'] } }) } }).ok);
  assert(!parseGuideSubmission({ ...raw, brief: { version: 1, job: knownJob({ quantity: { kind: 'proposed', yd3: 3, scope: 'placement' } }) } }).ok);
  assert(!parseGuideSubmission({ ...raw, brief: { version: 1, job: { ...knownJob(), quantity: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 }, yd3: 1 } } } }).ok);
});
test('exact email contains inputs, estimates, options, qualified fit, known latent fields and open questions as plain text', () => {
  const parsed = parseGuideSubmission(submission(knownJob({
    quantity: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } },
    requiredOptions: { state: 'reported', value: ['fiber-chopper'] },
    feedSetup: { state: 'reported', value: 'Existing feed setup to review' },
    notes: '<img src=x onerror=alert(1)>', openQuestions: ['Can Paul review this chassis?'],
  })));
  assert(parsed.ok);const mail = formatGuideEmail(parsed.submission);
  for (const expected of ['≈ 4 yd³', '18 ft × 18 ft × 4 in', 'no waste allowance', '750 L', '850 S', 'high-volume air', 'Existing feed setup', 'Can Paul review', '<img src=x onerror=alert(1)>']) assert(mail.text.includes(expected), expected);
  assert.equal('html' in mail, false);assert.doesNotMatch(mail.text, /Nothing has been sent/);
});
