"""Faded complete workflows and open-choice readiness, extending the retained registry.

Unlike legacy TSV-authored cards these compact additions keep task, hints, rubric,
checks and workflow context together. Manifest IDs remain authoritative.
"""
import copy
import json
from pathlib import Path
from packages import required

IDS={'F11','F12','W15','W16','W-K2','W-K3'}
DATA={
 'LINE24':dict(target='duration',available=['distance'],classification=False,question='At dispatch, estimate a new delivery duration in minutes.',dictionary=[['distance','Route length in km, known at dispatch.'],['duration','Completed journey duration in minutes. This is the outcome.']],context='Independent deliveries from one stable service; no repeated driver or route identifiers are supplied.'),
 'CLASS180':dict(target='label',available=['length','width'],classification=True,question='Classify a new specimen from measurements available before its label is confirmed.',dictionary=[['length','Measured length, in micrometres.'],['width','Measured width, in millimetres.'],['label','Confirmed specimen class A, B or C.']],context='Independent specimens from a stable measurement process; the three classes have equal importance.'),
 'ENERGY72':dict(target='monthly_kwh',available=['area_m2','occupants'],classification=False,question='Before a household moves in, estimate its monthly electricity use.',dictionary=[['area_m2','Floor area in square metres, known before move-in.'],['occupants','Number of planned occupants, known before move-in.'],['monthly_kwh','Electricity consumed over the subsequent month.'],['end_month_bill','Invoice produced from that month’s electricity consumption; unavailable before move-in.']],context='One independent household per row in the same climate and tariff period. Large errors are costly for capacity planning.'),
 'SUPPORT120':dict(target='resolution',available=['queue_at_open','age_hours_at_open'],classification=True,question='When a ticket enters the support queue, flag whether it will miss its service deadline.',dictionary=[['queue_at_open','Number of waiting tickets at entry.'],['age_hours_at_open','Hours since customer submission at queue entry.'],['resolution','Later outcome: late or on_time.'],['closed_late_flag','Flag entered at closure, derived from the outcome.']],context='One independent ticket per row in a stable staffing period. Late tickets are a minority; missing them matters. A class-balanced score is more useful than raw accuracy.'),
 'REPAIR96':dict(target='repair_hours',available=['jobs_waiting','device_age_years'],classification=False,question='At repair intake, give a customer an estimate of the time until their repair is finished.',dictionary=[['ticket_id','Administrative identifier, assigned independently of the repair process.'],['jobs_waiting','Jobs already waiting at intake.'],['device_age_years','Device age in years, supplied at intake.'],['repair_hours','Elapsed hours from intake to completion.'],['invoice_labor_hours','Recorded on the completed repair invoice.']],context='One independent device per ticket, from a stable workshop period. No devices repeat and there is no time-order field. Either typical absolute error or stronger penalties for large errors can be defended.'),
 'SENSOR150':dict(target='next_week_state',available=['vibration_mm_s','temperature_c'],classification=True,question='At inspection, identify units likely to develop a fault during the following week so a technician can prioritise checks.',dictionary=[['unit_id','Administrative unit identifier with no predictive ordering. Each unit appears once.'],['vibration_mm_s','Vibration at inspection in mm/s.'],['temperature_c','Temperature at inspection in degrees Celsius.'],['next_week_state','State confirmed one week later: fault or normal.'],['replacement_authorized','Decision entered after the later fault assessment.']],context='Independent units inspected under one stable operating regime. Faults are uncommon; missing faults and unnecessary inspections both matter. This synthetic exercise does not establish deployment safety.'),
}
STEPS=[
 ('Question → X / y','Name the outcome and the inputs available when the prediction is needed. Later outcomes, identifiers and outcome-derived fields are not predictors.'),
 ('Split and protect','Reserve final rows before inspecting distributions or fitting. Independent rows permit a shuffled holdout; repeated entities or future forecasting need different designs.'),
 ('Explore training rows','Inspect only development rows to identify types, missingness and class balance.'),
 ('Prepare → model','Put learned preparation inside a Pipeline so each fold learns it afresh. A numeric linear model can pass the original units through.'),
 ('Baseline → validate','A dummy establishes what ignoring X achieves. Fit the candidate on matching training folds; these validation rows are not the final test.'),
 ('Choose → diagnose','Choose using training evidence, then inspect held-out training predictions. Simplify a model that fails to generalise; do not open the final test to choose.'),
 ('Final fit → predict → metric','Fix the recipe, fit all training rows, predict reserved rows once and calculate the declared metric from those saved predictions.'),
 ('Interpret and limit','Compare validation with the baseline and final evidence. State units or class error costs, uncertainty from the small sample, and the population to which the claim applies.'),
]
RUBRIC=[
 ('Frame and boundary','Name prediction time, observation, target and unavailable inputs. Choose a split that matches intended use.'),
 ('Preparation and baseline','Fit learned preparation inside each training fold. Compare the dummy on those same folds.'),
 ('Validation and selection','Choose from training-fold scores and error patterns. Explain any gap between training and validation.'),
 ('Metric and final test','Justify the metric and interpret the reserved-test result. Do not revise the recipe using that result.'),
 ('Interpretation and limits','Quote baseline, validation and final results. Explain error units or costs, one failure case and one limit; avoid causal claims.'),
]
CHECKS=[
 ('features','Question and available inputs','Critical boundary: choose the outcome requested by the question and only columns known at prediction time. Exclude outcome copies and identifiers; preserve original values and indices.'),
 ('split','Aligned reserved rows','Reserve 15–30% of rows, disjoint from training; together the partitions must contain every supplied row once. Keep X/y aligned and unchanged.'),
 ('boundary','Leakage prevention','Critical leakage: a fit used final rows, lost row provenance, or fitted preprocessing before cross-validation. Pass dataframes into a Pipeline; fit preparation separately within each fold.'),
 ('folds','Validation design','Use 3–5 matching shuffled training folds for these independent observations; use stratified folds for classification. Seeds may vary. Both holdout partitions need every class.'),
 ('metric','Metric choice','Choose negative RMSE or negative MAE for regression; macro F1 or balanced accuracy for imbalanced classification. Explain the trade-off in self-review.'),
 ('baseline','Observed dummy reference','Run cross_validate on a DummyRegressor or DummyClassifier using X_train, y_train, folds and the same metric. Report its actual test_score array, not invented values.'),
 ('validation','Observed candidate comparison','Evaluate each named Pipeline with cross_validate on the same training folds and metric. Return the actual results in cv_results. Supported simple families are listed in the brief.'),
 ('diagnosis','Training-only diagnosis','Use cross_val_predict for the chosen candidate on the same training folds. Preserve diagnostic_predictions, then explain a residual or class-error pattern without consulting final rows.'),
 ('selection','Selected training fit','chosen_name must name a validated candidate. final_model must use its unchanged recipe and be fitted on all training rows. Justify the choice from validation in self-review.'),
 ('final','Final-test discipline','Critical evaluation error: make one final prediction call after all selection, validation and fitting. Do not fit, tune, swap models or rerun CV after exposing final predictions.'),
 ('score','Metric from saved final predictions','Calculate final_score on aligned y_test and the unchanged final_predictions. Regression final errors are positive; classification scores use the declared averaging.'),
]

GUIDED_STEPS='''# 1. Frame the question: which columns exist when the prediction is made?
feature_names = ...
target = ...
X, y = df[feature_names], df[target]
# 2. Reserve final rows before exploring or fitting anything.
X_train, X_test, y_train, y_test = ...
# 3. Inspect development rows only.
print(X_train.describe())
# 4. Put preparation and a simple estimator in a Pipeline.
candidates = ...
folds = ...
metric = ...
# 5. Score a dummy and the candidate on the same training folds.
reference = ...
reference_results = cross_validate(reference, X_train, y_train, cv=folds, scoring=metric)
cv_results = ...
print('Reference validation:', reference_results['test_score'])
for name, result in cv_results.items():
    print(name, 'validation:', result['test_score'])
print('Best candidate minus dummy mean:', max(result['test_score'].mean() for result in cv_results.values()) - reference_results['test_score'].mean())
# 6. Choose from training evidence and inspect training-only errors.
chosen_name = ...
diagnostic_predictions = cross_val_predict(candidates[chosen_name], X_train, y_train, cv=folds)
print(pd.crosstab(y_train, diagnostic_predictions) if y.nunique() < 10 else pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions}))
# 7. Fix the recipe, fit all training rows, and open final evidence once.
final_model = clone(candidates[chosen_name]).fit(X_train, y_train)
final_predictions = ...
final_score = ...
print('Final metric:', final_score)
# 8. In the interpretation field, quote the dummy, validation and final evidence.
'''

def guided_starter(solution, classification):
    imports=solution.split('# 1. Question',1)[0].rstrip()
    if classification:
        imports=imports.replace('from sklearn.metrics import f1_score','from sklearn.metrics import f1_score, balanced_accuracy_score')
    else:
        imports=imports.replace('from sklearn.metrics import mean_squared_error','from sklearn.metrics import mean_squared_error, mean_absolute_error')
    guide=GUIDED_STEPS
    if classification:
        guide=guide.replace("print(pd.crosstab(y_train, diagnostic_predictions) if y.nunique() < 10 else pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions}))",'print(pd.crosstab(y_train, diagnostic_predictions))')
    else:
        guide=guide.replace("print(pd.crosstab(y_train, diagnostic_predictions) if y.nunique() < 10 else pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions}))","print(pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions, 'residual': y_train-diagnostic_predictions}))")
    return imports+'\n'+guide

def faded_starter(solution, dataset):
    d=DATA[dataset]
    replacements={
      f'feature_names = {d["available"]!r}':'feature_names = ...  # Which inputs exist at prediction time?',
      f'target = {d["target"]!r}':'target = ...  # Which later outcome answers the question?',
      'X, y = df[feature_names], df[target]':'X, y = ...  # Keep indexed features and outcome aligned.',
      'reference = '+('DummyClassifier(strategy="most_frequent")' if d['classification'] else 'DummyRegressor(strategy="mean")'):'reference = ...  # What does ignoring X achieve?',
      'final_predictions = final_model.predict(X_test)':'final_predictions = ...  # Predict reserved rows once.',
    }
    starter=solution
    for old,new in replacements.items():
        assert old in starter,(dataset,old)
        starter=starter.replace(old,new,1)
    metric_line=next(line for line in starter.splitlines() if line.startswith('metric = '))
    starter=starter.replace(metric_line,'metric = ...  # Choose the scoring string for this question.',1)
    final_line=next(line for line in starter.splitlines() if line.startswith('final_score = '))
    starter=starter.replace(final_line,'final_score = ...  # Use saved final predictions and the matching metric.',1)
    return starter

def workflow(dataset, *, metric=None, tree=False, compare=False):
    d=DATA[dataset];cls=d['classification'];target=d['target'];features=d['available']
    metric=metric or ('f1_macro' if cls else 'neg_root_mean_squared_error')
    model="LogisticRegression(max_iter=1000)" if cls else 'LinearRegression()'
    prep='StandardScaler()' if cls else "'passthrough'"
    if tree:model='DecisionTreeClassifier(max_depth=3, random_state=42)' if cls else 'DecisionTreeRegressor(max_depth=3, random_state=42)';prep="'passthrough'"
    candidates="{'simple': Pipeline([('prepare', "+prep+"), ('model', "+model+")])}"
    if compare:
        candidates="{'deep': Pipeline([('prepare', 'passthrough'), ('model', DecisionTreeRegressor(random_state=42))]), 'shallow': Pipeline([('prepare', 'passthrough'), ('model', DecisionTreeRegressor(max_depth=2, random_state=42))])}"
    code=f'''from sklearn.model_selection import train_test_split, KFold, StratifiedKFold, cross_validate, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.base import clone
from sklearn.metrics import mean_squared_error, mean_absolute_error, f1_score, balanced_accuracy_score
# 1. Question, features available now, and later outcome
feature_names = {features!r}
target = {target!r}
X, y = df[feature_names], df[target]
# 2. Protect the final test; split X and y together
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, random_state=42{', stratify=y' if cls else ''})
# 3. Inspect training rows only
print(X_train.describe())
# 4. Define preparation and the candidate; no fitting yet
candidates = {candidates}
folds = {'StratifiedKFold' if cls else 'KFold'}(n_splits=3, shuffle=True, random_state=42)
metric = {metric!r}
# 5. Compare a reference and candidates on matching training folds
reference = {'DummyClassifier(strategy="most_frequent")' if cls else 'DummyRegressor(strategy="mean")'}
reference_results = cross_validate(reference, X_train, y_train, cv=folds, scoring=metric)
cv_results = {{name: cross_validate(candidate, X_train, y_train, cv=folds, scoring=metric, return_train_score=True) for name, candidate in candidates.items()}}
print('Reference validation:', reference_results['test_score'])
print('Candidate validation:', {{name: result['test_score'] for name, result in cv_results.items()}})
# 6. Select using training evidence; inspect training-only errors
chosen_name = max(cv_results, key=lambda name: cv_results[name]['test_score'].mean())
diagnostic_predictions = cross_val_predict(candidates[chosen_name], X_train, y_train, cv=folds)
print(pd.crosstab(y_train, diagnostic_predictions) if {cls!r} else pd.DataFrame({{'actual': y_train, 'predicted': diagnostic_predictions, 'residual': y_train-diagnostic_predictions}}))
# 7. Fit the fixed recipe; predict the final rows once
final_model = clone(candidates[chosen_name]).fit(X_train, y_train)
final_predictions = final_model.predict(X_test)
final_score = {'f1_score(y_test, final_predictions, average="macro")' if metric=='f1_macro' else 'balanced_accuracy_score(y_test, final_predictions)' if metric=='balanced_accuracy' else 'mean_absolute_error(y_test, final_predictions)' if metric=='neg_mean_absolute_error' else 'np.sqrt(mean_squared_error(y_test, final_predictions))'}
print('Final metric:', final_score)
# 8. Explain the evidence and its limits in the self-review field
'''
    # Keep the first complete example readable: introduce only the estimator,
    # splitter and metric this particular workflow actually uses.
    code=code.replace('train_test_split, KFold, StratifiedKFold,', 'train_test_split, '+('StratifiedKFold' if cls else 'KFold')+',')
    code=code.replace('from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge\n', '' if tree or compare else 'from sklearn.linear_model import '+('LogisticRegression' if cls else 'LinearRegression')+'\n')
    code=code.replace('from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier\n', 'from sklearn.tree import '+('DecisionTreeClassifier' if cls else 'DecisionTreeRegressor')+'\n' if tree or compare else '')
    code=code.replace('from sklearn.preprocessing import StandardScaler\n','from sklearn.preprocessing import StandardScaler\n' if cls and not tree else '')
    code=code.replace('DummyRegressor, DummyClassifier', 'DummyClassifier' if cls else 'DummyRegressor')
    metric_function={'f1_macro':'f1_score','balanced_accuracy':'balanced_accuracy_score','neg_root_mean_squared_error':'mean_squared_error','neg_mean_absolute_error':'mean_absolute_error'}[metric]
    code=code.replace('mean_squared_error, mean_absolute_error, f1_score, balanced_accuracy_score',metric_function)
    if not compare:
        code=code.replace("cv_results = {name: cross_validate(candidate, X_train, y_train, cv=folds, scoring=metric, return_train_score=True) for name, candidate in candidates.items()}", "cv_results = {'simple': cross_validate(candidates['simple'], X_train, y_train, cv=folds, scoring=metric, return_train_score=True)}")
        code=code.replace("{name: result['test_score'] for name, result in cv_results.items()}","cv_results['simple']['test_score']")
        code=code.replace("chosen_name = max(cv_results, key=lambda name: cv_results[name]['test_score'].mean())", "chosen_name = 'simple'  # Sole candidate; report if it does not beat the dummy")
        code=code.replace("# 6. Select using training evidence; inspect training-only errors", "print('Candidate minus dummy mean:', cv_results['simple']['test_score'].mean() - reference_results['test_score'].mean())\n# 6. Assess the candidate with training evidence; inspect training-only errors")
    code=code.replace("pd.crosstab(y_train, diagnostic_predictions) if "+repr(cls)+" else pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions, 'residual': y_train-diagnostic_predictions})", "pd.crosstab(y_train, diagnostic_predictions)" if cls else "pd.DataFrame({'actual': y_train, 'predicted': diagnostic_predictions, 'residual': y_train-diagnostic_predictions})")
    return code


def exercise(dataset, task, *, metric=None, tree=False, compare=False, support='independent', bug=None):
    d=DATA[dataset];solution=workflow(dataset,metric=metric,tree=tree,compare=compare)
    e=dict(kind='python',dataset=dataset,task=task,solution=solution,setup='',outputs=['reference_results','cv_results','chosen_name','final_score'],
           assessment={k:d[k] for k in ['target','available','classification']}, dictionary=d['dictionary'],context=d['context'],question=d['question'],
           workflowSteps=[dict(title=t,question=q) for t,q in STEPS],rubric=[dict(title=t,description=v) for t,v in RUBRIC],
           checks=[dict(name=n,evidenceKey=k,test=f"workflow_evidence[{k!r}]",message=m,success='The observable evidence for this decision is consistent in this run.') for k,n,m in CHECKS]+[dict(name='Reasoning and interpretation',selfReview=True,message='Self-review, not automatically verified: '+ ' '.join(t+': '+v for t,v in RUBRIC))],
           hints=dict(think=d['question']+' Which fields exist at that moment?',tools='Use a dataframe/series pair, train_test_split, Pipeline, cross_validate and a dummy suited to '+('class labels.' if d['classification'] else 'a numeric outcome.'),approach='Keep final rows outside every fit. Compare matching training-fold evidence before predicting reserved rows in '+dataset+'.'),
           explanation=d['question']+' The reference ignores features. Training-fold evidence informs the choice, and the final metric describes only the reserved sample. Excluding later outcomes prevents answering the question with information unavailable at prediction time. The reasoning rubric needs human review.',
           starter='# Assemble your workflow here. Use the evidence names in the brief.\n',support=support)
    if support=='worked':e['starter']=solution
    if support=='partial':
        e['starter']=solution.replace(f'feature_names = {d["available"]!r}', 'feature_names = ...  # Choose inputs available at prediction time').replace('reference = '+('DummyClassifier(strategy="most_frequent")' if d['classification'] else 'DummyRegressor(strategy="mean")'),'reference = ...  # Choose a reference that ignores X').replace('final_predictions = final_model.predict(X_test)','final_predictions = ...  # Which rows have never informed selection?')
    if support=='partial_workflow':e['starter']=faded_starter(solution,dataset)
    if support=='guided':e['starter']=guided_starter(solution,d['classification'])
    if bug:e['bug']=bug
    e['contract']=[dict(name=n,description=v) for n,v in [
      ('target / feature_names','Your outcome column name and list of legitimate inputs. Choose from the data dictionary.'),
      ('X / y / X_train / X_test / y_train / y_test','Original indexed feature/target data and aligned partitions. A 15–30% holdout is supported; choose and justify its seed/design.'),
      ('folds / metric','A 3–5-fold shuffled KFold or StratifiedKFold object; metric is an sklearn scoring name. Regression: neg_root_mean_squared_error or neg_mean_absolute_error. Classification: f1_macro or balanced_accuracy.'),
      ('reference / reference_results','Dummy estimator and its actual cross_validate result.'),
      ('candidates / cv_results','Named Pipelines and matching cross_validate result dictionaries. Regression supports LinearRegression, Ridge and DecisionTreeRegressor; classification supports LogisticRegression, DecisionTreeClassifier, KNeighborsClassifier, GaussianNB, LinearDiscriminantAnalysis, SVC and MLPClassifier.'),
      ('diagnostic_predictions','Actual cross_val_predict outputs for the chosen candidate on training folds; inspect residuals or a confusion table.'),
      ('chosen_name / final_model','Name of your chosen validated candidate and a clone fitted on all training rows. Defend the choice, including any simplicity trade-off.'),
      ('final_predictions / final_score','One saved final prediction array and its final metric. Positive error units for regression. No further selection after this call.')]]
    return e


def extend(registry):
    cards=[]
    reg=[
      exercise('LINE24','Before Run, predict whether a line should beat a constant duration. Run and inspect every step. Locate the training-only scores and final error. Explain the difference in minutes and why distance is available at dispatch.',support='worked'),
      exercise('LINE24','Rebuild the question, X/y, reference, scoring and final calculation. Change to MAE: it weights each minute of error equally rather than emphasizing large misses. Predict how this changes the meaning of the score, then justify your choices.',metric='neg_mean_absolute_error',support='partial_workflow'),
      exercise('ENERGY72','Use the eight-step Python outline to build a complete workflow for a household before move-in. Choose legitimate inputs and an error criterion. Explain why the monthly invoice cannot be used, and whether delivery-model assumptions carry over to household electricity use.',support='guided')]
    cls=[
      exercise('CLASS180','Predict the performance of an always-majority classifier on three balanced classes. Run the full workflow. Explain why scaling is learned inside each fold, and interpret the training-only confusion table before reading the final macro F1.',support='worked'),
      exercise('CLASS180','Rebuild the question, X/y, reference, scoring and final calculation using balanced accuracy. Explain how averaging per-class recall changes the question from macro F1. Identify which class the training-only predictions most often miss.',metric='balanced_accuracy',support='partial_workflow'),
      exercise('SUPPORT120','Use the eight-step Python outline to build an intake-time late-ticket classifier. Explain the cost of missed late tickets and false alerts, exclude closure information, and defend your model and class-balanced metric.',support='guided')]
    leak=[
      exercise('ENERGY72','Inspect the faulty feature choice below. Before running the repaired example, name when the bill becomes available and explain why its attractive validation score would be misleading. Run the legal workflow and compare with its dummy.',support='worked',bug="feature_names = ['area_m2', 'end_month_bill']  # Why is this not an intake-time prediction?"),
      exercise('CLASS180','Repair preprocessing fitted before cross-validation. Put the scaler inside the candidate Pipeline, keep the final test untouched, and explain why scaling all training rows still leaks into each validation fold.',support='partial',bug='scaled = StandardScaler().fit_transform(X_train)\n# cross_validate(LogisticRegression(), scaled, y_train, ...)'),
      exercise('SUPPORT120','A colleague compares three final-test scores and picks the largest. Repair the entire selection workflow on this new ticket question. Explain why the old test score is now exploratory and why a genuinely new test sample is needed for that colleague’s final claim.',bug='for candidate in candidates.values():\n    candidate.fit(X_train, y_train)\n    print(candidate.score(X_test, y_test))\n# Choose the largest test score?')]
    diagnosis=[
      exercise('SUPPORT120','An always-on-time model can have high accuracy while finding no late tickets. Run the repaired macro-F1 workflow, inspect class-specific errors and the dummy, and explain which mistakes accuracy hid.',support='worked',bug="predictions = ['on_time'] * len(y_test)\n# High accuracy means useful late-ticket detection?"),
      exercise('ENERGY72','Complete the two-tree workflow. Compare return_train_score with held-out training-fold scores. Explain why a deep tree can fit training households closely yet lose on validation. Choose using validation, not training or final-test scores.',support='partial',compare=True,bug="chosen_name = max(cv_results, key=lambda name: cv_results[name]['train_score'].mean())"),
      exercise('SUPPORT120','Transfer the diagnosis to rare late tickets. Try a small classification tree and a suitable class-balanced metric. Use training-only predictions to describe a failure case, compare the dummy, and explain whether a different error cost could change the preferred model.',tree=True)]
    definitions=[
      ('F11','foundations','Your first complete regression workflow','Connect the steps from a delivery question to an honest error estimate.', 'Use the numbered comments as an eight-step route through one worked Python script. A dummy is a reference that ignores the features. A fold holds out part of the training rows while a fresh copy fits the rest. Compare the sole candidate with the dummy and say if it has not earned an improvement claim. The final test remains untouched until the recipe is fixed.', 'Read a Pipeline, compare matching training folds and report final error in minutes.',reg,'First complete workflows',['ML-F10'],'simple_linear'),
      ('F12','foundations','Your first complete classification workflow','Reuse the workflow to predict labels and inspect class errors.', 'Reuse the same eight steps for class labels. The scaler is inside the Pipeline, so each training fold learns its own scale. Macro F1 averages one precision-and-recall score per class; balanced accuracy averages each class’s recall. Compare the classifier with a majority-class dummy before claiming useful improvement.', 'Reuse a Pipeline with a classifier and choose an sklearn scoring string.',cls,'First complete workflows',['ML-F11','ML-F09'],'logistic'),
      ('W15','workflow','Repair a leaking workflow','Find the point where unavailable information enters a prediction.', 'Leakage can enter through a column, a preprocessing fit or repeated use of the final test. Find the boundary violation, explain its optimistic consequence, then repair the actual Python. Re-running on the same exposed test does not create new independent evidence.', 'Move feature selection and fitted transformations to the correct data boundary.',leak,'Debug and demonstrate readiness',['ML-W13','ML-F12'],None),
      ('W16','workflow','When a good score is misleading','Choose validation evidence that answers the actual question.', 'Training error measures fit to known examples. Raw accuracy can hide a rare class. A useful model needs evidence on held-away training folds, a relevant metric and a baseline. The simplest adequate model can be preferable to a complex one.', 'Compare train_score and test_score arrays returned by cross_validate.',diagnosis,'Debug and demonstrate readiness',['ML-W15'],None),
    ]
    for id,deck,title,goal,explanation,skill,exercises,chapter,deps,model in definitions:
        syntax="Pipeline([('prepare', preparation), ('model', estimator)])\ncross_validate(candidate, X_train, y_train, cv=folds, scoring=metric)\ncross_val_predict(candidate, X_train, y_train, cv=folds)\nclone(candidate).fit(X_train, y_train)\nvalidation['test_score']\n"+('neg_root_mean_squared_error\nneg_mean_absolute_error' if id=='F11' else 'f1_macro\nbalanced_accuracy')
        parts=[dict(code='Pipeline',meaning='Keeps preparation with the model, so each fold learns fitted settings only from its training rows.'),dict(code='cross_validate',meaning='Fits fresh copies on training folds and returns their validation scores.'),dict(code='cross_val_predict',meaning='Makes one held-out training prediction per row for diagnosis; use cross_validate for the validation score.'),dict(code='clone(candidate).fit(X_train, y_train)',meaning='Starts an unfitted copy of the selected recipe and fits all development rows after selection.'),dict(code='test_score',meaning='Validation-fold scores inside cross_validate, despite the word test; the reserved final test is separate.')]
        if id=='F11':parts.append(dict(code='neg_root_mean_squared_error',meaning='scikit-learn makes larger scores better: a value nearer zero means a smaller RMSE. Report final error as a positive number of minutes.'))
        if id=='F11':parts.append(dict(code='neg_mean_absolute_error',meaning='A value nearer zero means fewer minutes of absolute error on average. Report final MAE as a positive number of minutes.'))
        if id=='F12':parts.append(dict(code='f1_macro',meaning='Computes F1 for each class, then averages them equally; balanced_accuracy instead averages class recall.'))
        if id=='F12':parts.append(dict(code='balanced_accuracy',meaning='Averages recall across classes, giving uncommon classes the same weight as common ones.'))
        cards.append(dict(id='ML-'+id,deck=deck,kind='teaching',tier='core',title=title,goal=goal,explanation=explanation,pythonSkill=skill,syntax=syntax,syntaxBreakdown=parts,example=exercises[0]['solution'],visual=dict(type='workflow',id=id,caption=goal),chapter=chapter,prerequisites=deps,models=[model] if model else [],exercises=exercises,minutes='25–40'))
    for id,dataset,task in [('W-K2','REPAIR96','Independently estimate a new repair’s completion time at intake.'),('W-K3','SENSOR150','Independently prioritise units that may develop a fault next week.')]:
        e=exercise(dataset,task+' Choose and justify the target, available features, split, metric and simple candidate(s). Build the workflow without viewing the solution first. Use actual numbers to explain baseline, validation, final result and limitations. The rubric is visible; reasoning requires self-review or lecturer review.')
        e['readiness']=True
        cards.append(dict(id='ML-'+id,deck='workflow',kind='checkpoint',tier='core',title='Readiness · '+('unfamiliar regression' if id=='W-K2' else 'unfamiliar classification'),goal=task,explanation=DATA[dataset]['question']+' Use the dictionary to frame a prediction claim. This dataset has not appeared in the teaching path. A working script is only one part of readiness: each decision also needs an evidence-based explanation.',pythonSkill='Assemble and explain an indexed pandas → scikit-learn workflow independently.',syntax='# Independently select and combine the APIs you have practised.',visual=dict(type='workflow',id=id,caption='Available now → training-only decisions → one final evaluation'),chapter='Debug and demonstrate readiness',prerequisites=['ML-W16','ML-W-K1'],models=[],exercises=[e],minutes='35–50'))
    manifest=json.loads((Path(__file__).parent/'manifest.json').read_text())
    for card in cards:
        spec=next(s for s in manifest['cards'] if 'ML-'+s['id']==card['id'])
        assert len(card['exercises'])==len(spec['exercises'])
        card['sources']=registry['sources'][card['deck']]
        for i,e in enumerate(card['exercises']):
            e.update(id='ML-'+spec['exercises'][i],version=2 if card['id'] in ('ML-F11','ML-F12') else 1,label=('Follow' if i==0 else 'Change' if i==1 else 'Transfer') if card['kind']=='teaching' else 'Readiness',demand={'worked':'Run, predict and explain','partial':'Complete and justify','partial_workflow':'Rebuild key steps and justify','guided':'Build from the eight-step outline','independent':'Build and explain independently'}[e['support']])
            e['hints']['think']=e['task']+' '+e['hints']['think']
            e['visual']=dict(type='workflow' if not e.get('bug') else 'split' if card['id']=='ML-W15' else 'comparison',id=card['id'].removeprefix('ML-')+'-'+str(i+1),caption=e['question'])
            if e['id']=='ML-W15-2':
                e['starter']=e['solution'].replace('reference = DummyClassifier', 'scaled = StandardScaler().fit_transform(X_train)  # Repair this boundary violation\nreference = DummyClassifier').replace("('prepare', StandardScaler())", "('prepare', 'passthrough')")
            e['packages']=required(e)
        registry['cards'].append(card)
    from model_guides import apply
    return apply(registry)
