/**
 * StarMix configuration facts, separate from base machine specifications.
 * Unconfirmed compatibility is neither approval nor an exclusion.
 * Owner confirmations establish candidate eligibility, not final integration approval.
 */
import { models, modelById, type ModelId } from './models';

export const OPTIONS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rHeBfTZXonYS4VTIg8LlNDiCS9K-lQL8/edit#gid=1733816358';
export const MODELS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rHeBfTZXonYS4VTIg8LlNDiCS9K-lQL8/edit#gid=219888115';

/** One eligibility set for BOTH latex and fiber chopper; do not fork these rules. */
export const LARGE_MODEL_IDS: readonly ModelId[] = ['740-k', '750-l', '850-s', '880-s'];

export type OptionId =
  | 'additional-admix-high-flow'
  | 'additional-admix-low-flow'
  | 'fiber-feeder'
  | 'fiber-chopper'
  | 'powder-color'
  | 'latex-polymer'
  | 'cement-flyash-bin'
  | 'dcc';

export interface OptionEvidence {
  kind: 'sheet' | 'owner';
  reference: string;
  reviewedAt: string;
  url?: string;
}

export interface OptionAvailability {
  compatibility: 'supported' | 'unsupported' | 'unconfirmed';
  provision: 'standard' | 'optional' | 'special-addition' | 'unconfirmed';
  evidence: readonly OptionEvidence[];
}

export interface MixerOption {
  id: OptionId;
  name: string;
  facts: readonly { label: string; value: string }[];
  evidence: readonly OptionEvidence[];
  /** Scope matters: the latex confirmation does not establish distinct polymer setups. */
  qualification: string;
  prerequisites: readonly string[];
  modelAvailability?: Partial<Record<ModelId, OptionAvailability>>;
}

function sheet(reference: string, url = OPTIONS_SHEET_URL): OptionEvidence {
  return { kind: 'sheet', reference, url, reviewedAt: '2026-10-28' };
}

const owner: OptionEvidence = {
  kind: 'owner',
  reference: 'Owner clarification in Yardley planning conversation, October 28, 2026; recorded in docs/yardley-sources.md',
  reviewedAt: '2026-10-28',
};

const largeModelAvailability: Partial<Record<ModelId, OptionAvailability>> = {
  '327-k': { compatibility: 'unsupported', provision: 'unconfirmed', evidence: [owner] },
  '425-s': { compatibility: 'unsupported', provision: 'unconfirmed', evidence: [owner] },
};
for (const id of LARGE_MODEL_IDS) {
  largeModelAvailability[id] = { compatibility: 'supported', provision: 'optional', evidence: [owner] };
}

const dccEvidence = sheet('MODELS!R9,R11,R13,R15,R17', MODELS_SHEET_URL);
const dccAvailability: Partial<Record<ModelId, OptionAvailability>> = {};
// Standard controls are an independent sheet fact, not derived from latex eligibility.
for (const id of ['425-s', '740-k', '750-l', '850-s', '880-s'] as const) {
  dccAvailability[id] = { compatibility: 'supported', provision: 'standard', evidence: [dccEvidence] };
}

const additionalBinAvailability: Partial<Record<ModelId, OptionAvailability>> = {};
for (const model of models) {
  additionalBinAvailability[model.id] = { compatibility: 'supported', provision: 'special-addition', evidence: [owner] };
}

export const mixerOptions: readonly MixerOption[] = [
  {
    id: 'additional-admix-high-flow',
    name: 'Additional Admix High Flow',
    facts: [
      { label: 'Container material', value: 'poly' },
      { label: 'Container capacity', value: '20 gallons' },
      { label: 'Application rate flow', value: '0-100 (unit not stated)' },
    ],
    evidence: [sheet('OPTIONS!A4:G4')],
    qualification: 'Additional system; do not confuse with the base admix equipment. Confirm the dosing requirement and model configuration.',
    prerequisites: [],
  },
  {
    id: 'additional-admix-low-flow',
    name: 'Additional Admix Low Flow',
    facts: [
      { label: 'Container material', value: 'poly' },
      { label: 'Container capacity', value: '20 gallons' },
      { label: 'Application rate flow', value: '0-20 (unit not stated)' },
    ],
    evidence: [sheet('OPTIONS!A6:G6')],
    qualification: 'Additional system; confirm the dosing requirement and model configuration. The sheet does not state a flow unit.',
    prerequisites: [],
  },
  {
    id: 'fiber-feeder',
    name: 'Fiber Feeder System',
    facts: [{ label: 'Container capacity', value: '20 pounds' }],
    evidence: [sheet('OPTIONS!A8:E8')],
    qualification: 'Separate from the fiber chopper. Confirm the specified fiber and feeding configuration with Paul.',
    prerequisites: [],
  },
  {
    id: 'fiber-chopper',
    name: 'Fiber Chopper System',
    facts: [],
    evidence: [sheet('OPTIONS!A10'), owner],
    qualification: 'Paul confirms the final air-system and truck integration. No chopper capacity or rate is stated in the sheet.',
    prerequisites: ['Requires a high-volume air system.', 'An additional truck air tank may be required.'],
    modelAvailability: largeModelAvailability,
  },
  {
    id: 'powder-color',
    name: 'Powder Color System',
    facts: [{ label: 'Material', value: 'A-36 carbon steel with an epoxy coating' }],
    evidence: [sheet('OPTIONS!A12:C12')],
    qualification: 'Confirm the color specification and model configuration with Paul.',
    prerequisites: [],
  },
  {
    id: 'latex-polymer',
    name: 'Latex / Polymer',
    facts: [{ label: 'Container capacity', value: '1,000 liters' }],
    evidence: [sheet('OPTIONS!A14:E14'), owner],
    qualification: 'Model eligibility is confirmed for latex. Distinct polymer requirements and the final dosing configuration still need confirmation.',
    prerequisites: [],
    modelAvailability: largeModelAvailability,
  },
  {
    id: 'cement-flyash-bin',
    name: 'Cement/Flyash Bin',
    facts: [{ label: 'Container capacity', value: '1.5 tons' }],
    evidence: [sheet('OPTIONS!A16:E16'), owner],
    qualification: 'A special additional cement bin for any model, separate from the base cement hopper. Paul confirms the final integration.',
    prerequisites: [],
    modelAvailability: additionalBinAvailability,
  },
  {
    id: 'dcc',
    name: 'Data Control Commander',
    facts: [
      { label: 'Control type', value: 'Electronic/digital' },
      { label: 'Mix designs', value: 'Stores up to 200 mix designs' },
      { label: 'Calibration', value: 'Precision calibration with detailed production reporting' },
      { label: 'Monitoring', value: 'Real-time monitoring of material consumption' },
      { label: 'History', value: 'Complete usage history and traceability' },
      { label: 'Connectivity', value: 'Bluetooth connectivity' },
      { label: 'Tickets', value: 'Standardized production ticket printing' },
    ],
    evidence: [sheet('OPTIONS!A18:G22'), dccEvidence],
    qualification: 'Recorded as standard on the five truck models. The 327 K sheet records a digital counter; DCC availability there is unconfirmed.',
    prerequisites: [],
    modelAvailability: dccAvailability,
  },
];

export function optionById(id: string): MixerOption | undefined {
  return mixerOptions.find((option) => option.id === id);
}

/** Unknown IDs and combinations fail closed as unconfirmed; they never imply support. */
export function optionAvailability(optionId: string, modelId: string): OptionAvailability {
  if (!modelById(modelId)) return { compatibility: 'unconfirmed', provision: 'unconfirmed', evidence: [] };
  return optionById(optionId)?.modelAvailability?.[modelId as ModelId]
    ?? { compatibility: 'unconfirmed', provision: 'unconfirmed', evidence: [] };
}
