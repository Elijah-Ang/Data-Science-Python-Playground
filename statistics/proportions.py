"""Additive proportion routes; the original inference engine is unchanged.
Loaded after engine.py in the Python worker (and via exec in tests).
"""
FAMILIES['proportions'] = 'Compare proportions'
PROPORTION_METHODS = {'prop_one_z':'One-proportion score z-test', 'prop_one_exact':'Exact binomial test',
                      'prop_two_z':'Two-proportion pooled z-test', 'prop_two_exact':'Fisher exact comparison'}


def build_proportions(raw, config):
    c = dict(config)
    c.setdefault('dataset','candy'); c.setdefault('structure','one')
    require(c['dataset'] in ('candy','penguins'), 'Choose candy products or penguins for proportions.')
    require(c['structure'] in ('one','two'), 'Compare one proportion or two independent proportions.')
    c.setdefault('outcome','chocolate' if c['dataset']=='candy' else 'sex')
    require(c['outcome'] in CATEGORICAL[c['dataset']], 'Choose a categorical outcome.')
    c.setdefault('success','1' if c['dataset']=='candy' else 'female')
    c['confidence']=float(c.get('confidence',.95));require(c['confidence'] in (.9,.95,.99),'Choose 90%, 95% or 99% confidence.')
    c['alpha']=round(1-c['confidence'],10)
    columns=[c['outcome']]
    if c['structure']=='two':
        c.setdefault('group','fruity' if c['dataset']=='candy' else 'species')
        require(c['group'] in CATEGORICAL[c['dataset']] and c['group']!=c['outcome'],'Choose a different categorical grouping variable.')
        columns.append(c['group'])
    data=raw[columns].dropna().copy()
    levels=sorted(data[c['outcome']].astype(str).unique())
    require(2 <= len(levels) <= 4,'The outcome needs 2–4 observed categories.')
    require(str(c['success']) in levels,'The selected success category is absent.')
    c['omitted']=len(raw)-len(data);c['excluded']=0
    prep=f'import numpy as np\nimport pandas as pd\nfrom scipy import stats\n\ndata = df[{columns!r}].dropna()\nsuccess = data[{c["outcome"]!r}].astype(str) == {str(c["success"])!r}\n'
    if c['structure']=='one':
        c['reference']=float(c.get('reference',.5))
        require(0 < c['reference'] < 1,'Reference proportion must be strictly between 0 and 1.')
        n=len(data);k=int((data[c['outcome']].astype(str)==str(c['success'])).sum())
        require(n>=4,'At least four independent units are needed.')
        normal=min(n*c['reference'],n*(1-c['reference']))>=10
        m='prop_one_z' if normal else 'prop_one_exact'
        prep+=f'count = int(success.sum())\nn = len(success)\nreference = {c["reference"]}\n'
        diagnosis='print("Successes, failures:", count, n-count)\nprint("Expected under H0:", n*reference, n*(1-reference))'
        if normal:
            test='from statsmodels.stats.proportion import proportions_ztest\n\nstatistic, p_value = proportions_ztest(count, n, value=reference, prop_var=reference)\nprint("z, p:", statistic, p_value)'
            effect=f'from statsmodels.stats.proportion import proportion_confint\n\nestimate = count / n\neffect_size = estimate - reference\ninterval = proportion_confint(count, n, alpha={c["alpha"]}, method="wilson")\nprint("Proportion and Wilson interval:", estimate, interval)\nprint("Difference from reference:", effect_size)'
        else:
            test='result = stats.binomtest(count, n, p=reference, alternative="two-sided")\np_value = result.pvalue\nprint("Exact binomial p:", p_value)'
            effect=f'estimate = count / n\neffect_size = estimate - reference\ninterval = result.proportion_ci(confidence_level={c["confidence"]}, method="exact")\nprint("Proportion and exact interval:", estimate, interval)\nprint("Difference from reference:", effect_size)'
        question=f'Is the proportion with {c["outcome"]} = {c["success"]} different from {c["reference"]:.0%}?'
        null=f'The population proportion equals {c["reference"]:g}.'
        reason='Expected successes and failures under the reference are both at least 10, so a null-variance score z-test is defensible.' if normal else 'Expected successes or failures under the reference are below 10. Use an exact binomial test instead of a normal approximation.'
        ci_note='Wilson interval for the population proportion.' if normal else 'Clopper–Pearson exact interval for the population proportion; conservative coverage. The two-sided exact test and equal-tailed interval can differ in boundary decisions.'
    else:
        c.setdefault('levels', sorted(data[c['group']].astype(str).unique())[:2]);c['levels']=list(map(str,c['levels']))
        require(len(c['levels'])==2 and len(set(c['levels']))==2,'Choose two distinct independent groups.')
        data=data[data[c['group']].astype(str).isin(c['levels'])]
        c['excluded']=len(raw)-c['omitted']-len(data)
        counts=[];sizes=[]
        for level in c['levels']:
            g=data[data[c['group']].astype(str)==level];sizes.append(len(g));counts.append(int((g[c['outcome']].astype(str)==str(c['success'])).sum()))
        require(min(sizes)>=4,'Each independent group needs at least four units.')
        require(sum(counts)>0 and sum(counts)<sum(sizes),'The binary outcome has no variation in the selected groups.')
        pooled=sum(counts)/sum(sizes)
        normal=min([*counts,*[n-k for n,k in zip(sizes,counts)],*[n*pooled for n in sizes],*[n*(1-pooled) for n in sizes]])>=10
        m='prop_two_z' if normal else 'prop_two_exact'
        prep+=f'group_a = success[data[{c["group"]!r}].astype(str) == {c["levels"][0]!r}]\ngroup_b = success[data[{c["group"]!r}].astype(str) == {c["levels"][1]!r}]\ncounts = np.array([group_a.sum(), group_b.sum()])\nsizes = np.array([len(group_a), len(group_b)])\n'
        diagnosis='print("Successes:", counts)\nprint("Failures:", sizes-counts)\npooled = counts.sum() / sizes.sum()\nprint("Expected successes:", sizes*pooled)\nprint("Expected failures:", sizes*(1-pooled))'
        if normal:
            test='from statsmodels.stats.proportion import proportions_ztest\n\nstatistic, p_value = proportions_ztest(counts, sizes, alternative="two-sided")\nprint("Pooled z, p:", statistic, p_value)'
        else:
            test='table = np.column_stack([counts, sizes-counts])\nresult = stats.fisher_exact(table, alternative="two-sided")\np_value = result.pvalue\nprint("Fisher exact p:", p_value)'
        effect=f'from statsmodels.stats.proportion import confint_proportions_2indep\n\nproportions = counts / sizes\nestimate = effect_size = proportions[0] - proportions[1]\ninterval = confint_proportions_2indep(\n    counts[0], sizes[0], counts[1], sizes[1],\n    method="newcomb", compare="diff", alpha={c["alpha"]}\n)\nprint("Proportions A, B:", proportions)\nprint("Difference A-B and Newcombe interval:", estimate, interval)'
        if not normal:
            effect+=f'\nfrom scipy.stats.contingency import odds_ratio\nodds = odds_ratio(table)\nexact_odds_interval = odds.confidence_interval(confidence_level={c["confidence"]})\nprint("Conditional odds ratio and exact interval:", odds.statistic, exact_odds_interval)'
        question=f'Does the proportion with {c["outcome"]} = {c["success"]} differ between '+ ' and '.join(c['levels'])+'?'
        null='The two independent population proportions are equal.'
        reason='Observed and null-expected successes/failures are all at least 10. Use a pooled two-proportion z-test.' if normal else 'Success/failure counts are too small for the normal-approximation teaching rule. Use Fisher’s exact 2×2 test.'
        ci_note='Newcombe difference interval combines two Wilson intervals; it is approximate, including on the exact-test route. Fisher also gets a conditional odds-ratio exact interval. These intervals target different effects; they need not give identical decisions.'
    c.update(n=len(data),method=m,family='proportions',labels=c.get('levels',[]))
    steps=[step('Select the observations','A success is the selected category; every other observed category is a failure. Missing outcomes or group labels are excluded, not counted as failures.',prep),
           step('Check the relevant assumptions','Independent binary outcomes and an appropriate sampling design are needed. These count thresholds guide approximation, not independence or representativeness.',diagnosis),
           step('Answer the question',reason,test),step('Measure size and uncertainty',ci_note+' Differences are proportions; multiply by 100 for percentage points.',effect)]
    return {'config':c,'method':m,'name':PROPORTION_METHODS[m],'steps':steps,'preview':clean(data.head(6).reset_index().to_dict(orient='records')),'explanation':reason,
            'source':SOURCES[c['dataset']],'hypotheses':{'question':question,'null':null,'alternative':'The population proportion differs from the reference.' if c['structure']=='one' else 'The population proportions differ.'}}
