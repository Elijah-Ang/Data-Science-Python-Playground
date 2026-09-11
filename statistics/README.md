# Statistics Playground

Production entry point: `statistics.html`. Open locally at **http://127.0.0.1:8012/statistics.html?runtime=local** using `python3 statistics/review_server.py`. Run `npm run vendor:pyodide` first if the local runtime is missing. Production uses the same pinned CDN/runtime selection as Data and ML, including the bundled runtime in native mode.

The original statistical engine is preserved byte for byte. The production build includes only the application assets, never tests, screenshots, review notes or local wheels. It generates the Statistics base stylesheet directly from the current ML stylesheet; shared component styling comes from `playground-shared.css`.

Choose a question and dataset, configure the study, and click an unlocked route card to insert and run its editable Python. Completed cells unlock dependencies. Earlier edits invalidate dependent evidence. Desktop has independently scrolling notebook/output panes; at 1120px and below each output follows its cell. Notebook and export actions keep desktop sizing at every width. Notebook, CSV and chart downloads contain the actual current analysis.

## Eight question families

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

This is 20 method implementations / 21 method-and-design variants including both factorial dimensions. Existing penguin, Gapminder and candy datasets supply all routes; no new teaching dataset was added.

## New proportion methodology

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
- **Gapminder:** 142 countries matched at two of the existing five-year time points, default 1952 and 2007. Duplicate country-year IDs or selecting one year twice is rejected. Countries are not individuals; dependence between countries and near-census coverage limit random-sample inference.
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
| `index.html` | Rebuilt with copied production header/navigation markup, compact controls, Inspector, Suggested Route and one notebook stream |
| `playground-base.css` | Exact first style block copied from canonical `ml.html`; shared production CSS loads afterward |
| `statistics.css` | Statistics-specific study controls and evidence styling; canonical dimensions, tokens, fonts, borders and buttons remain shared |
| `app.js` | Compact question state, inserted-cell state, ordered unlocking, stale invalidation, responsive evidence placement, editor highlighting, Run All/reset/restart/export |
| `worker.js` | Loads the additive modules and handles `configure`/`cell` requests through the existing serial Python bridge |
| `notebook.py` | Persistent namespace, successful-cell checkpoints, rollback, editable-code execution, actual evidence capture, scientific input/output contracts and conditional follow-up dependencies |
| `proportions.py` | The new count-aware proportion routes only |
| `review_server.py` | Read-only localhost source/runtime overlay for all three pages |
| `tests/test_notebook.py` | Additive numerical and state regressions, including byte-for-byte engine preservation |
| `tests/test_browser.py` | Replaced the retired static-layout browser assertions with real progressive-notebook/browser numerical regressions |
| `tests/visual_review.py` | Six literal Data/ML/Statistics side-by-side reviews and computed geometry/typography checks |
| `tests/engine-baseline.sha256` | Engine preservation baseline |
| `README.md`, `VISUAL_REVIEW.md` | Current scope, launch instructions, tests and visual findings |

`engine.py`, `tests/test_engine.py`, datasets and all pre-existing production files are unchanged. `notebook_plan()` wraps the original recipes with Frame/Conclude stages; it does not replace their analytical methods. Evidence reads the actual executed variables. Config changes create a fresh session; a frontend revision token rejects late responses. Each rerun restores the preceding checkpoint and removes later checkpoints. Module references and immutable patsy metadata are retained while numerical arrays, frames and fitted-result objects are copied. Edits are explicitly marked exploratory: the product does not blindly apply a canned conclusion to a changed method.

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

- **49 native tests:** the original 31 plus 18 additive notebook/proportion tests. Independent formulas cover score-test null variance, Wilson bounds, binomial enumeration, beta-quantile exact bounds and pooled two-proportion standard errors. Every original route still matches the untouched engine.
- **Both browser engines:** 21 method/design routes compare real Pyodide numerical scalars and tables with native calculations. State checks prove no preloaded cells, automatic execution on route clicks, single-cell insertion, real edits/persistence, dependency locking, upstream invalidation, changed numerical results, failure rollback, current-code export, config clearing, conditional post-hoc omission, reset and cancellation/restart. Populated notebooks are tested at 1512, 1121, 1120, 980 and 390px in both themes, including independent desktop scrolling, breakpoint output migration, inline geometry and confidence text fit. Chromium blocks nonlocal traffic; WebKit observes requests because Playwright interception breaks its Blob workers.
- **Visual review:** all three pages were opened and captured at desktop/tablet/mobile widths in light and dark. Header heights, desktop Inspector width, brand/editor font properties and cell corner radius match canonical ML. Desktop/tablet control-strip density matches after refinement. Outputs use the same desktop split view and compact inline-output breakpoint as Data and ML.

Screenshots, side-by-side composites and `visual-metrics.json` are in ignored `tests/artifacts/`. See [visual review findings](VISUAL_REVIEW.md). Nothing has been integrated or deployed.

## Method references

- [SciPy 1.12 t-test and confidence interval contract](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.ttest_1samp.html)
- [SciPy Tukey HSD / Tukey–Kramer](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.tukey_hsd.html)
- [SciPy Mann–Whitney assumptions and ties](https://docs.scipy.org/doc/scipy-1.12.0/reference/generated/scipy.stats.mannwhitneyu.html)
- [statsmodels ANOVA API and types](https://www.statsmodels.org/stable/generated/statsmodels.stats.anova.anova_lm.html)
- [statsmodels interactions and sum-contrast example](https://www.statsmodels.org/stable/examples/notebooks/generated/interactions_anova.html)

These references informed implementation; the numerical tests verify the code against formulas and independent matrix calculations, not documentation strings.


- [statsmodels proportion z-test](https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportions_ztest.html)
- [SciPy exact binomial test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html)

The desktop/mobile alignment revision also has a focused `test_layout.py` regression suite. Both Chromium and WebKit pass automatic insertion/execution, edited route-card reruns without duplicates, independent scroll positions, seven widths (1512, 1121, 1120, 980, 820, 560, 390) in both themes, confidence text fit, result-preserving resize and real PNG export. Initial full browser runs passed all 21 numerical routes and state/restart checks, then caught clipped confidence text; the wider control passed the focused suites in both engines after correction.
