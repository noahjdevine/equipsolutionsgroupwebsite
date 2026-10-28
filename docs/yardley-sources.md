# Yardley — model, option and image sources

Reviewed October 28, 2026. US website figures govern base model specifications.
The owner's sheet governs attributed option facts; explicit owner clarifications
govern the stated compatibility rules. Neither a base-model figure nor an option
entry establishes approval of a complete truck, pump, gun or project configuration.

## Model records

The [US lineup](https://starmixindustries.com/) publishes these figures directly:

- [880 S](https://starmixindustries.com/880s): 11 yd³, 90 yd³/hr.
- [850 S](https://starmixindustries.com/850s): 11 yd³, 60 yd³/hr.
- [750 L](https://starmixindustries.com/750l): 10 yd³, 60 yd³/hr.
- [425 S](https://starmixindustries.com/425s): 5.5 yd³, 30 yd³/hr on the lineup.
- [327 K Towable](https://starmixindustries.com/327ktowable): 4 yd³, 30 yd³/hr on
  the lineup. The offered record remains the towable; the separately listed
  Mobile variant is not an additional model on this site.
- [740 K](https://starmixindustries.com/740k): 10 yd³, 60 yd³/hr, also explicitly
  stated on the detail page. Its water tank is described as 2,000 L polyethylene.

Published component facts are recorded in `src/data/models.ts` in manufacturer
units. This pass adds the 425 S and 850 S tank/hopper/cooler facts from their US
detail pages and the 740 K water tank. Existing 750 L and 880 S components remain.
No chassis measurements, payload, price or actual site-throughput guarantee is inferred.

### Conflicts retained for review

- **327 K:** sheet MODELS!E7/G7 gives 27.3 yd³/hr and 3.2 yd. The US lineup gives
  30 yd³/hr and 4 yd³. The towable detail also has metric-only specification copy.
  Keep the US lineup values; do not convert the conflicting copy.
- **425 S:** US lineup says 30 yd³/hr; detail introduction says 32.7; sheet
  MODELS!E9 says 27.3. Keep the approved 30 pending manufacturer clarification.
- **740 K:** replace the old sheet MODELS!G11 range of 9–10 yd³ with the US
  website's 10 yd³. Sheet water-tank wording says polypropylene, while the US
  page says polyethylene; use the website wording.
- **880 S:** the US detail includes 80 cubic meters/hr alongside 90 yd³/hr.
  Keep 90 yd³/hr as published for the US record. Do not convert or merge the two.
- **750 L tank:** the sheet pairs 525 gallons with 2,000 liters, while other rows
  pair 528 gallons with 2,000 liters. Keep the manufacturer's liter figure.
- **Sand and stone:** the MODELS columns describe a 40/60 mix split, not separate
  bin capacities. Do not use them to size or rank models.

## Sheet provenance and options

Source: [STARMIX MODEL CHART INFO](https://docs.google.com/spreadsheets/d/1rHeBfTZXonYS4VTIg8LlNDiCS9K-lQL8/edit).
The previously exported workbook was inspected read-only; it has MODELS and OPTIONS
tabs. No workbook or Google Sheet was changed. Live edits to that sheet do not
automatically update this code; re-review changes before importing them.

`src/data/options.ts` records all eight OPTIONS entries:

- **OPTIONS!A4:G4:** additional high-flow admix, poly, 20 gallons, flow 0–100.
- **OPTIONS!A6:G6:** additional low-flow admix, poly, 20 gallons, flow 0–20.
  The source gives no flow unit for either system; do not add one. Additional
  systems are separate from the model's base admix equipment.
- **OPTIONS!A8:E8:** fiber feeder, 20 pounds.
- **OPTIONS!A10:** fiber chopper; no capacity or rate stated.
- **OPTIONS!A12:C12:** powder color, A-36 carbon steel with epoxy coating.
- **OPTIONS!A14:E14:** latex/polymer, 1,000 liters.
- **OPTIONS!A16:E16:** cement/flyash bin, 1.5 tons.
- **OPTIONS!A18:G22:** DCC, electronic/digital; up to 200 mix designs; calibration
  and production reporting, consumption monitoring, history and traceability,
  Bluetooth and standardized production ticket printing.

MODELS!R9,R11,R13,R15,R17 records DCC on the 425 S, 740 K, 750 L, 850 S and 880 S.
Treat it as standard on these truck models. MODELS!R7 records a Perkins diesel
engine and digital counter for the 327 K. Do not infer DCC is impossible there:
its availability is unconfirmed. Mount facts come from MODELS!C7,C9,C11,C13,C15,C17.

### Owner clarifications — October 28, 2026

The owner explicitly confirmed in the planning conversation:

- Latex candidates: 740 K, 750 L, 850 S, 880 S.
- Fiber chopper: the same four models. It requires high-volume air; an additional
  truck air tank may be needed. No air-flow, pressure or tank-size figure was given.
- Exclude 327 K and 425 S for either required feature, in both recommendation slots.
- The fiber feeder is a different system; chopper restrictions do not establish
  its model compatibility. The latex confirmation does not approve every distinct
  polymer requirement.
- The additional cement/flyash bin is a special additional cement bin for any
  model, not standard equipment. Final truck/trailer integration is reviewed by Paul.

The catalog encodes these facts, and the stage 2 fitter now consumes them before
ranking candidates. Other unlisted combinations remain
unconfirmed, rather than being marked compatible or unavailable.

## Manufacturer image manifest

The owner authorized use of the manufacturer's model images. These six images
are linked to the corresponding models on the US homepage. Local WebP copies
were optimized without enlargement and visually checked against those labels.
No generated machine image was substituted. Dimensions below are the local files.

- **880 S:** `public/assets/img/starmix/880-s.webp`, 484 × 400.
  [Original](https://starmixindustries.com/img/maquinas/880s.webp).
- **850 S:** `public/assets/img/starmix/850-s.webp`, 484 × 400.
  [Original](https://starmixindustries.com/img/maquinas/850-s.webp).
- **425 S:** `public/assets/img/starmix/425-s.webp`, 484 × 400.
  [Original](https://starmixindustries.com/img/maquinas/425-s.png).
- **750 L:** `public/assets/img/starmix/750-l.webp`, 523 × 400.
  [Original](https://starmixindustries.com/img/maquinas/seriel2.webp).
- **327 K Towable:** `public/assets/img/starmix/327-k.webp`, 484 × 400.
  [Original](https://starmixindustries.com/img/maquinas/327-k-remolcable.webp).
- **740 K:** `public/assets/img/starmix/740-k.webp`, 484 × 400.
  [Original](https://starmixindustries.com/img/maquinas/740-k.png).

Asset source, local dimensions and model-specific alt text also live with each
record in `src/data/models.ts`, so the guide and lineup reuse the same metadata.
Homepage/about photos of a working plant and Paul remain separate placeholders.
