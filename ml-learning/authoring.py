"""Authoritative content assembly. Generates JSON; requires only Python stdlib."""
import copy
import ast
import builtins
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
CARDS={}
CONTRACT_MEANINGS={
 'X':'Feature dataframe for the declared population, preserving row indices.',
 'y':'Target series, aligned with X.',
 'df':'Loaded and prepared input dataframe.',
 'X_train':'Training feature rows from the declared split.',
 'X_test':'Final-test feature rows from the declared split.',
 'y_train':'Training targets, aligned with X_train.',
 'y_test':'Final-test targets, aligned with X_test.',
 'reference_results':'cross_validate result for the dummy reference; test_score contains five scores.',
 'cv_results':'Candidate validation evidence; comparison workflows use a dataframe indexed by model ID.',
 'selected':'Dictionary mapping each requested model ID to its chosen pipeline.',
 'chosen_name':'Model ID nominated from training evidence.',
 'final_model':'Chosen pipeline fitted on training rows, after selection and diagnosis.',
 'final_predictions':'Unaltered predictions of final_model on X_test.',
 'final_rmse':'Root mean squared error in original target units.',
 'final_f1':'Macro F1 on final-test class predictions.',
 'search':'Fitted GridSearchCV for the declared parameter comparison.',
 'probabilities':'Dataframe of final probabilities, indexed by test rows and labelled by fitted classes.',
 'ablation_results':'Five matching training-fold scores for the measurements-only ablation.',
 'sample':'Original-unit dataframe with the reproducible sampled row indices.',
 'scaled_sample':'Scaled values of sample, in the same row order.',
 'scaler':'StandardScaler fitted on the declared discovery population.',
 'scaled':'Standardised features in the same row/column order as X.',
 'model':'Fitted estimator or pipeline for the requested model family.',
 'labels':'One cluster label per fitted row; equivalent consistent label names are accepted.',
 'sizes':'Group sizes indexed by cluster label.',
 'profiles':'Original-unit means grouped by aligned cluster labels.',
 'evidence':'Dataframe with k, inertia and silhouette columns for k=2–8.',
 'linkage_matrix':'Ward linkage matrix of scaled_sample.',
 'cut_evidence':'Silhouette evidence for hierarchy cuts k=2–8.',
 'pca':'PCA fitted on scaled measurements.',
 'ratios':'Explained variance ratios in descending component order.',
 'cumulative':'Cumulative sum of ratios.',
 'retained':'Smallest number of components reaching at least 90% variance.',
 'reduced':'Scores for the retained component prefix.',
 'weights':'Feature-by-two dataframe of PC1/PC2 axis weights, labelled by feature and component.',
 'scores2':'Row-by-two component scores, with signs consistent with weights.',
 'train_indices':'Positions of the final forward-training block.',
 'validation_indices':'Positions of its later validation block.',
 'diagnostic_y':'Targets for the training-only diagnostic population.',
 'oof_predictions':'Training-only out-of-fold predictions, or last-block predictions for time data.',
 'matrix':'Confusion matrix of training-only diagnostic predictions.',
 'residuals':'Training-only actual, predicted and actual-minus-predicted residual evidence.',
 'loss_curve':'Training loss history of the selected neural regressor.',
 'loss_curves':'Dictionary of available neural training-loss histories by model ID.',
 'final_accuracy':'Final-test accuracy, supplementary to macro F1.',
 'answer':'The requested result, with the values, labels and row order described by this task.',
 'names':'Encoded feature names in the same order as the transformed columns.',
 'priors':'Fitted class prior probabilities in the estimator’s class order.',
 'sizes_2':'Counts for the two-group hierarchy cut; arbitrary group IDs may be renamed consistently.',
 'sizes_4':'Counts for the four-group hierarchy cut; arbitrary group IDs may be renamed consistently.',
 'cut_scores':'Dictionary mapping each requested hierarchy cut size to its observed silhouette score.',
 'chosen_k':'One of the compared hierarchy cut sizes, chosen for a defensible exploratory purpose.',
}
def workflow_contract(exercise):
    reads=set()
    for check in exercise.get('checks',[]):
        tree=ast.parse(check.get('test','True'),mode='eval')
        local={n.id for c in ast.walk(tree) if isinstance(c,ast.comprehension) for n in ast.walk(c.target) if isinstance(n,ast.Name)}
        reads|={n.id for n in ast.walk(tree) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Load)}-local
    names=set(exercise['outputs'])|(reads-set(dir(builtins))-{'np','pd','trace','workflow_reports','workflow_evidence','silhouette_score','cut_tree','_labelled_counts_match','_training_loss_matches','_pca_retention_matches','_same_partition','_pca_equivalent','_scatter_matches','_bar_matches','_tree_matches','_dendrogram_matches','_heatmap_matches','_split_matches','_folds_match','_prepared_values'})
    exercise['contract']=[dict(name=n,description=CONTRACT_MEANINGS.get(n,'Requested result described in the task and deliverables.')) for n in sorted(names)]
    if 'cv_results=pd.DataFrame(rows).set_index' in exercise.get('solution',''):
        for item in exercise['contract']:
            if item['name']=='cv_results':item['description']='Dataframe indexed by the requested model IDs, with initial_score, selected_score and settings columns. Scores are observed mean training-fold scores; settings describes the chosen recipe.'
DECKS=[
 dict(id='foundations',key='F',title='ML Foundations',description='Questions and Python basics, then complete regression and classification workflows.',chapters=['Questions and tables','Learning from examples','Honest evaluation']),
 dict(id='workflow',key='W',title='Supervised Workflow',description='Prepare, validate, debug and demonstrate readiness on unfamiliar data.',chapters=['Prepare','Validate and compare','Select, diagnose and finish']),
 dict(id='regression',key='R',title='Regression',description='Predict quantities with lines, curves and trees.',chapters=['Lines and evidence','Several predictors','Curves and trees']),
 dict(id='classification',key='C',title='Classification',description='Understand class evidence and nine model families.',chapters=['Evidence','Probabilities and neighbours','Margins and rules','Class distributions']),
 dict(id='networks',key='N',title='Neural Networks',description='Shared network ideas, then a regression or classification route.',chapters=['Shared network concepts','Task workflows','Go Further']),
 dict(id='clustering',key='U',title='Clustering and Discovery',description='Ask exploratory questions with K-Means and hierarchies.',chapters=['A different question','K-Means','Hierarchical discovery']),
 dict(id='pca',key='P',title='PCA',description='Understand new axes, retained variance and reduced representations.',chapters=['New axes','How much to retain','Reading a representation']),
 dict(id='comparison',key='M',title='Choose and Explain Models',description='Bring all families together in an evidence-based model-choice capstone.',chapters=['Frame and shortlist','Compare fairly','Communicate evidence']),
]
SOURCES={
 'foundations':[
  ['X, y and the estimator interface','https://jakevdp.github.io/PythonDataScienceHandbook/05.02-introducing-scikit-learn.html'],
  ['Common pitfalls and leakage','https://scikit-learn.org/stable/common_pitfalls.html']],
 'workflow':[
  ['Pipelines and composite estimators','https://scikit-learn.org/stable/modules/compose.html'],
  ['Preprocessing','https://scikit-learn.org/stable/modules/preprocessing.html'],
  ['Cross-validation','https://scikit-learn.org/stable/modules/cross_validation.html']],
 'regression':[
  ['Linear models','https://scikit-learn.org/stable/modules/linear_model.html'],
  ['Regression lab','https://islp.readthedocs.io/en/latest/labs/Ch03-linreg-lab.html'],
  ['Trees','https://scikit-learn.org/stable/modules/tree.html']],
 'classification':[
  ['Classification metrics','https://scikit-learn.org/stable/modules/model_evaluation.html'],
  ['Neighbours','https://scikit-learn.org/stable/modules/neighbors.html'],
  ['Support vector machines','https://scikit-learn.org/stable/modules/svm.html'],
  ['Trees','https://scikit-learn.org/stable/modules/tree.html'],
  ['Naive Bayes','https://scikit-learn.org/stable/modules/naive_bayes.html'],
  ['LDA and QDA','https://scikit-learn.org/stable/modules/lda_qda.html'],
  ['Holte: Very Simple Classification Rules','https://webdocs.cs.ualberta.ca/~holte/Publications/simple_rules.pdf']],
 'networks':[
  ['Supervised neural networks','https://scikit-learn.org/stable/modules/neural_networks_supervised.html'],
  ['Deep learning lab','https://islp.readthedocs.io/en/latest/labs/Ch10-deeplearning-lab.html']],
 'clustering':[
  ['Clustering','https://scikit-learn.org/stable/modules/clustering.html'],
  ['Ward linkage','https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.linkage.html']],
 'pca':[
  ['PCA intuition','https://jakevdp.github.io/PythonDataScienceHandbook/05.09-principal-component-analysis.html'],
  ['Decomposition','https://scikit-learn.org/stable/modules/decomposition.html']],
 'comparison':[
  ['Model selection and evaluation','https://scikit-learn.org/stable/model_selection.html'],
  ['Unsupervised learning lab','https://islp.readthedocs.io/en/latest/labs/Ch12-unsup-lab.html']]
}

def evidence_feedback(task, test):
    """Turn the observable contract into a useful next check, without grading prose."""
    first=re.split(r'(?<=[.!?])\s+| Then explain:',task,maxsplit=1)[0].rstrip('.!?')
    focus=first.lower()
    lower=test.lower()
    if 'residual' in focus:
        cue='Calculate actual minus predicted on the same evaluation rows and preserve their original indices.'+(' Plot those aligned residuals against the requested input.' if any(x in focus for x in ('draw ','plot ')) else '')
    elif any(x in focus for x in ('draw ', 'plot ', ' chart', 'dendrogram')):
        cue='Check both the returned evidence and the figure: plot the requested population, labels and axes from that same result.'
    elif 'macro f1' in focus or 'macro-f1' in focus:
        cue='Compute F1 separately for each class, then average classes equally; check the declared label order.'
    elif 'precision' in focus or 'recall' in focus:
        cue='Count the requested class’s true positives, false positives and false negatives before dividing.'
    elif 'confusion matrix' in focus:
        cue='Keep actual labels on rows, predicted labels on columns and the requested class order, including empty classes.'
    elif 'support-vector' in focus:
        cue='Read the fitted support-vector count for each class in the estimator’s class order.'
    elif any(x in focus for x in ('scaler','standardise','standardize','scaling')):
        cue='Fit the scaler only on the declared training population, then transform the requested rows without refitting.'
    elif 'imput' in focus:
        cue='Learn replacement values from training rows and apply those same fitted values to the requested rows.'
    elif 'encod' in focus:
        cue='Keep the fitted category schema and transformed column order; unseen categories must follow the stated policy.'
    elif 'pca' in focus or 'component' in focus:
        cue='Reuse the fitted scale and PCA axes, preserve row order and distinguish new coordinates from original columns.'
    elif 'fold' in focus or 'cross-valid' in focus or 'search' in focus:
        cue='Compare the requested candidates on matching training folds and read validation scores before using final-test rows.'
    elif 'pipeline' in focus:
        cue='Fit the named preparation and estimator together on training rows, then predict the requested rows through that fitted pipeline.'
    elif 'coefficient' in focus or 'slope' in focus or 'intercept' in focus:
        cue='Read the fitted coefficient or intercept in the specified feature order and keep its original units.'
    elif 'rmse' in focus or 'r²' in focus or 'r2' in focus or 'mae' in focus:
        cue='Use the stated actual and predicted rows; RMSE and MAE are errors in target units, while R² uses its declared reference.'
    elif 'split' in focus or 'stratif' in focus:
        cue='Check partition sizes, class balance where requested, disjoint row identities and aligned X/y indices.'
    elif 'probabilit' in focus or 'threshold' in focus:
        cue='Keep probabilities aligned with fitted class labels and apply the stated threshold without assuming a fixed column order.'
    elif 'centroid' in focus or 'cluster' in focus or 'silhouette' in focus:
        cue='Check the scaled fitting rows, aligned group labels and original-unit profiles; group IDs are arbitrary.'
    elif 'tree' in focus or 'leaf' in focus:
        cue='Use the fitted tree and its declared depth or leaf settings; verify the requested row reaches the reported leaf.'
    elif 'network' in focus or 'hidden' in focus:
        cue='Separate configured network settings from fitted attributes and keep predictions aligned with the requested rows.'
    elif 'predict' in focus:
        cue='Use the fitted model on the stated input rows and schema; keep predictions in that row and class order.'
    elif 'count' in focus or 'frequency' in focus:
        cue='Count the stated population and categories, preserving the named labels and their order.'
    elif any(x in lower for x in ('x_train','x_test','y_train','y_test')) and any(x in lower for x in ('index','disjoint','test_size','len(x_test)')):
        cue='Check the split size, row identities and X/y index alignment; the held-out rows must not also be training rows.'
    elif 'fig.' in lower or 'fig.axes' in lower:
        cue='Check both the returned values and the requested plot: the plotted rows and axes must match the data named in this task.'
    elif any(x in lower for x in ('mean_squared','root_mean','rmse','r2_score','f1_score','precision','recall','accuracy')):
        cue='Recalculate the named metric from the specified actual and predicted rows; keep its class order or original target units.'
    elif any(x in lower for x in ('pca.', 'components_', 'explained_variance_', 'cumulative')):
        cue='Check the fitted PCA components, retained dimensions and row order; component scores are not original columns.'
    elif any(x in lower for x in ('scaler.', 'imputer.', 'encoder.', 'transform(', 'statistics_', 'mean_')):
        cue='Check which rows fitted the preparation step and which rows were only transformed; preserve the learned schema.'
    elif any(x in lower for x in ('cv_results_', 'best_params_', 'test_score', 'search.')):
        cue='Read validation results from the requested training folds and candidate settings, rather than training fit or final-test rows.'
    elif any(x in lower for x in ('cluster_centers_', 'labels_', 'linkage_matrix', 'silhouette', 'inertia')):
        cue='Check the fitted grouping and align every label or profile with its original observation before summarising it.'
    elif any(x in lower for x in ('model.predict', 'model.coef_', 'model.intercept_', 'model.classes_', 'named_steps', 'network.')):
        cue='Use the supplied or fitted estimator, then check the requested attribute, prediction rows and output shape.'
    elif any(x in lower for x in ('answer.equals', 'x.equals', 'y.equals', 'list(answer.columns)', 'list(answer.index)')):
        cue='Match the requested dataframe or series values, column names and row index exactly.'
    elif any(x in lower for x in ('shape', 'len(answer)', 'isfinite', 'np.allclose', 'np.isclose')):
        cue='Check the returned shape and values against the stated inputs; keep the requested row and class order.'
    else:
        cue='Compare the returned values and labels with the exact evidence requested in the task.'
    return f'{first}. {cue}'

def py(task,solution,test,*,dataset=None,setup='',outputs=None,message=None):
    outputs=outputs or ['answer']
    if isinstance(test,str):
        tests=[dict(name='Requested evidence',test=test,message=message or evidence_feedback(task,test))]
    else:tests=copy.deepcopy(test)
    # Inspect the actual learner operations rather than requiring incidental
    # estimator aliases from the model solution. This also catches fitting a
    # correct estimator to a different population or inventing validation scores.
    bindings={}
    overrides={}
    imports={}
    for source in (setup,solution):
        for node in ast.walk(ast.parse(source)):
            if isinstance(node,ast.ImportFrom):
                imports.update({a.asname or a.name:a.name for a in node.names})
    def family(node,seen=()):
        if isinstance(node,ast.Name):
            if node.id in overrides:return overrides[node.id]
            if node.id in seen:return None
            return family(bindings.get(node.id),seen+(node.id,))
        if isinstance(node,ast.Call):
            if isinstance(node.func,ast.Attribute) and node.func.attr in ('fit','fit_transform'):return family(node.func.value,seen)
            if isinstance(node.func,ast.Name):
                name=imports.get(node.func.id,node.func.id)
                if name=='Pipeline' and node.args and isinstance(node.args[0],(ast.List,ast.Tuple)):
                    return family(node.args[0].elts[-1].elts[-1],seen)
                if name=='clone' and node.args:return family(node.args[0],seen)
                return name
        return None
    def assign_types(node):
        if isinstance(node,ast.Assign):
            for target in node.targets:
                if isinstance(target,ast.Name) and family(node.value):bindings[target.id]=node.value
    for node in ast.parse(setup).body:assign_types(node)
    fit_contracts=set()
    search_contracts=[]
    tree=ast.parse(solution)
    for statement in tree.body:
        for call in ast.walk(statement):
            if isinstance(call,ast.Call) and isinstance(call.func,ast.Attribute) and call.func.attr=='set_params' and isinstance(call.func.value,ast.Name):
                for setting in call.keywords:
                    if setting.arg=='model' and family(setting.value):overrides[call.func.value.id]=family(setting.value)
        for node in ast.walk(statement):
            if not isinstance(node,ast.Call) or not isinstance(node.func,ast.Attribute) or node.func.attr not in ('fit','fit_transform','fit_predict'):continue
            arguments=list(node.args)
            kwargs={k.arg:k.value for k in node.keywords}
            x=arguments[0] if arguments else kwargs.get('X')
            y=arguments[1] if len(arguments)>1 else kwargs.get('y')
            if x is None:continue
            if any(isinstance(call,ast.Call) and isinstance(call.func,ast.Attribute) and call.func.attr in ('fit','fit_transform','fit_predict')
                   for expression in (x,y) if expression is not None for call in ast.walk(expression)):continue
            # Loop-local variables are checked by the task-specific multi-fit
            # evidence. Do not leak those implementation names into the brief.
            loop_names={n.id for loop in ast.walk(statement) if isinstance(loop,ast.For) for n in ast.walk(loop.target) if isinstance(n,ast.Name)}
            if any(isinstance(n,ast.Name) and n.id in loop_names for expr in (x,y) if expr is not None for n in ast.walk(expr)):continue
            estimator=family(node.func.value)
            if estimator=='GridSearchCV':
                constructor=node.func.value
                if isinstance(constructor,ast.Name):constructor=bindings.get(constructor.id)
                if isinstance(constructor,ast.Call):
                    settings={k.arg:k.value for k in constructor.keywords}
                    grid=constructor.args[1] if len(constructor.args)>1 else settings.get('param_grid')
                    scoring=settings.get('scoring')
                    if grid is not None and scoring is not None and y is not None:
                        candidate=constructor.args[0] if constructor.args else settings.get('estimator')
                        cv=settings.get('cv')
                        if isinstance(cv,ast.Name):cv=bindings.get(cv.id)
                        design=None
                        if isinstance(cv,ast.Call) and isinstance(cv.func,ast.Name):
                            options={k.arg:ast.literal_eval(k.value) for k in cv.keywords}
                            design=dict(kind=imports.get(cv.func.id,cv.func.id),count=options.get('n_splits',ast.literal_eval(cv.args[0]) if cv.args else 5),shuffle=options.get('shuffle',False),seed=options.get('random_state'))
                        search_contracts.append((ast.unparse(x),ast.unparse(y),ast.unparse(grid),ast.unparse(scoring),family(candidate),design))
                continue
            expression='trace.fit_matches('+ast.unparse(x)+','+(ast.unparse(y) if y is not None else 'None')+','+repr(estimator)+')'
            if expression not in fit_contracts:
                fit_contracts.add(expression)
                tests.append(dict(name='Declared fitting population',test=expression,message='Fit the requested estimator or preparation to the declared input values and aligned target, preserving their feature order.'))
        assign_types(statement)
    # Compare prediction values with the observed call, without predicting or
    # fitting a second time during Check.
    for node in tree.body:
        if not isinstance(node,ast.Assign) or not any(isinstance(t,ast.Name) and t.id in outputs for t in node.targets):continue
        if ast.unparse(node.value) in ("search.cv_results_['mean_test_score']", "-search.cv_results_['mean_test_score']"):
            name=next(t.id for t in node.targets if isinstance(t,ast.Name) and t.id in outputs)
            positive=isinstance(node.value,ast.UnaryOp)
            if search_contracts:
                x,y,grid,scoring,candidate,design=search_contracts[-1]
                tests.append(dict(name='Reported validation scores',
                    test='trace.search_matches('+name+','+','.join((x,y,grid,scoring))+',positive='+str(positive)+',family='+repr(candidate)+',cv='+repr(design)+')',
                    message='Return the observed mean validation scores for the declared settings and scorer, in candidate order; fitting on other rows or substituting scores does not supply this evidence.'))
            else:
                tests.append(dict(name='Reported validation scores',test='np.allclose('+name+','+ast.unparse(node.value)+')',message='Return the mean validation scores from the fitted search, in its candidate order.'))
        if not isinstance(node.value,ast.Call) or not isinstance(node.value.func,ast.Attribute):continue
        if node.value.func.attr not in ('predict','predict_proba','decision_function'):continue
        if any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr in ('fit','fit_transform') for n in ast.walk(node.value)):continue
        name=next(t.id for t in node.targets if isinstance(t,ast.Name) and t.id in outputs)
        x=node.value.args[0] if node.value.args else next((k.value for k in node.value.keywords if k.arg=='X'),None)
        if x is None:continue
        tests.append(dict(name='Fitted prediction evidence',test='trace.prediction_matches('+name+','+ast.unparse(x)+','+repr(node.value.func.attr)+')',message='Return the requested predictions from the fitted estimator in the supplied row order. Equivalent estimator variable names and value containers are accepted.'))
    result=dict(kind='python',task=task,dataset=dataset,setup=setup,solution=solution.strip()+'\n',
        starter='# Write your Python here.\n',outputs=outputs,checks=tests,
        hints={},explanation='')
    if search_contracts:
        x,y,grid,scoring,candidate,design=search_contracts[-1]
        if design:
            folds=str(design['count'])+' '+design['kind']+' folds'
            if design['shuffle']:folds+=' with shuffle=True and random_state='+str(design['seed'])
            result['validationDesign']='Validation design: '+folds+' on '+x+' and '+y+', scoring='+scoring+'. Compare settings '+grid+' in candidate order.'
    return result

def decide(task,options,correct,explanation,evidence=None):
    return dict(kind='decision',task=task,options=options,correct=[correct] if isinstance(correct,int) else correct,
        evidence=evidence or '',solution=explanation,explanation=explanation,
        hints={})

def reflect(task,explanation,evidence=None):
    return dict(kind='reflection',task=task,evidence=evidence or '',solution=explanation,explanation=explanation,
        hints={})

def lesson(id,title,goal,explanation,syntax,visual,exercises,*,dataset='LINE24',chapter=0,example=None,models=()):
    CARDS[id]=dict(title=title,goal=goal,explanation=explanation,syntax=syntax,
        syntaxBreakdown=[],visual=dict(type=visual,caption=goal,id=id),exercises=exercises,
        dataset=dataset,chapter=chapter,example=example or next((e['solution'] for e in exercises if e['kind']=='python'),None),models=list(models))

def assemble():
    import lessons_foundations, lessons_models, lessons_discovery, workflows
    lessons_foundations.author();lessons_models.author();lessons_discovery.author()
    workflows.author_retrieval()
    manifest=json.loads((ROOT/'manifest.json').read_text())
    decks={d['key']:d for d in DECKS}
    cards=[]
    import mastery, transfer_practice, model_bridges
    for spec in manifest['cards']:
        if spec['id'] in mastery.IDS:continue
        assert spec['id'] in CARDS,'Missing card '+spec['id']
        content=copy.deepcopy(CARDS[spec['id']])
        if spec['kind']=='teaching':
            import syntax_parts
            syntax_parts.apply(content,spec['id'])
        transfer_practice.append(content,spec['id'])
        bridge_count=1 if spec['id'] in model_bridges.IDS else 0
        assert len(content['exercises'])+bridge_count==len(spec['exercises']),spec['id']
        deck=decks[spec['deck']]
        content.update(id='ML-'+spec['id'],deck=deck['id'],kind=spec['kind'],tier=spec['tier'],
                       prerequisites=['ML-'+d for d in spec['deps']],sources=SOURCES[deck['id']])
        content['chapter']=deck['chapters'][min(content['chapter'],len(deck['chapters'])-1)]
        n=len(content['exercises'])
        content['minutes']=('8–12' if n==2 else '12–18' if n==3 else '18–25') if spec['kind']=='teaching' else ('15–20' if spec['kind']=='review' else '25–35')
        for i,e in enumerate(content['exercises']):
            e['id']='ML-'+spec['exercises'][i];e.setdefault('version',1)
            if e['kind']=='python':
                e['dataset']=e.get('dataset') or content['dataset']
            e['label']=('Follow' if i==0 else 'Change' if i==1 else 'Transfer' if i==n-1 else 'Practise') if e['kind']=='python' and spec['kind']=='teaching' else ('Observe' if i==0 else 'Decide' if e['kind']=='decision' else 'Explain') if spec['kind']=='teaching' else 'Retrieval '+str(i+1)
        cards.append(content)
    challenges=workflows.challenges(manifest['challenges'])
    import editorial, python_path
    registry=model_bridges.extend(transfer_practice.enrich(mastery.extend(python_path.apply(editorial.apply(dict(version=1,baseline=manifest['baseline'],decks=DECKS,cards=cards,challenges=challenges,sources=SOURCES))))))
    for exercise in [e for c in registry['cards'] for e in c['exercises']]+[c['exercise'] for c in registry['challenges']]:
        if exercise['kind']=='python' and not exercise.get('assessment'):
            if exercise.get('validationDesign'):exercise['task']+=' '+exercise['validationDesign']
            if exercise.get('protect'):
                protection=exercise['protect']
                if protection.get('time'):
                    exercise['task']+=' Reserve the final 20% in chronological order for the final test.'
                else:
                    exercise['task']+=' Reserve 20% for the final test with random_state=42'+(', stratified by '+protection['target'] if protection.get('stratified') else '')+'.'
            workflow_contract(exercise)
    return registry

if __name__=='__main__':
    # Imported author modules use this same registry rather than a second __main__.
    import sys
    sys.modules['authoring']=sys.modules[__name__]
    print(json.dumps(assemble(),ensure_ascii=False))
