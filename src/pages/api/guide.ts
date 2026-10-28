/**
 * Closing paragraph for /job/ only.
 * The matcher has already picked the unit. This route may rephrase that note.
 * It may not add a model, a number, a price, a lead time, or a region.
 * Missing key, missing model id, or a failed call returns the scripted paragraph.
 */

import type { APIRoute } from 'astro';
import { createGateway, generateText } from 'ai';
import { fitModel, type GuideAnswers } from '../../data/fit';
import { scriptedClose } from '../../data/guide';
import {
  CHASSIS_OPTIONS,
  MIX_TYPES,
  POUR_SIZE_STEPS,
  POURS_PER_WEEK_STEPS,
  applicationSlugs,
  type MixType,
} from '../../data/lead';
import { models } from '../../data/models';

export const prerender = false;

const MODEL_NAMES = models.map((model) => model.name);
const BANNED =
  /\$|³|²|\b(price|prices|priced|usd|dollar|dollars|lead time|gallon|gallons|liter|liters|litre|ton|tons|tonne|yd|dallas|texas|dfw|iowa|midwest|nationwide|service area)\b/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

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

function parseGuide(input: unknown): GuideAnswers | null {
  const raw = asRecord(input);
  const applicationSlug = str(raw.applicationSlug);
  if (!applicationSlugs.includes(applicationSlug)) return null;
  const pourSizeYd3 = oneOf(str(raw.pourSizeYd3), POUR_SIZE_STEPS.map((o) => o.value));
  const poursPerWeek = oneOf(str(raw.poursPerWeek), POURS_PER_WEEK_STEPS.map((o) => o.value));
  const chassis = oneOf(str(raw.chassis), CHASSIS_OPTIONS.map((o) => o.value));
  if (!pourSizeYd3 || !poursPerWeek || !chassis) return null;
  const mixRaw = raw.mixTypes;
  const mixList = Array.isArray(mixRaw) ? mixRaw.map(str) : mixRaw ? [str(mixRaw)] : [];
  const mixTypes = mixList.filter((value): value is MixType => MIX_TYPES.some((o) => o.value === value));
  return { applicationSlug, pourSizeYd3, poursPerWeek, chassis, mixTypes };
}

function compact(name: string): string {
  return name.replace(/\s+/g, '');
}

function mentions(text: string, name: string): boolean {
  return text.includes(name) || text.includes(compact(name));
}

/** Reject a rephrase that adds a unit, a figure, a price, or a region. */
export function acceptRephrase(text: string, scripted: string): string | null {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 20 || cleaned.length > 700) return null;
  if (/[<>]/.test(cleaned)) return null;
  const sentences = cleaned.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length > 6) return null;

  for (const name of MODEL_NAMES) {
    if (mentions(cleaned, name) && !mentions(scripted, name)) return null;
  }

  let rest = cleaned;
  for (const name of MODEL_NAMES) {
    if (!mentions(scripted, name)) continue;
    rest = rest.split(name).join(' ').split(compact(name)).join(' ');
  }
  if (/\d/.test(rest) || BANNED.test(rest)) return null;
  return cleaned;
}

function envValue(vite: unknown, fromNode: string | undefined): string {
  if (typeof vite === 'string' && vite.trim()) return vite.trim();
  if (typeof fromNode === 'string' && fromNode.trim()) return fromNode.trim();
  return '';
}

async function rephrase(scripted: string): Promise<string> {
  const apiKey = envValue(import.meta.env.AI_GATEWAY_API_KEY, process.env.AI_GATEWAY_API_KEY);
  const modelId = envValue(import.meta.env.AI_GATEWAY_MODEL, process.env.AI_GATEWAY_MODEL);
  if (!apiKey || !modelId) return scripted;

  try {
    const gateway = createGateway({ apiKey });
    const { text } = await generateText({
      model: gateway(modelId),
      system: [
        'You are Paul Devine, an independent StarMix representative.',
        'Rewrite the note in his voice: plain, first person, two or three short sentences.',
        'You may rephrase.',
        'You may not add a model, a number, a price, a lead time, or a region.',
        'You may not name a unit that is not already in the note.',
        'If you cannot do that, return the note unchanged.',
      ].join(' '),
      prompt: `Note:\n${scripted}`,
      maxOutputTokens: 160,
      maxRetries: 0,
      timeout: 8000,
    });
    return acceptRephrase(text, scripted) ?? scripted;
  } catch {
    return scripted;
  }
}

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    raw = null;
  }

  const answers = parseGuide(raw);
  if (!answers) {
    return json({ note: 'I will match this on a call.' });
  }

  const scripted = scriptedClose(answers, fitModel(answers));
  const note = await rephrase(scripted);
  return json({ note });
};
