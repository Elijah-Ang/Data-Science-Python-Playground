"""Execute the entire core scope and inspect new semantic boundary cases.

Writes source-backed alternatives/evidence for the parent aggregate audit. No
learner namespace or state is persisted by the learning runtime.
"""
import ast
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT/'ml-learning'))
import authoring
import audit_repair_core


def load_runtime():
    helper = types.ModuleType('ml_helpers')
    source = subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"], text=True)
    exec('import numpy as np\n'+source, helper.__dict__)
    sys.modules['ml_helpers'] = helper
    ns = {}
    exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
    return ns['run_learning']


def good(result):
    return not result['error'] and not result['retainedPythonObjects'] and bool(result['checks']) and all(c['status'] in ('correct','self-review') for c in result['checks'])


def main():
    source = ROOT/'tests/test_ml_learning_exercise_audit.py'
    spec = importlib.util.spec_from_file_location('core_equivalent_harness',source)
    harness = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(harness)
    registry = authoring.assemble()
    units = [(c,e) for c in registry['cards'] if c['deck'] in ('foundations','workflow','regression') for e in c['exercises']]
    run = load_runtime()
    rows = []
    alternatives = []
    failures = []
    existing_alternatives = {c['id']:c for c in json.loads((ROOT/'tests/ml_learning_alternative_cases.json').read_text())['cases']}
    for card,exercise in units:
        if exercise['kind'] != 'python':
            continue
        identity = exercise['id']
        transformer = harness.EquivalentPython()
        tree = ast.fix_missing_locations(transformer.visit(ast.parse(exercise['solution'])))
        alternative = ast.unparse(tree)+'\n'
        rationale = 'Uses public keyword estimator inputs and equivalent pandas/NumPy constructors or labelled selection, on this exact activity and population.'
        if not transformer.actions:
            if identity == 'ML-F07-3':
                alternative = "a,b,c,d = candidate_splits['joint']\nanswer = 'joint' if list(a.index)==list(c.index) and list(b.index)==list(d.index) else 'sorted_target'\n"
                rationale = 'Compares the same observation identities as lists instead of using Index.equals; the alignment decision is unchanged.'
            elif identity in existing_alternatives and identity not in audit_repair_core.REPAIR_NOTES:
                alternative = existing_alternatives[identity]['code']
                rationale = existing_alternatives[identity]['rationale']
            elif identity == 'ML-R-R1-2':
                alternative = "denominator = np.sum((y_test-y_test.mean())**2)\nevaluation_r2 = 1-np.sum((y_test-y_test.mean())**2)/denominator\ntraining_constant_r2 = 1-np.sum((y_test-y_train.mean())**2)/denominator\n"
                rationale = 'Uses the direct residual-sum-of-squares R² identity for the two declared constants instead of r2_score.'
            else:
                alternative = exercise['solution']+'\n# Copy the result without changing its values or labels.\n'+exercise['outputs'][0]+' = '+exercise['outputs'][0]+'.copy()\n'
                rationale = 'Returns an independent copy of the requested mathematical evidence while preserving its row/feature labels.'
        alternatives.append(dict(id=identity,family='core-audit-equivalent',label='Equivalent labelled containers and public API calls',rationale=rationale,code=alternative))
        reference = run({'exercise':exercise,'code':exercise['solution']})
        equivalent = run({'exercise':exercise,'code':alternative})
        output = exercise['outputs'][0]
        wrong = exercise['solution']+'\n'+harness.POISON+'\n'+output+' = _audit_near_miss('+output+')\n'
        negative = run({'exercise':exercise,'code':wrong})
        passed = good(reference) and good(equivalent) and not good(negative) and not negative['retainedPythonObjects']
        row = dict(id=identity,parent=card['id'],reference=reference,equivalent=equivalent,numeric_or_identity_near_miss=negative,passed=passed)
        rows.append(row)
        if not passed:
            failures.append(identity)
            print('FAILED', identity, {k:row[k].get('error') for k in ('reference','equivalent','numeric_or_identity_near_miss')}, flush=True)
        if len(rows)%20==0:
            print('Verified', len(rows), 'core Python activities', flush=True)

    by_id = {e['id']:e for _,e in units}
    negatives = [
        ('ML-F02-3','post-outcome invoice used as input',"X = df[['backlog_at_open','invoice_hours']]\ny=df.completion_hours"),
        ('ML-F07-3','reproducible separately sorted targets',"answer='sorted_target'"),
        ('ML-F09-3','unstratified imbalanced population',by_id['ML-F09-3']['solution'].replace(',stratify=y','')),
        ('ML-W03-3','scaler fitted on full shifted population',by_id['ML-W03-3']['starter']),
        ('ML-W03-3','scaler refitted on the later population',by_id['ML-W03-3']['solution'].replace('.fit(X_train)','.fit(X_test)')),
        ('ML-W03-3','leaking fit followed by an otherwise correct training repair',"from sklearn.preprocessing import StandardScaler\nleaking = StandardScaler().fit(df[['temperature_c','pressure_bar']])\n"+by_id['ML-W03-3']['solution']),
        ('ML-W08-3','folds include final-test rows',by_id['ML-W08-3']['solution'].replace('.split(X_train,y_train)',".split(df[['signal','speed_rpm']],df.status)")),
        ('ML-W11-1','intercept search fitted on all loaded rows',by_id['ML-W11-1']['solution'].replace('search.fit(X_train, y_train)',"search.fit(df[['distance']],df.duration)")),
        ('ML-W11-1','intercept search uses three folds',by_id['ML-W11-1']['solution'].replace('n_splits=5','n_splits=3')),
        ('ML-W11-1','intercept search uses a different scorer',by_id['ML-W11-1']['solution'].replace('neg_root_mean_squared_error','neg_mean_absolute_error')),
        ('ML-W13-1','invented final predictions with self-consistent error',by_id['ML-W13-1']['solution'].replace('final_predictions=final_model.predict(X_test)','final_predictions=np.zeros(len(X_test))')),
        ('ML-W14-3','fits/predicts first forward block instead of supplied last block',by_id['ML-W14-3']['solution'].replace('training_positions','np.arange(32)').replace('validation_positions','np.arange(32,64)')),
        ('ML-F-R1-1','uses full table instead of supplied four-case population',by_id['ML-F-R1-1']['solution'].replace('eligible','df')),
        ('ML-F-R1-2','reversed incoming prediction row identities',by_id['ML-F-R1-2']['solution']+'\nanswer=answer.iloc[::-1]\n'),
        ('ML-F-R1-3','residual signs reversed',by_id['ML-F-R1-3']['solution'].replace('actual-predicted','predicted-actual')),
        ('ML-W-R1-1','erased later deviations for the constant-training pressure feature',by_id['ML-W-R1-1']['solution']+"\nanswer['pressure_bar']=0\n"),
        ('ML-W-R1-2','all-zero unknown-category hardcode erases known rows',"answer=pd.DataFrame(np.zeros((3,3)),index=incoming.index,columns=encoder.get_feature_names_out())"),
        ('ML-W-R1-3','wrong imputation strategy for explicit median task',by_id['ML-W-R1-3']['solution'].replace("strategy='median'","strategy='mean'")),
        ('ML-R03-1','final-test residuals used for development diagnosis',by_id['ML-R03-1']['solution'].replace('X_train','X_test').replace('y_train','y_test')),
        ('ML-R06-2','second line fitted to unchanged outcome',by_id['ML-R06-2']['solution'].replace('.fit(X,adjusted_target)','.fit(X,df.duration)')),
        ('ML-R08-2','Ridge pipeline omits scaling',by_id['ML-R08-2']['solution'].replace("('scale',StandardScaler()),",'')),
        ('ML-R09-1','different configured tree depth',by_id['ML-R09-1']['solution'].replace('max_depth=3','max_depth=2')),
        ('ML-R09-3','wrong explicit seed in controlled unit comparison',by_id['ML-R09-3']['solution'].replace('random_state=42','random_state=73')),
        ('ML-R09-3','unit-changed fit predicts inputs in the old units',by_id['ML-R09-3']['solution'].replace('predict(test[features]*100)','predict(test[features])')),
        ('ML-R-R1-2','uses evaluation mean as deployable training constant',by_id['ML-R-R1-2']['solution'].replace('np.repeat(y_train.mean(),len(y_test))','np.repeat(y_test.mean(),len(y_test))')),
        ('ML-R-R2-1','interaction values replaced by zero',by_id['ML-R-R2-1']['solution']+"\nanswer['backlog_at_open device_age_years']=0\n"),
        ('ML-R-R2-2','degree search includes final rows',by_id['ML-R-R2-2']['solution'].replace('.fit(X_train,y_train)',".fit(df[['x']],df.y)")),
        ('ML-R-R2-3','invented fold-variation report',by_id['ML-R-R2-3']['solution']+'\nanswer.fold_sd=0\n'),
        ('ML-F-K1-1','post-outcome invoice in full workflow',by_id['ML-F-K1-1']['solution'].replace("['backlog_at_open', 'device_age_years']","['backlog_at_open', 'invoice_hours']")),
    ]
    semantic_rows = []
    for identity,label,code in negatives:
        result = run({'exercise':by_id[identity],'code':code})
        rejected = not good(result) and not result['retainedPythonObjects']
        semantic_rows.append(dict(id=identity,label=label,code=code,result=result,rejected=rejected))
        if not rejected:
            failures.append(identity+': '+label)
            print('ACCEPTED WRONG',identity,label,flush=True)
    # A changed holdout/seed and supported MAE are legitimate full-workflow choices.
    e = by_id['ML-F-K1-1']
    flexible_code = e['solution'].replace('test_size=.2, random_state=42','test_size=.25, random_state=73').replace('neg_root_mean_squared_error','neg_mean_absolute_error').replace('from sklearn.metrics import mean_squared_error','from sklearn.metrics import mean_absolute_error').replace('np.sqrt(mean_squared_error(y_test, final_predictions))','mean_absolute_error(y_test, final_predictions)')
    flexible_result = run({'exercise':e,'code':flexible_code})
    if not good(flexible_result): failures.append('ML-F-K1-1 flexible MAE/seed/holdout equivalent')
    output_dir = ROOT/'work/audit'
    (output_dir/'ml-core-alternatives.json').write_text(json.dumps({'cases':alternatives},indent=2))
    (output_dir/'ml-core-evidence.json').write_text(json.dumps(dict(python_activities=len(rows),semantic_negatives=len(semantic_rows),all_activity_cases=rows,semantic_cases=semantic_rows,flexible_checkpoint_case=dict(code=flexible_code,result=flexible_result),failed=failures),indent=2))
    (output_dir/'ml-core-after.json').write_text(json.dumps(registry,indent=2))
    print(json.dumps(dict(python_activities=len(rows),reference_passed=sum(good(r['reference']) for r in rows),equivalence_passed=sum(good(r['equivalent']) for r in rows),near_miss_rejected=sum(not good(r['numeric_or_identity_near_miss']) for r in rows),semantic_negatives=len(semantic_rows),semantic_rejected=sum(r['rejected'] for r in semantic_rows),flexible_checkpoint_passed=good(flexible_result),failed=failures),indent=2),flush=True)
    if failures:raise SystemExit(1)


if __name__ == '__main__':
    main()
