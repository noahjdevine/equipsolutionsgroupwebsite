import { emptyJob, type YardleyJob } from '../../src/data/yardley-job';

export function knownJob(overrides: Partial<YardleyJob> = {}): YardleyJob {
  return {
    ...emptyJob(),
    workTypes: { state: 'reported', value: ['small-pour'] },
    mixTypes: { state: 'reported', value: ['standard'] },
    quantity: { kind: 'reported', yd3: 3, scope: 'placement' },
    mounting: { state: 'reported', value: 'either' },
    ...overrides,
  };
}

export const contact = {
  name: 'Local test', email: 'test@example.com', preferredContact: 'email', preferredLanguage: 'en',
};
export const legacyMixer = {
  intent: 'mixer', applicationSlug: 'small-pour', pourSizeYd3: 'under-5', poursPerWeek: '1-2',
  mixTypes: ['standard'], chassis: 'no', timeline: 'researching',
};
