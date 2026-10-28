# Yardley verification log

## Stage 1 — October 28, 2026

Story: the shared manufacturer data supplies the StarMix lineup and existing
guide plates, so each surface shows consistent US figures and the correct machine
image. The new option catalog prepares the recommendation constraints for stage 2.

### Checks completed

- `npm run build`: passed, including prerendered marketing pages and Vercel
  function output. The build warns that local Node 26 differs from the deployment's
  Node 24. Deployment-runtime verification remains a later release check.
- Data assertions: six distinct model IDs with the approved bin/rate pairs;
  740 K displays 10 yd³ and 60 yd³/hr; no sheet-range field remains; each of the
  six local images decodes and matches its declared dimensions and model alt text.
- Catalog assertions: all eight distinct options; latex and chopper support
  exactly 740 K/750 L/850 S/880 S and exclude 327 K/425 S; additional bin is a
  special addition on all six; DCC is standard on the five truck models; feeder
  combinations, unknown IDs and unspecified combinations remain unconfirmed.
  Chopper prerequisites retain high-volume air and the conditional extra tank.
- Application assertions: all six stable slugs remain, each with guide-specific
  followup questions and quantity guidance. Public card copy is unchanged.
- Existing guide compatibility: 360 combinations across six applications, five
  quantity bands, four frequency bands and three chassis answers still produce
  valid, distinct primary/alternate IDs and scripted copy without the old range
  statement. This checks migration continuity, not the correctness of the old
  recommendation policy; the policy is being replaced in stage 2.
- Source scan: no remaining `model.sheet`, `rangeOnPlate`, `data-range-note` or
  obsolete public 740 K “not published” statement in `src/`.
- `git diff --check`: passed. Existing Cursor changes were preserved.
- Browser at `http://127.0.0.1:4321/starmix/`: all six model photos loaded,
  the 740 K plate shows the corrected values, and no browser errors were captured.
  The existing `/job/` page initializes with its six application choices and no
  captured browser errors. [Model photo screenshot](screenshots/yardley-models-stage1.jpg).

### Scope and remaining checks

The current guide does not yet consume option-catalog restrictions. Do not treat
the new data as proof that the MVP's recommendations enforce latex/chopper rules.
The stage 2 fitter and its regression tests must establish that behavior before
release. Stage 3 introduces the Yardley interface; stage 4 connects conversation
and the approved monthly budget.

No live lead was submitted, no email was sent, and no Gateway/account/DNS settings
were changed in stage 1. Provider logging, spend controls, unknown-quantity flows,
new fitting policy, full mobile accessibility and preview/production integration
remain explicit later-stage checks. The existing 360px header issue is tracked
for the isolated responsive repair in stage 3.
