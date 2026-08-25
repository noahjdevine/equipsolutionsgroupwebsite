# Project context — equipsolutionsgroup.com

Read this before making changes. It records *why* things are the way they are, so
that fixing one thing doesn't quietly undo another.

---

## 1. What this is

US-market site for **Equip Solutions Group** — Paul Devine's independent equipment
sales and parts business. Production domain: `equipsolutionsgroup.com`.

**US market = StarMix volumetric concrete mixers only.** SwapLoader is not sold or
referenced on this site. Equipment and parts sourcing is a **secondary** service.

| Line | Weight | Page |
|---|---|---|
| StarMix volumetric mixers | Primary | `/starmix/` |
| Equipment & parts sourcing | Secondary | `/sourcing/`, `/parts/` |

A Latin America section will be added later at `/es/` (subdirectory, **not** a
subdomain). That side will carry SwapLoader, tractors, combines, and lead with
sourcing. Do not build it now; do not make structural choices that would block it.
English/US lives at the root. Do **not** create `/en/` and do **not** redirect the
root. `html lang="en"` on the root layout stays.

**Positioning — the thesis.** Rotating-drum barrel trucks cannot properly handle
rapid-set, latex-modified, or shotcrete/gunite mixes. Volumetric mixing solves
this: mix on site, on demand, at the exact ratio the job calls for, with no
returned load. Lead with the **problem**, not the product. No generic equipment
copy ("quality solutions," "trusted partner," "your equipment needs").

**Positioning — what we do not compete on.** StarMix already runs two US-facing
sites (starmixindustries.com, smimobilemixers.com). They own brand, lineup, and
head terms. This site owns the named rep and application/job terms. **Do not**
target "volumetric concrete mixer." Linking *out* to their spec/support pages is
fine. Do not clone their product copy. Do not invent a factory backlink or
"official dealer locator" badge.

**"One stop shop"** is retained but re-anchored: it means depth across the
ownership lifecycle (machine, parts, sourcing, support, one relationship), **not**
breadth of equipment brands. Sourcing is secondary and gets lighter visual weight
than mixer content. The old "black tag vs yellow as the differentiator" rule is
retired.

**Primary conversion:** a phone call or a quote request. Not a newsletter signup,
not a download. Every page ends in a CTA band pointing at one of those two.

**Contact hierarchy.** Phone (`+1 515 720 0800`) and the quote form are primary.
WhatsApp is listed, not a third button: official glyph + text link under Quote /
Call on the homepage CTA, and in the footer and on `/contact/` and `/parts/`.
Link: `https://wa.me/15157200800` with a generic prefill (`Hi Paul, I have a
question.`) — same href everywhere, not mixer-specific. The glyph fill is
WhatsApp green (`#25D366`) inside `WhatsAppLink.astro` only; do not recolor it
or promote that hex to a site token. Email is `paul@equipsolutionsgroup.com`.
No street address and no LocalBusiness schema until Paul provides NAP.

**Audience:** construction, mining, and roadwork contractors; municipal and DOT
contracts; bridgework and latex-modified overlay crews; rapid-set / fast-set work
including night lane-return DOT jobs; shotcrete and gunite (pools, retaining
walls, slope stabilization). People who buy on spec, price and lead time — not on
brand feeling. They will read a spec table carefully and skim everything else.

**Not the audience** (do not write to them, do not restore them as primary):
roll-off and dumpster operators, hoist buyers, upfitters, farms and implement
dealers.

**Bilingual.** Paul Devine is fluent in Spanish. "Se habla español" stays on the
US site — sales, training, and support are available in Spanish. This is a US
differentiator, not a LatAm cue, and must not be moved to `/es/`. It is on
`/starmix/` (eyebrow) and site-wide next to contact: footer, `/contact/` paired
with WhatsApp, and the homepage CTA under-row. Do not translate page content
(that is `/es/` work). Do not add a city, state, or coverage area to justify it.

**Territory is still blank.** Do not invent a service area.

---

## 2. Design system

### Origin
The visual language derives from Paul's email signature: hairline rules, a circular
monogram bisected by a diagonal slash, and a wide letterspaced light sans wordmark.
The brief was to keep that cleanliness but add weight — this is heavy equipment, not
a law firm or a SaaS startup.

### Tokens
All defined in `:root` in the stylesheet. **Never hardcode a hex value or a font
stack anywhere else.** If a new color is genuinely needed, add a token.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F5F5F3` | Page background. Cool near-white, matched to the signature card. |
| `--paper-2` | `#EDEDEA` | Alternating section band. |
| `--ink` | `#151C24` | Headlines, body copy, dark panels, primary buttons. Blue-shifted off neutral black. |
| `--ink-hover` | `#0B1219` | Hover for ink-filled controls. Replaces pure `#000`. |
| `--graphite` | `#4A5158` | Secondary/body text inside components. |
| `--steel` | `#666D73` | Captions, tertiary labels, placeholder text. |
| `--hairline` | `#D6D6D1` | 1px rules on light backgrounds. |
| `--hairline-d` | `#33383D` | 1px rules on dark backgrounds. |
| `--signal` | `#E8B21C` | The brand accent. Markers, `/` bullets, nav underlines, step numbers, dark-context focus. |
| `--signal-deep` | `#B4801A` | Same hue, darker. Contrast-only on light backgrounds (focus rings, underlines). Not a second brand color, never decorative. |
| `--display` | Barlow Condensed | Headlines, model numbers, labels, buttons, table headers. |
| `--body` | Barlow | Body copy, and the wordmark at weight 300 / 0.3em tracking. |

### Rules that are load-bearing

**One brand accent, used sparingly.** `--signal` is deep signal yellow, chosen from
the vernacular of the industry — hoist warning stripes, safety markings. It is
**never** used for body text (contrast fails on paper) and never as a gradient.

It is **not** used as a full-bleed CTA-band fill, and it is **not** used as the
fill on primary buttons sitting on dark backgrounds (that pairing reads as
Caterpillar). On dark contexts (`.hero`, `.page-hero`, `.on-dark`, `.cta-band`),
primary buttons are `--paper` fill with `--ink` text. `--signal` on dark survives
as eyebrow markers, a top hairline on the CTA band, and a 2px reduced-opacity
rule under heroes — not as a yellow wall or a yellow button.

`--signal-deep` is the same hue, darker, added solely to meet contrast minimums
on light backgrounds (focus rings, underlines). It is not a second brand color
and is never used as a fill or a section background.

**Focus rings.** Light backgrounds use `--signal-deep`. Dark contexts (`.hero`,
`.page-hero`, `.on-dark`, `.section--dark`, `.cta-band`, `.site-footer`) keep
`--signal`. Never `outline: none`. Offset stays 3px.

**The slash is the signature element.** It comes from the diagonal in the P/D
monogram and recurs throughout: the `skewX(-20deg)` marker in `.eyebrow::before`,
the `/` character as list bullets, the skewed nav underline, the ambient
`repeating-linear-gradient` hatch inside `.hero` and `.page-hero`, and plate
corner brackets. If one decorative device survives a redesign, it's this one.
Do not touch it as a side effect of other work.

**Sharp corners everywhere.** `border-radius: 0` throughout, including form fields.
This is deliberate and industrial. No rounded cards.

**Data plates.** `.plate` renders spec blocks with machined corner brackets
(`::before` / `::after`). Numeric values use `font-variant-numeric: tabular-nums` so
figures align in columns. Any new spec display should follow this pattern.

**Numbered markers mean sequence.** `01/02/03/04` appears only where the order
carries information (e.g. sourcing steps). Don't add numbering to non-sequential
lists — including the applications set.

### Deliberately avoided
Warm cream backgrounds, terracotta/clay accents, high-contrast serif display faces,
gradients, drop shadows beyond the single dropdown menu, and rounded corners. These
read as generic AI-generated design right now. The cool near-white plus condensed
signage type plus signal yellow is the specific choice being made instead.

---

## 3. Content rules

**Spec data has provenance.** Model specs come **only** from starmixindustries.com
US pages. Never generate, estimate, interpolate, or convert a spec. Do not use the
Spanish-side 880 S figures (8 m³ / 80 m³/hr).

Verified lineup (single source of truth: `src/data/models.ts`):

| Model | Series | Bin capacity | Avg production |
|---|---|---|---|
| 880 S | S | 11 yd³ | 90 yd³/hr |
| 850 S | S | 11 yd³ | 60 yd³/hr |
| 750 L | L | 10 yd³ | 60 yd³/hr |
| 425 S | S | 5.5 yd³ | 30 yd³/hr |
| 327 K | K | 4 yd³ | 30 yd³/hr |
| 740 K | K | not published | not published |

**Six models, three series.** 740 K stays in the file; do not invent figures for it.

Published component specs may be stored on those models where the US pages state
them (750 L water tank / cement hopper / cooler; 880 S water tank / lids / cement
hopper). Manufacturer claims (7 seconds, cascade feed, sub-100 L wash, 47%+
emissions, etc.) live as attributed `claims` in the same module, in the
manufacturer's units — do not convert liters to gallons.

If a figure is not in `models.ts` / `claims`, it does not go on the page. Flag it
for Paul rather than filling it in.

**The footer disclaimer is not optional.** Paul is an independent rep, not the
manufacturer. The paragraph stating that, disclaiming trademark ownership, and
noting specs are subject to change must appear on every page. Legal exposure, not
boilerplate. On the US site it names StarMix (manufacturers actually referenced
here), not SwapLoader.

**Voice.** Plain, direct, and specific. Short declaratives. Volumetric vocabulary
— working window, admixture ratio, lane-return, short load — not hoist vocabulary
(CA dimension, hook height) and not "solutions" / "synergy." The reader is a
professional; write to them as one. Never oversell: "If a smaller unit does the
job better, I'll tell you" is the tone.

**Copy is design material.** Rewriting a headline to be shorter or punchier is a
design decision, not a cosmetic one. Don't do it as a side effect of a layout change.

---

## 4. Known placeholders — these are TODOs, not finished work

1. **Territory is intentionally blank.** The phone is a 515 area code; the business
   has Texas ties. Nobody has decided the coverage story. **Do not invent a service
   area** and do not put DFW, Dallas, Texas, or any city on the page as coverage.
   When Paul decides, it goes in the footer and on the About page.

2. **All photos are placeholders.** Every `.ph` div is a dashed box labeled with the
   recommended dimensions. Replace with real `<img>` and real `alt` text. Priority
   order: plant discharging (`starmix` + home), portrait of Paul (`about` + home).
   No hoist shot on this site.

3. **The logo is a stand-in.** The header uses an inline SVG monogram — `E/S` in a
   circle with a diagonal — built to echo the P/D mark on the signature. If a real
   logo file exists, swap it in.

4. **The contact form is still `mailto:`.** `src/scripts/site.js` packages fields
   into an email so nothing is silently lost. The form markup will be rebuilt
   (branched by intent). The backend is an Astro API route + Resend (`/api/lead`),
   not Netlify Forms — host is Vercel. Until that route ships, do not pretend the
   form POSTs successfully. Tonight's from-address, when Resend ships: Resend
   onboarding/unverified sender with `Reply-To: paul@equipsolutionsgroup.com`.
   Do not send as `paul@` until the domain is verified in Resend. Do not edit
   DNS as a side effect of site work.

5. **Fonts load from Google.** Should be self-hosted before production — offline or
   blocked, the fallback to Arial Narrow noticeably softens the whole design.

6. **The active-nav indicator has never rendered.** `site.css` styles
   `.nav-link[aria-current="page"]::after`, but no element in the nav has ever carried
   `class="nav-link"` — the class exists only in the stylesheet. So the skewed
   underline marking the current page has never appeared, in the static site or in
   Astro. The `aria-current` attribute itself is correct and is now set at build time.
   Adding the class would light up a marker that has never been there, which is a
   visual change, so it was deliberately left alone during the migration. Decide
   whether the current page should be marked, then either add `nav-link` to the nav
   anchors or delete the dead rule.

7. **`noindex, nofollow` is on** in `BaseLayout.astro` until public launch. Do not
   remove it as a side effect of sitemap or config work. Take it off after
   SwapLoader redirects are live so Google never indexes the old dual-line pages.

---

## 5. Architecture

**Current state:** Astro 7, static output (`output: 'static'` — the default).
Astro 7 has no `output: 'hybrid'`; that value throws. Mixed rendering, when
needed, is static plus `export const prerender = false` on the opt-in route, plus
the Vercel adapter. The adapter is **not** installed until the `/api/lead` route
exists. Marketing pages stay prerendered HTML.

`astro.config.mjs` sets `site: 'https://equipsolutionsgroup.com'` (required for
canonicals and the sitemap). `@astrojs/sitemap` is installed and filters
`/swaploader`, `/swaploader.html`, and `/api/`. The layout links to
`/sitemap-index.xml`. Do not add a hand-maintained `public/sitemap.xml`.

Host: **Vercel**. Redirect *entries* live in `astro.config.mjs` (`/swaploader` and
`/swaploader.html` → `/`, 301). The page file is un-routed (`src/archive/swaploader.astro`).
Without the Vercel adapter, a static build emits HTML redirects, not HTTP status
codes — real 301s arrive when the adapter ships.

Migrated from seven standalone HTML files; the port was deliberately
visual-neutral, so the rendered markup is equivalent to the static version apart
from the changes listed below.

```
src/layouts/BaseLayout.astro     doctype, head, skip link, header, slot, footer
src/components/SiteHeader.astro  brand monogram + nav
src/components/SiteFooter.astro  footer nav, disclaimer, copyright
src/components/CtaBand.astro     heading + body props; default slot for buttons;
                                 named `under` slot for WhatsApp + Spanish
src/components/WhatsAppLink.astro official glyph + generic wa.me href
src/pages/*.astro                live routes (body content only)
src/archive/swaploader.astro     un-routed; kept for /es/ later
src/styles/site.css              the one stylesheet, tokens at the top
src/scripts/site.js              dropdown nav, mobile panel, form handoff
src/data/models.ts               StarMix lineup + manufacturer claims (source of truth)
src/data/applications.ts         type-of-work taxonomy (home, /starmix/, later form)
src/data/                        lead schema still to be added
public/assets/img/               photos go here, referenced as /assets/img/...
```

`src/pages/swaploader.astro` has been moved to `src/archive/swaploader.astro`. It
is not a live US route. Nav is flat: StarMix · Parts · Sourcing · About · Quote.
Parts dropdown is StarMix/SMI + request only. Agriculture stays on `/parts/#agriculture`,
not in the header.

Verified lineup lives in `src/data/models.ts`. Homepage stats and `/starmix/` plates
read from it. Do not put a figure on the page that is not in that file or `claims`.

Type of work lives in `src/data/applications.ts` and renders on the homepage and
`/starmix/` from `ApplicationsGrid.astro`. Slugs: `bridge-deck`, `rapid-set`,
`shotcrete`, `municipal`, `mining`, `small-pour`. Homepage anchors are `#${slug}`.
Do not number this set. Do not put manufacturer claims (7 sec, 47% emissions,
sub-100 L wash) on the application cards. The quote form and sizing tool must
reuse this file — do not fork a second taxonomy.

**URLs.** `build.format: 'directory'`, so pages serve at `/starmix/`, `/parts/`
and so on. "Flat" here means no nesting — not `/products/starmix` — and it was
never a requirement that URLs omit a trailing slash. Directory format is Astro's
default and the most portable across hosts. Internal links are written with the
trailing slash to avoid a redirect hop. Do not add `trailingSlash: 'always'`
unless a later pass proves it is required; Vercel has a history of slash
redirect loops.

**These are true and must stay true:**
- Header and footer defined once, in `src/components/`
- Design tokens live in one stylesheet, `src/styles/site.css`
- Every page carries the footer disclaimer — now structural, via the layout
- URLs stay flat
- English at the root; no `/en/` directory

**What the migration changed on purpose** (nothing else changed):
- `aria-current` on nav links is resolved at build time from `Astro.url.pathname`.
  It used to be set by `site.js` from `location.pathname`, which cannot work without
  `.html` extensions. Those six lines were removed from the script.
- The copyright year is rendered at build time, so the per-page inline script is
  gone. The year now reflects the last build rather than the visitor's clock.
- `site.css` is bundled, minified and content-hashed by Astro. The minifier rewrites
  `::before` to `:before`, `skewX(-20deg)` to the equivalent `skew(-20deg)`, and
  merges rules sharing a declaration block. All 180 selectors survive.

---

## 6. Quality floor — don't regress these

- **Responsive to 360px.** Spec tables scroll horizontally inside `.table-scroll`
  rather than squashing; that's intentional, don't "fix" it by shrinking type.
- **Keyboard-navigable nav.** Dropdowns respond to click and Enter, expose
  `aria-expanded`, close on Escape and on focus leaving the item.
- **Visible focus rings.** 2px, 3px offset. `--signal-deep` on light;
  `--signal` on dark. Never `outline: none`.
- **`prefers-reduced-motion` respected.** Already handled globally.
- **Skip link** to `#main` on every page.
- **Real semantics.** One `<h1>` per page, `<th scope>` on spec tables, labels bound
  to inputs.
- **No UI library, CSS framework, or animation library.** Infra packages are
  allowed: `@astrojs/sitemap` now; `@astrojs/vercel` and `resend` when `/api/lead`
  ships. Don't add a component kit to solve something CSS already handles.

---

## 7. Working agreement

- **Plan before editing.** For anything touching more than one file, describe the
  change first and wait for confirmation.
- **Scope one thing at a time.** Don't refactor adjacent code you happen to be
  looking at.
- **Don't invent business facts.** Territory, certifications, years in business,
  customer counts, dealer relationships, pricing, unpublished model specs — if it
  isn't already on the site or in `src/data/`, ask rather than write it.
- **Flag conflicts with this file** instead of silently overriding. If a request
  contradicts something here, say so and ask.
