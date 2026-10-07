"""Late assembled repairs for Foundations, Workflow and Regression.

Every replacement regenerates the authoring helper's fitting/prediction contract.
Only these three deck populations are changed; no learner state is retained.
"""
import copy

REPAIR_NOTES = {}


def apply(registry):
    from authoring import py, reflect, decide
    from packages import required
    cards = {c['id']: c for c in registry['cards']}

    def put(cid, position, exercise, reason, *, hints=None, explanation=None, starter=None):
        card = cards['ML-' + cid]
        old = card['exercises'][position - 1]
        replacement = copy.deepcopy(exercise)
        for name in ('id', 'label', 'visual'):
            if name in old:
                replacement.setdefault(name, copy.deepcopy(old[name]))
        replacement['version'] = old.get('version', 1) + 1
        if replacement['kind'] == 'python':
            replacement['dataset'] = replacement.get('dataset') or card.get('dataset') or 'LINE24'
            replacement['packages'] = required(replacement)
        if hints is not None:
            replacement['hints'] = dict(zip(('think', 'tools', 'approach'), hints))
        if explanation is not None:
            replacement['explanation'] = explanation
        if starter is not None:
            replacement['starter'] = starter
        card['exercises'][position - 1] = replacement
        REPAIR_NOTES[replacement['id']] = reason
        return replacement

    def support(cid, code, meaning):
        card = cards['ML-' + cid]
        if code not in card['syntax']:
            card['syntax'] += '\n' + code
        card.setdefault('syntaxBreakdown', []).append(dict(code=code, meaning=meaning))

    def check(e, name, test, message):
        e['checks'].append(dict(name=name, test=test, message=message))

    split_line = """from sklearn.model_selection import train_test_split
X = df[['distance']]
y = df['duration']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, random_state=42)
"""
    intake_split = """from sklearn.model_selection import train_test_split
X = df[['backlog_at_open', 'device_age_years']]
y = df['completion_hours']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, random_state=42)
"""
    process_split = """X_train = df[['temperature_c', 'pressure_bar']].iloc[:24]
X_test = df[['temperature_c', 'pressure_bar']].iloc[24:]
"""

    put('F01', 3, reflect(
        'A manager asks you to predict which customers will cancel next month. The table contains current usage measurements but no historical cancellation outcomes. Can clustering those measurements establish accurate cancellation predictions? Identify the missing evidence and one honest exploratory question the table can answer.',
        'Cancellation prediction requires historical outcomes aligned to inputs available before cancellation. Clusters describe similarity in the supplied measurements; they do not establish cancellation labels or predictive accuracy. Obtain suitable outcome data for supervised evaluation, or explicitly study usage patterns without claiming that a cluster predicts cancellation.'),
        'Replaces the repeated prediction/grouping/PCA triad with diagnosing a missing target and an unsupported predictive claim.',
        hints=('The request is about a later outcome, whereas the table only describes present inputs.', 'Distinguish an observed target from an unsupervised group assignment.', 'Name what would make prediction evaluable, then state a narrower question supported by the available table.'))

    cards['ML-F02']['explanation'] += ' A feature must be available when the prediction is needed. A numeric record identifier is still an identifier; a later invoice is an outcome record, even if both look numeric.'
    put('F02', 2, py(
        'For delivery planning, distance and weight are measured at dispatch; duration is recorded after completion. Create the two-column feature dataframe X and its aligned outcome Series y. Keep distance before weight.',
        "X = df[['distance', 'weight']]\ny = df['duration']",
        "X.equals(df[['distance','weight']]) and y.equals(df['duration'])", dataset='MIX60', outputs=['X', 'y']),
        'Turns the one-to-two-feature change into a complete aligned feature/target construction instead of an unnamed two-column answer.',
        hints=('Keep the observation rows aligned while changing the number of inputs.', 'A list of column names retains a dataframe; one outcome column produces a Series.', 'Choose the inputs by their dispatch-time meaning, then select the later outcome separately.'),
        explanation='Two available predictors belong in X; the later quantity to predict belongs in y, with the same observation indices.')
    put('F02', 3, py(
        'At repair intake, estimate completion time. case_id is an administrative number, backlog_at_open and device_age_years are known at intake, completion_hours is measured when work finishes, and invoice_hours is recorded on the completed invoice. Choose X and y from these roles; preserve backlog before age and the original observation indices.',
        "X = df[['backlog_at_open', 'device_age_years']]\ny = df['completion_hours']",
        "X.equals(df[['backlog_at_open','device_age_years']]) and y.equals(df['completion_hours'])", dataset='INTAKE48', outputs=['X', 'y']),
        'Supplies actual numeric-ID and post-outcome distractors, requiring a prediction-time schema choice and aligned X/y.',
        hints=('Numeric storage alone does not decide a column’s role.', 'Use the intake-time dictionary, dataframe feature selection and Series target selection.', 'Select measurements available at intake; exclude the administrative ID and the completed invoice.'),
        explanation='The inputs describe the state at intake. completion_hours is the later target. Neither administrative ordering nor a completed invoice is an intake measurement.')

    support('F07', 'len(X_part)', 'Counts the observations in one feature partition; a fraction and an integer row allocation are different objects.')
    support('F07', 'X_part.index.equals(y_part.index)', 'Returns True only when feature and target rows have the same observation indices in the same order; splitting or sorting them separately can break this alignment.')
    put('F07', 2, py(
        'Compare 20% and 25% final holdouts on these 24 observations, both seed 42. Keep the four 25% split objects. Return allocation, indexed 20% then 25%, with train_rows and test_rows columns. Explain the trade-off between fitting data and independent evaluation data.',
        split_line + "original_train_rows, original_test_rows = len(X_train), len(X_test)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.25, random_state=42)\nallocation = pd.DataFrame({'train_rows':[original_train_rows,len(X_train)],'test_rows':[original_test_rows,len(X_test)]},index=['20%','25%'])",
        "_split_matches(df[['distance']],df['duration'],X_train,X_test,y_train,y_test,test_size=.25) and allocation.equals(pd.DataFrame({'train_rows':[19,18],'test_rows':[5,6]},index=['20%','25%']))", dataset='LINE24', outputs=['allocation','X_train','X_test']),
        'Preserves the controlled holdout-size contrast and adds observed allocation evidence and its practical trade-off.',
        hints=('A fraction is converted into an integer row allocation; inspect the actual partition sizes.', 'train_test_split and len; build a labelled comparison dataframe.', 'Run each declared holdout fraction on the same X/y and seed, recording train and test counts.'),
        explanation='On 24 rows the choices reserve five or six observations. A larger holdout leaves fewer fitting rows and supplies more evaluation rows; neither fraction guarantees a sound sampling design.')
    choice_setup = intake_split + """candidate_splits = {
    'joint': (X_train.copy(), X_test.copy(), y_train.copy(), y_test.copy()),
    'sorted_target': (X_train.copy(), X_test.copy(), y_train.sort_values(), y_test.sort_values())
}
"""
    put('F07', 3, py(
        'Two reproducible candidate_splits are supplied for the repair table. Each contains (training X, test X, training y, test y), but one separately sorts the outcomes after splitting. Inspect row identities and order, then store the key of the candidate that keeps both feature/target pairs aligned in answer. Explain why reproducibility alone does not make the other candidate valid.',
        "answer = next(name for name, (a,b,c,d) in candidate_splits.items() if a.index.equals(c.index) and b.index.equals(d.index))",
        "answer == 'joint'", dataset='INTAKE48', setup=choice_setup),
        'Replaces another identical split recipe with detecting a reproducible but misaligned target population.',
        hints=('Pair each outcome with the observation it came from, not its rank after sorting.', 'Inspect candidate_splits and compare the feature and target indices with index.equals.', 'Both the training pair and test pair must preserve the same observation order.'),
        explanation='Only the joint split keeps the original targets with their feature rows. The other partition is reproducible and has the right sizes but assigns outcomes to the wrong observations.')
    # Keep the introductory exercise within the already taught syntax: an
    # explicit inspection is equivalent to the compact iteration in the solution.
    cards['ML-F07']['exercises'][2]['solution'] = "training_X, test_X, training_y, test_y = candidate_splits['joint']\nprint(training_X.index.equals(training_y.index), test_X.index.equals(test_y.index))\nanswer = 'joint'\n"

    put('F08', 3, reflect(
        'A clinic wants to prepare tomorrow’s staff. It can either predict each patient’s department or estimate the total minutes of care needed. Which output directly supports the staffing question? Explain what a department classifier would still leave unknown and which historical outcome you would collect.',
        'Total care minutes supports a quantitative workload estimate and calls for regression, with historical care duration measured consistently. Department classification answers a different question; labels alone do not give the amount of care within each department. Confirm the planning horizon and which patient inputs are available at the scheduling time.'),
        'Replaces a second numeric-code-versus-quantity example with choosing the output that answers an operational question.',
        hints=('A label and an amount can both be legitimate outputs, but they answer different planning questions.', 'Regression predicts measured quantities; classification predicts labels.', 'Connect the chosen output to staff workload and identify the historical outcome needed to train it.'))

    lab_split = """from sklearn.model_selection import train_test_split
X = df[['signal','speed_rpm']]
y = df['status']
X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
"""
    put('F09', 3, py(
        'LAB90 contains 63 routine, 18 watch and 9 urgent samples. Split the available signal/speed measurements and status labels 80/20, seed 42, with stratification. Return answer with population, training and test class-count columns, indexed by sorted status labels. Use the actual counts to explain why stratification does not manufacture more urgent observations.',
        lab_split + "answer = pd.DataFrame({'population':y.value_counts(), 'training':y_train.value_counts(), 'test':y_test.value_counts()}).sort_index()",
        "_split_matches(df[['signal','speed_rpm']],df.status,X_train,X_test,y_train,y_test,stratified=True) and answer.equals(pd.DataFrame({'population':df.status.value_counts(),'training':y_train.value_counts(),'test':y_test.value_counts()}).sort_index())", dataset='LAB90'),
        'Uses genuine class imbalance and requires evidence about absolute minority support across the full/train/test populations.',
        hints=('Percentages can look preserved while the minority test count is still small.', 'Stratified train_test_split, value_counts, and a dataframe of aligned labelled Series.', 'Inspect all three count columns; relate urgent evaluation support to the nine original examples.'),
        explanation='The stratified split yields routine/watch/urgent test counts 13/3/2. It preserves approximate representation but leaves only two urgent test observations; it cannot create independent evidence.')

    process_task = 'PROCESS30 has 24 earlier training observations and six later observations from a hotter, higher-pressure period. The starter incorrectly fits a scaler on all 30 rows. Repair the fit boundary; return the transformed later rows in answer and the two learned training means in learned_means, indexed by feature. Keep temperature before pressure. Explain what the large transformed later values reveal about the population shift.'
    process_solution = """from sklearn.preprocessing import StandardScaler
scaler = StandardScaler().fit(X_train)
answer = scaler.transform(X_test)
learned_means = pd.Series(scaler.mean_, index=X_train.columns)
"""
    e = put('W03', 3, py(process_task, process_solution,
        "answer.shape==X_test.shape and np.allclose(answer,(X_test.to_numpy()-X_train.mean().to_numpy())/X_train.std(ddof=0).to_numpy()) and isinstance(learned_means,pd.Series) and list(learned_means.index)==list(X_train.columns) and np.allclose(learned_means,X_train.mean())",
        dataset='PROCESS30', setup=process_split, outputs=['answer','learned_means']),
        'Supplies genuinely faulty executable scaling and a held-away distribution shift; requires learned statistics as well as transformed values.',
        hints=('Later observations must not change the coordinate system learned from earlier training rows.', 'StandardScaler.fit on X_train, then transform on X_test; mean_ reports learned means.', 'Replace the full-population fit and inspect later values relative to the training distribution.'),
        explanation='Training-fitted means preserve the evaluation boundary. Later standardized values remain large because that population has shifted; refitting would conceal the change and reuse evaluation information.',
        starter="from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(df[['temperature_c','pressure_bar']])  # Repair this fit boundary.\nanswer = scaler.transform(X_test)\nlearned_means = pd.Series(scaler.mean_, index=X_train.columns)\n")
    check(e, 'No fitting later rows', "not any(event['kind'] in ('fit','fit_transform') and event.get('rows') and set(event['rows']) & set(map(str,X_test.index)) for event in trace.events)", 'Later observations are transform-only; remove the full-table or later-row fit rather than adding another training fit below it.')
    support('W03', 'scaler.mean_', 'The learned mean for each fitted feature, in fitted feature order. Reading it does not learn new statistics.')
    support('W05', 'prepared[:, -1]', 'For a two-dimensional NumPy array, the comma separates row and column selection: : keeps every row and -1 selects the last column. For example, np.array([[4,7],[5,8]])[:, -1] returns [7,8].')
    support('W08', 'StratifiedKFold(n_splits=5, shuffle=True, random_state=42).split(X_train, y_train)', 'Like KFold, this returns training/validation positions; additionally y_train guides class representation. Only the declared development rows participate, while final-test rows stay outside.')
    cards['ML-W08']['explanation'] += ' For classification, StratifiedKFold uses the aligned training labels when constructing folds. It cannot create minority examples.'
    put('W08', 3, py(
        'LAB90 has imbalanced status labels. Its supplied X_train/y_train are the development population, with final-test rows already reserved. Construct five shuffled StratifiedKFold splits, seed 42, and store their (training positions, validation positions) pairs in answer. Explain why giving the splitter all 90 rows would violate this boundary.',
        "from sklearn.model_selection import StratifiedKFold\nanswer = list(StratifiedKFold(5,shuffle=True,random_state=42).split(X_train,y_train))",
        "_folds_match(answer,X_train,y_train,kind='StratifiedKFold')", dataset='LAB90', setup=lab_split),
        'Bridges the new class-aware fold API and reserves a separate final population; imbalanced classes make representation substantive.',
        hints=('Positions refer to the supplied training table, not to all loaded rows.', 'StratifiedKFold.split needs both development features and their aligned labels.', 'Use the five-fold seeded class-aware splitter on X_train/y_train only.'),
        explanation='Only the 72 training observations enter fold construction. Stratification distributes their small urgent class across folds; the 18 final observations remain outside validation.')
    support('W12', "ax.axhline(0, color='black')", 'Draws a horizontal reference line at residual zero; it is a visual guide, not another model fit.')
    support('W12', 'df.loc[df.actual.ne(df.predicted)]', 'Series.ne compares paired values for inequality. Its boolean result is a row mask; .loc keeps only the corresponding misclassified observations.')

    old = cards['ML-W11']['exercises'][0]
    e = put('W11', 1, py(
        'Compare fitting a line with and without an intercept using five shuffled seed-42 training folds and negative RMSE. Store the actual candidate params and mean_test_score columns in answer, in True/False candidate order.',
        old['solution'], "len(answer)==2 and list(answer.columns)==['params','mean_test_score'] and answer['params'].tolist()==search.cv_results_['params'] and np.allclose(answer.mean_test_score,search.cv_results_['mean_test_score'])",
        dataset=old['dataset'], setup=old['setup']),
        'Rebuilds the search contract and checks observed population, family, grid, scorer and exact fold design instead of learner search self-consistency.',
        hints=('The two recipes differ only in allowing an intercept.', 'GridSearchCV, a Pipeline, five shuffled KFold splits, and cv_results_.', 'Report the observed parameters and mean validation scores without using final-test rows.'),
        explanation='The declared grid compares two line recipes on matching training folds. Candidate scores are observed validation evidence, not training fit or final-test errors.')
    check(e, 'Declared search evidence', "trace.search_matches(answer,X_train,y_train,{'model__fit_intercept':[True,False]},'neg_root_mean_squared_error',family='LinearRegression',cv={'kind':'KFold','count':5,'shuffle':True,'seed':42})", 'Use the specified training population, five shuffled seed-42 folds, line family and negative-RMSE grid; report the actual observed scores.')
    old = cards['ML-W13']['exercises'][0]
    put('W13', 1, py(old['task'], old['solution'], "np.isclose(answer,np.sqrt(np.mean((y_test-final_predictions)**2)))", dataset=old['dataset'], setup=old['setup'], outputs=['answer','final_predictions']),
        'Adds saved prediction provenance to the final metric exercise; arbitrary arrays can no longer masquerade as fitted predictions.',
        hints=('The final metric must use the saved output of the fixed training fit.', 'clone, fit, predict and root_mean_squared_error.', 'Fit the chosen recipe on training rows, save its final predictions, then score that same array.'),
        explanation='The saved final_predictions are the observable predictions of the fitted chosen line on X_test; RMSE is calculated from that exact evidence.')

    forward_setup = """train = df.iloc[:int(len(df)*.8)]
test = df.iloc[int(len(df)*.8):]
from sklearn.model_selection import TimeSeriesSplit
training_positions, validation_positions = list(TimeSeriesSplit(5).split(train))[-1]
"""
    put('W14', 3, py(
        'The final forward fold is supplied as training_positions and validation_positions within train. Fit LinearRegression on the earlier temperature/demand rows and return predictions for its later validation block in answer. Keep the reserved test rows outside this diagnostic.',
        "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(train[['temperature']].iloc[training_positions],train.demand.iloc[training_positions])\nanswer = model.predict(train[['temperature']].iloc[validation_positions])",
        "len(answer)==len(validation_positions) and np.isfinite(answer).all()", dataset='TIME240', setup=forward_setup),
        'Fixes the last-forward-block contract so an arbitrary earlier fold or smaller self-chosen block cannot pass using its own positions.',
        hints=('The supplied positions define the last development fold, not a block you choose after viewing errors.', 'Use .iloc with the supplied earlier/later positions, then fit/predict.', 'Fit only the earlier rows and preserve the later validation block’s order.'),
        explanation='The last forward fold fits the first 160 development observations and predicts the next 32. The final 48 rows remain outside this training-only diagnostic.')

    # Review questions retrieve earlier methods through new observed problems.
    put('F-R1', 1, py(
        'Four intake cases eligible for this study are supplied in eligible, in a deliberate observation order. Retrieve X/y construction for only those cases: use the two intake measurements, with backlog before device age, to predict completion_hours. Preserve eligible’s original indices and order; the ID and completed invoice are not predictors.',
        "X = eligible[['backlog_at_open','device_age_years']]\ny = eligible['completion_hours']",
        "X.equals(eligible[['backlog_at_open','device_age_years']]) and y.equals(eligible.completion_hours)", dataset='INTAKE48', setup="eligible = df.iloc[[11,3,18,7]].copy()\n", outputs=['X','y']),
        'Retrieves the schema on a supplied four-case study population with non-default observation order; full-population or separately sorted targets fail.',
        hints=('The outcome is what is unknown at intake.', 'Retrieve two-dimensional feature selection and one-dimensional target selection.', 'Choose by availability and role, keeping indexed rows aligned.'),
        explanation='The intake measurements form X; completion_hours forms y. Administrative identifiers and completed invoices do not answer the intended input question.')
    f_review_setup = intake_split + """from sklearn.linear_model import LinearRegression
model = LinearRegression().fit(X_train[['backlog_at_open']],y_train)
incoming = pd.DataFrame({'case_id':[9992,9991,9993],'device_age_years':[2.,8.,3.], 'backlog_at_open':[11,1,6]}, index=['rush','quiet','usual'])
"""
    put('F-R1', 2, py(
        'The supplied line was fitted with backlog_at_open only. incoming has metadata, extra measurements and deliberate row order. Predict its three rows using the fitted one-feature schema; return answer as a Series indexed exactly rush, quiet, usual.',
        "answer = pd.Series(model.predict(incoming[['backlog_at_open']]),index=incoming.index)",
        "isinstance(answer,pd.Series) and answer.index.equals(incoming.index) and np.allclose(answer,model.intercept_+model.coef_[0]*incoming.backlog_at_open) and trace.prediction_matches(answer,incoming[['backlog_at_open']])", dataset='INTAKE48', setup=f_review_setup),
        'Retrieves schema selection while preserving named incoming row identities; passing metadata or sorting predictions fails.',
        hints=('Extra available measurements are still not part of this already fitted model’s schema.', 'Select one feature as a dataframe, then wrap predictions in a Series with incoming.index.', 'Preserve the supplied row order and labels throughout prediction.'),
        explanation='Predictions correspond to the fitted backlog schema and incoming observation order. Extra columns cannot silently change the model’s feature meaning.')
    residual_setup = """actual = pd.Series([13.,8.,21.,6.],index=['a','d','b','c'])
predicted = pd.Series([10.,11.,12.,7.],index=actual.index)
"""
    put('F-R1', 3, py(
        'Four repair evaluations are supplied as indexed actual and predicted Series, including both over- and under-predictions and one large miss. Retrieve signed residuals: return answer with actual, predicted and residual columns, preserving the a/d/b/c observation order. State which observation has the largest absolute miss.',
        "answer = pd.DataFrame({'actual':actual,'predicted':predicted,'residual':actual-predicted})",
        "isinstance(answer,pd.DataFrame) and answer.equals(pd.DataFrame({'actual':actual,'predicted':predicted,'residual':actual-predicted}))", dataset='INTAKE48', setup=residual_setup),
        'Uses fresh deliberately ordered, mixed-sign error evidence; target/prediction misalignment and sign reversal are discriminated.',
        hints=('A positive residual means actual exceeds prediction.', 'Aligned Series subtraction and dataframe construction.', 'Keep observation identities while subtracting actual minus predicted.'),
        explanation='Residuals are +3, -3, +9 and -1 hours in a/d/b/c order. Observation b has the largest absolute miss; the signs distinguish underprediction from overprediction.')
    put('F-R2', 1, py(
        'Before laboratory confirmation, predict a sample’s status from LAB90. sample_id is an administrative key; signal and speed_rpm are measured before confirmation; confirmed_urgent is entered from the later status. Retrieve the allowed feature dataframe answer, with signal before speed_rpm.',
        "answer = df[['signal','speed_rpm']]", "answer.equals(df[['signal','speed_rpm']])", dataset='LAB90'),
        'Replaces Candy’s direct target-copy question with a documented post-confirmation derived flag and numeric administrative distractor.',
        hints=('A binary flag can leak an outcome just as directly as a copied target.', 'Retrieve selection by prediction-time availability, not by dtype.', 'Keep pre-confirmation measurements and exclude administrative and outcome-derived fields.'),
        explanation='The outcome-derived urgent flag is known only after confirmation, so its attractive association cannot support this earlier prediction.')
    put('F-R2', 2, py(
        'Retrieve class-aware splitting on LAB90: reserve 20%, seed 42, stratified by status, using signal/speed_rpm. Return minority_support as a Series indexed training then test, containing the urgent-label counts in each partition. Explain the amount of independent minority evidence left for final evaluation.',
        lab_split + "minority_support = pd.Series([int(y_train.value_counts()['urgent']),int(y_test.value_counts()['urgent'])],index=['training','test'])",
        "_split_matches(df[['signal','speed_rpm']],df.status,X_train,X_test,y_train,y_test,stratified=True) and minority_support.equals(pd.Series([7,2],index=['training','test']))", dataset='LAB90', outputs=['minority_support']),
        'Retrieves stratification through its scarce-minority support consequence rather than another full count-table clone.',
        hints=('Representation does not imply a large sample.', 'Retrieve the stratified joint split, then count urgent labels in both partitions.', 'Report actual minority observations and qualify the two-row final evidence.'),
        explanation='Seven urgent observations remain in training and two enter final evaluation. This is feasible for the split, but a final minority estimate based on two observations is fragile.')
    put('F-R2', 3, reflect(
        'Two models use the same held-away observations and RMSE units. A has training/validation RMSE 7/7.2; B has 2/4.5. A has the smaller gap. Which has better supplied predictive validation evidence, and what can the gap still tell you?',
        'B has the lower validation RMSE, 4.5 versus 7.2, despite its larger training-validation gap. The gap describes deterioration from fitting to validation; it is not the selection metric by itself. Judge fit quality, generalisation and sample uncertainty together on comparable held-away rows.'),
        'Adds a counterexample where the smallest generalisation gap is not the best validation predictor.',
        hints=('Keep absolute validation quality separate from the train-validation difference.', 'Compare the stated comparable validation RMSE values.', 'Name the stronger validation result, then qualify what each gap establishes.'))

    constant_process_setup = process_split + "X_train = X_train.copy()\nX_train['pressure_bar'] = 2.0\n"
    put('W-R1', 1, py(
        'The supplied PROCESS30 training pressure is held fixed at 2 bar, while later pressures change. Retrieve StandardScaler on this constant-feature training population. Return training_scale as a labelled Series and answer as a labelled dataframe of transformed later rows. Explain why later pressure changes are still nonzero even though its training variance is zero; do not divide by zero or fit the later values.',
        "from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(X_train)\ntraining_scale = pd.Series(scaler.scale_,index=X_train.columns)\nanswer = pd.DataFrame(scaler.transform(X_test),index=X_test.index,columns=X_test.columns)",
        "isinstance(answer,pd.DataFrame) and answer.index.equals(X_test.index) and list(answer.columns)==list(X_test.columns) and np.allclose(answer,np.column_stack([(X_test.temperature_c-X_train.temperature_c.mean())/X_train.temperature_c.std(ddof=0),X_test.pressure_bar-2.])) and isinstance(training_scale,pd.Series) and list(training_scale.index)==list(X_train.columns) and np.allclose(training_scale,[X_train.temperature_c.std(ddof=0),1.])", dataset='PROCESS30', setup=constant_process_setup,outputs=['answer','training_scale']),
        'Replaces repeated drift scaling with a controlled zero-variance training-feature edge case; training scale and later nonzero deviations are inspected explicitly.',
        hints=('A feature constant during training has no observed scale variation, but later deviations remain measurements.', 'Use scaler.scale_ after the training fit; StandardScaler uses scale 1 for a zero-variance feature.', 'Preserve the training coordinate system and labels while reporting the later pressure deviations from 2 bar.'),
        explanation='The pressure training mean is 2 and its learned scale is 1. Later pressure transforms to its deviation from 2, rather than NaN, infinity or forced zero. This does not manufacture evidence about the predictive effect of a feature that never varied in training.')
    support('W03', 'scaler.scale_', 'The learned divisor for each feature. StandardScaler uses 1 when a training feature has zero variance, so it can subtract the training mean without dividing by zero. Later changes in that feature remain nonzero deviations.')
    encoding_setup = """from sklearn.preprocessing import OneHotEncoder
training_categories = df.loc[df.batch.eq('training'), ['channel']]
encoder = OneHotEncoder(handle_unknown='ignore',sparse_output=False).fit(training_categories)
incoming = df.loc[df.batch.eq('incoming'), ['channel']]
"""
    put('W-R1', 2, py(
        'The fitted encoder knows chat, email and phone. Incoming contains one unseen kiosk row among known channels. Retrieve reusable encoding: return answer as a dataframe with original incoming indices and encoded feature-name columns. Known rows must retain their indicator; the unseen row keeps the fitted width.',
        "answer = pd.DataFrame(encoder.transform(incoming),index=incoming.index,columns=encoder.get_feature_names_out())",
        "isinstance(answer,pd.DataFrame) and answer.index.equals(incoming.index) and list(answer.columns)==list(encoder.get_feature_names_out()) and np.array_equal(answer.to_numpy(),np.array([[0,0,1],[0,0,0],[0,1,0]]))", dataset='CHANNEL8', setup=encoding_setup),
        'Replaces the invariant single all-zero unseen category with a mixed known/unseen batch and labelled fitted schema.',
        hints=('Ignoring one unknown category must not erase the known rows’ information.', 'Use encoder.transform and get_feature_names_out without refitting.', 'Preserve the three incoming row identities and the fitted three-column schema.'),
        explanation='phone and email retain their fitted indicator columns; kiosk maps to an all-zero block. The batch uses one consistent learned schema.')
    impute_setup = """df = df.copy()
df.loc[[3,17,27], 'temperature_c'] = np.nan
""" + process_split + "y_train = df['output'].iloc[:24]\n"
    impute_solution = """from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
prepare = Pipeline([('impute',SimpleImputer(strategy='median')),('scale',StandardScaler())])
model = Pipeline([('prepare',prepare),('model',LinearRegression())]).fit(X_train,y_train)
answer = model.predict(X_test)
"""
    e = put('W-R1', 3, py(
        'PROCESS30 now has three missing temperature measurements, including a later test row. Retrieve a numeric preparation/model pipeline: median-impute both features from training rows, scale the imputed training values, and fit LinearRegression inside one pipeline. Return model and its six later predictions in answer. Explain why the later missing value must use the training replacement.',
        impute_solution,
        "len(answer)==len(X_test) and np.isfinite(answer).all() and type(model).__name__=='Pipeline' and len(model.steps)==2 and type(model.steps[0][1]).__name__=='Pipeline' and [type(s).__name__ for _,s in model.steps[0][1].steps]==['SimpleImputer','StandardScaler'] and model.steps[0][1].steps[0][1].strategy=='median' and np.allclose(model.steps[0][1].steps[0][1].statistics_,X_train.median()) and model.steps[0][1].steps[1][1].with_mean and model.steps[0][1].steps[1][1].with_std", dataset='PROCESS30', setup=impute_setup, outputs=['answer','model']),
        'Replaces repeated mixed delivery pipeline assembly with median+scale on missing, shifted sensor data; verifies actual training replacements and recipe.',
        hints=('Missingness and a later population shift are different issues.', 'SimpleImputer(strategy="median"), StandardScaler, and nested Pipeline.', 'Keep imputation and scaling before the line inside the fitted model, and reuse their training state at prediction.'),
        explanation='The two training medians replace missing input values. The scaler learns from those imputed training values, and later rows reuse both fitted transformations.')
    put('W-R2', 1, decide(
        'development_cv comes from five training folds with test_score = [-3,-4,-5,-4,-4]. reserved_rmse = 2.5 was computed after predicting the untouched final rows. Which statement correctly reports their roles?',
        ['The candidate has mean development-fold RMSE 4; reserved RMSE 2.5 is final reporting evidence.', 'The candidate has RMSE -4, and reserved_rmse should choose the next setting.', 'test_score names the reserved rows, so both objects measure the final test.'], 0,
        'Negated scoring makes larger values better; report the observed mean fold RMSE as positive 4. The separate reserved result evaluates the fixed recipe and must not drive another parameter choice.'),
        'Combines score-sign interpretation with explicit provenance of development and final objects instead of repeating test_score terminology.',
        hints=('Read how each object was created before interpreting its name.', 'Training-fold negative RMSE versus one reserved-row error.', 'Convert the sign for reporting, then keep selection and final evidence in their declared roles.'))
    put('W-R2', 2, decide(
        'On identical training folds, a simple model has RMSE [4.0,4.1,3.9,4.2,3.8] and a costly model [4.0,4.0,3.9,4.1,3.8]. A colleague also shows reserved-test RMSE 2 for the costly model. Which selection statement is justified?',
        ['Use the reserved score to guarantee the costly model is best.', 'The costly model has a slightly lower development mean; simplicity and the small observed difference can justify either qualified choice before final evaluation.', 'Always choose the smallest training-validation gap regardless of validation error.'], 1,
        'The means are 4.00 and 3.96 on paired folds, a small difference relative to the fold variation. The result does not establish universal superiority. The exposed reserved result cannot be used while still calling it untouched final evidence.'),
        'Replaces the binary legal-population recall with a near-tie decision involving paired evidence, cost and an exposed-test temptation.',
        hints=('A four-hundredths mean difference is not a guarantee of broad superiority.', 'Compare matched development evidence and operating cost.', 'Keep the choice qualified; identify how the exposed reserved result changes its evidential role.'))
    time_setup = """df = df.copy()
# A later operating regime has a steeper demand trend; row order is time order.
df['demand'] = df['demand'] + np.where(np.arange(len(df))>=120, .35*(np.arange(len(df))-120), 0)
train = df.iloc[:int(len(df)*.8)]
test = df.iloc[int(len(df)*.8):]
from sklearn.model_selection import TimeSeriesSplit
training_positions, validation_positions = list(TimeSeriesSplit(5).split(train))[-1]
"""
    put('W-R2', 3, py(
        'The chronological demand series now has a later trend change. This is same-hour demand estimation using temperature already measured at that hour, not an advance weather forecast. Retrieve last-forward-block diagnosis: fit a line on the supplied earlier training_positions, predict the later validation_positions, and return answer as a labelled actual/predicted/residual dataframe. Final rows in test stay outside diagnosis.',
        "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(train[['temperature']].iloc[training_positions],train.demand.iloc[training_positions])\nvalidation_X = train[['temperature']].iloc[validation_positions]\npredicted = model.predict(validation_X)\nactual = train.demand.iloc[validation_positions]\nanswer = pd.DataFrame({'actual':actual,'predicted':predicted,'residual':actual-predicted})",
        "answer.index.equals(train.index[validation_positions]) and list(answer.columns)==['actual','predicted','residual'] and np.allclose(answer.actual,train.demand.iloc[validation_positions]) and np.allclose(answer.predicted,predicted) and np.allclose(answer.residual,answer.actual-answer.predicted) and trace.prediction_matches(predicted,train[['temperature']].iloc[validation_positions])", dataset='TIME240', setup=time_setup),
        'Makes chronological retrieval report aligned diagnostic errors under an actual later trend change, with explicit same-hour input availability.',
        hints=('Fit only the earlier block inside development rows.', 'TimeSeriesSplit positional blocks, .iloc, fit/predict and signed residuals.', 'Keep the later development block’s observation indices and leave reserved final rows outside every fit and plot.'),
        explanation='Forward validation estimates the error when an earlier fit meets the later regime. The diagnostic remains inside the first 80% of time-ordered rows; measured same-hour weather supports an estimation claim, not a future-weather forecasting claim.')

    # Full foundations checkpoint now retrieves the workflow boundary taught
    # by F11/F12 instead of silently narrowing back to an early single fit.
    import mastery
    checkpoint = mastery.exercise('ENERGY72',
        'Independently build a complete intake-time completion-hours workflow on INTAKE48. Choose the legitimate intake measurements, protect final rows, compare a mean dummy and numeric line on matching training folds, inspect training-only errors, then report the fixed recipe’s final error. Explain the outcome units and why identifiers and completed invoices are excluded.')
    for field in ('solution','starter','explanation','context','question'):
        checkpoint[field] = checkpoint[field].replace('area_m2','backlog_at_open').replace('occupants','device_age_years').replace('monthly_kwh','completion_hours').replace('ENERGY72','INTAKE48')
    checkpoint['dataset'] = 'INTAKE48'
    checkpoint['assessment'] = dict(target='completion_hours',available=['backlog_at_open','device_age_years'],classification=False)
    checkpoint['dictionary'] = [['case_id','Administrative identifier; not a measurement.'],['backlog_at_open','Jobs waiting at intake.'],['device_age_years','Device age known at intake.'],['completion_hours','Elapsed hours until completion; the later target.'],['invoice_hours','Written on the completed invoice, after the outcome.']]
    checkpoint['question'] = 'At intake, estimate hours until repair completion.'
    checkpoint['context'] = 'One independent repair per row from a stable workshop period. No repeated devices or chronological field are supplied.'
    checkpoint['explanation'] = 'The independent script now retrieves the full workflow already taught: availability, aligned split, reference and matching training validation, training-only diagnosis, then one fixed final evaluation. Reasoning and limitations require self-review.'
    put('F-K1',1,checkpoint,'Aligns the foundations checkpoint to the completed F11/F12 workflow and adds real prediction-time distractors in a different schema.')
    cards['ML-F-K1'].update(title='Foundations workflow checkpoint',goal='Retrieve a complete honest regression workflow from a prediction-time dictionary.',explanation='This checkpoint combines the eight-step workflow taught in F11 and F12. Reconstruct a numeric regression workflow independently; the separate later readiness checkpoints assess unfamiliar data and open model choice.')

    # Regression diagnosis must never invite reselection from final-test errors.
    regression_setup = """from sklearn.model_selection import train_test_split,KFold
X = df[['x']]
y = df['y']
X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=.2,random_state=42)
folds = KFold(5,shuffle=True,random_state=42)
"""
    residual_solution = """from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_predict
import matplotlib.pyplot as plt
import seaborn as sns
predicted = cross_val_predict(LinearRegression(),X_train,y_train,cv=folds)
answer = y_train-predicted
fig,ax = plt.subplots()
sns.scatterplot(x=X_train.x,y=answer,ax=ax)
ax.axhline(0,color='black')
ax.set(xlabel='x',ylabel='Residual',title='Training-only line residuals on curved observations')
"""
    put('R03', 1, py(
        'Use five shuffled seed-42 training folds to obtain held-out training predictions from a line on CURVE48. Store actual-minus-predicted residuals in answer, preserving training indices, and plot them against training x. Keep X_test/y_test outside diagnosis.',
        residual_solution, "isinstance(answer,pd.Series) and answer.index.equals(y_train.index) and np.allclose(answer,y_train-predicted) and trace.diagnostic_matches(predicted,X_train,y_train) and _scatter_matches(X_train.x,answer)", dataset='CURVE48', setup=regression_setup),
        'Moves model-development residual evidence from the final test to training-only out-of-fold predictions.',
        hints=('The residual pattern can guide another candidate, so these must be held-out development errors.', 'cross_val_predict on the supplied training folds, aligned subtraction and a zero-reference scatterplot.', 'Plot each training observation’s out-of-fold error against its original x; leave final-test outcomes unopened.'),
        explanation='Each plotted residual comes from a line fitted without that training observation. These development errors can motivate another recipe; final-test errors cannot be reused for a fresh selection claim.')
    cards['ML-R03']['example'] = residual_solution
    cards['ML-R03']['explanation'] += ' Use held-out training predictions for candidate diagnosis; keep the final test for the fixed recipe’s final report.'
    support('R03', 'cross_val_predict(LinearRegression(), X_train, y_train, cv=folds)', 'Creates one held-out development prediction per training row, in the supplied row order. The final test does not enter this diagnostic.')
    for code, meaning in [
        ("model.named_steps['prepare']",'Accesses a fitted pipeline step by its declared name; it preserves the preprocessing object used for this model.'),
        ("prepare.named_transformers_['service']",'Accesses the fitted service encoder inside the ColumnTransformer; the trailing underscore denotes learned fitted state.'),
        ('encoder.categories_[0]','The first categorical input’s fitted category list, in encoder order.'),
        ('encoder.drop_idx_[0]','The position of that input’s omitted reference category; indexing categories_ with it gives the reference name.')]:
        support('R05',code,meaning)
    cards['ML-R05']['explanation'] += ' The fitted encoder exposes categories_ and drop_idx_. Read its category list at the dropped index to find the reference; do not guess it from frequency or original row order.'

    correlation_setup = """rng = np.random.default_rng(42)
X = pd.DataFrame({'distance':df.distance,'near_copy':df.distance+rng.normal(0,.001,len(df))})
adjusted_target = df.duration + .01*np.sin(np.arange(len(df)))
"""
    correlation_solution = """from sklearn.linear_model import LinearRegression
from sklearn.metrics import root_mean_squared_error
original = LinearRegression().fit(X,df.duration)
adjusted = LinearRegression().fit(X,adjusted_target)
coefficients = pd.DataFrame({'original':original.coef_,'adjusted':adjusted.coef_},index=X.columns)
prediction_rmse = root_mean_squared_error(original.predict(X),adjusted.predict(X))
"""
    put('R06', 2, py(
        'Keep the same distance and near_copy inputs. adjusted_target adds at most 0.01 minutes of perturbation to each duration. Fit a line to each target; return coefficients with original/adjusted columns and feature-name rows, plus prediction_rmse between the two fitted prediction arrays on X. Compare coefficient changes with prediction changes before interpreting an individual coefficient.',
        correlation_solution,
        "coefficients.index.equals(X.columns) and list(coefficients.columns)==['original','adjusted'] and np.allclose(coefficients.original,original.coef_) and np.allclose(coefficients.adjusted,adjusted.coef_) and np.isclose(prediction_rmse,np.sqrt(np.mean((original.predict(X)-adjusted.predict(X))**2)))", dataset='MIX60', setup=correlation_setup, outputs=['coefficients','prediction_rmse']),
        'Adds an actual controlled perturbation showing unstable individual coefficients alongside stable combined predictions.',
        hints=('Near-identical inputs can exchange opposing coefficient weight.', 'Two LinearRegression fits on the same X, a labelled coefficient dataframe and RMSE between fitted predictions.', 'Change only the target by the supplied tiny perturbation; compare the individual coefficients and the resulting prediction arrays.'),
        explanation='The tiny target perturbation can noticeably change opposing coefficients while the combined prediction changes little. This is a sensitivity demonstration on the fitting population, not validation evidence of generalisation.')
    cards['ML-R06']['explanation'] += ' The Change round keeps X fixed and perturbs y slightly, measuring both coefficient sensitivity and prediction sensitivity. It is a controlled fitted-state experiment, not a held-out performance comparison.'
    cards['ML-R08']['explanation'] += ' Ridge adds an L2 penalty that discourages large expanded-feature coefficients (alpha=1 by default); expansion creates the terms, scaling makes their numerical units comparable, and Ridge learns the prediction weights.'
    for e in cards['ML-R08']['exercises']:
        if e['kind'] != 'python': continue
        check(e,'Expansion–scale–Ridge recipe',"trace.preparation_matches(model,[],polynomial=True)",'Keep PolynomialFeatures without a bias column, StandardScaler and Ridge in that order; step names may vary.')
        REPAIR_NOTES[e['id']] = 'Preserves the useful expansion/fit/degree contrast and verifies the taught polynomial-scaling-Ridge recipe.'
    cards['ML-R09']['exercises'][0]['checks'][0]['test'] = "len(answer)==len(X_test) and model.get_params()['max_depth']==3 and model.get_depth()<=3 and _tree_matches(model)"
    REPAIR_NOTES['ML-R09-1'] = 'Preserves the leaf-value diagram and enforces the requested configured depth rather than any shallower recipe.'
    candy_setup = "from sklearn.model_selection import train_test_split\ntrain,test = train_test_split(df,test_size=.2,random_state=42)\n"
    tree_solution = """from sklearn.tree import DecisionTreeRegressor
features = ['sugarpercent','pricepercent']
original_tree = DecisionTreeRegressor(max_depth=3,random_state=42).fit(train[features],train.winpercent)
unit_changed_tree = DecisionTreeRegressor(max_depth=3,random_state=42).fit(train[features]*100,train.winpercent)
original_predictions = original_tree.predict(test[features])
unit_changed_predictions = unit_changed_tree.predict(test[features]*100)
"""
    put('R09',3,py(
        'Test a tree’s unit invariance on Candy: fit a depth-three tree with seed 42 on training sugarpercent/pricepercent, then a second identical recipe after multiplying both measurements by 100. Apply the same unit change to the second tree’s test inputs. Store original_predictions and unit_changed_predictions in original test-row order. Compare the arrays and explain why their equality does not establish external generalisation.',
        tree_solution,"len(original_predictions)==len(test) and np.allclose(original_predictions,unit_changed_predictions) and original_tree.max_depth==3 and unit_changed_tree.max_depth==3 and original_tree.random_state==42 and unit_changed_tree.random_state==42", dataset='candy',setup=candy_setup,outputs=['original_predictions','unit_changed_predictions']),
        'Replaces cosmetic new-dataset tree fitting with a controlled unit-invariance experiment and consistent train/test unit reasoning.',
        hints=('A positive change of units preserves the ordering used by threshold splits.', 'Fit the same depth-three tree recipe on original and unit-changed inputs.', 'Transform training and test features consistently for the second fit, then compare aligned predictions.'),
        explanation='Multiplying both input axes by a positive constant changes threshold units while preserving split ordering and predictions. This geometric invariance does not prove the fitted tree will perform well on a new population.')

    r_review_setup = intake_split + "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(X_train,y_train)\n"
    put('R-R1',1,py(
        'The repair line has backlog_at_open and device_age_years in that order. Compare an intake with backlog 3/age 5 to one with backlog 5/age 4. Return answer as a Series indexed backlog_contribution, age_contribution, total_change. Each contribution must describe the conditional fitted change; verify their sum against the two-row prediction difference.',
        "rows = pd.DataFrame({'backlog_at_open':[3,5],'device_age_years':[5,4]})\nanswer = pd.Series([2*model.coef_[0],-model.coef_[1],float(np.diff(model.predict(rows))[0])],index=['backlog_contribution','age_contribution','total_change'])",
        "isinstance(answer,pd.Series) and list(answer.index)==['backlog_contribution','age_contribution','total_change'] and np.allclose(answer,[2*model.coef_[0],-model.coef_[1],2*model.coef_[0]-model.coef_[1]])",dataset='INTAKE48',setup=r_review_setup),
        'Retrieves conditional coefficients through opposing simultaneous changes and their combined prediction, rather than the identical two-unit weight contrast.',
        hints=('Each coefficient contributes its input change times its fitted weight.', 'Named coefficient order and a two-row prediction difference.', 'Separate backlog and age contributions, then check that they sum to the total fitted change.'),
        explanation='The two-unit backlog rise and one-year age fall produce opposing conditional contributions. Their sum is the fitted total change; none of these quantities is a causal intervention effect.')
    mean_setup = process_split + "y_train=df.output.iloc[:24]\ny_test=df.output.iloc[24:]\n"
    put('R-R1',2,py(
        'On the hotter later PROCESS30 population, compare two constant predictions: its own evaluation-target mean and the earlier training-target mean. Return evaluation_r2 and training_constant_r2 on the same later y_test. Explain why the evaluation-mean constant is an R² reference while only the training constant could have been fixed before these outcomes were known.',
        "from sklearn.metrics import r2_score\nevaluation_r2 = r2_score(y_test,np.repeat(y_test.mean(),len(y_test)))\ntraining_constant_r2 = r2_score(y_test,np.repeat(y_train.mean(),len(y_test)))",
        "np.isclose(evaluation_r2,0) and np.isclose(training_constant_r2,1-np.sum((y_test-y_train.mean())**2)/np.sum((y_test-y_test.mean())**2))",dataset='PROCESS30',setup=mean_setup,outputs=['evaluation_r2','training_constant_r2']),
        'Makes distinct R² reference populations observable under a large mean shift instead of just repeating two mean calculations.',
        hints=('Both constants are scored on the same later evaluation rows.', 'Retrieve r2_score and the difference between a training-learned prediction and the evaluation-mean denominator.', 'The evaluation-mean reference scores zero; calculate how the earlier constant fares after the shift.'),
        explanation='The later evaluation mean gives R² zero by definition. The earlier training constant performs much worse after the regime shift. The former is a scoring reference, not an outcome-free deployable baseline.')
    put('R-R2',1,py(
        'Retrieve two-feature polynomial expansion for the intake measurements in INTAKE48. Expand backlog_at_open and device_age_years to degree two without a bias column. Return answer as a dataframe with all five fitted feature-name columns and the original row index. Verify that the interaction column contains the product of the two available measurements.',
        "from sklearn.preprocessing import PolynomialFeatures\nexpander = PolynomialFeatures(degree=2,include_bias=False)\nvalues = expander.fit_transform(df[['backlog_at_open','device_age_years']])\nanswer = pd.DataFrame(values,index=df.index,columns=expander.get_feature_names_out())",
        "answer.index.equals(df.index) and list(answer.columns)==['backlog_at_open','device_age_years','backlog_at_open^2','backlog_at_open device_age_years','device_age_years^2'] and np.allclose(answer,np.column_stack([df.backlog_at_open,df.device_age_years,df.backlog_at_open**2,df.backlog_at_open*df.device_age_years,df.device_age_years**2]))",dataset='INTAKE48'),
        'Replaces invariant feature-name-only recall with numerical, indexed interaction evidence; altered values and wrong row/term order fail.',
        hints=('Expanded terms represent available inputs; neither ID nor invoice belongs in the expansion.', 'PolynomialFeatures.fit_transform and get_feature_names_out.', 'Keep original observation indices and name each numerical term in fitted feature order.'),
        explanation='The interaction term lets a coefficient’s effective contribution depend on the other input. Constructing that term does not establish a useful validation improvement.')
    search_solution = """from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures,StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV,KFold
model = Pipeline([('polynomial',PolynomialFeatures(include_bias=False)),('scale',StandardScaler()),('model',Ridge())])
search = GridSearchCV(model,{'polynomial__degree':[2,3]},cv=KFold(5,shuffle=True,random_state=42),scoring='neg_root_mean_squared_error').fit(X_train,y_train)
answer = pd.DataFrame({'degree':[2,3],'mean_rmse':-search.cv_results_['mean_test_score']})
chosen_degree = int(search.best_params_['polynomial__degree'])
"""
    e = put('R-R2',2,py(
        'CUBIC60 has a response with an asymmetric bend. Retrieve the expansion–scale–Ridge comparison on five shuffled seed-42 training folds, degrees 2 and 3, negative-RMSE scoring. Return answer with degree and positive mean_rmse columns in candidate order; return chosen_degree for the smaller observed mean validation RMSE. Explain how this differs from always preferring a more flexible curve.',
        search_solution,"list(answer.columns)==['degree','mean_rmse'] and answer.degree.tolist()==[2,3] and np.allclose(answer.mean_rmse,-search.cv_results_['mean_test_score']) and chosen_degree==search.best_params_['polynomial__degree'] and trace.preparation_matches(model,[],polynomial=True)",dataset='CUBIC60',setup=regression_setup,outputs=['answer','chosen_degree']),
        'Uses genuinely cubic response geometry and retrieves selection plus sign-correct evidence, rather than returning the same raw score array.',
        hints=('Do not let the shape you expect replace the observed development comparison.', 'GridSearchCV, the polynomial/scaling/Ridge pipeline and five matching KFold splits.', 'Report positive fold errors and choose the degree with lower observed mean; keep final rows outside search.'),
        explanation='The comparison is bounded to degrees two and three on this population. Lower observed validation RMSE, not training fit or visual flexibility, nominates the recipe before final testing.')
    check(e,'Observed polynomial comparison',"trace.search_matches(answer.mean_rmse,X_train,y_train,{'polynomial__degree':[2,3]},'neg_root_mean_squared_error',positive=True,family='Ridge',cv={'kind':'KFold','count':5,'shuffle':True,'seed':42})",'Report the actual declared training-fold degree comparison; reject full-population fitting, wrong folds or substituted scores.')
    support('R10', "search.cv_results_['std_test_score']", 'Standard deviation of validation scores across folds, in the scorer’s units. It describes fold spread; it is not a confidence interval or a standard error from independent test samples.')
    leaf_setup = regression_setup + "from sklearn.tree import DecisionTreeRegressor\nfrom sklearn.model_selection import GridSearchCV\n"
    leaf_solution = """search = GridSearchCV(DecisionTreeRegressor(random_state=42),{'min_samples_leaf':[1,5,10]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)
answer = pd.DataFrame({'min_samples_leaf':[1,5,10],'mean_rmse':-search.cv_results_['mean_test_score'],'fold_sd':search.cv_results_['std_test_score']})
"""
    e = put('R-R2',3,py(
        'Retrieve tree leaf-size validation on smooth CURVE48, rather than the earlier step-shaped response. Compare min_samples_leaf 1, 5 and 10 on five shuffled seed-42 training folds, negative-RMSE scoring. Return answer with min_samples_leaf, positive mean_rmse and fold_sd columns in candidate order. Explain how mean error and variation describe this bounded comparison; fold_sd is not a confidence interval.',
        leaf_solution,"list(answer.columns)==['min_samples_leaf','mean_rmse','fold_sd'] and answer.min_samples_leaf.tolist()==[1,5,10] and np.allclose(answer.mean_rmse,-search.cv_results_['mean_test_score']) and np.allclose(answer.fold_sd,search.cv_results_['std_test_score'])",dataset='CURVE48',setup=leaf_setup),
        'Varies the scientific response shape and retrieves mean-versus-fold-variation reporting, preserving the useful leaf-size contrast.',
        hints=('A step-fitting tree faces a different approximation question on a smooth curve.', 'The same training-fold leaf-size search, mean_test_score and std_test_score.', 'Convert the mean score’s sign for reporting; standard deviation remains nonnegative in the target units.'),
        explanation='Leaf-size constraints trade local flexibility against sample support. The observed mean and fold spread describe these candidates on matched development folds; they do not guarantee a globally best tree or supply a confidence interval.')
    check(e,'Observed leaf-size comparison',"trace.search_matches(answer.mean_rmse,X_train,y_train,{'min_samples_leaf':[1,5,10]},'neg_root_mean_squared_error',positive=True,family='DecisionTreeRegressor',cv={'kind':'KFold','count':5,'shuffle':True,'seed':42})",'Use the stated smooth-response training rows, scorer, leaf grid and five seeded folds; report actual observed scores.')

    feedback = {
        'ML-W-R1-1':'Fit the supplied training population, read both learned scales, and use scale 1 for its constant pressure feature. Preserve later row/feature labels and their nonzero deviations from the training pressure mean.',
        'ML-R09-3':'Keep depth three and seed 42 for both trees. Multiply both training and test measurements by 100 for the second tree, then compare the actual prediction arrays in original test-row order.',
        'ML-W08-3':'Return exactly five shuffled seed-42 stratified training/validation position pairs for X_train/y_train; the separate final-test rows must not enter those folds.',
        'ML-W14-3':'Fit only the supplied earlier training_positions, and return the line’s actual predictions for the supplied later validation_positions in order; leave reserved final rows outside diagnosis.',
        'ML-R03-1':'Generate actual held-out training predictions on the supplied five folds, calculate y_train minus those predictions with original indices, and plot those residuals against training x; keep final rows outside the diagnostic.',
        'ML-F-R1-3':'Preserve a/d/b/c observation order and construct the actual, predicted and actual-minus-predicted residual columns from the supplied Series. Check the sign of both over- and under-predictions.',
        'ML-R-R1-2':'Score both constants on the same later y_test. The evaluation-mean constant has R² zero; the deployable constant must use the earlier y_train mean, not later outcomes.',
        'ML-W-R1-3':'Fit the median-imputer, scaler and line together on X_train/y_train. Verify the fitted medians come from training observations and reuse the same preparation for the six later predictions.',
        'ML-R-R2-3':'Report the actual leaf-size candidates in order, positive mean fold RMSE and the observed standard deviation across those same five seeded training folds. Do not substitute scores or fold spread.',
    }
    for card in registry['cards']:
        if card['deck'] not in ('foundations','workflow','regression'):
            continue
        for exercise in card['exercises']:
            if exercise['id'] in feedback:
                exercise['checks'][0]['message'] = feedback[exercise['id']]

    questions = {
        'ML-F02-2':'Why do the dispatch measurements belong in X and the later duration in y?',
        'ML-F02-3':'Which numeric-looking columns are unavailable or inappropriate at intake, and why?',
        'ML-F07-2':'How does the observed 20%/25% allocation trade fitting rows against evaluation rows?',
        'ML-F07-3':'Why is the reproducible sorted-target candidate still an invalid X/y pairing?',
        'ML-F09-3':'How much independent urgent-class evidence remains after stratification?',
        'ML-W03-3':'What do the later standardized values reveal about drift relative to the training regime?',
        'ML-W08-3':'Why must stratified folds use the development population rather than every loaded row?',
        'ML-W11-1':'What do these observed fold scores support about including an intercept?',
        'ML-W13-1':'What does this fixed line’s final RMSE establish about this reserved sample?',
        'ML-W14-3':'What does the last forward block establish, and what final rows remain untouched?',
        'ML-F-R1-1':'How did you keep the four eligible cases and their outcomes aligned?',
        'ML-F-R1-2':'Why must the prediction schema and named incoming row order remain unchanged?',
        'ML-F-R1-3':'Which repair was underpredicted most, and how do residual signs distinguish the errors?',
        'ML-F-R2-1':'Why would the later confirmed_urgent flag make the earlier prediction misleading?',
        'ML-F-R2-2':'What can a minority error estimate based on two urgent test cases establish?',
        'ML-W-R1-1':'Why does a pressure feature with zero training variance use scale 1, and what do its later deviations establish?',
        'ML-W-R1-2':'How are known and unseen categories represented within one fitted schema?',
        'ML-W-R1-3':'Which training values replace missing measurements, and how are they reused later?',
        'ML-W-R2-3':'What does forward-block error reveal about the later trend change, and why is this not an advance-weather forecast?',
        'ML-F-K1-1':'Does the intake line earn an improvement claim over its dummy on matching training folds, and what does the final error establish?',
        'ML-R03-1':'What structure remains in held-out training residuals, and how could you investigate it without using final rows?',
        'ML-R06-2':'How large are the coefficient changes relative to the prediction change after the tiny target perturbation?',
        'ML-R09-3':'Why do consistent positive unit changes preserve tree predictions without establishing external generalisation?',
        'ML-R-R1-1':'How do the opposing backlog and age contributions combine into the fitted intake-time change?',
        'ML-R-R1-2':'Why is the evaluation mean an R² scoring reference while the training mean is a deployable constant?',
        'ML-R-R2-1':'What interaction has been constructed, and what validation evidence would justify retaining it?',
        'ML-R-R2-2':'Which degree has lower observed development RMSE, and why is that different from always preferring flexibility?',
        'ML-R-R2-3':'What do mean error and fold spread support about the leaf-size candidates on this smooth response?',
    }
    for card in registry['cards']:
        if card['deck'] not in ('foundations','workflow','regression'):
            continue
        for exercise in card['exercises']:
            if exercise['id'] in questions:
                exercise['interpretationQuestion'] = questions[exercise['id']]

    return registry
