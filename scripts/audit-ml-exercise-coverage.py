"""Export complete authored/generated ML coverage and honest native evidence."""
import argparse,collections,csv,hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();out=args.output
registry=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
payload=json.loads(subprocess.check_output(['node','tests/generate_ml_routes.mjs'],cwd=ROOT))
learning=json.loads((out/'learning-exercise-cases.json').read_text())
practice=json.loads((out/'playground-native-cases.json').read_text())
visual=json.loads((out/'plot-visibility-cases.json').read_text())
assert not learning['failed_ids'] and not practice['failed_units'] and not practice['errors'] and not visual['failed']
assert learning['runtime_sha256']==visual['runtime_sha256']==hashlib.sha256((ROOT/'ml-learning/runtime.py').read_bytes()).hexdigest(),'Evidence must cover the final runtime.'
assert practice['source_sha256']=={k:hashlib.sha256(payload[k].encode()).hexdigest() for k in ('practiceValidatorSource','workerSource')},'Practice evidence must cover the final sources.'
old=json.loads((out/'baseline/learning-registry.json').read_text())
def identity(r):return {'cards':[c['id'] for c in r['cards']],'units':[(c['id'],[e['id'] for e in c['exercises']]) for c in r['cards']],'prerequisites':[(c['id'],c['prerequisites']) for c in r['cards']],'challenges':[(c['id'],c['exercise']['id']) for c in r['challenges']]}
assert identity(old)==identity(registry),'Stable IDs, order, and prerequisites must remain unchanged.'
(out/'identity-preservation.json').write_text(json.dumps({'preserved':True,'migrations_required':False,'new_learner_persistence':False,'identity':identity(registry)},indent=2))
(out/'final-learning-registry.json').write_text(json.dumps(registry,indent=2))
(out/'final-playground-routes.json').write_text(json.dumps(payload))
case_map={row['id']:row for row in practice['rows']}
rows=[];definitions={};counts=collections.Counter();issues=[]
for folds,routes in payload['routes'].items():
 for route in routes:
  prefix=f"playground:{folds}:{route['datasetId']}:{route['scenarioId']}:{route['modelId']}"
  ids={c['id'] for c in route['cells']}
  for cell in route['cells']:
   id=prefix+':'+cell['id']
   fields=sorted(k for k,v in cell.items() if v is not None)
   row={'id':id,'scope':'guided route cell','availability':'active guided route','dataset':route['datasetId'],'scenario':route['scenarioId'],'model':route['modelId'],'folds':folds,'unit':cell['id'],
        'task_review':'shared generator-family review + per-instance schema/dependency/native checks','lesson_review':'all generated explanatory fields inventoried; shared definition reviewed','hint_review':'shared task help reviewed','solution_review':'primary/setup/evidence/advanced fields inventoried','grader_review':'guided cell has no active optional practice grade',
        'reviewed_fields':fields,'reference':'native guide coverage delegated to root; context/exercise subset here','equivalence':'not-run for guide-only cell','near_miss':'not-run for guide-only cell'}
   if id in case_map:
    row.update({k:case_map[id][k] for k in ('reference','equivalence','near_miss')});row['reference_scope']='dormant exercise validator native execution using this visible code'
   rows.append(row);counts['guided_cells']+=1
   for kind,meta in (cell.get('practice') or {}).items():
    if not meta:continue
    unit_id=id+':'+kind+':'+meta['id']
    native=case_map.get(id) if kind=='exercise' else None
    entry={'id':unit_id,'scope':'optional practice '+kind,'availability':'dormant metadata; fixed guided UI does not expose Practice mode','dataset':route['datasetId'],'scenario':route['scenarioId'],'model':route['modelId'],'folds':folds,'unit':meta['id'],
      'task_review':'shared definition-family review and all instance fields checked','lesson_review':'parent cell explanation reviewed by shared generator family','hint_review':'all hint fields inventoried; scientific contract fixed where needed','solution_review':'reference/scaffold matched to visible code' if kind=='exercise' else 'answer/rationale/experiment payload reviewed','grader_review':'production semantic validator exercised' if kind=='exercise' else 'choice/prediction metadata reviewed; intentionally non-executable',
      'reviewed_fields':sorted(meta),'reference':native['reference'] if native else 'not-run','equivalence':native['equivalence'] if native else 'not-run','near_miss':native['near_miss'] if native else 'not-run'}
    if kind=='exercise':
     found=cell['code'].count(meta['find']);entry['scaffold_matches']=found;entry['reference_match']=meta['solution']==meta['find']
     if found!=1 or not entry['reference_match']:issues.append(unit_id+' scaffold mismatch')
    elif kind in ('beforeRun','decision'):
     options=[option['value'] for option in meta.get('options',[])];answer=meta.get('answer')
     entry['options_valid']=bool(options) and len(options)==len(set(options)) and (answer is None or answer in options)
     entry['choice_semantics']='prediction/opinion; no unique correct claim' if answer is None else 'declared answer and evidence reviewed'
     if not entry['options_valid']:issues.append(unit_id+' invalid options')
    else:
     entry['target_exists']=meta.get('targetTaskId') in ids and meta.get('evidenceTaskId') in ids
     target=next(c for c in route['cells'] if c['id']==meta['targetTaskId'])
     entry['change_matches']=target['code'].count(meta['find'])
     if not entry['target_exists'] or entry['change_matches']!=1:issues.append(unit_id+' invalid experiment dependency')
    rows.append(entry);counts[kind]+=1
    key=kind+':'+meta['id'];definition=definitions.setdefault(key,{'id':key,'kind':kind,'review':'shared authored definition and all generated key fields reviewed; no claim of manual rereading every identical instance','instances':0,'fields':set(),'models':set(),'native_units':set()})
    definition['instances']+=1;definition['fields'].update(meta);definition['models'].add(route['modelId'])
    if native:definition['native_units'].add(id)
  checkpoint=route['checkpoint'];id=prefix+':independent-checkpoint';native=case_map[id]
  rows.append({'id':id,'scope':'independent checkpoint','availability':'dormant metadata; fixed guided UI does not expose checkpoint','dataset':route['datasetId'],'scenario':route['scenarioId'],'model':route['modelId'],'folds':folds,'unit':checkpoint['id'],
    'task_review':'shared scientific family and all generated fields reviewed','lesson_review':'goal/checklist/hints aligned with native contract','hint_review':'supplied inputs/output names/current cv and numerical evidence explicit','solution_review':'reference/cleanReference inventories and actual reference execution','grader_review':'semantic roles, scientific values, input snapshots and heldout guard exercised','reviewed_fields':sorted(checkpoint),**{k:native[k] for k in ('reference','equivalence','near_miss','guard') if k in native}})
  counts['checkpoints']+=1
assert not issues,issues
assert counts['exercise']==466 and counts['checkpoints']==254 and len(definitions)==54
assert len(case_map)==720
for definition in definitions.values():
 for field in ('fields','models','native_units'):definition[field]=sorted(definition[field])
 definition['native_evidence']='all '+str(len(definition['native_units']))+' generated code instances passed reference/equivalence/near-miss native checks' if definition['native_units'] else 'non-executable; no runtime correctness claim'
(out/'playground-definition-review.json').write_text(json.dumps(list(definitions.values()),indent=2))
(out/'playground-coverage-ledger.json').write_text(json.dumps(rows,indent=2))
columns=sorted({k for row in rows for k in row})
with (out/'playground-coverage-ledger.csv').open('w',newline='') as file:
 writer=csv.DictWriter(file,fieldnames=columns);writer.writeheader();writer.writerows([{k:json.dumps(v) if isinstance(v,(list,dict)) else v for k,v in row.items()} for row in rows])
units=[e for c in registry['cards'] for e in c['exercises']]+[c['exercise'] for c in registry['challenges']]
duplicates=collections.defaultdict(list)
for e in units:
 if e['kind']=='python':duplicates[(e['task'],e['solution'])].append(e['id'])
exact=[ids for ids in duplicates.values() if len(ids)>1]
assert not exact,exact
summary={'canonical_cards':len(registry['cards']),'canonical_challenges':len(registry['challenges']),'canonical_units':len(units),'canonical_kinds':dict(collections.Counter(e['kind'] for e in units)),
 'canonical_reference':dict(collections.Counter(row['reference'] for row in learning['rows'])),'canonical_equivalence':dict(collections.Counter(row['equivalence'] for row in learning['rows'])),'canonical_near_miss':dict(collections.Counter(row['near_miss'] for row in learning['rows'])),
 'playground_route_variants':sum(len(rs) for rs in payload['routes'].values()),'playground_inventory':dict(counts),'playground_shared_definitions':len(definitions),'playground_native_units':practice['units'],'playground_native_failures':practice['failed_units'],'plot_cases':visual['cases'],'plot_failures':visual['failed'],
 'exact_task_solution_duplicates':exact,'ids_order_prerequisites_preserved':True,'evidence_kind':'native Python; dormant metadata does not establish active UI use','native_versions':practice['native_versions'],'source_sha256':{'learning_runtime':learning['runtime_sha256'],**practice['source_sha256']}}
(out/'coverage-summary.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
