import { applications } from '../data/applications';
import { fitJob } from '../data/fit';
import { CAVEAT_COPY, QUESTION_COPY, REASON_COPY } from '../data/guide';
import { modelById, binDisplay, productionDisplay, mountLabel } from '../data/models';
import { mixerOptions } from '../data/options';
import { MIX_TYPES, emptyJob, parseYardleyJob, reported, type YardleyJob } from '../data/yardley-job';
import { calculateVolume, type VolumeInput } from '../lib/yardley/volume';
import { applyJobPatch, confirmPatch, formatQuantity, nextStep, quantityLabel, STEP_TITLES, summaryRows, type IntakeStep, type JobPatch } from '../lib/yardley/intake';
import { ConversationTransport } from '../lib/yardley/transport';
import { scriptedConversation } from '../lib/yardley/replies';
import type { ConversationInput, ConversationResponse } from '../data/yardley-conversation';
import { briefRows, formatYardleyBrief } from '../data/lead';
import { YardleyHandoff, HandoffError, type HandoffDraft } from '../lib/yardley/handoff';

// All visitor text is inserted with textContent. No transcript or job storage.
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  result.textContent = text;
  if (className) result.className = className;
  return result;
}
function button(text: string, action: () => void, className = 'yardley-text-button'): HTMLButtonElement {
  const result = node('button', text, className);
  result.type = 'button';
  result.addEventListener('click', action);
  return result;
}
const answer = <T>(value: T) => ({ state: 'reported' as const, value });

export function startGuide(): void {
  const root = document.querySelector<HTMLElement>('[data-yardley]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const question = get('[data-question]');
  const exchange = get('[data-exchange]');
  const status = get('[data-status]');
  const composer = get<HTMLFormElement>('[data-composer]');
  const messageInput = get<HTMLTextAreaElement>('#yardley-message');
  const notesInput = get<HTMLTextAreaElement>('[data-notes]');
  const summary = get<HTMLDetailsElement>('[data-summary]');
  const review = get('[data-review-panel]');
  const handoff = new YardleyHandoff();
  const contactForm = get<HTMLFormElement>('[data-handoff-form]');
  const contactFields = get<HTMLFieldSetElement>('[data-contact-fields]');
  const sendBrief = get<HTMLButtonElement>('[data-send-brief]');
  const transport = new ConversationTransport();
  const sendButton = composer.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  let retryInput: ConversationInput | undefined;
  let job = emptyJob();
  let skipped = new Set<IntakeStep>();
  let editing: IntakeStep | undefined;
  let pending: JobPatch | undefined;
  let pendingText = '';
  let messages: { who: 'You' | 'Yardley'; text: string; sources?: ConversationResponse['sources'] }[] = [];
  type Checkpoint = { job: YardleyJob; skipped: IntakeStep[]; editing?: IntakeStep; messages: typeof messages };
  const history: Checkpoint[] = [];
  const currentStep = () => editing ?? nextStep(job, skipped);
  const checkpoint = () => {
    history.push({ job: structuredClone(job), skipped: [...skipped], editing, messages: [...messages] });
    if (history.length > 24) history.shift();
  };
  const say = (who: 'You' | 'Yardley', text: string, sources?: ConversationResponse['sources']) => { messages.push({ who, text, sources }); messages = messages.slice(-8); };
  const announce = (text: string) => { status.textContent = text; };

  function setBusy(busy: boolean): void {
    sendButton.disabled = busy;
    composer.setAttribute('aria-busy', String(busy));
    get('[data-cancel-reply]').hidden = !busy;
  }
  function invalidateConversation(): void {
    transport.cancel(); setBusy(false); retryInput = undefined;
    get('[data-retry-reply]').hidden = true;
  }
  function saveNote(text: string): boolean {
    if (job.notes.split('\n').includes(text)) return true;
    const parsed = parseYardleyJob({ ...job, notes: [job.notes, text].filter(Boolean).join('\n') });
    if (!parsed.ok) { announce('Your notes are full. Shorten them in the summary before saving another note. This message is still in the recent conversation.'); return false; }
    job = parsed.job; renderSummary();
    return true;
  }

  function focusQuestion(): void {
    question.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    question.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  function commit(patch: JobPatch, userLine: string, reply: string, markAnswered = true): boolean {
    const parsed = applyJobPatch(job, patch);
    if (!parsed.ok) { announce(parsed.errors.some((e) => e.field === 'notes') ? 'The brief notes are full. Shorten them in your summary so the daily total can be kept alongside this placement quantity.' : 'Please check that answer. Positive quantities and the stated units are required. Your saved details are still here.'); return false; }
    invalidateConversation();
    checkpoint();
    if (markAnswered && currentStep()) skipped.add(currentStep()!);
    if (patch.quantity && patch.quantity.kind !== 'unknown' && 'scope' in patch.quantity && patch.quantity.scope !== 'placement') skipped.delete('quantity');
    job = parsed.job;
    editing = undefined;
    pending = undefined;
    pendingText = '';
    review.hidden = true;
    say('You', userLine);
    say('Yardley', reply);
    render();
    focusQuestion();
    return true;
  }
  function skip(): void {
    const step = currentStep();
    if (!step) return;
    // Editing an answer to unknown must remove the old value, not just hide its question.
    const clear: Record<IntakeStep, JobPatch> = {
      work: { workTypes: { state: 'unknown' } }, detail: { subtype: { state: 'unknown' } },
      mix: { mixTypes: { state: 'unknown' } }, process: { process: { state: 'unknown' } },
      feed: { feedSetup: { state: 'unknown' } }, specification: { mixSpecification: { state: 'unknown' } },
      quantity: { quantity: job.quantity.kind !== 'unknown' && job.quantity.scope !== 'placement' ? job.quantity : { kind: 'unknown' } }, pace: { placementWindowMinutes: { state: 'unknown' }, requiredRateYd3Hr: { state: 'unknown' } },
      replenishment: { replenishment: { state: 'unknown' } },
      setup: { mounting: { state: 'unknown' }, existingChassis: { state: 'unknown' }, weeklyUse: { state: 'unknown' }, timeline: { state: 'unknown' } },
      options: { requiredOptions: { state: 'unknown' } }, air: { highVolumeAir: { state: 'unknown' } },
    };
    commit(clear[step], 'I’m not sure about that yet.', 'No problem. I’ll leave that open for Paul rather than fill in a guess.');
  }
  function edit(step: IntakeStep): void {
    if (handoff.busy) return;
    invalidateConversation();
    pending = undefined;
    pendingText = '';
    editing = step;
    review.hidden = true;
    render();
    focusQuestion();
  }
  function renderExchange(): void {
    exchange.replaceChildren();
    if (!messages.length) {
      const intro = node('div', '', 'yardley-message');
      intro.append(node('span', 'Yardley', 'yardley-label'), node('p', 'A driveway crew and a bridge crew need different things. Let’s start with yours. Pick a few answers, type a little, or do both.'));
      exchange.append(intro);
    } else {
      const transcript = node('details', '', 'yardley-earlier');
      transcript.append(node('summary', `Conversation · ${Math.ceil(messages.length / 2)} recent exchanges`));
      const messageNode = (msg: typeof messages[number]) => {
        const item = node('div', '', `yardley-message${msg.who === 'You' ? ' yardley-message--you' : ''}`);
        item.append(node('span', msg.who, 'yardley-label'), node('p', msg.text));
        if (msg.who === 'You') item.append(button('Keep this as a note for Paul', () => { if (saveNote(msg.text)) announce('Message saved to your editable brief notes.'); }));
        if (msg.sources?.length) {
          const sources = node('details', '', 'yardley-sources');
          sources.append(node('summary', 'Sources & configuration notes'));
          for (const source of msg.sources) {
            const line = node('p');
            if (/^https:\/\/(starmixindustries\.com|docs\.google\.com)\//.test(source.url)) {
              const link = node('a', source.title); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; line.append(link);
            } else line.textContent = source.title;
            sources.append(line);
          }
          item.append(sources);
        }
        return item;
      };
      for (const msg of messages.slice(0, -1)) transcript.append(messageNode(msg));
      exchange.append(transcript, messageNode(messages.at(-1)!));
    }
  }
  function renderSummary(): void {
    const rows = get('[data-summary-rows]');
    rows.replaceChildren();
    for (const row of summaryRows(job)) {
      const group = node('div', '', 'yardley-summary-row');
      const term = node('dt', row.label);
      const value = node('dd');
      const change = button('Edit', () => edit(row.step));
      change.setAttribute('aria-label', `Edit ${row.label.toLowerCase()}`);
      value.append(node('span', row.value), change);
      group.append(term, value);
      rows.append(group);
    }
    if (document.activeElement !== notesInput) notesInput.value = job.notes;
  }
  function inputField(form: HTMLElement, labelText: string, name: string, value = '', type = 'text', required = false): HTMLInputElement {
    const field = node('div', '', 'yardley-field');
    const label = node('label', labelText);
    const input = node('input');
    input.id = `yardley-${name}`;
    label.htmlFor = input.id;
    input.name = name;
    input.type = type;
    input.value = value;
    input.required = required;
    if (type === 'number') { input.min = '0'; input.step = 'any'; input.inputMode = 'decimal'; }
    else input.maxLength = 300;
    field.append(label, input);
    form.append(field);
    return input;
  }
  function selectField(form: HTMLElement, labelText: string, name: string, choices: readonly (readonly [string, string])[], value = ''): HTMLSelectElement {
    const field = node('div', '', 'yardley-field');
    const label = node('label', labelText);
    const select = node('select');
    select.id = `yardley-${name}`;
    label.htmlFor = select.id;
    for (const [key, text] of choices) { const option = node('option', text); option.value = key; select.append(option); }
    select.value = value;
    field.append(label, select);
    form.append(field);
    return select;
  }
  function formFor(save: (form: HTMLFormElement) => void): HTMLFormElement {
    const form = node('form', '', 'yardley-answer-form');
    form.addEventListener('submit', (event) => { event.preventDefault(); if (form.reportValidity()) save(form); });
    question.append(form);
    return form;
  }
  function formActions(form: HTMLFormElement, text = 'Continue →'): void {
    const actions = node('div', '', 'yardley-answer-actions');
    const submit = node('button', text, 'btn');
    submit.type = 'submit';
    actions.append(submit, button('I’m not sure yet', skip));
    form.append(actions);
  }
  function multiChoice<T extends string>(choices: readonly { value: T; label: string; help?: string }[], initial: readonly T[], save: (selected: T[]) => void, allowEmpty = false): void {
    const selected = new Set(initial);
    const form = formFor(() => {
      if (!selected.size && !allowEmpty) { announce('Choose at least one, or use “I’m not sure yet”.'); return; }
      save([...selected]);
    });
    const group = node('div', '', 'yardley-choices');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', 'yardley-current-question');
    for (const choice of choices) {
      const option = button('', () => {
        invalidateConversation();
        if (selected.has(choice.value)) selected.delete(choice.value); else selected.add(choice.value);
        option.setAttribute('aria-pressed', String(selected.has(choice.value)));
      }, 'yardley-choice');
      option.append(node('span', choice.label));
      if (choice.help) option.append(node('small', choice.help));
      option.setAttribute('aria-pressed', String(selected.has(choice.value)));
      group.append(option);
    }
    form.append(group);
    formActions(form, allowEmpty ? 'Save options →' : 'Continue →');
  }
  function renderPending(): void {
    question.append(node('h2', 'Did I get that right?', 'yardley-question-title'));
    question.querySelector('h2')!.tabIndex = -1;
    question.append(node('p', 'Only the details below will change. Confirm them before they affect the comparison.'));
    const proposed = confirmPatch(job, pending!);
    if (!proposed) { pending = undefined; renderQuestion(); announce('Those suggested changes could not be saved. Check the values and leave space in your notes for both daily and placement quantities. Your current answers are still here.'); return; }
    const before = briefRows(job);
    const list = node('ul', '', 'yardley-proposals');
    for (const row of briefRows(proposed)) {
      const old = before.find((entry) => entry.label === row.label);
      if (old?.value !== row.value && (row.value !== 'Not sure yet' || old !== undefined)) list.append(node('li', `${row.label}: ${row.value}`));
    }
    question.append(list);
    const actions = node('div', '', 'yardley-answer-actions');
    actions.append(button('Yes, use these details', () => {
      const confirmed = confirmPatch(job, pending!);
      if (confirmed && commit(confirmed, pendingText, 'Got it. Those details are now in your job summary.', false)) announce('Details confirmed. Your comparison has been updated.');
    }, 'btn'), button('Keep my current answers', () => {
      pending = undefined;
      pendingText = '';
      render();
      focusQuestion();
      announce('Suggested changes discarded. Your note is still in the brief for Paul.');
    }));
    question.append(actions);
  }
  function renderQuantity(): void {
    const app = applications.find((a) => reported(job.workTypes)?.includes(a.slug));
    question.append(node('p', app?.guide.quantityHelp ?? 'Use the largest single placement rather than the total over a day.'));
    if (job.quantity.kind !== 'unknown' && job.quantity.scope !== 'placement') question.append(node('p', `You entered ${quantityLabel(job)}. Keep daily total separate from the largest single placement.`, 'yardley-notice'));
    const form = formFor(() => {
      const scopeValue = scope.value as 'placement' | 'day' | 'unknown';
      if (mode.value === 'known') {
        commit({ quantity: { kind: 'reported', yd3: Number(exact.value), scope: scopeValue } }, `${exact.value} yd³ ${scopeValue === 'placement' ? 'at the largest placement' : scopeValue === 'day' ? 'per day' : 'with scope to confirm'}.`, 'That gives us a quantity to work with. Bin size and production pace are different questions.');
      } else {
        const inputs: VolumeInput = shape.value === 'area-depth'
          ? { shape: 'area-depth', areaFt2: Number(fields.get('areaFt2')!.value), thicknessIn: Number(fields.get('thicknessIn')!.value) }
          : shape.value === 'prism'
            ? { shape: 'prism', lengthFt: Number(fields.get('lengthFt')!.value), crossSectionFt2: Number(fields.get('crossSectionFt2')!.value) }
            : { shape: 'slab', lengthFt: Number(fields.get('lengthFt')!.value), widthFt: Number(fields.get('widthFt')!.value), thicknessIn: Number(fields.get('thicknessIn')!.value) };
        const result = calculateVolume(inputs);
        if (!result.ok) { announce('Please enter positive dimensions in the units shown. Thickness must come from your plans or specification.'); return; }
        commit({ quantity: { kind: 'dimensions', inputs, scope: scopeValue } }, `Estimate from my dimensions: ${formatQuantity(result.estimate.yd3)} yd³.`, 'That’s a geometry estimate, with no waste allowance added. Paul still needs to confirm the job quantity and usable yield.');
      }
    });
    const mode = selectField(form, 'How would you like to give the quantity?', 'quantity-mode', [['known', 'I know the cubic yards'], ['dimensions', 'Help me estimate from dimensions']], job.quantity.kind === 'dimensions' ? 'dimensions' : 'known');
    const scope = selectField(form, 'What does this quantity cover?', 'quantity-scope', [['placement', 'Largest single placement / stop'], ['day', 'Total for the day'], ['unknown', 'I’m not sure']], job.quantity.kind === 'unknown' ? 'placement' : job.quantity.scope);
    const known = node('div');
    const exact = inputField(known, 'Concrete quantity (yd³)', 'quantity', job.quantity.kind === 'reported' ? String(job.quantity.yd3) : '', 'number', true);
    const dimensions = node('div');
    const shape = selectField(dimensions, 'Simple shape', 'shape', [['slab', 'Rectangular slab'], ['area-depth', 'Known area and depth'], ['prism', 'Length and cross-section area']], job.quantity.kind === 'dimensions' ? job.quantity.inputs.shape : 'slab');
    const dimensionsBody = node('div', '', 'yardley-input-grid');
    const fields = new Map<string, HTMLInputElement>();
    const dimensionDrafts: Record<string, string> = {};
    if (job.quantity.kind === 'dimensions') for (const [key, value] of Object.entries(job.quantity.inputs)) dimensionDrafts[key] = String(value);
    function drawDimensions(): void {
      for (const [name, field] of fields) dimensionDrafts[name] = field.value;
      fields.clear();
      dimensionsBody.replaceChildren();
      const definitions = shape.value === 'area-depth' ? [['areaFt2', 'Area (ft²)'], ['thicknessIn', 'Specified depth (inches)']]
        : shape.value === 'prism' ? [['lengthFt', 'Length (feet)'], ['crossSectionFt2', 'Cross-section area (ft²)']]
          : [['lengthFt', 'Length (feet)'], ['widthFt', 'Width (feet)'], ['thicknessIn', 'Specified thickness (inches)']];
      for (const [name, label] of definitions) fields.set(name, inputField(dimensionsBody, label, name, dimensionDrafts[name] ?? '', 'number', true));
      toggleMode();
    }
    dimensions.append(dimensionsBody, node('p', 'No assumed thickness or waste allowance. For a pool shell, use the plan material quantity; outside pool dimensions and water volume cannot establish it.', 'small muted'));
    function toggleMode(): void {
      known.hidden = mode.value !== 'known';
      dimensions.hidden = mode.value !== 'dimensions';
      exact.disabled = known.hidden;
      for (const field of fields.values()) field.disabled = dimensions.hidden;
    }
    mode.addEventListener('change', toggleMode);
    shape.addEventListener('change', drawDimensions);
    form.append(known, dimensions);
    drawDimensions();
    formActions(form, 'Use this quantity →');
  }
  function renderQuestion(): void {
    question.replaceChildren();
    if (pending) { renderPending(); return; }
    const step = currentStep();
    const title = node('h2', step ? STEP_TITLES[step] : 'That’s a useful start.', 'yardley-question-title');
    title.id = 'yardley-current-question';
    title.tabIndex = -1;
    question.append(title);
    if (!step) {
      question.append(node('p', 'You don’t need every answer to speak with Paul. Review what we know, see the comparison, or change a detail in your summary.'));
      const actions = node('div', '', 'yardley-answer-actions');
      actions.append(button('See my starting point ↓', () => {
        get('[data-results]').hidden = false;
        get('#yardley-results-title').focus();
      }, 'btn'), button('Review my job brief', showReview));
      question.append(actions);
      return;
    }
    if (step === 'work') {
      question.append(node('p', 'Choose everything you plan to do. The biggest job and any special mix will help us narrow it down.'));
      multiChoice(applications.map((a) => ({ value: a.slug, label: a.title })), reported(job.workTypes) ?? [], (selected) => {
        const first = applications.find((a) => a.slug === selected[0])!;
        commit({ workTypes: answer(selected) }, selected.map((id) => applications.find((a) => a.slug === id)!.title).join('; '), first.guide.questions[0]);
      });
    } else if (step === 'detail') {
      question.append(node('p', 'What will you do most often? A short description is enough.'));
      const form = formFor(() => { if (text.value.trim()) commit({ subtype: answer(text.value.trim()) }, text.value.trim(), 'Good. Let’s look at the material the job calls for.'); });
      const text = inputField(form, 'Main job or project detail', 'subtype', reported(job.subtype) ?? '', 'text', true);
      text.maxLength = 200;
      const chips = node('div', '', 'yardley-chips');
      const types = applications.filter((a) => reported(job.workTypes)?.includes(a.slug)).flatMap((a) => [...a.guide.subtypes]);
      for (const subtype of [...new Set(types)]) chips.append(button(subtype, () => { invalidateConversation(); text.value = subtype; text.focus(); }, 'yardley-chip'));
      form.append(chips);
      formActions(form);
    } else if (step === 'mix') {
      question.append(node('p', 'The job title alone doesn’t tell us the mix. Select any known requirements, or leave this open for Paul.'));
      multiChoice(MIX_TYPES, reported(job.mixTypes) ?? [], (selected) => commit({ mixTypes: answer(selected) }, selected.map((id) => MIX_TYPES.find((m) => m.value === id)!.label).join(', '), selected.includes('latex-modified') ? 'Latex changes the eligible base machines, even for a small placement. The dosing configuration still needs Paul’s review.' : 'Mix requirements come before machine size. We’ll keep both in view.'));
    } else if (step === 'quantity') renderQuantity();
    else if (step === 'process' || step === 'replenishment' || step === 'air') {
      question.append(node('p', step === 'process' ? 'Wet-mix shotcrete and dry-mix gunite use different feed arrangements. Paul must review compatibility; a mixer rating is not a nozzle output rating.' : step === 'air' ? CAVEAT_COPY['chopper-air'] : 'Replenishment means topping up aggregates, cement and water on site or between discharges. It affects whether a job larger than one bin is practical.'));
      const choices = step === 'process' ? [['wet-shotcrete', 'Wet-mix shotcrete'], ['dry-gunite', 'Dry-mix gunite']] : [['yes', step === 'air' ? 'High-volume air will be available' : 'Yes, we can replenish'], ['no', step === 'air' ? 'High-volume air is not available' : 'No replenishment planned']];
      const group = node('div', '', 'yardley-choices');
      for (const [value, label] of choices) group.append(button(label, () => {
        const patch: JobPatch = step === 'process' ? { process: answer(value as 'wet-shotcrete' | 'dry-gunite') }
          : step === 'air' ? { highVolumeAir: answer(value === 'yes') } : { replenishment: answer(value as 'yes' | 'no') };
        commit(patch, label, step === 'process' && value === 'dry-gunite' ? 'We’ll keep this as a configuration review. I won’t infer dry-gunite compatibility from the published mixer figures.' : 'Added to your brief. Paul will review the equipment and logistics with you.');
      }, 'yardley-choice'));
      question.append(group, button('I’m not sure yet', skip));
    } else if (step === 'feed' || step === 'specification') {
      question.append(node('p', step === 'feed' ? 'Give the pump or gun make/model and feed arrangement if you know them. It’s fine to leave this for Paul.' : 'Use the material name or requirement from the project documents. We won’t infer a mix design.'));
      const form = formFor(() => commit(step === 'feed' ? { feedSetup: answer(text.value.trim()) } : { mixSpecification: answer(text.value.trim()) }, text.value.trim(), 'Saved for the configuration discussion with Paul.'));
      const text = inputField(form, step === 'feed' ? 'Pump / gun / feed setup' : 'Material or mix specification', step, reported(step === 'feed' ? job.feedSetup : job.mixSpecification) ?? '', 'text', true);
      formActions(form);
    } else if (step === 'pace') {
      question.append(node('p', 'Bin capacity is how much material the unit carries. Production is how quickly it can mix. How long is available for the placement itself—not the lane-reopening deadline?'));
      const form = formFor(() => {
        if (!minutes.value && !rate.value) { skip(); return; }
        commit({ placementWindowMinutes: minutes.value ? answer(Number(minutes.value)) : { state: 'unknown' }, requiredRateYd3Hr: rate.value ? answer(Number(rate.value)) : { state: 'unknown' } }, [minutes.value ? `${minutes.value} minutes for placement` : '', rate.value ? `${rate.value} yd³/hr required` : ''].filter(Boolean).join('; '), 'I’ll compare the required pace separately from the bin size. Actual placement also depends on crew, mix and material supply.');
      });
      const grid = node('div', '', 'yardley-input-grid');
      const minutes = inputField(grid, 'Placement window (minutes, if known)', 'minutes', String(reported(job.placementWindowMinutes) ?? ''), 'number');
      const rate = inputField(grid, 'Required rate (yd³/hr, if specified)', 'rate', String(reported(job.requiredRateYd3Hr) ?? ''), 'number');
      form.append(grid);
      formActions(form);
    } else if (step === 'setup') {
      question.append(node('p', 'A busy week can still mean small pours. These details help Paul understand how you’ll use the machine.'));
      const form = formFor(() => {
        const patch: JobPatch = {
          mounting: mount.value ? answer(mount.value as 'trailer' | 'truck' | 'either') : { state: 'unknown' },
          existingChassis: chassis.value ? answer(chassis.value === 'yes') : { state: 'unknown' },
          weeklyUse: week.value ? answer(week.value as '1-2' | '3-5' | '6-10' | '10-plus') : { state: 'unknown' },
          timeline: timeline.value ? answer(timeline.value as 'immediate' | '1-3-mo' | '3-6-mo' | 'researching') : { state: 'unknown' },
        };
        commit(patch, 'Operation details updated.', 'Those are in your brief. A truck-mounted machine still needs a suitable chassis confirmed with Paul.');
      });
      const grid = node('div', '', 'yardley-input-grid');
      const mount = selectField(grid, 'Mounting preference', 'mount', [['', 'Help me decide'], ['either', 'Either approach works'], ['trailer', 'Towable / trailer'], ['truck', 'Truck-mounted']], reported(job.mounting) ?? '');
      const chassis = selectField(grid, 'Already have a truck chassis?', 'chassis', [['', 'Not sure'], ['yes', 'Yes · suitability to review'], ['no', 'No']], reported(job.existingChassis) === undefined ? '' : reported(job.existingChassis) ? 'yes' : 'no');
      const week = selectField(grid, 'Placements per week', 'week', [['', 'Not sure'], ['1-2', '1–2'], ['3-5', '3–5'], ['6-10', '6–10'], ['10-plus', 'More than 10']], reported(job.weeklyUse) ?? '');
      const timeline = selectField(grid, 'When are you looking to buy?', 'timeline', [['', 'Not sure'], ['immediate', 'As soon as practical'], ['1-3-mo', '1–3 months'], ['3-6-mo', '3–6 months'], ['researching', 'Researching']], reported(job.timeline) ?? '');
      form.append(grid);
      formActions(form);
    } else if (step === 'options') {
      question.append(node('p', 'Choose only known requirements. Latex mix already triggers a latex configuration check. A fiber feeder is different from a fiber chopper; Paul can help identify which you need.'));
      const catalog = node('details', '', 'yardley-option-help');
      catalog.append(node('summary', 'What do these options mean?'));
      for (const option of mixerOptions) {
        const entry = node('div');
        entry.append(node('h3', option.name), node('p', option.qualification));
        for (const prerequisite of option.prerequisites) entry.append(node('p', prerequisite));
        catalog.append(entry);
      }
      question.append(catalog);
      multiChoice(mixerOptions.map((o) => ({ value: o.id, label: o.name, help: o.id === 'fiber-chopper' ? 'Requires high-volume air · larger base models only' : o.id === 'cement-flyash-bin' ? 'Special addition · any base model' : undefined })), reported(job.requiredOptions) ?? [], (selected) => commit({ requiredOptions: answer(selected) }, selected.length ? selected.map((id) => mixerOptions.find((o) => o.id === id)!.name).join(', ') : 'No additional options specified.', 'Required options are checked before ranking. An unconfirmed combination goes to Paul for review, rather than a guess.'), true);
    }
  }
  function renderResults(): void {
    const fit = fitJob(job);
    const visible = !!reported(job.workTypes) && !!reported(job.mixTypes) && job.quantity.kind !== 'unknown' || !currentStep() || !review.hidden;
    get('[data-results]').hidden = !visible;
    get('[data-fit-status]').textContent = fit.status === 'configuration-review'
      ? fit.primaryId ? 'A base machine to discuss. Paul must review the required configuration before this is a workable setup.' : 'This needs Paul’s configuration review before naming a machine.'
      : fit.primaryId ? 'A provisional fit, with details to confirm.' : 'A few details are still open. That’s a valid starting point for Paul.';
    const reasons = get('[data-reasons]');
    reasons.replaceChildren();
    if (fit.primaryId) {
      const list = node('ul', '', 'yardley-reason-list');
      for (const id of fit.reasonIds) list.append(node('li', REASON_COPY[id]));
      reasons.append(list);
    }
    const plates = get('[data-models]');
    plates.replaceChildren();
    const picks = [fit.primaryId, fit.alternateId].filter((id) => !!id);
    for (const [index, id] of picks.entries()) {
      const model = modelById(id)!;
      const plate = node('article', '', 'plate yardley-model');
      plate.append(node('p', index === 0 ? fit.status === 'configuration-review' ? 'Base machine for review' : 'Provisional starting point' : 'Worth comparing', 'plate-code'), node('h3', model.name));
      const image = node('img', '', 'model-image');
      image.src = model.image.src; image.alt = model.image.alt; image.width = model.image.width; image.height = model.image.height; image.loading = 'lazy';
      plate.append(image);
      const specs = node('dl', '', 'dl');
      for (const [term, value] of [['Mount', mountLabel(model)], ['Bin capacity', binDisplay(model)], ['Published production', productionDisplay(model)]]) specs.append(node('dt', term), node('dd', value));
      const link = node('a', 'Manufacturer specifications ↗', 'card-link');
      link.href = model.source.specificationsUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      plate.append(specs, link);
      plates.append(plate);
    }
    const comparison = get('[data-comparison]');
    comparison.hidden = picks.length < 2;
    if (picks.length === 2) {
      const primary = modelById(picks[0])!, alternate = modelById(picks[1])!;
      comparison.textContent = primary.productionYd3Hr === alternate.productionYd3Hr
        ? `${primary.name} and ${alternate.name} both publish ${primary.productionYd3Hr} yd³/hr. ${primary.binCapacityYd3 !== alternate.binCapacityYd3 ? `Their published bins are ${primary.binCapacityYd3} and ${alternate.binCapacityYd3} yd³ respectively.` : 'Their published bin capacities also match.'} Paul can compare the build and configuration; the alternate is not faster on that published figure.`
        : `${primary.name} publishes ${primary.binCapacityYd3} yd³ and ${primary.productionYd3Hr} yd³/hr; ${alternate.name} publishes ${alternate.binCapacityYd3} yd³ and ${alternate.productionYd3Hr} yd³/hr. Extra bin capacity and extra mixing rate solve different problems. Discuss the actual placement pace and replenishment plan with Paul.`;
    }
    const qualifications = get('[data-qualifications]');
    qualifications.replaceChildren();
    if (fit.requiredOptionIds.length) qualifications.append(node('h3', 'Required configuration'), node('p', fit.requiredOptionIds.map((id) => mixerOptions.find((o) => o.id === id)!.name).join(', ')));
    const critical = fit.caveatIds.filter((id) => !['provisional', 'published-rate'].includes(id));
    for (const id of critical) qualifications.append(node('p', CAVEAT_COPY[id], 'yardley-notice'));
    if (fit.questionIds.length) {
      qualifications.append(node('h3', 'Still to confirm'));
      const list = node('ul', '', 'yardley-open-questions');
      for (const id of fit.questionIds) list.append(node('li', QUESTION_COPY[id]));
      qualifications.append(list);
    }
    qualifications.append(node('p', CAVEAT_COPY['published-rate'], 'small muted'));
  }
  function showReview(): void {
    if (handoff.busy) { get('[data-handoff-status]').textContent = 'Wait for the current send to finish before revising the brief.'; return; }
    if (pending) { announce('Confirm or discard the suggested changes first.'); focusQuestion(); return; }
    invalidateConversation();
    review.hidden = false;
    renderReview();
    renderResults();
    get('#yardley-review-title').focus();
  }
  function renderReview(): void {
    const rows = get('[data-review-rows]');
    rows.replaceChildren();
    for (const row of briefRows(job)) {
      const group = node('div', '', 'yardley-review-row');
      group.append(node('dt', row.label), node('dd', row.value), button('Edit', () => edit(row.step)));
      group.querySelector('button')!.setAttribute('aria-label', `Change ${row.label.toLowerCase()} in brief`);
      rows.append(group);
    }
    get('[data-review-notes]').textContent = job.notes || 'No additional notes.';
    const fit = fitJob(job);
    const questions = get('[data-review-questions]');
    questions.replaceChildren(node('h3', 'Open questions for Paul'));
    const list = node('ul', '', 'yardley-open-questions');
    for (const id of fit.questionIds) list.append(node('li', QUESTION_COPY[id]));
    for (const text of job.openQuestions) list.append(node('li', text));
    if (!list.children.length) list.append(node('li', 'Confirm the machine, usable yield, chassis and configuration on the written quote.'));
    questions.append(list);
    renderHandoff();
  }
  function briefText(): string {
    const prepared = handoff.prepare(handoffDraft());
    return prepared.ok ? prepared.attempt.mail.text : formatYardleyBrief({ version: 1, job, fit: fitJob(job) });
  }
  function handoffDraft(): HandoffDraft {
    const fields = Object.fromEntries(new FormData(contactForm));
    const { website, ...contact } = fields;
    return { contact, brief: { version: 1, job: structuredClone(job) }, website: typeof website === 'string' ? website : '' };
  }
  function renderHandoff(): void {
    if (handoff.busy) return;
    const preferred = get<HTMLSelectElement>('#yardley-preferred-contact').value;
    get('[data-email-optional]').textContent = preferred === 'email' ? '' : '(optional)';
    get('[data-phone-optional]').textContent = preferred === 'email' ? '(optional)' : '';
    get<HTMLInputElement>('#yardley-contact-email').required = preferred === 'email';
    get<HTMLInputElement>('#yardley-contact-phone').required = preferred !== 'email';
    const prepared = handoff.prepare(handoffDraft());
    const alreadyAccepted = prepared.ok && prepared.alreadyAccepted;
    sendBrief.disabled = alreadyAccepted;
    sendBrief.textContent = alreadyAccepted ? 'This brief is submitted' : handoff.receipt ? 'Send my revised brief' : 'Send my reviewed brief';
    get('[data-handoff-state]').textContent = alreadyAccepted ? 'The submitted snapshot is in your receipt below.' : handoff.receipt ? 'You’re preparing a revised inquiry. The earlier submitted snapshot stays in your receipt below.' : 'Your brief has not been sent.';
    get('[data-email-preview]').hidden = !prepared.ok;
    get('[data-email-preview-help]').hidden = prepared.ok;
    get('[data-email-preview]').textContent = prepared.ok ? `Subject: ${prepared.attempt.mail.subject}\n\n${prepared.attempt.mail.text}` : '';
  }
  function setHandoffBusy(busy: boolean): void {
    get('[data-workspace]').inert = busy;
    contactFields.disabled = busy;
    for (const element of review.querySelectorAll<HTMLButtonElement>('[data-review-rows] button, [data-return], [data-copy]')) element.disabled = busy;
    sendBrief.disabled = busy;
    get<HTMLButtonElement>('[data-revise]').disabled = busy;
    contactForm.setAttribute('aria-busy', String(busy));
    if (busy) sendBrief.textContent = 'Sending your brief…';
  }
  function render(): void {
    announce('');
    renderExchange();
    renderSummary();
    renderQuestion();
    renderResults();
    get<HTMLButtonElement>('[data-back]').disabled = history.length === 0;
    get('[data-copy]').textContent = 'Copy my job brief';
    get('[data-copy-status]').textContent = '';
    if (!review.hidden) renderReview();
    else renderHandoff();
  }

  async function requestReply(input: ConversationInput): Promise<void> {
    setBusy(true);
    announce('Checking the job details…');
    let response: ConversationResponse | undefined;
    try { response = await transport.send(input); }
    catch (error) {
      response = scriptedConversation(input, error instanceof Error && error.message === 'session-limit' ? 'session-limit' : error instanceof Error && error.message === 'rate-limit' ? 'rate-limit' : 'provider');
    }
    if (!response) return;
    setBusy(false);
    retryInput = ['ok', 'session-limit', 'context-limit'].includes(response.reason) ? undefined : input;
    get('[data-retry-reply]').hidden = !retryInput;
    pending = Object.keys(response.proposal).length ? response.proposal : undefined;
    pendingText = input.message;
    if (!pending) editing = response.question ?? undefined;
    say('Yardley', response.reply, response.sources);
    const saved = !response.saveMessage || saveNote(input.message);
    review.hidden = true;
    render();
    get('[data-ai-mode]').textContent = response.mode === 'ai' ? 'AI mixer guide · connected' : 'AI mixer guide · guided mode';
    get('[data-connection-note]').textContent = response.mode === 'ai'
      ? 'AI helps interpret your message. Confirm suggested details before they affect your fit.'
      : response.reason === 'budget' ? 'AI has reached its spending limit. The guided choices and approved answers still work.'
        : response.reason === 'session-limit' ? 'This conversation has reached its AI turn limit. Continue with the guided choices or review your brief.'
          : response.reason === 'context-limit' ? 'The message and job history are too long for an AI reply. Continue with the guided choices or review your brief.'
          : 'AI is unavailable right now. Your answers are still here; the guided choices and approved answers still work.';
    focusQuestion();
    announce(saved ? pending ? 'Check the suggested details before confirming.' : 'Reply ready. Your job details are still editable.' : 'Reply ready. The notes are full; this message is in the recent conversation.');
  }

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (transport.busy) { announce('A reply is already in progress. You can cancel it or keep answering with the choices.'); return; }
    if (pending) { announce('Confirm or discard the suggested changes before adding another message.'); focusQuestion(); return; }
    const text = messageInput.value.trim();
    if (!text) { announce('Type a question or job detail, or use the quick choices above.'); messageInput.focus(); return; }
    if (/^(?:i\s*(?:don’t|don't|do not)\s*know|not sure|unsure|skip)[.!]?$/i.test(text) && currentStep()) {
      messageInput.value = '';
      skip();
      return;
    }
    invalidateConversation();
    checkpoint();
    const input: ConversationInput = {
      version: 2, requestId: crypto.randomUUID(), job: structuredClone(job), message: text,
      history: messages.slice(-6).map((message) => ({ role: message.who === 'You' ? 'user' : 'assistant', text: message.text.slice(0, 900) })),
      skipped: [...skipped], step: currentStep() ?? null,
    };
    messageInput.value = '';
    say('You', text);
    renderExchange();
    void requestReply(input);
  });
  const onDraftChange = () => {
    const wasBusy = transport.busy;
    invalidateConversation();
    if (wasBusy) announce('Reply canceled because you’re changing job details. Your draft answer is still here.');
  };
  question.addEventListener('input', onDraftChange);
  question.addEventListener('change', onDraftChange);
  get('[data-cancel-reply]').addEventListener('click', () => {
    invalidateConversation();
    announce('Reply canceled. Your current answers and recent message are still here.');
  });
  get('[data-retry-reply]').addEventListener('click', () => {
    if (transport.busy || !retryInput) return;
    const input = { ...retryInput, requestId: crypto.randomUUID(), job: structuredClone(job), skipped: [...skipped], step: currentStep() ?? null };
    void requestReply(input);
  });
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.requestSubmit(); }
  });
  get('[data-type]').addEventListener('click', (event) => { event.preventDefault(); messageInput.focus(); });
  notesInput.addEventListener('input', () => {
    invalidateConversation();
    const parsed = parseYardleyJob({ ...job, notes: notesInput.value });
    if (parsed.ok) { job = parsed.job; if (!review.hidden) renderReview(); }
    renderHandoff();
  });
  get('[data-back]').addEventListener('click', () => {
    invalidateConversation();
    const previous = history.pop();
    if (!previous) return;
    job = previous.job; skipped = new Set(previous.skipped); editing = previous.editing; messages = previous.messages;
    pending = undefined; pendingText = ''; review.hidden = true;
    render(); focusQuestion(); announce('Previous answer restored.');
  });
  get('[data-reset]').addEventListener('click', () => { get('[data-reset-confirm]').hidden = false; get<HTMLButtonElement>('[data-reset-no]').focus(); });
  get('[data-reset-no]').addEventListener('click', () => { get('[data-reset-confirm]').hidden = true; get('[data-reset]').focus(); });
  get('[data-reset-yes]').addEventListener('click', () => {
    invalidateConversation();
    job = emptyJob(); skipped = new Set(); editing = undefined; pending = undefined; pendingText = ''; messages = []; history.length = 0;
    notesInput.value = ''; messageInput.value = ''; review.hidden = true; get('[data-reset-confirm]').hidden = true;
    render(); focusQuestion(); announce('Fresh job started.');
  });
  get('[data-review]').addEventListener('click', showReview);
  get('[data-return]').addEventListener('click', () => { review.hidden = true; focusQuestion(); });
  get('[data-revise]').addEventListener('click', () => { showReview(); get('[data-handoff-status]').textContent = 'Change your job or contact details, then review the revised email before sending.'; });
  contactForm.addEventListener('input', () => {
    get('[data-handoff-status]').textContent = '';
    for (const element of contactForm.querySelectorAll<HTMLElement>('[data-handoff-error]')) { element.hidden = true; element.textContent = ''; }
    for (const element of contactForm.querySelectorAll('[aria-invalid]')) { element.removeAttribute('aria-invalid'); element.removeAttribute('aria-describedby'); }
    renderHandoff();
  });
  contactForm.addEventListener('change', renderHandoff);
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (handoff.busy) return;
    if (pending) { get('[data-handoff-status]').textContent = 'Confirm or discard the suggested job details before sending.'; return; }
    const draft = handoffDraft();
    const prepared = handoff.prepare(draft);
    if (!prepared.ok) {
      get('[data-handoff-status]').textContent = 'Check the highlighted contact details before sending.';
      let first: HTMLElement | undefined;
      for (const element of contactForm.querySelectorAll<HTMLElement>('[data-handoff-error]')) {
        const error = prepared.errors.find((entry) => entry.field === element.dataset.handoffError);
        element.hidden = !error; element.textContent = error?.message ?? '';
        const input = element.previousElementSibling as HTMLInputElement | null;
        if (input && error) {
          element.id = `yardley-error-${element.dataset.handoffError!.replace('.', '-')}`;
          input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', element.id); first ??= input;
        }
      }
      first?.focus(); return;
    }
    invalidateConversation();
    setHandoffBusy(true);
    get('[data-handoff-status]').textContent = 'Sending the reviewed snapshot to Paul…';
    try {
      const receipt = await handoff.submit(draft);
      if (!receipt) return;
      get('[data-receipt-panel]').hidden = false;
      get('[data-receipt-reference]').textContent = `Reference: ${receipt.submissionId}`;
      get('[data-receipt-text]').textContent = `Subject: ${receipt.subject}\n\n${receipt.text}`;
      get('[data-handoff-status]').textContent = 'The email service accepted your reviewed brief. Your submitted snapshot is below.';
      get('#yardley-receipt-title').focus();
    } catch (error) {
      get('[data-handoff-status]').textContent = error instanceof HandoffError ? error.message : 'We could not confirm the send. Retry the same brief or call Paul.';
    } finally { setHandoffBusy(false); renderHandoff(); }
  });
  let copying = false;
  get('[data-copy]').addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    const copyButton = get<HTMLButtonElement>('[data-copy]');
    copyButton.disabled = true;
    // Snapshot before the asynchronous clipboard operation; no stale UI or network response.
    const brief = briefText();
    const copiedJob = job;
    try {
      await navigator.clipboard.writeText(brief);
      get('[data-copy-status]').textContent = job === copiedJob ? 'Current job brief copied.' : 'An earlier version was copied. Copy again to include your latest changes.';
      if (job === copiedJob) copyButton.textContent = 'Brief copied ✓';
    }
    catch { get('[data-copy-status]').textContent = 'Copy was blocked by your browser. Your brief is still here; select and copy the review text, or call Paul.'; }
    finally { copying = false; copyButton.disabled = false; }
  });
  const mobile = window.matchMedia('(max-width: 900px)');
  summary.open = !mobile.matches;
  // Disclosure remains under the visitor’s control after the initial responsive default.
  get('[data-workspace]').hidden = false;
  render();
}
