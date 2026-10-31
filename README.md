# equipsolutionsgroup.com

Equip Solutions Group's US site: StarMix mixers, with secondary equipment and
parts sourcing. Astro 7 prerenders marketing pages; Vercel runs /api/lead and
/api/guide. Quote delivery uses Resend.

Read [AGENTS.md](AGENTS.md) before changes. It defines source, design, content and
working rules. The [Yardley implementation checklist](docs/yardley-implementation-plan.md)
records the approved mixer-guide enhancement, file-by-file tasks and completion
status. Stages 1–2 are merged in PR #2. Stage 3 adds the local Yardley workspace:
quick choices, a persistent text composer, confirmed text proposals, editable job
summary, estimates, comparisons and a copyable review brief. The live AI connection,
spend controls and reviewed-brief email submission remain pending (stages 4–5).

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
- `src/pages/api/guide.ts`: bounded, scripted fit endpoint; planned grounded conversation.
- `src/components/`: shared header, footer, CTA, applications and quote form.
- `src/data/models.ts`: model specs and attributed manufacturer claims.
- `src/data/options.ts`: sourced option catalog and confirmed compatibility rules.
- `src/data/yardley-job.ts`: versioned, validated job state and legacy adapter.
- `src/lib/yardley/volume.ts`: estimates from supplied customer job dimensions.
- `src/lib/yardley/intake.ts`: scripted followups, bounded text recognition,
  confirmation and summary presentation. Unrecognized text is retained as notes;
  guided mode does not claim general conversational understanding.
- `src/data/applications.ts`: shared work-type taxonomy.
- `src/data/fit.ts`, `src/data/guide.ts`, `src/scripts/job.ts`: current guide behavior.
- `src/data/lead.ts`: validation and formatting for submitted inquiries.
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
