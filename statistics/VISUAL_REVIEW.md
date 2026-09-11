# Data / ML / Statistics side-by-side review

The canonical `playground.html`, canonical `ml.html` and Statistics page were opened as real browser pages with local Pyodide. One genuine route cell was inserted in each notebook. Screenshots were compared side by side at **1512px desktop**, **980px tablet** and **390px mobile**, each in **light and dark themes**.

## Shared product geometry and styling

- Header heights match ML at each width: 58px desktop, 60px tablet, 92px mobile.
- Desktop Inspector width is the same 258px. At tablet/mobile it follows the shared responsive Inspector arrangement.
- Desktop/tablet setup strips remain one compact row, with the same approximately 56px height. Mobile study controls wrap like the existing ML controls.
- Brand and editor font family, size, weight and line-height are compared through computed styles, not just screenshots. Cell top corners use the same 6px radius. Route-card borders, number tiles, colors, spacing and status treatments come from shared production CSS.
- The actual Home/Data/ML switch, workflow button, theme control, runtime badge, Inspector cards, Notebook toolbar, code editor gutter/highlighting and output primitives are reused. All three playgrounds now share Home / Data / Stats / ML navigation with the current page highlighted.
- The dataset controls use the existing dataset accent tokens. Statistical evidence follows the shared 1120px breakpoint: independently scrollable cells on the left and output on the right above it, and each output directly below its cell at or below it. Resizing relocates evidence without rerunning Python.

## Refinements from the comparison

1. Removed the prototype-only header/runtime strip, oversized question grid and static Python/results columns.
2. Corrected the initial tablet setup strip, which had wrapped into an unnecessarily tall second row.
3. Corrected console text contrast in light mode while keeping the established dark console surface.
4. Reduced the Inspector to compact study context. Detailed methodology lives with the relevant route cell and in Workflow reference.
5. Matched editor typography, line-number gutter, buttons and output boundaries through copied canonical markup/styles and the shared stylesheet.
6. Checked populated notebooks and outputs in both Chromium and WebKit, including 1121px and 1120px breakpoint boundaries. No page-level horizontal overflow was found; wide code/tables scroll within their own surfaces.

7. Route clicks insert and run immediately, matching Data and ML. Existing edited route cells rerun without creating duplicates.
8. Shortened question labels with test-family hints, capped question/dataset widths and reserved enough room to read the confidence percentage.

## Review artifacts

Each composite has Data, ML and Statistics in that order:

- [Desktop · light](tests/artifacts/side-by-side-1512-light.png)
- [Desktop · dark](tests/artifacts/side-by-side-1512-dark.png)
- [Tablet · light](tests/artifacts/side-by-side-980-light.png)
- [Tablet · dark](tests/artifacts/side-by-side-980-dark.png)
- [Mobile · light](tests/artifacts/side-by-side-390-light.png)
- [Mobile · dark](tests/artifacts/side-by-side-390-dark.png)
- [Computed layout and typography measurements](tests/artifacts/visual-metrics.json)

These files are local QA outputs, excluded from production and Git by the prototype's artifact ignore rule. Recreate them with `python3 prototypes/statistics/tests/visual_review.py` while the review server runs.

## Production integration · 11 September 2026

The production stylesheet is generated from the current ML base, with shared component rules in `playground-shared.css`. Real Chromium and WebKit checks cover 1512, 1121, 1120, 834, 390 and 320px in both themes. Notebook action height, typography and padding match desktop; mobile rows no longer grow into spare vertical space. Navigation, editor and brand typography match across Data, Stats and ML. The built site includes pinned CDN/native runtime selection and bundled statsmodels/patsy license notices.
