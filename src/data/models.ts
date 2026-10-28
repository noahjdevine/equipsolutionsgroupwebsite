/**
 * StarMix lineup — single source of truth.
 *
 * Published bin and production figures: starmixindustries.com US pages only.
 * Do not invent, convert, or interpolate. Spanish-side 880 S figures
 * (8 m³ / 80 m³/hr) are not used on this site.
 *
 * Paul's spec sheet adds mount and base-equipment lines.
 * The 740 K now publishes 10 yd³ / 60 yd³/hr on its US page.
 * Where the sheet disagrees with a published figure, the published figure stays:
 *   327 K — site 4 yd³ and 30 yd³/hr; sheet 3.2 yd and 27.3 yd³/hr.
 *   425 S — site 30 yd³/hr; sheet 27.3. Bin agrees at 5.5 yd³.
 * Sand and stone columns on the sheet are a 40/60 mix split, not bin sizes.
 * They are not stored here and must not be used to rank a model.
 */

export type Mount = 'trailer' | 'truck';
export type ModelId = '880-s' | '850-s' | '750-l' | '425-s' | '327-k' | '740-k';

export const MODEL_REVIEWED_AT = '2026-10-28';
export const US_LINEUP_URL = 'https://starmixindustries.com/';

export interface ModelSource {
  specificationsUrl: string;
  lineupUrl: string;
  reviewedAt: string;
  notes: string[];
}

export interface ModelImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  sourceUrl: string;
}

export type SeriesId = 'S' | 'L' | 'K';

export interface SeriesInfo {
  id: SeriesId;
  /** Manufacturer's own framing. */
  blurb: string;
}

export interface ModelComponents {
  waterTank?: string;
  cementHopper?: string;
  notes?: string[];
}

export interface Model {
  id: ModelId;
  name: string;
  series: SeriesId;
  /** Published US-page figure. Null when the factory page did not state one. */
  binCapacityYd3: number | null;
  /** Published US-page figure. Null when the factory page did not state one. */
  productionYd3Hr: number | null;
  /** Paul's sheet. Trailer or truck-mounted. */
  mount: Mount;
  /** Distinguishes the offered 327 K Towable from the manufacturer's Mobile variant. */
  variant: 'towable' | 'truck-mounted';
  source: ModelSource;
  image: ModelImage;
  /** One line from the sheet: admix, DCC, engine. Not used to rank. */
  options: string;
  components?: ModelComponents;
}

export interface Claim {
  id: string;
  /** Short figure for the stats strip, when one exists. */
  figure?: string;
  unit?: string;
  label: string;
}

export const series: Record<SeriesId, SeriesInfo> = {
  S: {
    id: 'S',
    blurb: 'The premium line. Structural excellence, maximum reliability.',
  },
  L: {
    id: 'L',
    blurb: 'Functionality-focused, medium-to-high volume producers. Inherits S-series strengths; monolithic structure, conventional components.',
  },
  K: {
    id: 'K',
    blurb: 'Lowest investment cost while retaining Starmix strength and ease of operation.',
  },
};

function source(page: string, notes: string[] = []): ModelSource {
  return {
    specificationsUrl: `https://starmixindustries.com/${page}`,
    lineupUrl: US_LINEUP_URL,
    reviewedAt: MODEL_REVIEWED_AT,
    notes,
  };
}

function image(id: ModelId, filename: string, alt: string): ModelImage {
  return {
    src: `/assets/img/starmix/${id}.webp`,
    width: id === '750-l' ? 523 : 484,
    height: 400,
    alt,
    sourceUrl: `https://starmixindustries.com/img/maquinas/${filename}`,
  };
}

export const models: Model[] = [
  {
    id: '880-s',
    name: '880 S',
    series: 'S',
    binCapacityYd3: 11,
    productionYd3Hr: 90,
    mount: 'truck',
    variant: 'truck-mounted',
    source: source('880s', ['Use the US 90 yd³/hr figure; do not convert conflicting metric production copy.']),
    image: image('880-s', '880s.webp', 'StarMix 880 S mixer mounted on a truck'),
    options: 'High and low flow admix, DCC',
    components: {
      waterTank: '3,000 L metal tank, anti-fungal interior coating',
      cementHopper: '3.5 t',
      notes: ['KNAPPCO metal lids'],
    },
  },
  {
    id: '850-s',
    name: '850 S',
    series: 'S',
    binCapacityYd3: 11,
    productionYd3Hr: 60,
    mount: 'truck',
    variant: 'truck-mounted',
    source: source('850s'),
    image: image('850-s', '850-s.webp', 'StarMix 850 S mixer mounted on a truck'),
    options: 'High and low flow admix, DCC',
    components: {
      waterTank: '3,000 L metal tank, anti-fungal interior coating',
      cementHopper: '3.5 Ton',
      notes: ['KNAPPCO metal lids', 'Hydraulic cooler panel with fan'],
    },
  },
  {
    id: '750-l',
    name: '750 L',
    series: 'L',
    binCapacityYd3: 10,
    productionYd3Hr: 60,
    mount: 'truck',
    variant: 'truck-mounted',
    source: source('750l'),
    image: image('750-l', 'seriel2.webp', 'StarMix 750 L mixer mounted on a truck'),
    options: 'High and low flow admix, DCC',
    components: {
      waterTank: '2,000 L polypropylene',
      cementHopper: '3.5 t',
      notes: ['Hydraulic cooler panel with fan'],
    },
  },
  {
    id: '425-s',
    name: '425 S',
    series: 'S',
    binCapacityYd3: 5.5,
    productionYd3Hr: 30,
    mount: 'truck',
    variant: 'truck-mounted',
    source: source('425s', ['US lineup rate is 30 yd³/hr; detail copy says 32.7 and MODELS!E9 says 27.3. Keep 30 pending clarification.']),
    image: image('425-s', '425-s.png', 'StarMix 425 S mixer mounted on a truck'),
    options: 'High and low flow admix, DCC',
    components: {
      waterTank: '2,000 L metal tank, anti-fungal interior coating',
      cementHopper: '2 Ton',
      notes: ['KNAPPCO metal lids', 'Hydraulic cooler panel with fan'],
    },
  },
  {
    id: '327-k',
    name: '327 K',
    series: 'K',
    binCapacityYd3: 4,
    productionYd3Hr: 30,
    mount: 'trailer',
    variant: 'towable',
    source: source('327ktowable', ['Towable variant only. Use US lineup 4 yd³ / 30 yd³/hr; MODELS!G7/E7 differ. Do not convert metric detail copy.']),
    image: image('327-k', '327-k-remolcable.webp', 'StarMix 327 K Towable mixer on its trailer frame'),
    options: 'Perkins diesel engine, digital counter',
  },
  {
    id: '740-k',
    name: '740 K',
    series: 'K',
    binCapacityYd3: 10,
    productionYd3Hr: 60,
    mount: 'truck',
    variant: 'truck-mounted',
    source: source('740k', ['US website supersedes the old 9–10 yd³ sheet range. Water tank is polyethylene on the website.']),
    image: image('740-k', '740-k.png', 'StarMix 740 K mixer mounted on a truck'),
    options: 'High flow admix, DCC',
    components: {
      waterTank: '2,000 L polyethylene',
    },
  },
];

export const claims: Claim[] = [
  { id: 'mix-time', figure: '7', unit: 'sec', label: 'to produce mixed concrete' },
  { id: 'full-range', label: 'Handles the full range from completely dry to self-compacting, any aggregate characteristic' },
  { id: 'mix-change', label: 'Multiple mix designs per load — formulation adjustment takes 4 minutes' },
  { id: 'cascade-feed', label: 'Hoppers reload mid-production without compromising dosing precision (cascade feed)' },
  { id: 'wash', label: 'Washes with under 100 liters of water' },
  { id: 'emissions', label: '47%+ reduction in emissions vs. conventional' },
];

const publishedBins = models.map((m) => m.binCapacityYd3).filter((n): n is number => n != null);
const publishedRates = models.map((m) => m.productionYd3Hr).filter((n): n is number => n != null);

export const lineup = {
  modelCount: models.length,
  seriesCount: new Set(models.map((m) => m.series)).size,
  largestBinYd3: Math.max(...publishedBins),
  peakProductionYd3Hr: Math.max(...publishedRates),
} as const;

export const mixTimeClaim = claims.find((c) => c.id === 'mix-time')!;

/** Shared display: only published US specifications. */
export function binDisplay(model: Model): string {
  if (model.binCapacityYd3 != null) return `${model.binCapacityYd3} yd³`;
  return 'Not published';
}

export function productionDisplay(model: Model): string {
  if (model.productionYd3Hr != null) return `Up to ${model.productionYd3Hr} yd³/hr`;
  return 'Not published';
}

export function mountLabel(model: Model): string {
  return model.mount === 'trailer' ? 'Trailer' : 'Truck-mounted';
}

export function modelById(id: string): Model | undefined {
  return models.find((model) => model.id === id);
}
