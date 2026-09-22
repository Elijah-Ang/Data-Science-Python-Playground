# ML learning visual-content review

Reviewed at PR #48 refinement: all 81 teaching-card concepts in light desktop, every one of the 55 current primitive/variant families in dark desktop and at 320/390 px, four actual fitted-evidence figures, all 19 Workflow Challenge collection tiles, and grouped briefs for regression, neural, hierarchy and PCA at desktop/390/320. The capture manifest contains 246 concept views; phone contact cells pair the left and right scroll positions. Individual capture PNGs are reproducible under tests/evidence/ml-learning/visual-audit.

## Findings and corrections

- Preserved the established labelled schematic style and existing curriculum. Every concept image is explicitly captioned “Schematic”; real fitted figures remain separately labelled as output from the current Run. Challenge illustrations contain no fitted scores, selected settings, sample labels or answers.
- Corrected shared covariance for LDA, axis-aligned class likelihoods for Gaussian NB, an actually omitted encoded reference column, numeric intervals for numeric One-R, and a curved RBF boundary. Logistic and KNN diagrams now illustrate their own mechanisms rather than centroid fitting.
- Added lesson-specific diagrams for prediction-time availability, stratification, a dummy reference, imputation, settings versus learned parameters, RMSE versus R², conditional comparisons, correlated coefficients, causal-claim limits, one-output neural regression, cluster evidence/profiles, sample identity, external-label interpretation, PCA weights/scores and equivalent signs, and deployment context. These clarify existing objectives without adding curriculum.
- Fixed the time-axis label clipping; residual segments now terminate on the displayed line. Scaling preserves the same point relationships under an affine rescaling. Centroid symbols align with the schematic point means. PCA axes are perpendicular to the precision of the drawing.
- Increased network-edge contrast. Labels, shapes, line styles, spatial boundaries and symbols carry meaning independently of colour. The confusion schematic counts and precision/recall arithmetic are consistent.
- Diagrams retain 14 px source text at phone widths in a focusable labelled horizontal-scroll region, with an explicit scroll hint. The surrounding page does not overflow. Both diagram edges are captured; the full desktop view supplies the complete schematic in the contact set.
- Real fitted residual, regression-tree, cluster-profile and variance figures were run, checked and inspected. Axes, tree values, group markers and legends match their actual output. The tree’s dense labels can be opened at full image size using the existing larger-figure link.
- Six small task-family silhouettes distinguish regression, classification, neural, time, clustering and PCA challenge tiles. They encode the task family only. Four grouped deliverables remain readable at desktop and both phone widths, with granular check results preserved separately.

## Contact sheets

| Coverage | Sheets |
|---|---|
| All 81 light desktop concepts | [1](ml-learning-visuals/teaching-01.jpg) · [2](ml-learning-visuals/teaching-02.jpg) · [3](ml-learning-visuals/teaching-03.jpg) · [4](ml-learning-visuals/teaching-04.jpg) · [5](ml-learning-visuals/teaching-05.jpg) · [6](ml-learning-visuals/teaching-06.jpg) · [7](ml-learning-visuals/teaching-07.jpg) · [8](ml-learning-visuals/teaching-08.jpg) · [9](ml-learning-visuals/teaching-09.jpg) |
| All 55 dark primitive/variant families | [1](ml-learning-visuals/dark-01.jpg) · [2](ml-learning-visuals/dark-02.jpg) · [3](ml-learning-visuals/dark-03.jpg) · [4](ml-learning-visuals/dark-04.jpg) · [5](ml-learning-visuals/dark-05.jpg) · [6](ml-learning-visuals/dark-06.jpg) · [7](ml-learning-visuals/dark-07.jpg) |
| All 55 families at 320 px | [1](ml-learning-visuals/mobile-320-01.jpg) · [2](ml-learning-visuals/mobile-320-02.jpg) · [3](ml-learning-visuals/mobile-320-03.jpg) · [4](ml-learning-visuals/mobile-320-04.jpg) · [5](ml-learning-visuals/mobile-320-05.jpg) · [6](ml-learning-visuals/mobile-320-06.jpg) · [7](ml-learning-visuals/mobile-320-07.jpg) |
| All 55 families at 390 px | [1](ml-learning-visuals/mobile-390-01.jpg) · [2](ml-learning-visuals/mobile-390-02.jpg) · [3](ml-learning-visuals/mobile-390-03.jpg) · [4](ml-learning-visuals/mobile-390-04.jpg) · [5](ml-learning-visuals/mobile-390-05.jpg) · [6](ml-learning-visuals/mobile-390-06.jpg) · [7](ml-learning-visuals/mobile-390-07.jpg) |

[Challenge collection](ml-learning-visuals/challenge-collection.png). Actual fitted evidence: [residuals](ml-learning-visuals/fitted-ML-R03.png), [tree](ml-learning-visuals/fitted-ML-R09.png), [cluster profiles](ml-learning-visuals/fitted-ML-U05.png), [variance](ml-learning-visuals/fitted-ML-P03.png).

Grouped briefs: [ML-X01 at 1440](ml-learning-visuals/groups-1440-ML-X01.png) · [ML-X01 at 390](ml-learning-visuals/groups-390-ML-X01.png) · [ML-X01 at 320](ml-learning-visuals/groups-320-ML-X01.png) · [ML-X15 at 1440](ml-learning-visuals/groups-1440-ML-X15.png) · [ML-X15 at 390](ml-learning-visuals/groups-390-ML-X15.png) · [ML-X15 at 320](ml-learning-visuals/groups-320-ML-X15.png) · [ML-X18 at 1440](ml-learning-visuals/groups-1440-ML-X18.png) · [ML-X18 at 390](ml-learning-visuals/groups-390-ML-X18.png) · [ML-X18 at 320](ml-learning-visuals/groups-320-ML-X18.png) · [ML-X19 at 1440](ml-learning-visuals/groups-1440-ML-X19.png) · [ML-X19 at 390](ml-learning-visuals/groups-390-ML-X19.png) · [ML-X19 at 320](ml-learning-visuals/groups-320-ML-X19.png).

## Review freshness

`test_ml_learning_visual_audit.py` checks the complete teaching inventory, per-card concept fingerprints, renderer/style/UI source hashes and family coverage. A changed visual source or concept invalidates the review. Browser route tests cover all cards and challenges in Chromium/WebKit; the capture script additionally rejects SVG text outside its viewBox and page overflow. These checks enforce coverage and freshness; the concept/label/evidence review is editorial.

Reproduce with a built local site and local Pyodide assets: `python scripts/audit-ml-learning-visuals.py --base-url http://127.0.0.1:8128` (Playwright Chromium and Pillow). Review the resulting sheets before committing the refreshed manifest.
