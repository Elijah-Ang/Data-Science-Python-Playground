# Statistics Playground

Production entry point: `statistics.html`. Open locally at **http://127.0.0.1:8012/statistics.html?runtime=local** using `python3 statistics/review_server.py`. Run `npm run vendor:pyodide` first if the local runtime is missing. Production uses the same pinned CDN/runtime selection as Data and ML, including the bundled runtime in native mode.

The original statistical recipes are preserved byte for byte, with a deterministic recipe hash contract. Production adds stricter design validation and canonical resampling order for exact group/axis swap reproducibility without changing the methods, seeds or resample counts. The production build includes only the application assets, never tests, screenshots, review notes or local wheels. It generates the Statistics base stylesheet directly from the current ML stylesheet; shared component styling comes from `playground-shared.css`.

Choose a question and dataset, configure the study, and click an unlocked route card to insert and run its editable Python. Completed cells unlock dependencies. Earlier edits invalidate dependent evidence. Desktop has independently scrolling notebook/output panes; at 1120px and below each output follows its cell. Notebook and export actions keep desktop sizing at every width. Notebook, CSV and chart downloads contain the actual current analysis.

## Nine question families

| Question | Supported methods |
|---|---|
| Compare with a reference | One-sample t, independently-known-SD z, bootstrap mean estimation |
| Compare two separate groups | Welch t, justified pooled Student t, Mann–Whitney |
| Compare the same units twice | Paired t, Wilcoxon signed-rank; country identity preserves pairing |
| Compare three or more groups | Welch/classical ANOVA, Kruskal–Wallis; corrected follow-ups when needed |
| Does the effect of one factor depend on another? | Two-factor and Advanced three-factor full-interaction ANOVA |
| Are categories associated? | Chi-square and sparse 2×2 Fisher exact routing |
| Are two numeric variables associated? | Pearson, Spearman with pairing permutations |
| Compare proportions | One proportion vs reference or two independent proportions; appropriate z or exact route |
| Do category shares match prespecified expectations? | Chi-square goodness-of-fit; binary exact binomial fallback |

This is 22 method routes / 23 method-and-design variants including both factorial dimensions. The two exact binomial routes share the same statistical procedure, answering different question families. Existing penguin, Gapminder and candy datasets supply all routes; no new teaching dataset was added.

## Proportion methodology

- **One proportion:** the selected category is success and the other observed categories are failure. Missing outcomes are excluded. If both null-expected successes and failures are at least 10, use the score z-test with variance computed under the reference (`prop_var=reference`), plus a Wilson CI. Otherwise use two-sided `binomtest` and a Clopper–Pearson exact CI. Report the sample proportion and its difference from the reference.
- **Two independent proportions:** both groups require at least four units. A pooled z-test is available only if every observed and pooled-null-expected success/failure count is at least 10. Otherwise use two-sided Fisher exact. Report A−B with a Newcombe difference interval; the exact-test route also includes a conditional odds-ratio exact interval.
- The Newcombe difference interval remains **approximate**, even when Fisher provides the p-value. The exact odds interval targets a different effect. Test and interval boundary decisions need not coincide. Differences are proportions; multiplying by 100 expresses percentage points.
- Counts must be valid integers, the event/group definitions must be meaningful, and observations must be independent. Changing input counts in the notebook rechecks the approximation requirements; invalid z conditions stop the cell rather than silently reporting a misleading result.

## Statistical conventions and boundaries

- Confidence choices: 90%, 95%, 99%; alpha is their complement, chosen before analysis. Tests are two-sided or omnibus. A nonsignificant result does not establish equality, equivalence or no effect.
- Bootstrap: 1,999 percentile resamples, seed 42. Independent groups resample separately; correlation resamples paired rows; paired rank effects resample within-unit differences. These are approximate intervals and may be unstable with small/discrete samples. No bootstrap hypothesis p-value is fabricated.
- Spearman: 9,999 pairing permutations, seed 42, two-sided; average ranks preserve ties. This tests an independence/exchangeability null using rho, not every possible zero-rho distribution. The Monte Carlo p-value has limited resolution.
- Wilcoxon uses nonzero differences, a tie-adjusted normal approximation and continuity correction. Symmetry of differences remains necessary. Mann–Whitney and Kruskal–Wallis concern distributions; median interpretations require comparable shapes.
- One-sample t: SciPy returns a CI for the **mean**. The displayed difference interval explicitly subtracts the reference from both endpoints. Independent/paired t APIs already return difference intervals.
- Cohen d is descriptive: one-sample SD, pooled independent SD, or paired-difference SD respectively. The unstandardized difference CI is not a CI for d. Eta-squared, partial eta-squared, rank epsilon-squared and Cramér V are also labeled descriptive effect estimates; displayed mean/proportion CIs are not intervals for those effects.
- Ordinary one-way ANOVA uses Tukey–Kramer adjusted p-values and simultaneous CIs. Welch ANOVA uses all-pair Welch tests with Holm p-values and Bonferroni simultaneous CIs. Kruskal–Wallis uses all-pair Mann–Whitney plus Holm; its descriptive group-median intervals are pointwise bootstrap intervals. No generic “significant group” labels are inferred from overlapping marginal CIs.
- Factorial ANOVA is a fully crossed, fixed-factor, independent-observation model. It retains all lower-order terms and interactions. Sum coding with Type III tests supports unbalanced cells; main effects refer to equally weighted levels. Highest-order interactions come first. Omnibus term p-values are unadjusted and exploratory across terms; prespecified simple comparisons form one Holm-corrected family with Bonferroni intervals. The model assumes common residual variance; residual Q–Q, residual-versus-fitted and cell-level Levene diagnostics are shown.
- A factor must have 2–4 levels; there must be two or three distinct factors, every combination must exist, every cell needs at least four observations, and there must be usable residual variation. Empty/nested/confounded designs and repeated-measures factorial analysis are not silently approximated.
- Chi-square uses no Yates correction. Its screening rule rejects any expected count below 1 or more than 20% below 5. Sparse 2×2 tables route to Fisher; larger sparse tables stop with an explicit exact/Monte Carlo explanation. Fisher's displayed test statistic is the sample odds ratio; its interval uses the conditional odds-ratio estimate, identified separately. Infinite interval bounds are shown as unbounded rather than converted to zero.
- Minimum four complete units per teaching group is an implementation floor, not a guarantee of valid asymptotic inference or adequate power. Independence, sampling bias, confounding, missingness and practical importance cannot be certified by diagnostic tests.

## Existing datasets inspected and selected

- **Palmer penguins:** the existing file has 333 already-complete records. Body mass/bill/flipper measurements, species/sex categories and species × sex × year support the numeric, categorical and factorial routes. The 18 three-factor cells contain 9–26 records. Species × island has empty cells and is intentionally rejected. These observations are not randomized treatments.
- **Gapminder:** 142 countries matched at two of the existing five-year time points, default 1952 and 2007. Duplicate country-year IDs or a second year not later than the first is rejected. Countries are not individuals; dependence between countries and near-census coverage limit random-sample inference.
- **Candy rankings:** product-level numeric rankings and ingredient flags support teaching comparisons and categorical association. Sugar/price percentiles are not physical percentages/currency; rankings share a voting process. Rare ingredient combinations naturally demonstrate Fisher routing.
- **Seoul bikes:** repeated hourly records have temporal dependence; not offered as independent t/ANOVA rows.
- **Car evaluation:** decision-rule configurations are not a sampled observational population; not used for inferential claims.
- **Wine quality:** duplicate and ordinal-outcome considerations need a more tailored inference question; no forced test coverage.
- **Breast cancer:** image-derived measurements add no essential method coverage beyond the selected examples; not added as a clinical inference exercise.

No new teaching dataset was needed. The shared `dataset-dictionary.js` supplies source links and unit descriptions without modification. Current-route omission counts exclude earlier cleaning that produced the bundled files.

## Files and state architecture

All files below are under `statistics/`.

| File | Change |
|---|---|
| `../statistics.html` | Rebuilt with copied production header/navigation markup, compact controls, Inspector, Suggested Route and one notebook stream |
| `playground-base.css` | Exact first style block copied from canonical `ml.html`; shared production CSS loads afterward |
| `statistics.css` | Statistics-specific study controls and evidence styling; canonical dimensions, tokens, fonts, borders and buttons remain shared |
| `app.js` | Compact question state, inserted-cell state, ordered unlocking, stale invalidation, responsive evidence placement, editor highlighting, Run All/reset/restart/export |
| `worker.js` | Loads the additive modules and handles `configure`/`cell` requests through the existing serial Python bridge |
| `notebook.py` | Persistent namespace, successful-cell checkpoints, rollback, editable-code execution, actual evidence capture, scientific input/output contracts and conditional follow-up dependencies |
| `proportions.py` | Count-aware proportion and goodness-of-fit routes |
| `review_server.py` | Read-only localhost source/runtime overlay for all three pages |
| `tests/test_notebook.py` | Additive numerical and state regressions, including byte-for-byte original recipe preservation |
| `tests/test_browser.py` | Replaced the retired static-layout browser assertions with real progressive-notebook/browser numerical regressions |
| `tests/visual_review.py` | Six literal Data/ML/Statistics side-by-side reviews and computed geometry/typography checks |
| `tests/recipes-baseline.sha256` | Original recipe preservation baseline |
| `README.md`, `VISUAL_REVIEW.md` | Current scope, launch instructions, tests and visual findings |

`tests/test_engine.py` and the datasets retain their original numerical oracles and content. The shared icon rules moved out of ML into the shared stylesheet without changing its controls or workflows. `notebook_plan()` wraps the original recipes with Frame/Conclude stages; it retains their analytical methods. Rank resampling uses a stable group/column order so label swaps use identical seed-42 draws. Evidence reads the actual executed variables. Config changes create a fresh session; a frontend revision token rejects late responses. Each rerun restores the preceding checkpoint and removes later checkpoints. Module references and immutable patsy metadata are retained while numerical arrays, frames and fitted-result objects are copied. Edits are explicitly marked exploratory: the product does not blindly apply a canned conclusion to a changed method.

## Verification

```sh
node --check statistics/app.js
node --check statistics/worker.js
python3 -m unittest discover -s statistics/tests -p 'test_*.py' -v
python3 statistics/tests/test_browser.py --engine chromium
python3 statistics/tests/test_browser.py --engine webkit
python3 statistics/tests/test_layout.py --engine chromium
python3 statistics/tests/test_layout.py --engine webkit
python3 statistics/tests/visual_review.py
```

The browser and visual suites require `review_server.py` on port 8012. Python dependencies are numpy, pandas, scipy, statsmodels, matplotlib, Playwright, and Pillow for review composites. The existing Playwright Chromium/WebKit binaries are used.

- **63 native tests:** the original 49 plus 14 production method, boundary and contract tests. Independent formulas cover score-test null variance, Wilson bounds, binomial enumeration, beta-quantile exact bounds and pooled two-proportion standard errors. Original numerical oracles remain intact, including independent matrix calculations for factorial ANOVA.
- **Both browser engines:** 23 method/design routes compare real Pyodide numerical scalars and tables with native calculations. State checks prove no preloaded cells, automatic execution on route clicks, single-cell insertion, real edits/persistence, dependency locking, upstream invalidation, changed numerical results, failure rollback, current-code export, config clearing, conditional post-hoc omission, reset and cancellation/restart. Populated notebooks are tested at 1512, 1121, 1120, 980 and 390px in both themes, including independent desktop scrolling, breakpoint output migration, inline geometry and confidence text fit. Chromium blocks nonlocal traffic; WebKit observes requests because Playwright interception breaks its Blob workers.
- **Visual review:** all three pages were opened and captured at desktop/tablet/mobile widths in light and dark. Header heights, desktop Inspector width, brand/editor font properties and cell corner radius match canonical ML. Desktop/tablet control-strip density matches after refinement. Outputs use the same desktop split view and compact inline-output breakpoint as Data and ML.

Screenshots, side-by-side composites and `visual-metrics.json` are in ignored `tests/artifacts/`. See [visual review findings](VISUAL_REVIEW.md). Statistics is integrated and deployed at https://dataplayground.science/statistics.html.

## Method references

- [SciPy 1.12 t-test and confidence interval contract](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.ttest_1samp.html)
- [SciPy Tukey HSD / Tukey–Kramer](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.tukey_hsd.html)
- [SciPy Mann–Whitney assumptions and ties](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.mannwhitneyu.html)
- [statsmodels ANOVA API and types](https://www.statsmodels.org/stable/generated/statsmodels.stats.anova.anova_lm.html)
- [statsmodels interactions and sum-contrast example](https://www.statsmodels.org/stable/examples/notebooks/generated/interactions_anova.html)

These references informed implementation; the numerical tests verify the code against formulas and independent matrix calculations, not documentation strings.


- [statsmodels proportion z-test](https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportions_ztest.html)
- [SciPy exact binomial test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html)

The desktop/mobile alignment revision also has a focused `test_layout.py` regression suite. Both Chromium and WebKit pass automatic insertion/execution, edited route-card reruns without duplicates, independent scroll positions, seven widths (1512, 1121, 1120, 980, 820, 560, 390) in both themes, confidence text fit, result-preserving resize and real PNG export. The original integration browser runs passed all 21 numerical routes and state/restart checks, then caught clipped confidence text; the wider control passed the focused suites in both engines after correction.


## Goodness-of-fit and deliberately deferred families

The expected distribution must be prespecified, with positive probabilities summing to one. The selected categories are exhaustive and mutually exclusive; probabilities fitted from these observations require different degrees of freedom and are not accepted by this route. Every expected count must be at least 5 for multinomial chi-square. Binary expected counts below 10 use exact binomial inference. Sparse multinomial expectations stop with a learner-readable explanation rather than forcing an approximation.

The route reports observed/expected counts, chi-square statistic and k−1 degrees of freedom where used, p-value, descriptive Cohen w, and category contribution/percentage-point tables. Category intervals are pointwise Wilson intervals (exact beta intervals on the binary exact route); they are not intervals for w or simultaneous category comparisons. Contribution rankings are descriptive, not post-hoc significance tests. The result cannot establish causation, representative sampling or which category is independently significant.

MANOVA, mixed/multilevel models, survival models, repeated-measures factorial models, equivalence testing and exact/simulated sparse multinomial inference are deliberately deferred. This pass adds the missing foundational question, not a specialist catalogue.

## Exhaustive production audit and release gates

`controls.json` is the production control domain, consumed by the frontend and audit generator. `audit/controls.py --check` recomputes it from the teaching data and validates factorial compatibility. The UI prevents identical variables/groups, duplicate factors, non-later paired years and known incomplete/confounded factorial choices. A separate order selector makes every valid factorial permutation reachable without transient duplicate factors. Backend validation remains active for edited inputs.

`python3 statistics/audit/routes.py --workers 4` executes **6,945** finite candidates: **3,462 valid**, **3,483 deliberately rejected**, including disabled combinations as backend regression cases. Continuous inputs have a separate 32-case representative/boundary/invalid matrix (15 valid, 17 rejected); these do not inflate the finite count. Hidden, irrelevant toggle states are not counted as distinct analyses. Every accepted route compiles and executes all primary and Advanced cells in a real checkpointed notebook session, with the original 1,999 bootstrap / 9,999 permutation draws. Only figure rendering is disabled in this audit; real rendering and exports run in both browser engines.

Outputs under `audit/results/` include every configuration, numerical evidence/rejection, `code-surface.csv` with route/step/primary/Advanced line counts, continuous cases and summary. The finite run contains 1,154 confidence triplets, 1,872 directed group/proportion swaps, 108 directed correlation swaps and 264 factorial-order checks. Primary cells max out at 14 lines; the explicit factorial Advanced prerequisite is 18 lines. Standalone exports include that prerequisite before its use.

The production browser suite compares 18 representative shared components by computed typography, colors, spacing and radii in Data/Statistics/ML across six widths (320–1512px) and both themes. Matching output primitives are sampled in the real output containers alongside actual editable cells and controls. State-dependent route colors are intentionally excluded. CSS transitions are disabled only during deterministic visual comparison. The source and built Statistics base must exactly match ML’s canonical first style block.

`.github/workflows/statistics-audit.yml` runs native oracles, the exhaustive audit, and production-integrated Chromium/WebKit numerical/workflow/visual tests on PRs. Deployment calls that same workflow and cannot publish unless it succeeds. Existing Data/ML regression gates remain active. Audit JSON/CSV and browser screenshots are uploaded as CI artifacts.

Goodness-of-fit API and degrees-of-freedom reference: [SciPy 1.12 chisquare](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.chisquare.html). Exact binary inference: [SciPy 1.12 binomtest](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.binomtest.html).
