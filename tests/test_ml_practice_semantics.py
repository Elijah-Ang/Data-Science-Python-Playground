"""Native audit of every generated dormant ML code task and checkpoint.

These tasks are metadata in the fixed guided UI. This exercises the production
validator and real prepared data, not the browser availability of Practice mode.
Run with --output DIR for inspectable per-instance evidence.
"""
from __future__ import annotations
import argparse,ast,contextlib,csv,hashlib,io,json,re,subprocess,traceback,warnings
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def alternative(code,kind,exercise=None):
    if kind=='model':
        return code.replace('pipeline = Pipeline([','pipeline_steps = [').replace('])\npipeline',']\npipeline = Pipeline(steps=pipeline_steps)\npipeline')
    if kind=='cv':
        return code.replace('pipeline, X_train, y_train, cv=cv,','estimator=pipeline, X=X_train, y=y_train, cv=cv,').replace('fold_scores = pd.DataFrame({','fold_scores = pd.DataFrame.from_dict({')
    if kind=='kmeans':
        return code.replace('clusters = kmeans.fit_predict(X_scaled)','kmeans.fit(X=X_scaled)\nclusters = kmeans.labels_.copy() + 17')
    if kind=='hierarchical':
        return code.replace('clusters = cut_tree(hierarchy, n_clusters=selected_k).ravel()','clusters = np.asarray(cut_tree(hierarchy, n_clusters=selected_k)).reshape(-1) + 17')
    if kind=='pca_selection':
        return code.replace('components_for_target = int(target_row["component"])','components_for_target = int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_), variance_target, side="left") + 1)')
    if kind=='checkpoint_supervised':
        return code.replace('checkpoint_pipeline = Pipeline([','checkpoint_steps = [').replace('])\n#',']\ncheckpoint_pipeline = Pipeline(steps=checkpoint_steps)\n#').replace('checkpoint_pipeline, X_train, y_train, cv=cv,','estimator=checkpoint_pipeline, X=X_train, y=y_train, cv=cv,').replace('("prepare", preprocessor)','("inputs", preprocessor)').replace('("model", model)','("estimator", model)').replace('("polynomial", polynomial)','("expand", polynomial)').replace('("scale", scale)','("standardize", scale)')
    if kind=='checkpoint_kmeans':
        return code.replace('checkpoint_labels = checkpoint_model.labels_','checkpoint_labels = checkpoint_model.labels_.copy() + 17')
    if kind=='checkpoint_hierarchical':
        return code.replace('checkpoint_labels = cut_tree(checkpoint_hierarchy, n_clusters=checkpoint_k).ravel()','checkpoint_labels = np.asarray(cut_tree(checkpoint_hierarchy, n_clusters=checkpoint_k)).reshape(-1) + 17')
    if kind=='checkpoint_pca':
        return code.replace('checkpoint_components = int(np.flatnonzero(np.cumsum(checkpoint_pca.explained_variance_ratio_) >= checkpoint_variance_target)[0] + 1)','checkpoint_components = int(np.searchsorted(np.cumsum(checkpoint_pca.explained_variance_ratio_), checkpoint_variance_target, side="left") + 1)').replace('checkpoint_projection = checkpoint_pca.transform(X_scaled)[:, :checkpoint_components]','checkpoint_pca.components_ *= -1\ncheckpoint_projection = checkpoint_pca.transform(X_scaled)[:, :checkpoint_components]')
    raise AssertionError(kind)

def near_miss(namespace,kind):
    if kind=='model':
        name,_=namespace['pipeline'].steps[0]
        namespace['pipeline'].steps[0]=(name,'passthrough')
        return 'Removed required preparation while keeping Pipeline shape'
    if kind=='cv':
        col='validation_macro_f1' if 'validation_macro_f1' in namespace['fold_scores'] else 'validation_rmse'
        namespace['fold_scores'][col]+=0.071
        return 'Fabricated finite fold scores with unchanged shape'
    if kind=='kmeans':
        namespace['clusters']=namespace['np'].roll(namespace['clusters'],1)
        return 'Shifted cluster labels to different rows'
    if kind=='hierarchical':
        namespace['clusters']=namespace['np'].roll(namespace['clusters'],1)
        return 'Shifted Ward-cut labels to different sampled rows'
    if kind=='pca_selection':
        namespace['X_reduced']=namespace['X_reduced']+0.071
        return 'Correct component count with invented coordinates'
    if kind=='checkpoint_supervised':
        namespace['checkpoint_scores']['validation_score']+=0.071
        return 'Fabricated finite checkpoint scores'
    if kind in ('checkpoint_kmeans','checkpoint_hierarchical'):
        features=namespace['feature_names']
        namespace['checkpoint_profile'][features[0]]+=0.071
        return 'Original-unit profile with altered feature values'
    if kind=='checkpoint_pca':
        namespace['checkpoint_loadings']=namespace['checkpoint_loadings']+0.071
        return 'Correctly shaped but invented PCA weights'
    raise AssertionError(kind)

def execute(namespace,source,spec):
    namespace['__cell_code']=source
    observation=namespace['begin_practice_observation'](spec)
    try:
        with contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()),warnings.catch_warnings():
            warnings.simplefilter('ignore')
            exec(source,namespace,namespace)
    finally:
        observation.finish()
    return namespace['validate_practice_exercise'](spec)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path)
    parser.add_argument('--limit',type=int,default=0)
    args=parser.parse_args()
    import numpy as np,pandas as pd,matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt,seaborn as sns,sklearn
    payload=json.loads(subprocess.check_output(['node','tests/generate_ml_routes.mjs'],cwd=ROOT,text=True))
    rows=[];errors=[];routes=[(int(f),r) for f,rs in payload['routes'].items() for r in rs]
    if args.limit:routes=routes[:args.limit]
    for route_index,(folds,route) in enumerate(routes):
        ns={'pd':pd,'np':np,'plt':plt,'sns':sns,'ast':ast,'display':lambda value:None,'__builtins__':__builtins__}
        ds=route['dataset'];ns['df']=pd.read_csv(ROOT/ds['file'],sep=ds['sep'])
        exec(payload['oneRHelperSource'],ns,ns)
        exec(payload['practiceValidatorSource'],ns,ns)
        model=route['modelId']
        needed={'frame','split','prepare','model','baseline'} if route['modelTask']!='unsupervised' else {'frame','prepare','compare','fit'} if model=='kmeans' else {'frame','prepare','dendrogram','compare','fit'} if model=='hierarchical' else {'frame','prepare','variance','select'}
        units=[]
        try:
            for cell in route['cells']:
                if cell['id'] not in needed:continue
                exercise=(cell.get('practice') or {}).get('exercise')
                if not exercise:
                    with contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()),warnings.catch_warnings():
                        warnings.simplefilter('ignore');exec(cell['code'],ns,ns)
                else:
                    units.append((cell['id'],exercise,cell['code'],None))
                    reference=execute(ns,cell['code'],exercise['validation'])
                    units[-1]=(cell['id'],exercise,cell['code'],reference)
                plt.close('all')
            checkpoint=route['checkpoint']
            units.append(('independent-checkpoint',checkpoint,checkpoint['referenceSolution'],None))
        except Exception as error:
            errors.append({'route':route_index,'error':traceback.format_exc()})
        for task_id,unit,code,reference in units:
            spec=unit['validation'];kind=spec['kind']
            row={'id':f"playground:{folds}:{route['datasetId']}:{route['scenarioId']}:{model}:{task_id}",
                'dataset':route['datasetId'],'scenario':route['scenarioId'],'model':model,'folds':folds,'task_id':task_id,'kind':kind,
                'availability':'dormant metadata; guided UI fixed','review':'definition-family review plus every generated field/scaffold and native instance',
                'reference':'not-run','equivalence':'not-run','near_miss':'not-run','guard':'not-run'}
            try:
                reference=execute(ns,code,spec) if reference is None else reference
                row['reference']='passed' if reference['ok'] else 'failed';row['reference_feedback']=reference['message']
                alt=alternative(code,kind,unit)
                if alt==code:raise AssertionError('Alternative did not change code')
                result=execute(ns,alt,spec)
                row['equivalence']='passed' if result['ok'] else 'failed';row['equivalence_feedback']=result['message'];row['alternative_code']=alt
                good=ns.copy()
                if kind=='model':
                    import copy
                    ns['pipeline']=copy.deepcopy(ns['pipeline'])
                for name in ('fold_scores','checkpoint_scores','checkpoint_profile'):
                    if isinstance(ns.get(name),pd.DataFrame):ns[name]=ns[name].copy(deep=True)
                row['near_miss_case']=near_miss(ns,kind)
                result=ns['validate_practice_exercise'](spec)
                row['near_miss']='passed' if not result['ok'] else 'failed';row['near_miss_feedback']=result['message']
                ns['__cell_code']='# X_test and y_test remain sealed; ordinary explanation is safe\npass'
                harmless=ns['_practice_forbidden_source'](spec) is None
                ns['__cell_code']='holdout_alias = X_test'
                blocked=ns['_practice_forbidden_source'](spec)
                row['guard']='passed' if harmless and blocked and not blocked['ok'] else 'failed'
                if kind in ('cv','checkpoint_supervised'):
                    # Wrong fold generation cannot be repaired by a finite table.
                    # Inspect real fold evidence without rerunning a reference fit.
                    ns.update(good)
                    obs=ns.get('__practice_observation')
                    for run in getattr(obs,'runs',[]):run['folds']=list(reversed(run['folds']))
                    ns['__cell_code']=alt
                    denied=ns['validate_practice_exercise'](spec)
                    row['wrong_folds']='passed' if not denied['ok'] else 'failed'
                    ns.update(good)
                    rebound=execute(ns,'X_train = X.copy()\ny_train = y.copy()\n'+alt,spec)
                    row['training_rebinding']='passed' if not rebound['ok'] else 'failed'
                    row['training_rebinding_feedback']=rebound['message']
                ns.update(good)
                if route['modelId']=='naive_bayes' and kind=='model':
                    variant='GaussianNB' if type(ns.get('model')).__name__=='BernoulliNB' else 'BernoulliNB'
                    wrong='from sklearn.naive_bayes import '+variant+'\n'+re.sub(r'^model\s*=.*$', 'model = '+variant+'()',code,flags=re.M)
                    result=execute(ns,wrong,spec)
                    row['wrong_bayes_variant']='passed' if not result['ok'] else 'failed'
                    row['wrong_bayes_variant_feedback']=result['message'];ns.update(good)
                if kind in ('kmeans','checkpoint_kmeans'):
                    fitted=ns['kmeans' if kind=='kmeans' else 'checkpoint_model']
                    saved=fitted.cluster_centers_.copy();fitted.cluster_centers_+=.071
                    ns['__cell_code']=alt
                    result=ns['validate_practice_exercise'](spec)
                    row['mutated_centers']='passed' if not result['ok'] else 'failed'
                    fitted.cluster_centers_=saved
                    inertia=fitted.inertia_;fitted.inertia_+=.071
                    result=ns['validate_practice_exercise'](spec)
                    row['fabricated_inertia']='passed' if not result['ok'] else 'failed'
                    fitted.inertia_=inertia
                if kind=='checkpoint_supervised':
                    fitted=ns['checkpoint_pipeline'];steps=fitted.steps.copy();fitted.steps=list(reversed(steps))
                    ns['__cell_code']=alt
                    result=ns['validate_practice_exercise'](spec)
                    row['swapped_pipeline_roles']='passed' if not result['ok'] else 'failed'
                    fitted.steps=steps
            except Exception:
                row['error']=traceback.format_exc();errors.append({'id':row['id'],'error':row['error']})
            rows.append(row);plt.close('all')
        if (route_index+1)%10==0:print(f"{route_index+1}/{len(routes)} route variants; {len(rows)} executable practice/checkpoint units",flush=True)
    failed=[row for row in rows if any(row.get(key)!='passed' for key in ('reference','equivalence','near_miss','guard')) or any(row.get(key)=='failed' for key in ('wrong_folds','training_rebinding','wrong_bayes_variant','mutated_centers','fabricated_inertia','swapped_pipeline_roles'))]
    evidence={'source_sha256':{key:hashlib.sha256(payload[key].encode()).hexdigest() for key in ('practiceValidatorSource','workerSource')},'native_versions':{'python':__import__('sys').version,'numpy':np.__version__,'pandas':pd.__version__,'sklearn':sklearn.__version__,'seaborn':sns.__version__},'routes':len(routes),'units':len(rows),'failed_units':len(failed),'errors':errors,'rows':rows}
    if args.output:
        args.output.mkdir(parents=True,exist_ok=True)
        (args.output/'playground-native-cases.json').write_text(json.dumps(evidence,indent=2))
        columns=sorted({key for row in rows for key in row if key!='alternative_code'})
        with (args.output/'playground-native-cases.csv').open('w',newline='') as handle:
            writer=csv.DictWriter(handle,fieldnames=columns,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
    print(json.dumps({'routes':len(routes),'units':len(rows),'failed_units':len(failed),'errors':len(errors),'failed_ids':[r['id'] for r in failed]},indent=2))
    if failed or errors:raise SystemExit(1)
if __name__=='__main__':main()
