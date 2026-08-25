/**
 * Type-of-work taxonomy — homepage, /starmix/, quote form, and the future sizing tool.
 * A set, not a sequence. Do not number these.
 * Slugs are stable: later pages can live at /applications/${slug}/ without renaming.
 */

export interface Application {
  slug: string;
  title: string;
  /** 2–3 sentences. Names the constraint the contractor is working against. */
  body: string;
}

export const applications: Application[] = [
  {
    slug: 'bridge-deck',
    title: 'Bridge deck & latex-modified overlays',
    body: 'Latex-modified overlay has a working window measured in minutes, not hours, and the polymer dose has to hit the design — not close enough. A drum truck is already hydrating when it leaves the plant. Volumetric metering puts the latex in at the pour, at the ratio the deck called for.',
  },
  {
    slug: 'rapid-set',
    title: 'Rapid-set & DOT lane returns',
    body: 'Fast-set and CSA mixes start hydrating the moment water hits cement. They will not survive a haul in a rotating drum, and a night lane-return does not wait on a batch plant. Mix on site against the reopen time, not against the truck clock.',
  },
  {
    slug: 'shotcrete',
    title: 'Shotcrete & gunite',
    body: 'Pool shells, retaining walls, and slope work run at the nozzle. A barrel load is the wrong unit — too much, then nothing. Continuous supply at a controlled rate keeps the crew shooting instead of waiting on the next truck.',
  },
  {
    slug: 'municipal',
    title: 'Municipal & DOT maintenance',
    body: 'A city or county crew does many small pours across scattered sites in a day. Full barrel loads for that work are waste: short-load fees on the way in, returned concrete on the way out. Mix what the stop needs, then move.',
  },
  {
    slug: 'mining',
    title: 'Mining & remote sites',
    body: 'When the nearest ready-mix plant is a long haul — or there is not one — a drum truck is not a plan. Pads, haul roads, and plant foundations need concrete that has not already set in transit. Carry the materials dry and mix at the hole.',
  },
  {
    slug: 'small-pour',
    title: 'Small-pour & low-volume work',
    body: 'The job is a few yards, not a truckload. Short-load fees and returned concrete eat the margin on work that should have been simple. Pay for what you place. Unused material stays dry in the bins.',
  },
];
