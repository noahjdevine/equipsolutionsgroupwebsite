# equipsolutionsgroup.com

Equip Solutions Group's US site: StarMix mixers, with secondary equipment and
parts sourcing. Astro 7 prerenders marketing pages; Vercel runs /api/lead and
/api/guide. Quote delivery uses Resend.

Read [AGENTS.md](AGENTS.md) before changes. It defines source, design, content and
working rules. The [Yardley implementation checklist](docs/yardley-implementation-plan.md)
records the approved mixer-guide enhancement, file-by-file tasks and completion
status. Stages 1–4 are merged through PRs #2, #3 and #4. Stage 5 adds
reviewed contact details and the complete job
brief, server-recomputed fit, explicit email submission, safe retries and an
immutable submitted receipt. Type checks, 83 tests and the build pass. The single
approved synthetic test was accepted by Resend from the protected Preview;
the exact receipt, same-reference retry and receipt stability after edits are
verified. On November 2, the owner confirmed the full brief arrived with Paul.
Stage 5 is complete and merged through PR #5 (`611d9f0`).
A [protected Stage 5 preview](https://equipsolutionsgroupwebsite-9j2pkvgyt-noah-devines-projects.vercel.app/job/)
is retained as Stage 5 evidence.
Stage 6's release checkpoint is on `codex/yardley-release-verification`.
Astro/adapter updates and scoped dependency fixes bring
the audit to zero findings; all 83 tests, checks and the build pass. A shared quote
field-error display bug is corrected and verified across mixer/parts/sourcing.
[Final protected Stage 6 Preview](https://equipsolutionsgroupwebsite-13tjfkumx-noah-devines-projects.vercel.app/job/)
is ready. The owner approved the brief/recommendations and authorized the Stage 6
PR. Production rate enforcement is published and verified: 60 admitted invalid
jobs, five 429 responses, then normal validation after reset. The $20/month
Gateway budget and separate Preview limit remain in place. PR merge and final
production release/activation remain open; Production AI stays disabled. See
[operations](docs/yardley-operations.md) and [verification](docs/yardley-verification.md).

## Local development

```sh
npm install
npm run dev      # localhost:4321
npm run build    # dist/ plus adapter output
npm run preview
npm run check    # strict TypeScript checks for TS modules
npm test         # Node test runner + tsx; no paid model or email calls
```

Copy the placeholders from .env.example into a local .env and configure only
the credentials needed for the flow being tested. Keep keys server-side and out
of Git. Check server routes in the development server and an actual Vercel preview;
static preview alone does not establish that deployed APIs work.

Codex and Cursor edit the same source files when opened in this folder. There is
no separate copy to synchronize. Configuration or dependency changes can require
a dev-server restart. Local environment values do not automatically configure
Vercel. Remote Git and hosted deployments update through their usual push/deploy
workflow; saving a local file does not publish it.

## Main files

- `src/pages/`: Home, StarMix, Parts, Sourcing, About, Contact and /job/ guide.
- `src/pages/api/lead.ts`: shared quote/guide email endpoint.
- `src/pages/api/guide.ts`: bounded v2 grounded conversation with scripted fallback;
  legacy/v1 scripted fit requests remain supported.
- `src/components/`: shared header, footer, CTA, applications and quote form.
- `src/data/models.ts`: model specs and attributed manufacturer claims.
- `src/data/options.ts`: sourced option catalog and confirmed compatibility rules.
- `src/data/yardley-job.ts`: versioned, validated job state and legacy adapter.
- `src/lib/yardley/volume.ts`: estimates from supplied customer job dimensions.
- `src/lib/yardley/intake.ts`: scripted followups, bounded text recognition,
  confirmation and summary presentation. Unrecognized text is retained as notes;
  guided mode does not claim general conversational understanding.
- `src/data/knowledge.ts`, `src/data/yardley-conversation.ts`: approved facts and
  browser/server conversation contracts.
- `src/lib/yardley/conversation.ts`, `limits.ts`: server-only model planning and
  request policy; `replies.ts`, `transport.ts`: safe shared answers and cancelable
  browser requests.
- `scripts/yardley-eval.ts`, `tests/yardley/evals.json`: bounded, explicit live
  evaluation after account controls are verified. Ordinary `npm test` never uses
  real model credentials or sends email.
- `src/data/applications.ts`: shared work-type taxonomy.
- `src/data/fit.ts`, `src/data/guide.ts`, `src/scripts/job.ts`: current guide behavior.
- `src/data/lead.ts`: validation and formatting for submitted inquiries.
- `src/lib/yardley/lead-route.ts`: bounded server mail handler and Resend retry key.
- `src/lib/yardley/handoff.ts`: immutable browser send attempts and receipt validation.
- `tests/yardley/`: job, volume, fit, intake, lead-contract and API regression tests.
- `src/styles/site.css`: design tokens and site styles.
- `public/assets/img/`: local image assets.

Keep source changes here rather than editing generated output. SwapLoader is
archived and redirected, not a live US product page. English remains at the root;
future /es/ work is outside the current scope. Preserve the independent-rep
footer disclaimer and prelaunch noindex setting.

Manufacturer US figures govern model specs; never estimate or convert them.
See the implementation checklist for the completed 740 K correction and recorded
sheet/site discrepancies. All pending launch items, including territory, photos,
logo and font hosting, remain governed by AGENTS.md.
