"""Regression receipts for supplied ML evidence and equivalent presentations."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,sys,types
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 os.chdir(ROOT)
 helper=types.ModuleType('ml_helpers')
 source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],text=True)
 exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
 registry=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')]))
 units={e['id']:e for c in registry['cards'] for e in c['exercises']}
 runtime={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),runtime)
 cases=[]
 def case(eid,label,code,accept):cases.append({'id':eid,'case':label,'code':code,'expected_accept':accept})
 case('ML-W01-2','frequency_order_reference',units['ML-W01-2']['solution'],True)
 case('ML-W01-2','alphabetic_label_order','answer=y_train.value_counts().sort_index()',True)
 case('ML-W01-2','groupby_size','answer=y_train.groupby(y_train).size()',True)
 case('ML-W01-2','wrong_species_case','answer=y_train.value_counts()\nanswer.index=answer.index.str.upper()',False)
 case('ML-W01-2','wrong_count','answer=y_train.value_counts()+1',False)
 case('ML-W01-2','duplicate_label','answer=y_train.value_counts()\nanswer.index=[answer.index[0]]*len(answer)',False)
 case('ML-N02-1','one_based_reference',units['ML-N02-1']['solution'],True)
 case('ML-N02-1','zero_based_series','answer=pd.Series(network.loss_curve_,name="training_loss").rename_axis("iteration")',True)
 case('ML-N02-1','one_based_array_index','answer=pd.Series(np.asarray(network.loss_curve_),index=np.arange(1,len(network.loss_curve_)+1)).rename_axis("iteration")',True)
 case('ML-N02-1','wrong_loss','answer=pd.Series(np.asarray(network.loss_curve_)+.1).rename_axis("iteration")',False)
 case('ML-N02-1','wrong_index_name','answer=pd.Series(network.loss_curve_).rename_axis("epoch")',False)
 case('ML-N02-1','sparse_iteration_labels','answer=pd.Series(network.loss_curve_,index=np.arange(len(network.loss_curve_))*2).rename_axis("iteration")',False)
 case('ML-N02-1','reversed_training_history','answer=pd.Series(network.loss_curve_[::-1]).rename_axis("iteration")',False)
 case('ML-N02-1','fabricated_supplied_network','network.loss_curve_=np.zeros_like(network.loss_curve_)\nanswer=pd.Series(network.loss_curve_).rename_axis("iteration")',False)
 for eid in ('ML-P04-2','ML-P-R1-1'):
  e=units[eid];ref=e['solution']
  assert e['outputs']==['cumulative','retained_80','retained_95']
  assert all(x in e['task'] for x in e['outputs'])
  assert {x['name'] for x in e['contract']}==set(e['outputs'])
  case(eid,'reference',ref,True)
  case(eid,'add_accumulate_prefix_count','cumulative=np.add.accumulate(pca.explained_variance_ratio_)\nretained_80=int(np.count_nonzero(cumulative<.8)+1)\nretained_95=int(np.count_nonzero(cumulative<.95)+1)',True)
  case(eid,'first_threshold_position','cumulative=np.cumsum(pca.explained_variance_ratio_)\nretained_80=int(np.flatnonzero(cumulative>=.8)[0]+1)\nretained_95=int(np.flatnonzero(cumulative>=.95)[0]+1)',True)
  case(eid,'fabricated_zero_cumulative_impossible_counts','cumulative=np.zeros_like(pca.explained_variance_ratio_)\nretained_80=len(cumulative)+1\nretained_95=len(cumulative)+1',False)
  case(eid,'correct_cumulative_wrong_counts',ref+'\nretained_80+=1\nretained_95+=1',False)
  case(eid,'wrong_cumulative_correct_counts',ref+'\ncumulative=np.zeros_like(cumulative)',False)
  case(eid,'missing_cumulative',ref+'\ndel cumulative',False)
  case(eid,'fabricated_pca_ratios','pca.explained_variance_ratio_=np.zeros_like(pca.explained_variance_ratio_)\ncumulative=np.cumsum(pca.explained_variance_ratio_)\nretained_80=len(cumulative)+1\nretained_95=len(cumulative)+1',False)
  case(eid,'boolean_count',ref+'\nretained_80=True',False)
 scatter=units['ML-W01-1']['solution']
 case('ML-W01-1','taught_seaborn',scatter,True)
 case('ML-W01-1','equivalent_matplotlib',scatter.replace('sns.scatterplot(x=X_train.distance,y=y_train,ax=ax)','ax.scatter(X_train.distance,y_train)'),True)
 case('ML-W01-1','wrong_plot_training_values',scatter.replace('y=y_train,ax=ax','y=y_train+1,ax=ax'),False)
 case('ML-W01-1','hidden_training_plot',scatter+'\nax.set_visible(False)',False)
 case('ML-W01-1','swapped_axis_quantities',scatter+'\nax.set(xlabel="Duration",ylabel="Distance")',False)
 case('ML-W01-1','irrelevant_axis_quantities',scatter+'\nax.set(xlabel="Weight",ylabel="Service")',False)
 case('ML-W01-1','cosmetic_case_and_units',scatter+'\nax.set(xlabel="Training DISTANCE (km)",ylabel="duration (minutes)")',True)
 rows=[]
 for row in cases:
  result=runtime['run_learning']({'exercise':units[row['id']],'code':row['code']})
  accepted=not result['error'] and not result['retainedPythonObjects'] and all(c['status']=='correct' for c in result['checks'])
  rows.append(row|{'actual_accept':accepted,'passed':accepted==row['expected_accept'],'result':{k:result[k] for k in ('error','checks','retainedPythonObjects')}})
  print(row['id'],row['case'],'PASS' if rows[-1]['passed'] else 'FAIL',flush=True)
 payload={'runtime_sha256':hashlib.sha256((ROOT/'ml-learning/runtime.py').read_bytes()).hexdigest(),'registry_sha256':hashlib.sha256(json.dumps(registry,sort_keys=True).encode()).hexdigest(),'cases':rows,'all_pass':all(r['passed'] for r in rows)}
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(payload,indent=2)+'\n')
 if not payload['all_pass']:raise SystemExit(1)
if __name__=='__main__':main()
