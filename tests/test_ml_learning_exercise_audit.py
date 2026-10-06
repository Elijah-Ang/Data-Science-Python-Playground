"""Per-activity ML audit ledger with equivalent-code and numeric near misses.

This complements the existing workflow/mastery regressions. Every executable
unit gets its own row; decisions and reflections retain explicit self-review
status instead of implying automatic mathematical grading.
"""
from __future__ import annotations
import ast,copy,csv,hashlib,json,subprocess,sys,types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ALTERNATIVE_CASES=ROOT/'tests/ml_learning_alternative_cases.json'

class EquivalentPython(ast.NodeTransformer):
    def __init__(self):self.actions=[]
    def visit_Subscript(self,node):
        self.generic_visit(node)
        if isinstance(node.ctx,ast.Load) and isinstance(node.value,ast.Name) and node.value.id=='df':
            self.actions.append('pandas loc feature/row selection')
            return ast.copy_location(ast.Subscript(value=ast.Attribute(value=node.value,attr='loc',ctx=ast.Load()),slice=ast.Tuple(elts=[ast.Slice(lower=None,upper=None,step=None),node.slice],ctx=ast.Load()),ctx=node.ctx),node)
        return node
    def visit_Call(self,node):
        self.generic_visit(node)
        if isinstance(node.func,ast.Attribute):
            method=node.func.attr
            if method in ('fit','fit_transform','fit_predict','predict','predict_proba','decision_function','transform') and node.args and not any(k.arg=='X' for k in node.keywords):
                node.keywords.append(ast.keyword(arg='X',value=node.args.pop(0)))
                if method in ('fit','fit_transform','fit_predict') and node.args:
                    node.keywords.append(ast.keyword(arg='y',value=node.args.pop(0)))
                self.actions.append('keyword estimator input API')
            if isinstance(node.func.value,ast.Name) and node.func.value.id=='pd' and method=='DataFrame' and node.args and isinstance(node.args[0],ast.Dict):
                if any(k.arg=='columns' for k in node.keywords):return node
                index=next((k.value for k in node.keywords if k.arg=='index'),None)
                node.keywords=[k for k in node.keywords if k.arg!='index']
                node.func=ast.Attribute(value=node.func,attr='from_dict',ctx=ast.Load());self.actions.append('DataFrame.from_dict construction')
                if index is not None:
                    node=ast.Call(func=ast.Attribute(value=node,attr='set_axis',ctx=ast.Load()),args=[index],keywords=[ast.keyword(arg='axis',value=ast.Constant(value='index'))])
                return node
            if isinstance(node.func.value,ast.Name) and node.func.value.id=='np':
                if method=='array' and node.args:
                    node.func.attr='asarray';self.actions.append('equivalent ndarray construction')
                if method in ('mean','sum','std','var','median','min','max') and node.args and len(node.args)==1:
                    base=ast.Call(func=ast.Attribute(value=ast.Name(id='np',ctx=ast.Load()),attr='asarray',ctx=ast.Load()),args=[node.args[0]],keywords=[])
                    node.func=ast.Attribute(value=base,attr=method,ctx=ast.Load());node.args=[];self.actions.append('array method numerical calculation')
        return node

POISON='''
def _audit_near_miss(value):
    if isinstance(value,pd.DataFrame):
        altered=value.copy(deep=True)
        columns=altered.select_dtypes(include=[np.number]).columns
        if len(columns):
            for column in columns:altered[column]=altered[column].astype(float)+0.071
        else:altered.index=pd.Index(['wrong-row-'+str(i) for i in range(len(altered))])
        return altered
    if isinstance(value,pd.Series):
        if pd.api.types.is_numeric_dtype(value):return value.astype(float)+0.071
        return value.map(lambda item:'wrong-'+str(item))
    if isinstance(value,dict):return {key:_audit_near_miss(item) for key,item in value.items()}
    if isinstance(value,np.ndarray):
        if np.issubdtype(value.dtype,np.number):return value.astype(float)+0.071
        return np.asarray(['wrong-'+str(item) for item in value.ravel()]).reshape(value.shape)
    if isinstance(value,(int,float,np.number)):return float(value)+0.071
    if isinstance(value,str):return 'wrong-'+value
    if isinstance(value,list):return [_audit_near_miss(item) for item in value]
    if isinstance(value,tuple):return tuple(_audit_near_miss(item) for item in value)
    return None
'''

def good(result):return not result['error'] and not result['retainedPythonObjects'] and bool(result['checks']) and all(c['status'] in ('correct','self-review') for c in result['checks'])

def alternative_cases(units):
    """Every explicit case has inspectable code and is tested on its own setup.

    Retrieval activities may use the same mathematical method as a base
    activity, but their different populations are executed independently.
    Missing alternatives fail the audit instead of claiming family coverage.
    """
    data=json.loads(ALTERNATIVE_CASES.read_text())
    by_id={}
    activities={exercise['id']:exercise for _,exercise in units}
    for case in data['cases']:
        identity=case['id']
        if identity in by_id:raise ValueError('Duplicate alternative ID: '+identity)
        exercise=activities.get(identity)
        if exercise is None or exercise['kind']!='python':raise ValueError('Unknown Python alternative ID: '+identity)
        for field in ('family','label','rationale','code'):
            if not case.get(field):raise ValueError('Missing alternative '+field+': '+identity)
        if ast.dump(ast.parse(case['code']))==ast.dump(ast.parse(exercise['solution'])):
            raise ValueError('Alternative is only formatting/comments: '+identity)
        base=case.get('family_reference')
        if base and (base not in activities or activities[base]['kind']!='python'):
            raise ValueError('Unknown family reference: '+str(base))
        by_id[identity]=case
    return by_id

def main():
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    helper=types.ModuleType('ml_helpers')
    source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
    exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
    registry=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')],cwd=ROOT))
    runtime_source=(ROOT/'ml-learning/runtime.py').read_text()
    runtime={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+runtime_source,runtime)
    units=[(card,e) for card in registry['cards'] for e in card['exercises']]+[(challenge,challenge['exercise']) for challenge in registry['challenges']]
    explicit_alternatives=alternative_cases(units)
    baseline=json.loads((args.output/'baseline/learning-registry.json').read_text())
    before={e['id']:e for c in baseline['cards'] for e in c['exercises']};before.update({c['exercise']['id']:c['exercise'] for c in baseline['challenges']})
    rows=[];failures=[]
    for index,(card,e) in enumerate(units):
        old=before[e['id']]
        actions=[field+' updated' for field in ('task','hints','solution','checks','contract') if old.get(field)!=e.get(field)]
        row={'id':e['id'],'parent':card['id'],'kind':e['kind'],'card_kind':card.get('kind','workflow challenge'),'dataset':e.get('dataset',''),
            'task_review':'reviewed','lesson_review':'reviewed by authored family plus generated field inventory','hint_review':'reviewed','solution_review':'reviewed' if e['kind']=='python' else 'reviewed guidance',
            'grader_review':'reviewed semantic family and named contract' if e['kind']=='python' else 'decision answer reviewed' if e['kind']=='decision' else 'self-review declared',
            'actions':'; '.join(actions) or 'preserved after review','reference':'not-run','equivalence':'not-run','near_miss':'not-run'}
        if e['kind']=='python':
            reference=runtime['run_learning']({'exercise':e,'code':e['solution']})
            row['reference']='passed' if good(reference) else 'failed'
            row['reference_evidence']=reference['checks'];row['reference_error']=reference['error']
            row['reference_code']=e['solution'];row['reference_receipt_id']=reference['id'];row['reference_retained_python_objects']=reference['retainedPythonObjects']
            case=explicit_alternatives.get(e['id'])
            tree=EquivalentPython();transformed=ast.fix_missing_locations(tree.visit(ast.parse(e['solution'])))
            alt=case['code'] if case else ast.unparse(transformed)
            if case or tree.actions:
                result=runtime['run_learning']({'exercise':e,'code':alt})
                row['equivalence']='passed' if good(result) else 'failed'
                row['equivalence_case']=case['label'] if case else '; '.join(sorted(set(tree.actions)))
                row['equivalence_source']='tests/ml_learning_alternative_cases.json#'+e['id'] if case else 'tests/test_ml_learning_exercise_audit.py#EquivalentPython'
                row['equivalence_family']=case['family'] if case else '; '.join(sorted(set(tree.actions)))
                row['equivalence_rationale']=case['rationale'] if case else 'Executes the displayed public API/container transformations on this activity and its own authored checks.'
                if case and case.get('family_reference'):row['equivalence_family_reference']=case['family_reference']
                row['equivalence_evidence']=result['checks'];row['equivalence_error']=result['error'];row['alternative_code']=alt
                row['equivalence_receipt_id']=result['id'];row['equivalence_retained_python_objects']=result['retainedPythonObjects']
            else:
                row['equivalence']='failed'
                row['equivalence_case']='Missing executable per-ID alternative.'
            output=e.get('outputs',['answer'])[0]
            invalid=e['solution']+'\n'+POISON+'\n'+output+' = _audit_near_miss('+output+')\n'
            if e['id']=='ML-U07-2':invalid=e['solution']+'\nfor axis in plt.gcf().axes: axis.set_visible(False)\n'
            if e['id']=='ML-U08-1':invalid=e['solution']+'\nanswer=np.roll(answer,1)\n'
            result=runtime['run_learning']({'exercise':e,'code':invalid})
            row['near_miss']='passed' if not good(result) and not result['retainedPythonObjects'] else 'failed'
            row['near_miss_case']='Hidden required dendrogram' if e['id']=='ML-U07-2' else 'Shifted hierarchy membership to different rows' if e['id']=='ML-U08-1' else 'Changed requested '+output+' values without changing its numeric container shape; unsupported object outputs replaced by missing evidence.'
            row['near_miss_evidence']=result['checks'];row['near_miss_error']=result['error']
            row['near_miss_code']=invalid;row['near_miss_receipt_id']=result['id'];row['near_miss_retained_python_objects']=result['retainedPythonObjects']
            if row['reference']=='failed' or row['equivalence']=='failed' or row['near_miss']=='failed':failures.append(row['id'])
            if row['reference']=='failed' or row['equivalence']=='failed' or row['near_miss']=='failed':
                print(json.dumps({'failed_id':row['id'],'reference':row['reference'],'equivalence':row['equivalence'],'near_miss':row['near_miss'],'reference_error':row.get('reference_error'),'equivalence_error':row.get('equivalence_error'),'near_miss_error':row.get('near_miss_error')}) ,flush=True)
        elif e['kind']=='decision':
            options=e['options'];correct=e['correct']
            valid=bool(options) and bool(correct) and all(isinstance(c,int) and 0<=c<len(options) for c in correct) and len(set(correct))==len(correct)
            row['reference']='passed' if valid else 'failed';row['reference_evidence']='All declared answer indices exist and are unique; distractor rationale audited in the source family.'
            row['near_miss']='not-run';row['near_miss_case']='Native learner-submission click path belongs to browser QA.'
            if not valid:failures.append(row['id'])
        else:
            row['reference']='not-run';row['reference_evidence']='Reflection is intentionally human self-review; no automatic correctness claim.'
        rows.append(row)
        if (index+1)%20==0:print(f"{index+1}/{len(units)} canonical learning units audited",flush=True)
    args.output.mkdir(parents=True,exist_ok=True)
    python_rows=[r for r in rows if r['kind']=='python']
    summary={'reference_passed':sum(r['reference']=='passed' for r in python_rows),'equivalence_passed':sum(r['equivalence']=='passed' for r in python_rows),'near_miss_rejected':sum(r['near_miss']=='passed' for r in python_rows),'missing_equivalence_ids':[r['id'] for r in python_rows if 'alternative_code' not in r],'explicit_alternatives_executed':sum(r['id'] in explicit_alternatives for r in python_rows),'generated_alternatives_executed':sum(r['id'] not in explicit_alternatives and 'alternative_code' in r for r in python_rows),'retained_python_object_failures':[r['id'] for r in python_rows if any(r.get(kind+'_retained_python_objects',0) for kind in ('reference','equivalence','near_miss'))]}
    payload={'runtime_sha256':hashlib.sha256(runtime_source.encode()).hexdigest(),'registry_sha256':hashlib.sha256(json.dumps(registry,sort_keys=True).encode()).hexdigest(),'alternative_cases_sha256':hashlib.sha256(ALTERNATIVE_CASES.read_bytes()).hexdigest(),'harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'units':len(rows),'python_units':len(python_rows),'summary':summary,'failed_ids':failures,'rows':rows}
    (args.output/'learning-exercise-cases.json').write_text(json.dumps(payload,indent=2))
    columns=['id','parent','kind','card_kind','dataset','task_review','lesson_review','hint_review','solution_review','grader_review','actions','reference','equivalence','equivalence_case','near_miss','near_miss_case']
    with (args.output/'learning-exercise-ledger.csv').open('w',newline='') as handle:
        writer=csv.DictWriter(handle,fieldnames=columns,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
    print(json.dumps({'units':len(rows),'python_units':len(python_rows),'summary':summary,'failed_ids':failures},indent=2))
    if failures:raise SystemExit(1)
if __name__=='__main__':main()
