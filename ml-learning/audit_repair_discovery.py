"""Reviewed late repairs for discovery, PCA and the model-choice decks.

Stable exercise IDs are retained. Early Apply rounds use only the methods already
introduced; later reviews retrieve the same concepts through changed evidence.
"""
from authoring import py, reflect, decide
from packages import required

DECKS = {'clustering', 'pca', 'comparison'}
PCA_SETUP = '''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
X = df.copy()
scaler = StandardScaler().fit(X)
scaled = scaler.transform(X)
pca = PCA().fit(scaled)
scores = pca.transform(scaled)
'''
CLUSTER_SETUP = '''from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
X = df.copy()
scaled = StandardScaler().fit_transform(X)
'''

def _support(exercise, think, tools, approach, explanation):
    exercise.update(hints=dict(think=think, tools=tools, approach=approach), explanation=explanation)
    if exercise['kind'] == 'python':
        exercise['packages'] = required(exercise)
    return exercise

def _replace(card, number, exercise):
    old = card['exercises'][number - 1]
    exercise.update(id=old['id'], version=old.get('version', 1) + 1,
                    label=old['label'], demand=old.get('demand', 'Retrieve the method'))
    if old.get('modelBridge'):
        exercise.update(modelBridge=True, demand='Integrate the methods taught so far')
    card['exercises'][number - 1] = exercise
    return exercise

def _syntax(card, *parts):
    for code, meaning in parts:
        if code not in card['syntax']:
            card['syntax'] += '\n' + code
        if not any(p['code'] == code for p in card['syntaxBreakdown']):
            card['syntaxBreakdown'].append(dict(code=code, meaning=meaning))

def _reflection(card, number, task, answer, think, tools, approach):
    return _replace(card, number, _support(reflect(task, answer), think, tools, approach, answer))

def _group_table(actual, expected):
    """Align numeric group evidence by exact labels, allowing presentation order."""
    return (f"isinstance({actual},pd.DataFrame) and {actual}.index.is_unique "
            f"and len({actual})==len({expected}) "
            f"and {actual}.index.difference(({expected}).index).empty "
            f"and {actual}.columns.equals(({expected}).columns) "
            f"and np.allclose({actual}.reindex(({expected}).index).to_numpy(),({expected}).to_numpy())")

def apply(registry):
    cards = {c['id'].removeprefix('ML-'): c for c in registry['cards'] if c['deck'] in DECKS}
    # Methods used in later rounds need visible explanations, not only hint names.
    _syntax(cards['U02'],
        ('np.linalg.norm(row_a - row_b)', 'Subtracts matching coordinates, then takes their Euclidean distance. Compare raw and scaled geometry separately; the numerical distances use different units.'))
    _syntax(cards['U03'],
        ('labels = model.fit_predict(scaled)', 'Fits groups in the prepared geometry and returns one assignment for each input row.'),
        ('X.groupby(labels).mean()', 'Aggregates the original measurements by aligned assignments. Fit in scaled coordinates; report means in the original units.'))
    _syntax(cards['U05'],
        ('pd.Series(labels, index=X.index)', 'Attaches group assignments to observation IDs. An indexed Series aligns by row label during groupby even if its presentation order changes.'),
        ('labels.reindex(X.index)', 'Reorders an indexed assignment Series to match the observation table. Converting an unaligned Series straight to an array discards that link.'))
    _syntax(cards['U07'],
        ('linkage_matrix[:, 2]', 'The third linkage column stores each merge distance; rows follow merge order.'),
        ('linkage_matrix[:, 3]', 'The fourth linkage column stores how many original observations each merged group contains.'),
        ("dendrogram(linkage_matrix, truncate_mode='lastp', p=10)", 'Displays the last ten merged groups without refitting or cutting the stored hierarchy.'))
    _syntax(cards['U08'],
        ('pd.Series(cut_labels).value_counts()', 'Counts membership at one chosen cut; compare cuts from the same hierarchy rather than refitting merges.'))
    _syntax(cards['U09'],
        ('scaler = StandardScaler().fit(X)', 'Learns the declared population scale before selecting rows for the sampled hierarchy.'),
        ('scaler.transform(sample)', 'Applies those population statistics to the sampled rows. Fitting on the sample would define a different geometry.'))
    _syntax(cards['P02'],
        ('scaler.transform(incoming)', 'Uses the population scale already learned by fit. New rows do not update the means or standard deviations.'),
        ('pca.transform(scaler.transform(incoming))', 'Projects new rows with the same scale and component axes, preserving feature meanings, column order and row order.'))
    _syntax(cards['P03'],
        ('np.arange(1, len(ratios) + 1)', 'Labels the fitted components from one onwards; these numbers are component IDs, not feature names.'),
        ('sns.barplot(x=component_ids, y=ratios, ax=ax)', 'Draws one bar for each component’s explained-variance ratio.'))
    _syntax(cards['P04'],
        ('cumulative[-1]', 'For a full PCA this is approximately one. A PCA fitted with a component cap may omit variance, so its final cumulative ratio may fall short of a requested threshold.'),
        ('retained <= budget', 'Checks whether the smallest sufficient prefix fits a component storage limit; do not silently lower the stated variance requirement.'))
    _syntax(cards['P07'],
        ('np.outer(row_scores, axis_weights)', 'Forms the observation-by-feature contribution of one axis by multiplying each observation score by every feature weight.'),
        ('compressed = scores.copy()', 'Copies the coordinates before zeroing discarded components, preserving the full supplied scores for comparison.'),
        ('compressed[:, 2:] = 0', 'Removes all contributions after the first two components before inverse_transform reconstructs the scaled feature coordinates.'))

    # Parameter and population checks must describe the fitted result, not a
    # calculation which can be made true using arbitrary invented groups.
    e = cards['U03']['exercises'][1]
    e['checks'][0]['test'] = 'trace.cluster_assignment(cluster, distance, scaled, row=0, k=3)'
    e['checks'][0]['message'] = 'Use the first row’s assignment from a three-centroid fit on these scaled rows and measure its distance to that assigned centroid.'
    e['version'] += 1
    e = cards['U05']['exercises'][1]
    e['checks'][0]['test'] = _group_table('answer',"X.groupby(labels)[['bill_length_mm','bill_depth_mm']].mean()") + " and _scatter_matches(X.bill_length_mm,X.bill_depth_mm,labels,axis_quantities=('length','depth'))"
    e['checks'][0]['message'] = 'Keep the supplied group names beside their matching original-unit means, and draw the same observations with bill length/depth axes and distinct group markers.'
    e['version'] += 1
    e = cards['U03']['exercises'][2]
    solution = '''from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
X = df[['sugarpercent', 'pricepercent']]
scaled = StandardScaler().fit_transform(X)
model = KMeans(n_clusters=3, n_init=20, random_state=42).fit(scaled)
labels = model.labels_
answer = X.groupby(labels).mean()
'''
    new = py(e['task'], solution,
        "X.equals(df[['sugarpercent','pricepercent']]) and np.allclose(scaled,_prepared_values(X,numeric=list(X.columns))) and trace.cluster_partition(labels,scaled,k=3) and " + _group_table('answer','X.groupby(labels).mean()'), dataset='candy')
    new['reasoningPrompt'] = e.get('reasoningPrompt', '')
    _replace(cards['U03'], 3, _support(new,
        'Separate fitted distance geometry from the units in which people interpret the groups.',
        'Use StandardScaler, KMeans with three clusters, aligned labels and groupby.mean.',
        'Fit on the two stated measurements, preserve row-aligned assignments, then summarise the original values.',
        'A group profile reports measured sugar and price only. Neither its arbitrary ID nor this limited profile establishes healthiness.'))
    e = cards['U04']['exercises'][0]
    e['checks'][0]['test'] = "trace.cluster_stat(answer,scaled,'inertia',k=3)"
    e['checks'][0]['message'] = 'Report observed inertia from a three-cluster fit on the supplied scaled population.'
    e['version'] += 1
    # Elongation and unequal cluster sizes make this seed experiment different
    # from the initial equal-size compact blobs. Keep its controlled contrast.
    cards['U06']['exercises'][0]['dataset'] = 'CLUSTER45_ANISO'
    cards['U06']['exercises'][0]['task'] = 'On CLUSTER45_ANISO’s unequal-size elongated clouds, fit four-cluster K-Means with one initialisation for each seed 1, 2 and 3. Store each inertia in answer in seed order.'
    cards['U06']['exercises'][0]['version'] += 1

    # U07 entry guarantees U02, but not U04/U05/U08/U09. Integrate only scaling
    # and merge construction here; cutting and sampled profiles remain later.
    task = 'For every CLUSTER45_ANISO row, build Ward linkage once from the original measurements and once from their standardised values. Store the matrices in raw_linkage and scaled_linkage, and each final merge distance in raw_height and scaled_height. Explain why those two distance magnitudes cannot by themselves rank the representations.'
    solution = '''from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage
X = df[['length_mm', 'width_cm']]
scaled = StandardScaler().fit_transform(X)
raw_linkage = linkage(X, method='ward')
scaled_linkage = linkage(scaled, method='ward')
raw_height = float(raw_linkage[-1, 2])
scaled_height = float(scaled_linkage[-1, 2])
'''
    raw_reference = "__import__('scipy.cluster.hierarchy',fromlist=['linkage']).linkage(df[['length_mm','width_cm']],method='ward')"
    scaled_reference = "__import__('scipy.cluster.hierarchy',fromlist=['linkage']).linkage(_prepared_values(df,numeric=list(df.columns)),method='ward')"
    new = py(task, solution,
        "X.equals(df[['length_mm','width_cm']]) and np.allclose(scaled,_prepared_values(X,numeric=list(X.columns))) and raw_linkage.shape==(len(df)-1,4) and scaled_linkage.shape==(len(df)-1,4) and np.allclose(raw_linkage,"+raw_reference+") and np.allclose(scaled_linkage,"+scaled_reference+") and np.isclose(raw_height,raw_linkage[-1,2]) and np.isclose(scaled_height,scaled_linkage[-1,2])",
        dataset='CLUSTER45_ANISO', outputs=['raw_linkage', 'scaled_linkage', 'raw_height', 'scaled_height'])
    new['starter'] = '''from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage
# Keep the whole population; vary only its distance representation.
X = df[['length_mm', 'width_cm']]
scaled = ...
raw_linkage = ...
scaled_linkage = ...
# Column 2 records merge distances; -1 selects the final merge.
raw_height = ...
scaled_height = ...
'''
    new['reasoningPrompt'] = 'Explain how unequal units influence raw Ward geometry. The two merge heights use different distance units; a smaller number alone does not establish a better grouping.'
    _replace(cards['U07'], 4, _support(new,
        'Hold rows and Ward’s method fixed while changing the coordinate system.',
        'Use StandardScaler.fit_transform, linkage(method="ward") and linkage[-1, 2].',
        'Build the two hierarchies from matching rows, read their final distances, then qualify the comparison.',
        'Ward depends on the input geometry. Standardisation changes its meaning; raw and standardised merge distances are not a common-unit quality ranking. Cuts, silhouette and sampling are introduced in later cards.'))
    cards['U07']['minutes'] = '20–30'
    cards['U09']['exercises'][0]['setup'] = "X = df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]\n"
    cards['U09']['exercises'][0]['packages'] = required(cards['U09']['exercises'][0])
    solution = '''from sklearn.preprocessing import StandardScaler
X = df[['radius_mean','texture_mean','smoothness_mean','concavity_mean','symmetry_mean']]
scaler = StandardScaler().fit(X)
sample = X.sample(min(500,len(X)),random_state=42)
answer = scaler.transform(sample)
'''
    new = py('For the five Breast measurements radius_mean, texture_mean, smoothness_mean, concavity_mean and symmetry_mean, fit one scale on the full exploratory population. Keep a seed-42 sample of at most 500 original rows in sample and its population-scaled values in answer. Do not learn a new scale from the sample.', solution,
        "X.equals(df[['radius_mean','texture_mean','smoothness_mean','concavity_mean','symmetry_mean']]) and sample.equals(X.sample(min(500,len(X)),random_state=42)) and np.allclose(scaler.mean_,X.mean()) and np.allclose(scaler.scale_,X.std(ddof=0)) and answer.shape==sample.shape and np.allclose(answer,(sample.to_numpy()-X.mean().to_numpy())/X.std(ddof=0).to_numpy())",
        dataset='breast', outputs=['sample','answer'])
    _replace(cards['U09'], 2, _support(new,
        'The scale describes the population; the hierarchy will describe only sampled observations.',
        'Use StandardScaler.fit(X), capped sample with its original index, then scaler.transform(sample).',
        'Fit once on the full selected measurement table, select the reproducible sample, and transform without refitting.',
        'Keeping the full-population scale fixed separates a change of sampled observations from a change of learned geometry. The transformed rows remain aligned to the original-unit sample.'))

    # The no-claim lesson should inspect post-fit evidence rather than repeat
    # U05’s measurement means under an assign() wrapper.
    _syntax(cards['U10'],
        ("pd.crosstab(cluster_labels, reference_labels)", 'Counts observed group/reference combinations after fitting. This descriptive table must not be used retroactively to select features, k or a cut.'))
    old = cards['U10']['exercises'][0]
    new = py('After the supplied measurement-only fit, build answer as a table of cluster-by-reference class counts. Keep clusters on rows and the external labels A, B, C on columns. Explain why this post-fit table is not a supervised accuracy score.',
        "cluster_labels = pd.Series(labels, index=X.index, name='cluster')\nanswer = pd.crosstab(cluster_labels, df['label']).reindex(columns=['A','B','C'], fill_value=0)",
        _group_table('answer',"pd.crosstab(pd.Series(labels,index=X.index,name='cluster'),df['label']).reindex(columns=['A','B','C'],fill_value=0)"),
        dataset='CLASS180', setup=old['setup'])
    new['starter'] = new['solution']
    _replace(cards['U10'], 1, _support(new,
        'Keep external labels out of fitting and inspect their association only afterwards.',
        'Use pd.Series with the observation index, then pd.crosstab.',
        'Pair each supplied assignment with its reference class on the same row and count the pairs.',
        'A contingency table may help interpret groups. Arbitrary cluster IDs have no fixed one-to-one class meaning, and post-fit association does not validate universal types or predictive accuracy.'))
    cards['U10']['example'] = new['solution']

    _reflection(cards['P01'], 3,
        "A developer stores the first two original sensor columns in an array and calls it PCA because its shape is (n_rows, 2). Explain what is missing from that claim and how you would check the result’s meaning.",
        'Shape alone cannot distinguish selected measurements from learned component coordinates. PCA fits axes using the chosen measurements and projects rows onto those axes. Verify that the stored columns were produced by the fitted PCA transform, rather than by slicing two original columns.',
        'Separate the number of columns from what each column represents.',
        'Feature selection versus learned component coordinates.',
        'Trace where the two columns came from before accepting the dimensionality claim.')

    # Change transforms new, shifted values with supplied fitted state. Transfer
    # repairs an incoming column-order mismatch. Apply then fits and reuses that
    # representation on a second population without premature variance work.
    incoming_setup = PCA_SETUP + "incoming = X.iloc[[1,7,12]].copy()\nincoming.index = pd.Index(['new_7','new_2','new_9'],name='observation')\nincoming = incoming + pd.Series({'a':1.2,'b':-.7,'c':2.,'d':.4,'e':-.5})\n"
    new = py('Transform the three shifted observations in incoming using the supplied fitted scaler and PCA. Store the coordinates in answer in incoming row order. Do not refit either object on the incoming batch.',
        'answer = pca.transform(scaler.transform(incoming))',
        "np.asarray(answer).shape==(len(incoming),len(X.columns)) and np.allclose(answer,pca.transform(scaler.transform(incoming))) and not any(r['kind'] in ('fit','fit_transform') for r in trace.events)", dataset='PCA48', setup=incoming_setup)
    _replace(cards['P02'], 2, _support(new,
        'The incoming batch describes new observations, not new fitted statistics.',
        'Use the supplied scaler.transform and pca.transform; neither step calls fit.',
        'Apply the population scale first, then project onto the unchanged axes.',
        'A shifted batch is expressed in the original coordinate system. Refitting on it would change both centering and axes, preventing a direct coordinate comparison.'))
    penguin_setup = '''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
feature_names = ['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']
X = df[feature_names]
scaler = StandardScaler().fit(X)
pca = PCA().fit(scaler.transform(X))
incoming = X.iloc[[3,8,20]].copy()
incoming.index = pd.Index(['intake_3','intake_8','intake_20'],name='specimen')
incoming = incoming[['body_mass_g','flipper_length_mm','bill_depth_mm','bill_length_mm']]
'''
    new = py('The incoming Penguin measurements have the fitted feature names in a different order. Select them in feature_names order, reuse the supplied fitted scaler and PCA, and store answer as a score dataframe with incoming row IDs and columns PC1, PC2, PC3, PC4. Explain why matching names also requires matching measurement units.',
        "ordered = incoming[feature_names]\nanswer = pd.DataFrame(pca.transform(scaler.transform(ordered)), index=incoming.index, columns=['PC1','PC2','PC3','PC4'])",
        "isinstance(answer,pd.DataFrame) and answer.index.equals(incoming.index) and list(answer.columns)==['PC1','PC2','PC3','PC4'] and np.allclose(answer.to_numpy(),pca.transform(scaler.transform(incoming[feature_names]))) and not any(r['kind'] in ('fit','fit_transform') for r in trace.events)", dataset='penguins', setup=penguin_setup)
    _replace(cards['P02'], 3, _support(new,
        'Reusing fitted state includes the feature schema, not only the object names.',
        'Select incoming[feature_names]; transform without refitting; label rows with incoming.index.',
        'Restore the fitted input-column order, apply the two transforms, then preserve the incoming observation IDs.',
        'The reordered incoming table must follow the fitted feature contract. Reordering can repair column placement; different measurement units require correction at the data boundary.'))
    _syntax(cards['P02'], ('incoming[feature_names]', 'Selects incoming columns in the exact order used to fit the scaler and PCA.'),
        ('pd.DataFrame(coordinates, index=incoming.index)', 'Preserves incoming observation IDs alongside their transformed coordinates.'))
    setup = "incoming = df.iloc[[2,9,17,25]].copy()\nincoming.index = pd.Index(['batch_20','batch_11','batch_04','batch_31'],name='observation')\nincoming = incoming + pd.Series({'a':.6,'b':-.5,'c':.3,'d':1.4,'e':-.9})\n"
    solution = '''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
X = df[['a','b','c','d','e']]
scaler = StandardScaler().fit(X)
scaled = scaler.transform(X)
pca = PCA().fit(scaled)
training_scores = pca.transform(scaled)
incoming_scores = pd.DataFrame(pca.transform(scaler.transform(incoming)), index=incoming.index,
                               columns=['PC1','PC2','PC3','PC4','PC5'])
'''
    new = py('Fit a reusable scale and full PCA on all PCA60_MIXED measurements. Store the fitted-population coordinates in training_scores, then transform the supplied shifted batch into incoming_scores with its original observation IDs and columns PC1 through PC5. Keep the fitted-population scale and axes for both tables.', solution,
        "X.equals(df[['a','b','c','d','e']]) and np.allclose(scaler.mean_,X.mean()) and np.allclose(scaler.scale_,X.std(ddof=0)) and np.allclose(scaled,_prepared_values(X,numeric=list(X.columns))) and training_scores.shape==X.shape and np.allclose(training_scores,pca.transform(scaled)) and incoming_scores.index.equals(incoming.index) and list(incoming_scores.columns)==['PC1','PC2','PC3','PC4','PC5'] and np.allclose(incoming_scores.to_numpy(),pca.transform(scaler.transform(incoming))) and sum(r['kind'] in ('fit','fit_transform') and r['estimator']=='StandardScaler' and r['depth']==0 for r in trace.events)==1 and sum(r['kind'] in ('fit','fit_transform') and r['estimator']=='PCA' and r['depth']==0 for r in trace.events)==1",
        dataset='PCA60_MIXED', setup=setup, outputs=['training_scores','incoming_scores'])
    # py’s observed population checks plus learned statistics enforce the fit;
    # reject any extra preparation/PCA fit on the incoming rows explicitly.
    new['starter'] = '''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
# Fit only on the original population.
X = df[['a','b','c','d','e']]
scaler = ...
scaled = ...
pca = ...
training_scores = ...
# Reuse those fitted objects for the shifted incoming rows.
incoming_scores = ...
'''
    _replace(cards['P02'], 4, _support(new,
        'Keep fitting population and incoming population separate while sharing one coordinate system.',
        'Use StandardScaler.fit and transform, PCA.fit and transform, and a dataframe with incoming.index.',
        'Learn the scale and axes once on df, project df, then project incoming without another fit.',
        'The second population receives coordinates from the first population’s representation. Explained variance, retention thresholds and component weights are taught in subsequent cards.'))
    cards['P02']['minutes'] = '20–30'
    cards['P04']['exercises'][1]['dataset'] = 'PCA60_MIXED'
    cards['P04']['exercises'][1]['version'] += 1

    # Keep the purposeful 80/95% controlled contrast. Add a binding storage
    # constraint to Transfer rather than repeat the same rule on another schema.
    solution = '''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
X = df[[c for c in df if c.endswith(('_mean','_se','_worst'))]]
scaled = StandardScaler().fit_transform(X)
pca = PCA().fit(scaled)
retained = int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_), .9) + 1)
budget_met = bool(retained <= 8)
'''
    new = py('A Breast measurement archive permits at most eight component coordinates per row but requires at least 90% variance. Fit scaled PCA on all 30 measurement columns. Store the smallest sufficient count in retained and whether it meets the storage cap in budget_met. Explain why taking eight axes without checking retention does not fulfil the requirement.', solution,
        "X.equals(df[[c for c in df if c.endswith(('_mean','_se','_worst'))]]) and np.allclose(scaled,_prepared_values(X,numeric=list(X.columns))) and retained==int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1) and isinstance(budget_met,(bool,np.bool_)) and budget_met==(retained<=8)",
        dataset='breast', outputs=['retained','budget_met'])
    _replace(cards['P04'], 3, _support(new,
        'A compression threshold and a storage budget are two constraints that can conflict.',
        'Use ordered explained_variance_ratio_, np.cumsum, first-threshold lookup and retained <= 8.',
        'Find the smallest sufficient prefix before checking the cap; report infeasibility without relaxing the variance requirement.',
        'A fixed number of saved components does not imply the required variation was preserved. If the minimum sufficient count exceeds eight, this representation cannot meet both stated requirements.'))
    # P06’s key contrast needs data on which a 2D picture is actually smaller
    # than the retained representation.
    for e in cards['P06']['exercises'][:2]:
        e['dataset'] = 'PCA60_MIXED'
        e['version'] += 1
    cards['P06']['dataset'] = 'PCA60_MIXED'
    e = cards['P07']['exercises'][1]
    e['outputs'] = ['weights', 'flipped_scores', 'answer']
    e['task'] = 'Store the sign-flipped first-axis weights in weights and its sign-flipped row scores in flipped_scores. Form their rank-one reconstruction in answer and verify it equals the original contribution.'
    e['checks'][0]['test'] = 'np.allclose(weights,-pca.components_[0]) and np.allclose(flipped_scores,-scores[:,0]) and np.allclose(answer,np.outer(scores[:,0],pca.components_[0]))'
    e['checks'][0]['message'] = 'Reverse both the first axis and its row scores, then show that their reconstructed contribution is unchanged.'
    e['version'] += 1

    # Reviews change the evidence or operation being retrieved, preserving the
    # original conceptual route and stable count of exercises.
    _reflection(cards['U-R1'], 1,
        'An analyst fits groups without species but chooses k by whichever grouping most resembles species, then calls the result label-independent discovery. Identify the contaminated decision and propose a valid way to use species afterwards.',
        'Fitting omitted species, but selection of k still used that reference label. Select a grouping from measurement geometry, profiles and exploratory purpose before inspecting species. A later descriptive comparison with species can inform interpretation without becoming the fitting or selection objective.',
        'Trace selection as well as fitting.', 'Feature and selection boundaries in discovery.', 'Identify the decision that used the reference, then move that comparison after a justified label-independent choice.')
    _reflection(cards['U-R1'], 2,
        'Same rows and geometry: k=2 has silhouette .58 and group sizes 40/20; k=3 has .57 and sizes 40/16/4. The four-row group has unusually high sugar but ordinary price. A bulk-pricing team wants broad tiers; a reformulation team wants unusual sugar profiles. Give a defensible resolution for each purpose and a caution about the small group.',
        'The pricing team may prefer k=2 for broad stable tiers; the reformulation team may prefer k=3 to inspect the four unusual sugar profiles. The small silhouette difference does not settle both purposes. Check original-unit profiles and the stability and adequacy of the four observations before naming a persistent category.',
        'Tie a resolution to the question it helps answer.', 'Common geometry, silhouette, group sizes and original-unit profiles.', 'Use the supplied sizes and sugar/price meaning to explain different choices for the two purposes.')
    setup = CLUSTER_SETUP + "shuffled_labels = pd.Series(KMeans(n_clusters=3,n_init=20,random_state=42).fit_predict(scaled),index=X.index,name='cluster').sample(frac=1,random_state=17)\n"
    solution = 'labels = shuffled_labels.reindex(X.index)\nanswer = X.groupby(labels).mean()\nsizes = labels.value_counts()'
    new = py('The CLUSTER45_ANISO assignment file shuffled its row order but retained observation IDs. Align shuffled_labels to X.index, then store original-unit means in answer and labelled group counts in sizes. A direct .to_numpy() before alignment would attach assignments to the wrong observations.', solution,
        "isinstance(labels,pd.Series) and labels.index.equals(X.index) and _same_partition(labels.to_numpy(),shuffled_labels.reindex(X.index).to_numpy()) and " + _group_table('answer','X.groupby(labels).mean()') + " and _labelled_counts_match(sizes,labels.value_counts())",
        dataset='CLUSTER45_ANISO', setup=setup, outputs=['answer','sizes'])
    new['starter'] = '# Restore the observation-to-assignment relationship before summarising.\nlabels = ...\nanswer = ...\nsizes = ...\n'
    _replace(cards['U-R1'], 3, _support(new,
        'Row order can change while observation IDs preserve the relationship.',
        'Use Series.reindex, original-unit groupby.mean and labelled value_counts.',
        'Align assignments by ID, then compute both summaries from those aligned assignments.',
        'Shuffled label presentation is harmless when IDs are used. Positional conversion before alignment changes the grouping and corrupts reported profiles.'))
    _reflection(cards['U-R2'], 1,
        'Two Ward analyses use the same items. One records length in mm, the other converts length to cm; width remains in cm. Neither scales the measurements. A report treats their final merge heights as comparable evidence and says only the axis label changed. Identify both problems and a fair geometry comparison.',
        'The numeric unit change changes the relative feature contribution to raw distance and can change merges, not just the label. The merge-height magnitudes also use different coordinate scales. Use consistent units and a common scientifically justified representation before comparing algorithms or cuts; standardisation can make this declared unit conversion equivalent.',
        'Changing a feature’s unit changes raw distance geometry.', 'Ward merge distances and standardisation.', 'Separate changed merge structure from incomparable distance magnitudes, then state the common representation.')
    setup = '''from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage, cut_tree
X = df.copy()
sample = X.sample(18,random_state=42)
scaler = StandardScaler().fit(X)
scaled_sample = scaler.transform(sample)
linkage_matrix = linkage(scaled_sample,method='ward')
labels = pd.Series(cut_tree(linkage_matrix,n_clusters=3).ravel(),index=sample.index,name='cluster')
'''
    new = py('The Ward hierarchy labels only the supplied 18-row sample. Store its original-unit group means in answer and the exact labelled observation IDs in population_ids, in sample row order. Use the population-fitted scale already supplied; do not report profiles for all rows of df.',
        'answer = sample.groupby(labels).mean()\npopulation_ids = sample.index.tolist()',
        _group_table('answer','sample.groupby(labels).mean()') + " and list(population_ids)==sample.index.tolist()",
        dataset='CLUSTER45_ANISO', setup=setup, outputs=['answer','population_ids'])
    _replace(cards['U-R2'], 2, _support(new,
        'The fitted scale may describe the full population while hierarchy assignments describe only sampled rows.',
        'Use the supplied sample and its indexed labels for groupby.mean; retain sample.index.',
        'Report the same original rows that received Ward assignments and make their identities explicit.',
        'Scaling population and labelled hierarchy population are different contracts here. Sample profiles describe only the sampled observations.'))
    _reflection(cards['U-R2'], 3,
        'A report says: “A Ward cut on 18 sampled items proves three natural types in all 45 items. Group 0 is the highest-quality type.” The profiles include only length and width. Identify three unsupported claims and rewrite the conclusion with the evidence needed for wider use.',
        'The unsampled items received no hierarchy assignments; three types are a chosen cut rather than established natural classes; length and width do not measure quality, and group 0 is an arbitrary identifier. Describe the sampled rows under the stated scaled geometry and cut, report their measured profiles, and seek wider representative measurements and relevant quality evidence before making population or quality claims.',
        'Audit population, group truth and measurement meaning separately.', 'Sample scope, arbitrary group IDs and measured profiles.', 'Remove each unsupported claim and specify the observations or variables needed to support a wider claim.')
    new = py('Repair this variance report: its starter cumulatively sums explained_variance_ in raw variance units and uses zero-based search positions as counts. Using the supplied fitted PCA60_MIXED, return the cumulative explained-variance ratios in cumulative and the smallest sufficient counts for 80% and 95% in retained_80 and retained_95.',
        'cumulative = np.cumsum(pca.explained_variance_ratio_)\nretained_80 = int(np.searchsorted(cumulative,.8)+1)\nretained_95 = int(np.searchsorted(cumulative,.95)+1)',
        '_pca_retention_matches(cumulative,retained_80,retained_95)', dataset='PCA60_MIXED', setup=PCA_SETUP,
        outputs=['cumulative','retained_80','retained_95'])
    new['starter'] = 'cumulative = np.cumsum(pca.explained_variance_)\nretained_80 = int(np.searchsorted(cumulative,.8))\nretained_95 = int(np.searchsorted(cumulative,.95))\n'
    _replace(cards['P-R1'], 1, _support(new,
        'A fraction-of-total requirement needs ratios, and a retained prefix needs a count.',
        'Recall explained_variance_ratio_, cumulative sums and zero-based threshold positions.',
        'Repair the units before repairing the index-to-count conversion; test both thresholds on one fitted spectrum.',
        'Explained variances and explained-variance ratios are different quantities. A threshold lookup is a position until converted into the number of retained leading components.'))
    new = py('The supplied reported table is feature-by-component weights but was published as observation coordinates. Replace it with answer as the first-two-component score dataframe for PCA60_MIXED, preserving X observation IDs and columns PC1, PC2. Explain why transposing the published table alone cannot produce one coordinate row per observation.',
        "answer = pd.DataFrame(scores[:,:2],index=X.index,columns=['PC1','PC2'])",
        "isinstance(answer,pd.DataFrame) and answer.shape==(len(X),2) and answer.index.equals(X.index) and list(answer.columns)==['PC1','PC2'] and np.allclose(answer.to_numpy(),scores[:,:2])",
        dataset='PCA60_MIXED', setup=PCA_SETUP+"reported = pd.DataFrame(pca.components_[:2].T,index=X.columns,columns=['PC1','PC2'])\n")
    _replace(cards['P-R1'], 2, _support(new,
        'Identify what a row means before joining a representation to observation metadata.',
        'Recall component weights versus scores and preserve X.index when constructing a dataframe.',
        'Use row coordinates from the fitted transform, not a transposed feature-weight table.',
        'Weights describe axes using features; scores describe observations on axes. Their row identities and dimensions differ, so transposition cannot convert one into the other.'))
    _reflection(cards['P-R1'], 3,
        'Analysis A fits and selects PCA from measurements alone, then colours its fixed 2D display by an external label. Analysis B tries several component subsets and publishes whichever display best separates that label. Which analysis supports a label-independent representation claim, and what predictive evidence is still missing from both?',
        'Only A kept the reference out of representation selection. B used it to select a view, so its apparent separation is selected evidence. Neither supplies held-out predictive evaluation, proves class recovery in omitted dimensions, or identifies causal factors. If prediction is the goal, selection must occur within an appropriate supervised validation design.',
        'Trace the entire analysis history rather than only the final fit call.', 'Post-fit colouring versus reference-guided selection.', 'Identify where the label enters each workflow and distinguish a descriptive view from validated prediction.')
    _reflection(cards['M-R1'], 1,
        'Three briefs request: (a) estimated hours until a repair finishes, (b) a nested account-group hierarchy to inspect several resolutions, and (c) fewer numeric sensor coordinates for storage. Name a suitable output artifact for each, identify which needs labelled outcomes, and reject a single accuracy ranking across all three.',
        'Repair forecasting returns numeric predictions and errors in hours and needs historical durations. Nested discovery returns a linkage/hierarchy with qualified group profiles; compression returns PCA coordinates with retention evidence. The latter two do not need a prediction target. Their geometrical and retention summaries are not supervised accuracy scores and cannot be ranked on a common accuracy leaderboard.',
        'Start from the requested artifact and its evidence.', 'Prediction outputs, Ward hierarchy and PCA representation.', 'Match each brief to a result with meaningful units or structure and state whether an outcome is required.')
    _reflection(cards['M-R1'], 2,
        'A hospital compares model A with shuffled visits and model B with whole-patient folds. Several visits belong to each patient. A scores higher. Repair the evaluation plan for predicting outcomes for previously unseen patients and state what the existing score difference can establish.',
        'Both candidates need matching folds that keep every visit from one patient on the same side. Reserve final patients before selection and fit preparation inside each training fold. Re-evaluate both models under that common unseen-patient design. The existing gap combines a model change with a leakage/validation-design change and cannot isolate estimator quality.',
        'The intended new unit is a patient, not another visit from a known patient.', 'Grouped populations, common evaluation and fold-local preparation.', 'Keep repeated entities together, specify a common design, then discard the old unfair ranking.')
    _reflection(cards['M-R1'], 3,
        'A workshop’s five matching folds give mean dummy/line/tree RMSE 9.0/6.2/6.1 hours. Paired tree-minus-line differences are [-.2,.1,-.1,-.2,-.1] hours. The line answers in 1 ms and the tree in 8 ms; the intake system permits at most 2 ms. Nominate a feasible candidate, state the demonstrated gain and one uncertainty, and say when to use the final test.',
        'The line meets the 2 ms constraint; the tree as measured does not. The line’s mean validation RMSE is 2.8 hours below the dummy. Tree-versus-line differences are small and not consistent on every fold, so do not claim universal superiority. Nominate the line from this training evidence and practical constraint, freeze its recipe, then evaluate reserved rows once. Validation variation and future population changes still limit the claim.',
        'A small predictive difference does not override a binding use constraint.', 'Matched fold differences, dummy improvement, latency and final-test discipline.', 'Check feasibility, quantify the useful comparison in hours, then nominate before final evaluation.')

    # Exact feature selection and coherent output/figure evidence at checkpoints.
    e = cards['U-K1']['exercises'][0]
    e['checks'][2]['test'] = 'len(labels)==len(X) and trace.cluster_partition(labels,scaled,k=len(np.unique(labels)))'
    e['checks'][3]['test'] = '_labelled_counts_match(sizes,pd.Series(labels).value_counts()) and ' + _group_table('profiles','X.groupby(labels).mean()')
    e['checks'].insert(-1,dict(name='Visible group evidence',test="_scatter_matches(X.length_mm,X.width_cm,labels,axis_quantities=('length','width'))",message='Draw the stated length/width population with labels from the chosen grouping and labelled axes.'))
    e['task'] = 'Scale every CLUSTER36B observation, compare k=2 through 8 with inertia and silhouette, choose a defensible fitted grouping, and store evidence, labels, sizes and original-unit profiles. Draw length against width with distinct group markers and labelled axes, then qualify the interpretation.'
    e['version'] += 1
    e = cards['U05']['exercises'][0]
    e['checks'][0]['test'] = _group_table('answer','X.groupby(labels).mean()') + ' and _labelled_counts_match(sizes,pd.Series(labels).value_counts())'
    e['checks'][0]['message'] = 'Match every supplied group name to its original-unit means and count. Labelled summary rows may appear in any order.'
    e['version'] += 1
    e = cards['P-K1']['exercises'][0]
    e['checks'][0]['test'] = "X.equals(df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']])"
    e['checks'][0]['message'] = 'Keep exactly the four declared Penguin measurements in that order, with all original rows; exclude species, year and context fields.'
    e['checks'].append(dict(name='Separate two-axis display',test="_scatter_matches(scores2[:,0],scores2[:,1],axis_quantities=('pc1','pc2'))",message='Plot the two saved component coordinates with labelled PC1/PC2 axes, independently of the retained dimensionality.'))
    e['task'] = 'Fit PCA on exactly bill_length_mm, bill_depth_mm, flipper_length_mm and body_mass_g for every Penguin. Retain the smallest component prefix reaching 90%, label PC1/PC2 feature weights, and report the separate two-coordinate scores2 view with a labelled scatter plot.'
    e['version'] += 1
    # Generic appended hints falsely speak about Python when the activity asks
    # for scientific interpretation. Make the remaining transfer support local.
    for short, number, tools in [('U01',3,'Unlabelled segmentation versus a defined future target.'), ('U06',3,'Centroid geometry, stability, group sizes and substantive usefulness.'), ('U10',3,'Sample scope, feature meanings and evidence for a new population.'), ('M04',3,'Selection into observed data, outcome availability and population shift.')]:
        cards[short]['exercises'][number-1]['hints']['tools'] = tools
    return registry
