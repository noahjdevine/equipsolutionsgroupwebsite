/** Yardley's application-controlled copy. Works without an AI service. */
import type { FitResult, QuestionId, CaveatId, ReasonId, GuideAnswers } from './fit';
import { modelById } from './models';

export const QUESTION_COPY: Record<QuestionId, string> = {
  'job-details': 'Please check the job details, or send what you know to Paul.',
  work: 'What kinds of work will you use the mixer for?',
  mix: 'What mix types do you need? It is fine to be unsure.',
  quantity: 'Do you know the quantity for the largest placement, or its dimensions and specified thickness?',
  'placement-quantity': 'How much will you place at the largest single stop or uninterrupted placement?',
  process: 'Will you use wet-mix shotcrete or dry-mix gunite?',
  'fiber-system': 'Do you need a fiber feeder, a fiber chopper, or are you unsure?',
  'mix-specification': 'What material or mix specification does the job call for?',
  'feed-setup': 'What pump or gun/feed setup will the crew use?',
  replenishment: 'Can the crew replenish materials on site or between discharges?',
  'placement-window': 'How much time is available for the placement itself?',
  'placement-rate': 'What placement rate is required, and can Paul review that requirement with you?',
  mounting: 'Would a towable unit or a truck-mounted mixer suit the operation?',
  'option-configuration': 'Paul needs to confirm the required equipment and configuration with you.',
  'confirm-answers': 'Please confirm the suggested answers before they are used to recommend a mixer.',
  'air-system': 'Will the truck have a high-volume air system for the fiber chopper?',
};

export const CAVEAT_COPY: Record<CaveatId, string> = {
  provisional: 'This is a starting point. Paul confirms the machine and configuration on the written quote.',
  'published-rate': 'Published production is a machine rating. Actual placement depends on the mix, crew, feed equipment and material supply.',
  'reload-required': 'Plan for material replenishment and more than one discharge; the nominal bin does not hold the whole placement.',
  'range-quantity': 'The quantity is a range. Confirm the actual job quantity and usable yield before planning a single load.',
  'chassis-needed': 'A truck-mounted unit needs a suitable chassis. Paul will review that with you.',
  'latex-configuration': 'Paul must confirm the latex dosing configuration. A distinct polymer requirement needs its own review.',
  'chopper-air': 'The fiber chopper requires high-volume air. An additional truck air tank may be needed.',
  'sprayed-configuration': 'Paul must confirm the pump or gun/feed configuration. A mixer rating does not establish compatibility or shooting output.',
  'option-unconfirmed': 'The requested combination is not confirmed. An unlisted option is not automatically unavailable.',
  'rate-conflict': 'The quantity and placement window imply a higher rate than the rate entered. Confirm both with Paul.',
};

export const REASON_COPY: Record<ReasonId, string> = {
  'capacity-match': 'Its published bin covers the quantity entered for this comparison; usable yield still needs confirmation.',
  'rate-match': 'Its published production rating meets the placement-rate requirement entered.',
  'required-options': 'Required options were checked before comparing base machines.',
  'trailer-fit': 'This is the towable model.',
  'truck-fit': 'This is a truck-mounted model.',
  'reload-plan': 'The comparison assumes that the crew can replenish materials.',
};

const WORK: Record<string, string> = {
  'bridge-deck': 'For bridge work, the specified mix, dosing and placement window matter.',
  'rapid-set': 'For rapid-set work, separate the placement window from the lane-reopening deadline.',
  shotcrete: 'First distinguish wet-mix shotcrete from dry-mix gunite and confirm the feed setup.',
  municipal: 'For scattered stops, the biggest placement matters as well as the daily total.',
  mining: 'For remote work, material replenishment is part of the equipment discussion.',
  'small-pour': 'Driveways, sidewalks and patios can suit a smaller unit. The actual size decides.',
};
const POUR: Record<string, string> = {
  'under-5': 'That band can cross the smaller bin capacity. The actual quantity will help narrow it down.',
  '5-10': 'That band spans different bin sizes. The comparison will use its upper end.',
  '10-20': 'Some of that range exceeds a single bin. Paul will need the actual quantity and replenishment plan.',
  '20-40': 'That placement needs replenishment. The available placement time matters too.',
  '40-plus': 'That placement needs replenishment. Paul will review the placement rate and logistics.',
};
const WEEK: Record<string, string> = {
  '1-2': 'A light week. The job size, required options and placement pace still decide the fit.',
  '3-5': 'Weekly use helps Paul understand the operation; it does not establish peak placement rate.',
  '6-10': 'A busy week can still mean many small stops. The busiest placement is the useful comparison.',
  '10-plus': 'Frequent work does not automatically need the largest mixer. Check job size and placement pace.',
};
const CHASSIS: Record<string, string> = {
  yes: 'The current comparison will consider truck-mounted units. Paul confirms chassis suitability.',
  no: 'The towable remains available when it fits the work. A truck-mounted unit would need a chassis.',
  'not-sure': 'Both mounting approaches stay open. Paul can help you compare them.',
};

export function beatLine(kind: 'work' | 'pour' | 'week' | 'chassis', value: string): string {
  return (kind === 'work' ? WORK : kind === 'pour' ? POUR : kind === 'week' ? WEEK : CHASSIS)[value]
    ?? 'Paul can help confirm that detail.';
}

export function explainFit(result: FitResult): string {
  const primary = result.primaryId ? modelById(result.primaryId) : undefined;
  const alternate = result.alternateId ? modelById(result.alternateId) : undefined;
  const blocks: string[] = [];
  if (primary) {
    blocks.push(`A provisional starting point is the ${primary.name}.`);
    blocks.push(...result.reasonIds.filter((id) => id !== 'required-options').map((id) => REASON_COPY[id]));
    if (alternate) {
      blocks.push(`Compare it with the ${alternate.name}.`);
      if (primary.productionYd3Hr !== null && primary.productionYd3Hr === alternate.productionYd3Hr) {
        blocks.push(`Both publish ${primary.productionYd3Hr} yd³/hr; the alternate is not faster on that figure.`);
      }
      if (primary.binCapacityYd3 !== null && alternate.binCapacityYd3 !== null && primary.binCapacityYd3 !== alternate.binCapacityYd3) {
        blocks.push(`Published bins are ${primary.binCapacityYd3} yd³ and ${alternate.binCapacityYd3} yd³ respectively.`);
      }
    }
  } else blocks.push(result.status === 'configuration-review'
    ? 'This needs a configuration review with Paul before naming a machine.'
    : 'A few details will help narrow the machine down. Paul can help confirm the remaining details.');
  blocks.push(...result.questionIds.map((id) => QUESTION_COPY[id]));
  blocks.push(...result.caveatIds.map((id) => CAVEAT_COPY[id]));
  return blocks.join(' ');
}

/** Retained signature for the current page; the answers cannot change authoritative fit text. */
export function scriptedClose(_answers: GuideAnswers, result: FitResult): string {
  return explainFit(result);
}
