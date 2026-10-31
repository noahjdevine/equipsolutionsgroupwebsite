import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyJob } from '../../src/data/yardley-job';
import { fitJob } from '../../src/data/fit';
import { applyJobPatch, confirmPatch, nextStep, proposeFromText, quantityLabel, summaryRows, type IntakeStep } from '../../src/lib/yardley/intake';

test('typed job details remain proposals until explicitly confirmed', () => {
  const job = emptyJob();
  const proposed = proposeFromText('I pour driveways with standard concrete, 3 cubic yards per placement.');
  assert.deepEqual(proposed.workTypes, { state: 'proposed', value: ['small-pour'] });
  assert.deepEqual(proposed.quantity, { kind: 'proposed', yd3: 3, scope: 'placement' });
  assert.equal(job.quantity.kind, 'unknown');
  assert.equal(fitJob({ ...job, ...proposed }).primaryId, undefined);
  const confirmed = confirmPatch(job, proposed)!;
  assert.deepEqual(confirmed.quantity, { kind: 'reported', yd3: 3, scope: 'placement' });
  assert.equal(fitJob(confirmed).primaryId, '327-k');
});

test('negation, hypotheticals, questions, ranges and multiple quantities do not create confident requirements', () => {
  for (const text of ['No latex for this bridge', 'I do not need latex', 'I don’t need latex', 'Never use latex', 'Maybe a trailer', 'If I do shotcrete', 'Trailer or truck?', 'What is latex?', 'Not gunite']) assert.deepEqual(proposeFromText(text), {});
  for (const text of ['5 to 10 yards', '5-10 yards', 'between 5 and 10 yards', '3 yards and 8 yards', 'about 5 yards', '0 yards']) assert.equal(proposeFromText(text).quantity, undefined);
});

test('scope stays unknown without an explicit per-placement statement and daily total stays daily', () => {
  assert.deepEqual(proposeFromText('8 cubic yards').quantity, { kind: 'proposed', yd3: 8, scope: 'unknown' });
  assert.deepEqual(proposeFromText('8 cubic yards per day').quantity, { kind: 'proposed', yd3: 8, scope: 'day' });
  assert.deepEqual(proposeFromText('70 yards per hour').requiredRateYd3Hr, { state: 'proposed', value: 70 });
  assert.equal(proposeFromText('70 yards per hour').quantity, undefined);
  assert.equal(nextStep(confirmPatch(emptyJob(), proposeFromText('standard driveways 8 cubic yards per day'))!, new Set(['detail'])), 'quantity');
});

test('followups distinguish sprayed process, feed setup and fiber-chopper air', () => {
  const job = confirmPatch(emptyJob(), proposeFromText('I do wet-mix shotcrete pools'))!;
  const skipped = new Set<IntakeStep>(['detail']);
  assert.equal(nextStep(job, skipped), 'feed');
  skipped.add('feed'); skipped.add('quantity'); skipped.add('pace'); skipped.add('replenishment'); skipped.add('setup');
  job.requiredOptions = { state: 'reported', value: ['fiber-chopper'] };
  assert.equal(nextStep(job, skipped), 'air');
  job.highVolumeAir = { state: 'reported', value: false };
  assert.equal(nextStep(job, skipped), undefined);
});

test('a daily total stays in the brief when a separate peak placement quantity is supplied', () => {
  const job = confirmPatch(emptyJob(), proposeFromText('Standard driveways 40 cubic yards per day'))!;
  const updated = applyJobPatch(job, { quantity: { kind: 'reported', yd3: 4, scope: 'placement' } });
  assert(updated.ok);
  assert.equal(updated.job.quantity.kind, 'reported');
  assert.match(updated.job.notes, /40 yd³ \/ day/);
  assert.equal(fitJob(updated.job).primaryId, '327-k');
  const fullNotes = { ...job, notes: 'x'.repeat(2000) };
  assert.equal(applyJobPatch(fullNotes, { quantity: { kind: 'reported', yd3: 4, scope: 'placement' } }).ok, false);
  assert.equal(fullNotes.notes.length, 2000);
});

test('unknown remains a valid path to review without repeatedly asking skipped questions', () => {
  const skipped = new Set<IntakeStep>(['work', 'mix', 'quantity', 'pace', 'replenishment', 'setup', 'options']);
  assert.equal(nextStep(emptyJob(), skipped), undefined);
  assert.equal(fitJob(emptyJob()).primaryId, undefined);
});

test('summary identifies calculated quantities and keeps zero-free unknowns distinct', () => {
  const job = emptyJob();
  assert.equal(quantityLabel(job), 'Not sure yet');
  job.quantity = { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } };
  assert.equal(quantityLabel(job), '≈ 4 yd³ / placement · calculated');
  assert(summaryRows(job).some((row) => row.label === 'Quantity' && row.step === 'quantity' && row.value.includes('calculated')));
});

test('confirmation revalidates proposals and rejects malformed or overlong typed values', () => {
  assert.equal(confirmPatch(emptyJob(), { quantity: { kind: 'proposed', yd3: -1, scope: 'placement' } }), undefined);
  assert.deepEqual(proposeFromText('x'.repeat(2001)), {});
  assert.equal(proposeFromText('x'.repeat(201), 'detail').subtype, undefined);
});
