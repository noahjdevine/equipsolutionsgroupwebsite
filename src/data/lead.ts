/**
 * Quote-form payload. Mixer field names are the sizing-tool subset — keep them.
 * source is always 'quote-form' from this site.
 */

import { applications } from './applications';
import { models } from './models';

export const LEAD_SOURCE = 'quote-form' as const;

export const INTENTS = ['mixer', 'parts', 'sourcing'] as const;
export type LeadIntent = (typeof INTENTS)[number];

export const MIX_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'rapid-set', label: 'Rapid-set' },
  { value: 'latex-modified', label: 'Latex-modified' },
  { value: 'shotcrete-gunite', label: 'Shotcrete / gunite' },
  { value: 'fiber-reinforced', label: 'Fiber-reinforced' },
  { value: 'other', label: 'Other' },
] as const;
export type MixType = (typeof MIX_TYPES)[number]['value'];

export const POUR_SIZE_STEPS = [
  { value: 'under-5', label: 'Under 5 yd³' },
  { value: '5-10', label: '5–10 yd³' },
  { value: '10-20', label: '10–20 yd³' },
  { value: '20-40', label: '20–40 yd³' },
  { value: '40-plus', label: '40+ yd³' },
] as const;

export const POURS_PER_WEEK_STEPS = [
  { value: '1-2', label: '1–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-10', label: '6–10' },
  { value: '10-plus', label: '10+' },
] as const;

export const CHASSIS_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: 'Not sure' },
] as const;

export const MIXER_TIMELINES = [
  { value: 'immediate', label: 'Immediate' },
  { value: '1-3-mo', label: '1–3 months' },
  { value: '3-6-mo', label: '3–6 months' },
  { value: 'researching', label: 'Researching' },
] as const;

export const PARTS_URGENCY = [
  { value: 'down-now', label: 'Down now' },
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'stocking', label: 'Stocking' },
] as const;

export const SOURCING_TIMELINES = MIXER_TIMELINES;

export const PREFERRED_CONTACT = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

export const PREFERRED_LANGUAGE = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
] as const;

export const applicationSlugs = applications.map((a) => a.slug);
export const modelIds = models.map((m) => m.id);
export const MODEL_NOT_SURE = 'not-sure';

export interface FieldError {
  field: string;
  message: string;
}

export interface LeadContact {
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  preferredContact: (typeof PREFERRED_CONTACT)[number]['value'];
  preferredLanguage: (typeof PREFERRED_LANGUAGE)[number]['value'];
}

export interface MixerFields {
  applicationSlug: string;
  pourSizeYd3: string;
  poursPerWeek: string;
  mixTypes: MixType[];
  chassis: (typeof CHASSIS_OPTIONS)[number]['value'];
  timeline: (typeof MIXER_TIMELINES)[number]['value'];
}

export interface PartsFields {
  modelId: string;
  partNeeded: string;
  urgency: (typeof PARTS_URGENCY)[number]['value'];
}

export interface SourcingFields {
  whatSought: string;
  quantity: string;
  timeline: (typeof SOURCING_TIMELINES)[number]['value'];
  destinationRegion: string;
}

export interface LeadPayload extends LeadContact {
  source: typeof LEAD_SOURCE;
  intent: LeadIntent;
  mixer?: MixerFields;
  parts?: PartsFields;
  sourcing?: SourcingFields;
}

type ParseOk = { ok: true; spam: boolean; lead: LeadPayload };
type ParseFail = { ok: false; errors: FieldError[] };
export type ParseResult = ParseOk | ParseFail;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | '' {
  return (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

export function formDataToObject(data: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  data.forEach((value, key) => {
    if (typeof value !== 'string') return;
    if (key === 'mixTypes') {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, value] : [value];
      return;
    }
    out[key] = value;
  });
  return out;
}

export function parseLead(input: unknown): ParseResult {
  const raw = asRecord(input);
  if (str(raw.website)) {
    return {
      ok: true,
      spam: true,
      lead: {
        source: LEAD_SOURCE,
        intent: 'mixer',
        name: '',
        company: '',
        email: '',
        phone: '',
        state: '',
        preferredContact: 'email',
        preferredLanguage: 'en',
      },
    };
  }

  const errors: FieldError[] = [];
  const intent = oneOf(str(raw.intent), INTENTS);
  if (!intent) errors.push({ field: 'intent', message: 'Choose what we can help with.' });

  const name = str(raw.name);
  if (!name) errors.push({ field: 'name', message: 'Enter your name.' });

  const email = str(raw.email).toLowerCase();
  if (!email) errors.push({ field: 'email', message: 'Enter an email address.' });
  else if (!EMAIL_RE.test(email)) errors.push({ field: 'email', message: 'Enter a valid email address.' });

  const preferredContact = oneOf(
    str(raw.preferredContact),
    PREFERRED_CONTACT.map((o) => o.value),
  );
  if (!preferredContact) {
    errors.push({ field: 'preferredContact', message: 'Choose how you want to be reached.' });
  }

  const preferredLanguage = oneOf(
    str(raw.preferredLanguage),
    PREFERRED_LANGUAGE.map((o) => o.value),
  );
  if (!preferredLanguage) {
    errors.push({ field: 'preferredLanguage', message: 'Choose English or Spanish.' });
  }

  const phone = str(raw.phone);
  if ((preferredContact === 'phone' || preferredContact === 'whatsapp') && !phone) {
    errors.push({ field: 'phone', message: 'Enter a phone number for that contact method.' });
  }

  let mixer: MixerFields | undefined;
  let parts: PartsFields | undefined;
  let sourcing: SourcingFields | undefined;

  if (intent === 'mixer') {
    const applicationSlug = str(raw.applicationSlug);
    if (!applicationSlugs.includes(applicationSlug)) {
      errors.push({ field: 'applicationSlug', message: 'Choose the type of work.' });
    }
    const pourSizeYd3 = oneOf(str(raw.pourSizeYd3), POUR_SIZE_STEPS.map((o) => o.value));
    if (!pourSizeYd3) errors.push({ field: 'pourSizeYd3', message: 'Choose a typical pour size.' });
    const poursPerWeek = oneOf(str(raw.poursPerWeek), POURS_PER_WEEK_STEPS.map((o) => o.value));
    if (!poursPerWeek) errors.push({ field: 'poursPerWeek', message: 'Choose pours per week.' });
    const mixRaw = raw.mixTypes;
    const mixList = Array.isArray(mixRaw) ? mixRaw.map(str) : mixRaw ? [str(mixRaw)] : [];
    const mixTypes = mixList.filter((v): v is MixType =>
      MIX_TYPES.some((o) => o.value === v),
    );
    if (!mixTypes.length) errors.push({ field: 'mixTypes', message: 'Select at least one mix type.' });
    const chassis = oneOf(str(raw.chassis), CHASSIS_OPTIONS.map((o) => o.value));
    if (!chassis) errors.push({ field: 'chassis', message: 'Say whether you already have a chassis.' });
    const timeline = oneOf(str(raw.timeline), MIXER_TIMELINES.map((o) => o.value));
    if (!timeline) errors.push({ field: 'timeline', message: 'Choose a timeline.' });
    if (applicationSlug && pourSizeYd3 && poursPerWeek && mixTypes.length && chassis && timeline) {
      mixer = { applicationSlug, pourSizeYd3, poursPerWeek, mixTypes, chassis, timeline };
    }
  }

  if (intent === 'parts') {
    const modelId = str(raw.modelId);
    if (modelId !== MODEL_NOT_SURE && !modelIds.includes(modelId)) {
      errors.push({ field: 'modelId', message: 'Choose a model, or Not sure.' });
    }
    const partNeeded = str(raw.partNeeded);
    if (!partNeeded) errors.push({ field: 'partNeeded', message: 'Describe the part you need.' });
    const urgency = oneOf(str(raw.urgency), PARTS_URGENCY.map((o) => o.value));
    if (!urgency) errors.push({ field: 'urgency', message: 'Choose how urgent this is.' });
    if ((modelId === MODEL_NOT_SURE || modelIds.includes(modelId)) && partNeeded && urgency) {
      parts = { modelId, partNeeded, urgency };
    }
  }

  if (intent === 'sourcing') {
    const whatSought = str(raw.whatSought);
    if (!whatSought) errors.push({ field: 'whatSought', message: 'Say what you are looking for.' });
    const quantity = str(raw.quantity);
    if (!quantity) errors.push({ field: 'quantity', message: 'Enter a quantity.' });
    const timeline = oneOf(
      str(raw.sourcingTimeline) || str(raw.timeline),
      SOURCING_TIMELINES.map((o) => o.value),
    );
    if (!timeline) errors.push({ field: 'sourcingTimeline', message: 'Choose a timeline.' });
    const destinationRegion = str(raw.destinationRegion);
    if (!destinationRegion) {
      errors.push({ field: 'destinationRegion', message: 'Enter a destination state or region.' });
    }
    if (whatSought && quantity && timeline && destinationRegion) {
      sourcing = { whatSought, quantity, timeline, destinationRegion };
    }
  }

  if (errors.length || !intent || !preferredContact || !preferredLanguage) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    spam: false,
    lead: {
      source: LEAD_SOURCE,
      intent,
      name,
      company: str(raw.company),
      email,
      phone,
      state: str(raw.state),
      preferredContact,
      preferredLanguage,
      mixer,
      parts,
      sourcing,
    },
  };
}

export function formatLeadEmail(lead: LeadPayload): { subject: string; text: string } {
  const intentLabel =
    lead.intent === 'mixer' ? 'volumetric mixer' :
    lead.intent === 'parts' ? 'parts' :
    'sourcing';

  const lines: string[] = [
    `Source: ${lead.source}`,
    `Intent: ${intentLabel}`,
    '',
    `Name: ${lead.name}`,
    `Company: ${lead.company || '—'}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || '—'}`,
    `State: ${lead.state || '—'}`,
    `Preferred contact: ${lead.preferredContact}`,
    `Preferred language: ${lead.preferredLanguage === 'es' ? 'Spanish' : 'English'}`,
  ];

  if (lead.mixer) {
    const app = applications.find((a) => a.slug === lead.mixer!.applicationSlug);
    const pour = POUR_SIZE_STEPS.find((o) => o.value === lead.mixer!.pourSizeYd3);
    const week = POURS_PER_WEEK_STEPS.find((o) => o.value === lead.mixer!.poursPerWeek);
    const chassis = CHASSIS_OPTIONS.find((o) => o.value === lead.mixer!.chassis);
    const timeline = MIXER_TIMELINES.find((o) => o.value === lead.mixer!.timeline);
    const mixes = lead.mixer.mixTypes
      .map((v) => MIX_TYPES.find((o) => o.value === v)?.label ?? v)
      .join(', ');
    lines.push(
      '',
      'Mixer',
      `Type of work: ${app?.title ?? lead.mixer.applicationSlug}`,
      `Pour size: ${pour?.label ?? lead.mixer.pourSizeYd3}`,
      `Pours / week: ${week?.label ?? lead.mixer.poursPerWeek}`,
      `Mix types: ${mixes}`,
      `Chassis: ${chassis?.label ?? lead.mixer.chassis}`,
      `Timeline: ${timeline?.label ?? lead.mixer.timeline}`,
    );
  }

  if (lead.parts) {
    const model =
      lead.parts.modelId === MODEL_NOT_SURE
        ? 'Not sure'
        : models.find((m) => m.id === lead.parts!.modelId)?.name ?? lead.parts.modelId;
    const urgency = PARTS_URGENCY.find((o) => o.value === lead.parts!.urgency);
    lines.push(
      '',
      'Parts',
      `Model: ${model}`,
      `Part needed: ${lead.parts.partNeeded}`,
      `Urgency: ${urgency?.label ?? lead.parts.urgency}`,
    );
  }

  if (lead.sourcing) {
    const timeline = SOURCING_TIMELINES.find((o) => o.value === lead.sourcing!.timeline);
    lines.push(
      '',
      'Sourcing',
      `What is sought: ${lead.sourcing.whatSought}`,
      `Quantity: ${lead.sourcing.quantity}`,
      `Timeline: ${timeline?.label ?? lead.sourcing.timeline}`,
      `Destination region: ${lead.sourcing.destinationRegion}`,
    );
  }

  return {
    subject: `Quote request — ${intentLabel} — ${lead.name}`,
    text: lines.join('\n'),
  };
}
