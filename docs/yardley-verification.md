# Yardley verification log

## Production activation — November 2, 2026 — all six stages complete

- The owner merged PR #6 as **`eb2da4132513ae068c3992b23f770f10b38b244c`** and
  explicitly answered **“Approve production activation”** for enabling production
  AI, testing and promoting the merged build under the existing budget/rate
  controls. The initial automatic review required that exact approval; no
  production mutation ran before it was supplied.
- Local `main` was fast-forwarded to that merge, keeping Cursor on the same
  saved source. No application code changed during activation.
- Actual published Production rate enforcement and the active **$20 monthly**
  key budget were re-inspected before enabling calls. The two non-secret config
  variables were split by environment: Production has `YARDLEY_AI_ENABLED=true`
  and `YARDLEY_RATE_LIMIT_ID=rule_yardley_production_traffic_review_D84EDG`;
  Preview/Development retain their disabled switch and Preview rule ID. Resend,
  Gateway credentials, model, budget, alerts and protections were unchanged.
  Hosted values were independently checked outside the checkout so local `.env`
  could not override the inspection. Local AI remains enabled.
- Staged production deployment **`dpl_6CcGHvoDwX77agt43GP1emqfkhQm`**:
  [unique build](https://equipsolutionsgroupwebsite-kj9wmarkc-noah-devines-projects.vercel.app/job/),
  Ready, target Production, project `prj_Ka0mos1l5vZXbxhKbRE4QcstiiHE`, Git `main`
  at the exact merge above, Node **24.x**. The primary alias still pointed to the
  previous merge deployment during staging; protection remained enabled.
- Staged API comparison returned **HTTP 200, mode `ai`, reason `ok`**, correctly
  explaining equal published 750 L / 850 S production rates. Staged normal
  Chrome accepted supplied 18 × 18 ft / specified 4 in dimensions plus required
  chopper as a proposal. Answers stayed unknown until confirmation; confirmation
  produced ≈4 yd³ and provisional 750 L / 850 S with air/chassis caveats. The
  canonical email preview included dimensions, option, models and caveats; its
  state remained **“Your brief has not been sent.”** No extra email was sent.
- The staged error scan returned zero records. The same tested Production
  deployment was promoted successfully, without rebuilding a Preview. Primary
  alias verification points to the exact release ID above:
  [live Yardley](https://equipsolutionsgroupwebsite.vercel.app/job/).
- Ordinary unauthenticated live API request, with no protection bypass: **HTTP
  200, mode `ai`, reason `ok`**, correct equal-rate comparison and no proposed job
  changes. Normal live Chrome completed interpretation → confirmation → qualified
  fit → reviewed job brief for the synthetic dimension/chopper case. Required
  air/chassis questions remained open, no small machine was selected, and no
  inquiry was sent. [Live review screenshot](screenshots/yardley-production-live.png).
- Final deployment error query: **zero error records** in the inspected 15-minute
  window; live browser console: no errors. Final budget inspection: active
  **$20 monthly**, reported spend **$0.018932575**. This is cumulative shared
  usage at inspection, not a promise of zero later costs or perfect AI accuracy.
- Application release is complete. The earlier 83 tests/type checks/build and
  zero-finding dependency audit apply to the unchanged merged code. Stage 5's
  owner-confirmed full email remains the real handoff evidence. No new SMTP test,
  DNS edit, `noindex` removal, transcript persistence, credential expansion or
  unrelated website/public-launch change was made during activation.
- Previous ready rollback target:
  `dpl_GLJTeYu8KUoRnBfonK8ShBxiH418`
  (`equipsolutionsgroupwebsite-hp7iemaq8-noah-devines-projects.vercel.app`), the
  merged Stage 6 build with AI still disabled. See operations for disablement and
  rollback; keep budget and firewall controls in place.

## Stage 6 — November 2, 2026 — local and Preview checks complete; release pending

Base: merged Stage 5 PR #5, main `611d9f0`. Work is on
`codex/yardley-release-verification`. The owner approved the brief/recommendations
and authorized committing/pushing this release checkpoint and opening its PR.
No Stage 6 production deployment or AI activation has been performed.

### Dependency remediation

- Initial audit: **18 findings: 1 critical, 14 high, 3 moderate**. Updated Astro
  7.2.4 → **7.4.5** and adapter 11.0.16 → **11.0.18**, preserving Astro 7 static
  marketing pages and server API routes. No forced adapter downgrade.
- Ten transitive findings remained after compatible updates. Scoped overrides
  now use `glob` **14.0.3** beneath `@vercel/nft`, `path-to-regexp` **6.3.0** beneath
  `@vercel/routing-utils`, and the project's Zod constraint beneath
  `@vercel/cli-config`. The glob major change was reviewed for Node 24 support
  and the asynchronous glob API used by tracing; local and hosted Vercel builds
  exercise that tracing. Other package trees are not globally overridden.
- The completed install reports **zero vulnerabilities**. Sources:
  [Astro AVIF advisory](https://github.com/advisories/GHSA-26w7-cxv4-gfx2),
  [Astro/adapter releases](https://github.com/withastro/astro/releases),
  [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
  [glob changelog](https://github.com/isaacs/node-glob/blob/main/changelog.md),
  [route parser advisory](https://github.com/advisories/GHSA-9wv6-86v2-598j), and
  [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
  This supersedes the earlier unresolved dependency audit below, as of this run.

### Application and integration checks

- `npm run check`: passed. `npm test`: **83 passed, zero failed** after the
  dependency updates. These cover capacity/rate boundaries, large placements and
  replenishment, small rapid-set work, frequent small municipal work, wet/dry
  sprayed process, latex/chopper constraints in both recommendation slots,
  invalid/forged input, missing credentials, rate/budget/provider failure,
  cancellation, stale replies, email failure, uncertain retries and receipts.
- `npm run build`: passed after dependency updates and again after the quote-form
  fix below. Adapter output uses **nodejs24.x**; the actual protected hosted
  deployment is Ready. Local Node 26 still produces the known version warning;
  local/hosted Node version parity is not claimed.
- Live evaluation: **10 of 12 passed in the full run**. Mixed work fell back on
  rejected output; missing thickness fell back on a provider failure. Both
  preserved guided operation and neither fabricated a machine or thickness.
  Each failed case was rerun exactly once; both targeted reruns passed. Full-run
  reported cost $0.003074335; targeted reruns $0.00012047 and $0.00011046. This is
  not a 12/12 first-run or perfect-interpretation claim.
- Local browser: supplied patio dimensions 18 × 18 ft / specified 4 in produced
  a proposed ≈4 yd³ estimate, while saved answers stayed unknown. Keyboard
  confirmation saved the inputs and selected provisional 327 K / 425 S; the
  followup asked for placement pace. It did not invent thickness or waste.
- Protected Preview: confirmed latex + required chopper + trailer-only produced
  configuration review with no forced machine. Editing mount to truck produced
  qualified 750 L / 850 S, equal 60 yd³/hr explanation, latex dosing/chopper air
  caveats and chassis review. [Desktop comparison](screenshots/yardley-preview-stage6.png).
- Final Preview: an unknown-size pool/gunite-only buyer received process/feed
  guidance and no invented shell estimate. Confirming the supplied work/mix
  asked wet shotcrete versus dry gunite, with quantity still unknown. Starting
  fresh while a subsequent request was pending cleared the synthetic draft and
  canceled the reply. A later browser check still showed the fresh work question,
  empty composer and no pending proposal (also covered by transport tests).
- At **360 × 800**, document width was **345px**, without horizontal overflow.
  The typed composer stays usable, its focus outline is 2px, Shift+Enter inserts
  a line break, and the mobile menu opens with Enter and closes with Escape.
  Default viewport restored. [Mobile composer](screenshots/yardley-mobile-stage6.png).
  DOM/AX checks show one H1, polite live regions, loaded model images, retained
  disclaimer and `noindex, nofollow`. These are browser/semantics checks, not a
  physical-device keyboard or screen-reader certification.
- Home and StarMix invitations reach `/job/`; the quote invitation is visible
  only for the mixer branch. A shared quote-form bug was found: `showErrors`
  excluded each initially hidden error node itself, suppressing field messages
  and focus. It now excludes hidden parent branches instead. Local and final
  Preview empty submits show **10 mixer / 7 parts / 8 sourcing** field errors,
  focusing Name. These requests failed validation; no additional email was sent.
- Hosted v1 job fitting returned HTTP 200 with 750 L / 850 S and provisional,
  rate, latex, chopper-air and chassis caveats, matching browser/local policy.
  An incomplete version-2 `/api/lead` request returned **400** before sending.
  `/swaploader.html` returns **301** to `/`, exercising the updated route tooling.
- Final Preview runtime-error query: **zero error records** in the inspected
  15-minute window. Browser console inspection found no errors on the quote test.
- Ten generated browser HTML/JS/CSS assets: **zero actual credential matches**.
  No `localStorage`, `sessionStorage`, IndexedDB or `console.log` use was found
  in `src/`. Provider processing/retention remains as described in operations;
  there is no claim that external providers retain no metadata.
- The Stage 5 approved live email and owner-confirmed full brief receipt remain
  the handoff integration evidence; no second message was sent in Stage 6.

Final protected Preview:
[Stage 6 verification snapshot](https://equipsolutionsgroupwebsite-13tjfkumx-noah-devines-projects.vercel.app/job/),
deployment `dpl_BGfXNZbZYTto2aWBdR25JNWjqiWH`, Ready, Vercel Authentication retained.
The earlier comparison/mobile screenshots use the first Stage 6 Preview
`dpl_7WgqTQgJdrx8uEQwbkpQ1PDAvNhm`; only the shared quote error fix differs.
Both are uncommitted-worktree snapshots based on main `611d9f0`, not Stage 6 Git
commits. AI is enabled by deployment-only overrides.

### Account controls and remaining release gates

- Dedicated Gateway budget re-inspected: **active, $20 monthly**, spend
  **$0.01783327**, BYOK spend 0 at inspection. No alternate key/provider route or
  automatic top-up was added. Production comparison smoke returned HTTP 200,
  `mode: guided`, `reason: not-configured`, retaining the correct equal-rate
  explanation. Production AI is still disabled.
- Existing published Preview rule still limits both guide POST path variants to
  **60 requests / 60 seconds / IP**. There were no existing drafts before work.
- The owner published the **logging-only production** rule on November 2:
  `rule_yardley_production_traffic_review_D84EDG`. It matches only POST
  `/api/guide` and `/api/guide/` in Production, action Log. Published state was
  verified with no remaining draft; Preview enforcement is unchanged.
  An authenticated CLI comparison returned HTTP 200 in guided mode, but did not
  appear in the initial firewall query. A subsequent normal authenticated Chrome
  comparison produced **one logged event**: the dashboard shows `/api/guide`, the
  intended Production deployment host and a normal Chrome user agent. The CLI
  rule-traffic inspection independently returned `total: 1`, `log: 1`. This
  verifies logging, not rate enforcement. No model or email call was made.
- The owner reviewed the production logging event and replied **“Looks right.”**
  The production rule was staged as **60 requests / 60 seconds / IP**,
  fixed-window, excess action `rate_limit` (429). Inspection retained only
  Production POST `/api/guide` and `/api/guide/`. The complete draft contains one
  `rules.update` for that rule; Preview and other rules are unchanged. The owner
  published it; inspection confirms the production limit is active and there is
  no remaining draft.
- Rate-test access preparation: the unique production deployment URL returns
  **401** without authentication. Its primary alias, independently verified by
  deployment inspection, is `https://equipsolutionsgroupwebsite.vercel.app` and
  returns **400** for an ordinary unauthenticated invalid job POST. This gives
  a normal production firewall test path without exporting browser cookies,
  changing Trusted Sources or using the CLI's protection bypass. An ignored,
- Production enforcement test, November 2 at 21:55 UTC: **65 invalid JSON jobs**
  across both exact POST paths completed in 2.001 seconds. **60 returned 400**
  from API validation; **five returned 429** from rate enforcement. No
  authentication bypass, model request or email request was used. Rule traffic
  independently attributed **five `rate-limit` events** to the Production rule.
  An ordinary invalid POST **80 seconds after the test** returned 400 again,
  confirming recovery after the minute window. The ignored script/results do
  not contain credentials, customer details or transcripts.
- The owner answered **“Approved—create the PR”** to final signoff of the reviewed
  job brief and provisional recommendations, explicitly authorizing the Stage 6
  commit, push and PR while keeping AI off until merge/final release checks.
- Remaining: publish the Stage 6 checkpoint through the authorized PR workflow;
  owner merges the PR; test the production build and
  activate only after these gates. See operations for rollback. Public-launch
  changes (DNS, `noindex`, editorial placeholders, fonts) remain separate.

## Stage 5 — November 1–2, 2026 — complete; full brief receipt confirmed

Story: the visitor reviews a complete job brief and contact details, explicitly
sends that snapshot to Paul, and receives an immutable record of the accepted
email. Server fitting and estimates are recalculated from validated job inputs.

### Verified so far

- Branch `codex/yardley-handoff` starts at the merged PR #4 main commit `233310e`.
  The owner authorized committing/pushing this completed checkpoint and opening a
  PR before Stage 6. No production deployment or settings change was made during
  Stage 5 verification.
- `npm run check`, `npm test` and `npm run build` pass: **83 tests, zero failures**.
  Fifteen new cases cover contact methods, unknowns, proposed/forged input,
  estimate inputs and labels, provider payload/addresses, stable idempotency keys,
  old quote branches including URL-encoded/multipart requests, body/origin bounds,
  honeypot, provider conflicts/failure/timeout, duplicate clicks, uncertain retry,
  same-reference text mismatch, old attempts and immutable receipts after edits.
- Local Chrome browser: supplied 18 × 18 ft patio / specified 4 in thickness,
  standard mix and required chopper. Proposed details, including a supplied mix
  specification, are visible before confirmation. Confirmed state produces a
  calculated ≈4 yd³ placement, 750 L / 850 S, chopper air caveat and open air/chassis
  questions. Unknown fields remain explicit; no small chopper machine is named.
- Review displays the same full job and offers contact fields, an exact-email
  disclosure and an explicit Send button. Empty contact submission shows inline
  errors and focuses Name before any mail request. WhatsApp with phone and no
  email produces a valid preview; switching to email changes the required fields.
- A synthetic test contact and clearly labeled TEST ONLY note produce a full
  canonical email preview. A separately validated synthetic packet matched that
  visible text exactly. The owner approved one actual test message; the live
  browser submission below used that approved content, with only a regenerated
  reference after reopening the test page.
- **360 × 800** browser check: document width 345px within the 360px viewport;
  contact fields and long exact-email text do not cause horizontal overflow.
  Default viewport restored. No captured browser errors.
  [Desktop review](screenshots/yardley-review-stage5.jpg),
  [mobile contact form](screenshots/yardley-review-stage5-mobile.jpg).
- All ten generated browser HTML/JS/CSS assets scanned: zero matches for either
  actual API credential. `.env`, `.vercel` test artifacts and build output remain
  ignored; no new dependency, sender, recipient, DNS or model was introduced.
- Protected Node 24 Preview is Ready:
  [stage-5 reviewed handoff](https://equipsolutionsgroupwebsite-9j2pkvgyt-noah-devines-projects.vercel.app/job/),
  deployment `dpl_AwMRZcX6zthSPGpv4yPaEz1ViVd3`. It is an uncommitted worktree
  snapshot, not a stage-5 Git commit or production release. Normal authenticated
  Chrome opens the new review/contact form. An authenticated incomplete v2 POST
  returns HTTP 400 with validation errors before any send. Deployment protection
  remains enabled; the AI switch override applies to this Preview only.
- A final send-lock review also disables the older receipt's Revise button while
  a new send is pending and guards programmatic review/edit paths. Checks, all
  83 tests and the build pass after that fix.

### Approved live handoff — November 2

- A normal authenticated Chrome Send action on the protected Preview submitted
  the approved synthetic 18 × 18 ft patio at specified 4 in thickness, standard
  mix, required fiber chopper, provisional 750 L / 850 S and open air/chassis
  questions. The exact visible email was checked against the approved message
  before sending. No real customer data was used.
- Resend accepted the message. Submission reference:
  `afea1005-da44-4d21-88af-97252ac5cec6`; provider message ID:
  `01a19dfb-bd13-763a-9640-e3ccfa4b55ac`. The browser displayed the submitted
  snapshot, byte-for-byte equal to the reviewed email, and disabled sending that
  unchanged brief again. [Submitted receipt](screenshots/yardley-receipt-stage5.png).
- One authenticated same-reference API replay returned HTTP 200 and the same
  provider receipt/text, using the original idempotency key. No new inquiry or
  independently keyed second test email was sent.
- In the actual browser, adding latex to the draft produced a revised inquiry
  with a new reference and dosing caveat while the original receipt stayed
  unchanged. The revised draft was never sent. Restoring Standard alone restored
  the accepted reference and disabled Send again; the receipt still matched.

### Receipt confirmation

On November 2, the owner answered “Yes, the full brief arrived” when asked whether
Paul received the TEST ONLY message with patio dimensions, fiber chopper
requirement, model comparison and open questions. This closes Stage 5's actual
receipt criterion. Receipt confirmation comes from the owner; no provider
`delivered` event is claimed as inspected.

The existing Resend key is sending-only: reading this message's delivery event
returned 401 `restricted_api_key`. No credential permissions were expanded,
password reset requested or additional email sent. Further dashboard access is
not required to close this verified handoff.

Synthetic packets and provider responses remain in ignored `.vercel` test files.
Ordinary unit tests use injected mail functions and make no external sends.
Stage 6 remains the broader release/runtime/dependency gate; Production AI stays
disabled and no full launch is implied by this handoff implementation.

## Stage 4 — November 1, 2026 — complete locally and in protected Preview

Story: a typed question now reaches a bounded server-side model planner. The
application renders approved factual answer blocks; proposed job changes still
require visitor confirmation before deterministic fitting can use them.

### Verified

- `npm run check`, `npm test` and `npm run build` pass: **68 tests, zero failures**.
  Added checks cover supported provider JSON schemas, grounded comparisons,
  unconfirmed proposals, invented numeric/text inputs, missing configuration,
  budget/rate/provider failures, deadlines/cancellation, context bounds and stale
  browser requests. Ordinary tests inject a fake provider and incur no AI/email use.
- Exact model `openai/gpt-6-luna` is available in the live Gateway catalog. The
  dedicated **Yardley shared monthly** key has a verified active **$20 monthly**
  budget and no direct-provider/BYOK fallback. The owner funded Gateway credits;
  the initial zero-credit HTTP 403 is resolved. Budget inspection after early
  evaluations reported $0.009242605 spent; subsequent checks add a small amount.
- All five AI settings are configured separately for Development, Preview and
  Production. Local `.env` contains the same dedicated key. Keys are Secret on
  Vercel and ignored locally; Resend settings are preserved. Global AI switches
  remain false; the protected test deployment has an enable override. Local AI
  is enabled after account/rate verification. Production false was independently
  verified with the hosted environment, outside the local `.env` directory.
- Twelve synthetic buyer scenarios: **11 passed, one interpretation failure**
  in the final full run (reported Gateway cost $0.0012919). The chopper case
  occasionally failed to recognize “at each stop” as placement scope, withholding
  a pick. A prompt clarification explicitly maps per-stop/per-pour quantities;
  the targeted rerun passed with 750 L / 850 S, the chopper requirement and air
  caveat (reported cost $0.0006153). This is not a claim of perfect model accuracy.
  All extracted answers remain subject to visitor confirmation.
- Earlier live checks revealed unsupported provider `oneOf` schemas, canonicalized
  free-text evidence and punctuation-only quote changes. Provider unions now emit
  `anyOf`; supplied customer words are retained; punctuation-tolerant matches map
  back to actual quotes. Independently valid fields survive a rejected optional
  update. Added unit regressions pass. No transcript was persisted by the app.
- Protected Preview: [stage-4 test snapshot](https://equipsolutionsgroupwebsite-dvx7w4gvl-noah-devines-projects.vercel.app/job/),
  deployment `dpl_HDdFNK5BLJgrsE9Jbc29hj4akdxk`, Ready on Vercel's Node 24 runtime.
  This deploy uses the uncommitted worktree; its Git SHA still identifies the
  stage-3 base and must not be described as a stage-4 commit.
- A normal authenticated Chrome flow submitted supplied 18 × 18 ft / 4 in patio
  dimensions, received a connected AI reply and a **≈ 4 yd³ calculated** proposal.
  The saved summary stayed unknown until explicit confirmation, then retained
  the inputs and asked for mix requirements. A followup comparing 850 S / 750 L
  correctly showed 60 yd³/hr for both and their distinct bin capacities.
- Preview at **360 × 800**: no horizontal document overflow; existing responsive
  header, composer and summary remain usable. No captured browser errors.
  [Desktop conversation](screenshots/yardley-conversation-stage4.jpg) and
  [mobile check](screenshots/yardley-conversation-stage4-mobile.jpg).
- The owner reviewed logging traffic and published Preview enforcement. The active
  rule is valid, with no remaining draft: POST `/api/guide` or `/api/guide/`,
  `environment = preview`, fixed-window **60 requests / 60 seconds / IP**.
  An authenticated short-lived project identity sent 65 invalid empty jobs:
  **60 API validation responses (400), then five rate-limit responses (429)**.
  Firewall traffic independently attributed all five blocks to the Yardley rule.
  No AI generation was requested. Unauthenticated attempts returned 401 before
  reaching the rule, so those were not counted as enforcement evidence.
- The refreshed Preview recognized the small driveway / required chopper case as
  3 yd³ per placement, retained the high-volume-air / possible-extra-tank caveat,
  and required confirmation before changing the saved job. Normal connected AI
  replies work after the rate window resets.
- Localhost initially retained disabled settings. The server now reads explicit
  private Astro env fields with runtime overrides; fully restarting the background
  dev server cleared its old process environment. The local end-to-end smoke
  returned HTTP 200, mode `ai`, reason `ok`, and the correct equal-rate comparison.
  Type checking, 68 tests and the build passed again after this route correction.
- Final browser checking caught a misleading acknowledgement when a model selected
  “details” but proposed no actual changes. The renderer now uses a question
  acknowledgement in that case; the comparison regression covers it. The final
  checks still pass and all ten browser assets have zero actual credential matches.
- A deployment dry-run exposed that CLI source upload does not automatically
  exclude all ignored build/env files. Added `.vercelignore` before any upload;
  the reviewed upload manifest excluded `.env`, `.vercel`, build output and
  dependencies. The browser asset scan found no actual API-key matches.

### Still pending

Stage 4 is complete locally with a protected Preview, verified account budget and
verified Preview rate enforcement. Production AI is disabled and production code
was not deployed. Production rate enforcement/activation remain release checks;
do not enable public AI without them. Stage 4 is the checkpoint on
`codex/yardley-conversation`, prepared for PR review before stage 5.
Stage 5 must connect the versioned reviewed
brief to email; Copy / Call / Quote does not send it. No test email was sent.
The previously recorded dependency advisories remain a release check in stage 6.

## Stage 3 — October 28, 2026

Story: the visitor can start with the work rather than a model number, use quick
choices or a persistent text composer, confirm recognized text details, edit the
same job summary, compare provisional machines and review a copyable brief.
The interface is explicitly **guided mode** until the live conversation service
is implemented in stage 4. This is a local implementation checkpoint.

### Checks completed

- `npm test`: **47 passed, 0 failed**. Eight new intake tests cover confirmation,
  negation/hypotheticals, ambiguous quantities, daily versus placement/rate scope,
  process/feed/air followups, preserved daily context, unknown answers, calculated
  summary labels and validation. The existing 39 contract/fit/volume/API tests pass.
- `npm run check`: passed for strict TS modules/tests. `npm run build`: passed
  for Astro pages, `/job/`, marketing entries and Vercel server output. The existing
  local Node 26 / deployment Node 24 warning remains; this does not establish a
  deployed runtime check.
- Browser beginner flow: small-pour → patios → standard → dimensions. Supplied
  18 × 18 feet and specified 4 inches gives **≈ 4 yd³, calculated**, retaining inputs
  in the summary/review and no added waste allowance. Fit is 327 K / 425 S.
  Placement time, replenishment, mount, weekly use, timeline and options can all
  be supplied with controls. No model or email request is made by the intake UI.
- Browser typed flow: bridge overlays + latex + 8 yd³ per placement first shows
  a confirmation, with the saved summary still unknown and no machine selected.
  Confirming yields 750 L / 850 S with latex dosing and chassis qualifications.
  Discarding a subsequent typed correction preserves the prior fit and retains
  the visitor’s note for Paul. Enter sends; Shift + Enter adds a line.
- Unknown/edit/back: changing the calculated placement quantity to unknown
  removes both picks; Back restores the previous answer and comparison. Reset
  requires a local confirmation and clears job, notes, recent exchanges and history.
- Browser quantity scope: **40 yd³/day produces no automatic pick**. Adding a
  separate 4 yd³ placement produces 327 K / 425 S, while the daily total stays in
  brief notes. No daily total is silently relabeled as one placement.
- Browser chopper flow: a small standard placement with required fiber chopper
  moves both picks to 750 L / 850 S and retains high-volume-air / possible-extra-tank
  copy. Missing air produces an explicit configuration-review label even when a
  provisional base machine is shown. Dry-mix gunite produces configuration review
  without automatically naming a machine.
- Browser responsive checks at **360 × 800** and default **1280 × 712**: no page
  horizontal overflow; header brand and Menu fit; mobile summary starts closed,
  opens with its native disclosure and supports editing. Desktop summary starts
  open. Actual header links already had `nav-link`; no active-state change was made.
  Emulation checks layout, not a physical phone or soft keyboard certification.
- Keyboard checks: mobile Menu opens and Escape closes it; “Type instead” moves
  focus to the composer with a visible focus ring. Advancing/editing focuses the
  current question. Disclosure and form controls retain native semantics.
- Long text: a long unbroken note plus literal `<img ... onerror=...>` remains
  visible text in the review, creates no injected element and causes no mobile
  overflow. Visitor text is rendered through `textContent`, never generated HTML.
- Review copy: the clipboard contains job fields, supplied dimensions/formula,
  notes, provisional fit, reasons and unresolved questions. Copy is explicit;
  the UI says details have **not been sent**. Existing Quote / Call links remain.
- Entry checks: Home and StarMix each render one matching invitation to `/job/`.
  The compact quote entry appears only for mixers and hides for parts/sourcing;
  those existing branches are still usable and their validation tests pass.
- `git diff --check`: passed. PR #2 is verified merged at `c6bda04`; stage 3 was
  placed on local `codex/yardley-interface` from that identical-content baseline.
  No stage-3 commit, push, PR or deployment was created.

Screenshots: [desktop workspace](screenshots/yardley-workspace-stage3.jpg),
[360px workspace](screenshots/yardley-mobile-stage3.jpg), and
[configuration comparison](screenshots/yardley-comparison-stage3.jpg).

### Remaining scope

Stage 4 supplies grounded free-text interpretation/answers, provider/model
verification and actual $20 monthly spend controls. This stage uses bounded
recognition only and retains other text as notes. Stage 5 submits the reviewed
versioned brief through `/api/lead` and adds the matching receipt; the new review
does **not** flatten its data into the old five-field payload. It currently offers
Copy / Call / Quote. The ordinary quote form continues using its existing Resend
flow; no live test email was sent.

Dependency audit remediation, provider-retention review, hosted-preview checks and
the final release gate remain pending. No dependencies, secrets, Resend addresses,
DNS, `noindex`, marketing claims or model figures were changed in stage 3.

## Stage 2 — October 28, 2026

Story: customer-reported or calculated job details pass through one runtime
contract and deterministic fitter, so browser, API and legacy email formatting
agree on candidate restrictions and qualifications. The current page remains a
temporary four-question adapter; the conversational UI is stage 3.

### Checks completed

- `npm test`: **39 passed, 0 failed**. Includes job validation/provenance,
  dimensions and invalid units, bin boundaries, rate/window arithmetic and
  overflow, required-option exclusions in both slots, hard mounting conflicts,
  replenishment, dry/wet process distinctions, legacy lead contracts, prepared
  versioned briefs and guide API behavior. Compatibility invariants exercise
  combinations of quantity, mounting and weekly use inside the tests.
- `npm run check`: passed with strict TypeScript checks for TS modules and tests.
  This is not an Astro-template type checker; the separate build compiles pages.
- `npm run build`: passed, including `/job/` and Vercel server output. Local
  Node 26 versus deployed Node 24 remains an existing adapter warning. Actual
  preview/runtime verification remains part of the release checks.
- Local browser flow: small-pour → under 5 → 10+ weekly → unknown chassis.
  Standard mix produces 425 S / 750 L, rather than a frequency-driven 880 S.
  This conservative coarse-band fit does not claim a 4 yd³ trailer holds every
  under-5 job. A confirmed quantity of 4 yd³ or less can select the trailer in
  the new job contract, covered by tests.
- Selecting latex in that browser flow produces 750 L / 850 S, excludes both
  smaller machines and retains the dosing qualification. Their equal published
  production rate is explained without calling the 850 S faster. No browser
  console errors were captured.
- Actual local `POST /api/guide`: HTTP 200; primary `750-l`, alternate `850-s`,
  status `needs-clarification`, and `latex-configuration` caveat, matching the
  browser result. The endpoint is scripted and makes no provider call.
- Invalid JSON, unsupported versions, forged fields, wrong content types and
  bodies above 32 KiB are rejected in API tests. Responses use `no-store`.
- `git diff --check`: passed. Verification ran on `codex/yardley-enhancement`
  after checkpoint `03d2bab`, before the stage 2 commit and branch publication.
  Publication scope is a feature-branch checkpoint and draft PR; production
  release remains pending.

[Transitional guide screenshot](screenshots/yardley-fit-stage2.jpg) records policy
verification, not the finished UI design.

The managed shell initially prevented `tsx` from reading the Windows user profile;
the suite passed in the normal host environment. Strict checking exposed two
legacy typing issues in `job.ts`; the array conversion and error loop were corrected.

### Dependency audit — release work remains

The install's audit reports **15 high and 1 critical** findings in the dependency
tree. The existing Astro 7.2.4 / Vercel adapter 11.0.16 were already present at
checkpoint `03d2bab`; these packages were not upgraded in stage 2. The audit lists
Astro advisories including AVIF optimization, JSX/MDX rendering and View Transitions.
Assess applicability and perform a compatible upgrade before release. Do not use
`npm audit fix --force` without reviewing the proposed adapter downgrade.

The new direct Zod dependency is 4.6.7. The remaining Zod audit entry identifies
`node_modules/@vercel/cli-config/node_modules/zod`; that nested 4.1.11 dependency
also existed at the checkpoint. No security-remediation completion is claimed.

### Scope still pending

No live lead was sent and no paid model was called. The reviewed versioned brief
has a validated preparation function but is not yet submitted through `/api/lead`;
stage 5 connects it. Legacy quote-form and guide email contracts still work.
The free-text interface, adaptive conversational interaction, mobile redesign,
Gateway connection, $20 monthly account budget and provider-retention review are
not completed by this foundation stage. The independent-rep disclaimer, `noindex`,
contact addresses and DNS remain unchanged.

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

At the stage 1 checkpoint, the guide did not yet consume option-catalog restrictions.
Stage 2 above establishes that behavior through the new fitter and tests. Stage 3
introduces the Yardley interface; stage 4 connects conversation and the monthly budget.

No live lead was submitted, no email was sent, and no Gateway/account/DNS settings
were changed in stage 1. Provider logging, spend controls, unknown-quantity flows,
new fitting policy, full mobile accessibility and preview/production integration
remain explicit later-stage checks. The existing 360px header issue is tracked
for the isolated responsive repair in stage 3.
