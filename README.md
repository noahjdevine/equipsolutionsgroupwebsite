# equipsolutionsgroup.com

Seven-page static site, built with Astro. Static output, no runtime framework — the
shipped page is one stylesheet, one small script, and the font load.

```
npm install
npm run dev      # localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
```

```
src/pages/index.astro       Home — the three lines, process, who he works with
src/pages/swaploader.astro  SwapLoader hooklifts + full model spec table
src/pages/starmix.astro     StarMix volumetric plants + applications + training
src/pages/sourcing.astro    Independent used-equipment sourcing desk
src/pages/parts.astro       SwapLoader parts / SMI parts / agriculture parts / request
src/pages/about.astro       Paul, how he works, what "independent" means
src/pages/contact.astro     Quote request form

src/layouts/BaseLayout.astro     Head, skip link, header, footer — defined once
src/components/SiteHeader.astro  Brand monogram + dropdown nav
src/components/SiteFooter.astro  Footer nav, disclaimer, copyright
src/components/CtaBand.astro     The closing CTA band, on every page

src/styles/site.css   One stylesheet, tokens at the top
src/scripts/site.js   Dropdown nav, mobile panel, form handoff
public/assets/img/    Empty — drop photos here, reference as /assets/img/...
```

Pages serve at `/`, `/swaploader/`, `/parts/` and so on. Links are written with the
trailing slash to avoid a redirect hop.

## Design tokens

Everything derives from the `:root` block in `site.css`. Change these and the whole
site moves together.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F5F5F3` | Cool near-white, matched to the signature card |
| `--ink` | `#17191B` | Headlines and body |
| `--graphite` | `#4A5158` | Secondary text |
| `--signal` | `#E8B21C` | The one accent — markers, rules, active nav, CTA band |
| `--display` | Barlow Condensed | Headlines, model numbers, labels, buttons |
| `--body` | Barlow | Body copy, and the wide-tracked wordmark at weight 300 |

The slash from the P/D monogram is the recurring device: it's the nav hover underline,
the skewed square before every eyebrow label, the `/` bullet in lists, and the ambient
hatch in the dark panels. If you cut one thing, don't cut that.

## Before this goes live — things to edit

1. **Territory.** Nothing on the site claims a coverage area, because the 515 number
   and a Texas base point different directions. Decide the story and add it to the
   footer and the About page.
2. **Logo.** `public/assets/img/` is empty. The header uses an inline SVG monogram
   (`E/S` in a circle) built to match the P/D mark on the signature. Swap in the real
   file if there is one — it lives in `src/components/SiteHeader.astro`, once.
3. **Photos.** Every dashed placeholder is a `<div class="ph">` with the recommended
   dimensions in the label. Replace each with `<img src="/assets/img/....jpg" alt="...">`.
   Highest value first: a hoist mid-swap on `swaploader.astro`, a plant discharging on
   `starmix.astro`, and a portrait of Paul on `about.astro` and the home page.
4. **The form has no backend.** `src/scripts/site.js` packages the fields into a
   `mailto:` so nothing is silently lost. Replace with Formspree, Basin, or an Astro
   endpoint. The submit handler is the last block in the file.
5. **The active-nav indicator has never rendered.** `site.css` styles
   `.nav-link[aria-current="page"]::after`, but nothing in the nav carries
   `class="nav-link"`. `aria-current` is set correctly at build time; the marker just
   has no matching selector. Either add the class or delete the rule — see AGENTS.md
   section 4, item 6.

## Content sourcing

SwapLoader specs (SL-110, SL-112, ST-1614, SL-214, SL-240, SL-2418, SL-520X) are
manufacturer-published as of this build. StarMix figures come from the 850-S and 880-S
model pages; the 880-S is specified in metric and shown with approximate conversions.
The SMI parts taxonomy on `parts.astro` mirrors the manufacturer's own categories.
Re-verify before print, and note the disclaimer already in the footer.

## Quality floor

Responsive to 360px. Keyboard-navigable dropdowns with `aria-expanded` and Escape to
close. Visible focus rings. `prefers-reduced-motion` respected. Skip link. No runtime
dependencies except Google Fonts.
