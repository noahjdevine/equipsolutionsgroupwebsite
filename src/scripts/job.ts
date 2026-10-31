import { applications } from '../data/applications';
import { fitJob } from '../data/fit';
import { CAVEAT_COPY, QUESTION_COPY, REASON_COPY } from '../data/guide';
import { models, modelById, binDisplay, productionDisplay, mountLabel } from '../data/models';
import { mixerOptions } from '../data/options';
import { MIX_TYPES, emptyJob, parseYardleyJob, reported, type YardleyJob } from '../data/yardley-job';
import { calculateVolume, type VolumeInput } from '../lib/yardley/volume';
import { applyJobPatch, confirmPatch, formatQuantity, nextStep, proposeFromText, quantityLabel, STEP_TITLES, summaryRows, type IntakeStep, type JobPatch } from '../lib/yardley/intake';

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
  let job = emptyJob();
  let skipped = new Set<IntakeStep>();
  let editing: IntakeStep | undefined;
  let pending: JobPatch | undefined;
  let pendingText = '';
  let messages: { who: 'You' | 'Yardley'; text: string }[] = [];
  type Checkpoint = { job: YardleyJob; skipped: IntakeStep[]; editing?: IntakeStep; messages: typeof messages };
  const history: Checkpoint[] = [];
  const currentStep = () => editing ?? nextStep(job, skipped);
  const checkpoint = () => {
    history.push({ job: structuredClone(job), skipped: [...skipped], editing, messages: [...messages] });
    if (history.length > 24) history.shift();
  };
  const say = (who: 'You' | 'Yardley', text: string) => { messages.push({ who, text }); messages = messages.slice(-8); };
  const announce = (text: string) => { status.textContent = text; };

  function focusQuestion(): void {
    question.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    question.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  function commit(patch: JobPatch, userLine: string, reply: string, markAnswered = true): boolean {
    const parsed = applyJobPatch(job, patch);
    if (!parsed.ok) { announce(parsed.errors.some((e) => e.field === 'notes') ? 'The brief notes are full. Shorten them in your summary so the daily total can be kept alongside this placement quantity.' : 'Please check that answer. Positive quantities and the stated units are required. Your saved details are still here.'); return false; }
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
      for (const msg of messages.slice(0, -1)) {
        const item = node('div', '', `yardley-message${msg.who === 'You' ? ' yardley-message--you' : ''}`);
        item.append(node('span', msg.who, 'yardley-label'), node('p', msg.text));
        transcript.append(item);
      }
      const latest = node('div', '', 'yardley-message');
      latest.append(node('span', 'Yardley', 'yardley-label'), node('p', messages.at(-1)!.text));
      exchange.append(transcript, latest);
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
    const before = summaryRows(job);
    const list = node('ul', '', 'yardley-proposals');
    for (const row of summaryRows(proposed)) {
      if (before.find((old) => old.label === row.label)?.value !== row.value && row.value !== 'Not sure yet') list.append(node('li', `${row.label}: ${row.value}`));
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
      for (const subtype of [...new Set(types)]) chips.append(button(subtype, () => { text.value = subtype; text.focus(); }, 'yardley-chip'));
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
    if (pending) { announce('Confirm or discard the suggested changes first.'); focusQuestion(); return; }
    review.hidden = false;
    renderReview();
    renderResults();
    get('#yardley-review-title').focus();
  }
  function renderReview(): void {
    const rows = get('[data-review-rows]');
    rows.replaceChildren();
    for (const row of summaryRows(job)) {
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
  }
  function briefText(): string {
    const fit = fitJob(job);
    const lines = ['Yardley — job brief for Paul', 'Provisional discussion only. Nothing has been sent.', '', ...summaryRows(job).map((row) => `${row.label}: ${row.value}`)];
    if (job.quantity.kind === 'dimensions') {
      const estimate = calculateVolume(job.quantity.inputs);
      if (estimate.ok) lines.push(`Dimensions: ${JSON.stringify(estimate.estimate.inputs)}`, `Calculation: ${estimate.estimate.formula}; no waste allowance added.`);
    }
    lines.push('', `Notes: ${job.notes || 'None'}`, '', `Status: ${fit.status}`, `Provisional machine: ${fit.primaryId ? modelById(fit.primaryId)!.name : 'Pending clarification / configuration review'}`, `Compare: ${fit.alternateId ? modelById(fit.alternateId)!.name : 'None yet'}`, ...fit.reasonIds.map((id) => REASON_COPY[id]), ...fit.caveatIds.map((id) => CAVEAT_COPY[id]), ...fit.questionIds.map((id) => `Open: ${QUESTION_COPY[id]}`), ...job.openQuestions.map((text) => `Open: ${text}`));
    return lines.join('\n');
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
  }

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending) { announce('Confirm or discard the suggested changes before adding another message.'); focusQuestion(); return; }
    const text = messageInput.value.trim();
    if (!text) { announce('Type a question or job detail, or use the quick choices above.'); messageInput.focus(); return; }
    if (/^(?:i\s*(?:don’t|don't|do not)\s*know|not sure|unsure|skip)[.!]?$/i.test(text) && currentStep()) {
      messageInput.value = '';
      skip();
      return;
    }
    const notes = [job.notes, text].filter(Boolean).join('\n');
    if (notes.length > 2000) { announce('Your brief notes are full. Shorten them in the job summary before adding more. Your message is still here.'); return; }
    checkpoint();
    job = { ...job, notes };
    notesInput.value = notes;
    messageInput.value = '';
    say('You', text);
    if (/^(?:i\s*(?:don’t|don't|do not)\s*know|not sure|unsure|skip)[.!]?$/i.test(text)) {
      if (currentStep()) skipped.add(currentStep()!);
      editing = undefined;
      say('Yardley', 'That’s fine. I’ll keep it open for Paul. You can change any answer in your summary.');
    } else {
      const patch = proposeFromText(text, currentStep());
      if (Object.keys(patch).length) {
        pending = patch;
        pendingText = text;
        say('Yardley', 'I’ve picked out a few details. Check them before I use them.');
      } else {
        const mentioned = models.filter((model) => text.toLowerCase().includes(model.name.toLowerCase()) || text.toLowerCase().includes(model.id.replace('-', '')));
        const response = mentioned.length ? mentioned.slice(0, 2).map((m) => `${m.name}: ${binDisplay(m)} bin, ${productionDisplay(m)}, ${mountLabel(m).toLowerCase()}.`).join(' ') + ' These are published machine figures; Paul confirms job suitability and options.'
          : /\b(bin|capacity|production|rate)\b/i.test(text) ? 'Bin capacity describes material carried; production describes mixing pace. Neither alone guarantees placement output. Your crew, mix, feed equipment and replenishment matter too.'
            : 'I’ve kept that in your notes for Paul. In guided mode I can recognize simple job details, but I may need the choices below to understand the rest. You can leave anything uncertain open.';
        say('Yardley', response);
      }
    }
    review.hidden = true;
    render();
    focusQuestion();
  });
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.requestSubmit(); }
  });
  get('[data-type]').addEventListener('click', (event) => { event.preventDefault(); messageInput.focus(); });
  notesInput.addEventListener('input', () => {
    const parsed = parseYardleyJob({ ...job, notes: notesInput.value });
    if (parsed.ok) { job = parsed.job; if (!review.hidden) renderReview(); }
  });
  get('[data-back]').addEventListener('click', () => {
    const previous = history.pop();
    if (!previous) return;
    job = previous.job; skipped = new Set(previous.skipped); editing = previous.editing; messages = previous.messages;
    pending = undefined; pendingText = ''; review.hidden = true;
    render(); focusQuestion(); announce('Previous answer restored.');
  });
  get('[data-reset]').addEventListener('click', () => { get('[data-reset-confirm]').hidden = false; get<HTMLButtonElement>('[data-reset-no]').focus(); });
  get('[data-reset-no]').addEventListener('click', () => { get('[data-reset-confirm]').hidden = true; get('[data-reset]').focus(); });
  get('[data-reset-yes]').addEventListener('click', () => {
    job = emptyJob(); skipped = new Set(); editing = undefined; pending = undefined; pendingText = ''; messages = []; history.length = 0;
    notesInput.value = ''; messageInput.value = ''; review.hidden = true; get('[data-reset-confirm]').hidden = true;
    render(); focusQuestion(); announce('Fresh job started.');
  });
  get('[data-review]').addEventListener('click', showReview);
  get('[data-return]').addEventListener('click', () => { review.hidden = true; focusQuestion(); });
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
      get('[data-copy-status]').textContent = job === copiedJob ? 'Job brief copied. Your details have not been sent.' : 'An earlier version was copied. Copy again to include your latest changes.';
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
