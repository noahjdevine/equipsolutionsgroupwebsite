/**
 * Deterministic provisional fit shared by browser, guide API and lead formatting.
 * Inputs are validated here too: callers cannot bypass option/mount constraints.
 */
import { models, type Model, type ModelId } from './models';
import { optionAvailability, type OptionId } from './options';
import { jobFromGuide, parseYardleyJob, reported, type GuideAnswers, type JobError, type YardleyJob } from './yardley-job';
import { calculateVolume, type VolumeEstimate } from '../lib/yardley/volume';

export type { GuideAnswers } from './yardley-job';
export type FitStatus = 'ready' | 'needs-clarification' | 'configuration-review';
export type ReasonId = 'capacity-match' | 'rate-match' | 'required-options' | 'trailer-fit' | 'truck-fit' | 'reload-plan';
export type CaveatId = 'provisional' | 'published-rate' | 'reload-required' | 'range-quantity' | 'chassis-needed'
  | 'latex-configuration' | 'chopper-air' | 'sprayed-configuration' | 'option-unconfirmed' | 'rate-conflict';
export type QuestionId = 'job-details' | 'work' | 'mix' | 'quantity' | 'placement-quantity' | 'process'
  | 'fiber-system' | 'mix-specification' | 'feed-setup' | 'replenishment' | 'placement-window' | 'placement-rate'
  | 'mounting' | 'option-configuration' | 'confirm-answers' | 'air-system';
export interface QuantitySummary {
  kind: 'unknown' | 'reported' | 'calculated' | 'range';
  scope?: 'placement' | 'day' | 'unknown';
  yd3?: number;
  minYd3?: number;
  maxYd3?: number;
  estimate?: VolumeEstimate;
}
export interface FitResult {
  status: FitStatus;
  primaryId?: ModelId;
  alternateId?: ModelId;
  reasonIds: ReasonId[];
  caveatIds: CaveatId[];
  questionIds: QuestionId[];
  requiredOptionIds: OptionId[];
  excludedModels: { id: ModelId; reason: 'mount' | 'option-unsupported' | 'option-unconfirmed' | 'rate' }[];
  demand: { quantity: QuantitySummary; rateYd3Hr?: number; rateBasis: 'unknown' | 'reported' | 'calculated' };
  errors?: JobError[];
}

function initial(): FitResult {
  return {
    status: 'needs-clarification', reasonIds: [], caveatIds: ['provisional', 'published-rate'],
    questionIds: [], requiredOptionIds: [], excludedModels: [],
    demand: { quantity: { kind: 'unknown' }, rateBasis: 'unknown' },
  };
}

function summarizeQuantity(job: YardleyJob): QuantitySummary {
  const q = job.quantity;
  if (q.kind === 'reported' || q.kind === 'range') return { ...q };
  if (q.kind === 'dimensions') {
    const calculation = calculateVolume(q.inputs);
    if (calculation.ok) return { kind: 'calculated', scope: q.scope, yd3: calculation.estimate.yd3, estimate: calculation.estimate };
  }
  return { kind: 'unknown' };
}

function bySizeThenRate(a: Model, b: Model): number {
  // Stable record order resolves equal published figures, without inventing a price advantage.
  return (a.binCapacityYd3 ?? Infinity) - (b.binCapacityYd3 ?? Infinity)
    || (a.productionYd3Hr ?? Infinity) - (b.productionYd3Hr ?? Infinity);
}

export function fitJob(input: unknown): FitResult {
  const result = initial();
  const parsed = parseYardleyJob(input);
  if (!parsed.ok) return { ...result, questionIds: ['job-details'], errors: parsed.errors };
  const job = parsed.job;
  const questions = new Set<QuestionId>();
  const caveats = new Set<CaveatId>(result.caveatIds);
  const work = reported(job.workTypes);
  const mixes = reported(job.mixTypes);
  const requested = reported(job.requiredOptions);
  const process = reported(job.process);
  const mounting = reported(job.mounting);
  const quantity = summarizeQuantity(job);
  result.demand.quantity = quantity;

  if (!work) questions.add('work');
  if (!mixes) questions.add('mix');
  if (quantity.kind === 'unknown') questions.add('quantity');
  else if (quantity.scope !== 'placement') questions.add('placement-quantity');
  if (Object.values(job).some((entry) => entry && typeof entry === 'object' && 'state' in entry && entry.state === 'proposed')
    || job.quantity.kind === 'proposed') questions.add('confirm-answers');

  const requirements = new Set<OptionId>(requested ?? []);
  if (mixes?.includes('latex-modified')) requirements.add('latex-polymer');
  result.requiredOptionIds = [...requirements];
  if (requirements.size) result.reasonIds.push('required-options');
  if (requirements.has('latex-polymer')) caveats.add('latex-configuration');
  if (requirements.has('fiber-chopper')) {
    caveats.add('chopper-air');
    if (reported(job.highVolumeAir) === undefined) questions.add('air-system');
  }

  const sprayed = mixes?.includes('shotcrete-gunite') || work?.includes('shotcrete')
    || process === 'wet-shotcrete' || process === 'dry-gunite';
  if (sprayed) {
    caveats.add('sprayed-configuration');
    if (!process || process === 'conventional') questions.add('process');
    if (!reported(job.feedSetup)) questions.add('feed-setup');
  }
  if (mixes?.includes('fiber-reinforced') && requested === undefined) questions.add('fiber-system');
  if (mixes?.includes('other') && !reported(job.mixSpecification)) questions.add('mix-specification');

  let pool = models.filter((model) => {
    if (mounting && mounting !== 'either' && model.mount !== mounting) {
      result.excludedModels.push({ id: model.id, reason: 'mount' });
      return false;
    }
    for (const option of requirements) {
      const availability = optionAvailability(option, model.id);
      if (availability.compatibility !== 'supported') {
        result.excludedModels.push({
          id: model.id,
          reason: availability.compatibility === 'unsupported' ? 'option-unsupported' : 'option-unconfirmed',
        });
        return false;
      }
    }
    return true;
  });

  const finish = (status: FitStatus): FitResult => {
    result.status = status;
    result.questionIds = [...questions];
    result.caveatIds = [...caveats];
    return result;
  };

  // Dry-gunite packages are not established by a base-model production rating.
  if (process === 'dry-gunite') {
    questions.add('option-configuration');
    return finish('configuration-review');
  }
  if (!pool.length) {
    questions.add('option-configuration');
    caveats.add('option-unconfirmed');
    return finish('configuration-review');
  }

  const explicitRate = reported(job.requiredRateYd3Hr);
  const window = reported(job.placementWindowMinutes);
  // A coarse quantity band and a time window cannot establish an exact placement rate.
  if (quantity.kind === 'range' && window !== undefined) questions.add('quantity');
  const calculatedRate = quantity.yd3 !== undefined && quantity.scope === 'placement' && window !== undefined
    ? quantity.yd3 * 60 / window : undefined;
  if (calculatedRate !== undefined && (!Number.isFinite(calculatedRate) || calculatedRate <= 0)) {
    questions.add('placement-rate');
    return finish('configuration-review');
  }
  if (explicitRate !== undefined && calculatedRate !== undefined && calculatedRate > explicitRate) caveats.add('rate-conflict');
  const rate = explicitRate === undefined ? calculatedRate
    : calculatedRate === undefined ? explicitRate : Math.max(explicitRate, calculatedRate);
  result.demand.rateYd3Hr = rate;
  result.demand.rateBasis = rate === undefined ? 'unknown'
    : explicitRate !== undefined && rate === explicitRate ? 'reported' : 'calculated';
  if (rate !== undefined) {
    pool = pool.filter((model) => {
      if (model.productionYd3Hr === null || model.productionYd3Hr < rate) {
        result.excludedModels.push({ id: model.id, reason: 'rate' });
        return false;
      }
      return true;
    });
    if (!pool.length) {
      questions.add('placement-rate');
      return finish('configuration-review');
    }
    result.reasonIds.push('rate-match');
  }

  // These answers determine compatibility, so do not fill in a model while they are open.
  if ([...questions].some((q) => ['work', 'mix', 'quantity', 'placement-quantity', 'confirm-answers',
    'process', 'fiber-system', 'mix-specification'].includes(q))) return finish('needs-clarification');

  const upper = quantity.yd3 ?? quantity.maxYd3;
  const maximumBin = Math.max(...pool.map((model) => model.binCapacityYd3 ?? 0));
  if (quantity.kind === 'range') caveats.add('range-quantity');
  const oneBin = upper === undefined ? [] : pool.filter((model) => model.binCapacityYd3 !== null && model.binCapacityYd3 >= upper);
  if (oneBin.length) {
    pool = oneBin;
    result.reasonIds.push('capacity-match');
  } else {
    const reload = reported(job.replenishment);
    if (reload !== 'yes') {
      questions.add('replenishment');
      const definitelyExceeds = quantity.yd3 !== undefined ? quantity.yd3 > maximumBin
        : (quantity.minYd3 ?? 0) > maximumBin;
      if (!definitelyExceeds) questions.add('quantity');
      return finish(reload === 'no' && definitelyExceeds ? 'configuration-review' : 'needs-clarification');
    }
    caveats.add('reload-required');
    result.reasonIds.push('reload-plan');
    pool = pool.filter((model) => model.binCapacityYd3 === maximumBin);
    if (rate === undefined) questions.add('placement-window');
  }

  pool.sort(bySizeThenRate);
  result.primaryId = pool[0].id;
  const alternate = pool.find((model) => model.mount !== pool[0].mount
    || model.binCapacityYd3 !== pool[0].binCapacityYd3
    || model.productionYd3Hr !== pool[0].productionYd3Hr) ?? pool[1];
  result.alternateId = alternate?.id;
  if (pool[0].mount === 'trailer') result.reasonIds.push('trailer-fit');
  else {
    result.reasonIds.push('truck-fit');
    if (reported(job.existingChassis) !== true) caveats.add('chassis-needed');
  }
  if (!mounting) questions.add('mounting');
  if (sprayed && !reported(job.feedSetup)) questions.add('feed-setup');
  if ((requirements.has('latex-polymer') && !mixes?.includes('latex-modified'))
    || (requirements.has('fiber-chopper') && reported(job.highVolumeAir) === false)) {
    questions.add('option-configuration');
    return finish('configuration-review');
  }
  return finish(questions.size ? 'needs-clarification' : 'ready');
}

/** Legacy page/lead compatibility. Invalid legacy values remain a clarification case. */
export function fitModel(input: GuideAnswers): FitResult {
  try {
    return fitJob(jobFromGuide(input));
  } catch {
    return { ...initial(), questionIds: ['job-details'] };
  }
}
