"""One execution, serialized evidence, no retained learner namespace or model.

Checks are evaluated while outputs are alive; Check only reveals the immutable
receipt. Instrumentation supports the taught sklearn paths, not arbitrary-code
security. All monkey patches and plotting resources are released in finally.
"""
import ast
import base64
import contextlib
import copy
import functools
import gc
import hashlib
import io
import inspect
import json
import os
import re
import shutil
import sys
import tempfile
import traceback
import warnings
import weakref
import numpy as np
import pandas as pd

RUNTIME_VERSION = 6
MAX_TEXT = 24000
MAX_EVENTS = 5000

def _labelled_counts_match(actual, expected):
    """Compare the labelled mapping without imposing presentation order."""
    return (isinstance(actual,pd.Series) and actual.index.is_unique
            and len(actual)==len(expected)
            and actual.index.difference(expected.index).empty
            and expected.index.difference(actual.index).empty
            and np.array_equal(actual.reindex(expected.index).to_numpy(),expected.to_numpy()))

def _training_loss_matches(actual, expected):
    if not isinstance(actual,pd.Series) or expected is None:return False
    values=np.asarray(expected)
    index=np.asarray(actual.index)
    return (actual.index.name=='iteration' and actual.shape==values.shape
            and (np.array_equal(index,np.arange(len(values)))
                 or np.array_equal(index,np.arange(1,len(values)+1)))
            and np.allclose(actual.to_numpy(),values))

def _pca_retention_matches(cumulative, retained_80, retained_95, ratios):
    """Use supplied fitted PCA ratios, never a learner-derived oracle."""
    if ratios is None:return False
    expected=np.cumsum(ratios)
    actual=np.asarray(cumulative)
    if actual.shape!=expected.shape or not np.allclose(actual,expected,rtol=1e-10,atol=1e-12):return False
    for count,threshold in ((retained_80,.8),(retained_95,.95)):
        if isinstance(count,(bool,np.bool_)) or not np.isscalar(count):return False
        if not np.isfinite(count) or count!=int(count) or not 1<=count<=len(expected):return False
        if count!=int(np.searchsorted(expected,threshold,side='left')+1):return False
    return True

def _array_digest(value):
    """Compare values across equivalent pandas, NumPy and Python containers."""
    if hasattr(value,'toarray'):value=value.toarray()
    values=np.asarray(value)
    if np.issubdtype(values.dtype,np.number) or np.issubdtype(values.dtype,np.bool_):
        values=values.astype(np.float64)
        values=np.nan_to_num(values,nan=np.nan)
        payload=values.tobytes()
    else:payload=json.dumps(values.tolist(),default=str,ensure_ascii=False).encode()
    return hashlib.sha256(str(values.shape).encode()+payload).hexdigest()

def _sorted_points(values):
    values=np.asarray(values,dtype=float)
    return values[np.lexsort((values[:,1],values[:,0]))] if len(values) else values

def _visible_artist(ax,artist,points=None,transform=None):
    """Require visible evidence, respecting the artist's real transform."""
    if not ax.get_visible() or not ax.figure.get_visible() or not artist.get_visible():return False
    alpha=artist.get_alpha()
    if alpha is not None and not np.any(np.asarray(alpha)>0):return False
    from matplotlib.colors import to_rgba
    colors=[]
    for getter in ('get_facecolor','get_edgecolor','get_color'):
        if not hasattr(artist,getter):continue
        if getter=='get_edgecolor' and hasattr(artist,'get_linewidth') and not np.any(np.asarray(artist.get_linewidth())>0):continue
        value=getattr(artist,getter)()
        if isinstance(value,str):value=to_rgba(value)
        values=np.asarray(value)
        if values.ndim and values.shape[-1]==4:colors.extend(values.reshape(-1,4)[:,3])
    if colors and not any(a>0 for a in colors):return False
    box=ax.get_window_extent()
    if box.width<2 or box.height<2:return False
    if points is not None:
        screen=(transform or ax.transData).transform(np.asarray(points).reshape(-1,2))
        return bool(len(screen) and np.isfinite(screen).all() and ((screen[:,0]>=box.x0-2)&(screen[:,0]<=box.x1+2)&(screen[:,1]>=box.y0-2)&(screen[:,1]<=box.y1+2)).all())
    ax.figure.canvas.draw()
    extent=artist.get_window_extent(ax.figure.canvas.get_renderer())
    return bool(np.isfinite(extent.extents).all() and extent.overlaps(box))

def _labels_visible(ax):
    from matplotlib.colors import to_rgba
    for axis in (ax.xaxis,ax.yaxis):
        label=axis.label
        if not axis.get_visible() or not label.get_text() or not label.get_visible():return False
        alpha=label.get_alpha()
        if (alpha is not None and alpha<=0) or to_rgba(label.get_color())[3]<=0:return False
        ax.figure.canvas.draw()
        if not label.get_window_extent(ax.figure.canvas.get_renderer()).overlaps(ax.figure.bbox):return False
    return True

def _visible_markers(collection):
    count=len(collection.get_offsets());sizes=np.asarray(collection.get_sizes())
    if not len(sizes) or not (np.resize(sizes,count)>0).all():return False
    def alpha(colors):
        colors=np.asarray(colors)
        return np.resize(colors[:,3],count) if colors.ndim==2 and len(colors) else np.zeros(count)
    widths=np.asarray(collection.get_linewidths())
    edges=(alpha(collection.get_edgecolors())>0)&(np.resize(widths,count)>0 if len(widths) else False)
    if not ((alpha(collection.get_facecolors())>0)|edges).all():return False
    paths=collection.get_paths()
    return bool(paths) and all(len(paths[i%len(paths)].vertices)>0 for i in range(count))

def _scatter_matches(x,y,groups=None,axis_quantities=None):
    """Inspect real plotted values, accepting Seaborn and Matplotlib figures."""
    if 'matplotlib.pyplot' not in sys.modules:return False
    from matplotlib.collections import PathCollection
    import matplotlib.pyplot as plt
    expected=np.column_stack([np.asarray(x),np.asarray(y)])
    if expected.ndim!=2 or expected.shape[1]!=2:return False
    for number in plt.get_fignums():
        for ax in plt.figure(number).axes:
            if axis_quantities:
                expected_x,expected_y=axis_quantities
                x_words=set(re.findall(r'[a-z]+[0-9]*',ax.get_xlabel().casefold()))
                y_words=set(re.findall(r'[a-z]+[0-9]*',ax.get_ylabel().casefold()))
                if (expected_x not in x_words or expected_y not in y_words
                        or expected_y in x_words or expected_x in y_words):continue
            plots=[c for c in ax.collections if isinstance(c,PathCollection) and len(c.get_offsets())]
            if not plots or not _labels_visible(ax):continue
            if not all(_visible_artist(ax,c,c.get_offsets(),c.get_offset_transform()) and _visible_markers(c) for c in plots):continue
            actual=np.concatenate([np.asarray(c.get_offsets(),dtype=float) for c in plots])
            if actual.shape!=expected.shape or not np.allclose(_sorted_points(actual),_sorted_points(expected)):continue
            if groups is not None:
                # Seaborn may put all groups in one collection and vary marker
                # paths by row; Matplotlib commonly uses one collection/group.
                groups=np.asarray(groups);styles={}
                valid=True
                for group in np.unique(groups):
                    points=_sorted_points(expected[groups==group])
                    paths=[]
                    for plot in plots:
                        offsets=np.asarray(plot.get_offsets(),dtype=float)
                        marker_paths=plot.get_paths()
                        for i,point in enumerate(offsets):
                            if np.any(np.all(np.isclose(points,point),axis=1)):
                                path=marker_paths[i%len(marker_paths)]
                                colors=plot.get_facecolors()
                                color=tuple(colors[i%len(colors)]) if len(colors) else ()
                                paths.append((hashlib.sha256(path.vertices.tobytes()).hexdigest(),color))
                    if not paths or len(set(paths))!=1:valid=False;break
                    styles[group]=paths[0]
                if not valid or len(set(styles.values()))!=len(styles):continue
            return True
    return False

def _bar_matches(values):
    if 'matplotlib.pyplot' not in sys.modules:return False
    import matplotlib.pyplot as plt
    values=np.asarray(values)
    return any(len(ax.patches)==len(values) and _labels_visible(ax)
               and np.allclose([p.get_height() for p in ax.patches],values)
               and all(p.get_width()>0 and _visible_artist(ax,p,[[p.get_x()+p.get_width()/2,p.get_y()],[p.get_x()+p.get_width()/2,p.get_y()+p.get_height()]]) for p in ax.patches)
               for number in plt.get_fignums() for ax in plt.figure(number).axes)

def _heatmap_matches(values):
    if 'matplotlib.pyplot' not in sys.modules:return False
    import matplotlib.pyplot as plt
    from matplotlib.collections import QuadMesh
    values=np.asarray(values)
    for number in plt.get_fignums():
        for ax in plt.figure(number).axes:
            if not _labels_visible(ax):continue
            for artist in list(ax.images)+[c for c in ax.collections if isinstance(c,QuadMesh)]:
                image=np.asarray(artist.get_array())
                if isinstance(artist,QuadMesh):
                    coordinates=artist.get_coordinates()
                    # Matplotlib 3.5 exposes mesh cells as a flat array;
                    # newer versions preserve their rectangular shape.
                    mesh_shape=tuple(size-1 for size in coordinates.shape[:2])
                    if image.ndim==1 and mesh_shape==values.shape and image.size==values.size:
                        image=image.reshape(mesh_shape)
                if image.shape!=values.shape or not np.allclose(image,values):continue
                if isinstance(artist,QuadMesh):
                    points=[coordinates[0,0],coordinates[-1,-1]]
                else:
                    left,right,bottom,top=artist.get_extent();points=[[left,bottom],[right,top]]
                alpha=artist.get_alpha()
                if alpha is not None and not (np.asarray(alpha)>0).all():continue
                if _visible_artist(ax,artist,points) and (artist.get_cmap()(artist.norm(image))[...,3]>0).all():return True
    return False

def _tree_matches(model):
    if 'matplotlib.pyplot' not in sys.modules:return False
    import matplotlib.pyplot as plt
    import re
    for number in plt.get_fignums():
        for ax in plt.figure(number).axes:
            annotations=[text for text in ax.texts if 'value =' in text.get_text()]
            if not all(_visible_artist(ax,text) for text in annotations):continue
            if not all(text.arrow_patch is None or tuple(text.xy)==tuple(text.xyann) or _visible_artist(ax,text.arrow_patch) for text in annotations):continue
            texts=[text.get_text() for text in annotations]
            # plot_tree also adds True/False edge captions in newer sklearn.
            if len(texts)!=model.tree_.node_count:continue
            samples=[int(re.search(r'samples = (\d+)',text).group(1)) for text in texts]
            if sorted(samples)!=sorted(model.tree_.n_node_samples.tolist()):continue
            values=[float(value) for text in texts for value in re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',text.split('value =',1)[1])]
            expected=np.asarray(model.tree_.value).ravel()
            if len(values)==len(expected) and np.allclose(sorted(values),np.sort(expected),atol=.00051,rtol=1e-7):return True
    return False

def _dendrogram_matches(matrix,last_groups):
    if 'matplotlib.pyplot' not in sys.modules:return False
    import matplotlib.pyplot as plt
    from scipy.cluster.hierarchy import dendrogram
    from matplotlib.collections import LineCollection
    expected=dendrogram(matrix,truncate_mode='lastp',p=last_groups,no_plot=True)
    heights=np.sort(np.asarray(expected['dcoord']).ravel())
    for number in plt.get_fignums():
        for ax in plt.figure(number).axes:
            collections=[c for c in ax.collections if isinstance(c,LineCollection)]
            if not all(_visible_artist(ax,c,c.get_segments()) for c in collections):continue
            if not all((np.asarray(c.get_linewidths())>0).all() and (np.asarray(c.get_colors())[:,3]>0).all() for c in collections):continue
            lines=[segment for collection in collections for segment in collection.get_segments()]
            if len(lines)!=len(expected['dcoord']) or not _labels_visible(ax):continue
            points=np.asarray(lines)
            if any(np.allclose(np.sort(points[:,:,dimension].ravel()),heights) for dimension in (0,1)):return True
    return False

def _split_matches(x,y,x_train,x_test,y_train,y_test,test_size=.2,seed=42,stratified=False):
    from sklearn.model_selection import train_test_split
    expected=train_test_split(x,y,test_size=test_size,random_state=seed,stratify=y if stratified else None)
    return all(isinstance(actual,type(wanted)) and actual.equals(wanted)
               for actual,wanted in zip((x_train,x_test,y_train,y_test),expected))

def _folds_match(actual,x,y=None,count=5,seed=42,kind='KFold'):
    from sklearn import model_selection
    splitter=getattr(model_selection,kind)(n_splits=count,**({} if kind=='TimeSeriesSplit' else dict(shuffle=True,random_state=seed)))
    expected=list(splitter.split(x,y))
    return len(actual)==len(expected) and all(np.array_equal(a,c) and np.array_equal(b,d)
        for (a,b),(c,d) in zip(actual,expected))

def _prepared_values(x,numeric=(),categorical=(),flags=(),scale=True,drop_first=False):
    """Expected teaching preparation from original values, without another fit."""
    blocks=[]
    if numeric:
        values=x[list(numeric)].to_numpy(dtype=float)
        if scale:
            spread=values.std(axis=0);spread=np.where(spread==0,1,spread)
            values=(values-values.mean(axis=0))/spread
        blocks.append(values)
    for column in categorical:
        categories=sorted(x[column].unique())
        if drop_first:categories=categories[1:]
        blocks.append(np.column_stack([x[column].eq(value).to_numpy(dtype=float) for value in categories]))
    if flags:blocks.append(x[list(flags)].to_numpy())
    return np.column_stack(blocks)

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
        self.validation_runs=[];self.diagnostic_runs=[];self.expected_folds=set(expected_folds);self.pca_evidence={};self.kmeans_evidence=[];self.search_runs=[]
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
                if name in ('fit','fit_transform','fit_predict') and len(self.models)<MAX_EVENTS:
                    self.models[id(estimator)]=weakref.ref(estimator)
                self.add(name,type(estimator).__name__,rows,depth)
                event=self.events[-1] if not self.overflow else None
                if event is not None:
                    event['modelId']=id(estimator)
                    if name in ('fit','fit_transform','fit_predict') and depth==0:
                        target=args[1] if len(args)>1 else kwargs.get('y')
                        event['inputHash']=_array_digest(x)
                        event['targetHash']=_array_digest(np.asarray(target).ravel()) if target is not None else None
                        leaf=estimator.steps[-1][1] if hasattr(estimator,'steps') else estimator
                        event['family']=type(leaf).__name__
                self.depth+=1
                try:
                    result=original(estimator,*args,**kwargs)
                    if event is not None and name in ('predict','predict_proba','decision_function') and depth==0:
                        event['predictionHash']=hashlib.sha256(json.dumps(_plain(np.asarray(result)),sort_keys=True).encode()).hexdigest()
                        event['resultHash']=_array_digest(result)
                        event['inputHash']=_array_digest(x)
                        if name=='predict':
                            neighbour_evidence=self._neighbour_evidence(estimator,x)
                            if neighbour_evidence is not None:event['neighbourEvidence']=neighbour_evidence
                    if name in ('fit','fit_transform') and type(estimator).__name__=='PCA':
                        self.pca_evidence[id(estimator)]=(weakref.ref(estimator),estimator.components_.tolist(),estimator.explained_variance_.tolist())
                    if name=='fit' and type(estimator).__name__=='KMeans':
                        self.kmeans_evidence.append(dict(k=estimator.n_clusters,inertia=float(estimator.inertia_),labels=estimator.labels_.tolist(),
                            centers=estimator.cluster_centers_.tolist(),inputHash=_array_digest(x),seed=estimator.random_state,n_init=estimator.n_init))
                    if name=='fit' and type(estimator).__name__=='GridSearchCV':
                        chosen=estimator.best_estimator_
                        leaf=chosen.steps[-1][1] if hasattr(chosen,'steps') else chosen
                        self.search_runs.append(dict(modelId=id(estimator),rows=rows,inputHash=_array_digest(x),
                            targetHash=_array_digest(np.asarray(args[1] if len(args)>1 else kwargs.get('y')).ravel()),
                            scoring=estimator.scoring,grid=copy.deepcopy(estimator.param_grid),
                            scores=np.asarray(estimator.cv_results_['mean_test_score']).copy(),
                            bestScore=float(estimator.best_score_),recipe=repr(chosen),family=type(leaf).__name__,
                            cv=dict(kind=type(estimator.cv).__name__,count=getattr(estimator.cv,'n_splits',estimator.cv),
                                    shuffle=getattr(estimator.cv,'shuffle',False),seed=getattr(estimator.cv,'random_state',None))))
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
                if 'train' in values and 'test' in values and len(self.events)<MAX_EVENTS:
                    self.events.append(dict(kind='validationFold',stage=stage,estimator=type(values.get('estimator')).__name__,depth=self.depth,
                        rows=[row_ids[int(i)] for i in values['train']] if row_ids is not None else None,
                        validationRows=[row_ids[int(i)] for i in values['test']] if row_ids is not None else None,
                        trainPositions=list(map(int,values['train'])),validationPositions=list(map(int,values['test']))))
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
            for name in ('fit','transform','fit_transform','fit_predict','predict','predict_proba','decision_function','set_params'):
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
            start=len(self.events)
            result=original(estimator, X, y, **kwargs)
            leaf=estimator.steps[-1][1] if hasattr(estimator,'steps') else estimator
            self.validation_runs.append(dict(modelId=id(estimator), rows=self.rows(X),
                estimator=type(estimator).__name__,family=type(leaf).__name__,recipe=repr(estimator),
                strategy=getattr(leaf,'strategy',None),
                folds=[(event['trainPositions'],event['validationPositions']) for event in self.events[start:] if event['kind']=='validationFold'],
                scoring=kwargs.get('scoring'), scores=np.asarray(result['test_score']).copy(),
                inputHash=_array_digest(X),targetHash=_array_digest(np.asarray(y).ravel()) if y is not None else None))
            return result
        return call
    def diagnostic_result(self, original):
        @functools.wraps(original)
        def call(estimator, X, y=None, **kwargs):
            result=original(estimator, X, y, **kwargs)
            self.diagnostic_runs.append(dict(modelId=id(estimator),rows=self.rows(X),predictions=np.asarray(result).copy()))
            self.diagnostic_runs[-1].update(inputHash=_array_digest(X),targetHash=_array_digest(np.asarray(y).ravel()),method=kwargs.get('method','predict'))
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
    def fit_matches(self,x,y=None,family=None):
        target=_array_digest(np.asarray(y).ravel()) if y is not None else None
        return not self.overflow and any(e['kind'] in ('fit','fit_transform','fit_predict') and e['depth']==0
            and e.get('inputHash')==_array_digest(x) and e.get('targetHash')==target
            and (family is None or e.get('family')==family) for e in self.events)
    def prediction_matches(self,values,x,method='predict'):
        return any(e['kind']==method and e['depth']==0 and e.get('inputHash')==_array_digest(x)
                   and e.get('resultHash')==_array_digest(values) for e in self.events)
    def _neighbour_evidence(self,estimator,query):
        """Record a one-row scaled KNN query without retaining fitted objects."""
        if not hasattr(estimator,'steps') or len(estimator.steps)!=2:return None
        scale,neighbours=(step[1] for step in estimator.steps)
        if type(scale).__name__!='StandardScaler' or type(neighbours).__name__!='KNeighborsClassifier':return None
        if not scale.with_mean or not scale.with_std:return None
        # Other valid classifier tasks, such as multilabel outputs, do not use
        # this single-label evidence contract and keep their normal prediction.
        if not isinstance(neighbours.classes_,np.ndarray) or neighbours._y.ndim!=1:return None
        if len(query)!=1:return None
        positions=neighbours.kneighbors(scale.transform(query),return_distance=False)[0]
        return dict(k=int(neighbours.n_neighbors),classes=neighbours.classes_.tolist(),
                    mean=scale.mean_.tolist(),scale=scale.scale_.tolist(),
                    positions=positions.tolist(),trainingHash=_array_digest(neighbours._fit_X),
                    targetHash=_array_digest(neighbours.classes_[neighbours._y].ravel()))
    def neighbour_vote_matches(self,prediction,votes,x,y,query,k=5):
        """Bind the recorded fit/query by model identity, never a learner alias.

        The prediction-time snapshot preserves the actual k and neighbour
        positions if editable code subsequently changes an estimator setting.
        """
        if self.overflow or len(query)!=1:return False
        values=np.asarray(prediction).reshape(-1)
        if len(values)!=1:return False
        x_values=np.asarray(x,dtype=float)
        mean=x_values.mean(axis=0);scale=x_values.std(axis=0)
        scale=np.where(scale==0,1,scale)
        target_hash=_array_digest(np.asarray(y).ravel())
        for event in self.events:
            if event['kind']!='predict' or event['depth']!=0:continue
            if event.get('inputHash')!=_array_digest(query) or event.get('resultHash')!=_array_digest(values):continue
            evidence=event.get('neighbourEvidence')
            if not evidence or evidence['k']!=k or len(evidence['positions'])!=k:continue
            reference=self.models.get(event.get('modelId'))
            fitted=reference() if reference is not None else None
            if fitted is None or not hasattr(fitted,'steps'):continue
            if not any(fit['kind']=='fit' and fit['depth']==0 and fit.get('modelId')==event['modelId']
                       and fit.get('inputHash')==_array_digest(x) and fit.get('targetHash')==target_hash
                       and fit.get('family')=='KNeighborsClassifier' for fit in self.events):continue
            leaf=fitted.steps[-1][1]
            if evidence['trainingHash']!=_array_digest(leaf._fit_X) or evidence['targetHash']!=target_hash:continue
            if not np.allclose(evidence['mean'],mean) or not np.allclose(evidence['scale'],scale):continue
            if not np.allclose(leaf._fit_X,(x_values-np.asarray(evidence['mean']))/np.asarray(evidence['scale'])):continue
            if votes is None:return True
            if isinstance(votes,dict):votes=pd.Series(votes)
            if not isinstance(votes,pd.Series) or not votes.index.is_unique:continue
            classes=evidence['classes']
            if len(votes)!=len(classes) or set(votes.index)!=set(classes):continue
            labels=np.asarray(y).ravel()[evidence['positions']]
            expected=pd.Series(labels).value_counts().reindex(classes,fill_value=0)
            if np.array_equal(votes.reindex(classes).to_numpy(),expected.to_numpy()):return True
        return False
    def validation_matches(self,values,x,y,scoring=None,family=None,cv=None,strategy=None):
        scores=values['test_score'] if isinstance(values,dict) else values
        expected=None
        if cv is not None:
            expected=[(list(map(int,train)),list(map(int,validation))) for train,validation in cv.split(x,y)]
        return any(r['inputHash']==_array_digest(x) and r['targetHash']==_array_digest(np.asarray(y).ravel())
                   and (scoring is None or r['scoring']==scoring)
                   and (family is None or r['family']==family) and (strategy is None or r['strategy']==strategy)
                   and (expected is None or r['folds']==expected)
                   and np.array_equal(r['scores'],np.asarray(scores)) for r in self.validation_runs)
    def diagnostic_matches(self,values,x,y,method='predict'):
        return any(r['inputHash']==_array_digest(x) and r['targetHash']==_array_digest(np.asarray(y).ravel())
                   and r['method']==method and np.array_equal(r['predictions'],np.asarray(values)) for r in self.diagnostic_runs)
    def search_matches(self,values,x,y,grid,scoring,positive=False,family=None,cv=None):
        # Step names are a Python choice; the taught estimator settings and
        # candidate order determine this task's semantic comparison.
        def suffixes(g):return {k.rsplit('__',1)[-1]:list(v) for k,v in g.items()}
        scores=values['mean_test_score'] if isinstance(values,pd.DataFrame) else np.asarray(values)
        scores=-np.asarray(scores) if positive else np.asarray(scores)
        return any(r['inputHash']==_array_digest(x) and r['targetHash']==_array_digest(np.asarray(y).ravel())
                   and r['scoring']==scoring and suffixes(r['grid'])==suffixes(grid)
                   and (family is None or r['family']==family) and (cv is None or r['cv']==cv)
                   and np.allclose(r['scores'],scores) for r in self.search_runs)
    def workflow_reports(self,ns):
        """Verify legacy complete-workflow evidence against the same Run."""
        result={}
        def verify(name,fn):
            try:result[name]=bool(fn())
            except (KeyError,NameError,TypeError,ValueError,AttributeError,IndexError):result[name]=False
        train,test=ns.get('X_train'),ns.get('X_test');yt,yv=ns.get('y_train'),ns.get('y_test')
        metric='f1_macro' if 'final_f1' in ns else 'neg_root_mean_squared_error'
        expected_train={i for a,b in self.expected_folds for i in a+b}
        verify('split',lambda: set(map(str,train.index))==expected_train and set(map(str,test.index))==self.test_ids
               and train.index.is_unique and test.index.is_unique and set(train.index).isdisjoint(test.index))
        verify('baseline',lambda:self.validation_matches(ns['reference_results'],train,yt,metric,
               'DummyClassifier' if metric=='f1_macro' else 'DummyRegressor'))
        def validation():
            evidence=ns['cv_results']
            if isinstance(evidence,dict):return self.validation_matches(evidence,train,yt,metric)
            if not isinstance(evidence,pd.DataFrame) or not {'initial_score','selected_score','settings'}<=set(evidence.columns):return False
            for name,row in evidence.iterrows():
                selected=ns['selected'][name]
                family=type(selected.steps[-1][1]).__name__
                runs=[r for r in self.validation_runs if r['inputHash']==_array_digest(train)
                      and r['targetHash']==_array_digest(np.asarray(yt).ravel()) and r['scoring']==metric
                      and family in r['recipe']]
                if not any(np.isclose(row.initial_score,np.mean(r['scores'])) for r in runs):return False
                means=[np.mean(r['scores']) for r in runs if r['recipe']==repr(selected)]
                means += [r['bestScore'] for r in self.search_runs if r['inputHash']==_array_digest(train)
                          and r['targetHash']==_array_digest(np.asarray(yt).ravel()) and r['scoring']==metric
                          and r['recipe']==repr(selected)]
                if not any(np.isclose(row.selected_score,mean) for mean in means):return False
            return bool(len(evidence))
        verify('validation',validation)
        def chosen():
            if 'selected' in ns:return ns['selected'][ns['chosen_name']]
            if 'search' in ns:return ns['search'].best_estimator_
            return ns['chosen'] if 'chosen' in ns else ns['model']
        verify('selection',lambda:repr(ns['final_model'])==repr(chosen())
               and any(e['kind']=='fit' and e['depth']==0 and e.get('modelId')==id(ns['final_model'])
                       and e.get('inputHash')==_array_digest(train) and e.get('targetHash')==_array_digest(np.asarray(yt).ravel()) for e in self.events))
        def diagnosis():
            if 'diagnostic_model' in ns:
                from sklearn.model_selection import TimeSeriesSplit
                a,b=list(TimeSeriesSplit(5).split(train))[-1]
                return (np.array_equal(ns['train_indices'],a) and np.array_equal(ns['validation_indices'],b)
                    and ns['diagnostic_y'].equals(yt.iloc[b]) and self.fit_matches(train.iloc[a],yt.iloc[a])
                    and self.prediction_matches(ns['oof_predictions'],train.iloc[b]))
            return any(r['modelId']==id(chosen()) and r['rows']==list(map(str,train.index))
                       and np.array_equal(r['predictions'],ns['oof_predictions']) for r in self.diagnostic_runs)
        verify('diagnosis',diagnosis)
        def report():
            actual=ns.get('diagnostic_y',yt);predicted=ns['oof_predictions']
            if 'matrix' in ns:
                from sklearn.metrics import confusion_matrix
                if not np.array_equal(ns['matrix'],confusion_matrix(actual,predicted,labels=sorted(yt.unique()))):return False
            if 'residuals' in ns:
                residuals=ns['residuals']
                if isinstance(residuals,pd.DataFrame):
                    if not {'actual','predicted','residual'}<=set(residuals.columns) or not residuals.index.equals(actual.index):return False
                    if not np.allclose(residuals.actual,actual) or not np.allclose(residuals.predicted,predicted):return False
                    if not np.allclose(residuals.residual,np.asarray(actual)-predicted):return False
                elif not np.allclose(residuals,np.asarray(actual)-predicted):return False
            if 'final_accuracy' in ns:
                from sklearn.metrics import accuracy_score
                if not np.isclose(ns['final_accuracy'],accuracy_score(yv,ns['final_predictions'])):return False
            return True
        verify('reports',report)
        return result
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
            matches=[r for r in self.kmeans_evidence if r['k']==row.k and r['inputHash']==_array_digest(scaled) and np.isclose(r['inertia'],row.inertia)]
            if not any(np.isclose(row.silhouette,silhouette_score(scaled,r['labels'],sample_size=min(2000,len(scaled)),random_state=42)) for r in matches):return False
        return True
    def cluster_stat(self,value,scaled,kind,k=3):
        from sklearn.metrics import silhouette_score
        for record in self.kmeans_evidence:
            if record['k']!=k or record['inputHash']!=_array_digest(scaled):continue
            expected=silhouette_score(scaled,record['labels']) if kind=='silhouette' else record[kind]
            if kind=='centers':
                actual=np.asarray(value)
                expected=np.asarray(expected)
                if actual.shape==expected.shape and np.allclose(sorted(actual.tolist()),sorted(expected.tolist())):return True
            elif np.allclose(value,expected):return True
        return False
    def cluster_partition(self,labels,scaled,k=3):
        return any(record['k']==k and record['inputHash']==_array_digest(scaled)
                   and _same_partition(labels,record['labels']) for record in self.kmeans_evidence)
    def cluster_assignment(self,group,distance,scaled,row=0,k=3):
        if not isinstance(group,(int,np.integer)) or not 0<=int(group)<k:return False
        for record in self.kmeans_evidence:
            if record['k']!=k or record['inputHash']!=_array_digest(scaled):continue
            if record['labels'][row]!=int(group):continue
            expected=np.linalg.norm(np.asarray(scaled)[row]-np.asarray(record['centers'])[int(group)])
            if np.isclose(distance,expected):return True
        return False
    def seed_inertias(self,values,scaled,seeds,k=4,n_init=1):
        return len(values)==len(seeds) and all(any(r['seed']==seed and r['k']==k and r['n_init']==n_init
               and r['inputHash']==_array_digest(scaled) and np.isclose(value,r['inertia']) for r in self.kmeans_evidence)
               for seed,value in zip(seeds,values))
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
        # Challenge CSVs are supplied populations. Editable code can load them
        # under any alias, but cannot redefine the source used by the rubric.
        challenge_input=pd.read_csv(exercise['inputFile']) if exercise.get('inputFile') else None
        exec(exercise.get('setup',''),ns)
        supplied_pca=ns.get('pca')
        supplied_network=ns.get('network')
        pca_ratios=(np.array(supplied_pca.explained_variance_ratio_,copy=True)
                    if hasattr(supplied_pca,'explained_variance_ratio_') else None)
        training_losses=(np.array(supplied_network.loss_curve_,copy=True)
                         if hasattr(supplied_network,'loss_curve_') else None)
        del supplied_pca,supplied_network
        # The supplied population is part of the task contract. Keep read-only
        # tables/arrays stable for checks even if editable code rebinds a name.
        # Names assigned by the authored solution are intentional learner
        # results and remain checked from their live values.
        declared={node.id for node in ast.walk(ast.parse(exercise.get('solution',''))) if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Store)}
        trusted_inputs={key:(value.copy(deep=True) if isinstance(value,(pd.DataFrame,pd.Series)) else value.copy())
                        for key,value in ns.items() if key not in declared and isinstance(value,(pd.DataFrame,pd.Series,np.ndarray))}
        trusted_inputs.update({key:copy.deepcopy(value) for key,value in ns.items() if key not in declared and hasattr(value,'split') and hasattr(value,'get_n_splits')})
        for key,value in ns.items():
            if key in declared or not hasattr(value,'get_params'):continue
            from sklearn.utils.validation import check_is_fitted
            try:check_is_fitted(value)
            except (ValueError,TypeError):continue
            trusted_inputs[key]=copy.deepcopy(value)
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
        if exercise.get('assessment') or 'scikit-learn' in exercise.get('packages',[]):
            import sklearn
        trace=LearningTrace(test_ids,expected_folds)
        with warnings.catch_warnings(record=True) as caught,contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr),trace:
            warnings.simplefilter('always')
            # Supplied setup may import a validation function before its module
            # is instrumented. Rebind every alias of that original function so
            # equivalent import styles leave the same observable evidence.
            for key,value in list(ns.items()):
                for owner,name,original in trace.patches:
                    if value is original:ns[key]=getattr(owner,name)
            # The last setup value may itself be a Pipeline. Do not retain it
            # through this function's locals after the learner namespace clears.
            if 'value' in locals():del value
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
        check_ns={**ns,**trusted_inputs,'np':np,'pd':pd,'trace':trace,'_same_partition':_same_partition,'_pca_equivalent':_pca_equivalent,
                  '_scatter_matches':_scatter_matches,'_bar_matches':_bar_matches,
                  '_split_matches':_split_matches,'_folds_match':_folds_match,'_prepared_values':_prepared_values,
                  '_tree_matches':_tree_matches,'_dendrogram_matches':_dendrogram_matches,'_heatmap_matches':_heatmap_matches}
        if challenge_input is not None:check_ns['df']=challenge_input
        check_ns['_labelled_counts_match']=_labelled_counts_match
        check_ns['_training_loss_matches']=lambda answer:_training_loss_matches(answer,training_losses)
        check_ns['_pca_retention_matches']=lambda cumulative,a,b:_pca_retention_matches(cumulative,a,b,pca_ratios)
        needed=' '.join(c.get('test','') for c in exercise.get('checks',[]))
        if 'silhouette_score' in needed:
            from sklearn.metrics import silhouette_score
            check_ns['silhouette_score']=silhouette_score
        if 'cut_tree' in needed:
            from scipy.cluster.hierarchy import cut_tree
            check_ns['cut_tree']=cut_tree
        if exercise.get('assessment'):check_ns['workflow_evidence']=trace.assessment(ns,exercise['assessment'])
        if exercise.get('workflowReports'):check_ns['workflow_reports']=trace.workflow_reports(ns)
        for check in exercise.get('checks',[]):
            status='correct';message=check.get('success','The requested evidence is consistent.')
            try:
                if check.get('selfReview'):
                    status='self-review';message=check['message']
                elif not bool(eval(check['test'],check_ns)):
                    status='needs-attention';message=check['message']
            except (NameError,KeyError,AttributeError,TypeError,ValueError,IndexError) as error:
                status='unavailable';message=check.get('missing',check['message']+' The named evidence is missing or has an incompatible shape/type: '+str(error)+'.')
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
        if 'trusted_inputs' in locals():trusted_inputs.clear()
        if 'check_ns' in locals():check_ns.clear()
        if trace:trace.lineage.clear()
        if 'matplotlib.pyplot' in sys.modules:sys.modules['matplotlib.pyplot'].close('all')
        os.chdir(previous_directory)
        workspace.cleanup()
        gc.collect()
    receipt['retainedPythonObjects']=sum(ref() is not None for ref in trace.models.values()) if trace else 0
    return receipt
