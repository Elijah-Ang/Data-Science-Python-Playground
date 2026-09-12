"""Exhaustive production control audit. No resample reduction or numerical mocks.

Candidates include disabled combinations, so backend rejections remain tested.
Specified continuous values use one representative for the finite count; boundary
and invalid values are separately tested. Every accepted candidate executes every
primary/Advanced cell in a real NotebookSession, including conditional follow-up.
Rendering is disabled here; integrated Pyodide/browser suites verify real figures.
"""
import os
for variable in ('OPENBLAS_NUM_THREADS','OMP_NUM_THREADS','MKL_NUM_THREADS'): os.environ[variable]='1'
import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import csv
import itertools as it
import json
from pathlib import Path
import sys
import time
import numpy as np
import pandas as pd
from numpy.testing import assert_allclose

ROOT=Path(__file__).resolve().parents[2]; HERE=ROOT/'statistics'
D=json.loads((HERE/'controls.json').read_text())
NS={}
for filename in ('engine.py','proportions.py','notebook.py'):
    exec(compile((HERE/filename).read_text(),str(HERE/filename),'exec'),NS)
NS['stage_figures']=lambda *args: []
DATA={k:pd.read_csv(ROOT/'data'/v['file']) for k,v in NS['SOURCES'].items()}


def configurations():
    for family,datasets in D['families'].items():
        for dataset in datasets:
            base={'family':family,'dataset':dataset};nums=D['numeric'][dataset];cats=D['categorical'][dataset];levels=D['categories'][dataset]
            choices=[]
            if family=='reference':
                for y in nums:
                    for route in ({'goal':'mean','known_sigma':False},{'goal':'mean','known_sigma':True,'sigma':800},{'goal':'estimate'}):
                        choices.append({'y':y,'reference':4000 if dataset=='penguins' else 50,**route})
            elif family=='independent':
                for y,g in it.product(nums,cats):
                    for pair in it.product(levels[g],repeat=2):
                        for toggle in ({'goal':'mean','equal_variance':False},{'goal':'mean','equal_variance':True},{'goal':'rank'}):
                            choices.append({'y':y,'group':g,'levels':list(pair),**toggle})
            elif family=='paired':
                for y,b,a,goal in it.product(nums,D['years'],D['years'],D['goals'][family]):
                    choices.append({'y':y,'before':b,'after':a,'goal':goal})
            elif family=='groups':
                for y,g in it.product(nums,D['groupChoices']):
                    for toggle in ({'goal':'mean','equal_variance':False},{'goal':'mean','equal_variance':True},{'goal':'rank'}):
                        choices.append({'y':y,'group':g,**toggle})
            elif family=='factorial':
                for y,n in it.product(nums,D['factorCounts']):
                    for fs in it.product(cats,repeat=n):choices.append({'y':y,'factors':list(fs)})
            elif family in ('association','categorical'):
                values=nums if family=='association' else cats
                for x,y in it.product(values,repeat=2):
                    for goal in D['goals'].get(family,[None]):
                        choices.append({'x':x,'y':y,**({'goal':goal} if goal else {})})
            elif family=='proportions':
                for outcome in cats:
                    for success in levels[outcome]:
                        choices.append({'structure':'one','outcome':outcome,'success':success,'reference':.5})
                        for g in cats:
                            for pair in it.product(levels[g],repeat=2):
                                choices.append({'structure':'two','outcome':outcome,'success':success,'group':g,'levels':list(pair)})
            elif family=='goodness':
                for outcome,mode in it.product(cats,D['expectedModes']):
                    k=len(levels[outcome]);weights=np.arange(1,k+1,dtype=float);weights/=weights.sum()
                    choices.append({'outcome':outcome,'expected_mode':mode,**({'expected':weights.tolist()} if mode=='specified' else {})})
            for c,confidence in it.product(choices,D['confidence']):yield {**base,**c,'confidence':confidence}


def key(c):return json.dumps(c,sort_keys=True,separators=(',',':'))


def check_evidence(s, outputs):
    env=s.env;m=s.plan['method']
    assert len(outputs)==len(s.plan['route'])
    assert all(o['cue'] and (o['stdout'].strip() or (o['stage']=='followup' and m in ('anova','welch_anova','kruskal') and env['p_value']>=s.plan['config']['alpha'])) for o in outputs), s.plan['config']
    assert not any('Traceback' in o['stdout'] for o in outputs)
    assert m in ('factorial','bootstrap') or (np.isfinite(env['p_value']) and 0<=env['p_value']<=1)
    assert m=='factorial' or np.isfinite(env['effect_size'])
    for field in ('statistic','estimate'):
        if field in env:
            assert not np.isnan(env[field]),(m,field)
            assert np.isfinite(env[field]) or m in ('fisher','chi2','prop_two_exact'),(m,field)
    for variable in ('interval','exact_odds_interval'):
        if variable in env:
            v=np.asarray(env[variable],dtype=float)
            assert v.shape==(2,) and not np.isnan(v).any() and v[0]<=v[1], (variable,v)
            # Exact odds ratios legitimately have unbounded endpoints at zero cells.
            assert np.isfinite(v).all() or m in ('fisher','chi2','prop_two_exact'), (m,variable,v)
    for o in outputs:
        for name,rows in o['tables'].items():
            assert rows and all(isinstance(k,str) and k.strip() for k in rows[0]), (name,rows[:1])
            for row in rows:
                for column,value in row.items():
                    if value is None:
                        assert name=='anova_table' and row.get('index')=='Residual' and column in ('F','PR(>F)'), (m,name,column,row)
        json.dumps(o,allow_nan=False)
    assert s.plan['name'] in outputs[-1]['interpretation']
    return NS['namespace_summary'](env,s.plan)


def execute(c):
    try:s=NS['NotebookSession'](DATA[c['dataset']],c)
    except ValueError as error:
        assert len(str(error))>=20 and 'Traceback' not in str(error)
        return {'config':c,'status':'rejected','reason':str(error)}
    surfaces=[];outputs=[]
    for i,cell in enumerate(s.plan['route']):
        primary=cell['code'];advanced=cell.get('advanced','')
        compile(primary,'primary','exec');compile(advanced,'advanced','exec')
        surfaces.append({'step':cell['id'],'primary':len(primary.splitlines()),'advanced':len(advanced.splitlines())})
        outputs.append(s.run(i,primary,advanced))
    try: evidence=check_evidence(s,outputs)
    except Exception as error: raise AssertionError(f'{c}: {error}') from error
    return {'config':c,'status':'valid','method':s.plan['method'],'surface':surfaces,'evidence':evidence}


def invariants(results):
    valid={key(r['config']):r for r in results if r['status']=='valid'};counts=Counter();mc=[]
    for r in valid.values():
        c=r['config'];e=r['evidence']['scalars'];m=r['method']
        if c['confidence']==.95:
            triplet=[valid[key({**c,'confidence':conf})]['evidence'] for conf in D['confidence']]
            for field in ('estimate','effect_size','p_value'):
                if field in e:assert_allclose([x['scalars'][field] for x in triplet],e[field],rtol=1e-10,atol=1e-12)
            if 'interval' in e:
                widths=[x['scalars']['interval'][1]-x['scalars']['interval'][0] for x in triplet if all(isinstance(v,(int,float)) for v in x['scalars']['interval'])]
                assert np.all(np.diff(widths)>=-1e-10), (c,widths)
            for table in ('means','cell_intervals','category_intervals','row_proportion_intervals','comparisons'):
                if not all(table in x['tables'] for x in triplet):continue
                rows=[x['tables'][table] for x in triplet]
                low,high=('mean_ci_lower','mean_ci_upper') if table=='cell_intervals' else ('CI low','CI high')
                for a,b,d in zip(*rows):
                    if low in a:assert b[high]-b[low]>=a[high]-a[low]-1e-9 and d[high]-d[low]>=b[high]-b[low]-1e-9,(c,table,a,b,d)
            if m=='factorial':
                for rows in zip(*(x['tables']['anova_table'] for x in triplet)):
                    if rows[0]['index']!='Residual':
                        assert_allclose([[row['F'],row['PR(>F)']] for row in rows],np.tile([rows[0]['F'],rows[0]['PR(>F)']],(3,1)),rtol=1e-10,atol=1e-12)
            counts['confidence_triplets']+=1
        if c['family']=='independent' or (c['family']=='proportions' and c['structure']=='two'):
            other=valid.get(key({**c,'levels':c['levels'][::-1]}))
            if other:
                z=other['evidence']['scalars'];assert_allclose(e['p_value'],z['p_value'],rtol=1e-10,atol=1e-12)
                assert_allclose(e['effect_size'],-z['effect_size'],rtol=1e-10,atol=1e-12)
                assert_allclose(e['interval'],-np.array(z['interval'])[::-1],atol=1e-10)
                counts['group_swaps']+=1
        if c['family']=='association':
            other=valid[key({**c,'x':c['y'],'y':c['x']})];z=other['evidence']['scalars']
            assert_allclose(e['effect_size'],z['effect_size'],atol=1e-12)
            assert_allclose(e['p_value'],z['p_value'],rtol=1e-10,atol=1e-12)
            assert_allclose(e['interval'],z['interval'],atol=1e-10)
            counts['correlation_swaps']+=1
        if c['family']=='factorial':
            canonical=valid[key({**c,'factors':sorted(c['factors'])})]
            def terms(rows):return {':'.join(sorted(row['index'].split(':'))):row for row in rows if row['index']!='Residual'}
            a=terms(r['evidence']['tables']['anova_table']);b=terms(canonical['evidence']['tables']['anova_table'])
            for name,row in a.items():assert_allclose([row['F'],row['PR(>F)']],[b[name]['F'],b[name]['PR(>F)']],rtol=1e-7,atol=1e-9)
            tables=r['evidence']['tables'];cells=tables['cell_means']
            for comparison in tables['comparisons']:
                x,y=cells[comparison['cell A']],cells[comparison['cell B']]
                assert x[c['factors'][0]]!=y[c['factors'][0]]
                assert all(x[f]==y[f] for f in c['factors'][1:])
            counts['factor_orders']+=1
    return {**counts,'monte_carlo_max_swap_deviation':max(mc,default=0)}


def continuous_cases():
    cases=[]
    def add(base,field,values):
        for value,accepted in values:
            cases.append(({**base,field:value},accepted))
    base={'family':'reference','dataset':'penguins','confidence':.95}
    add(base,'reference',[(0,True),(-1,True),(1e6,True),(float('nan'),False),(float('inf'),False)])
    add({**base,'known_sigma':True},'sigma',[(.001,True),(800,True),(1e6,True),(0,False),(-1,False),(float('nan'),False),(float('inf'),False)])
    base={'family':'proportions','dataset':'candy','structure':'one','confidence':.95}
    n=len(DATA['candy'])
    add(base,'reference',[(.0001,True),(10/n-1e-8,True),(10/n,True),(.5,True),(.9999,True),(0,False),(1,False),(-.1,False),(1.1,False),(float('nan'),False)])
    base={'family':'goodness','dataset':'penguins','outcome':'species','expected_mode':'specified','confidence':.95}
    add(base,'expected',[([.2,.3,.5],True),([.999,.0005,.0005],False),([0,.5,.5],False),([-.1,.5,.6],False),([.2,.2,.2],False),([float('nan'),.5,.5],False),([1],False)])
    base={'family':'goodness','dataset':'candy','outcome':'chocolate','expected_mode':'specified','confidence':.95}
    add(base,'expected',[([.99,.01],True),([.01,.99],True),([.5,.5],True)])
    results=[]
    for c,accepted in cases:
        r=execute(c)
        assert (r['status']=='valid')==accepted,(c,r)
        # Keep even non-finite input descriptions JSON-safe and explicit.
        r['config']=repr(c);results.append(r)
    return results


def main():
    p=argparse.ArgumentParser();p.add_argument('--workers',type=int,default=4);p.add_argument('--enumerate-only',action='store_true');p.add_argument('--output',default=str(HERE/'audit/results'));args=p.parse_args()
    configs=list(configurations());assert len({key(c) for c in configs})==len(configs)
    if args.enumerate_only:print(len(configs),dict(Counter(c['family'] for c in configs)));return
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True);started=time.time();results=[]
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for i,r in enumerate(pool.map(execute,configs,chunksize=4),1):
            results.append(r)
            if i%100==0:print(f'{i}/{len(configs)} configurations audited ({time.time()-started:.0f}s)',flush=True)
    (out/'configurations.json').write_text(json.dumps(results,indent=2,allow_nan=False)+'\n')
    assert Counter(r['status'] for r in results)=={'valid':3462,'rejected':3483}, 'Acceptance counts changed; review every changed rejection before updating the contract.'
    inv=invariants(results)
    boundaries=continuous_cases()
    (out/'continuous-cases.json').write_text(json.dumps(boundaries,indent=2,allow_nan=False)+'\n')
    with (out/'code-surface.csv').open('w') as f:
        writer=csv.writer(f);writer.writerow(['configuration','method','step','primary_lines','advanced_lines'])
        for r in [*results,*boundaries]:
            for s in r.get('surface',[]):writer.writerow([key(r['config']),r['method'],s['step'],s['primary'],s['advanced']])
    surfaces=[s for r in results for s in r.get('surface',[])]
    summary={'configurations':len(results),'counts':dict(Counter(r['status'] for r in results)),
             'families':{f:dict(Counter(r['status'] for r in results if r['config']['family']==f)) for f in D['families']},
             'methods':dict(Counter(r['method'] for r in results if r['status']=='valid')),
             'continuous_cases':len(boundaries),'continuous_counts':dict(Counter(r['status'] for r in boundaries)),
             'primary_max':max(s['primary'] for s in surfaces),'advanced_max':max(s['advanced'] for s in surfaces),
             'cells_over_25':sum(s['primary']>25 for s in surfaces),'invariants':inv,'seconds':round(time.time()-started)}
    (out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':main()
