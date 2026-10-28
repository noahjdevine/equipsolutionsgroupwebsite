/**
 * Deterministic StarMix shortlist for /job/.
 *
 * The language model never calls this and never picks a unit.
 * Sand and stone on Paul's sheet are a 40/60 mix split — they are not read here.
 * Published bin and production win where the sheet disagrees (327 K, 425 S).
 * All six records now have published US bin and production figures.
 */

import type { MixerFields } from './lead';
import { models, type Model } from './models';

export type GuideAnswers = Pick<
  MixerFields,
  'applicationSlug' | 'pourSizeYd3' | 'poursPerWeek' | 'chassis' | 'mixTypes'
>;

export interface FitResult {
  primaryId: string;
  alternateId?: string;
  /** The pour does not fit the primary bin in one discharge. */
  multiDischarge: boolean;
  /** Chassis is open, or the pour is large enough that the bin does not decide. */
  confirmOnCall: boolean;
  /** A truck is the pick and the visitor has no chassis. No chassis spec is invented. */
  needsChassisTalk: boolean;
  trailerPrimary: boolean;
  /** Light week: the smaller unit that covers the pour is the pick. */
  smallerBecauseLight: boolean;
  /** Rate push kept the smaller unit that still covers a small pour. */
  keptSmaller: boolean;
  /** Heavy week or fast work chose the primary. */
  ratePush: boolean;
}

const byId = new Map<string, Model>(models.map((model) => [model.id, model]));

function binLow(model: Model): number {
  if (model.binCapacityYd3 != null) return model.binCapacityYd3;
  return Number.POSITIVE_INFINITY;
}

function binHigh(model: Model): number {
  if (model.binCapacityYd3 != null) return model.binCapacityYd3;
  return 0;
}

/** Published US rate only. */
function rateOf(model: Model): number {
  if (model.productionYd3Hr != null) return model.productionYd3Hr;
  return 0;
}

function covers(model: Model, pour: GuideAnswers['pourSizeYd3']): boolean {
  const high = binHigh(model);
  if (pour === 'under-5') return high >= 4;
  if (pour === '5-10') return high >= 5.5;
  if (pour === '10-20') return high >= 9;
  return true;
}

function holdsTop(model: Model, pour: GuideAnswers['pourSizeYd3']): boolean {
  const high = binHigh(model);
  if (pour === 'under-5') return high >= 4;
  if (pour === '5-10') return high >= 10;
  return false;
}

function bySize(a: Model, b: Model): number {
  const size = binLow(a) - binLow(b);
  if (size !== 0) return size;
  const published = (a.binCapacityYd3 == null ? 1 : 0) - (b.binCapacityYd3 == null ? 1 : 0);
  if (published !== 0) return published;
  return rateOf(a) - rateOf(b);
}

function lookup(id: string): Model {
  return byId.get(id) ?? models[0];
}

function distinct(primary: Model, alternate: Model | undefined): Model | undefined {
  if (!alternate || alternate.id === primary.id) return undefined;
  return alternate;
}

export function fitModel(input: GuideAnswers): FitResult {
  const mixes = input.mixTypes ?? [];
  const light = input.poursPerWeek === '1-2';
  const heavy = input.poursPerWeek === '6-10' || input.poursPerWeek === '10-plus';
  const fastWork =
    input.applicationSlug === 'rapid-set' ||
    input.applicationSlug === 'shotcrete' ||
    mixes.some((mix) => mix === 'rapid-set' || mix === 'shotcrete-gunite');
  const pour = input.pourSizeYd3;
  const smallPour = pour === 'under-5' || pour === '5-10';
  const largePour = pour === '20-40' || pour === '40-plus';

  let pool = models.filter((model) => covers(model, pour));
  if (input.chassis !== 'no') {
    pool = pool.filter((model) => model.mount === 'truck');
  }
  if (!pool.length) pool = models.filter((model) => model.mount === 'truck');

  const sized = [...pool].sort(bySize);
  const smallest = sized[0];
  const sixties = pool
    .filter((model) => {
      const rate = rateOf(model);
      return rate >= 60 && rate < 90;
    })
    .sort((a, b) => {
      const high = binHigh(b) - binHigh(a);
      if (high !== 0) return high;
      const published = (a.binCapacityYd3 == null ? 1 : 0) - (b.binCapacityYd3 == null ? 1 : 0);
      if (published !== 0) return published;
      return binLow(b) - binLow(a);
    });
  const topRate = [...pool].sort((a, b) => rateOf(b) - rateOf(a) || binHigh(b) - binHigh(a))[0];
  const publishedTen = pool
    .filter((model) => model.binCapacityYd3 != null && model.binCapacityYd3 >= 10)
    .sort(bySize);
  const oneDischarge = pool.filter((model) => holdsTop(model, '5-10')).sort(bySize);

  let primary = smallest;
  let alternate: Model | undefined;
  let keptSmaller = false;
  let ratePush = false;
  let smallerBecauseLight = false;

  if (largePour) {
    if (heavy) {
      ratePush = true;
      primary = topRate;
      alternate = sixties.find((model) => model.id !== primary.id);
    } else if (fastWork) {
      ratePush = true;
      primary = sixties[0] ?? topRate;
      alternate = topRate.id === primary.id ? sixties[1] : topRate;
    } else {
      primary = sixties[0] ?? topRate;
      alternate = sixties.find((model) => model.id !== primary.id) ?? publishedTen[0];
    }
  } else if (light) {
    smallerBecauseLight = true;
    if (pour === '10-20') {
      primary = publishedTen[0] ?? smallest;
      alternate = fastWork
        ? topRate
        : sized.find((model) => binLow(model) > binLow(primary));
    } else if (pour === '5-10') {
      primary = smallest;
      if (input.chassis === 'no' && !fastWork) alternate = lookup('327-k');
      else if (fastWork) alternate = oneDischarge.find((model) => model.binCapacityYd3 != null);
      else alternate = oneDischarge.find((model) => model.id === '740-k') ?? oneDischarge[0];
    } else {
      primary = smallest;
      const next = sized.find((model) => model.id !== primary.id && binLow(model) <= 6);
      alternate = next;
    }
  } else if (heavy || fastWork) {
    ratePush = true;
    if (heavy) {
      primary = topRate;
    } else if (pour === '10-20') {
      primary = sixties[0] ?? topRate;
    } else {
      primary =
        oneDischarge.find((model) => model.binCapacityYd3 != null && rateOf(model) >= 60) ??
        sixties[0] ??
        topRate;
    }
    if (smallPour) {
      alternate = sized.find((model) => model.id !== primary.id);
      keptSmaller = Boolean(alternate);
    } else {
      alternate =
        (primary.id === topRate.id ? sixties[0] : topRate) ??
        sized.find((model) => model.id !== primary.id);
    }
  } else if (pour === '10-20') {
    primary = publishedTen[0] ?? smallest;
    alternate = sized.find((model) => binLow(model) > binLow(primary));
  } else if (pour === '5-10') {
    primary = smallest;
    alternate = input.chassis === 'no' ? lookup('327-k') : lookup('740-k');
  } else {
    primary = smallest;
    alternate = input.chassis === 'no' ? sized.find((model) => model.id !== primary.id) : undefined;
  }

  if (input.chassis !== 'no') {
    if (primary.mount === 'trailer') {
      primary = sized.find((model) => model.mount === 'truck') ?? primary;
    }
    if (alternate?.mount === 'trailer') alternate = undefined;
  }

  alternate = distinct(primary, alternate);

  const multiDischarge = !holdsTop(primary, pour);

  return {
    primaryId: primary.id,
    alternateId: alternate?.id,
    multiDischarge,
    confirmOnCall: input.chassis === 'not-sure' || pour === '40-plus',
    needsChassisTalk: input.chassis === 'no' && primary.mount === 'truck',
    trailerPrimary: primary.mount === 'trailer',
    smallerBecauseLight,
    keptSmaller,
    ratePush,
  };
}
