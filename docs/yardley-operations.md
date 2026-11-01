# Yardley — AI operation and rollout

Updated November 1, 2026. Project: `equipsolutionsgroupwebsite`, team:
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
Production enforcement remains a release step before enabling Production AI. Preserve other
project rules/drafts. Follow the Firewall skill's user-published rollout; never
silently publish a draft or enable a team-wide block.

## Activation gate and current state

`YARDLEY_AI_ENABLED=true` is set in the ignored local `.env` after account and
Preview rate-control verification. Global hosted settings remain false; the tested
Preview uses a deployment-only true override. Nonempty budget/rule IDs merely
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
AI enable override. Global hosted switches remain false. The Preview is a test
snapshot of the uncommitted stage-4 worktree, not a
production release. Deployment protection remains enabled. Its normal authenticated
browser request produced a matching Log event for the guide rule. The owner
confirmed the traffic review and published the rule on November 1. The rule changes only this
rule to 60 POST requests / 60 seconds / IP, fixed-window, with an explicit
`environment = preview` condition; excess requests return 429. No unrelated
draft changes were present. A controlled authenticated test sent 65 invalid jobs:
60 returned API validation errors (400), then five returned 429. Firewall traffic
attributed the five blocks to this rule. No generation was requested by this test.
Normal browser AI replies work after the rate window resets. Production AI must
stay disabled until production rate enforcement and release verification are done.

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

The reviewed-brief email handoff remains stage 5. No AI route can send email.
