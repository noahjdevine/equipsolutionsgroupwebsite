/** Application-owned reply blocks shared by server conversation and offline fallback. */
import { knowledge, matchingFacts, mentionedModels, compareModels, type KnowledgeFact } from '../../data/knowledge';
import { fitJob } from '../../data/fit';
import { CAVEAT_COPY, REASON_COPY } from '../../data/guide';
import { modelById } from '../../data/models';
import type { ConversationInput, ConversationPlan, ConversationResponse } from '../../data/yardley-conversation';
import { nextStep, proposeFromText, STEP_TITLES, type JobPatch } from './intake';
function fitFact(input: ConversationInput): KnowledgeFact {
  const fit = fitJob(input.job);
  const primary = fit.primaryId ? modelById(fit.primaryId) : undefined;
  const lines = primary ? [`The current provisional starting point is ${primary.name}.`, ...fit.reasonIds.map((id) => REASON_COPY[id])]
    : ['The current details need clarification or a configuration review before naming a machine.'];
  if (fit.status === 'configuration-review') lines.push('A base machine shown is for discussion; Paul must review the required configuration before it is a workable setup.');
  lines.push(...fit.caveatIds.filter((id) => ['latex-configuration', 'chopper-air', 'sprayed-configuration', 'reload-required', 'option-unconfirmed'].includes(id)).map((id) => CAVEAT_COPY[id]));
  return { id: 'fit-reasons', title: 'Why this starting point', text: lines.join(' '), sources: primary ? [{ title: `${primary.name} US specifications`, url: primary.source.specificationsUrl }] : [] };
}

const ACKNOWLEDGEMENTS: Record<ConversationPlan['acknowledgement'], string> = {
  start: 'That’s a useful place to start. The job comes before the model number.',
  details: 'I’ve picked out the job details below. Check them before I use them.',
  question: 'Here’s the useful distinction.',
  uncertain: 'No need to guess. We can leave that open and work with what you know.',
  paul: 'That’s a conversation for Paul. I can help get the right details together.',
  'off-topic': 'My desk is StarMix mixer fit and job preparation. Tell me about the work, mix or machine you’re considering.',
};

export function renderResponse(input: ConversationInput, plan: ConversationPlan, proposal: JobPatch, mode: ConversationResponse['mode'], reason: ConversationResponse['reason']): ConversationResponse {
  const facts: KnowledgeFact[] = [...new Set([...matchingFacts(input.message), ...plan.facts])].slice(0, 3).map((id) => id === 'fit-reasons' ? fitFact(input) : knowledge[id]);
  const fit = fitJob(input.job);
  const permitted = new Set([...mentionedModels(input.message), fit.primaryId, fit.alternateId]);
  const requested = mentionedModels(input.message);
  const comparison = compareModels(requested.length ? requested : plan.comparisons.filter((id) => permitted.has(id)));
  if (comparison) facts.unshift(comparison);
  // Existing choices remain the question authority; the model can move to a relevant missing question only.
  const skipped = new Set(input.skipped);
  const next = nextStep(input.job, skipped);
  const candidate = plan.question;
  const isMissing = candidate !== null && nextStep(input.job, new Set(Object.keys(STEP_TITLES).filter((id) => id !== candidate) as typeof input.skipped)) === candidate;
  const question = candidate && !skipped.has(candidate) && isMissing ? candidate : next ?? null;
  const acknowledgement = plan.acknowledgement === 'details' ? 'question' : plan.acknowledgement;
  const lines = [Object.keys(proposal).length ? ACKNOWLEDGEMENTS.details : ACKNOWLEDGEMENTS[acknowledgement], ...facts.map((fact) => fact.text)];
  if (!facts.length && !Object.keys(proposal).length && mode === 'guided') lines.push('I’ve kept your message in the brief. Use the choices to add details, or leave an open question for Paul.');
  const sources = [...new Map(facts.flatMap((fact) => fact.sources).map((source) => [source.url || source.title, source])).values()].slice(0, 6);
  const saveMessage = !Object.keys(proposal).length && !facts.length && plan.acknowledgement !== 'question' && plan.acknowledgement !== 'off-topic';
  return { version: 2, requestId: input.requestId, mode, reason, reply: lines.join('\n\n'), proposal, question, sources, saveMessage };
}

export function scriptedConversation(input: ConversationInput, reason: ConversationResponse['reason']): ConversationResponse {
  return renderResponse(input, { acknowledgement: matchingFacts(input.message).length || mentionedModels(input.message).length ? 'question' : 'uncertain', facts: [], comparisons: [], question: null, updates: [] }, proposeFromText(input.message, input.step ?? undefined), 'guided', reason);
}
