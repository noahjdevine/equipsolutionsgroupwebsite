# Yardley — AI operation and rollout

Updated November 2, 2026. Project: `equipsolutionsgroupwebsite`, team:
`noah-devines-projects`. Never put a credential value in this document or Git.

## Account configuration

One dedicated Gateway key, **Yardley shared monthly**, covers local, Preview,
Development and Production usage. Its verified account budget is **$20, monthly**,
with 50/75/100-percent alerts. The key uses Gateway credits; the application has
no direct-provider key, BYOK path, OIDC fallback or alternate paid model. Budget
reset uses Gateway's UTC monthly boundary. It is a soft cap: an in-flight request
may complete after the threshold, so it is not a guarantee of exactly $20.00.

The credential is in the ignored local `.env` and as a Vercel Secret in all three
environments. Model, budget-key ID, rate-rule ID and the enable switch are server
configuration. Existing Resend settings were preserved. A new deployment is
required to pick up hosted environment changes.

The actual account budget is the enforcement mechanism. Writing a dollar amount
or setting `YARDLEY_AI_ENABLED=true` does not configure it. Verify after rotation:

```powershell
npm exec --yes --package=vercel -- vercel ai-gateway budgets inspect api-key "Yardley shared monthly" --scope noah-devines-projects --json
```

## Model and privacy

`openai/gpt-6-luna` was verified in the complete live Gateway catalog. Installed
AI SDK: 7.0.154 (current release checked: 7.0.159, same major). No dependency upgrade
was needed. Reviewed references:

- [Live Gateway catalog](https://ai-gateway.vercel.sh/v1/models)
- [OpenAI GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)
- [Gateway budgets](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets)
- [Gateway ZDR routing](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr)

The request requires `gateway.zeroDataRetention=true`. The November 1 endpoint
catalog reports qualifying OpenAI and Azure routes; the Bedrock route does not
qualify. This is provider routing policy, not a claim that Gateway retains no
operational metadata. No application database, server transcript logging, SDK
DevTools capture or browser persistent chat storage is introduced.

Only six bounded recent messages and the validated job are sent per turn. Notes
and open-question arrays are omitted from the model prompt. Suggested inputs need
verbatim message evidence and explicit visitor confirmation. Customer messages
with unrecognized details can be kept in editable brief notes; recognized fields
and answered questions are not automatically copied as a full chat transcript.

## Request controls

- One model call per submitted message, no SDK retries, no agent/tool loop.
- Body: 32 KiB; message: 2,000 characters; six history entries of at most 900
  characters each; serialized input context: 12,000 characters.
- Output: 1,400 tokens; server deadline: 15 seconds; client deadline: 19 seconds.
- Browser: 24 AI turns per page. This is a UX bound, not a global spend limit.
- Edit, Back, Reset, draft changes and Cancel invalidate pending requests. An old
  response cannot overwrite a newer answer. Retry is explicit; no checkbox makes
  an AI call. Cross-site browser origins are rejected.
- A platform rate rule, not a per-function memory counter, protects hosted calls.

The published rule is `rule_yardley_guide_request_control_KTBjqS`, matching only
`POST /api/guide` or `POST /api/guide/` in **Preview**. Enforcement is **60 requests
per 60 seconds per IP**, fixed-window, returning 429 on excess. Counters are per
Vercel region; this is an abuse control, not the dollar-spend mechanism. Logging,
owner traffic review, owner publication and Preview enforcement checks are complete.
Production now has a separate published rule,
`rule_yardley_production_traffic_review_D84EDG`, with the same path/method match
and 60/min/IP limit, restricted to Production. The owner reviewed logging and
published enforcement. A bounded test verified 60 admitted invalid jobs, five
429s and recovery after reset. Preserve other project rules/drafts. Follow the
Firewall skill's user-published rollout; never
silently publish a draft or enable a team-wide block.

## Activation gate and current state

`YARDLEY_AI_ENABLED=true` is set in the ignored local `.env` after account and
Preview rate-control verification. Production is now enabled after explicit owner
activation approval and full release verification. Global Preview/Development
remain false; test Previews use deployment-only true overrides. Production has
its own rate-rule setting; Preview/Development retain the Preview rule ID.
Nonempty budget/rule IDs merely
identify the verified account resources; they cannot establish that a draft rule
has been published. Before enabling any public environment, inspect the actual
published rule and scope. Keep Production disabled while Preview rollout or
release checks are outstanding.

The owner funded Gateway credits on November 1. Funded synthetic model
evaluations and a real browser → Preview API → model → confirmation flow now work.
The initial $0-balance HTTP 403 `customer_verification_required` is resolved.
The shared key budget inspection after the first evaluations reported $0.009242605
spent; later bounded tests add a small amount. Credits fund requests separately
from the $20 monthly key cap. No automatic top-up was configured by this work.

The protected stage-4 Preview linked in the verification log has a deployment-only
AI enable override. At that stage's checkpoint, all global hosted switches were
false. The Preview is a test
snapshot of the uncommitted stage-4 worktree, not a
production release. Deployment protection remains enabled. Its normal authenticated
browser request produced a matching Log event for the guide rule. The owner
confirmed the traffic review and published the rule on November 1. The rule changes only this
rule to 60 POST requests / 60 seconds / IP, fixed-window, with an explicit
`environment = preview` condition; excess requests return 429. No unrelated
draft changes were present. A controlled authenticated test sent 65 invalid jobs:
60 returned API validation errors (400), then five returned 429. Firewall traffic
attributed the five blocks to this rule. No generation was requested by this test.
Normal browser AI replies work after the rate window resets. Production rate
enforcement and release verification were subsequently completed before activation.

Astro local server settings use explicit `import.meta.env` reads with runtime
environment overrides. Fully stop/start an existing dev server after changing the
enable switch if it retains its old process environment. Local smoke verification
returned HTTP 200, mode `ai`, and the correct 750 L / 850 S equal-rate comparison.

## Evaluation and recovery

For an explicitly bounded artificial evaluation, enable only the current shell:

```powershell
$env:YARDLEY_AI_ENABLED='true'
npm run eval:yardley -- --live --count=1
```

Then run the 12-case fixture set with `npm run eval:yardley -- --live`. The script
makes at most 12 sequential calls, never retries, prints case IDs, proposed field
names, outcome, model and available cost/generation metadata; it saves no transcript.
Use `--case=chopper-small` to rerun one named case after a relevant fix. The
explicit `--live` flag and enabled, configured controls are required. Do not
spend the monthly allowance just to force exhaustion: mock the 402 response in
tests and verify the real account budget separately.

For disablement, set `YARDLEY_AI_ENABLED=false` in the affected environment and
redeploy. Keep the budget in place. Missing credentials, wrong model, disabled
switch, budget rejection, rate limit, malformed output and timeout all retain
guided choices, approved answers, editing and Call/Quote access.

## Reviewed brief email — stage 5

Only the visitor's explicit Send action posts a version-2 `mixer-guide` submission
to `/api/lead`. No AI route can send email. The server validates contact details
and versioned job inputs, rejects unconfirmed proposals or supplied fit/calculated
totals, and recomputes fit and geometric estimates. The exact-email disclosure,
provider text and receipt use the same formatter. Mail is plain text; visitor
markup cannot become HTML. Existing quote/mixer/parts/sourcing payloads remain valid.

The request body is bounded to 32 KiB, the provider send to 12 seconds and browser
confirmation to 19 seconds. A missing key, rejection, exception, timeout or missing
provider ID cannot create a success receipt. On an uncertain result keep the brief
and retry its unchanged snapshot. The receipt is checked against the submitted
reference, subject and exact text and remains independent from later edits.

Each reviewed attempt uses `yardley/<submission UUID>` as its Resend idempotency
key. [Resend keeps idempotency keys for 24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys).
The browser refuses an uncertain retry after 23 hours; contact Paul before creating
another inquiry in that case. A changed job or contact snapshot gets a new UUID.
Reloading the page discards application memory, including references and receipts;
there is no claim of deduplication across a new page or indefinitely. No full
transcript storage was added. Resend necessarily processes the reviewed email.

From remains `Equip Solutions Group <paul@equipsolutionsgroup.com>`; To and Reply-To
remain `paul@equipsolutionsgroup.com`. No DNS change is part of this handoff.
Guide phone/WhatsApp contact can omit email; the chosen contact method must have
its required contact detail. English/Spanish is a preference for Paul's response,
not a translated guide. Existing ordinary quote contact rules are unchanged.

Actual sending to Paul during agent verification requires explicit approval for
the concrete test message. A provider acceptance receipt is separate from a
verified `delivered` event or Paul's confirmation. Do not describe either mocked
sends or HTTP 200 alone as confirmed inbox delivery.

On November 2, the single owner-approved TEST ONLY stage-5 message was accepted
from protected Preview. The exact browser receipt, same-reference replay and
receipt stability after draft edits are verified in the verification log. On
November 2, the owner confirmed the full brief arrived with Paul, closing Stage 5.
No provider delivery event is claimed as inspected.
The existing API key is sending-only; a delivery lookup returns
`restricted_api_key`. Keep that key's scope unchanged for application operation.
Do not send another test merely to resolve dashboard access or repeat acceptance
checks. The Stage 5 checkpoint is on `codex/yardley-handoff`; release controls
remain in force.

## Stage 6 release procedure and rollback

Stage 5 merged through PR #5 (`611d9f0`). Stage 6 verification is on
`codex/yardley-release-verification`, authorized by the owner for commit/push/PR.
PR #6 merged as `eb2da41`; the owner explicitly approved production activation,
and the tested production build is now promoted. The final
[protected Preview](https://equipsolutionsgroupwebsite-13tjfkumx-noah-devines-projects.vercel.app/job/)
is Ready on the Node 24 function runtime with a deployment-only AI override.
It includes Astro 7.4.5 / adapter 11.0.18 and scoped security overrides; the
install audit reports zero findings. Local Node 26 still warns; prefer Node 24
for development parity. No `hybrid` output or adapter downgrade is involved.
The shared quote-form error selector correction was verified locally and hosted.
The owner published the production logging rule on November 2. Published state
has no pending drafts; the normal browser comparison recorded one logged guide
request, independently confirmed in the dashboard and CLI. The owner approved
the traffic review and published the Production 60/min/IP rule. Normal HTTP
testing verified 60 admitted invalid jobs and five 429s, independently attributed
to that rule; normal validation resumed 80 seconds after the test. No model or
email call was made. No draft remains.

The budget was re-inspected on November 2: active $20/month, spend $0.01783327
and no BYOK spend. The 12-case live run initially passed 10 cases; the rejected
mixed-work output and provider-failed missing-thickness case each passed one
targeted rerun. Keep fallback and explicit confirmation; do not imply perfect AI
interpretation from a successful retry.

Release in this order:

1. **Completed November 2:** the owner published the logging-only production rule
   `rule_yardley_production_traffic_review_D84EDG`. It matches only Production
   POST `/api/guide` and `/api/guide/`; it blocks nothing. The inspected draft
   contained only that insertion. Preserve unrelated drafts if any appear later.
2. **Completed November 2; owner replied “Looks right”:** a synthetic normal
   browser comparison, with Production AI disabled, recorded one logged event.
   Have the owner review the [filtered traffic view](https://vercel.com/noah-devines-projects/equipsolutionsgroupwebsite/firewall/traffic?filter=rule_yardley_production_traffic_review_D84EDG)
   before tightening. The authenticated CLI smoke did not appear in the initial
   rule query, so it is not used as firewall-match evidence.
3. **Completed November 2:** the owner published that production rule
   as 60 requests / 60 seconds / IP, fixed-window,
   returning 429. Keep its Production condition and both exact POST paths; leave
   the existing Preview rule intact. Inspect the complete diff and have the
   owner publish. Verify enforcement with bounded invalid JSON jobs, no paid
   generation and no email; confirm normal access after the window resets.
   Use the verified primary alias `https://equipsolutionsgroupwebsite.vercel.app`
   for ordinary unauthenticated HTTP tests. The unique Production deployment URL
   requires authentication, and `vercel curl` does not establish normal WAF
   matching. Do not export browser cookies or widen access for a rate test.
4. **Completed November 2:** the owner answered “Approved—create the PR” to
   final signoff of the reviewed brief and provisional-fit behavior. Paul still
   confirms each customer's final equipment/configuration; this is release
   signoff, not blanket certification of every setup.
5. **Completed November 2:** Stage 6 was committed/pushed, PR #6 opened and the
   owner merged it as `eb2da41`. For future application changes, let the owner merge in
   the normal workflow. Git integration deploys `main`; it does not enable AI
   while the hosted switch remains false. Keep `noindex`, DNS and the legal
   disclaimer unchanged. Review the exact commit/environment before release.
6. **Completed November 2 after explicit activation approval:** set the Production
   `YARDLEY_RATE_LIMIT_ID` to the production rule ID and enable only the intended
   Production AI switch. Secrets stay unchanged. Stage a production build without
   assigning domains (`vercel deploy --prod --skip-domain`), verify that build,
   then promote the tested production deployment. Do not promote a Preview and
   assume the same tested build was released: its Production env rebuild differs.
7. **Completed November 2:** checked a synthetic conversation, confirmation,
   qualified fit and review on
   the released host; inspect deployment-specific errors. Reuse the approved
   Stage 5 email evidence unless a changed handoff requires another explicitly
   approved message. Keep the filtered traffic view handy for the first 24h.

The Firewall skill requires owner publication between rollout stages. Example
command, from this repository's terminal:

```powershell
npm exec --yes --package=vercel -- vercel firewall publish --scope noah-devines-projects --project equipsolutionsgroupwebsite --yes
```

Before publication, inspect the current complete diff; the command publishes
all pending drafts, not only Yardley's rule. Never auto-publish another person's
changes. The logging draft and its URL are not proof of live enforcement.

For an AI-only problem, retain the firewall/budget and disable Production AI,
then redeploy. For a broken application build, use the recorded previous Ready
production deployment as the rollback target. Inspect target team/project first;
rollback affects automatic domain assignment, which requires a later explicit
promotion to restore. For a false-positive rate rule, stage its action back to
Log and have the owner publish, keeping AI disabled if enforcement is absent.
No new monitoring service or transcript analytics is required for this release.

Current live release: `dpl_6CcGHvoDwX77agt43GP1emqfkhQm`, merged Git `main`
`eb2da4132513ae068c3992b23f770f10b38b244c`, Node 24.x. Primary URL:
https://equipsolutionsgroupwebsite.vercel.app/job/ . Staged and live requests
returned real AI responses; normal browser confirmation/fit/review passed.
Final runtime-error scan returned zero records. Shared key spend at the final
inspection was $0.018932575 against the active $20 monthly budget.

The enable switch and rate-rule setting now have separate Production versus
Preview/Development entries. `vercel env update --environment production` updates
the entire matching entry; preserve this separation. Verify hosted settings from
outside the checkout because `vercel env run` loads local `.env` values first in
this repository. Never print actual credential values during that verification.

The previous Ready production build is `dpl_GLJTeYu8KUoRnBfonK8ShBxiH418`, the
same merged application with its prior disabled AI snapshot. Retain it as the
immediate rollback target. Broader custom-domain/public launch is separate:
DNS and `noindex, nofollow` were intentionally unchanged.
