/**
 * StarMix lineup — single source of truth.
 * Figures from starmixindustries.com US pages only. Do not invent, convert, or interpolate.
 * Spanish-side 880 S figures (8 m³ / 80 m³/hr) are not used on this site.
 */

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
  id: string;
  name: string;
  series: SeriesId;
  binCapacityYd3: number | null;
  productionYd3Hr: number | null;
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

export const models: Model[] = [
  {
    id: '880-s',
    name: '880 S',
    series: 'S',
    binCapacityYd3: 11,
    productionYd3Hr: 90,
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
  },
  {
    id: '750-l',
    name: '750 L',
    series: 'L',
    binCapacityYd3: 10,
    productionYd3Hr: 60,
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
  },
  {
    id: '327-k',
    name: '327 K',
    series: 'K',
    binCapacityYd3: 4,
    productionYd3Hr: 30,
  },
  {
    id: '740-k',
    name: '740 K',
    series: 'K',
    binCapacityYd3: null,
    productionYd3Hr: null,
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
