/** Shared, versioned job contract. No email or AI imports and no transcript storage. */
import { z } from 'zod';
import { applications } from './applications';
import { mixerOptions } from './options';
import { calculateVolume, volumeInputSchema } from '../lib/yardley/volume';

export const MIX_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'rapid-set', label: 'Rapid-set' },
  { value: 'latex-modified', label: 'Latex-modified' },
  { value: 'shotcrete-gunite', label: 'Shotcrete / gunite' },
  { value: 'fiber-reinforced', label: 'Fiber-reinforced' },
  { value: 'other', label: 'Other' },
] as const;
export type MixType = (typeof MIX_TYPES)[number]['value'];

/** A proposed answer is not a customer-confirmed input to fitting. */
function answer<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('state', [
    z.strictObject({ state: z.literal('unknown') }),
    z.strictObject({ state: z.literal('reported'), value }),
    z.strictObject({ state: z.literal('proposed'), value }),
  ]).default(() => ({ state: 'unknown' as const }));
}

export type Answer<T> = { state: 'unknown' } | { state: 'reported'; value: T } | { state: 'proposed'; value: T };
export function reported<T>(entry: Answer<T>): T | undefined {
  return entry.state === 'reported' ? entry.value : undefined;
}

const positive = z.number().positive();
const scope = z.enum(['placement', 'day', 'unknown']);
const unique = <T>(values: T[]) => new Set(values).size === values.length;
const mixSchema = z.enum(MIX_TYPES.map((entry) => entry.value));
const optionsSchema = z.enum(mixerOptions.map((entry) => entry.id));

export const legacyGuideSchema = z.strictObject({
  applicationSlug: z.enum(applications.map((app) => app.slug)),
  pourSizeYd3: z.enum(['under-5', '5-10', '10-20', '20-40', '40-plus']),
  poursPerWeek: z.enum(['1-2', '3-5', '6-10', '10-plus']),
  chassis: z.enum(['yes', 'no', 'not-sure']),
  mixTypes: z.array(mixSchema).max(MIX_TYPES.length).refine(unique).default(() => []),
});
const rangeQuantity = z.strictObject({
  kind: z.literal('range'),
  minYd3: z.number().nonnegative(),
  maxYd3: positive.optional(),
  scope,
}).refine((q) => q.maxYd3 === undefined || q.maxYd3 > q.minYd3, { message: 'The upper quantity must exceed the lower quantity.' });

const quantitySchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('unknown') }),
  z.strictObject({ kind: z.literal('reported'), yd3: positive, scope }),
  z.strictObject({ kind: z.literal('proposed'), yd3: positive, scope }),
  rangeQuantity,
  z.strictObject({ kind: z.literal('dimensions'), inputs: volumeInputSchema, scope }).refine(
    (q) => calculateVolume(q.inputs).ok, { message: 'Check the dimensions and units.' },
  ),
]).default(() => ({ kind: 'unknown' as const }));

export const yardleyJobSchema = z.strictObject({
  version: z.literal(1),
  workTypes: answer(z.array(z.enum(applications.map((app) => app.slug))).min(1).max(applications.length).refine(unique, 'Choose each work type once.')),
  subtype: answer(z.string().trim().min(1).max(200)),
  mixTypes: answer(z.array(mixSchema).min(1).max(MIX_TYPES.length).refine(unique, 'Choose each mix type once.')),
  mixSpecification: answer(z.string().trim().min(1).max(300)),
  process: answer(z.enum(['conventional', 'wet-shotcrete', 'dry-gunite'])),
  feedSetup: answer(z.string().trim().min(1).max(300)),
  highVolumeAir: answer(z.boolean()),
  requiredOptions: answer(z.array(optionsSchema).max(mixerOptions.length).refine(unique, 'Choose each option once.')),
  quantity: quantitySchema,
  placementWindowMinutes: answer(positive),
  requiredRateYd3Hr: answer(positive),
  replenishment: answer(z.enum(['yes', 'no'])),
  weeklyUse: answer(z.enum(['1-2', '3-5', '6-10', '10-plus'])),
  mounting: answer(z.enum(['trailer', 'truck', 'either'])),
  existingChassis: answer(z.boolean()),
  timeline: answer(z.enum(['immediate', '1-3-mo', '3-6-mo', 'researching'])),
  notes: z.string().trim().max(2000).default(''),
  openQuestions: z.array(z.string().trim().min(1).max(240)).max(12).default(() => []),
});

export type YardleyJob = z.infer<typeof yardleyJobSchema>;
export type JobQuantity = YardleyJob['quantity'];
export interface JobError { field: string; message: string }

export function parseYardleyJob(input: unknown):
  | { ok: true; job: YardleyJob }
  | { ok: false; errors: JobError[] } {
  const parsed = yardleyJobSchema.safeParse(input);
  return parsed.success ? { ok: true, job: parsed.data } : {
    ok: false,
    errors: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  };
}

export function emptyJob(): YardleyJob {
  return yardleyJobSchema.parse({ version: 1 });
}

/** Temporary adapter for the existing four-question page and legacy lead payload. */
export interface GuideAnswers {
  applicationSlug: string;
  pourSizeYd3: string;
  poursPerWeek: string;
  chassis: 'yes' | 'no' | 'not-sure';
  mixTypes: MixType[];
}

export function jobFromGuide(input: GuideAnswers): YardleyJob {
  const job = emptyJob();
  job.workTypes = { state: 'reported', value: [input.applicationSlug] };
  if (input.mixTypes.length) job.mixTypes = { state: 'reported', value: input.mixTypes };
  const bands: Record<string, { minYd3: number; maxYd3?: number }> = {
    'under-5': { minYd3: 0, maxYd3: 5 },
    '5-10': { minYd3: 5, maxYd3: 10 },
    '10-20': { minYd3: 10, maxYd3: 20 },
    '20-40': { minYd3: 20, maxYd3: 40 },
    '40-plus': { minYd3: 40 },
  };
  const band = bands[input.pourSizeYd3];
  if (band) job.quantity = { kind: 'range', ...band, scope: 'placement' };
  if (['1-2', '3-5', '6-10', '10-plus'].includes(input.poursPerWeek)) {
    job.weeklyUse = { state: 'reported', value: input.poursPerWeek as '1-2' | '3-5' | '6-10' | '10-plus' };
  }
  if (input.chassis === 'yes') {
    job.mounting = { state: 'reported', value: 'truck' };
    job.existingChassis = { state: 'reported', value: true };
  } else if (input.chassis === 'no') job.existingChassis = { state: 'reported', value: false };
  return yardleyJobSchema.parse(job);
}
