# equipsolutionsgroup.com — static jump-start

Seven-page static site. No build step, no dependencies. Open `index.html` in a browser
and it runs. Drop the folder into Cursor and keep going from there.

```
index.html          Home — the three lines, process, who he works with
swaploader.html     SwapLoader hooklifts + full model spec table
starmix.html        StarMix volumetric plants + applications + training
sourcing.html       Independent used-equipment sourcing desk
parts.html          SwapLoader parts / SMI parts / agriculture parts / request
about.html          Paul, how he works, what "independent" means
contact.html        Quote request form
assets/css/site.css One stylesheet, tokens at the top
assets/js/site.js   Dropdown nav, mobile panel, form handoff
assets/img/         Empty — drop photos here
```

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
2. **Logo.** `assets/img/` is empty. The header currently uses an inline SVG monogram
   (`E/S` in a circle) built to match the P/D mark on the signature. Swap in the real
   file if there is one — it's in the `MONOGRAM` block, repeated in every page's header.
3. **Photos.** Every dashed placeholder is a `<div class="ph">` with the recommended
   dimensions in the label. Replace each with `<img src="assets/img/....jpg" alt="...">`.
   Highest value first: a hoist mid-swap on `swaploader.html`, a plant discharging on
   `starmix.html`, and a portrait of Paul on `about.html` and the home page.
4. **The form has no backend.** `site.js` currently packages the fields into a `mailto:`
   so nothing is silently lost. Replace with Formspree, Basin, or a Next.js route
   handler when you move it off static. The submit handler is the last block in
   `site.js`.
5. **Header/footer are duplicated across seven files.** Fine for static. The moment you
   move to Next.js or Astro, they become one layout component. Editing the nav means
   editing it in all seven right now.

## Content sourcing

SwapLoader specs (SL-110, SL-112, ST-1614, SL-214, SL-240, SL-2418, SL-520X) are
manufacturer-published as of this build. StarMix figures come from the 850-S and 880-S
model pages; the 880-S is specified in metric and shown with approximate conversions.
The SMI parts taxonomy on `parts.html` mirrors the manufacturer's own categories.
Re-verify before print, and note the disclaimer already in the footer.

## Quality floor

Responsive to 360px. Keyboard-navigable dropdowns with `aria-expanded` and Escape to
close. Visible focus rings. `prefers-reduced-motion` respected. Skip link. No external
dependencies except Google Fonts.
