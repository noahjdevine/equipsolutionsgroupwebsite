/**
 * Scripted lines for /job/. The page works with no model call.
 * The closing paragraph is also the fallback when the gateway key is missing or the call fails.
 * No prices, lead times, territory, or figures that are not already the model name.
 */

import type { GuideAnswers, FitResult } from './fit';
import { modelById } from './models';

const WORK: Record<string, string> = {
  'bridge-deck': 'Latex-modified overlay. The working window is minutes, and the dose has to hit the design.',
  'rapid-set': 'Night lane-return. A drum is already hydrating before it gets to you.',
  shotcrete: 'Shotcrete. The crew needs mix at the nozzle, not a barrel and then nothing.',
  municipal: 'Scattered stops. A full barrel for each one is mostly waste.',
  mining: 'Remote site. Haul the materials dry. Do not haul concrete that is already working.',
  'small-pour': 'A few yards. Short-load fees and returned concrete are the whole problem.',
};

const POUR: Record<string, string> = {
  'under-5': 'Under 5 yards. That is a small-unit pour.',
  '5-10': '5 to 10 yards. The low end fits a smaller bin. The top of that range may be a second discharge.',
  '10-20': '10 to 20 yards. I am looking at the larger truck-mounted bins. The top of that range is more than one discharge.',
  '20-40': '20 to 40 yards. No bin in this line holds that in one discharge. This is a production choice.',
  '40-plus': '40 yards and up. Still more than one discharge. The rate is what I am choosing.',
};

const WEEK: Record<string, string> = {
  '1-2': 'A light week. If a smaller unit covers the pour, that is the one I would put you in.',
  '3-5': 'A few pours a week. Enough to matter. Not a peak-day plant.',
  '6-10': 'A heavy week. Rate starts to matter.',
  '10-plus': 'A heavy week. I size for rate, not for a bigger bin.',
};

const CHASSIS: Record<string, string> = {
  yes: 'You have a chassis. I am looking at truck-mounted units.',
  no: 'No chassis. The 327 K is the trailer. Truck-mounted units need a chassis, and I will talk that through.',
  'not-sure': 'Not sure on the chassis. I will match the unit on a call.',
};

export function beatLine(kind: 'work' | 'pour' | 'week' | 'chassis', value: string): string {
  const table = kind === 'work' ? WORK : kind === 'pour' ? POUR : kind === 'week' ? WEEK : CHASSIS;
  return table[value] ?? 'I will match this on a call.';
}

export function scriptedClose(answers: GuideAnswers, result: FitResult): string {
  const primary = modelById(result.primaryId);
  const alternate = result.alternateId ? modelById(result.alternateId) : undefined;
  const primaryName = primary?.name ?? 'a unit from the line';
  const blocks: string[] = [];

  if (result.smallerBecauseLight) {
    blocks.push(`A light week. I would put you in the ${primaryName}, because a smaller unit covers this pour.`);
  } else if (result.ratePush) {
    blocks.push(`This is a rate decision. I would start with the ${primaryName}.`);
  } else {
    blocks.push(`I would start with the ${primaryName}.`);
  }

  if (result.trailerPrimary) {
    blocks[0] += ' It is the trailer.';
  }
  if (result.multiDischarge) {
    blocks[0] += ' This pour is more than one discharge.';
  }

  if (alternate && result.keptSmaller) {
    blocks.push(`The ${alternate.name} stays on the list. It still covers a pour this size.`);
  } else if (alternate && !(result.needsChassisTalk && alternate.id === '327-k')) {
    blocks.push(`The ${alternate.name} is the one I would put next to it.`);
  }

  if (result.needsChassisTalk) {
    blocks.push(
      alternate?.id === '327-k'
        ? 'You do not have a chassis. The 327 K is the trailer. I will talk that through, and I will not invent a chassis spec.'
        : 'You do not have a chassis. Truck-mounted units need one. The 327 K is the trailer. I will talk that through, and I will not invent a chassis spec.',
    );
  }
  if (result.confirmOnCall && answers.chassis === 'not-sure') {
    blocks.push('Chassis is still open. I will match the unit on a call.');
  } else if (result.confirmOnCall) {
    blocks.push('At this size I want to hear the job before I lock a unit.');
  }

  return blocks.join(' ');
}
