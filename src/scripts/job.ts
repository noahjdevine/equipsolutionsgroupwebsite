/**
 * Page behavior for /job/ only. The shortlist comes from fit.ts.
 * This file does not choose a unit and does not write spec figures into the plates.
 */

import { fitModel, type GuideAnswers } from '../data/fit';
import { scriptedClose } from '../data/guide';

const BEATS = ['work', 'pour', 'week', 'chassis'] as const;
const PHONE = '+1 515 720 0800';

function withPhone(message: string): string {
  if (message.includes('515')) return message;
  return `${message.replace(/\s*$/, '')} Call ${PHONE}.`;
}

export function startGuide(): void {
  const root = document.querySelector<HTMLElement>('[data-guide]');
  if (!root || root.getAttribute('data-ready') === 'true') return;
  root.setAttribute('data-ready', 'true');

  const beats = BEATS.map((name) => root.querySelector<HTMLElement>(`[data-beat="${name}"]`)).filter(
    (el): el is HTMLElement => Boolean(el),
  );
  const close = root.querySelector<HTMLElement>('[data-close]');
  const said = root.querySelector<HTMLElement>('[data-said]');
  const progress = root.querySelector<HTMLElement>('[data-progress]');
  const back = root.querySelector<HTMLButtonElement>('[data-back]');
  const note = root.querySelector<HTMLElement>('[data-note]');
  const grid = root.querySelector<HTMLElement>('[data-plate-grid]');
  const form = root.querySelector<HTMLFormElement>('[data-guide-form]');
  if (!close || !said || !progress || !back || !note || !grid || !form || beats.length !== 4) return;

  const live = form.querySelector<HTMLElement>('.form-live');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  let step = 0;
  let noteReq = 0;

  function bind(name: string): HTMLInputElement | null {
    return form!.querySelector<HTMLInputElement>(`[data-bind="${name}"]`);
  }

  function answers(): GuideAnswers | null {
    const applicationSlug = bind('work')?.value || '';
    const pourSizeYd3 = bind('pour')?.value || '';
    const poursPerWeek = bind('week')?.value || '';
    const chassis = bind('chassis')?.value || '';
    if (!applicationSlug || !pourSizeYd3 || !poursPerWeek || !chassis) return null;
    const mixTypes = Array.prototype.map
      .call(form!.querySelectorAll<HTMLInputElement>('[name="mixTypes"]:checked'), (input: HTMLInputElement) => input.value)
      .filter((value: string) =>
        ['standard', 'rapid-set', 'latex-modified', 'shotcrete-gunite', 'fiber-reinforced', 'other'].includes(value),
      );
    return {
      applicationSlug,
      pourSizeYd3: pourSizeYd3 as GuideAnswers['pourSizeYd3'],
      poursPerWeek: poursPerWeek as GuideAnswers['poursPerWeek'],
      chassis: chassis as GuideAnswers['chassis'],
      mixTypes: mixTypes as GuideAnswers['mixTypes'],
    };
  }

  function showSaid(text: string): void {
    if (!text) {
      said!.hidden = true;
      said!.textContent = '';
      return;
    }
    said!.hidden = false;
    said!.textContent = text;
  }

  function focusHeading(scope: ParentNode): void {
    const heading = scope.querySelector<HTMLElement>('h2');
    if (heading) heading.focus();
  }

  function showBeat(index: number, keepSaid = false, moveFocus = true): void {
    step = index;
    close!.hidden = true;
    beats.forEach((beat, i) => {
      beat.hidden = i !== index;
    });
    progress!.hidden = false;
    progress!.textContent = String(index + 1).padStart(2, '0');
    back!.hidden = index === 0;
    if (!keepSaid) {
      const pressed = beats[index].querySelector<HTMLElement>('[aria-pressed="true"]');
      showSaid(pressed?.getAttribute('data-line') || '');
    }
    if (moveFocus) focusHeading(beats[index]);
  }

  function renderShortlist(): void {
    const job = answers();
    if (!job) return;
    const result = fitModel(job);
    const plates = Array.prototype.slice.call(
      grid!.querySelectorAll<HTMLElement>('[data-model-plate]'),
    ) as HTMLElement[];
    plates.forEach((plate) => {
      plate.hidden = true;
    });
    const order = [result.primaryId, result.alternateId].filter((id): id is string => Boolean(id));
    order.forEach((id, index) => {
      const plate = grid!.querySelector<HTMLElement>(`[data-model-plate="${id}"]`);
      if (!plate) return;
      const role = plate.querySelector<HTMLElement>('[data-plate-role]');
      if (role) role.textContent = index === 0 ? 'Start here' : 'Also';
      plate.hidden = false;
      grid!.appendChild(plate);
    });
    note!.textContent = scriptedClose(job, result);
    const requestId = ++noteReq;
    fetch('/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(job),
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then((result) => {
        if (requestId !== noteReq || !result.ok) return;
        const next = result.body && typeof result.body.note === 'string' ? result.body.note.trim() : '';
        if (next) note!.textContent = next;
      })
      .catch(() => {
        /* The scripted paragraph is already on the page. */
      });
  }

  function openClose(): void {
    beats.forEach((beat) => {
      beat.hidden = true;
    });
    progress!.hidden = true;
    said!.hidden = true;
    close!.hidden = false;
    back!.hidden = false;
    renderShortlist();
    focusHeading(close!);
  }

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('[data-back]')) {
      if (!close!.hidden) {
        showBeat(BEATS.length - 1);
        return;
      }
      if (step > 0) showBeat(step - 1);
      return;
    }

    const choice = target.closest<HTMLButtonElement>('[data-choice]');
    if (!choice || !root.contains(choice)) return;
    const beat = choice.closest<HTMLElement>('[data-beat]');
    if (!beat) return;
    const name = beat.getAttribute('data-beat') || '';
    const field = bind(name);
    if (field) field.value = choice.getAttribute('data-value') || '';
    beat.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => {
      button.setAttribute('aria-pressed', button === choice ? 'true' : 'false');
    });
    showSaid(choice.getAttribute('data-line') || '');
    const index = BEATS.indexOf(name as (typeof BEATS)[number]);
    if (index < 0) return;
    step = index;
    if (index < BEATS.length - 1) showBeat(index + 1, true);
    else openClose();
  });

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== 'mixTypes') return;
    if (!close!.hidden) renderShortlist();
  });

  function clearErrors(): void {
    form!.querySelectorAll<HTMLElement>('.field-error').forEach((el) => {
      el.hidden = true;
      el.textContent = '';
    });
    form!.querySelectorAll<HTMLElement>('[aria-invalid]').forEach((el) => {
      el.removeAttribute('aria-invalid');
    });
    if (live) {
      live.className = 'form-live';
      live.textContent = '';
    }
  }

  function showErrors(errors: { field: string; message: string }[]): void {
    let first: HTMLElement | null = null;
    errors.forEach((err) => {
      const el = form!.querySelector<HTMLElement>(`[data-error-for="${err.field}"]`);
      if (el) {
        el.hidden = false;
        el.textContent = err.field === 'form' ? withPhone(err.message) : err.message;
        if (!first) first = el;
      }
      const field = form!.querySelector<HTMLElement>(`[name="${err.field}"]`);
      if (field) field.setAttribute('aria-invalid', 'true');
    });
    if (live) {
      live.className = 'form-live form-live--error';
      const message = (errors[0] && errors[0].message) || 'The request could not be sent. Call or email instead.';
      live.textContent = errors.some((err) => err.field === 'form') ? withPhone(message) : message;
    }
    if (first) {
      const focusable = first.parentElement?.querySelector<HTMLElement>('input, select, textarea');
      if (focusable) focusable.focus();
    }
  }

  function payload(): Record<string, unknown> {
    const data = new FormData(form!);
    const out: Record<string, unknown> = {};
    data.forEach((value, key) => {
      if (typeof value !== 'string') return;
      if (key === 'mixTypes') {
        if (!Array.isArray(out.mixTypes)) out.mixTypes = [];
        (out.mixTypes as string[]).push(value);
        return;
      }
      out[key] = value;
    });
    return out;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    if (submit) {
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
    }
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload()),
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then((result) => {
        if (result.body && result.body.ok === true) {
          if (live) {
            live.className = 'form-live form-live--ok';
            live.textContent = 'Request sent. Paul follows up within one business day.';
          }
          form!.querySelectorAll('fieldset').forEach((fieldset) => {
            fieldset.disabled = true;
          });
          if (submit) submit.hidden = true;
          return;
        }
        const errors = (result.body && result.body.errors) || [
          { field: 'form', message: 'The request could not be sent. Call or email instead.' },
        ];
        showErrors(errors);
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute('aria-busy');
        }
      })
      .catch(() => {
        showErrors([{ field: 'form', message: 'The request could not be sent. Call or email instead.' }]);
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute('aria-busy');
        }
      });
  });

  showBeat(0, false, false);
}
