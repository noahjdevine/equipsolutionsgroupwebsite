/** Browser/server contract. No SDK, credentials or server imports. */
import { z } from 'zod';
import { yardleyJobSchema } from './yardley-job';
import { FACT_IDS } from './knowledge';
import { models } from './models';
import { STEP_TITLES } from '../lib/yardley/intake';
import { volumeInputSchema } from '../lib/yardley/volume';

export const INTAKE_STEPS = Object.keys(STEP_TITLES) as [keyof typeof STEP_TITLES, ...(keyof typeof STEP_TITLES)[]];
export const conversationInputSchema = z.strictObject({
  version: z.literal(2),
  requestId: z.string().uuid(),
  job: yardleyJobSchema,
  message: z.string().trim().min(1).max(2000),
  history: z.array(z.strictObject({ role: z.enum(['user', 'assistant']), text: z.string().max(900) })).max(6),
  skipped: z.array(z.enum(INTAKE_STEPS)).max(INTAKE_STEPS.length),
  step: z.enum(INTAKE_STEPS).nullable(),
});
export type ConversationInput = z.infer<typeof conversationInputSchema>;

// Unwrap default() before partial(): omitted updates must never become unknown answers.
export const proposalSchema = z.strictObject({
  workTypes: yardleyJobSchema.shape.workTypes.unwrap().optional(),
  subtype: yardleyJobSchema.shape.subtype.unwrap().optional(),
  mixTypes: yardleyJobSchema.shape.mixTypes.unwrap().optional(),
  mixSpecification: yardleyJobSchema.shape.mixSpecification.unwrap().optional(),
  process: yardleyJobSchema.shape.process.unwrap().optional(),
  feedSetup: yardleyJobSchema.shape.feedSetup.unwrap().optional(),
  highVolumeAir: yardleyJobSchema.shape.highVolumeAir.unwrap().optional(),
  requiredOptions: yardleyJobSchema.shape.requiredOptions.unwrap().optional(),
  quantity: yardleyJobSchema.shape.quantity.unwrap().optional(),
  placementWindowMinutes: yardleyJobSchema.shape.placementWindowMinutes.unwrap().optional(),
  requiredRateYd3Hr: yardleyJobSchema.shape.requiredRateYd3Hr.unwrap().optional(),
  replenishment: yardleyJobSchema.shape.replenishment.unwrap().optional(),
  weeklyUse: yardleyJobSchema.shape.weeklyUse.unwrap().optional(),
  mounting: yardleyJobSchema.shape.mounting.unwrap().optional(),
  existingChassis: yardleyJobSchema.shape.existingChassis.unwrap().optional(),
  timeline: yardleyJobSchema.shape.timeline.unwrap().optional(),
});
export const UPDATE_FIELDS = Object.keys(proposalSchema.shape) as (keyof typeof proposalSchema.shape)[];
// Structured-output providers require every object property; nullable max represents an open range.
const modelQuantitySchema = z.union([
  z.strictObject({ kind: z.literal('unknown') }),
  z.strictObject({ kind: z.enum(['reported', 'proposed']), yd3: z.number().positive(), scope: z.enum(['placement', 'day', 'unknown']) }),
  z.strictObject({ kind: z.literal('range'), minYd3: z.number().nonnegative(), maxYd3: z.number().positive().nullable(), scope: z.enum(['placement', 'day', 'unknown']) }),
  z.strictObject({ kind: z.literal('dimensions'), inputs: z.union(volumeInputSchema.options), scope: z.enum(['placement', 'day', 'unknown']) }),
]);
const updateSchemas = UPDATE_FIELDS.map((field) => z.strictObject({
  field: z.literal(field), evidence: z.string().trim().min(1).max(400),
  // OpenAI structured output accepts anyOf, not Zod 4's oneOf for discriminated unions.
  value: field === 'quantity' ? modelQuantitySchema : z.union(yardleyJobSchema.shape[field].unwrap().options),
}));
export const conversationPlanSchema = z.strictObject({
  acknowledgement: z.enum(['start', 'details', 'question', 'uncertain', 'paul', 'off-topic']),
  facts: z.array(z.enum(FACT_IDS)).max(3),
  comparisons: z.array(z.enum(models.map((model) => model.id))).max(2),
  question: z.enum(INTAKE_STEPS).nullable(),
  updates: z.array(z.union(updateSchemas)).max(12),
});
export type ConversationPlan = z.infer<typeof conversationPlanSchema>;
export const conversationResponseSchema = z.strictObject({
  version: z.literal(2), requestId: z.string().uuid(),
  mode: z.enum(['ai', 'guided']),
  reason: z.enum(['ok', 'not-configured', 'budget', 'rate-limit', 'timeout', 'provider', 'invalid-output', 'canceled', 'session-limit', 'context-limit']),
  reply: z.string().max(5000),
  proposal: proposalSchema,
  question: z.enum(INTAKE_STEPS).nullable(),
  sources: z.array(z.strictObject({ title: z.string().max(120), url: z.string().max(500) })).max(6),
  saveMessage: z.boolean(),
});
export type ConversationResponse = z.infer<typeof conversationResponseSchema>;
