"""Meaningful wrong workflows and scientifically equivalent alternatives."""
import json
import subprocess
import sys
import types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
registry=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')],cwd=ROOT))
ns={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
activities={e['id']:e for c in registry['cards'] for e in c['exercises'] if e['kind']=='python'}
activities.update({c['id']:c['exercise'] for c in registry['challenges']})
def run(id,code):
    result=ns['run_learning']({'exercise':activities[id],'code':code})
    assert result['retainedPythonObjects']==0
    return result
def rejected(id,code,label):
    r=run(id,code)
    assert r['error'] or any(c['status'] in ('needs-attention','unavailable') for c in r['checks']),label
    print('Rejected:',label,flush=True)
def accepted(id,code,label):
    r=run(id,code)
    assert not r['error'],(label,r['error'])
    assert all(c['status'] in ('correct','self-review') for c in r['checks']),(label,r['checks'])
    print('Accepted:',label,flush=True)
linear=activities['ML-W-K1-1']['solution']
rejected('ML-W-K1-1',linear.replace('prepare = ColumnTransformer',"y_train=pd.Series(np.roll(y_train.to_numpy(),1),index=y_train.index)\nprepare = ColumnTransformer"),'misaligned training targets')
rejected('ML-W-K1-1',linear.replace('model = Pipeline',"leaking=StandardScaler().fit(X[['distance','weight']])\nmodel = Pipeline"),'fitting preprocessing before the split boundary')
rejected('ML-W-K1-1',linear.replace('model = Pipeline',"leaking=StandardScaler().fit(X_train[['distance','weight']])\nmodel = Pipeline"),'fitting preparation once before cross-validation')
rejected('ML-W-K1-1',linear.replace('folds = KFold(n_splits=5, shuffle=True, random_state=42)','folds = KFold(n_splits=5, shuffle=True, random_state=43)'),'inconsistent fold contract')
rejected('ML-W-K1-1',linear.replace('final_rmse = root_mean_squared_error(y_test, final_predictions)','final_predictions=final_predictions+5\nfinal_rmse = root_mean_squared_error(y_test, final_predictions)'),'altered predictions with recomputed metrics')
rejected('ML-W-K1-1',linear+"\nextra=cross_validate(model,X_train,y_train,cv=folds,scoring='neg_root_mean_squared_error')",'validation after opening final-test evidence')
def discipline(code,label):
    r=run('ML-W-K1-1',code)
    assert not r['error'],(label,r['error'])
    check=next(c for c in r['checks'] if c['name']=='Final-test discipline')
    assert check['status']=='needs-attention',(label,check)
    print('Rejected untouched-final confirmation:',label,flush=True)
discipline(linear+"\nother=clone(model).fit(X_train,y_train)\nfinal_predictions=other.predict(X_test)",'ordinary candidate fit between final predictions')
discipline(linear+"\nextra=StandardScaler().fit_transform(X_train[['distance','weight']])\nfinal_predictions=final_model.predict(X_test)",'preparation fit_transform after exposure')
discipline(linear+"\nother=clone(model)\nother.set_params(model__fit_intercept=False)\nfinal_predictions=final_model.predict(X_test)",'parameter selection after exposure')
discipline(linear+"\nmodel=clone(model)\nfinal_predictions=final_model.predict(X_test)",'candidate replacement after exposure')
discipline(linear.replace('final_predictions = final_model.predict(X_test)',"other=clone(model).fit(X_train,y_train)\nfinal_predictions = final_model.predict(X_test)")+"\nfinal_predictions=other.predict(X_test)",'switching to an already fitted candidate after exposure')
discipline(linear+"\nextra_search=GridSearchCV(model,{'model__fit_intercept':[True,False]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nfinal_predictions=final_model.predict(X_test)",'new search after final exposure')
accepted('ML-W-K1-1',linear+"\nextra_mae=float(np.abs(y_test-final_predictions).mean())\nreport=pd.DataFrame({'actual':y_test,'predicted':final_predictions})\nreport.to_csv('final-report.csv',index=False)",'additional metrics and reporting from saved final predictions')
accepted('ML-W-K1-1',linear.replace('final_rmse = root_mean_squared_error(y_test, final_predictions)','final_rmse = float(np.sqrt(np.mean((np.asarray(y_test)-final_predictions)**2)))'),'equivalent RMSE calculation')
rejected('ML-X04',activities['ML-X04']['solution'].replace('folds=TimeSeriesSplit(n_splits=5)','folds=KFold(n_splits=5,shuffle=True,random_state=42)'),'shuffled chronological validation')
rejected('ML-X12',activities['ML-X12']['solution'].replace("X=df[","df['popular_copy']=df['popular']\nX=df[",1).replace("y=df['popular']","X['popular_copy']=df['popular_copy']\ny=df['popular']",1),'target-derived classifier input')
neural=activities['ML-N-K1-1']['solution']
rejected('ML-N-K1-1',neural.replace('final_rmse = root_mean_squared_error(y_test, final_predictions)','final_rmse = root_mean_squared_error((y_test-y_train.mean())/y_train.std(), final_predictions)'),'scaled target mixed with original-unit predictions')
cluster=activities['ML-X17']['solution']
accepted('ML-X17',cluster.replace('labels=model.labels_','labels=(model.labels_+1)%model.n_clusters'),'permuted K-Means identifiers')
rejected('ML-X17',cluster.replace('profiles=X.groupby(labels).mean()','profiles=X.groupby(labels).mean()+2'),'incorrect original-unit profiles')
hierarchy=activities['ML-X18']['solution']
rejected('ML-X18',hierarchy.replace('profiles = sample.groupby(labels).mean()','profiles = X.iloc[:len(labels)].groupby(labels).mean()'),'sample label/population misalignment')
pca=activities['ML-X19']['solution']
accepted('ML-X19',pca+"\nweights.iloc[:,0]*=-1\nscores2[:,0]*=-1",'paired PCA sign change')
rejected('ML-X19',pca+"\nweights.iloc[:,0]*=-1",'unpaired PCA sign change')
rejected('ML-X19',pca.replace('retained = int(np.searchsorted(cumulative,0.9)+1)','retained = 2'),'two axes substituted for variance retention')
# Type-correct but wrong PCA subspace must not pass simply because it is orthogonal.
rejected('ML-X19',pca+"\nweights.iloc[:,:]=np.eye(X.shape[1])[:,:2]\nscores2=scaled@weights.values",'arbitrary orthogonal axes')
broken=run('ML-W-K1-1','model =')
assert broken['error']
accepted('ML-W-K1-1',linear,'recovery after syntax failure')
# Exported files are captured, then removed from the temporary run directory.
exported=run('ML-W-K1-1',linear+"\nresiduals.to_csv('residuals.csv',index=False)")
assert any(d['name']=='residuals.csv' for d in exported['downloads'])
assert not (ROOT/'residuals.csv').exists()
source_csv=ROOT/'data/candy-power-ranking.csv'
original=source_csv.read_bytes()
run('ML-X12',activities['ML-X12']['solution']+"\ndf.iloc[:1].to_csv('data/candy-power-ranking.csv',index=False)")
assert source_csv.read_bytes()==original,'A learner export must not overwrite the next run’s bundled input.'
accepted('ML-X12',activities['ML-X12']['solution'],'fresh inputs after an in-run source export')
print('Semantic alternatives, negatives, recovery and generated-resource cleanup passed.')

knn=activities['ML-X07']['solution']
assert 'preprocessor = StandardScaler()' in knn
rejected('ML-X07',knn.replace('preprocessor = StandardScaler()', 'preprocessor = "passthrough"'),'KNN without the playground scaling recipe')
accepted('ML-X07',knn,'canonical playground KNN preparation')
