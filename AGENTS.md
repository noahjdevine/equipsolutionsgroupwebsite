# Project context — equipsolutionsgroup.com

Read this before making changes. It records *why* things are the way they are, so
that fixing one thing doesn't quietly undo another.

---

## 1. What this is

Marketing site for **Equip Solutions Group** — Paul Devine's independent equipment
sales and parts business.

Three revenue lines, and the site is structured around all three:

| Line | Type | Page |
|---|---|---|
| SwapLoader hooklift hoists | 1099 manufacturer rep | `swaploader.html` |
| StarMix volumetric concrete plants | 1099 manufacturer rep | `starmix.html` |
| Equipment & ag parts procurement | Independent / freelance | `sourcing.html`, `parts.html` |

**The third line is the differentiator.** A manufacturer's own website can offer the
first two; only Paul offers the third. On the home page it's deliberately styled
apart — black tag instead of yellow — and that distinction should survive redesigns.

**Primary conversion:** a phone call or a quote request. Not a newsletter signup, not a
download. Every page ends in a CTA band pointing at one of those two.

**Audience:** roll-off and dumpster operators, municipal fleet buyers, concrete
contractors, farms and implement dealers, equipment upfitters. People who buy on
spec, price and lead time — not on brand feeling. They will read a spec table
carefully and skim everything else.

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
| `--ink` | `#17191B` | Headlines, body copy, dark panels, primary buttons. |
| `--graphite` | `#4A5158` | Secondary/body text inside components. |
| `--steel` | `#8A9096` | Captions, tertiary labels, placeholder text. |
| `--hairline` | `#D6D6D1` | 1px rules on light backgrounds. |
| `--hairline-d` | `#33383D` | 1px rules on dark backgrounds. |
| `--signal` | `#E8B21C` | **The only accent.** |
| `--display` | Barlow Condensed | Headlines, model numbers, labels, buttons, table headers. |
| `--body` | Barlow | Body copy, and the wordmark at weight 300 / 0.3em tracking. |

### Rules that are load-bearing

**One accent, used sparingly.** `--signal` is deep signal yellow, chosen from the
vernacular of the industry — hoist warning stripes, safety markings. It appears only
as: the skewed marker before eyebrow labels, the `/` list bullet, the nav hover
underline, the 3px rule under dark heroes, step numbers, and the CTA band fill.
It is **never** used for body text (contrast fails on paper) and never as a gradient.
Adding a second accent color collapses the whole scheme — don't.

**The slash is the signature element.** It comes from the diagonal in the P/D
monogram and recurs throughout: the `skewX(-20deg)` marker in `.eyebrow::before`, the
`/` character as list bullets, the skewed nav underline, and the ambient
`repeating-linear-gradient` hatch inside `.hero` and `.page-hero`. If one decorative
device survives a redesign, it's this one.

**Sharp corners everywhere.** `border-radius: 0` throughout, including form fields.
This is deliberate and industrial. No rounded cards.

**Data plates.** `.plate` renders spec blocks with machined corner brackets
(`::before` / `::after`). Numeric values use `font-variant-numeric: tabular-nums` so
figures align in columns. Any new spec display should follow this pattern.

**Numbered markers mean sequence.** `01/02/03/04` appears only on the process steps
and the sourcing steps, because those genuinely are ordered and the order carries
information. Don't add numbering to non-sequential lists.

### Deliberately avoided
Warm cream backgrounds, terracotta/clay accents, high-contrast serif display faces,
gradients, drop shadows beyond the single dropdown menu, and rounded corners. These
read as generic AI-generated design right now. The cool near-white plus condensed
signage type plus signal yellow is the specific choice being made instead.

---

## 3. Content rules

**Spec data has provenance.** The SwapLoader model table (SL-110, SL-112, ST-1614,
SL-214, SL-240, SL-2418, SL-520X — capacity, body length, hook height) and the
StarMix figures (850-S: 11 yd³ batch, up to 60 yd³/hr; 880-S: 8 m³ hoppers, up to
80 m³/hr, 3.5 t cement hopper, 3,000 L water tank, DCC metering) came from the
manufacturers' published pages. **Do not invent, extrapolate, or "round" these
numbers.** If a figure is needed that isn't already on the site, flag it for Paul to
confirm rather than filling it in.

**The footer disclaimer is not optional.** Paul is an independent rep, not the
manufacturer. The paragraph stating that, disclaiming trademark ownership, and
noting specs are subject to change must appear on every page. Legal exposure, not
boilerplate.

**Voice.** Plain, direct, and specific. Short declaratives. Concrete nouns —
"CA dimension," "hook height," "superseded part number" — not "solutions" and
"synergy." The reader is a professional; write to them as one. Never oversell:
"If a smaller hoist does the job better, I'll tell you" is the tone.

**Copy is design material.** Rewriting a headline to be shorter or punchier is a
design decision, not a cosmetic one. Don't do it as a side effect of a layout change.

---

## 4. Known placeholders — these are TODOs, not finished work

1. **Territory is intentionally blank.** The phone number is a 515 area code (Des
   Moines, where SwapLoader is based) but the business has Texas ties. Nobody has
   decided the coverage story. **Do not invent a service area.** When Paul decides,
   it goes in the footer and on the About page.

2. **All photos are placeholders.** Every `.ph` div is a dashed box labeled with the
   recommended dimensions. Replace with real `<img>` and real `alt` text. Priority
   order: hoist mid-swap (`swaploader`), plant discharging (`starmix`), portrait of
   Paul (`about` + home).

3. **The logo is a stand-in.** The header uses an inline SVG monogram — `E/S` in a
   circle with a diagonal — built to echo the P/D mark on the signature. If a real
   logo file exists, swap it in.

4. **The contact form has no backend.** It currently packages fields into a
   `mailto:` so nothing is silently lost. This is a stopgap. It needs a real
   endpoint before launch.

5. **Fonts load from Google.** Should be self-hosted before production — offline or
   blocked, the fallback to Arial Narrow noticeably softens the whole design.

---

## 5. Architecture

**Current state:** seven standalone HTML files. The header and footer are
copy-pasted into every one of them.

**This is the main technical debt.** Any nav or footer change today means editing
seven files identically. The first priority is extracting them into a single layout
component.

**Target:** Astro. The site is genuinely static, the existing HTML ports over nearly
as-is, and the output ships almost no JavaScript. Next.js is the alternative if a CMS
or authenticated area is coming, but nothing in the current scope requires it.

**After migration, these must still be true:**
- Header and footer defined once
- Design tokens live in one stylesheet
- Every page still carries the footer disclaimer
- URLs stay flat (`/swaploader`, `/parts`, not `/products/swaploader`) — nothing is
  published yet, but keep them clean

---

## 6. Quality floor — don't regress these

- **Responsive to 360px.** Spec tables scroll horizontally inside `.table-scroll`
  rather than squashing; that's intentional, don't "fix" it by shrinking type.
- **Keyboard-navigable nav.** Dropdowns respond to click and Enter, expose
  `aria-expanded`, close on Escape and on focus leaving the item.
- **Visible focus rings.** 2px signal yellow, 3px offset. Never `outline: none`.
- **`prefers-reduced-motion` respected.** Already handled globally.
- **Skip link** to `#main` on every page.
- **Real semantics.** One `<h1>` per page, `<th scope>` on spec tables, labels bound
  to inputs.
- **No dependencies** beyond the font load. Don't add a UI library, a CSS framework,
  or an animation library to solve something CSS already handles.

---

## 7. Working agreement

- **Plan before editing.** For anything touching more than one file, describe the
  change first and wait for confirmation.
- **Scope one thing at a time.** Don't refactor adjacent code you happen to be
  looking at.
- **Don't invent business facts.** Territory, certifications, years in business,
  customer counts, dealer relationships, pricing — if it isn't already on the site,
  ask rather than write it.
- **Flag conflicts with this file** instead of silently overriding. If a request
  contradicts something here, say so and ask.
