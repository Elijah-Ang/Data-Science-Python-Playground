"""Reference, equivalent and semantic-negative receipts for discovery repairs."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import types

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT/'work/audit/ml-discovery-test-evidence.json')
    args = parser.parse_args()
    os.chdir(ROOT)
    helper = types.ModuleType('ml_helpers')
    source = subprocess.check_output(['node', '--input-type=module', '-e',
        "import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"], text=True)
    exec('import numpy as np\n'+source, helper.__dict__)
    sys.modules['ml_helpers'] = helper
    sys.path.insert(0, str(ROOT/'ml-learning'))
    import authoring
    from fixtures import learning_fixture
    registry = authoring.assemble()
    cards = [c for c in registry['cards'] if c['deck'] in ('clustering','pca','comparison')]
    units = {e['id']: e for c in cards for e in c['exercises']}
    for eid in ('ML-U07-4','ML-P02-2','ML-P02-3','ML-U-R1-3'):
        assert not any(name in units[eid].get('setup','') for name in
                       ('expected_raw','expected_scaled','expected_new_scores','aligned_labels')), eid
    runtime = {}
    exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(), runtime)
    cases = [(e['id'], 'reference', e['solution'], True) for e in units.values() if e['kind']=='python']

    def case(eid, name, code, expected):
        cases.append((eid,name,code,expected))

    def mutate(eid, name, old, new, expected=False):
        solution = units[eid]['solution']
        assert old in solution, (eid,old)
        case(eid,name,solution.replace(old,new),expected)

    def append(eid, name, code, expected=False):
        case(eid,name,units[eid]['solution']+'\n'+code,expected)

    append('ML-U03-1','equivalent_centroid_row_permutation','answer=answer[[2,0,1]]',True)
    mutate('ML-U03-1','wrong_k_two','n_clusters=3','n_clusters=2')
    mutate('ML-U03-2','equivalent_estimator_alias','model','clusterer',True)
    mutate('ML-U03-2','wrong_k_two','n_clusters=3','n_clusters=2')
    append('ML-U03-2','wrong_centroid_distance','distance+=.2')
    mutate('ML-U03-3','equivalent_group_renaming','labels = model.labels_','labels = (model.labels_+1)%3',True)
    mutate('ML-U03-3','fabricated_grouping','labels = model.labels_','labels = np.zeros(len(X),dtype=int)')
    mutate('ML-U03-3','wrong_k_two','n_clusters=3','n_clusters=2')
    mutate('ML-U03-3','raw_distance_geometry','scaled = StandardScaler().fit_transform(X)','scaled = X.to_numpy()')
    mutate('ML-U04-1','wrong_k_two','n_clusters=3','n_clusters=2')
    append('ML-U05-2','wrong_profile_group_labels','answer.index=answer.index+10')
    append('ML-U05-2','wrong_axis_meaning','ax.set(xlabel="Body mass",ylabel="Bill length")')
    mutate('ML-U06-1','wrong_initialisation_count','n_init=1','n_init=20')
    append('ML-U06-1','wrong_seed_order','answer=answer[::-1]')
    mutate('ML-U07-4','equivalent_linkage_alias','from scipy.cluster.hierarchy import linkage','from scipy.cluster.hierarchy import linkage as ward_linkage',True)
    # Complete the alias call replacement; imports alone are not a solution.
    cases[-1] = (*cases[-1][:2],cases[-1][2].replace('= linkage(', '= ward_linkage('),True)
    mutate('ML-U07-4','wrong_scaled_geometry','scaled = StandardScaler().fit_transform(X)','scaled = X.to_numpy()')
    mutate('ML-U07-4','wrong_population','X = df[[\'length_mm\', \'width_cm\']]','X = df.iloc[:24][[\'length_mm\', \'width_cm\']]')
    append('ML-U07-4','wrong_merge_column','scaled_height=float(scaled_linkage[-1,3])')
    mutate('ML-U09-2','equivalent_explicit_population_transform','answer = scaler.transform(sample)',
        'answer = (sample.to_numpy()-scaler.mean_)/scaler.scale_',True)
    mutate('ML-U09-2','wrong_sample_fitted_scale','scaler = StandardScaler().fit(X)',
        'scaler = StandardScaler().fit(X.sample(min(500,len(X)),random_state=42))')
    mutate('ML-U09-2','wrong_prefix_instead_of_sample','sample = X.sample(min(500,len(X)),random_state=42)',
        'sample = X.iloc[:500]')
    mutate('ML-U10-1','equivalent_crosstab_method',
        "answer = pd.crosstab(cluster_labels, df['label']).reindex(columns=['A','B','C'], fill_value=0)",
        "answer = X.assign(cluster=cluster_labels,reference=df['label']).groupby(['cluster','reference']).size().unstack(fill_value=0).reindex(columns=['A','B','C'],fill_value=0)",True)
    append('ML-U10-1','wrong_reference_counts','answer.iloc[0,0]+=1')
    append('ML-U10-1','wrong_reference_column_labels',"answer.columns=['B','A','C']")
    case('ML-P02-2','equivalent_manual_projection',
        'prepared=scaler.transform(incoming)\nanswer=(prepared-pca.mean_)@pca.components_.T',True)
    case('ML-P02-2','wrong_refit_on_incoming',
        'answer=pca.fit_transform(scaler.fit_transform(incoming))',False)
    append('ML-P02-2','wrong_row_order','answer=answer[::-1]')
    mutate('ML-P02-3','equivalent_input_order_selection','ordered = incoming[feature_names]',
        'ordered = incoming.loc[:,X.columns]',True)
    mutate('ML-P02-3','wrong_incoming_column_order','ordered = incoming[feature_names]','ordered = incoming')
    append('ML-P02-3','lost_incoming_ids','answer=answer.reset_index(drop=True)')
    mutate('ML-P02-4','equivalent_fitted_transform','pca = PCA().fit(scaled)\ntraining_scores = pca.transform(scaled)',
        'pca = PCA()\ntraining_scores = pca.fit_transform(scaled)',True)
    append('ML-P02-4','refitted_incoming_batch',
        "incoming_scores=pd.DataFrame(pca.fit_transform(scaler.fit_transform(incoming)),index=incoming.index,columns=['PC1','PC2','PC3','PC4','PC5'])")
    append('ML-P02-4','lost_incoming_ids','incoming_scores=incoming_scores.reset_index(drop=True)')
    case('ML-P04-2','equivalent_threshold_prefix_counts',
        'cumulative=np.add.accumulate(pca.explained_variance_ratio_)\nretained_80=int(np.count_nonzero(cumulative<.8)+1)\nretained_95=int(np.count_nonzero(cumulative<.95)+1)',True)
    append('ML-P04-2','swapped_threshold_counts','retained_80,retained_95=retained_95,retained_80')
    append('ML-P04-3','wrong_cap_assumed_sufficient','retained=8\nbudget_met=True')
    mutate('ML-P04-3','relaxed_variance_requirement',
        'np.searchsorted(np.cumsum(pca.explained_variance_ratio_), .9)',
        'np.searchsorted(np.cumsum(pca.explained_variance_ratio_), .8)')
    append('ML-P06-2','wrong_2d_as_retained','retained_scores=view_2d')
    append('ML-P07-2','omitted_paired_sign_flip','weights=pca.components_[0]\nflipped_scores=scores[:,0]')
    case('ML-P07-2','equivalent_broadcast_reconstruction',
        'weights=-pca.components_[0]\nflipped_scores=-scores[:,0]\nanswer=flipped_scores[:,None]*weights[None,:]',True)
    mutate('ML-U-R1-3','equivalent_id_join','labels = shuffled_labels.reindex(X.index)',
        'labels = X.join(shuffled_labels).cluster',True)
    mutate('ML-U-R1-3','wrong_positional_alignment','labels = shuffled_labels.reindex(X.index)',
        "labels = pd.Series(shuffled_labels.to_numpy(),index=X.index)")
    mutate('ML-U-R1-3','equivalent_consistent_group_names','labels = shuffled_labels.reindex(X.index)',
        "labels = shuffled_labels.reindex(X.index).map({0:'east',1:'west',2:'centre'})",True)
    append('ML-U-R1-3','wrong_count_labels',"sizes.index=['wrong_'+str(v) for v in sizes.index]")
    append('ML-U-R1-3','wrong_profile_units','answer=answer*10')
    case('ML-U-R2-2','equivalent_indexed_groupby',
        'answer=sample.assign(cluster=labels).groupby("cluster")[list(sample.columns)].mean()\npopulation_ids=sample.index.tolist()',True)
    mutate('ML-U-R2-2','wrong_full_population','answer = sample.groupby(labels).mean()',
        "answer = X.groupby(np.resize(labels.to_numpy(),len(X))).mean()")
    append('ML-U-R2-2','wrong_population_identity','population_ids=X.index.tolist()')
    case('ML-P-R1-1','equivalent_first_threshold_position',
        'cumulative=np.cumsum(pca.explained_variance_ratio_)\nretained_80=int(np.flatnonzero(cumulative>=.8)[0]+1)\nretained_95=int(np.flatnonzero(cumulative>=.95)[0]+1)',True)
    case('ML-P-R1-1','unchanged_faulty_starter',units['ML-P-R1-1']['starter'],False)
    append('ML-P-R1-1','wrong_same_counts','retained_95=retained_80')
    case('ML-P-R1-2','wrong_weights_as_scores','answer=reported',False)
    case('ML-P-R1-2','wrong_transposed_weights_as_scores','answer=reported.T',False)
    append('ML-P-R1-2','lost_observation_ids','answer=answer.reset_index(drop=True)')
    case('ML-P-R1-2','equivalent_manual_coordinates',
        "answer=pd.DataFrame((scaled-pca.mean_)@pca.components_[:2].T,index=X.index,columns=['PC1','PC2'])",True)
    append('ML-U-K1-1','equivalent_count_presentation_order','sizes=sizes.sort_values()',True)
    append('ML-U-K1-1','wrong_plot_population','ax.clear()\nax.scatter(X.length_mm.iloc[:8],X.width_cm.iloc[:8])\nax.set(xlabel="Length",ylabel="Width")')
    append('ML-U-K1-1','swapped_axis_meanings','ax.set(xlabel="Width",ylabel="Length")')
    mutate('ML-U-K1-1','wrong_raw_geometry','scaled=scaler.fit_transform(X)','scaled=X.to_numpy()')
    mutate('ML-P-K1-1','wrong_feature_year_substitution',
        "'flipper_length_mm','body_mass_g'","'flipper_length_mm','year'")
    append('ML-P-K1-1','equivalent_paired_axis_signs',
        'weights.iloc[:,0]*=-1\nscores2[:,0]*=-1\nax.clear()\nax.scatter(scores2[:,0],scores2[:,1])\nax.set(xlabel="PC1 score",ylabel="PC2 score")',True)
    append('ML-P-K1-1','wrong_unpaired_axis_sign',
        'scores2[:,0]*=-1\nax.clear()\nax.scatter(scores2[:,0],scores2[:,1])\nax.set(xlabel="PC1 score",ylabel="PC2 score")')
    append('ML-P-K1-1','wrong_view_coordinates',
        'ax.clear()\nax.scatter(scaled[:,0],scaled[:,1])\nax.set(xlabel="PC1 score",ylabel="PC2 score")')
    append('ML-P-K1-1','swapped_component_axis_names','ax.set(xlabel="PC2 score",ylabel="PC1 score")')
    for eid, output in (('ML-U03-3','answer'),('ML-U05-1','answer'),('ML-U05-2','answer'),
                        ('ML-U10-1','answer'),('ML-U-R1-3','answer'),('ML-U-R2-2','answer'),
                        ('ML-U-K1-1','profiles')):
        append(eid,'equivalent_reversed_labelled_group_rows',f'{output}={output}.iloc[::-1]',True)
        append(eid,'swapped_group_names_without_values',f'{output}.index={output}.index[::-1]')
        append(eid,'changed_group_values',f'{output}.iloc[0,0]+=.5')
        append(eid,'missing_group_row',f'{output}={output}.iloc[:-1]')
        append(eid,'duplicate_group_names',f'{output}.index=[{output}.index[0]]*len({output})')

    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    from sklearn.cluster import KMeans
    import numpy as np
    fixture = learning_fixture('PCA60_MIXED')
    ratios = PCA().fit(StandardScaler().fit_transform(fixture)).explained_variance_ratio_
    counts = {str(threshold):int(np.searchsorted(ratios.cumsum(),threshold)+1) for threshold in (.8,.9,.95)}
    assert counts['0.8'] != counts['0.95'] and counts['0.9'] > 2
    assert fixture.index.is_unique and not np.array_equal(fixture.index.to_numpy(),np.arange(len(fixture)))
    elongated = StandardScaler().fit_transform(learning_fixture('CLUSTER45_ANISO'))
    seed_inertias = [KMeans(n_clusters=4,n_init=1,random_state=seed).fit(elongated).inertia_ for seed in (1,2,3)]
    assert np.ptp(seed_inertias) > .1

    rows = []
    for eid,name,code,expected in cases:
        result = runtime['run_learning']({'exercise':units[eid],'code':code})
        accepted = not result['error'] and not result['retainedPythonObjects'] and all(c['status'] in ('correct','self-review') for c in result['checks'])
        row = dict(id=eid,case=name,expected_accept=expected,actual_accept=accepted,passed=expected==accepted,
                   code_sha256=hashlib.sha256(code.encode()).hexdigest(),
                   result={key:result[key] for key in ('error','checks','retainedPythonObjects')})
        rows.append(row)
        print(eid,name,'PASS' if row['passed'] else 'FAIL',flush=True)
    payload = dict(cards=len(cards),exercises=len(units),python_exercises=sum(e['kind']=='python' for e in units.values()),
                   fixture_invariants=dict(pca_ratios=ratios.tolist(),threshold_counts=counts,seed_inertias=seed_inertias),
                   registry_sha256=hashlib.sha256(json.dumps(registry,sort_keys=True).encode()).hexdigest(),
                   runtime_sha256=hashlib.sha256((ROOT/'ml-learning/runtime.py').read_bytes()).hexdigest(),
                   cases=rows,all_pass=all(row['passed'] for row in rows))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,indent=2)+'\n')
    assert payload['all_pass'], json.dumps([r for r in rows if not r['passed']],indent=2)
    print(f'{len(rows)} cases passed: {len(cards)} cards, {len(units)} exercises, {payload["python_exercises"]} reference solutions.')


if __name__ == '__main__':
    main()
