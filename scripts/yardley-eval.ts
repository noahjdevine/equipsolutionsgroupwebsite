/** Explicit, bounded live evaluation. Never records buyer data or credential values. */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { converse, gatewayPlanner } from '../src/lib/yardley/conversation';
import { emptyJob } from '../src/data/yardley-job';
import { fitJob } from '../src/data/fit';
import { confirmPatch } from '../src/lib/yardley/intake';
import { configured, conversationConfig } from '../src/lib/yardley/limits';

const config = conversationConfig(process.env);
if (!process.argv.includes('--live') || !configured(config)) {
  console.error('Live evaluation requires --live and the verified, enabled Yardley budget/rate configuration. No model was called.');
  process.exit(1);
}
interface Fixture { id: string; message: string; expectedFields: string[]; expectedPrimary?: string; expectedNoPick?: boolean; rejectCalculatedQuantity?: boolean; replyIncludes?: string }
const fixtures = JSON.parse(readFileSync(new URL('../tests/yardley/evals.json', import.meta.url), 'utf8')) as Fixture[];
const caseArg = process.argv.find((arg) => arg.startsWith('--case='));
const selected = caseArg ? fixtures.filter((fixture) => fixture.id === caseArg.slice(7)) : fixtures;
const countArg = process.argv.find((arg) => arg.startsWith('--count='));
const count = countArg ? Number(countArg.split('=')[1]) : selected.length;
if (!Number.isInteger(count) || count < 1 || count > selected.length || count > 12 || fixtures.length > 12) throw new Error('Evaluation requires 1–12 known fixtures with no retries.');
let failures = 0;
let observedCost = 0;
let costReported = 0;
for (const fixture of selected.slice(0, count)) {
  const input = { version: 2 as const, requestId: randomUUID(), job: emptyJob(), message: fixture.message, history: [], skipped: [], step: 'work' as const };
  let generationId: string | undefined;
  let model: string | undefined;
  const result = await converse(input, new AbortController().signal, { config, planner: async (...args) => {
    const response = await gatewayPlanner(...args);
    generationId = response.generationId; model = response.model;
    if (response.cost !== undefined && Number.isFinite(Number(response.cost))) { observedCost += Number(response.cost); costReported++; }
    return response;
  } });
  const confirmed = confirmPatch(input.job, result.proposal);
  const fit = confirmed ? fitJob(confirmed) : undefined;
  const errors: string[] = [];
  if (result.mode !== 'ai') errors.push(`fallback:${result.reason}`);
  for (const field of fixture.expectedFields) if (!(field in result.proposal)) errors.push(`missing:${field}`);
  if (fixture.expectedPrimary && fit?.primaryId !== fixture.expectedPrimary) errors.push('primary');
  if (fixture.expectedNoPick && fit?.primaryId) errors.push('unexpected-pick');
  if (fixture.rejectCalculatedQuantity && result.proposal.quantity?.kind === 'dimensions') errors.push('assumed-thickness');
  if (fixture.replyIncludes && !result.reply.includes(fixture.replyIncludes)) errors.push('answer');
  failures += errors.length ? 1 : 0;
  console.log(JSON.stringify({ id: fixture.id, passed: !errors.length, errors, mode: result.mode, proposedFields: Object.keys(result.proposal), primary: fit?.primaryId ?? null, model, generationId }));
}
console.log(JSON.stringify({ model: config.model, cases: count, failures, reportedGatewayCostUsd: costReported ? observedCost : null, costMetadataCases: costReported, note: 'Gateway budget inspection remains authoritative; no transcript was saved.' }));
process.exitCode = failures ? 1 : 0;
