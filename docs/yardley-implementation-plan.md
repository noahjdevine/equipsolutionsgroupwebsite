# Yardley — implementation checklist

Updated: October 28, 2026. Owner: Equip Solutions Group. Applies to the local
Astro repository used by both Codex and Cursor.

## Status and working order

This is the authoritative implementation checklist. `AGENTS.md` carries the
standing project rules; this document carries decisions, tasks and acceptance
criteria. Earlier review canvases provide background, not a separate task list.
Checked items are complete; unchecked items are planned. Proposed new filenames
below are intentional and do not imply that those modules already exist.

- [x] Inspect the existing guide, fitting logic, lead flow and shared entry points.
- [x] Record the approved product direction, source precedence and option rules.
- [x] Publish this file-by-file checklist in the repository and link it from the
  project instructions and README.
- [x] 1. Reconcile model facts, options and manufacturer images.
- [x] 2. Build validated job state, quantity estimates and deterministic fitting.
- [ ] 3. Build the Yardley interface and entry points using scripted responses.
- [ ] 4. Connect grounded conversation and enforce spend controls.
- [ ] 5. Complete the visitor-reviewed handoff to Paul.
- [ ] 6. Verify the full flow locally and in a Vercel preview, then release.

Stages 1 and 2 are implemented locally: sourced model/options/image data, validated
version-1 job state, customer-dimension estimates and deterministic fit with option,
mount and rate constraints. The existing page uses a transitional adapter; the
new conversation interface, AI connection, budget settings and full reviewed-brief
submission remain pending. The guide endpoint is deliberately scripted until
stage 4 so generated prose cannot remove authoritative qualifications. These
stages form a feature-branch review checkpoint; production release remains pending.
Evidence is recorded in [the verification log](yardley-verification.md).

Work in this order, with a reviewable diff and relevant checks at each stage.
Preserve the existing uncommitted Cursor work; do not reset or replace it wholesale.
Update this checklist with completed work, actual filenames, checks and outstanding
questions after each stage. Explain a multi-file stage before starting it, following
the project working agreement.

## Approved product decisions

- **Identity:** Yardley, an AI mixer guide. Practical, approachable and lightly
  witty; short explanations without pretending to be Paul. Paul makes the final
  equipment/configuration recommendation after a conversation with the customer.
- **Placement:** a visible introduction immediately below the homepage hero and
  on `/starmix/`; the full experience at `/job/`; a link in the mixer quote branch.
  Quote and Call remain the primary conversion actions. No third hero button.
- **Interaction:** quick choices plus an always-available text box. Support
  buttons alone, typing alone where practical, or both. Include “I don't know,”
  editable answers and a persistent job summary. Skip questions already answered.
- **Personality/design:** text first, optional small static identity mark; no
  voice, unsolicited popup, bouncing avatar, fake typing delays or attention loop.
  Preserve the existing sharp corners, type, slash motif and color tokens.
- **Audience/scope:** US mixer buyers, including beginners; English initially.
  Explain terms and close model comparisons. Reuse the six application slugs;
  allow several work types and subtypes without creating a competing taxonomy.
- **Decision ownership:** code selects the provisional machine and at most one
  alternate. It may instead request clarification or configuration review. Never
  force a recommendation when the available evidence does not support one.
- **Knowledge:** structured model/option records and a small reviewed FAQ first.
  No vector database, document ingestion service or live web search in release 1.
- **Model/budget:** planned Gateway model `openai/gpt-6-luna`; verify the model ID,
  availability and current pricing during connection. Approved AI spend is $20
  per month. This is separate from hosting and email costs. Budget enforcement
  must be configured and tested; writing a number into `.env` is insufficient.
- **Privacy/handoff:** temporary conversation state in memory; no application-side
  transcript persistence. Send the visitor-reviewed job brief, not the whole chat.
  Check provider logging/retention independently before making a privacy claim.

## Source decisions and configuration constraints

### Model figures

Use the manufacturer's US website as requested. Keep the six model records;
the current 327 K record represents the towable variant. Record source URLs,
review dates and unresolved discrepancies alongside the data.

- 880 S: 11 yd³ bin, 90 yd³/hr average production.
- 850 S: 11 yd³, 60 yd³/hr.
- 750 L: 10 yd³, 60 yd³/hr.
- 425 S: 5.5 yd³, 30 yd³/hr. The detail page says 32.7 and the sheet says 27.3;
  retain the established US lineup value of 30 pending manufacturer clarification.
- 327 K Towable: 4 yd³, 30 yd³/hr. Sheet values of 3.2 and 27.3 do not override it.
- 740 K: **10 yd³, 60 yd³/hr**, now published on its US page. Replace the old null
  values and guide-only 9–10 yd³ sheet range in the data stage, everywhere they render.

Do not convert manufacturer specifications or import metric 880 S production
figures into the US records. Keep component measurements in their published units.
The sheet's sand/stone 40/60 split is not a pair of bin capacities. The 740 K
website describes a polyethylene water tank; prefer that over the sheet's
polypropylene wording. Do not carry inconsistent sheet gallon conversions forward.

Primary source links:

- [US model lineup](https://starmixindustries.com/)
- [740 K](https://starmixindustries.com/740k)
- [425 S detail — conflicting rate](https://starmixindustries.com/425s)
- [880 S](https://starmixindustries.com/880s)
- [Model sheet, MODELS tab](https://docs.google.com/spreadsheets/d/1rHeBfTZXonYS4VTIg8LlNDiCS9K-lQL8/edit#gid=219888115)
- [Model sheet, OPTIONS tab](https://docs.google.com/spreadsheets/d/1rHeBfTZXonYS4VTIg8LlNDiCS9K-lQL8/edit#gid=1733816358)

### Options — confirmed by the owner October 28

- **Latex:** eligible base models are **740 K, 750 L, 850 S and 880 S**. Exclude
  327 K and 425 S from both primary and alternate when latex is required.
- **Fiber chopper:** the **same four models** are eligible: **740 K, 750 L,
  850 S and 880 S**. It requires high-volume air; an additional truck air tank
  **may** be required. Do not invent an air flow, pressure or tank specification.
- Apply these constraints before ranking, even for a tiny job or a light week.
  If mounting or other requirements conflict, request configuration review;
  never silently relax a required capability.
- **Fiber feeder** is a separate option. Do not apply the chopper exclusion to it
  without evidence. Distinct polymer requirements also need their own confirmation.
- **Additional cement/flyash bin:** a special addition available for any model,
  not standard equipment. The sheet lists 1.5 tons. Keep it separate from the
  base cement hopper and treat truck/trailer integration as part of final review.
- Other combinations remain unconfirmed unless supported by the website, sheet
  or owner. Missing compatibility information means “confirm,” not “unavailable.”

Capture all eight OPTIONS entries, with source cells and unchanged units:
additional high-flow admix (20 gallons, flow 0–100, unit unspecified), additional
low-flow admix (20 gallons, flow 0–20, unit unspecified), fiber feeder (20 pounds),
fiber chopper (no rate stated), powder color (A-36 carbon steel, epoxy coated),
latex/polymer (1,000 liters), cement/flyash bin (1.5 tons), and DCC. DCC's sheet
features include up to 200 mix designs, calibration/production reports, material
consumption, history, Bluetooth and ticket printing. Distinguish standard DCC on
the five truck records from the 327 K's recorded controls; do not sell a standard
feature as an extra. These are catalog facts, not proof of every configuration.

## 1. Model facts, options and images

- [x] **`src/data/models.ts` — existing.** Correct 740 K to the approved US
  figures; remove its obsolete range-based presentation. Add source metadata,
  explicit variant identity and image references. Keep one source of truth for
  all six models, their mounts, published components and attributed claims.
  Preserve null/unknown for genuinely unpublished details. Do not add a seventh
  Mobile variant without deciding the sales scope.
- [x] **`src/data/options.ts` — new.** Add the eight sourced option records,
  standard/optional/special-addition/unconfirmed status where established,
  compatibility evidence, prerequisites and exact model IDs. Encode the shared
  latex/chopper set once so UI, fitting and lead validation cannot drift.
- [x] **`src/data/applications.ts` — existing.** Preserve all six slugs and
  existing anchors. Add guide-specific prompts/subtypes and relevant mix/process
  questions without changing unrelated public card copy incidentally.
- [x] **`public/assets/img/starmix/` — new assets.** Use the authorized
  manufacturer model photographs; match model and variant, including the towable.
  Save optimized local assets with dimensions and useful alt text. Keep an image
  source manifest at **`docs/yardley-sources.md` — new**, together with fact
  discrepancies, source dates and the owner-confirmed option rules. Do not
  substitute a generic AI image for an actual machine.
- [x] **`src/pages/starmix.astro` — existing, data presentation pass.** Read
  updated shared values and replace applicable model placeholders. Remove the
  obsolete “not published” treatment for 740 K. Keep the page's established
  manufacturer attribution and disclaimer.
- [x] **`src/pages/job.astro` / `src/scripts/job.ts` — existing, compatibility
  pass only.** Remove any obsolete range note so the current guide stays usable
  while the fuller interface is being built. Do not leave the public table and
  guide showing different 740 K figures.

Implementation also updates `src/data/fit.ts` and `src/data/guide.ts` to remove
obsolete range fallbacks/copy, and `src/styles/site.css` for responsive model images.
This is a compatibility pass, not the stage 2 fitting rewrite.

**Done when:** every model figure has a source, all eight options are represented,
the two restricted options share the exact approved eligibility set, correct
images are identified, and no public surface retains the obsolete 740 K range.

## 2. Job state, estimates and deterministic recommendations

- [x] **`src/data/yardley-job.ts` — new.** Define shared serializable types,
  runtime validation and a versioned request contract independent of email and
  AI libraries. Capture work types, mix/process, required options, known or
  estimated quantity, dimensions, placement window, replenishment, weekly use,
  mounting preference, timeline and open questions. Distinguish customer-reported,
  calculated, proposed-for-confirmation and unknown values. Validate numbers,
  enum values, lengths and allowed units; never turn unknown into zero.
- [x] **`src/lib/yardley/volume.ts` — new.** Pure geometry functions for supported
  simple shapes. For rectangular work, use supplied feet × feet × inches / 324
  to estimate yd³. Require the specified thickness; assume neither thickness
  nor waste allowance. Return inputs, units and calculation provenance. This
  estimates a customer's job; it never converts a manufacturer model spec.
- [x] **`src/data/fit.ts` — existing.** Consume validated job state. Filter hard
  option/mount constraints before ranking; “not sure” must not mean truck-only.
  Return ready/needs-clarification/configuration-review status, primary and
  optional alternate, reason IDs, caveats and missing information. Separate
  total job volume, possible replenishment and required sustained placement
  rate. Never promise a single load from the old under-5 or 5–10 ranges. Weekly
  job count alone must not force an 880 S. Do not force a candidate when filters
  leave none. Use the same logic in browser preview and authoritative server work.
- [x] **`src/data/guide.ts` — existing.** Replace Paul's impersonated scripted
  lines with Yardley's concise question/help/confirmation/fallback copy. Map fit
  reason IDs to approved explanations and comparison text. Keep required caveats,
  model identity and spec values controlled by application data.
- [x] **`src/data/lead.ts` — existing, contract preparation.** Add a distinct
  versioned Yardley brief while preserving legacy quote-form validation. Do not
  force missing guide information into old required fields or create a runtime
  import cycle between fit, job schema and lead formatting.
- [x] **`package.json` / `package-lock.json` / `tsconfig.json` — existing.** Add
  the smallest suitable type-check/test setup compatible with this Astro project
  and deployment runtime. Inspect installed tooling before choosing dependencies.
  Keep scripts documented; avoid a UI framework or general app rewrite.
- [x] **`tests/yardley/volume.test.ts` — new.** Verify units, known geometric
  examples, zero/negative/nonfinite input, missing thickness, and estimate labels.
- [x] **`tests/yardley/fit.test.ts` — new.** Verify capacity boundaries, reload
  caveats, explicit/unknown mounting, mixed work, required latex/chopper exclusion
  for both recommendation slots, conflicting constraints, empty candidate sets,
  and no automatic maximum-model upsell from frequency alone.

Stage 2 also adds `tests/yardley/job.test.ts`, `lead.test.ts`, `api.test.ts` and
shared `fixtures.ts`. Zod validates the runtime contract; TypeScript checks TS
modules; Node's test runner with `tsx` runs the tests. The existing page/script
have minimal adapter/copy changes, and `/api/guide` accepts both legacy and v1
job requests with bounded JSON input. Full conversation remains stage 4.
`prepareYardleyBrief` builds a versioned, validated brief but is not yet accepted
by `/api/lead`; stage 5 connects that new submission contract. Existing lead
contracts remain usable and legacy guide email now includes fit qualifications.

**Application acceptance scenarios:** small driveways/sidewalks/patios begin with
327 K Towable or 425 S as appropriate, but large flatwork does not get forced
small. Sustained rapid-set and latex work favor larger candidates after checking
placement window and logistics. All four approved latex models remain eligible;
an initial 880 S/850 S discussion does not make 740 K/750 L incompatible.
750 L and 850 S both publish 60 yd³/hr; compare their actual differences rather
than claiming 850 S is faster. Mining or remote work alone does not justify the
largest unit. These are sales starting points, not engineering certification.

For pools, walls and slopes, ask wet-mix shotcrete versus dry-mix gunite and the
existing pump/gun/feed setup. Never infer shell material from pool water volume
or certify dry-gunite compatibility from a published mixer rate. Use configuration
review when necessary. Unknown quantities remain valid inquiries.

**Done when:** the scripted guide can form a useful, qualified brief without AI;
all fitting and geometry tests pass; the existing quote branch still validates.

## 3. Yardley interface and discovery

- [ ] **`src/components/YardleyEntry.astro` — new.** One shared, compact intro
  module with consistent name, AI label, value statement and `/job/` link. Adapt
  density by placement rather than duplicating copy and markup.
- [ ] **`src/pages/index.astro` — existing.** Place the approved introduction
  below the hero, preserving Quote/Call hierarchy and StarMix's visual priority.
- [ ] **`src/pages/starmix.astro` — existing, entry pass.** Add the matching
  visible invitation. Avoid repeating the same invitation several times within
  one viewport.
- [ ] **`src/components/QuoteForm.astro` — existing.** Update the mixer-only
  guide entry to Yardley; preserve parts/sourcing behavior and existing form IDs.
- [ ] **`src/pages/job.astro` — existing.** Replace the narrow fixed four-beat
  desk with the conversational workspace, quick choices, persistent text composer,
  editable summary, provisional recommendation/comparison plates, required options,
  unresolved questions, and a review/contact step. Desktop summary beside the
  exchange; mobile summary in an accessible disclosure. Preserve one H1, labels,
  footer disclaimer, phone access and a working scripted path without AI service.
- [ ] **`src/scripts/job.ts` — existing.** Manage one validated job state shared
  by choices, typing and summary edits. Ask only useful followups; support back,
  change and reset. Confirm inferred details before relying on them. Cancel or
  invalidate stale requests and prevent duplicate submits. Do not make an AI call
  on every checkbox toggle. Render text safely without arbitrary model HTML.
  Keep answers on recoverable errors and provide an honest retry path.
- [ ] **`src/styles/site.css` — existing.** Replace the guide block with scoped
  Yardley styles using existing tokens. Handle long messages, plates, summary,
  composer and mobile keyboards at 360px. Keep square corners, readable body
  type, focus rings, reduced-motion behavior and restrained signal accents.
- [ ] **`src/components/SiteHeader.astro` / `src/styles/site.css` — existing,
  isolated responsive repair.** Fix the observed 360px header overflow without
  changing nav structure or accidentally enabling the undecided active underline.

**Done when:** a novice can describe a job without knowing yardage, an experienced
buyer can supply details quickly, both can edit the summary, and all entry paths
lead to the same guide. Keyboard operation, focus, 360px layout and long content
work. Contact remains available if the guide cannot recommend a configuration.

## 4. Grounded conversation and the $20 monthly budget

- [ ] **`src/data/knowledge.ts` — new.** Reviewed short answers with stable fact
  IDs, source references and allowed caveats: bin versus production, replenishment,
  mix/process terminology, wet/dry distinctions, options, model comparisons and
  Paul's role. Reference model/option records rather than copying their figures.
- [ ] **`src/lib/yardley/conversation.ts` — new, server only.** Bound context and
  output, interpret free text into proposed schema changes, select relevant
  approved facts and next questions, and explain deterministic fit results. Model
  output is untrusted: validate structured fields and confirm uncertain inference.
  Render critical specs, required options and caveats from code, not generated
  prose. Replace the old regex-only “safe paragraph” check with structured
  constraints and approved answer blocks. No autonomous email tool or web search.
- [ ] **`src/pages/api/guide.ts` — existing.** Replace the rewrite-only endpoint
  with the versioned conversation contract. Revalidate all inputs, recompute fit
  when needed, enforce body/message/context/output limits, request timeout and
  rate controls, and return a typed result or scripted fallback. Keep
  `prerender = false`. Handle missing key, invalid model output, timeout, budget
  exhaustion and provider failure without blocking the guided inquiry.
- [ ] **`src/lib/yardley/limits.ts` — new, server only.** Centralize request,
  message and token bounds plus rate-limit policy. Use a deployment-capable shared
  mechanism or platform rule; per-process memory is not a global spend limit on
  serverless. Resolve the smallest suitable mechanism before this stage ships.
  Do not introduce a database just to store conversations. Deduplicate redundant
  client requests and bound model calls per turn/session where enforceable.
- [ ] **`.env.example` — existing.** Document only server-side placeholders and
  supported configuration, including the selected Gateway model and fallback.
  Never use `PUBLIC_` for credentials. Preserve the Resend variable. No secrets
  in source, browser bundles, examples, logs or the checklist.
- [ ] **Local `.env` and Vercel environment settings — configuration, not tracked
  source.** Configure the same documented model and required credentials in each
  environment. Verify scope for development/preview/production; do not assume
  local settings automatically propagate to Vercel. Never print credential values.
- [ ] **Gateway project/key budget — account setting.** Isolate Yardley usage
  where supported, configure the approved $20 monthly limit and verify which
  workloads it covers. No unbudgeted paid fallback. Check provider/platform
  behavior: a budget can have a small in-flight overshoot, so describe it honestly.
  Ensure budget rejection reliably activates the scripted path.
- [ ] **`tests/yardley/conversation.test.ts` — new.** Mock the provider for normal,
  malformed, delayed, canceled and over-budget responses. Verify supplied model
  IDs/specs/prices/availability/territory cannot override authoritative data.
- [ ] **`tests/yardley/evals.json` — new.** Maintain realistic buyer prompts and
  required outcomes, including beginners, mixed work, unknown yards, gunite-only,
  latex, chopper, unsupported claims and attempts to override rules. Use the same
  set for a small bounded live-model evaluation; record date/model/spend summary.

**Done when:** conversational answers are useful and grounded; scripted controls
still work with the model unavailable; the real workload has verified budget
controls; no transcript storage or unsupported commercial promise is introduced.

## 5. Visitor review, email and receipt

- [ ] **`src/data/lead.ts` — existing, handoff pass.** Validate and format the
  reviewed brief with work/mix/process, known and estimated quantities and their
  inputs, placement/logistics, chassis preference, required options, timeline,
  deterministic primary/alternate and reasons, unresolved questions, and contact
  preferences. Preserve `source: mixer-guide`. Retain existing quote-form,
  parts and sourcing contracts. Keep unknowns explicit. Make contact validation
  consistent with the offered contact methods.
- [ ] **`src/pages/api/lead.ts` — existing.** Revalidate the schema, recalculate
  estimates and fit on the server, and ignore browser-supplied model IDs/reasons.
  Apply honeypot, input bounds, duplicate-submit safeguards and actionable error
  handling. Preserve confirmed Resend From/To/Reply-To addresses. Do not change
  DNS or replace `paul@equipsolutionsgroup.com` with the Resend test sender.
- [ ] **`src/pages/job.astro` / `src/scripts/job.ts` — existing, submission pass.**
  Show exactly what will be sent and let the visitor correct it. Submit only
  after their explicit action. On success show an immutable submitted snapshot;
  subsequent edits must clearly start a revised inquiry. Fix the current issue
  where mix/timeline controls can change the displayed result after submission.
  On failure keep the brief, show the inline error and Paul's phone; never show
  fake success. Do not label provider acceptance as guaranteed inbox delivery.
- [ ] **`tests/yardley/lead.test.ts` — new.** Exercise forged candidate IDs,
  tampered calculations, missing/unknown data, contact validation, escaping,
  duplicate submission handling and Resend failure. Regression-test ordinary
  mixer, parts and sourcing inquiries as well as guide inquiries.

**Done when:** Paul receives a useful foundation for the sales conversation and
can distinguish known facts, estimates and unanswered questions. The visitor's
receipt matches the submitted brief; email failure cannot produce success UI.

## 6. Verification, deployment and continuing work

- [ ] **`docs/yardley-verification.md` — new.** Record checks, fixtures, screenshots
  or preview links, failures/fixes and remaining limitations. Test a small patio,
  large driveway, beginner with dimensions, unknown-size pool/gunite-only buyer,
  wet shotcrete, bridge latex, chopper with air caveat, conflicting trailer need,
  and frequent small municipal repairs. Test edits after recommendation, stale
  responses, back/reset, no key, timeout, invalid output and exhausted budget.
- [ ] **Browser checks — local and preview.** Verify actual page → API → validated
  result → reviewed brief → email/receipt behavior, rather than only mocking
  individual functions. Check keyboard, focus, screen-reader announcements,
  reduced motion, mobile keyboard, 360px and desktop layouts. Test all shared
  entry points and unchanged quote branches. Keep protected previews protected.
- [ ] **Live email/model smoke tests — controlled integration checks.** Use the
  intended recipient and bounded model calls; label test leads clearly. Confirm
  Paul receives the actual job information, not just a generic test message.
  Inspect delivery status separately from HTTP success; never log full personal
  payloads or keys. Document the verified configuration without its secrets.
- [ ] **Build/type/test checks.** Run the project build and the new meaningful
  checks after application stages. Address deployment-runtime compatibility;
  a successful local development page is not evidence that Vercel server routes work.
- [ ] **`docs/yardley-operations.md` — new.** Document model/key configuration,
  monthly budget scope/reset behavior, rate controls, provider logging, safe
  fallback, evaluation command, preview/release procedure and rollback. If
  anonymous metrics are added, limit them to events such as start/complete/error;
  do not add transcript analytics or a new service just for this release.
- [ ] **`AGENTS.md` / `README.md` / this file — existing documentation.** Update
  implementation status and actual module paths at each stage. Record verification
  evidence beside checked tasks. Keep one authoritative checklist, not separate
  conflicting instructions for Cursor and Codex.
- [ ] **Git/Vercel — release actions.** Review the full diff including preexisting
  work; commit/push and deploy in the normal project workflow when authorized.
  Test the preview before production. No DNS, territory, `noindex`, language,
  footer-disclaimer or unrelated site changes as a side effect of Yardley.

**Release gate:** fitting and validation tests pass; browser flows work at 360px;
all required options constrain both recommendation slots; factual content is
sourced; scripted fallback and the real budget are verified; Paul approves the
sales brief and provisional recommendations; preview integration checks pass.
Review and remediate the dependency advisories recorded in the verification log
before release; do not apply an unreviewed forced adapter downgrade.

## Local files and Cursor continuity

Codex edits the actual files in this folder. Cursor sees those same saved files
when it opens this repository; there is no second source tree to synchronize.
Do not edit generated `dist/` or `.vercel/output/` artifacts to implement changes.
Localhost reflects source changes through the development server, or after a
restart if configuration/dependencies change. Preview and production change only
through their deployment workflow. A checklist update does not publish the site.

Next concrete stage: **section 3 — Yardley interface and discovery**. The new UI
should consume the validated job state and structured fit reasons, questions and
caveats, rather than maintaining separate selection rules.
