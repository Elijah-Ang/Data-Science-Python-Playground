# Third-Party Rights and Licenses

## Clearance outcome

The shipped datasets and fonts have documented reuse terms compatible with an educational app when the listed attribution and notices are preserved. Palmer Penguins is explicitly released as CC0 by its upstream package documentation. The separate request to contact Dr Kristen Gorman concerns analysis and collaboration on published final products; it is not stated as a condition of the CC0 grant and is not treated as a permission gate for bundling this educational subset. A public in-app/web acknowledgements page carries the dataset credits, and `assets/licenses/` contains the full font, native Swift package, Pyodide, CPython, OpenBLAS, JavaScript, and embedded wheel notices. `npm run licenses:build` regenerates the notice bundle from pinned upstream sources and the exact vendored wheels.

## Dataset register

| Dataset | Source and identifier | Terms | Treatment in this app |
|---|---|---|---|
| Seoul Bike Sharing Demand | UCI, DOI 10.24432/C5F62R | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Wine Quality | UCI, DOI 10.24432/C56S3T | CC BY 4.0 | Red/white samples combined and used in teaching; credited and marked adapted. |
| Breast Cancer Wisconsin (Diagnostic) | UCI, DOI 10.24432/C5DW2B | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Car Evaluation | UCI, DOI 10.24432/C5JP48 | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Candy Power Ranking | FiveThirtyEight data repository | Repository-wide CC BY 4.0 unless noted otherwise; no contrary dataset notice | Local copy reformatted for the playground; FiveThirtyEight credited. |
| Gapminder five-year data | Gapminder free material / Gapminder teaching extract | Conservatively treated as CC BY 4.0 | Local extract has small numeric/format differences and the ML route filters to 2007; UI uses Gapminder's required credit phrase and marks the copy adapted. |
| Palmer Penguins | Horst, Hill and Gorman (2020), DOI 10.5281/zenodo.3960218; source package and EDI records linked below | CC0, in accordance with the Palmer Station LTER and LTER Type I data policies | The shipped 333-row copy is the complete-case subset of the upstream 344-row `penguins.csv` (columns reordered; no remaining row-value changes). Credit is retained, including Palmer Station LTER and the US LTER Network. The upstream collaboration request should be followed if the project later publishes research analysis; it is not a condition of the CC0 redistribution grant. |

## Fonts

JetBrains Mono, Nunito, and Silkscreen are distributed under the SIL Open Font License 1.1. App embedding is permitted. The full OFL files are bundled in `assets/licenses/fonts/`; the font files are not sold separately and no reserved font names are used for a modified version.

## Python runtime and JavaScript dependencies

Pyodide 0.26.4 is MPL 2.0 and includes packages under their own licenses. The native runtime bundle preserves the exact license/copyright/notice entries extracted from every shipped wheel plus top-level Pyodide, CPython 3.12.1, and OpenBLAS 0.3.26 licenses. If an MPL-covered source file is modified later, its corresponding source must remain available under MPL 2.0.

The pinned Capacitor JavaScript packages and native plugins are MIT-licensed; the bundled `@capacitor/synapse` helper is ISC-licensed. The native SwiftPM closure also includes `capacitor-swift-pm` 8.5.0 and `ion-ios-filesystem` 1.1.2, both of which have their exact MIT notices in the generated bundle. `esbuild` is a build-time tool and is not included in the release archive. A final archive audit should be repeated whenever dependencies or vendored wheels change.

## Release archive audit — 2026-09-04

The local Release archive was built from source commit `9c39c23250d8` with marketing version `1.0.0` and build `1`. The following release-control comparisons passed:

- `npm run licenses:build` generated 55 notice entries (56 files including `manifest.json`).
- The archive's `public/assets/licenses/manifest.json` is byte-for-byte identical to `assets/licenses/manifest.json`; all listed notice files are present with matching contents.
- The archive's `public/acknowledgements.html` and `public/data/palmer-penguins.csv` are byte-for-byte identical to the source files.
- The local Palmer copy was compared with the upstream `penguins.csv`: 344 upstream rows, 333 complete rows, and 333 local rows with no missing or extra complete-case records.

This audit covers the generated payload only and does not replace a legal review if the product scope or source material changes.

## Remaining submission check

Before App Store submission:

1. Regenerate the bundle from the final lock/runtime and repeat the archive comparison above after the final version/build is selected.
2. Keep the acknowledgements page, full notices, source links, and the Palmer/US LTER credit in the final archive.
3. If Data Playground later publishes research findings derived from Palmer Penguins, contact Dr Kristen Gorman about analysis and collaboration as requested by the upstream documentation.

No external permission response is required for the current CC0 educational redistribution scope. This is a release-readiness interpretation of the cited terms, not legal advice.

## Primary references

- UCI dataset pages: https://archive.ics.uci.edu/dataset/560/seoul+bike+sharing+demand · https://archive.ics.uci.edu/dataset/186/wine+quality · https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic · https://archive.ics.uci.edu/dataset/19/car+evaluation
- FiveThirtyEight data license: https://github.com/fivethirtyeight/data/blob/master/README.md
- Gapminder free-material terms: https://www.gapminder.org/free-material/
- Palmer Penguins package documentation: https://github.com/allisonhorst/palmerpenguins/blob/main/README.md · https://allisonhorst.github.io/palmerpenguins/
- Palmer Station LTER data policy and current dataset guidance: https://pallter.marine.rutgers.edu/data/
- Dr Kristen Gorman current contact page: https://www.uaf.edu/cfos/people/faculty/detail/kristen-gorman.php
- Palmer Penguins source CSV: https://raw.githubusercontent.com/allisonhorst/palmerpenguins/main/inst/extdata/penguins.csv
- Palmer Penguins package release: https://zenodo.org/records/3960218
- LTER Network Data Access Policy: https://lternet.edu/data-access-policy/
- Pyodide 0.26.4 license: https://github.com/pyodide/pyodide/blob/0.26.4/LICENSE
- SIL Open Font License: https://openfontlicense.org/
