/** Scripted intake helpers. Text recognition proposes answers; it never confirms them. */
import { applications } from '../../data/applications';
import { MIX_TYPES, reported, parseYardleyJob, type YardleyJob, type MixType } from '../../data/yardley-job';
import { mixerOptions } from '../../data/options';
import { calculateVolume } from './volume';

export type IntakeStep = 'work' | 'detail' | 'mix' | 'process' | 'feed' | 'specification' | 'quantity' | 'pace' | 'replenishment' | 'setup' | 'options' | 'air';
export const STEP_TITLES: Record<IntakeStep, string> = {
  work: 'What will you build?', detail: 'A little more about the work.', mix: 'What mix does the work call for?',
  process: 'Wet shotcrete or dry gunite?', feed: 'What feeds the nozzle?', specification: 'What does the mix specification say?',
  quantity: 'How much at the biggest placement?', pace: 'How quickly does it need to go down?',
  replenishment: 'Can you replenish materials?', setup: 'How will the operation run?', options: 'Anything the machine needs to carry?', air: 'What about air for the chopper?',
};

export function nextStep(job: YardleyJob, skipped: ReadonlySet<IntakeStep>): IntakeStep | undefined {
  const sprayed = reported(job.mixTypes)?.includes('shotcrete-gunite');
  const checks: [IntakeStep, boolean][] = [
    ['work', !reported(job.workTypes)], ['detail', !!reported(job.workTypes) && !reported(job.subtype)], ['mix', !reported(job.mixTypes)],
    ['process', !!sprayed && !reported(job.process)], ['feed', !!sprayed && !reported(job.feedSetup)],
    ['specification', !!reported(job.mixTypes)?.includes('other') && !reported(job.mixSpecification)],
    ['quantity', job.quantity.kind === 'unknown' || ('scope' in job.quantity && job.quantity.scope !== 'placement')],
    ['pace', !reported(job.placementWindowMinutes) && !reported(job.requiredRateYd3Hr)],
    ['replenishment', !reported(job.replenishment)],
    ['setup', !reported(job.mounting) || !reported(job.weeklyUse) || !reported(job.timeline)],
    ['options', job.requiredOptions.state === 'unknown'],
    ['air', !!reported(job.requiredOptions)?.includes('fiber-chopper') && reported(job.highVolumeAir) === undefined],
  ];
  return checks.find(([step, missing]) => missing && !skipped.has(step))?.[0];
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
export const formatQuantity = (value: number) => numberFormat.format(value);
export function quantityLabel(job: YardleyJob): string {
  const q = job.quantity;
  if (q.kind === 'unknown') return 'Not sure yet';
  const scope = q.scope === 'placement' ? ' / placement' : q.scope === 'day' ? ' / day' : ' · scope to confirm';
  if (q.kind === 'dimensions') {
    const result = calculateVolume(q.inputs);
    return result.ok ? `≈ ${formatQuantity(result.estimate.yd3)} yd³${scope} · calculated` : 'Dimensions to check';
  }
  if (q.kind === 'range') return `${formatQuantity(q.minYd3)}–${q.maxYd3 === undefined ? 'plus' : formatQuantity(q.maxYd3)} yd³${scope}`;
  return `${formatQuantity(q.yd3)} yd³${scope}${q.kind === 'proposed' ? ' · confirm' : ''}`;
}

export interface SummaryRow { label: string; value: string; step: IntakeStep }
const label = (answer: { state: string; value?: unknown }, labels?: Record<string, string>): string =>
  answer.state === 'reported' ? labels?.[String(answer.value)] ?? String(answer.value) : 'Not sure yet';
export function summaryRows(job: YardleyJob): SummaryRow[] {
  return [
    { label: 'Work', value: reported(job.workTypes)?.map((id) => applications.find((a) => a.slug === id)?.title).join(', ') || 'Not sure yet', step: 'work' },
    { label: 'Job detail', value: label(job.subtype), step: 'detail' },
    { label: 'Mix', value: reported(job.mixTypes)?.map((id) => MIX_TYPES.find((m) => m.value === id)?.label).join(', ') || 'Not sure yet', step: 'mix' },
    ...(reported(job.mixTypes)?.includes('shotcrete-gunite') ? [
      { label: 'Process', value: label(job.process, { 'wet-shotcrete': 'Wet-mix shotcrete', 'dry-gunite': 'Dry-mix gunite', conventional: 'Conventional' }), step: 'process' as const },
      { label: 'Feed equipment', value: label(job.feedSetup), step: 'feed' as const },
    ] : []),
    ...(reported(job.mixTypes)?.includes('other') ? [{ label: 'Mix specification', value: label(job.mixSpecification), step: 'specification' as const }] : []),
    { label: 'Quantity', value: quantityLabel(job), step: 'quantity' },
    ...(job.quantity.kind === 'dimensions' ? [{ label: 'Dimensions', value: job.quantity.inputs.shape === 'slab'
      ? `${job.quantity.inputs.lengthFt} ft × ${job.quantity.inputs.widthFt} ft × ${job.quantity.inputs.thicknessIn} in specified thickness`
      : job.quantity.inputs.shape === 'area-depth' ? `${job.quantity.inputs.areaFt2} ft² × ${job.quantity.inputs.thicknessIn} in specified depth`
        : `${job.quantity.inputs.lengthFt} ft × ${job.quantity.inputs.crossSectionFt2} ft² cross section`, step: 'quantity' as const }] : []),
    { label: 'Placement pace', value: [reported(job.placementWindowMinutes) ? `${reported(job.placementWindowMinutes)} minutes` : '', reported(job.requiredRateYd3Hr) ? `${reported(job.requiredRateYd3Hr)} yd³/hr required` : ''].filter(Boolean).join(' · ') || 'Not sure yet', step: 'pace' },
    { label: 'Replenishment', value: label(job.replenishment, { yes: 'Available', no: 'Not available' }), step: 'replenishment' },
    { label: 'Mount', value: label(job.mounting, { either: 'Either approach', trailer: 'Towable', truck: 'Truck-mounted' }), step: 'setup' },
    { label: 'Existing chassis', value: label(job.existingChassis, { true: 'Yes · suitability to review', false: 'No' }), step: 'setup' },
    { label: 'Weekly use', value: label(job.weeklyUse, { '1-2': '1–2 placements', '3-5': '3–5 placements', '6-10': '6–10 placements', '10-plus': 'More than 10 placements' }), step: 'setup' },
    { label: 'Timeline', value: label(job.timeline, { immediate: 'As soon as practical', '1-3-mo': '1–3 months', '3-6-mo': '3–6 months', researching: 'Researching' }), step: 'setup' },
    { label: 'Required options', value: reported(job.requiredOptions)?.map((id) => mixerOptions.find((o) => o.id === id)?.name).join(', ') || (job.requiredOptions.state === 'reported' ? 'None specified' : 'To discuss'), step: 'options' },
    ...(reported(job.requiredOptions)?.includes('fiber-chopper') ? [{ label: 'High-volume air', value: label(job.highVolumeAir, { true: 'Available · integration to review', false: 'Not available' }), step: 'air' as const }] : []),
  ];
}

export type JobPatch = Partial<YardleyJob>;
/** Keep a supplied daily total in the brief when the visitor adds peak placement quantity. */
export function applyJobPatch(job: YardleyJob, patch: JobPatch): ReturnType<typeof parseYardleyJob> {
  let notes = patch.notes ?? job.notes;
  if (job.quantity.kind !== 'unknown' && job.quantity.scope === 'day' && patch.quantity && patch.quantity.kind !== 'unknown' && patch.quantity.scope === 'placement') {
    const dailyNote = `Daily total previously supplied: ${quantityLabel(job)}.`;
    if (!notes.includes(dailyNote)) notes = [notes, dailyNote].filter(Boolean).join('\n');
  }
  return parseYardleyJob({ ...job, ...patch, notes });
}
/** Bounded convenience recognition, not a substitute for the stage-4 conversation service. */
export function proposeFromText(text: string, step?: IntakeStep): JobPatch {
  if (!text.trim() || text.length > 2000) return {};
  const s = text.toLowerCase();
  // Do not turn negated, hypothetical or ambiguous comparisons into requirements.
  if (/\b(no|not|never|avoid|exclude|except|without|don['’]?t|isn['’]?t|doesn['’]?t|maybe|might|if|or|versus|vs)\b|instead of|\?/.test(s)) return {};
  const patch: JobPatch = {};
  const work: string[] = [];
  if (/\b(bridge|overlay)\b/.test(s)) work.push('bridge-deck');
  if (/\b(rapid[ -]?set|fast[ -]?set|lane[ -]return)\b/.test(s)) work.push('rapid-set');
  if (/\b(pool|pools|shotcrete|gunite|slope|slopes)\b/.test(s)) work.push('shotcrete');
  if (/\b(municipal|curbs?|city maintenance)\b/.test(s)) work.push('municipal');
  if (/\b(mining|mine|remote site)\b/.test(s)) work.push('mining');
  if (/\b(driveways?|sidewalks?|patios?|small pours?)\b/.test(s)) work.push('small-pour');
  if (work.length) patch.workTypes = { state: 'proposed', value: work };
  const mixes: MixType[] = [];
  if (/\b(standard|conventional|regular concrete)\b/.test(s)) mixes.push('standard');
  if (/\b(rapid[ -]?set|fast[ -]?set)\b/.test(s)) mixes.push('rapid-set');
  if (/\blatex\b/.test(s)) mixes.push('latex-modified');
  if (/\b(shotcrete|gunite)\b/.test(s)) mixes.push('shotcrete-gunite');
  if (/\bfiber[ -]reinforced\b/.test(s)) mixes.push('fiber-reinforced');
  if (mixes.length) patch.mixTypes = { state: 'proposed', value: mixes };
  if (/\bwet[ -](mix|shotcrete)\b/.test(s)) patch.process = { state: 'proposed', value: 'wet-shotcrete' };
  if (/\bdry[ -](mix|gunite)\b/.test(s)) patch.process = { state: 'proposed', value: 'dry-gunite' };
  const quantities = [...s.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:cubic\s*(?:yards?|yds?)|yd(?:s|³|3)?|yards?)\b/g)];
  if (quantities.length === 1 && !/\d\s*(?:-|–|to)\s*\d|\b(between|about|around|roughly|up to)\b/.test(s)) {
    const yd3 = Number(quantities[0][1]);
    if (yd3 > 0) {
      if (/\b(per hour|an hour|hourly)\b|\/\s*(?:hr|hour)\b/.test(s)) patch.requiredRateYd3Hr = { state: 'proposed', value: yd3 };
      else patch.quantity = { kind: 'proposed', yd3, scope: /\b(per day|a day|daily)\b/.test(s) ? 'day' : /\b(per placement|per pour|each pour|single placement|at each stop)\b/.test(s) ? 'placement' : 'unknown' };
    }
  }
  if (/\b(trailer|towable)\b/.test(s)) patch.mounting = { state: 'proposed', value: 'trailer' };
  else if (/\btruck[ -]mounted\b/.test(s)) patch.mounting = { state: 'proposed', value: 'truck' };
  if (step === 'detail' && !Object.keys(patch).length && text.trim().length <= 200) patch.subtype = { state: 'proposed', value: text.trim() };
  if (step === 'feed' && text.trim().length <= 300) patch.feedSetup = { state: 'proposed', value: text.trim() };
  if (step === 'specification' && text.trim().length <= 300) patch.mixSpecification = { state: 'proposed', value: text.trim() };
  return patch;
}

export function confirmPatch(job: YardleyJob, patch: JobPatch): YardleyJob | undefined {
  const confirmed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && 'state' in value && value.state === 'proposed') confirmed[key] = { ...value, state: 'reported' };
    else if (key === 'quantity' && value && typeof value === 'object' && 'kind' in value && value.kind === 'proposed') confirmed[key] = { ...value, kind: 'reported' };
    else confirmed[key] = value;
  }
  const result = applyJobPatch(job, confirmed);
  return result.ok ? result.job : undefined;
}
