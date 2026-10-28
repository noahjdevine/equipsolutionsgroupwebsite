import test from 'node:test';
import assert from 'node:assert/strict';
import { fitJob, fitModel } from '../../src/data/fit';
import { explainFit } from '../../src/data/guide';
import { modelById } from '../../src/data/models';
import { knownJob } from './fixtures';

test('actual small-job capacity boundaries distinguish the trailer, 425 and larger bins', () => {
  for (const [yd3, expected] of [[4, '327-k'], [4.0001, '425-s'], [5.5, '425-s'], [5.5001, '750-l'], [10.5, '850-s']] as const) {
    assert.equal(fitJob(knownJob({ quantity: { kind: 'reported', yd3, scope: 'placement' } })).primaryId, expected);
  }
});

test('supplied dimensions can establish the same provisional capacity fit without inventing thickness', () => {
  const fit = fitJob(knownJob({ quantity: { kind: 'dimensions', scope: 'placement', inputs: { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 } } }));
  assert.equal(fit.primaryId, '327-k');
  assert.equal(fit.demand.quantity.kind, 'calculated');
  assert.equal(fit.demand.quantity.estimate?.yd3, 4);
});

test('unknown quantity and unconfirmed proposals request clarification without naming a machine', () => {
  for (const overrides of [
    { quantity: { kind: 'unknown' } },
    { quantity: { kind: 'proposed', yd3: 3, scope: 'placement' } },
    { mounting: { state: 'proposed', value: 'truck' } },
  ]) {
    const fit = fitJob({ ...knownJob(), ...overrides });
    assert.equal(fit.status, 'needs-clarification');
    assert.equal(fit.primaryId, undefined);
  }
});

test('unknown chassis keeps the trailer in consideration; explicit truck preference filters it', () => {
  const open = fitJob(knownJob({ mounting: { state: 'unknown' } }));
  assert.equal(open.primaryId, '327-k');
  assert(open.questionIds.includes('mounting'));
  const truck = fitJob(knownJob({ mounting: { state: 'reported', value: 'truck' }, existingChassis: { state: 'reported', value: false } }));
  assert.equal(truck.primaryId, '425-s');
  assert(truck.caveatIds.includes('chassis-needed'));
});

test('latex and chopper exclusions hold for both slots across mounting, quantity and utilization', () => {
  const allowed = new Set(['740-k', '750-l', '850-s', '880-s']);
  for (const yd3 of [0.5, 4, 4.5, 5.5, 10, 10.5, 11, 12, 50]) {
    for (const mounting of ['either', 'trailer', 'truck'] as const) {
      for (const weeklyUse of ['1-2', '10-plus'] as const) {
        for (const option of ['latex-polymer', 'fiber-chopper'] as const) {
          const fit = fitJob(knownJob({
            quantity: { kind: 'reported', yd3, scope: 'placement' },
            mounting: { state: 'reported', value: mounting }, weeklyUse: { state: 'reported', value: weeklyUse },
            mixTypes: { state: 'reported', value: ['latex-modified'] },
            requiredOptions: { state: 'reported', value: [option] }, replenishment: { state: 'reported', value: 'yes' },
          }));
          for (const id of [fit.primaryId, fit.alternateId]) if (id) assert(allowed.has(id), id);
          if (mounting === 'trailer') {
            assert.equal(fit.status, 'configuration-review');
            assert.equal(fit.primaryId, undefined);
          }
        }
      }
    }
  }
});

test('an unknown fiber system asks which system is needed instead of inferring chopper compatibility', () => {
  const fit = fitJob(knownJob({ mixTypes: { state: 'reported', value: ['fiber-reinforced'] } }));
  assert.equal(fit.primaryId, undefined);
  assert(fit.questionIds.includes('fiber-system'));
  const feeder = fitJob(knownJob({ requiredOptions: { state: 'reported', value: ['fiber-feeder'] } }));
  assert.equal(feeder.status, 'configuration-review');
  assert.equal(feeder.primaryId, undefined);
  assert(feeder.excludedModels.every((entry) => entry.reason === 'option-unconfirmed'));
});

test('chopper results retain air prerequisites and route a missing air system to configuration review', () => {
  const fit = fitJob(knownJob({ requiredOptions: { state: 'reported', value: ['fiber-chopper'] }, highVolumeAir: { state: 'reported', value: false } }));
  assert.equal(fit.status, 'configuration-review');
  assert(fit.caveatIds.includes('chopper-air'));
  assert.match(explainFit(fit), /additional truck air tank may be needed/i);
});

test('a polymer option alone does not establish a confirmed latex configuration', () => {
  const fit = fitJob(knownJob({ requiredOptions: { state: 'reported', value: ['latex-polymer'] } }));
  assert.equal(fit.status, 'configuration-review');
  assert(fit.questionIds.includes('option-configuration'));
});

test('a special additional bin does not exclude the small machine or increase its published aggregate bin', () => {
  const fit = fitJob(knownJob({ requiredOptions: { state: 'reported', value: ['cement-flyash-bin'] } }));
  assert.equal(fit.primaryId, '327-k');
  assert.equal(modelById(fit.primaryId!)?.binCapacityYd3, 4);
});

test('weekly job count and remote location alone do not force the largest machine', () => {
  for (const weeklyUse of ['1-2', '3-5', '6-10', '10-plus'] as const) {
    assert.equal(fitJob(knownJob({ weeklyUse: { state: 'reported', value: weeklyUse }, workTypes: { state: 'reported', value: ['municipal', 'mining'] } })).primaryId, '327-k');
  }
});

test('a small rapid-set patch can retain the smaller machine', () => {
  assert.equal(fitJob(knownJob({ workTypes: { state: 'reported', value: ['rapid-set'] }, mixTypes: { state: 'reported', value: ['rapid-set'] } })).primaryId, '327-k');
});

test('placement-window arithmetic raises the required rate and never changes published specifications', () => {
  const fit = fitJob(knownJob({ quantity: { kind: 'reported', yd3: 10, scope: 'placement' }, placementWindowMinutes: { state: 'reported', value: 10 } }));
  assert.equal(fit.demand.rateYd3Hr, 60);
  assert.equal(fit.demand.rateBasis, 'calculated');
  assert.equal(modelById(fit.primaryId!)?.productionYd3Hr, 60);
  const faster = fitJob(knownJob({ requiredRateYd3Hr: { state: 'reported', value: 70 } }));
  assert.equal(faster.primaryId, '880-s');
  const beyond = fitJob(knownJob({ requiredRateYd3Hr: { state: 'reported', value: 91 } }));
  assert.equal(beyond.status, 'configuration-review');
  assert.equal(beyond.primaryId, undefined);
});

test('a conflicting reported rate does not override quantity/window demand', () => {
  const fit = fitJob(knownJob({ placementWindowMinutes: { state: 'reported', value: 3 }, requiredRateYd3Hr: { state: 'reported', value: 10 } }));
  assert.equal(fit.demand.rateYd3Hr, 60);
  assert(fit.caveatIds.includes('rate-conflict'));
});

test('an inadequate trailer rate never relaxes a hard mounting preference', () => {
  const fit = fitJob(knownJob({ mounting: { state: 'reported', value: 'trailer' }, requiredRateYd3Hr: { state: 'reported', value: 31 } }));
  assert.equal(fit.status, 'configuration-review');
  assert.equal(fit.primaryId, undefined);
  assert.equal(fit.alternateId, undefined);
});

test('an unusable quantity/window calculation requests review rather than overflowing a rating', () => {
  const fit = fitJob(knownJob({ quantity: { kind: 'reported', yd3: 1e300, scope: 'placement' }, placementWindowMinutes: { state: 'reported', value: 1e-300 } }));
  assert.equal(fit.status, 'configuration-review');
  assert.equal(fit.primaryId, undefined);
  assert(fit.questionIds.includes('placement-rate'));
});

test('daily quantity and a coarse range plus a time window are not treated as exact peak demand', () => {
  for (const quantity of [
    { kind: 'reported', yd3: 50, scope: 'day' },
    { kind: 'range', minYd3: 5, maxYd3: 10, scope: 'placement' },
  ]) {
    const fit = fitJob({ ...knownJob(), quantity, placementWindowMinutes: { state: 'reported', value: 5 } });
    assert.equal(fit.primaryId, undefined);
    assert.equal(fit.demand.rateBasis, 'unknown');
  }
});

test('large placements need a replenishment answer and never silently fall back to a smaller bin', () => {
  const base = knownJob({ quantity: { kind: 'reported', yd3: 30, scope: 'placement' } });
  const unknown = fitJob(base);
  assert.equal(unknown.primaryId, undefined);
  assert(unknown.questionIds.includes('replenishment'));
  const no = fitJob({ ...base, replenishment: { state: 'reported', value: 'no' } });
  assert.equal(no.status, 'configuration-review');
  assert.equal(no.primaryId, undefined);
  const yes = fitJob({ ...base, replenishment: { state: 'reported', value: 'yes' } });
  assert.equal(yes.primaryId, '850-s');
  assert(yes.caveatIds.includes('reload-required'));
  assert(yes.questionIds.includes('placement-window'));
});

test('legacy under-5 and 5–10 bands do not promise that smaller bins hold their upper ends', () => {
  for (const [pourSizeYd3, minimum] of [['under-5', 5], ['5-10', 10]] as const) {
    const fit = fitModel({ applicationSlug: 'small-pour', pourSizeYd3, poursPerWeek: '1-2', chassis: 'not-sure', mixTypes: ['standard'] });
    for (const id of [fit.primaryId, fit.alternateId]) if (id) assert(modelById(id)!.binCapacityYd3! >= minimum);
    assert(fit.caveatIds.includes('range-quantity'));
  }
});

test('pool-only gunite asks wet/dry, and confirmed dry gunite withholds an automatic pick', () => {
  const job = knownJob({ workTypes: { state: 'reported', value: ['shotcrete'] }, mixTypes: { state: 'reported', value: ['shotcrete-gunite'] } });
  assert(fitJob(job).questionIds.includes('process'));
  assert.equal(fitJob(job).primaryId, undefined);
  const dry = fitJob({ ...job, process: { state: 'reported', value: 'dry-gunite' } });
  assert.equal(dry.status, 'configuration-review');assert.equal(dry.primaryId, undefined);
});

test('wet shotcrete retains configuration caveats and the 750/850 comparison does not invent a faster rate', () => {
  const fit = fitJob(knownJob({
    quantity: { kind: 'reported', yd3: 6, scope: 'placement' },
    workTypes: { state: 'reported', value: ['shotcrete'] }, mixTypes: { state: 'reported', value: ['shotcrete-gunite'] },
    process: { state: 'reported', value: 'wet-shotcrete' }, feedSetup: { state: 'reported', value: 'Existing pump; Paul to confirm' },
  }));
  assert.equal(fit.primaryId, '750-l');assert.equal(fit.alternateId, '850-s');
  assert(fit.caveatIds.includes('sprayed-configuration'));
  assert.match(explainFit(fit), /Both publish 60 yd³\/hr/);
});

test('malformed or forged job data cannot select a machine', () => {
  const fit = fitJob({ ...knownJob(), primaryId: '880-s' });
  assert.equal(fit.primaryId, undefined);assert(fit.errors?.length);
});
