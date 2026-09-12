"""Progressive notebook/application layer. Original statistical recipes remain intact.

A checkpoint precedes each cell. Reruns restore it, so edits and failed cells
cannot reuse old downstream variables. Successful cells persist actual Python state.
"""
import ast
import copy
import contextlib
import types
import time
import sys


def notebook_plan(raw, config):
    plan = (build_goodness(raw, config) if config.get('family') == 'goodness' else
            build_proportions(raw, config) if config.get('family') == 'proportions' else build(raw, config))
    q=plan['hypotheses']
    frame_step=step('Frame the question','State the population, comparison and null before seeing a p-value.',f'question = {q["question"]!r}\nnull_hypothesis = {q["null"]!r}\nprint(question)\nprint("H0:", null_hypothesis)')
    frame_step.update(id='frame',label='Frame',cue='Identify the observational unit. A statistical test cannot establish random sampling or causation.')
    stages=[frame_step]
    ids=['select','assumptions','analysis','uncertainty','followup']
    labels=['Select / explore','Assumptions','Analyze','Effect & CI','Follow-up']
    for i,original in enumerate(plan['steps']):
        s=dict(original);s.update(id=ids[i],label=labels[i],cue=original['explanation'])
        if i==0:
            s['code']+='\nprint("Selected observations are ready.")'
        # The same model-based contrast calculation remains available and editable,
        # but design-matrix construction does not dominate the primary Python.
        if plan['method']=='factorial' and i==4:
            s['advanced']=s['code']+'\nsimple_effects = pd.DataFrame(comparisons)'
            s['code']='# First run the Advanced calculation above: it creates simple_effects.\n# Compare the first factor within each combination of the others.\nprint(simple_effects)'
            s['explanation'] += ' Prerequisite: the editable Advanced calculation above creates the simple_effects table from this model; it is included before this cell in notebook exports.'
            s['advanced_label']='Model-based contrast calculation · runs before this cell'
        # Keep seed-42 Monte Carlo draws identical when users reverse labels/axes.
        # This changes only resampling order, not the test or interval procedure.
        c = plan['config']
        if plan['method'] == 'spearman' and i == 2 and c['x'] > c['y']:
            s['code'] = s['code'].replace('rank_a = stats.rankdata(a)', 'rank_a = stats.rankdata(b)').replace('rank_b = stats.rankdata(b)', 'rank_b = stats.rankdata(a)')
            s['code'] = '# Use a stable column order for reproducible permutation draws.\n' + s['code']
        if plan['method'] == 'mannwhitney' and i == 3 and c['labels'][0] > c['labels'][1]:
            s['code'] = s['code'].replace('(a, b), rank_effect', '(b, a), rank_effect')
            s['code'] = s['code'].replace('interval = bootstrap.confidence_interval',
                '# Draw in stable group order, then express the interval as A minus B.\ninterval = (-bootstrap.confidence_interval.high, -bootstrap.confidence_interval.low)')
        stages.append(s)
    conclude=step('Conclude in context','Read the effect, interval and assumptions together. Explain practical relevance in your own words.',
                  'conclusion = "Write what the evidence supports and what remains uncertain."\nprint(conclusion)')
    conclude.update(id='conclude',label='Conclude',cue='A nonsignificant result does not establish equality. Confidence is about a procedure, not the probability a fixed parameter lies in this interval.')
    stages.append(conclude)
    plan['route']=stages
    return plan


def snapshot(namespace):
    memo={id(module):module for module in sys.modules.values() if module is not None}
    memo[id(namespace)]=namespace
    for value in namespace.values():
        if isinstance(value,(types.ModuleType,types.FunctionType,type)):
            memo[id(value)]=value
        if hasattr(value,'model') and hasattr(value.model,'data'):
            design_info=getattr(value.model.data,'design_info',None)
            if design_info is not None:memo[id(design_info)]=design_info
    return copy.deepcopy({k:v for k,v in namespace.items() if k!='__builtins__'},memo)


def namespace_summary(env,plan):
    """Small scalar/table evidence, read from the actual executed namespace."""
    scalars={}
    for name in ('statistic','p_value','estimate','effect_size','interval','exact_odds_interval'):
        if name in env:
            value=env[name]
            if name in ('interval','exact_odds_interval'):value=list(value)
            require(np.isscalar(value) or isinstance(value,(tuple,list)),f'{name} must be a scalar or interval, not a full result object.')
            scalars[name]=clean(value)
    tables={}
    for name in ('anova_table','effects','means','cell_means','cell_intervals','table','residuals','simple_effects','distribution','category_intervals','departures'):
        if name in env:
            val=env[name]
            if isinstance(val,np.ndarray) and val.ndim==2:
                val=pd.DataFrame(val, index=plan['config'].get('levels'), columns=['success','other']) if name=='table' and plan['config']['family']=='proportions' else pd.DataFrame(val)
            if isinstance(val,pd.DataFrame):tables[name]=frame(val)
    if env.get('comparisons'):
        tables['comparisons']=clean(env['comparisons'])
        if 'comparison_intervals' in env:
            for row,ci in zip(tables['comparisons'],env['comparison_intervals']):
                row.update({'CI low':float(ci.low),'CI high':float(ci.high)})
    if 'posthoc' in env:
        ph,ci=env['posthoc'],env['simultaneous'];labels=env['labels']
        tables['comparisons']=[{'comparison':str(labels[i])+' − '+str(labels[j]),'difference':ph.statistic[i,j],
                               'adjusted p':ph.pvalue[i,j],'CI low':ci.low[i,j],'CI high':ci.high[i,j]} for i,j in combinations(range(len(labels)),2)]
    if 'proportion_low' in env:
        tab=env['table']
        tables['row_proportion_intervals']=[{'row':str(tab.index[i]),'category':str(tab.columns[j]),'proportion':tab.iloc[i,j]/tab.iloc[i].sum(),
            'CI low':env['proportion_low'][i,j],'CI high':env['proportion_high'][i,j]} for i,j in product(range(tab.shape[0]),range(tab.shape[1]))]
    return clean({'scalars':scalars,'tables':tables})


def validate_current_inputs(env,plan):
    """Protect inferential preconditions even after upstream learner edits."""
    m=plan['method'];c=plan['config']
    if c['family']=='goodness':
        validate_goodness(env['observed'], env['expected_proportions'], m)
        return
    if c['family']=='proportions':
        if c['structure']=='one':
            k,n=env['count'],env['n'];p=env['reference']
            require(isinstance(k,(int,np.integer)) and isinstance(n,(int,np.integer)) and n>=4 and 0<=k<=n,'Use integer successes and trials, with 0 ≤ successes ≤ trials.')
            require(0<p<1,'Reference proportion must lie between 0 and 1.')
            require(m!='prop_one_z' or min(n*p,n*(1-p))>=10,'Edited counts need an exact binomial route; the z conditions no longer hold.')
        else:
            ks,ns=np.asarray(env['counts']),np.asarray(env['sizes'])
            require(ks.shape==ns.shape==(2,) and np.all(ns>=4) and np.all(ks>=0) and np.all(ks<=ns) and np.all(ks==np.floor(ks)) and np.all(ns==np.floor(ns)),'Use two valid integer success/trial counts.')
            pooled=ks.sum()/ns.sum()
            require(0<pooled<1,'The binary outcome has no variation.')
            require(m!='prop_two_z' or min(*ks,*(ns-ks),*(ns*pooled),*(ns*(1-pooled)))>=10,'Edited counts need Fisher exact; the z conditions no longer hold.')
        return
    if m=='factorial':
        prepare(env['data'],c)
        return
    if m in ('chi2','fisher'):
        tab=np.asarray(env['table'])
        require(tab.ndim==2 and min(tab.shape)>=2 and np.isfinite(tab).all() and (tab>=0).all() and (tab==np.floor(tab)).all(),'Use nonnegative integer counts in a two-way table.')
        require((tab.sum(0)>0).all() and (tab.sum(1)>0).all(),'Empty margins cannot support association inference.')
        expected=stats.contingency.expected_freq(tab)
        require(m!='chi2' or not ((expected<1).any() or (expected<5).mean()>.2),'Edited counts are too sparse for this chi-square route; choose an exact-compatible design.')
        require(m!='fisher' or tab.shape==(2,2),'Fisher requires a 2×2 table.')
        return
    arrays=env['groups'] if 'groups' in env else [env[k] for k in ('a','b') if k in env]
    for x in arrays:
        x=np.asarray(x)
        require(x.ndim==1 and len(x)>=4 and np.isfinite(x).all() and x.std()>0,'Each numeric sample needs at least four finite, varying observations.')
    if c['family'] in ('paired','association'):
        require(len(env['a'])==len(env['b']),'Paired variables must have equal length and aligned observational units.')
    if c['family']=='paired':
        require(np.allclose(env['difference'],np.asarray(env['a'])-np.asarray(env['b'])),'Recalculate difference = a - b after editing the paired arrays.')
        require(np.std(env['difference'])>0,'Paired differences have no variation.')


def stage_figures(env,plan,stage):
    m=plan['method'];c=dict(plan['config'])
    if c['family']=='goodness':
        return goodness_figures(env, stage)
    if c['family']=='proportions':
        if stage!='uncertainty':return []
        import matplotlib.pyplot as plt
        fig,ax=plt.subplots(figsize=(6,3))
        values=[env['estimate']] if c['structure']=='one' else env['proportions']
        labels=['Sample'] if c['structure']=='one' else c['levels']
        ax.bar(labels,values,color='#7651a6');ax.set(ylim=(0,1),ylabel='Observed proportion')
        buf=io.BytesIO();fig.tight_layout();fig.savefig(buf,format='png',dpi=120,facecolor='#fff8eb');plt.close(fig)
        return [{'title':'Proportions in the observed groups','caption':'Bars describe the sample. Read the interval for the target proportion or difference below.','src':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()}]
    if m=='factorial' and stage!='analysis':return []
    if m in ('chi2','fisher'):
        if stage!='followup':return []
    elif m!='factorial' and stage!='assumptions':return []
    return plots(env,c)


class NotebookSession:
    def __init__(self,raw,config):
        self.raw=raw.copy(deep=True);self.plan=notebook_plan(raw,config)
        self.env={'df':self.raw.copy(deep=True)}
        self.checkpoints=[snapshot(self.env)];self.executions=[]

    def run(self,index,code,advanced=''):
        require(0<=index<len(self.plan['route']),'Unknown route step.')
        if (index==6 and len(self.executions)==5 and self.plan['method'] in ('anova','welch_anova','kruskal')
                and self.env.get('p_value',0)>=self.plan['config']['alpha']):
            # The guided post-hoc branch is not needed without omnibus evidence.
            self.executions.append({'code':'','advanced':'','edited':False,'skipped':True})
            self.checkpoints.append(snapshot(self.env))
        require(index<=len(self.executions),'Complete the preceding step first.')
        saved=self.checkpoints[index]
        self.env.clear();self.env.update(snapshot(saved))
        # Functions defined by preceding cells must resolve the current restored namespace.
        for name,value in list(self.env.items()):
            if isinstance(value,types.FunctionType) and value.__code__.co_filename in ('<editable notebook cell>','<advanced calculation>') and value.__globals__ is not self.env:
                self.env[name]=types.FunctionType(value.__code__,self.env,value.__name__,value.__defaults__,value.__closure__)
        self.checkpoints=self.checkpoints[:index+1];self.executions=self.executions[:index]
        spec=self.plan['route'][index];stage=spec['id']
        started=time.perf_counter();out=io.StringIO()
        try:
            if stage=='analysis':validate_current_inputs(self.env,self.plan)
            with warnings.catch_warnings(record=True) as caught, contextlib.redirect_stdout(out):
                warnings.simplefilter('always')
                if advanced.strip():exec(compile(advanced,'<advanced calculation>','exec'),self.env)
                exec(compile(code,'<editable notebook cell>','exec'),self.env)
            if stage=='analysis':
                if self.plan['method'] not in ('factorial','bootstrap'):
                    require('p_value' in self.env and np.ndim(self.env['p_value'])==0 and np.isfinite(self.env['p_value']) and 0<=self.env['p_value']<=1,'The analysis must produce a finite p_value between 0 and 1.')
                elif self.plan['method']=='factorial':
                    require('anova_table' in self.env,'The fitted analysis must produce anova_table.')
            if stage=='uncertainty':
                needed=['effect_size','category_intervals'] if self.plan['config']['family']=='goodness' else ['effects','cell_intervals'] if self.plan['method']=='factorial' else ['effect_size','means'] if self.plan['method'] in ('anova','welch_anova','kruskal') else ['effect_size','interval'] if self.plan['method'] not in ('chi2','fisher') or self.plan['config'].get('table_2x2') else ['effect_size','proportion_low','proportion_high']
                require(all(k in self.env for k in needed),'Keep the effect-size and interval variables so uncertainty is not silently omitted.')
            current=namespace_summary(self.env,self.plan)
            # Only evidence generated by this stage belongs under this cell.
            if stage in ('frame','select','assumptions'):
                current={'scalars':{},'tables':{}}
            elif stage=='analysis':
                current['scalars']={k:v for k,v in current['scalars'].items() if k in ('statistic','p_value')}
                current['tables']={k:v for k,v in current['tables'].items() if k in ('anova_table','distribution')}
            elif stage=='uncertainty':
                current['scalars'].pop('p_value',None);current['scalars'].pop('statistic',None)
                current['tables'].pop('anova_table',None)
            elif stage=='followup':
                current['scalars']={}
                current['tables']={k:v for k,v in current['tables'].items() if k in ('comparisons','residuals','departures')}
            if stage=='conclude':current['tables']={}
            if stage=='select':
                data=self.env.get('paired',self.env.get('data'))
                if isinstance(data,pd.DataFrame):current['tables']['preview']=frame(data.head(6))
                sizes={k:len(self.env[k]) for k in ('a','b','difference') if k in self.env}
                if 'groups' in self.env:sizes={str(i+1):len(g) for i,g in enumerate(self.env['groups'])}
                current['sizes']=sizes
            edited=code.strip()!=spec['code'].strip() or advanced.strip()!=spec.get('advanced','').strip() or any(x['edited'] for x in self.executions)
            interpretation=''
            if stage=='conclude':
                p=self.env.get('p_value');alpha=self.plan['config']['alpha']
                if edited:
                    interpretation='This is an edited, exploratory analysis. The displayed evidence comes from your current Python; verify its method, units and assumptions before applying the original question’s interpretation.'
                elif p is not None:
                    interpretation=(f'At α = {alpha:g}, there is evidence against the stated null. ' if p<alpha else f'At α = {alpha:g}, evidence is insufficient to reject the stated null. This does not establish equality. ') + self.plan['hypotheses']['null']
                else:interpretation='Read the model terms and interactions separately; no single omnibus p-value answers this entire question.' if self.plan['method']=='factorial' else 'This is an estimation route; no hypothesis-test p-value was calculated.'
            if interpretation:
                interpretation = self.plan['name'] + ': ' + interpretation
            current.update(stdout=out.getvalue(),warnings=sorted(set(str(w.message) for w in caught)),figures=stage_figures(self.env,self.plan,stage),
                           edited=edited,interpretation=interpretation,seconds=round(time.perf_counter()-started,3),cue=spec['cue'],stage=stage)
            if stage=='conclude':
                current['caveat']=self.plan['source']['note']+' A p-value is not the probability the null is true. Statistical evidence is not practical importance or causation. Corrections within a route do not cover repeated searches across questions.'
            # Include charts deliberately generated by a learner's edits, too.
            import matplotlib.pyplot as plt
            for number in plt.get_fignums():
                fig=plt.figure(number);buf=io.BytesIO();fig.savefig(buf,format='png',dpi=120);plt.close(fig)
                current['figures'].append({'title':'Your Python figure','caption':'Generated by this cell.','src':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()})
            self.checkpoints.append(snapshot(self.env));self.executions.append({'code':code,'advanced':advanced,'edited':edited})
            return clean(current)
        except Exception:
            self.env.clear();self.env.update(snapshot(saved))
            import matplotlib.pyplot as plt
            plt.close('all')
            raise


notebook_session=None

def notebook_request(action,csv,config,index=0,code='',advanced=''):
    global notebook_session
    if action=='configure':
        notebook_session=NotebookSession(pd.read_csv(io.StringIO(csv)),config)
        return json.dumps({'plan':clean(notebook_session.plan)},allow_nan=False)
    require(notebook_session is not None,'Configure a study before running a cell.')
    return json.dumps({'output':notebook_session.run(index,code,advanced)},allow_nan=False)
