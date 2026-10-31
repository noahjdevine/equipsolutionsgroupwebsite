/**
 * Type-of-work taxonomy — homepage, /starmix/, quote form, and /job/.
 * A set, not a sequence. Do not number these.
 * Slugs are stable: later pages can live at /applications/${slug}/ without renaming.
 */

export interface Application {
  slug: string;
  title: string;
  /** 2–3 sentences. Names the constraint the contractor is working against. */
  body: string;
  /** Guide-only prompts; public application card copy stays unchanged. */
  guide: {
    subtypes: readonly string[];
    questions: readonly string[];
    quantityHelp: string;
  };
}

export const applications: Application[] = [
  {
    slug: 'bridge-deck',
    title: 'Bridge deck & latex-modified overlays',
    body: 'Latex-modified overlay has a working window measured in minutes, not hours, and the polymer dose has to hit the design — not close enough. A drum truck is already hydrating when it leaves the plant. Volumetric metering puts the latex in at the pour, at the ratio the deck called for.',
    guide: {
      subtypes: ['Deck overlay', 'Bridge repair', 'Scattered patches'],
      questions: ['Is this a continuous overlay or separate repairs?', 'Does the specified mix require latex?', 'What placement window and material-replenishment plan apply?'],
      quantityHelp: 'Have the planned area and specified overlay depth? We can estimate from those. If either is unknown, leave the quantity open for Paul.',
    },
  },
  {
    slug: 'rapid-set',
    title: 'Rapid-set & DOT lane returns',
    body: 'Fast-set and CSA mixes start hydrating the moment water hits cement. They will not survive a haul in a rotating drum, and a night lane-return does not wait on a batch plant. Mix on site against the reopen time, not against the truck clock.',
    guide: {
      subtypes: ['Small repairs', 'Continuous placement', 'Lane-closure work'],
      questions: ['What specified mix or repair material will you use?', 'How much must be placed in the available window?', 'Can materials be replenished during placement?'],
      quantityHelp: 'Use the repair dimensions or the quantity on the plans. Next we’ll look at placement time separately from the lane-reopening deadline.',
    },
  },
  {
    slug: 'shotcrete',
    title: 'Shotcrete & gunite',
    body: 'Pool shells, retaining walls, and slope work run at the nozzle. A barrel load is the wrong unit — too much, then nothing. Continuous supply at a controlled rate keeps the crew shooting instead of waiting on the next truck.',
    guide: {
      subtypes: ['Pool shells only', 'Pools and flatwork', 'Retaining walls', 'Slope stabilization'],
      questions: ['Will you use wet-mix shotcrete, dry-mix gunite, or are you unsure?', 'What pump or gun/feed setup will the crew use?', 'Are fibers required, and do you need a feeder or chopper?'],
      quantityHelp: 'For a pool shell, use the material quantity on the plans. Water volume and outside pool dimensions do not tell us how much shell material you need. Unsure? Leave it open for Paul.',
    },
  },
  {
    slug: 'municipal',
    title: 'Municipal & DOT maintenance',
    body: 'A city or county crew does many small pours across scattered sites in a day. Full barrel loads for that work are waste: short-load fees on the way in, returned concrete on the way out. Mix what the stop needs, then move.',
    guide: {
      subtypes: ['Sidewalks and curbs', 'Road repairs', 'Several small stops'],
      questions: ['What is the largest single stop on a busy day?', 'Is this standard concrete or a specified repair mix?', 'Where can the crew reload between stops?'],
      quantityHelp: 'Think of your biggest stop, rather than the whole day. For simple curb work, a length and known cross-section area can help estimate the quantity.',
    },
  },
  {
    slug: 'mining',
    title: 'Mining & remote sites',
    body: 'When the nearest ready-mix plant is a long haul — or there is not one — a drum truck is not a plan. Pads, haul roads, and plant foundations need concrete that has not already set in transit. Carry the materials dry and mix at the hole.',
    guide: {
      subtypes: ['Pads and foundations', 'Road repairs', 'Sprayed concrete'],
      questions: ['What is the largest uninterrupted placement?', 'What placement or feed rate does the crew need?', 'How will aggregates, cement and water reach the site?'],
      quantityHelp: 'Use the plan quantity or dimensions of a simple pad. We’ll look at the biggest uninterrupted placement and how materials reach the site.',
    },
  },
  {
    slug: 'small-pour',
    title: 'Small-pour & low-volume work',
    body: 'The job is a few yards, not a truckload. Short-load fees and returned concrete eat the margin on work that should have been simple. Pay for what you place. Unused material stays dry in the bins.',
    guide: {
      subtypes: ['Driveways', 'Sidewalks', 'Patios', 'Larger slabs and foundations'],
      questions: ['What kind of work will you do most often?', 'What is the largest typical job?', 'Do you prefer a towable unit or a truck-mounted mixer?'],
      quantityHelp: 'No yardage yet? For a rectangular slab, enter length, width and the specified thickness. If you don’t know the thickness, leave the quantity open for Paul.',
    },
  },
];
