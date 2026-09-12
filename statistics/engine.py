"""Statistics Playground: question router, readable notebook recipes, verified execution.

The notebook recipe is the computation, not a decorative alternative implementation.
Application validation, graphics serialization and interpretation live outside it.
"""
from itertools import combinations, product
import base64
import io
import json
import warnings
import numpy as np
import pandas as pd
from scipy import stats

FAMILIES = {
    'reference': 'Compare a numeric value with a reference',
    'independent': 'Compare two separate groups',
    'paired': 'Compare two measurements of the same subjects',
    'groups': 'Compare three or more groups',
    'factorial': 'Ask whether a difference depends on other factors',
    'categorical': 'Ask whether categories are associated',
    'association': 'Study how two numeric values move together',
}
METHODS = {
    'one_t': 'One-sample t-test', 'one_z': 'One-sample z-test',
    'bootstrap': 'Bootstrap mean interval', 'welch': "Welch’s t-test",
    'student': 'Independent t-test (equal variance)', 'paired_t': 'Paired t-test',
    'mannwhitney': 'Mann–Whitney U', 'wilcoxon': 'Wilcoxon signed-rank',
    'anova': 'One-way ANOVA', 'welch_anova': 'Welch one-way ANOVA',
    'kruskal': 'Kruskal–Wallis', 'factorial': 'Factorial ANOVA',
    'chi2': 'Chi-square association', 'fisher': 'Fisher exact association',
    'pearson': 'Pearson correlation', 'spearman': 'Spearman rank association',
}
NUMERIC = {
    'penguins': ['body_mass_g', 'bill_length_mm', 'bill_depth_mm', 'flipper_length_mm'],
    'candy': ['winpercent', 'sugarpercent', 'pricepercent'],
    'gapminder': ['lifeExp', 'gdpPercap'],
}
CATEGORICAL = {
    'penguins': ['species', 'sex', 'island', 'year'],
    'candy': ['chocolate', 'fruity', 'caramel', 'peanutyalmondy', 'hard', 'bar'],
    'gapminder': ['continent'],
}
SOURCES = {
    'penguins': {'file': 'palmer-penguins.csv', 'name': 'Palmer penguins', 'unit': 'penguin',
        'note': 'The bundled file contains 333 complete penguin records; omission counts refer only to this file. Observed penguins, not randomized treatments. Island, species and sampling year can confound comparisons. Independence depends on sampling design; it cannot be established from a diagnostic test.'},
    'candy': {'file': 'candy-power-ranking.csv', 'name': 'Candy rankings', 'unit': 'candy product',
        'note': 'Products are the units, not individual voters. Rankings share a voting process and products are not a random sample of all candy. Inference is illustrative and cannot establish ingredient effects.'},
    'gapminder': {'file': 'gapminder.csv', 'name': 'Gapminder countries', 'unit': 'country',
        'note': 'Countries are matched by name across years. These are country-level estimates, not individual life spans. Shared regional trends and a near-census limit a random-sample interpretation.'},
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def prepare(raw, config):
    """Validate data structure before selecting a method. No silent numeric coercion."""
    c = dict(config)
    family = c.get('family', 'independent')
    dataset = c.get('dataset', 'penguins')
    require(family in FAMILIES and dataset in SOURCES, 'Choose a supported question and dataset.')
    require(dataset != 'gapminder' or family == 'paired', 'Use Gapminder as matched countries, not independent repeated rows.')
    require(family != 'paired' or dataset == 'gapminder', 'Matched comparisons use Gapminder countries at two years.')
    require(family != 'factorial' or dataset == 'penguins', 'The factorial route uses penguin species, sex and year.')
    c.update(family=family, dataset=dataset)
    c['confidence'] = float(c.get('confidence', .95))
    require(c['confidence'] in (.90, .95, .99), 'Choose 90%, 95% or 99% confidence before analysis.')
    c['alpha'] = round(1-c['confidence'], 10)
    c['goal'] = c.get('goal', 'mean')
    require(c['goal'] in ('mean', 'rank', 'estimate'), 'Choose means, ranks, or estimation.')
    c['equal_variance'] = bool(c.get('equal_variance', False))
    c['y'] = c.get('y', NUMERIC[dataset][0])
    require(c['y'] in NUMERIC[dataset] or family == 'categorical', 'Select a numeric outcome.')
    prep = 'import numpy as np\nimport pandas as pd\nfrom scipy import stats\n'
    if family == 'paired':
        before, after = int(c.get('before', 1952)), int(c.get('after', 2007))
        require(before < after, 'Choose a second year later than the first year.')
        require(before in raw.year.values and after in raw.year.values, 'Both years must exist in the data.')
        require(not raw.duplicated(['country', 'year']).any(), 'Duplicate country-year records would make pairing ambiguous.')
        c.update(before=before, after=after)
        prep += f'paired = df.pivot(index="country", columns="year", values={c["y"]!r})\npaired = paired[[{before}, {after}]].dropna()\na = paired[{after}].to_numpy()\nb = paired[{before}].to_numpy()\ndifference = a - b\n'
        data = raw.pivot(index='country', columns='year', values=c['y'])[[before, after]]
        original = len(data)
        data = data.dropna()
        c['labels'] = [str(after), str(before)]
        cols = [before, after]
    else:
        cols = [c['y']]
        if family in ('independent', 'groups'):
            c['group'] = c.get('group', 'species' if dataset == 'penguins' else 'chocolate')
            require(c['group'] in CATEGORICAL[dataset], 'Choose a categorical grouping variable.')
            cols += [c['group']]
        if family == 'factorial':
            c['factors'] = c.get('factors', ['species', 'sex'])
            require(len(c['factors']) in (2, 3) and len(set(c['factors'])) == len(c['factors']), 'Choose two or three distinct factors.')
            require(all(f in CATEGORICAL[dataset] for f in c['factors']), 'Factors must be categorical.')
            cols += c['factors']
        if family in ('association', 'categorical'):
            c['x'] = c.get('x', 'flipper_length_mm' if dataset == 'penguins' else 'pricepercent')
            if family == 'categorical':
                c['y'] = config.get('y', 'sex' if dataset == 'penguins' else 'fruity')
                c['x'] = config.get('x', 'species' if dataset == 'penguins' else 'chocolate')
                require(c['x'] in CATEGORICAL[dataset] and c['y'] in CATEGORICAL[dataset], 'Choose two categorical variables.')
            else:
                require(c['x'] in NUMERIC[dataset], 'Both association variables must be numeric.')
            require(c['x'] != c['y'], 'Choose two distinct variables.')
            cols = [c['x'], c['y']]
        require(all(col in raw for col in cols), 'A selected column is missing.')
        data = raw[cols].copy()
        original = len(data)
        data = data.dropna()
        prep += f'data = df[{cols!r}].dropna()\n'
        if family == 'independent':
            levels = sorted(data[c['group']].unique(), key=str)
            selected = c.get('levels', [str(x) for x in levels[:2]])
            require(len(selected) == 2 and len(set(selected)) == 2, 'Choose two distinct groups.')
            require(all(str(x) in [str(v) for v in levels] for x in selected), 'A selected group is absent.')
            # Normalize category labels only, never the numeric measurement.
            data[c['group']] = data[c['group']].astype(str)
            data = data[data[c['group']].isin([str(x) for x in selected])]
            c['labels'] = [str(x) for x in selected]
            prep += f'data[{c["group"]!r}] = data[{c["group"]!r}].astype(str)\na = data.loc[data[{c["group"]!r}] == {c["labels"][0]!r}, {c["y"]!r}].to_numpy()\nb = data.loc[data[{c["group"]!r}] == {c["labels"][1]!r}, {c["y"]!r}].to_numpy()\n'
        elif family == 'groups':
            c['labels'] = [str(x) for x in sorted(data[c['group']].unique(), key=str)]
            require(3 <= len(c['labels']) <= 8, 'This question needs 3–8 groups. Use two separate groups for a binary factor.')
            prep += f'labels = sorted(data[{c["group"]!r}].unique(), key=str)\ngroups = [data.loc[data[{c["group"]!r}] == label, {c["y"]!r}].to_numpy() for label in labels]\n'
        elif family == 'reference':
            c['reference'] = float(c.get('reference', 4000 if dataset == 'penguins' else 50))
            require(np.isfinite(c['reference']), 'The reference must be finite.')
            if config.get('sigma') not in (None, ''):
                c['sigma'] = float(config['sigma'])
                require(np.isfinite(c['sigma']) and c['sigma'] > 0, 'Known population SD must be positive.')
                require(config.get('known_sigma') is True, 'A z-test needs externally known population SD, not the sample SD.')
            prep += f'a = data[{c["y"]!r}].to_numpy()\nreference = {c["reference"]!r}\n'
        elif family == 'association':
            prep += f'a = data[{c["x"]!r}].to_numpy()\nb = data[{c["y"]!r}].to_numpy()\n'
        elif family == 'categorical':
            prep += f'table = pd.crosstab(data[{c["x"]!r}], data[{c["y"]!r}])\n'
    require(len(data) >= 4, 'At least four complete observations are needed for this teaching route.')
    numeric_cols = cols if family == 'paired' else [x for x in cols if x in NUMERIC[dataset]]
    for col in numeric_cols:
        require(pd.api.types.is_numeric_dtype(data[col]), f'{col} must contain numeric values.')
        require(np.isfinite(data[col].to_numpy(dtype=float)).all(), f'{col} contains non-finite values.')
        require(data[col].nunique() > 1, f'{col} has no variation.')
    if family in ('independent', 'groups'):
        sizes = data.groupby(c['group'], observed=True)[c['y']].agg(['size', 'std'])
        require((sizes['size'] >= 4).all(), 'Each selected group needs at least four complete observations.')
        require((sizes['std'] > 0).all(), 'Every selected group must have variation.')
    if family == 'paired':
        require(np.std(data[cols[1]]-data[cols[0]], ddof=1) > 0, 'Paired differences have no variation.')
    if family == 'factorial':
        levels = [data[f].unique() for f in c['factors']]
        require(all(2 <= len(v) <= 4 for v in levels), 'Each factor needs 2–4 levels.')
        counts = data.groupby(c['factors'], observed=True).size()
        require(len(counts) == np.prod([len(v) for v in levels]), 'Empty factorial cells: these factors are confounded or nested. Choose a fully crossed design.')
        require(counts.min() >= 4, 'Each factorial cell needs at least four observations to estimate within-cell variation.')
        centered = data[c['y']] - data.groupby(c['factors'], observed=True)[c['y']].transform('mean')
        require(np.sum(centered**2) > np.finfo(float).eps * np.sum(data[c['y']]**2), 'No usable within-cell residual variation remains for factorial inference.')
    c['n'] = len(data)
    c['omitted'] = original - len(raw[cols].dropna()) if family != 'paired' else original-len(data)
    c['excluded'] = original-c['omitted']-len(data)
    return c, data, prep


def route(c, data):
    family = c['family']
    if family == 'reference':
        return 'bootstrap' if c['goal'] == 'estimate' else ('one_z' if 'sigma' in c else 'one_t')
    if family == 'independent':
        return 'mannwhitney' if c['goal'] == 'rank' else ('student' if c['equal_variance'] else 'welch')
    if family == 'paired':
        return 'wilcoxon' if c['goal'] == 'rank' else 'paired_t'
    if family == 'groups':
        return 'kruskal' if c['goal'] == 'rank' else ('anova' if c['equal_variance'] else 'welch_anova')
    if family == 'association':
        return 'spearman' if c['goal'] == 'rank' else 'pearson'
    if family == 'factorial':
        return 'factorial'
    table = pd.crosstab(data[c['x']], data[c['y']])
    require(min(table.shape) >= 2, 'Both categorical variables need at least two observed levels.')
    expected = stats.contingency.expected_freq(table)
    sparse = (expected < 1).any() or (expected < 5).mean() > .2
    if sparse:
        require(table.shape == (2, 2), 'Expected counts are too sparse for chi-square. This larger table needs an exact/Monte Carlo method outside this Playground’s scope; collect more data or predefine meaningful categories.')
        return 'fisher'
    return 'chi2'


def step(title, explanation, code):
    return {'title': title, 'explanation': explanation, 'code': code.strip()}


def recipe(c, method, prep):
    cl, alpha = c['confidence'], c['alpha']
    steps = [step('Select the observations', 'Only rows missing a selected variable are removed. Pairing uses country identity, never row order. Group direction is A minus B.', prep)]
    diagnostics = ''
    if method in ('one_t', 'one_z', 'bootstrap'):
        diagnostics = 'print("n, mean, SD:", len(a), a.mean(), a.std(ddof=1))\nprint("Shapiro–Wilk:", stats.shapiro(a).pvalue)'
    elif method in ('paired_t', 'wilcoxon'):
        diagnostics = 'print("Complete pairs:", len(difference))\nprint("Shapiro–Wilk of differences:", stats.shapiro(difference).pvalue)'
    elif method in ('welch', 'student', 'mannwhitney'):
        diagnostics = 'print("Group sizes:", len(a), len(b))\nprint("Shapiro–Wilk by group:", stats.shapiro(a).pvalue, stats.shapiro(b).pvalue)\nprint("Median-centered Levene:", stats.levene(a, b).pvalue)'
    elif method in ('anova', 'welch_anova', 'kruskal'):
        diagnostics = 'print("Group sizes:", [len(group) for group in groups])\nprint("Shapiro–Wilk by group:", [stats.shapiro(group).pvalue for group in groups])\nprint("Median-centered Levene:", stats.levene(*groups).pvalue)'
    elif method in ('chi2', 'fisher'):
        diagnostics = 'expected = stats.contingency.expected_freq(table)\nprint("Observed counts:")\nprint(table)\nprint("Smallest expected count:", expected.min())'
    elif method in ('pearson', 'spearman'):
        diagnostics = 'print("Complete pairs:", len(a))\nprint("Inspect the scatterplot for shape, unusual points and mixed subgroups.")'
    elif method == 'factorial':
        diagnostics = f'print(data.groupby({c["factors"]!r})[{c["y"]!r}].agg(["count", "mean", "std"]))'
    if method == 'mannwhitney':
        diagnostics = 'print("Group sizes:", len(a), len(b))\nprint("Group quantiles:", np.quantile(a, [.1, .5, .9]), np.quantile(b, [.1, .5, .9]))\nprint("Normality is not required; inspect distribution shapes before a location-shift interpretation.")'
    elif method == 'wilcoxon':
        diagnostics = 'print("Complete pairs:", len(difference))\nprint("Negative, zero, positive differences:", sum(difference < 0), sum(difference == 0), sum(difference > 0))\nprint("Inspect the differences for symmetry; normality is not required.")'
    elif method == 'kruskal':
        diagnostics = 'print("Group sizes:", [len(g) for g in groups])\nprint("Group quantiles:", [np.quantile(g, [.1, .5, .9]) for g in groups])\nprint("Normality is not required; compare shapes before interpreting this as a median difference.")'
    steps.append(step('Check the relevant assumptions', 'Read the plots and study design together. A large diagnostic p-value does not prove an assumption; a small one is not an automatic instruction to switch tests. Independence comes from how observations were collected.', diagnostics))
    test, effect, follow = '', '', ''
    boot = f'confidence_level={cl}, n_resamples=1999, method="percentile", random_state=42'
    if method in ('one_t', 'welch', 'student', 'paired_t'):
        call = {'one_t':'stats.ttest_1samp(a, reference)', 'welch':'stats.ttest_ind(a, b, equal_var=False)', 'student':'stats.ttest_ind(a, b, equal_var=True)', 'paired_t':'stats.ttest_rel(a, b)'}[method]
        test = f'result = {call}\nstatistic, p_value = result.statistic, result.pvalue\nprint("t, p:", statistic, p_value)'
        estimate = 'a.mean() - reference' if method == 'one_t' else 'a.mean() - b.mean()'
        d = '(a.mean() - reference) / a.std(ddof=1)' if method == 'one_t' else ('difference.mean() / difference.std(ddof=1)' if method == 'paired_t' else '(a.mean() - b.mean()) / np.sqrt(((len(a)-1)*a.var(ddof=1) + (len(b)-1)*b.var(ddof=1)) / (len(a)+len(b)-2))')
        effect = f'estimate = {estimate}\ninterval = result.confidence_interval(confidence_level={cl})\neffect_size = {d}\nprint("Difference and confidence interval:", estimate, interval)\nprint("Standardized difference (Cohen d):", effect_size)'
        if method == 'one_t':
            effect = effect.replace(f'interval = result.confidence_interval(confidence_level={cl})', f'mean_interval = result.confidence_interval(confidence_level={cl})\ninterval = (mean_interval.low - reference, mean_interval.high - reference)')
        elif method in ('welch', 'student'):
            effect = effect.replace(f'effect_size = {d}', 'pooled_variance = (\n    (len(a)-1) * a.var(ddof=1) + (len(b)-1) * b.var(ddof=1)\n) / (len(a) + len(b) - 2)\neffect_size = estimate / np.sqrt(pooled_variance)')
    elif method == 'one_z':
        test = f'population_sd = {c["sigma"]}\nstandard_error = population_sd / np.sqrt(len(a))\nstatistic = (a.mean() - reference) / standard_error\np_value = 2 * stats.norm.sf(abs(statistic))\nprint("z, p:", statistic, p_value)'
        effect = f'estimate = a.mean() - reference\nmargin = stats.norm.ppf({1-alpha/2}) * standard_error\ninterval = (estimate - margin, estimate + margin)\neffect_size = estimate / population_sd\nprint("Difference and confidence interval:", estimate, interval)\nprint("Difference in population SDs:", effect_size)'
    elif method == 'bootstrap':
        test = 'estimate = a.mean()\nprint("Estimated population mean:", estimate)'
        effect = f'bootstrap = stats.bootstrap((a,), np.mean, {boot})\ninterval = bootstrap.confidence_interval\neffect_size = estimate - reference\nprint("Mean confidence interval:", interval)\nprint("Mean minus reference:", effect_size)'
    elif method == 'mannwhitney':
        test = 'result = stats.mannwhitneyu(a, b, alternative="two-sided", method="auto")\nstatistic, p_value = result.statistic, result.pvalue\nprint("U, p:", statistic, p_value)'
        effect = f'def rank_effect(x, y):\n    u = stats.mannwhitneyu(x, y).statistic\n    return 2 * u / (len(x) * len(y)) - 1\n\nestimate = effect_size = rank_effect(a, b)\nbootstrap = stats.bootstrap((a, b), rank_effect, vectorized=False, {boot})\ninterval = bootstrap.confidence_interval\nprint("Rank-biserial effect and bootstrap interval:", effect_size, interval)'
    elif method == 'wilcoxon':
        test = 'result = stats.wilcoxon(difference, zero_method="wilcox", method="approx", correction=True)\nstatistic, p_value = result.statistic, result.pvalue\nprint("Signed-rank statistic, approximate p:", statistic, p_value)'
        effect = f'def signed_rank_effect(d):\n    nonzero = d[d != 0]\n    ranks = stats.rankdata(abs(nonzero))\n    return np.sum(np.sign(nonzero) * ranks) / ranks.sum() if len(nonzero) else 0.0\n\nestimate = effect_size = signed_rank_effect(difference)\nbootstrap = stats.bootstrap((difference,), signed_rank_effect, vectorized=False, {boot})\ninterval = bootstrap.confidence_interval\nprint("Matched rank-biserial effect and bootstrap interval:", effect_size, interval)'
    elif method in ('anova', 'welch_anova', 'kruskal'):
        if method == 'welch_anova':
            test = 'from statsmodels.stats.oneway import anova_oneway\n\nresult = anova_oneway(groups, use_var="unequal", welch_correction=True)\nstatistic, p_value = result.statistic, result.pvalue'
        else:
            test = f'result = stats.{"f_oneway" if method == "anova" else "kruskal"}(*groups)\nstatistic, p_value = result.statistic, result.pvalue'
        test += '\nprint("Omnibus statistic, p:", statistic, p_value)'
        if method == 'kruskal':
            effect = 'effect_size = max(0, (statistic - len(groups) + 1) / (sum(map(len, groups)) - len(groups)))\nprint("Rank epsilon-squared estimate:", effect_size)'
        else:
            effect = 'grand_mean = np.concatenate(groups).mean()\nbetween = sum(len(g) * (g.mean() - grand_mean)**2 for g in groups)\ntotal = sum(np.sum((g - grand_mean)**2) for g in groups)\neffect_size = between / total\nprint("Descriptive eta-squared:", effect_size)'
        effect += f'\nmeans = pd.DataFrame({{"group": labels, "n": [len(g) for g in groups], "mean": [g.mean() for g in groups]}})\nmeans["CI low"] = [stats.t.interval({cl}, len(g)-1, loc=g.mean(), scale=stats.sem(g))[0] for g in groups]\nmeans["CI high"] = [stats.t.interval({cl}, len(g)-1, loc=g.mean(), scale=stats.sem(g))[1] for g in groups]\nprint(means)'
        if method == 'kruskal':
            effect = effect[:effect.index('\nmeans =')]
            effect += f'\nintervals = [stats.bootstrap((g,), np.median, {boot}).confidence_interval for g in groups]\nmeans = pd.DataFrame({{"group": labels, "n": [len(g) for g in groups], "median": [np.median(g) for g in groups], "CI low": [ci.low for ci in intervals], "CI high": [ci.high for ci in intervals]}})\nprint(means)'
        if method == 'anova':
            follow = f'if p_value < {alpha!r}:\n    posthoc = stats.tukey_hsd(*groups)\n    simultaneous = posthoc.confidence_interval(confidence_level={cl})\n    print("Tukey–Kramer adjusted p-values:", posthoc.pvalue)\n    print("Simultaneous difference intervals:", simultaneous)'
        else:
            call = 'stats.mannwhitneyu(groups[i], groups[j], alternative="two-sided")' if method == 'kruskal' else 'stats.ttest_ind(groups[i], groups[j], equal_var=False)'
            follow = f'from itertools import combinations\nfrom statsmodels.stats.multitest import multipletests\n\ncomparisons = []\nif p_value < {alpha!r}:\n    pairs = list(combinations(range(len(groups)), 2))\n    tests = [{call} for i, j in pairs]\n    adjusted = multipletests([test.pvalue for test in tests], method="holm")[1]\n    for (i, j), test, p in zip(pairs, tests, adjusted):\n        comparisons.append({{"comparison": str(labels[i]) + " − " + str(labels[j]), "adjusted p": p}})\n    print(pd.DataFrame(comparisons))'
            if method == 'welch_anova':
                follow += f'\n    # Bonferroni intervals cover all pair differences together.\n    comparison_intervals = [test.confidence_interval(1 - {alpha!r}/len(pairs)) for test in tests]\n    print("Simultaneous difference intervals:", comparison_intervals)'
    elif method == 'factorial':
        terms = [f'C({f}, Sum)' for f in c['factors']]
        formula = f'{c["y"]} ~ ' + ' * '.join(terms)
        test = f'from statsmodels.formula.api import ols\nfrom statsmodels.stats.anova import anova_lm\n\nmodel = ols({formula!r}, data=data).fit()\nanova_table = anova_lm(model, typ=3)\nanova_table = anova_table.drop(index="Intercept")\nprint(anova_table[["df", "F", "PR(>F)"]])\nprint("Residual normality:", stats.shapiro(model.resid).pvalue)\ncell_groups = [g[{c["y"]!r}].to_numpy() for _, g in data.groupby({c["factors"]!r})]\nprint("Residual spread by cell (Levene):", stats.levene(*cell_groups).pvalue)'
        effect = f'error_ss = anova_table.loc["Residual", "sum_sq"]\neffects = anova_table.drop(index="Residual").copy()\neffects["partial eta-squared"] = effects["sum_sq"] / (effects["sum_sq"] + error_ss)\nprint(effects[["partial eta-squared"]])\ncell_means = data.groupby({c["factors"]!r})[{c["y"]!r}].agg(["count", "mean"]).reset_index()\ncell_intervals = model.get_prediction(cell_means).summary_frame(alpha={alpha!r})\nprint(cell_intervals[["mean", "mean_ci_lower", "mean_ci_upper"]])'
        # Simple effects compare first factor within every combination of remaining factors.
        follow = f'from itertools import combinations\nfrom patsy import build_design_matrices\nfrom statsmodels.stats.multitest import multipletests\n\n# Compare {c["factors"][0]} within each combination of the other factors.\ndesign = np.asarray(build_design_matrices([model.model.data.design_info], cell_means)[0])\npairs = []\nfor _, block in cell_means.groupby({c["factors"][1:]!r}):\n    pairs.extend(combinations(block.index, 2))\ncontrasts = [model.t_test(design[i] - design[j]) for i, j in pairs]\nadjusted = multipletests([float(t.pvalue) for t in contrasts], method="holm")[1]\ncomparisons = []\nfor (i, j), contrast, p in zip(pairs, contrasts, adjusted):\n    low, high = contrast.conf_int(alpha={alpha!r}/len(pairs))[0]\n    comparisons.append({{"cell A": i, "cell B": j, "difference": float(contrast.effect.item()), "adjusted p": p, "CI low": low, "CI high": high}})\nprint(cell_means)\nprint(pd.DataFrame(comparisons))'
    elif method in ('chi2', 'fisher'):
        if method == 'chi2':
            test = 'result = stats.chi2_contingency(table, correction=False)\nstatistic, p_value = result.statistic, result.pvalue\nprint("Chi-square, degrees of freedom, p:", statistic, result.dof, p_value)'
        else:
            test = 'result = stats.fisher_exact(table, alternative="two-sided")\nstatistic, p_value = result.statistic, result.pvalue\nprint("Sample odds ratio, exact p:", statistic, p_value)'
        effect = 'chi_square = stats.chi2_contingency(table, correction=False).statistic\neffect_size = np.sqrt(chi_square / (table.to_numpy().sum() * (min(table.shape)-1)))\nprint("Cramér V (uncorrected descriptive estimate):", effect_size)'
        if method == 'fisher' or c.get('table_2x2'):
            effect += f'\nfrom scipy.stats.contingency import odds_ratio\n\nodds = odds_ratio(table.to_numpy(), kind="conditional")\nestimate = odds.statistic\ninterval = odds.confidence_interval(confidence_level={cl})\nprint("Conditional odds ratio and exact interval:", estimate, interval)'
        else:
            effect += f'\n# Wilson intervals describe each within-row proportion separately.\nfrom statsmodels.stats.proportion import proportion_confint\n\nproportion_low, proportion_high = proportion_confint(table.to_numpy(), table.sum(axis=1).to_numpy()[:, None], alpha={alpha!r}, method="wilson")\nprint("Row proportions:", table.div(table.sum(axis=1), axis=0))\nprint("Pointwise Wilson intervals:", proportion_low, proportion_high)'
        follow = 'expected = stats.contingency.expected_freq(table)\nresiduals = (table - expected) / np.sqrt(expected)\nprint("Pearson residuals (descriptive, not separate tests):")\nprint(residuals)'
    elif method in ('pearson', 'spearman'):
        if method == 'pearson':
            test = 'result = stats.pearsonr(a, b)\nestimate = effect_size = result.statistic\np_value = result.pvalue\nprint("Pearson r, p:", estimate, p_value)'
            effect = f'interval = result.confidence_interval(confidence_level={cl})\nprint("Fisher-transform confidence interval:", interval)'
        else:
            test = 'estimate = effect_size = stats.spearmanr(a, b).statistic\nrank_a = stats.rankdata(a)\nrank_b = stats.rankdata(b)\nrank_a = (rank_a - rank_a.mean()) / np.linalg.norm(rank_a - rank_a.mean())\nrank_b = (rank_b - rank_b.mean()) / np.linalg.norm(rank_b - rank_b.mean())\ndef association(x, axis=-1):\n    return np.sum(x * rank_b, axis=axis)\n\npermutation = stats.permutation_test((rank_a,), association, permutation_type="pairings", vectorized=True, n_resamples=9999, batch=100, random_state=42)\np_value = permutation.pvalue\nprint("Spearman rho, permutation p:", estimate, p_value)'
            effect = f'def rank_correlation(x, y):\n    return stats.spearmanr(x, y).statistic\n\nbootstrap = stats.bootstrap((a, b), rank_correlation, paired=True, vectorized=False, {boot})\ninterval = bootstrap.confidence_interval\nprint("Paired-row bootstrap confidence interval:", interval)'
    steps.append(step('Answer the question', method_explanation(method), test))
    steps.append(step('Measure size and uncertainty', interval_explanation(method, c), effect))
    if follow:
        steps.append(step('Follow up carefully', follow_explanation(method), follow))
    return steps


def method_explanation(m):
    return {
        'one_t': 'Tests whether the population mean equals the prespecified reference. The population SD is estimated from this sample. Exact t inference assumes independent normal observations; larger samples can support an approximation, but extreme skew and outliers still matter.',
        'one_z': 'Use only when population SD is known independently of these observations. A normal population or a reliable large-sample mean approximation is also needed. A large sample alone does not justify substituting its SD into a known-SD z-test.',
        'bootstrap': 'Estimate the mean by resampling independent observations. This route estimates uncertainty without a hypothesis-test p-value.',
        'welch': 'Tests equality of two population means without assuming equal variances. This is the default for separate groups. Independent observations and approximately normal group means are needed; inspect skew and influential values, especially in small samples.',
        'student': 'Tests equality of two means using a pooled variance. Equal variance must be defensible from context, not merely a nonsignificant Levene test. Observations must be independent, with normal errors for exact small-sample inference.',
        'paired_t': 'Tests whether the population mean of within-country differences is zero. The distribution of differences matters, not the two marginal distributions. Differences must be independent across countries and approximately normal for small-sample inference.',
        'mannwhitney': 'Tests equal distributions using ranks. A location or median-shift interpretation additionally needs similarly shaped distributions. Ties are handled by SciPy; larger or tied samples use its asymptotic calculation.',
        'wilcoxon': 'Tests a zero-centered symmetric distribution of paired differences. Symmetry is still required; this is not an assumption-free median test. Zeros are excluded from ranking; a tie-adjusted normal approximation is used.',
        'anova': 'Compares between-group variation with within-group variation to test equality of all means. Requires approximately normal within-group errors and a common variance.',
        'welch_anova': 'Tests equality of all group means allowing unequal variances. An omnibus result does not identify which groups differ.',
        'kruskal': 'Tests equal distributions with pooled ranks and a tie correction. It is a median comparison only when distribution shapes are comparable.',
        'factorial': 'Fits all main effects and interactions with sum-to-zero contrasts and Type III partial F-tests. For unbalanced cells, main effects concern equally weighted factor levels. Read the highest-order interaction first. This is a fixed-factor, independent-observation model, not repeated-measures ANOVA.',
        'chi2': 'Tests independence of two categorical variables from counts of independent units. Expected counts must be adequate; percentages are not input observations.',
        'fisher': 'Sparse 2×2 counts route to a two-sided exact conditional association test. Odds-ratio direction follows the displayed row and column order.',
        'pearson': 'Tests zero linear population correlation. Inspect scatterplots and unusual points. Classical p-values and Fisher intervals assume independent pairs and an approximately bivariate-normal population.',
        'spearman': 'Measures monotonic association with ranks. A two-sided permutation test breaks pairings under independence, preserving ties. Its null is independence, which is stronger than merely zero rank correlation; exchangeability is required.',
    }[m]


def interval_explanation(m, c):
    base = f'{c["confidence"]:.0%} confidence was chosen before the analysis. An interval describes the long-run coverage of a procedure; it is not the probability that this fixed population value lies in this realized interval. '
    if m in ('mannwhitney', 'wilcoxon', 'spearman', 'bootstrap'):
        return base + 'Percentile bootstrap: 1,999 resamples, seed 42. It approximates sampling uncertainty and can be unstable with small, highly discrete or unrepresentative samples. Rank effects range from −1 to 1.'
    if m == 'kruskal':
        return base + 'Rank epsilon-squared describes rank separation. Group medians have pointwise percentile-bootstrap intervals (1,999 resamples, seed 42); these are descriptive summaries, not simultaneous pairwise intervals. The test concerns distributions unless their shapes are comparable.'
    if m in ('anova', 'welch_anova'):
        return base + 'Group mean intervals are pointwise t intervals, not simultaneous comparisons or intervals for medians. Eta-squared is descriptive variance explained; under unequal variances it is not the Welch test statistic. Rank epsilon-squared describes rank separation.'
    if m == 'factorial':
        return base + 'Partial eta-squared compares each term with residual variation; terms do not add to 100%. Cell mean intervals are pointwise and use pooled model error.'
    if m in ('chi2', 'fisher'):
        return base + 'Cramér V is a nonnegative descriptive association magnitude. A 2×2 table gets a conditional odds-ratio interval; larger tables get pointwise Wilson intervals for row proportions. Neither is a confidence interval for Cramér V.'
    if m in ('pearson',):
        return base + 'Correlation is the effect size; its interval uses the Fisher transformation.'
    return base + 'The interval estimates the unstandardized difference (A minus B, or sample minus reference). Cohen d uses the sample SD for one sample, the SD of differences for paired data, and pooled sample SD for independent groups; it is descriptive even for Welch. This is not an interval for d.'


def follow_explanation(m):
    if m == 'anova':
        return 'If the omnibus p-value is below the prespecified alpha, Tukey–Kramer compares every pair with adjusted p-values and simultaneous intervals. Unequal sample sizes are allowed; a common variance is still required.'
    if m in ('welch_anova', 'kruskal'):
        return 'After omnibus evidence, compare all pairs using Welch t-tests or Mann–Whitney as appropriate, with Holm correction over the entire family. Welch pair intervals use Bonferroni coverage, so interval and Holm decisions can differ. Rank pair tests concern distributions, not automatically medians.'
    if m == 'factorial':
        return 'Prespecified simple comparisons: compare the first factor inside every combination of the others, even if the omnibus result is inconclusive. Holm corrects all these comparisons as one family; Bonferroni intervals cover them simultaneously. Do not collapse an interaction into an overall main-effect claim. Omnibus term p-values are unadjusted; testing several terms increases multiplicity.'
    return 'Pearson residuals show which counts contribute to association. They are descriptive clues, not independently significant cells. Do not search cells and report uncorrected p-values.'


def hypotheses(c, method):
    """Name the estimand and null explicitly, without turning the UI into a test menu."""
    if method == 'bootstrap':
        return {'question': f'What is the population mean of {c["y"]}, and how uncertain is that estimate?', 'null': 'Estimation only; no null hypothesis is tested.', 'alternative': 'Read the interval against a practically meaningful reference.'}
    if method == 'factorial':
        return {'question': f'Does the difference in {c["y"]} across {c["factors"][0]} depend on ' + ' and '.join(c['factors'][1:]) + '?', 'null': 'For each model term: all coefficients associated with that term are zero, conditional on the full model.', 'alternative': 'For that term: at least one associated coefficient is nonzero. Each term has its own test.'}
    if method in ('chi2', 'fisher'):
        return {'question': f'Are {c["x"]} and {c["y"]} associated?', 'null': 'The two categorical variables are independent.', 'alternative': 'The categorical variables are associated.'}
    if method in ('pearson', 'spearman'):
        return {'question': f'How do {c["x"]} and {c["y"]} move together?', 'null': 'The population linear correlation is zero.' if method=='pearson' else 'The two variables are independent; their pairings are exchangeable.', 'alternative': 'The linear correlation is nonzero.' if method=='pearson' else 'There is association detectable by rank correlation.'}
    if method in ('mannwhitney', 'kruskal'):
        return {'question': f'Does the distribution of {c["y"]} differ across the selected groups?', 'null': 'The group distributions are the same.', 'alternative': 'The distributions differ (at least one for multiple groups). A median-shift claim needs comparable shapes.'}
    if method == 'wilcoxon':
        return {'question': f'Is the change in country {c["y"]} from {c["before"]} to {c["after"]} centered away from zero?', 'null': 'The distribution of paired differences is symmetric about zero.', 'alternative': 'Under the symmetry assumption, its center differs from zero.'}
    if c['family']=='reference':
        question=f'Does the population mean of {c["y"]} differ from {c["reference"]:g}?'
        null=f'The population mean equals {c["reference"]:g}.'
    elif c['family']=='paired':
        question=f'Does country {c["y"]} change on average from {c["before"]} to {c["after"]}?'
        null='The population mean within-country difference is zero.'
    else:
        question=f'Does mean {c["y"]} differ across ' + ', '.join(c['labels']) + '?'
        null='The population means of all selected groups are equal.'
    return {'question':question,'null':null,'alternative':'The mean differs from the reference.' if c['family']=='reference' else 'The mean difference is nonzero.' if c['family'] in ('paired','independent') else 'At least one group mean differs.'}


def build(raw, config):
    c, data, prep = prepare(raw, config)
    method = route(c, data)
    if c['family'] == 'categorical':
        c['table_2x2'] = pd.crosstab(data[c['x']], data[c['y']]).shape == (2, 2)
    c['method'] = method
    steps = recipe(c, method, prep)
    return {'config': c, 'method': method, 'name': METHODS[method], 'steps': steps,
            'preview': data.head(6).reset_index().to_dict(orient='records'),
            'explanation': method_explanation(method), 'hypotheses': hypotheses(c, method), 'source': SOURCES[c['dataset']]}


def clean(value):
    if isinstance(value, (np.floating, float)):
        return float(value) if np.isfinite(value) else ("−∞" if value < 0 else "∞") if np.isinf(value) else None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.ndarray, pd.Series)):
        return [clean(v) for v in value.tolist()]
    if isinstance(value, (list, tuple)):
        return [clean(v) for v in value]
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    return value


def frame(value):
    return clean(value.reset_index().to_dict(orient='records'))


def execute(raw, plan, make_plots=True):
    """Run the exact displayed code in a fresh namespace, then format small results."""
    env = {'df': raw.copy(deep=True)}
    outputs = []
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        for s in plan['steps']:
            output = io.StringIO()
            from contextlib import redirect_stdout
            with redirect_stdout(output):
                exec(compile(s['code'], '<learner notebook>', 'exec'), env)
            outputs.append(output.getvalue())
    c = plan['config']
    m = plan['method']
    p = env.get('p_value')
    require(p is None or np.isfinite(p), 'The p-value is undefined for these observations; no conclusion can be reported.')
    estimate, interval = env.get('estimate'), env.get('interval')
    result = {'method': m, 'n': c['n'], 'statistic': env.get('statistic'), 'p': p,
              'estimate': estimate, 'interval': interval, 'effect': env.get('effect_size'),
              'outputs': outputs, 'warnings': sorted(set(str(w.message) for w in caught)),
              'tables': {}, 'figures': []}
    for name in ('anova_table', 'effects', 'means', 'cell_means', 'cell_intervals', 'table', 'residuals'):
        if name in env:
            result['tables'][name] = frame(env[name])
    if 'comparisons' in env and len(env['comparisons']):
        result['tables']['comparisons'] = clean(env['comparisons'])
        if 'comparison_intervals' in env:
            for row, ci in zip(result['tables']['comparisons'], env['comparison_intervals']):
                row.update({'CI low': float(ci.low), 'CI high': float(ci.high)})
    if m == 'anova' and 'posthoc' in env:
        ph, ci = env['posthoc'], env['simultaneous']
        result['tables']['comparisons'] = [{'comparison': c['labels'][i]+' − '+c['labels'][j], 'difference': ph.statistic[i,j], 'adjusted p': ph.pvalue[i,j], 'CI low': ci.low[i,j], 'CI high': ci.high[i,j]} for i,j in combinations(range(len(c['labels'])),2)]
    if 'proportion_low' in env:
        table = env['table']
        result['tables']['row_proportion_intervals'] = [{'row': str(table.index[i]), 'category': str(table.columns[j]), 'proportion': table.iloc[i,j]/table.iloc[i].sum(), 'CI low': env['proportion_low'][i,j], 'CI high': env['proportion_high'][i,j]} for i,j in product(range(table.shape[0]),range(table.shape[1]))]
    if p is None:
        result['conclusion'] = 'Read each interaction and simple comparison in context; there is no single p-value for the whole question.' if m == 'factorial' else 'This is an estimation route. Read the mean interval and its practical meaning; no hypothesis-test p-value was calculated.'
    else:
        target = {'mannwhitney':'the group distributions differ', 'kruskal':'at least one group distribution differs', 'wilcoxon':'the symmetric distribution of paired differences is not centered at zero', 'chi2':'the categorical variables are associated', 'fisher':'the categorical variables are associated', 'pearson':'the population linear correlation differs from zero', 'spearman':'the paired variables are associated under the independence null', 'anova':'at least one population mean differs', 'welch_anova':'at least one population mean differs'}.get(m, 'the population mean difference differs from zero')
        result['conclusion'] = (f'At α = {c["alpha"]:.2f}, the data provide evidence that {target}.' if p < c['alpha'] else f'At α = {c["alpha"]:.2f}, the data do not provide sufficient evidence to conclude that {target}. This does not establish equality or absence of an effect.')
    result['safeguards'] = [
        SOURCES[c['dataset']]['note'],
        'A p-value is the probability, under the null model and its assumptions, of a result at least as extreme as observed. It is not the probability that the null is true.',
        'Statistical evidence is not practical importance or causation. Choose a meaningful effect size in the outcome’s units and judge the interval against it.',
        'Changing questions, groups, confidence levels or methods after seeing results is exploratory. Within-route corrections do not cover repeated searches across routes.',
        f'{c["omitted"]} incomplete units omitted; {c["excluded"]} complete rows outside the selected groups excluded. Missingness may bias the analysis.',
    ]
    if make_plots:
        result['figures'] = plots(env, c)
    return clean(result)


def plots(env, c):
    """Rendering is application plumbing; the notebook contains only analysis code."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
    figures = []
    def save(fig, title, caption):
        fig.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=130, facecolor='#fff8eb')
        plt.close(fig)
        figures.append({'title': title, 'caption': caption, 'src': 'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()})
    m = c['method']
    if m in ('chi2', 'fisher'):
        fig, ax = plt.subplots(figsize=(7,3.7))
        env['table'].div(env['table'].sum(axis=1),axis=0).plot.bar(stacked=True,ax=ax,colormap='viridis',rot=0)
        ax.set_ylabel('Within-row proportion')
        save(fig, 'Compare category proportions', 'Bars describe observed row proportions. Counts and expected counts determine the test.')
        fig, ax = plt.subplots(figsize=(7,3.7))
        r = env['residuals']
        im = ax.imshow(r, cmap='coolwarm', vmin=-max(1,abs(r.to_numpy()).max()), vmax=max(1,abs(r.to_numpy()).max()))
        ax.set_xticks(range(r.shape[1]),labels=r.columns)
        ax.set_yticks(range(r.shape[0]),labels=r.index)
        fig.colorbar(im,ax=ax,label='Pearson residual')
        save(fig, 'Where counts depart from independence', 'Descriptive residuals, not a set of cell-level significance tests.')
    elif m in ('pearson', 'spearman'):
        fig, ax = plt.subplots(figsize=(7,4))
        ax.scatter(env['a'],env['b'],s=18,alpha=.55,color='#7651a6')
        ax.set(xlabel=c['x'],ylabel=c['y'])
        save(fig, 'Inspect shape before interpreting association', 'Look for nonlinearity, influential points and clusters. Pooled patterns can be driven by subgroups.')
    elif m == 'factorial':
        data, factors = env['data'], c['factors']
        slices = list(data[factors[2]].unique()) if len(factors)==3 else [None]
        fig, axes = plt.subplots(1,len(slices),figsize=(min(12,5*len(slices)),4),squeeze=False)
        for ax, level in zip(axes[0],slices):
            subset = data if level is None else data[data[factors[2]]==level]
            for label,g in subset.groupby(factors[1], observed=True):
                means = g.groupby(factors[0], observed=True)[c['y']].mean()
                ax.plot(range(len(means)),means.values,marker='o',label=str(label))
                ax.set_xticks(range(len(means)),labels=means.index,rotation=20)
            ax.set(title='' if level is None else f'{factors[2]} = {level}',ylabel=c['y'])
            ax.legend(title=factors[1])
        save(fig,'Does a difference depend on context?', 'Cell means; nonparallel lines suggest interactions. Read the model uncertainty before making a claim.')
        fig, axes = plt.subplots(1,2,figsize=(8,3.6))
        axes[0].scatter(env['model'].fittedvalues,env['model'].resid,s=12,alpha=.5)
        axes[0].axhline(0,color='gray'); axes[0].set(xlabel='Fitted mean',ylabel='Residual')
        stats.probplot(env['model'].resid,plot=axes[1]); axes[1].set_title('Residual Q–Q plot')
        save(fig,'Check the fitted model', 'Look for unequal spread, patterns and tail departures. Independence cannot be checked from these plots.')
    else:
        if m in ('paired_t','wilcoxon'):
            fig,axes=plt.subplots(1,2,figsize=(8,3.7))
            for a,b in zip(env['a'],env['b']):
                axes[0].plot([0,1],[b,a],color='#7651a6',alpha=.15)
            axes[0].set_xticks([0,1],labels=c['labels'][::-1]); axes[0].set_ylabel(c['y'])
            axes[1].hist(env['difference'],bins=16,color='#7651a6'); axes[1].axvline(0,color='gray')
            axes[1].set_xlabel('After − before')
            diagnostic = env['difference']
        else:
            groups = env['groups'] if 'groups' in env else ([env['a'],env['b']] if 'b' in env else [env['a']])
            labels = c.get('labels',['Sample'])
            fig,axes = plt.subplots(1,2,figsize=(8,3.7))
            axes[0].boxplot(groups,labels=labels,showmeans=True); axes[0].tick_params(axis='x',rotation=15); axes[0].set_ylabel(c['y'])
            for label,g in zip(labels,groups):
                axes[1].hist(g,bins=16,alpha=.45,label=f'{label} (n={len(g)})')
            axes[1].legend(fontsize=8); axes[1].set_xlabel(c['y'])
            diagnostic = np.concatenate([g-g.mean() for g in groups])
            if c['family']=='reference':
                axes[1].axvline(c['reference'],color='#bd4f5d',linestyle='--')
        save(fig,'See the observations', 'Compare center, spread, sample size and unusual values. A boxplot alone does not establish normality or independence.')
        fig,ax=plt.subplots(figsize=(6,3.6))
        stats.probplot(diagnostic,plot=ax)
        save(fig,'Q–Q diagnostic', 'Differences for paired data; centered within-group observations otherwise. Per-group Shapiro values complement this pooled diagnostic, which can hide group-specific departures.')
    return figures


def handle(csv, config, run=False):
    raw = pd.read_csv(io.StringIO(csv))
    plan = build(raw, config)
    return json.dumps({'plan': clean(plan), 'result': execute(raw, plan) if run else None}, allow_nan=False)
