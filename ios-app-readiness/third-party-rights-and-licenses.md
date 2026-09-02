# Third-Party Rights and Licenses

## Clearance outcome

The shipped datasets and fonts have reuse terms that permit this educational app when the listed attribution and notices are preserved. A public in-app/web acknowledgements page now carries the dataset credits, and `assets/licenses/` contains the full font, Pyodide, CPython, OpenBLAS, and embedded wheel notices. `npm run licenses:build` regenerates the notice bundle from pinned upstream sources and the exact vendored wheels.

## Dataset register

| Dataset | Source and identifier | Terms | Treatment in this app |
|---|---|---|---|
| Seoul Bike Sharing Demand | UCI, DOI 10.24432/C5F62R | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Wine Quality | UCI, DOI 10.24432/C56S3T | CC BY 4.0 | Red/white samples combined and used in teaching; credited and marked adapted. |
| Breast Cancer Wisconsin (Diagnostic) | UCI, DOI 10.24432/C5DW2B | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Car Evaluation | UCI, DOI 10.24432/C5JP48 | CC BY 4.0 | Local teaching copy; credited and marked adapted. |
| Candy Power Ranking | FiveThirtyEight data repository | Repository-wide CC BY 4.0 unless noted otherwise; no contrary dataset notice | Local copy reformatted for the playground; FiveThirtyEight credited. |
| Gapminder five-year data | Gapminder free material / Gapminder teaching extract | Conservatively treated as CC BY 4.0 | Local extract has small numeric/format differences and the ML route filters to 2007; UI uses Gapminder's required credit phrase and marks the copy adapted. |
| Palmer Penguins | Horst, Hill and Gorman (2020), DOI 10.5281/zenodo.3960218 | CC0 | Credit retained voluntarily, including Palmer Station LTER collection acknowledgement. Confirm any current publisher-contact convention before a public store submission. |

## Fonts

JetBrains Mono, Nunito, and Silkscreen are distributed under the SIL Open Font License 1.1. App embedding is permitted. The full OFL files are bundled in `assets/licenses/fonts/`; the font files are not sold separately and no reserved font names are used for a modified version.

## Python runtime and JavaScript dependencies

Pyodide 0.26.4 is MPL 2.0 and includes packages under their own licenses. The native runtime bundle preserves the exact license/copyright/notice entries extracted from every shipped wheel plus top-level Pyodide, CPython 3.12.1, and OpenBLAS 0.3.26 licenses. If an MPL-covered source file is modified later, its corresponding source must remain available under MPL 2.0.

The pinned Capacitor packages and esbuild declare MIT licensing. Their package metadata remains in the locked source tree. A final archive audit should be repeated whenever dependencies or vendored wheels change.

## Remaining submission check

Before App Store submission, confirm Palmer Station LTER's current publication-contact convention, regenerate the bundle from the final lock/runtime, and compare the acknowledgements page against the exact release archive. This is a release-control check, not an identified prohibition on current use.

## Primary references

- UCI dataset pages: https://archive.ics.uci.edu/dataset/560/seoul+bike+sharing+demand · https://archive.ics.uci.edu/dataset/186/wine+quality · https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic · https://archive.ics.uci.edu/dataset/19/car+evaluation
- FiveThirtyEight data license: https://github.com/fivethirtyeight/data/blob/master/README.md
- Gapminder free-material terms: https://www.gapminder.org/free-material/
- Palmer Penguins: https://allisonhorst.github.io/palmerpenguins/
- Pyodide 0.26.4 license: https://github.com/pyodide/pyodide/blob/0.26.4/LICENSE
- SIL Open Font License: https://openfontlicense.org/
