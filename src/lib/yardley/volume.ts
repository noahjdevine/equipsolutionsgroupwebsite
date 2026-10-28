import { z } from 'zod';

const positive = z.number().positive();

/** Customer job geometry only. These units never convert manufacturer specifications. */
export const volumeInputSchema = z.discriminatedUnion('shape', [
  z.strictObject({ shape: z.literal('slab'), lengthFt: positive, widthFt: positive, thicknessIn: positive }),
  z.strictObject({ shape: z.literal('area-depth'), areaFt2: positive, thicknessIn: positive }),
  z.strictObject({ shape: z.literal('prism'), lengthFt: positive, crossSectionFt2: positive }),
]);

export type VolumeInput = z.infer<typeof volumeInputSchema>;
export interface VolumeEstimate {
  yd3: number;
  inputs: VolumeInput;
  provenance: 'calculated';
  label: 'Estimate from your dimensions';
  formula: string;
}

export function calculateVolume(input: unknown):
  | { ok: true; estimate: VolumeEstimate }
  | { ok: false; errors: { field: string; message: string }[] } {
  const parsed = volumeInputSchema.safeParse(input);
  if (!parsed.success) return {
    ok: false,
    errors: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  };
  const dimensions = parsed.data;
  const yd3 = dimensions.shape === 'slab'
    ? dimensions.lengthFt * dimensions.widthFt * dimensions.thicknessIn / 324
    : dimensions.shape === 'area-depth'
      ? dimensions.areaFt2 * dimensions.thicknessIn / 324
      : dimensions.lengthFt * dimensions.crossSectionFt2 / 27;
  if (!Number.isFinite(yd3) || yd3 <= 0) return {
    ok: false, errors: [{ field: 'dimensions', message: 'These dimensions do not produce a usable estimate. Check the values and units.' }],
  };
  return {
    ok: true,
    estimate: {
      yd3, inputs: dimensions, provenance: 'calculated', label: 'Estimate from your dimensions',
      formula: dimensions.shape === 'slab' ? 'lengthFt × widthFt × thicknessIn / 324'
        : dimensions.shape === 'area-depth' ? 'areaFt2 × thicknessIn / 324' : 'lengthFt × crossSectionFt2 / 27',
    },
  };
}
