"""One execution, serialized evidence, no retained learner namespace or model.

Checks are evaluated while outputs are alive; Check only reveals the immutable
receipt. Instrumentation supports the taught sklearn paths, not arbitrary-code
security. All monkey patches and plotting resources are released in finally.
"""
import ast
import base64
import contextlib
import functools
import gc
import hashlib
import io
import inspect
import json
import os
import shutil
import sys
import tempfile
import traceback
import warnings
import weakref
import numpy as np
import pandas as pd

RUNTIME_VERSION = 3
MAX_TEXT = 24000
MAX_EVENTS = 5000

def _same_partition(a,b):
    a=np.asarray(a);b=np.asarray(b)
    if a.shape!=b.shape or a.ndim!=1:return False
    forward={};reverse={}
    for left,right in zip(a.tolist(),b.tolist()):
        if left in forward and forward[left]!=right:return False
        if right in reverse and reverse[right]!=left:return False
        forward[left]=right;reverse[right]=left
    return True

def _pca_equivalent(candidate,expected,variances):
    candidate=np.asarray(candidate);expected=np.asarray(expected)
    if candidate.shape!=expected.shape:return False
    # Distinct axes allow paired sign changes. Numerically tied eigenvalues
    # allow any orthonormal basis of that tied component subspace.
    start=0
    while start<expected.shape[1]:
        end=start+1
        while end<expected.shape[1] and np.isclose(variances[end],variances[start],rtol=1e-5,atol=1e-7):end+=1
        a=candidate[:,start:end];b=expected[:,start:end]
        if not np.allclose(a@a.T,b@b.T,rtol=1e-5,atol=1e-7):return False
        start=end
    return np.allclose(candidate.T@candidate,np.eye(candidate.shape[1]),rtol=1e-5,atol=1e-7)

def _plain(value, budget=12000):
    if isinstance(value, (np.integer,np.floating,np.bool_)):value=value.item()
    if isinstance(value,str):return value[:MAX_TEXT]
    if value is None or isinstance(value,(bool,int)):return value
    if isinstance(value,float):return value if np.isfinite(value) else str(value)
    if isinstance(value,pd.DataFrame):
        return {'type':'table','columns':list(map(str,value.columns)),'index':list(map(str,value.index[:100])), 'rows':_plain(value.head(100).to_numpy()),'shape':list(value.shape)}
    if isinstance(value,pd.Series):return {'type':'series','name':str(value.name),'index':list(map(str,value.index[:budget])),'values':_plain(value.to_numpy(),budget)}
    if isinstance(value,np.ndarray):
        if value.size>budget:return {'type':'array','shape':list(value.shape),'preview':_plain(value.reshape(-1)[:100])}
        return _plain(value.tolist(),budget)
    if isinstance(value,(list,tuple)):return [_plain(v,budget) for v in value[:budget]]
    if isinstance(value,dict):return {str(k):_plain(v,budget) for k,v in list(value.items())[:200]}
    if hasattr(value,'get_params'):
        summary={'type':'estimator','class':type(value).__name__}
        summary['parameters']={k:_plain(v,100) if isinstance(v,(str,bool,int,float,type(None),tuple)) else type(v).__name__ for k,v in value.get_params(deep=False).items()}
        for key in ['coef_','intercept_','classes_','feature_importances_','n_iter_','loss_','n_components_','explained_variance_ratio_','best_params_','best_score_']:
            if hasattr(value,key):summary[key]=_plain(getattr(value,key),100)
        if hasattr(value,'named_steps'):summary['steps']={k:_plain(v,100) for k,v in value.named_steps.items()}
        return summary
    return str(value)[:1000]

class _BoundedText(io.StringIO):
    def write(self,text):
        remaining=MAX_TEXT-self.tell()
        if remaining>0:super().write(text[:remaining])
        return len(text)

class LearningTrace:
    def __init__(self,test_ids=(),expected_folds=()):
        self.events=[];self.patches=[];self.stage='user';self.depth=0
        self.test_ids=set(test_ids);self.lineage={};self.models={};self.overflow=False
        self.validation_runs=[];self.diagnostic_runs=[];self.expected_folds=set(expected_folds);self.pca_evidence={};self.kmeans_evidence=[]
    def rows(self,x):
        if isinstance(x,(pd.DataFrame,pd.Series)):
            return [str(i) for i in x.index]
        item=self.lineage.get(id(x))
        return item[1] if item and item[0]() is x else None
    def remember(self,x,rows):
        if rows is None:return
        try:
            key=id(x)
            self.lineage[key]=(weakref.ref(x,lambda ref:self.lineage.pop(key,None)),rows)
        except TypeError:pass
    def patch(self,owner,name,fn):
        old=getattr(owner,name);self.patches.append((owner,name,old));setattr(owner,name,fn(old))
    def add(self,kind,estimator,rows,depth):
        if len(self.events)>=MAX_EVENTS:self.overflow=True;return
        self.events.append({'kind':kind,'estimator':estimator,'rows':rows,'stage':self.stage,'depth':depth})
    def method(self,name):
        def decorate(original):
            @functools.wraps(original)
            def call(estimator,*args,**kwargs):
                x=args[0] if args else kwargs.get('X')
                rows=self.rows(x);depth=self.depth
                if name in ('fit','fit_transform') and len(self.models)<MAX_EVENTS:
                    self.models[id(estimator)]=weakref.ref(estimator)
                self.add(name,type(estimator).__name__,rows,depth)
                event=self.events[-1] if not self.overflow else None
                if event is not None:event['modelId']=id(estimator)
                self.depth+=1
                try:
                    result=original(estimator,*args,**kwargs)
                    if event is not None and name in ('predict','predict_proba','decision_function') and depth==0:
                        event['predictionHash']=hashlib.sha256(json.dumps(_plain(np.asarray(result)),sort_keys=True).encode()).hexdigest()
                    if name in ('fit','fit_transform') and type(estimator).__name__=='PCA':
                        self.pca_evidence[id(estimator)]=(weakref.ref(estimator),estimator.components_.tolist(),estimator.explained_variance_.tolist())
                    if name=='fit' and type(estimator).__name__=='KMeans':
                        self.kmeans_evidence.append((estimator.n_clusters,float(estimator.inertia_),estimator.labels_.tolist()))
                    if name in ('transform','fit_transform'):self.remember(result,rows)
                    return result
                finally:self.depth-=1
            return call
        return decorate
    def phase(self,stage):
        def decorate(original):
            signature=inspect.signature(original)
            @functools.wraps(original)
            def call(*args,**kwargs):
                previous=self.stage;self.stage=stage
                values=signature.bind_partial(*args,**kwargs).arguments
                row_ids=self.rows(values.get('X'))
                if row_ids is not None and 'train' in values and 'test' in values and len(self.events)<MAX_EVENTS:
                    self.events.append(dict(kind='validationFold',stage=stage,estimator=type(values.get('estimator')).__name__,depth=self.depth,
                        rows=[row_ids[int(i)] for i in values['train']],validationRows=[row_ids[int(i)] for i in values['test']]))
                try:return original(*args,**kwargs)
                finally:self.stage=previous
            return call
        return decorate
    def __enter__(self):
        if 'sklearn' not in sys.modules:return self
        from sklearn import preprocessing,impute,compose,pipeline,linear_model,tree,neighbors,svm,naive_bayes,discriminant_analysis,neural_network,dummy,cluster,decomposition
        from sklearn.model_selection import _validation,GridSearchCV
        owners=[preprocessing.StandardScaler,preprocessing.OneHotEncoder,preprocessing.PolynomialFeatures,impute.SimpleImputer,compose.ColumnTransformer,compose.TransformedTargetRegressor,pipeline.Pipeline,linear_model.LinearRegression,linear_model.Ridge,linear_model.LogisticRegression,tree.DecisionTreeRegressor,tree.DecisionTreeClassifier,neighbors.KNeighborsClassifier,svm.SVC,naive_bayes.GaussianNB,naive_bayes.BernoulliNB,discriminant_analysis.LinearDiscriminantAnalysis,discriminant_analysis.QuadraticDiscriminantAnalysis,neural_network.MLPRegressor,neural_network.MLPClassifier,dummy.DummyRegressor,dummy.DummyClassifier,cluster.KMeans,decomposition.PCA,GridSearchCV]
        helper=sys.modules.get('ml_helpers')
        if helper:owners.extend([helper.OneRClassifier,helper.OneRPreprocessor])
        for owner in owners:
            for name in ('fit','transform','fit_transform','predict','predict_proba','decision_function','set_params'):
                if hasattr(owner,name):self.patch(owner,name,self.method(name))
        import sklearn.model_selection as selection
        self.patch(selection,'cross_validate',self.validation_result)
        self.patch(selection,'cross_val_predict',self.diagnostic_result)
        self.patch(_validation,'_fit_and_score' ,self.phase('cv'))
        self.patch(_validation,'_fit_and_predict',self.phase('oof'))
        return self
    def validation_result(self, original):
        @functools.wraps(original)
        def call(estimator, X, y=None, **kwargs):
            result=original(estimator, X, y, **kwargs)
            self.validation_runs.append(dict(modelId=id(estimator), rows=self.rows(X),
                estimator=type(estimator).__name__, recipe=repr(estimator),
                scoring=kwargs.get('scoring'), scores=np.asarray(result['test_score']).copy()))
            return result
        return call
    def diagnostic_result(self, original):
        @functools.wraps(original)
        def call(estimator, X, y=None, **kwargs):
            result=original(estimator, X, y, **kwargs)
            self.diagnostic_runs.append(dict(modelId=id(estimator),rows=self.rows(X),predictions=np.asarray(result).copy()))
            return result
        return call
    def assessment(self, ns, spec):
        """Evidence for the supported open-choice workflow contract, never prose grading."""
        result={}
        def verify(name, fn):
            try:result[name]=bool(fn())
            except (KeyError,NameError,TypeError,ValueError,AttributeError,IndexError):result[name]=False
        df=ns['df']
        X=ns.get('X');y=ns.get('y');train=ns.get('X_train');test=ns.get('X_test')
        yt=ns.get('y_train');yv=ns.get('y_test')
        verify('features', lambda: ns['target']==spec['target'] and len(ns['feature_names'])>0
               and set(ns['feature_names'])<=set(spec['available']) and len(set(ns['feature_names']))==len(ns['feature_names'])
               and X.equals(df[ns['feature_names']]) and y.equals(df[spec['target']]))
        verify('split',lambda: train.index.is_unique and test.index.is_unique
               and set(train.index).isdisjoint(test.index) and set(train.index)|set(test.index)==set(df.index)
               and .15<=len(test)/len(df)<=.3 and train.equals(X.loc[train.index]) and test.equals(X.loc[test.index])
               and yt.equals(y.loc[train.index]) and yv.equals(y.loc[test.index]))
        if result['split']:
            self.test_ids=set(map(str,test.index))
            try:
                f=ns['folds'];pairs=list(f.split(train,yt))
                self.expected_folds={(tuple(map(str,train.index[a])),tuple(map(str,train.index[b]))) for a,b in pairs}
                result['folds']=type(f).__name__ in ('KFold','StratifiedKFold') and 3<=len(pairs)<=5 and f.shuffle
                if spec['classification']:
                    result['folds'] &= type(f).__name__=='StratifiedKFold' and set(yt)==set(yv)==set(y)
            except (KeyError,AttributeError,TypeError,ValueError):result['folds']=False
        else:result['folds']=False
        verify('boundary',lambda: result['split'] and self.no_test_fit() and self.verified_fits() and self.preparation_inside_folds())
        allowed=('f1_macro','balanced_accuracy') if spec['classification'] else ('neg_root_mean_squared_error','neg_mean_absolute_error')
        verify('metric',lambda: ns['metric'] in allowed)
        def matching_run(model, scores):
            return any(r['modelId']==id(model) and r['rows']==list(map(str,train.index))
                       and r['scoring']==ns['metric'] and np.array_equal(r['scores'],np.asarray(scores)) for r in self.validation_runs)
        verify('baseline',lambda: type(ns['reference']).__name__==('DummyClassifier' if spec['classification'] else 'DummyRegressor')
               and matching_run(ns['reference'],ns['reference_results']['test_score']) and np.isfinite(ns['reference_results']['test_score']).all())
        def candidates_valid():
            from sklearn.pipeline import Pipeline
            allowed_models=('LogisticRegression','DecisionTreeClassifier','KNeighborsClassifier','GaussianNB','LinearDiscriminantAnalysis','SVC','MLPClassifier') if spec['classification'] else ('LinearRegression','Ridge','DecisionTreeRegressor')
            for name, candidate in ns['candidates'].items():
                if not isinstance(candidate,Pipeline) or type(candidate.steps[-1][1]).__name__ not in allowed_models:return False
                if not matching_run(candidate,ns['cv_results'][name]['test_score']):return False
                if not np.isfinite(ns['cv_results'][name]['test_score']).all():return False
            return bool(ns['candidates']) and set(ns['candidates'])==set(ns['cv_results']) and self.matching_folds()
        verify('validation',lambda: result['folds'] and result['metric'] and candidates_valid())
        verify('diagnosis',lambda: any(r['modelId']==id(ns['candidates'][ns['chosen_name']]) and r['rows']==list(map(str,train.index)) and np.array_equal(r['predictions'],ns['diagnostic_predictions']) for r in self.diagnostic_runs))
        verify('selection',lambda: ns['chosen_name'] in ns['candidates']
               and repr(ns['final_model'])==repr(ns['candidates'][ns['chosen_name']])
               and any(e['kind']=='fit' and e.get('modelId')==id(ns['final_model']) and e['depth']==0
                       and e['rows']==list(map(str,train.index)) for e in self.events))
        def final_valid():
            preds=np.asarray(ns['final_predictions'])
            digest=hashlib.sha256(json.dumps(_plain(preds),sort_keys=True).encode()).hexdigest()
            events=[e for e in self.events if e['depth']==0 and e['kind'] in ('predict','predict_proba','decision_function')
                    and e['rows'] and set(e['rows'])&self.test_ids]
            return len(events)==1 and events[0].get('modelId')==id(ns['final_model']) and events[0]['rows']==list(map(str,test.index)) and events[0].get('predictionHash')==digest and self.final_after_selection()
        verify('final',lambda: result['split'] and final_valid())
        def correct_metric():
            from sklearn.metrics import f1_score, balanced_accuracy_score, mean_squared_error, mean_absolute_error
            metric=ns['metric'];pred=ns['final_predictions']
            value={'f1_macro':lambda:f1_score(yv,pred,average='macro'),'balanced_accuracy':lambda:balanced_accuracy_score(yv,pred),
                   'neg_root_mean_squared_error':lambda:np.sqrt(mean_squared_error(yv,pred)),
                   'neg_mean_absolute_error':lambda:mean_absolute_error(yv,pred)}[metric]()
            return np.isclose(ns['final_score'],value)
        verify('score',lambda: correct_metric())
        result['_details']={
            'features':'Observed selected features: '+str(ns.get('feature_names','not supplied'))+'. Outcome: '+str(ns.get('target','not supplied'))+'.',
            'metric':'Observed scoring rule: '+str(ns.get('metric','not supplied'))+'.',
            'baseline':'Recorded cross_validate runs using a dummy: '+str(sum(r['estimator'] in ('DummyRegressor','DummyClassifier') for r in self.validation_runs))+'.',
            'final':'Observed top-level final-row prediction calls: '+str(sum(e['depth']==0 and e['kind'] in ('predict','predict_proba','decision_function') and bool(e['rows']) and bool(set(e['rows'])&self.test_ids) for e in self.events))+'.',
            'score':'Reported final score: '+str(ns.get('final_score','not supplied'))+'.',
        }
        return result
    def __exit__(self,*args):
        for owner,name,old in reversed(self.patches):setattr(owner,name,old)
        self.patches.clear();self.lineage.clear()
    def no_test_fit(self):
        return not any(e['kind'] in ('fit','fit_transform') and e['rows'] is not None and set(e['rows'])&self.test_ids for e in self.events)
    def verified_fits(self):
        fits=[e for e in self.events if e['kind']=='fit' and e['depth']==0]
        return bool(fits) and all(e['rows'] is not None for e in fits) and not self.overflow
    def phase_present(self,phase):return any(e['kind']=='fit' and e['stage']==phase for e in self.events)
    def pca_axes(self,estimator,axes):
        item=self.pca_evidence.get(id(estimator))
        return bool(item and item[0]() is estimator and _pca_equivalent(axes,np.asarray(item[1])[:axes.shape[1]].T,item[2][:axes.shape[1]]))
    def cluster_scores(self,evidence,scaled):
        from sklearn.metrics import silhouette_score
        for row in evidence.itertuples():
            matches=[(inertia,labels) for k,inertia,labels in self.kmeans_evidence if k==row.k and np.isclose(inertia,row.inertia)]
            if not any(np.isclose(row.silhouette,silhouette_score(scaled,labels,sample_size=min(2000,len(scaled)),random_state=42)) for inertia,labels in matches):return False
        return True
    def matching_folds(self):
        folds=[e for e in self.events if e['kind']=='validationFold']
        return bool(folds) and all((tuple(e['rows']),tuple(e['validationRows'])) in self.expected_folds for e in folds)
    def preparation_inside_folds(self):
        preprocessors={'StandardScaler','OneHotEncoder','ColumnTransformer','SimpleImputer','PolynomialFeatures','OneRPreprocessor'}
        return not any(e['kind'] in ('fit','fit_transform') and e['depth']==0 and e['estimator'] in preprocessors and e['stage'] not in ('cv','oof') for e in self.events)
    def preparation_matches(self, pipeline, groups, polynomial=False, drop_first=False):
        """Inspect the taught preparation without fitting or executing it again.

        Compare operations per original feature, accepting direct transformers,
        nested pipelines and equivalent ColumnTransformer group names.
        """
        try:
            steps=pipeline.steps
            if polynomial:
                expansion,scale=steps[0][1],steps[1][1]
                return (len(steps)==3 and type(expansion).__name__=='PolynomialFeatures'
                        and not expansion.include_bias and expansion.degree in (2,3)
                        and type(scale).__name__=='StandardScaler' and scale.with_mean and scale.with_std
                        and type(steps[-1][1]).__name__=='Ridge')
            def operations(transformer,columns):
                if isinstance(transformer,str):
                    return {c:[] for c in columns} if transformer=='passthrough' else {}
                name=type(transformer).__name__
                if name=='FunctionTransformer' and transformer.func is None:return {c:[] for c in columns}
                if name=='ColumnTransformer':
                    found={}
                    for _,child,selected in getattr(transformer,'transformers_',transformer.transformers):
                        if isinstance(child,str) and child=='drop':continue
                        names=[columns[c] if isinstance(c,(int,np.integer)) else c for c in selected]
                        child_ops=operations(child,names)
                        if set(found)&set(child_ops):return {}
                        found.update(child_ops)
                    return found
                if name=='Pipeline':
                    found={c:[] for c in columns}
                    for _,child in transformer.steps:
                        current=operations(child,columns)
                        if set(current)!=set(found):return {}
                        found={c:found[c]+current[c] for c in columns}
                    return found
                if name=='StandardScaler' and transformer.with_mean and transformer.with_std:op='scale'
                elif (name=='OneHotEncoder' and transformer.handle_unknown=='ignore'
                      and transformer.drop==('first' if drop_first else None)):op='one-hot encode'
                else:op='unsupported'
                return {c:[op] for c in columns}
            expected={c:[] if group['operation']=='passthrough' else group['operation'].split(' → ')
                      for group in groups for c in group['columns']}
            columns=list(getattr(pipeline,'feature_names_in_',expected))
            return len(steps)==2 and operations(steps[0][1],columns)==expected
        except (AttributeError,TypeError,ValueError,IndexError):
            return False
    def final_after_selection(self):
        exposures=[i for i,e in enumerate(self.events) if e['kind'] in ('predict','predict_proba','decision_function') and e['rows'] and set(e['rows'])&self.test_ids]
        if not exposures or self.overflow:return False
        later=self.events[min(exposures)+1:]
        if any(e['stage'] in ('cv','oof') or e['kind'] in ('fit','fit_transform','set_params','selection') for e in later):return False
        predictions=[self.events[i] for i in exposures if self.events[i]['depth']==0]
        if len({e.get('modelId') for e in predictions})>1:return False
        seen={}
        for e in predictions:
            key=(e['kind'],tuple(e['rows']))
            if key in seen and seen[key]!=e.get('predictionHash'):return False
            seen[key]=e.get('predictionHash')
        return True

class _SelectionBindings(ast.NodeTransformer):
    """Record changes to the declared workflow choices, at execution time.

    Fits/searches/set_params and prediction identities cover estimator aliases;
    these bindings additionally cover choosing an already fitted candidate.
    """
    choices={'chosen_name','selected','final_model','model','search'}
    def visit_Assign(self,node):
        self.generic_visit(node)
        names={n.id for target in node.targets for n in ast.walk(target) if isinstance(n,ast.Name)}
        if not names & self.choices:return node
        note=ast.Expr(ast.Call(ast.Name('_learning_selection',ast.Load()),[],[]))
        return [node,ast.copy_location(note,node)]

def _figure_evidence():
    if 'matplotlib.pyplot' not in sys.modules:return []
    import matplotlib.pyplot as plt
    figures=[]
    for number in plt.get_fignums()[:4]:
        fig=plt.figure(number);buffer=io.BytesIO()
        fig.savefig(buffer,format='png',dpi=100,bbox_inches='tight')
        axes=[]
        for ax in fig.axes:
            axes.append({'title':ax.get_title(),'xLabel':ax.get_xlabel(),'yLabel':ax.get_ylabel(),'lines':[_plain(np.column_stack(line.get_data())) for line in ax.lines[:10]],'collections':[_plain(c.get_offsets()) for c in ax.collections[:10]]})
        content=buffer.getvalue()
        figures.append({'axes':axes,'image':base64.b64encode(content).decode() if len(content)<2000000 else None})
        buffer.close()
    return figures

def run_learning(request):
    exercise=request['exercise'];code=request.get('code','')
    identity=json.dumps([exercise['id'],exercise.get('version',1),FIXTURE_VERSION,RUNTIME_VERSION,code],sort_keys=True)
    receipt={'id':hashlib.sha256(identity.encode()).hexdigest(),'exerciseId':exercise['id'],'runtimeVersion':RUNTIME_VERSION,'outputs':{},'checks':[],'figures':[],'error':None}
    ns={'__name__':'__learning__','np':np,'pd':pd}
    stdout=_BoundedText();stderr=_BoundedText();trace=None
    previous_directory=os.getcwd()
    workspace=tempfile.TemporaryDirectory(prefix='ml-learning-')
    source_data=os.path.join(previous_directory,'data')
    if os.path.isdir(source_data):shutil.copytree(source_data,os.path.join(workspace.name,'data'))
    try:
        os.chdir(workspace.name)
        if 'matplotlib' in sys.modules:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            plt.close('all')
        if exercise.get('dataset') and exercise.get('preload',True):ns['df']=learning_fixture(exercise['dataset'])
        exec(exercise.get('setup',''),ns)
        test_ids=[];expected_folds=[]
        if exercise.get('protect') and not exercise.get('assessment'):
            spec=exercise['protect'];df=ns.get('df')
            if df is None:df=learning_fixture(exercise['dataset'])
            if spec.get('time'):
                from sklearn.model_selection import TimeSeriesSplit
                train=df.iloc[:int(len(df)*.8)]
                test_ids=list(map(str,df.index[int(len(df)*.8):]))
                splitter=TimeSeriesSplit(5)
            else:
                from sklearn.model_selection import train_test_split,KFold,StratifiedKFold
                stratify=df[spec['target']] if spec.get('stratified') else None
                train,test=train_test_split(df,test_size=spec.get('testSize',.2),random_state=42,stratify=stratify)
                test_ids=list(map(str,test.index))
                splitter=(StratifiedKFold if spec.get('stratified') else KFold)(5,shuffle=True,random_state=42)
            expected_folds=[(tuple(map(str,train.index[a])),tuple(map(str,train.index[b]))) for a,b in splitter.split(train,train[spec['target']])]
        if exercise.get('assessment'):
            import sklearn
        trace=LearningTrace(test_ids,expected_folds)
        with warnings.catch_warnings(record=True) as caught,contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr),trace:
            warnings.simplefilter('always')
            try:
                tree=ast.parse(code,mode='exec')
                ns['_learning_selection']=lambda:trace.add('selection','declared workflow choice',None,0)
                tree=ast.fix_missing_locations(_SelectionBindings().visit(tree))
                if tree.body and isinstance(tree.body[-1],ast.Expr):
                    last=tree.body.pop();exec(compile(tree,'<learner>','exec'),ns)
                    ns['_last_output']=eval(compile(ast.Expression(last.value),'<learner>','eval'),ns)
                else:exec(compile(tree,'<learner>','exec'),ns)
            except Exception:receipt['error']=traceback.format_exc(limit=6)[-MAX_TEXT:]
        # Trusted checks inspect current objects without fitting a reference model.
        check_ns={**ns,'np':np,'pd':pd,'trace':trace,'_same_partition':_same_partition,'_pca_equivalent':_pca_equivalent}
        if exercise.get('assessment'):check_ns['workflow_evidence']=trace.assessment(ns,exercise['assessment'])
        for check in exercise.get('checks',[]):
            status='correct';message=check.get('success','The requested evidence is consistent.')
            try:
                if check.get('selfReview'):
                    status='self-review';message=check['message']
                elif not bool(eval(check['test'],check_ns)):
                    status='needs-attention';message=check['message']
            except (NameError,KeyError,AttributeError,TypeError,ValueError,IndexError):
                status='unavailable';message=check.get('missing','Run the code and create the requested output before checking this deliverable.')
            if check.get('evidenceKey') and 'workflow_evidence' in check_ns:
                detail=check_ns['workflow_evidence'].get('_details',{}).get(check['evidenceKey'])
                if detail:message+=' '+detail
            receipt['checks'].append({'name':check['name'],'status':status,'message':message})
        for name in exercise.get('outputs',['_last_output']):
            if name in ns:receipt['outputs'][name]=_plain(ns[name])
        receipt['figures']=_figure_evidence()
        receipt['warnings']=list(dict.fromkeys(str(w.message) for w in caught))[:20]
        row_sets=[];row_keys={};events=[]
        for event in trace.events:
            rows=tuple(event['rows']) if event['rows'] is not None else None
            if rows not in row_keys:
                row_keys[rows]=len(row_sets);row_sets.append(rows)
            events.append({k:v for k,v in event.items() if k!='rows'}|{'rowSet':row_keys[rows]})
        receipt['provenance']={'events':events,'rowSets':row_sets,'truncated':trace.overflow,'testExposed':any(e['kind'] in ('predict','predict_proba','decision_function') and e['rows'] and set(e['rows'])&trace.test_ids for e in trace.events)}
        receipt['downloads']=[]
        for filename in sorted(os.listdir('.')):
            if not filename.lower().endswith(('.png','.svg','.csv')) or not os.path.isfile(filename):continue
            if os.path.getsize(filename)>2000000 or len(receipt['downloads'])>=4:continue
            with open(filename,'rb') as exported:content=exported.read()
            receipt['downloads'].append({'name':filename,'data':base64.b64encode(content).decode()})
    except Exception:receipt['error']=traceback.format_exc(limit=6)[-MAX_TEXT:]
    finally:
        receipt['stdout']=stdout.getvalue();receipt['stderr']=stderr.getvalue()
        stdout.close();stderr.close()
        ns.clear()
        if 'check_ns' in locals():check_ns.clear()
        if trace:trace.lineage.clear()
        if 'matplotlib.pyplot' in sys.modules:sys.modules['matplotlib.pyplot'].close('all')
        os.chdir(previous_directory)
        workspace.cleanup()
        gc.collect()
    receipt['retainedPythonObjects']=sum(ref() is not None for ref in trace.models.values()) if trace else 0
    return receipt
