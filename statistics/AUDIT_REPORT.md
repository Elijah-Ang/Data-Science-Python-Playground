# Production Statistics audit

Baseline: `240c9ed7a098bcb1a844d35337e76dc48132a607`.

The existing inference recipes and original numerical oracles are preserved. This pass adds goodness-of-fit, guards known invalid designs in the UI, stabilizes rank resampling under swaps, clarifies the factorial Advanced prerequisite, and checks production CSS and browser behavior. It does not replace the Data or ML workflows.

## Supported questions

| Question family | Methods |
|---|---|
| Average versus a reference | One-sample t; independently known population-SD z; bootstrap mean estimation |
| Two independent groups | Welch t; justified pooled Student t; Mann–Whitney |
| Two measurements of the same units | Paired t; Wilcoxon signed-rank, with later-minus-earlier years |
| Several independent groups | Classical one-way ANOVA; Welch ANOVA; Kruskal–Wallis |
| Differences depending on other factors | Fully crossed two-factor and Advanced three-factor ANOVA, sum contrasts and Type III tests |
| Two categorical variables | Chi-square independence; sparse 2×2 Fisher exact |
| Two numeric variables | Pearson; Spearman with 9,999 pairing permutations |
| One or two proportions | One-proportion score z / exact binomial; two-proportion pooled z / Fisher exact |
| One distribution versus expected shares | Chi-square goodness-of-fit; exact binary fallback; explicit sparse multinomial rejection |

Tukey–Kramer, Holm, Bonferroni, effect sizes and appropriate confidence intervals remain in place. Contributions to goodness-of-fit are descriptive, not separate category significance tests. MANOVA, mixed models, survival analysis and similarly specialist families are deliberately deferred.

## Verification results

- **6,945 finite candidates:** **3,462 executed**, **3,483 deliberately rejected**. Disabled UI combinations are included as backend rejection tests; irrelevant hidden toggle states are not distinct configurations.
- **32 continuous-input cases:** **15 executed**, **17 deliberately rejected**, including reference/SD boundaries, approximation thresholds and expected-proportion constraints.
- Every valid route compiled and executed its primary and Advanced cells in dependency order using a real checkpointed notebook session. The exhaustive runner retains all resamples, turns off figure rendering only, and verifies scalars, intervals, labeled tables, conclusions and uncertainty. Browser suites separately execute real chart rendering.
- Cross-permutation checks: **1,154 confidence triplets**, **1,872 directed group/proportion swaps**, **108 directed correlation swaps**, **264 factorial order checks**. Rank draws use stable order so swaps preserve the same p-values and reverse intervals exactly, without changing the statistical methods.
- **Primary Python: maximum 14 lines per cell; zero cells above 25.** The explicitly labeled factorial Advanced prerequisite has 18 lines. The CSV code-surface report covers each configuration and step, including continuous cases. Notebook exports execute independently, including the Advanced prerequisite before use.
- **64 native tests passed**, retaining all original numerical oracles and adding independent goodness-of-fit, interval, graph-axis, schema, boundary and CSS-base checks.
- **Chromium and WebKit:** production-integrated numerical/navigation/export/visual tests passed. Both engines also passed all **23 method/design variants**, actual Pyodide execution, edited state/persistence/rollback, post-hoc omission, cancellation/restart, standalone exports and actual selector-domain checks.
- **Data / Statistics / ML computed styles:** 18 representative components, both themes, widths **320, 390, 834, 1120, 1121 and 1512**. The notebook method suite additionally covers 980px. Controls, typography, source, Inspector, editor, cell/output headers, tables, console and toolbar match. Expanded Study setup labels/selects are also compared with the canonical top controls. Route state colors intentionally reflect each page’s different progress.
- Desktop notebook and output scroll independently. At 1120px and below, evidence remains attached to its producing cell. Mobile controls keep compact action sizing and give the dataset picker a full row.
- JavaScript, route/state, app-shell and PWA checks passed. Existing Data/ML CI regressions remain enabled.

The machine-readable count summary is [audit/verified-summary.json](audit/verified-summary.json). Reproduce the full numerical/code-surface artifacts with `python3 statistics/audit/routes.py --workers 4`; results appear under `statistics/audit/results/`. CI uploads these and the browser screenshots/computed-style JSON.

## Release safeguards

The source and built Statistics base must exactly equal the canonical ML first style block. Shared dataset icon styling lives in `playground-shared.css`. Unjustified Statistics typography/table/console overrides are removed; the shared console surface keeps its text readable in both themes.

The reusable Statistics workflow runs native numerical, exhaustive, Chromium and WebKit production checks on PRs and again as a required deployment dependency. GitHub branch-protection settings are unchanged. The protected PR and its CI results are the release record; this document records local verification before merge.
