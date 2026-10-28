import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyJob, parseYardleyJob, jobFromGuide } from '../../src/data/yardley-job';
import { knownJob } from './fixtures';

test('an unknown job is valid, versioned and keeps quantity unknown', () => {
  const result = parseYardleyJob({ version: 1 });
  assert(result.ok);
  assert.deepEqual(result.job.quantity, { kind: 'unknown' });
  assert.deepEqual(result.job.mounting, { state: 'unknown' });
  assert.equal(parseYardleyJob({ version: 2 }).ok, false);
  assert.equal(parseYardleyJob({}).ok, false);
});

test('proposed, reported and calculated inputs remain distinguishable', () => {
  const proposed = knownJob({ mounting: { state: 'proposed', value: 'truck' } });
  const dimensions = knownJob({ quantity: { kind: 'dimensions', inputs: { shape: 'area-depth', areaFt2: 324, thicknessIn: 1 }, scope: 'placement' } });
  assert(parseYardleyJob(proposed).ok);
  const result = parseYardleyJob(dimensions);
  assert(result.ok && result.job.quantity.kind === 'dimensions');
  assert(!('yd3' in result.job.quantity));
});

test('invalid enum values, duplicate work, bad ranges and forged estimates fail validation', () => {
  for (const overrides of [
    { mounting: { state: 'reported', value: 'airplane' } },
    { workTypes: { state: 'reported', value: ['small-pour', 'small-pour'] } },
    { requiredOptions: { state: 'reported', value: ['fake-option'] } },
    { quantity: { kind: 'range', minYd3: 10, maxYd3: 5, scope: 'placement' } },
    { quantity: { kind: 'reported', yd3: 0, scope: 'placement' } },
    { quantity: { kind: 'reported', yd3: '3', scope: 'placement' } },
    { quantity: { kind: 'dimensions', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 }, scope: 'placement', yd3: 1 } },
    { notes: 'x'.repeat(2001) },
    { primaryId: '880-s' },
  ]) assert.equal(parseYardleyJob({ ...knownJob(), ...overrides }).ok, false);
});

test('empty-job defaults are independent between visitors', () => {
  const first = emptyJob();
  first.openQuestions.push('A private question');
  first.mounting.state = 'unknown';
  assert.deepEqual(emptyJob().openQuestions, []);
});

test('legacy range and unknown chassis do not become exact quantity or truck preference', () => {
  const job = jobFromGuide({ applicationSlug: 'small-pour', pourSizeYd3: 'under-5', poursPerWeek: '10-plus', chassis: 'not-sure', mixTypes: ['standard'] });
  assert.deepEqual(job.quantity, { kind: 'range', minYd3: 0, maxYd3: 5, scope: 'placement' });
  assert.equal(job.mounting.state, 'unknown');
  assert.equal(job.existingChassis.state, 'unknown');
});
