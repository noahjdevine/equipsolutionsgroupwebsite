import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateVolume } from '../../src/lib/yardley/volume';

test('a supplied 18 × 18 ft slab at specified 4 inches estimates 4 yd³ without waste', () => {
  const inputs = { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4 };
  const result = calculateVolume(inputs);
  assert(result.ok);
  assert.equal(result.estimate.yd3, 4);
  assert.deepEqual(result.estimate.inputs, inputs);
  assert.equal(result.estimate.provenance, 'calculated');
  assert.match(result.estimate.label, /Estimate/);
});

test('area/depth and supplied cross-section calculations retain their own units', () => {
  const overlay = calculateVolume({ shape: 'area-depth', areaFt2: 324, thicknessIn: 1 });
  const curb = calculateVolume({ shape: 'prism', lengthFt: 27, crossSectionFt2: 1 });
  assert(overlay.ok && curb.ok);
  assert.equal(overlay.estimate.yd3, 1);
  assert.equal(curb.estimate.yd3, 1);
});

test('no thickness or unit is silently supplied, and pool-water geometry is unsupported', () => {
  for (const input of [
    { shape: 'slab', lengthFt: 18, widthFt: 18 },
    { shape: 'slab', lengthM: 18, widthM: 18, thicknessIn: 4 },
    { shape: 'pool', gallons: 30000 },
    { shape: 'slab', lengthFt: 18, widthFt: 18, thicknessIn: 4, wastePercent: 10 },
  ]) assert.equal(calculateVolume(input).ok, false);
});

test('zero, negative, nonfinite, overflow and numeric-string dimensions are rejected', () => {
  for (const lengthFt of [0, -1, NaN, Infinity, '18', null]) {
    assert.equal(calculateVolume({ shape: 'slab', lengthFt, widthFt: 18, thicknessIn: 4 }).ok, false);
  }
  assert.equal(calculateVolume({ shape: 'slab', lengthFt: 1e300, widthFt: 1e300, thicknessIn: 4 }).ok, false);
});
