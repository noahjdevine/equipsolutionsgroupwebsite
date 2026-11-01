/** Reviewed answers. The model selects IDs; it cannot write specifications or commercial claims. */
import { models, modelById, binDisplay, productionDisplay, mountLabel, type ModelId } from './models';
import { LARGE_MODEL_IDS, optionById, OPTIONS_SHEET_URL } from './options';

export const FACT_IDS = ['bin-rate', 'slab-quantity', 'pool-quantity', 'wet-dry', 'latex', 'chopper', 'feeder', 'additional-bin', 'dcc', 'rapid-set', 'replenishment', 'quote', 'paul', 'fit-reasons'] as const;
export type FactId = typeof FACT_IDS[number];
export interface KnowledgeFact { id: FactId; title: string; text: string; sources: { title: string; url: string }[] }
const website = { title: 'StarMix US lineup', url: 'https://starmixindustries.com/' };
const configuration = { title: 'Owner-confirmed configuration · October 28, 2026', url: '' };
const largeNames = LARGE_MODEL_IDS.map((id) => modelById(id)!.name).join(', ');
const extraBin = optionById('cement-flyash-bin')!;

export const knowledge: Record<Exclude<FactId, 'fit-reasons'>, KnowledgeFact> = {
  'bin-rate': { id: 'bin-rate', title: 'Capacity versus pace', text: 'Bin capacity describes material carried. Production describes how quickly the machine can mix. Actual placement also depends on the mix, crew, feed equipment and material supply. A busy week alone does not establish the required placement rate.', sources: [website] },
  'slab-quantity': { id: 'slab-quantity', title: 'Work out the yardage', text: 'For a rectangular slab, give the length and width in feet and the specified thickness in inches. I can estimate from those dimensions. If thickness is unknown, we’ll leave the estimate open. No thickness or waste allowance is assumed.', sources: [] },
  'pool-quantity': { id: 'pool-quantity', title: 'Pool shells', text: 'Use the plan material quantity for a pool shell. Water volume or outside pool dimensions cannot establish the shell material needed. What do you know about the pump or gun and feed arrangement?', sources: [] },
  'wet-dry': { id: 'wet-dry', title: 'Wet shotcrete and dry gunite', text: 'First confirm whether the crew uses wet-mix shotcrete or dry-mix gunite, then the pump or gun/feed setup. A published mixer rating does not certify that equipment combination or its shooting output. Dry-gunite work needs Paul’s configuration review before naming a machine.', sources: [configuration] },
  latex: { id: 'latex', title: 'Latex configuration', text: `The eligible latex base models are ${largeNames}. That requirement applies even to a small placement. Paul confirms the latex dosing configuration; a distinct polymer requirement needs its own review.`, sources: [configuration] },
  chopper: { id: 'chopper', title: 'Fiber chopper', text: `The fiber chopper uses the same eligible base models as latex: ${largeNames}. It requires high-volume air; an additional truck air tank may be needed. Paul must review the final setup.`, sources: [configuration] },
  feeder: { id: 'feeder', title: 'Fiber feeder', text: 'A fiber feeder is a separate option from the fiber chopper. The chopper’s model exclusions do not establish feeder compatibility. Paul needs to confirm the feeder and machine combination.', sources: [{ title: 'StarMix options sheet', url: OPTIONS_SHEET_URL }] },
  'additional-bin': { id: 'additional-bin', title: 'Additional cement / flyash bin', text: `${extraBin.name} is a special addition available for any base model. It is not standard equipment and does not increase the published aggregate-bin capacity. Final truck or trailer integration needs review.`, sources: [{ title: 'StarMix options sheet', url: OPTIONS_SHEET_URL }] },
  dcc: { id: 'dcc', title: 'Controls', text: 'DCC is recorded as standard on the five truck-mounted models. The towable 327 K has separately recorded controls; DCC compatibility there needs confirmation. Do not count standard equipment as an extra.', sources: [{ title: 'StarMix options sheet', url: OPTIONS_SHEET_URL }] },
  'rapid-set': { id: 'rapid-set', title: 'Rapid-set placement', text: 'For rapid-set work, the time available to place the material is different from the lane-reopening deadline. Tell me the placement quantity, placement window and replenishment plan. A small repair does not automatically require the largest machine.', sources: [configuration] },
  replenishment: { id: 'replenishment', title: 'More than one discharge', text: 'A placement larger than one nominal bin needs a replenishment plan and more than one discharge. Can the crew top up aggregates, cement and water on site or between discharges? Keep the largest placement separate from the daily total.', sources: [website] },
  quote: { id: 'quote', title: 'Pricing, availability and coverage', text: 'Paul confirms price, availability, lead time, chassis suitability and final configuration on the written quote. I don’t have a verified price list, delivery commitment or coverage area to give you.', sources: [] },
  paul: { id: 'paul', title: 'The final call', text: 'I help prepare the job details and a provisional comparison. Paul makes the final equipment recommendation after talking with you. He can help even if you don’t know the yardage or exact mix yet. Sales and support are also available in Spanish.', sources: [] },
};

export function mentionedModels(text: string): ModelId[] {
  return models.filter((model) => {
    const [number, series] = model.id.split('-');
    return new RegExp(`\\b${number}[\\s-]*${series}\\b`, 'i').test(text);
  }).map((model) => model.id);
}

export function compareModels(ids: ModelId[]): KnowledgeFact | undefined {
  const selected = [...new Set(ids)].slice(0, 2).map((id) => modelById(id)!);
  if (!selected.length) return;
  let text = selected.map((model) => `${model.name}: ${binDisplay(model)} bin, ${productionDisplay(model)}, ${mountLabel(model).toLowerCase()}.`).join(' ');
  if (selected.length === 2 && selected[0].productionYd3Hr === selected[1].productionYd3Hr) text += ' Their published production rates match; the second machine is not faster on that figure.';
  text += ' Paul confirms the build, usable yield, options and suitability for your work.';
  return { id: 'bin-rate', title: 'Published model comparison', text, sources: selected.map((model) => ({ title: `${model.name} US specifications`, url: model.source.specificationsUrl })) };
}

/** Reviewed fallback answers also work when the model is unavailable or over budget. */
export function matchingFacts(text: string): FactId[] {
  const s = text.toLowerCase();
  const facts: FactId[] = [];
  if (/price|cost|lead.?time|deliver|available|availability|coverage|territory|certif/.test(s)) facts.push('quote');
  if (/fiber.*chop|chop.*fiber/.test(s)) facts.push('chopper');
  else if (/fiber.*feed|feed.*fiber/.test(s)) facts.push('feeder');
  if (/latex|polymer/.test(s)) facts.push('latex');
  if (/fly.?ash|extra.*cement|additional.*bin|flash.*bin/.test(s)) facts.push('additional-bin');
  if (/\bdcc\b|control/.test(s)) facts.push('dcc');
  if (/gunite|shotcrete|wet.mix|dry.mix/.test(s)) facts.push('wet-dry');
  if (/pool/.test(s)) facts.push('pool-quantity');
  if (/rapid.set|fast.set|lane.*reopen/.test(s)) facts.push('rapid-set');
  if (/reload|replenish/.test(s)) facts.push('replenishment');
  if (/estimat|dimensions|thickness|\byardage\b/.test(s)) facts.push('slab-quantity');
  if (/bin|capacity|production|rate/.test(s)) facts.push('bin-rate');
  return [...new Set(facts)].slice(0, 2);
}
