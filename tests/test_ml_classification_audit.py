"""Reference, scientific-equivalent and targeted negative checks for owned decks."""
import copy,hashlib,json,os,subprocess,sys,types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
(ROOT/'work/audit').mkdir(parents=True,exist_ok=True)
os.environ.setdefault('MPLCONFIGDIR',str(ROOT/'work/audit/mpl'))
os.environ.setdefault('XDG_CACHE_HOME',str(ROOT/'work/audit/cache'))
sys.path.insert(0,str(ROOT/'ml-learning'))
import authoring
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
ns={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
registry=authoring.assemble()
cards=[c for c in registry['cards'] if c['deck'] in ('classification','networks')]
activities={e['id']:e for c in cards for e in c['exercises']}
rows=[];failures=[];alternatives={}
def case(id,code,label,accept=True):
 receipt=ns['run_learning']({'exercise':activities[id],'code':code})
 passed=not receipt['error'] and all(c['status'] in ('correct','self-review') for c in receipt['checks'])
 row=dict(id=id,label=label,expected='accept' if accept else 'reject',observed='accept' if passed else 'reject',passed=passed==accept,error=receipt['error'],checks=receipt['checks'],retained=receipt['retainedPythonObjects'],warnings=receipt.get('warnings',[]));rows.append(row)
 if passed!=accept or receipt['retainedPythonObjects']:failures.append(row)
 print(('PASS' if row['passed'] else 'FAIL'),id,label,flush=True)
for id,e in activities.items():
 if e['kind']=='python':case(id,e['solution'],'reference')
 elif e['kind']=='decision':
  assert e['options'] and e['correct'] and all(0<=i<len(e['options']) for i in e['correct'])
  assert e['solution'] and e['explanation']
 else:assert e['kind']=='reflection' and e['solution']
# Equivalent implementations are separately authored, not a renamed result alone.
eq={
 'ML-C01-3':"answer=pd.crosstab(df.actual,df.predicted).reindex(index=['A','B','C'],columns=['A','B','C'],fill_value=0).to_numpy()",
 'ML-C05-1':activities['ML-C05-1']['solution'].replace("('scale',","('normalise',").replace("('model',","('classifier',"),
 'ML-C08-1':activities['ML-C08-1']['solution'].replace('model=','neighbours=').replace('model.kneighbors','neighbours.kneighbors')+'\nmodel=neighbours\n',
 'ML-C08-2':activities['ML-C08-2']['solution'].replace('model=Pipeline','candidate=Pipeline').replace('model.predict','candidate.predict').replace('model.named_steps','candidate.named_steps').replace('model.classes_','candidate.classes_').replace("('scale',","('normalise',").replace("('model',","('classifier',").replace("named_steps['scale']","named_steps['normalise']").replace("named_steps['model']","named_steps['classifier']").replace('query=','probe=').replace('.transform(query)','.transform(probe)').replace('vote_counts=y_train.iloc[positions].value_counts().reindex(candidate.classes_,fill_value=0)',"vote_counts=pd.Series({label:int((y_train.iloc[positions]==label).sum()) for label in reversed(candidate.classes_)})"),
 'ML-C09-1':activities['ML-C09-1']['solution'].replace("('scale',","('normalise',").replace("('model',","('classifier',").replace('model__n_neighbors','classifier__n_neighbors'),
 'ML-C11-1':"model.steps[0]=('normalise',model.steps[0][1])\nmodel.steps[-1]=('classifier',model.steps[-1][1])\n"+activities['ML-C11-1']['solution'].replace('model__C','classifier__C'),
 'ML-C14-1':activities['ML-C14-1']['solution'].replace('leaf=int(model.apply(X_test.iloc[:1])[0])','leaf=model.apply(X_test.iloc[[0]]).item()'),
 'ML-C16-1':activities['ML-C16-1']['solution'].replace('from sklearn.naive_bayes import BernoulliNB','from sklearn.naive_bayes import BernoulliNB as FlagClassifier').replace('model=BernoulliNB()','model=FlagClassifier()').replace("model=FlagClassifier().fit","flags=list(reversed(flags))\nmodel=FlagClassifier().fit"),
 'ML-C16-3':activities['ML-C16-3']['solution'].replace("('encode',","('indicators',").replace("('model',","('classifier',").replace('model=Pipeline','columns=list(reversed(columns))\nmodel=Pipeline'),
 'ML-C17-3':"endpoint_scores=list(model.decision_function(probe))\nmidpoint=pd.DataFrame([np.mean(probe.to_numpy(),axis=0)],columns=probe.columns)\nmidpoint_score=model.decision_function(midpoint).item()\ngap=midpoint_score-sum(endpoint_scores)/len(endpoint_scores)",
 'ML-C19-1':activities['ML-C19-1']['solution'].replace("df['label'].value_counts()","df['label'].value_counts().sort_index(ascending=False)").replace("answer = class_a.cov()","answer=pd.DataFrame(np.cov(class_a.to_numpy(),rowvar=False,ddof=1),index=class_a.columns,columns=class_a.columns)"),
 'ML-N04-1':activities['ML-N04-1']['solution'].replace("answer=model.named_steps['model'].transformer_.mean_","answer=model.named_steps['model'].transformer_.mean_.tolist()"),
 'ML-N04-2':activities['ML-N04-2']['solution'].replace('answer=model.predict(X_test)','answer=model.predict(X_test).tolist()'),
 'ML-C18-1':activities['ML-C18-1']['solution'].replace('reg_param=.1','reg_param=.2'),
 'ML-N04-3':activities['ML-N04-3']['solution'].replace('answer=-search.cv_results_', 'answer=np.negative(search.cv_results_').replace("['mean_test_score']","['mean_test_score'])"),
 'ML-N04-4':activities['ML-N04-4']['solution'].replace('answer=root_mean_squared_error(y_test,predictions)','answer=float(np.sqrt(np.mean((np.asarray(y_test)-np.asarray(predictions))**2)))'),
 'ML-C-R1-1':"from sklearn.metrics import f1_score,accuracy_score\nlabels=['clear','inspect','urgent']\nscores=pd.DataFrame(index=['predicted','alternative'],columns=labels+['macro_f1','accuracy'],dtype=float)\nfor p in scores.index:\n    for label in labels:\n        scores.loc[p,label]=f1_score(df.actual.eq(label),df[p].eq(label),zero_division=0)\n    scores.loc[p,'macro_f1']=scores.loc[p,labels].mean()\n    scores.loc[p,'accuracy']=np.mean(df.actual==df[p])\nchosen_policy=max(scores.index,key=lambda p:scores.loc[p,'macro_f1'])",
 'ML-C-R1-2':"values=model.predict_proba(X_test)\nanswer=pd.DataFrame(dict(zip(model.classes_,values.T)),index=X_test.index)\npredicted=answer.idxmax(axis=1).to_numpy()",
 'ML-C-R1-3':"from sklearn.model_selection import cross_validate as validate\nfrom sklearn.dummy import DummyClassifier as Majority\nreference=Majority(strategy='most_frequent')\nanswer=validate(reference,X_train,y_train,cv=folds,scoring='f1_macro')['test_score'].tolist()\npaired_gain=np.asarray(candidate_scores)-np.asarray(answer)",
 'ML-C-R2-3':activities['ML-C-R2-3']['solution'].replace("('prepare',","('roles',").replace("('model',","('rule',").replace("named_steps['prepare']","named_steps['roles']").replace("named_steps['model']","named_steps['rule']"),
 'ML-C-K1-1':activities['ML-C-K1-1']['solution'].replace("ablation_results=cross_validate(measurement_model,X_train[measurement_columns],y_train,cv=folds,scoring='f1_macro')","ablation_results=cross_validate(measurement_model,X_train.loc[:,measurement_columns],y_train,cv=folds,scoring='f1_macro')").replace("('scale',StandardScaler())","('normalise',StandardScaler())").replace("measurement_model=Pipeline","measurement_columns=list(reversed(measurement_columns))\nmeasurement_model=Pipeline"),
}
for id,code in eq.items():
 case(id,code,'scientific equivalent')
 alternatives[id]=dict(label='scientific equivalent',code=code)
negative={
 'ML-C01-3':[("answer=__import__('sklearn.metrics',fromlist=['confusion_matrix']).confusion_matrix(df.actual,df.predicted,labels=['A','B'])",'drop actual C cases')],
 'ML-C05-1':[(activities['ML-C05-1']['solution'].replace("('scale',StandardScaler())","('scale','passthrough')"),'omit requested scaling')],
 'ML-C08-1':[(activities['ML-C08-1']['solution'].replace('n_neighbors=3','n_neighbors=5').replace('return_distance=False','n_neighbors=3,return_distance=False'),'fit five-neighbour configuration but retrieve three')],
 'ML-C08-2':[(activities['ML-C08-2']['solution'].replace('n_neighbors=5','n_neighbors=3'),'three neighbours instead of five'),(activities['ML-C08-2']['solution'].replace("('scale',StandardScaler())","('scale','passthrough')"),'unscaled neighbourhood')],
 'ML-C09-1':[(activities['ML-C09-1']['solution'].replace("('scale',StandardScaler())","('scale','passthrough')"),'unscaled validation recipe')],
 'ML-C11-1':[("model.set_params(scale='passthrough')\n"+activities['ML-C11-1']['solution'],'unscaled SVM validation')],
 'ML-C14-1':[(activities['ML-C14-1']['solution'].replace('max_depth=3','max_depth=1'),'different requested maximum depth')],
 'ML-C16-1':[(activities['ML-C16-1']['solution'].replace("'pluribus']","'pluribus','winpercent']"),'include source defining target')],
 'ML-C16-3':[(activities['ML-C16-3']['solution'].replace("'safety']","'safety','acceptability']"),'encode target as predictor')],
 'ML-C17-3':[(activities['ML-C17-3']['solution'].replace('decision_function','predict_proba'),'probabilities substituted for affine LDA scores'),(activities['ML-C17-3']['solution']+'\ngap=1.0\n','fabricated nonzero affine gap'),('from sklearn.linear_model import LogisticRegression\nmodel=LogisticRegression().fit(X_train,y_train)\n'+activities['ML-C17-3']['solution'],'wrong model family'),('model.fit(X_test,y_test)\n'+activities['ML-C17-3']['solution'],'refit supplied LDA on held-away rows')],
 'ML-C19-1':[(activities['ML-C19-1']['solution'].replace('answer = class_a.cov()',"answer=df[['length','width']].cov()"),'full-population covariance rather than class A')],
 'ML-N04-1':[("from sklearn.dummy import DummyRegressor\nmodel.set_params(model__regressor=DummyRegressor())\n"+activities['ML-N04-1']['solution'],'dummy inside neural target wrapper')],
 'ML-N04-2':[("model.set_params(scale='passthrough')\n"+activities['ML-N04-2']['solution'],'omit neural feature scaling')],
 'ML-C18-1':[(activities['ML-C18-1']['solution'].replace('reg_param=.1','reg_param=0.'),'remove requested covariance regularisation')],
 'ML-N04-3':[(activities['ML-N04-3']['solution'].replace('answer=-search','answer=search'),'negative scorer scores reported as positive RMSE'),("from sklearn.dummy import DummyRegressor\nmodel.set_params(model__regressor=DummyRegressor())\n"+activities['ML-N04-3']['solution'],'search dummy inside neural wrapper')],
 'ML-N04-4':[(activities['ML-N04-4']['solution'].replace('predictions=model.predict(X_test)','predictions=np.zeros(len(X_test))'),'fabricated predictions with recomputed RMSE'),(activities['ML-N04-4']['starter'],'mixed target-unit starter bug'),("from sklearn.dummy import DummyRegressor\nmodel.set_params(model__regressor=DummyRegressor())\n"+activities['ML-N04-4']['solution'],'dummy inside neural target wrapper')],
 'ML-C-R1-1':[(activities['ML-C-R1-1']['solution'].replace("average='macro'","average='weighted'"),'weighted F1 substituted for equal-class average'),(activities['ML-C-R1-1']['solution']+"\nchosen_policy='predicted'\n",'equal accuracy used to select minority-blind policy')],
 'ML-C-R1-2':[(activities['ML-C-R1-2']['solution'].replace('columns=model.classes_','columns=np.roll(model.classes_,1)'),'rotated probability class labels'),(activities['ML-C-R1-2']['solution'].replace('index=X_test.index,',''),'dropped observation identities'),('model.fit(X,y)\n'+activities['ML-C-R1-2']['solution'],'refit supplied classifier on full population')],
 'ML-C-R1-3':[(activities['ML-C-R1-3']['solution'].replace("scoring='f1_macro'","scoring='accuracy'"),'reference uses a different scorer'),(activities['ML-C-R1-3']['solution'].replace("strategy='most_frequent'","strategy='stratified',random_state=42"),'random reference instead of majority reference')],
 'ML-C-R2-3':[(activities['ML-C-R2-3']['solution'].replace("numeric_features=['distance'],categorical_features=['fragile','service_code']","numeric_features=['distance','service_code'],categorical_features=['fragile']"),'integer category treated as numeric intervals'),(activities['ML-C-R2-3']['solution']+"\nselected_feature='distance'\n",'wrong selected-rule feature name')],
 'ML-C-K1-1':[(activities['ML-C-K1-1']['solution'].replace("ablation_results=cross_validate(measurement_model,X_train[measurement_columns],y_train,cv=folds,scoring='f1_macro')","ablation_results={'test_score':np.zeros(5)}"),'fabricated ablation fold scores'),(activities['ML-C-K1-1']['solution'].replace("C=chosen.named_steps['model'].C,max_iter","C=chosen.named_steps['model'].C*10,max_iter"),'ablation changes regularisation along with context')],
}
for id,mutations in negative.items():
 for code,label in mutations:case(id,code,label,False)
# Fixture evidence proves answer-discriminating changes, not merely new labels.
from sklearn.metrics import confusion_matrix,f1_score,accuracy_score
f=ns['learning_fixture']
assert (f('ERROR15').actual=='C').sum()==4 and not (f('ERROR15').predicted=='C').any()
d=f('ERROR12_REVIEW')
assert accuracy_score(d.actual,d.predicted)==accuracy_score(d.actual,d.alternative)
assert abs(f1_score(d.actual,d.predicted,average='macro')-f1_score(d.actual,d.alternative,average='macro'))>.15
assert not f('RULE24_REVIEW').equals(f('RULE24'))
assert len(f('MATERIAL96').material.value_counts().unique())==3
assert f('MATERIAL96').index.min()!=0
fixture_evidence=dict(error15_matrix=confusion_matrix(f('ERROR15').actual,f('ERROR15').predicted,labels=['A','B','C']).tolist(),review_policy_metrics={p:dict(macro_f1=f1_score(d.actual,d[p],average='macro'),accuracy=accuracy_score(d.actual,d[p])) for p in ['predicted','alternative']},stock_check_counts=f('RULE24_REVIEW').label.value_counts().to_dict(),material_class_counts=f('MATERIAL96').material.value_counts().to_dict())
import sklearn,numpy,pandas
result=dict(python=sys.version,versions=dict(sklearn=sklearn.__version__,numpy=numpy.__version__,pandas=pandas.__version__),cards=len(cards),exercises=len(activities),references=sum(e['kind']=='python' for e in activities.values()),cases=len(rows),failures=failures,rows=rows,fixture_evidence=fixture_evidence,source_sha256={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['ml-learning/audit_repair_classification.py','ml-learning/runtime.py','ml-learning/fixtures.py']})
(ROOT/'work/audit/ml-classification-focused-evidence.json').write_text(json.dumps(result,indent=2))
(ROOT/'work/audit/ml-classification-alternatives.json').write_text(json.dumps(alternatives,indent=2))
(ROOT/'work/audit/ml-classification-final.json').write_text(json.dumps(cards,indent=2))
assert not failures,json.dumps(failures,indent=2)
print(json.dumps({k:v for k,v in result.items() if k not in ('rows','failures')},indent=2))

