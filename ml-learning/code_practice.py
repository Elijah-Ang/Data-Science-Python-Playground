"""Runnable evidence practice replacing the former prose and choice activities.

Stable activity IDs retain the original conceptual objectives. Every replacement
asks for an operation on observations or validation evidence, not a literal quiz
answer. Inputs are declared, visible, and separate from illustrative chart data.
"""
import copy
from packages import required

CASES = {}

def add(ids, task, data, operation, check, *, explanation='', syntax=None, setup='', outputs=None, evidence=''):
    if isinstance(ids,str): ids=[ids]
    for id in ids:
        assert id not in CASES,id
        CASES[id]=dict(task=task,data=data,operation=operation,check=check,
                       explanation=explanation,syntax=syntax,setup=setup,outputs=outputs or ['answer'],evidence=evidence)

def scores(ids, data, *, higher=False, metric='RMSE', task=None):
    operation="answer = df.copy()\nanswer['gap'] = answer['validation'] - answer['training']"
    check="isinstance(answer,pd.DataFrame) and answer.index.equals(df.index) and np.allclose(answer['gap'],df['validation']-df['training']) and answer[df.columns].astype(object).equals(df.astype(object))"
    add(ids,task or f'Both columns measure {metric} ({"larger" if higher else "smaller"} is better). Copy the supplied evidence into answer and add gap = validation minus training. Compare validation quality before using the gap as a diagnostic.', data,operation,check,
        explanation='These are supplied training-validation summaries, not newly executed model fits. A fit/validation gap is diagnostic; compare validation quality under the same design before choosing a model.')

def ranking(ids,data,*,higher=False,task=None):
    add(ids,task or f'Validation is {"macro F1 (larger is better)" if higher else "RMSE (smaller is better)"}. Create answer by sorting the matching-fold summaries best first. Keep training values alongside them.',data,
        f"answer = df.sort_values('validation', ascending={not higher})",
        f"isinstance(answer,pd.DataFrame) and answer.equals(df.sort_values('validation', ascending={not higher}))",
        explanation='Rank comparable training-validation evidence; the final test stays outside selection. Small score differences alone do not establish a reliable advantage.')

# Foundations: table operations before introducing estimator APIs.
add('ML-F01-2','Select the task rows that have a known outcome into answer. Keep the request and outcome columns; grouping and compression have no prediction target.',
    {'request':['journey duration','product groups','sensor compression'],'outcome':['minutes',None,None]},
    "answer = df.loc[df['outcome'].notna(), ['request', 'outcome']]",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['outcome'].notna(),['request','outcome']])")
add('ML-F01-3','Store the nonmissing count for each supplied column in answer. Use the cancellation count to see which historical evidence is absent.',
    {'usage':[12,8,19,6],'cancellation':[None,None,None,None]},"answer = df.notna().sum()",
    "isinstance(answer,pd.Series) and answer.equals(df.notna().sum())",
    explanation='Usage can support an exploratory description. With no historical cancellation labels, this table cannot evaluate cancellation predictions.')
add('ML-F03-3','Use the supplied fitted delivery line to predict the new-city distances. Store the predictions in answer and preserve the fitted slope; predict does not learn the new traffic pattern.',
    {'distance':[2.,4.,6.],'duration':[7.,11.,15.]},
    "answer = model.predict(incoming)",
    "np.allclose(answer,[9,17]) and np.allclose(model.coef_,[2]) and trace.prediction_matches(answer,incoming,'predict')",
    setup="from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(df[['distance']], df['duration'])\nincoming = pd.DataFrame({'distance':[3.,7.]})",
    explanation='The fitted line remains duration = 3 + 2 × distance. Prediction reuses it; fitting and suitable new-city validation would be separate actions.')
add('ML-F05-3','Calculate residuals = actual minus predicted and store RMSE in answer. The result uses minutes, not squared minutes.',
    {'actual':[8.,12.,16.,20.],'predicted':[8.,12.,16.,12.]},
    "residuals = df['actual'] - df['predicted']\nanswer = np.sqrt((residuals ** 2).mean())",
    "np.isclose(answer,4) and np.allclose(residuals,df['actual']-df['predicted'])",outputs=['residuals','answer'])
scores('ML-F06-2',{'model':['memorising','simpler'],'training':[.1,2.4],'validation':[5.2,2.9]})
add('ML-F06-3','Keep only evaluation rows whose writer was absent from the fitting writers. Store the rows in answer. This tests unfamiliar writers rather than familiar writers with new images.',
    {'writer':['writer-A','writer-B','writer-C','writer-D'],'correct':[True,True,False,True]},
    "answer = df.loc[~df['writer'].isin(fitting_writers)].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[~df['writer'].isin(fitting_writers)])",
    setup="fitting_writers = ['writer-A', 'writer-B']")
add('ML-F08-2','Count each acceptability code into answer. Keep the codes as category labels rather than averaging them as measured quantities.',
    {'acceptability':[0,1,3,1,2,3,3]},"answer = df['acceptability'].value_counts().sort_index()",
    "isinstance(answer,pd.Series) and answer.equals(df['acceptability'].value_counts().sort_index())")
add('ML-F08-3','Sum care_minutes by department into answer. The named categories identify work types; the numeric outcome measures the staffing demand.',
    {'department':['clinic','surgery','clinic','surgery'],'care_minutes':[15,50,25,40]},
    "answer = df.groupby('department')['care_minutes'].sum()",
    "isinstance(answer,pd.Series) and answer.equals(df.groupby('department')['care_minutes'].sum())")
add('ML-F10-2','Select only columns flagged as known at dispatch. Store their names as a list in answer; completed duration is the later outcome.',
    {'column':['distance','weight','completed_duration'],'known_at_dispatch':[True,True,False]},
    "answer = df.loc[df['known_at_dispatch'], 'column'].tolist()",
    "answer==['distance','weight']")
add('ML-F10-3','Compute each island’s species proportions into answer. Compare the context mix before extending a classifier’s claim to a new island.',
    {'island':['North','North','North','South','South','South'],'species':['A','A','B','A','B','B']},
    "answer = pd.crosstab(df['island'], df['species'], normalize='index')",
    "isinstance(answer,pd.DataFrame) and np.allclose(answer,[[2/3,1/3],[1/3,2/3]]) and list(answer.index)==['North','South']",
    syntax=('pd.crosstab(..., normalize="index")','Counts category pairs, then divides each row by its row total. Rows are island-specific proportions, not classification accuracy.'))
# Shared workflow: use observed evidence and explicit availability boundaries.
add('ML-W01-3','Compute outcome proportions separately for the two centres into answer. This describes the supplied samples, not future deployment performance.',
    {'centre':['A','A','A','A','B','B','B','B'],'outcome':['urgent','routine','routine','routine','urgent','urgent','urgent','routine']},
    "answer = pd.crosstab(df['centre'], df['outcome'], normalize='index')",
    "isinstance(answer,pd.DataFrame) and answer.equals(pd.crosstab(df['centre'],df['outcome'],normalize='index'))")
add('ML-W02-3','Calculate accuracy in accuracy and minority recall in answer for the supplied always-majority predictions.',
    {'actual':['routine']*9+['urgent'],'predicted':['routine']*10},
    "accuracy = (df['actual'] == df['predicted']).mean()\nminority = df.loc[df['actual'] == 'urgent']\nanswer = (minority['predicted'] == 'urgent').mean()",
    "np.isclose(accuracy,.9) and np.isclose(answer,0)",outputs=['accuracy','answer'])
add('ML-W04-3','Create a named one-hot indicator table for service and store it in answer. Codes name services; they do not measure size.',
    {'service':['express','economy','standard','express']},
    "answer = pd.get_dummies(df['service'])",
    "isinstance(answer,pd.DataFrame) and answer.columns.is_unique and set(answer.columns)==set(df['service']) and answer.index.equals(df.index) and np.array_equal(answer.reindex(columns=pd.get_dummies(df['service']).columns),pd.get_dummies(df['service']))")
add(['ML-W08-2','ML-W13-3'],'Select only development rows into answer. Final-test rows cannot supply training-fold fitting or model selection evidence.',
    {'row_id':[101,102,103,104,105],'role':['development','development','final test','development','final test']},
    "answer = df.loc[df['role'] == 'development', ['row_id', 'role']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['role']=='development',['row_id','role']])")
add(['ML-W09-4','ML-W-R2-1'],'Convert the negative fold scores to positive RMSE values in answer and report their mean in mean_rmse. These are development-fold errors; reserved_rmse is separate final evidence.',
    {'fold':[1,2,3,4,5],'test_score':[-3.,-4.,-5.,-4.,-4.]},
    "answer = -df['test_score']\nmean_rmse = answer.mean()",
    "np.allclose(answer,[3,4,5,4,4]) and np.isclose(mean_rmse,4)",setup='reserved_rmse = 2.5',outputs=['answer','mean_rmse'])
scores('ML-W10-2',{'model':['A','B','C'],'training':[12.,5.,1.],'validation':[13.,6.,11.]})
add('ML-W10-3','Read max_depth from the supplied fitted tree into depth and its feature importances into answer, labelled by feature name. Keep configuration separate from learned values.',
    {'distance':[1.,2.,3.,4.,5.,6.],'weight':[2.,1.,3.,2.,4.,3.],'duration':[4.,6.,8.,11.,13.,16.]},
    "depth = model.get_params()['max_depth']\nanswer = pd.Series(model.feature_importances_, index=['distance','weight'])",
    "depth==8 and isinstance(answer,pd.Series) and np.allclose(answer,model.feature_importances_) and list(answer.index)==['distance','weight']",
    setup="from sklearn.tree import DecisionTreeRegressor\nmodel = DecisionTreeRegressor(max_depth=8, random_state=42).fit(df[['distance','weight']], df['duration'])",
    outputs=['depth','answer'])
add('ML-W11-2','Compute the mean validation score for each candidate in answer. Scores use a larger-is-better convention; do not use final-test evidence to choose.',
    {'A':[.6,.7,.8],'B':[.7,.75,.8]},'answer = df.mean()',
    "isinstance(answer,pd.Series) and np.allclose(answer,[.7,.75]) and list(answer.index)==['A','B']")
add('ML-W11-3','Evaluate the fixed linear recipe and dummy on the same three training folds. Store candidate fold scores in answer. No parameter grid is required for the intended defaults comparison.',
    {'distance':list(range(1,13)),'duration':[4.,7.,8.,11.,12.,15.,16.,19.,20.,23.,24.,27.]},
    "reference_scores = cross_validate(DummyRegressor(), X, y, cv=folds, scoring='neg_root_mean_squared_error')['test_score']\nanswer = cross_validate(LinearRegression(), X, y, cv=folds, scoring='neg_root_mean_squared_error')['test_score']",
    "len(answer)==3 and np.all(np.asarray(answer)<0) and np.all(np.asarray(reference_scores)<0) and trace.validation_matches(answer,X,y,family='LinearRegression',cv=folds,scoring='neg_root_mean_squared_error') and trace.validation_matches(reference_scores,X,y,family='DummyRegressor',cv=folds,scoring='neg_root_mean_squared_error')",
    setup="from sklearn.model_selection import KFold, cross_validate\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.dummy import DummyRegressor\nX = df[['distance']]\ny = df['duration']\nfolds = KFold(n_splits=3, shuffle=True, random_state=42)",outputs=['reference_scores','answer'])
add('ML-W14-4','Keep only measurements available at forecast time in answer. Actual later weather cannot silently stand in for a weather forecast.',
    {'column':['hour','weather_forecast','measured_later_rainfall','later_demand'],'available_at_forecast':[True,True,False,False]},
    "answer = df.loc[df['available_at_forecast'], 'column'].tolist()","answer==['hour','weather_forecast']")
# Regression: compute conditional comparisons, errors and nomination evidence.
add('ML-R01-3','The supplied slope is winpercent points per full sugarpercent unit (0 to 1). Calculate the fitted difference for a 0.1 increase in answer.',
    {'sugarpercent':[.2,.3],'winpercent':[42.,45.]},"answer = slope * (df['sugarpercent'].iloc[1] - df['sugarpercent'].iloc[0])",
    "np.isclose(answer,3)",setup='slope = 30.0')
add('ML-R02-2','Compute R² for the supplied predictions in answer and the evaluation-mean squared error in reference_mse. A negative R² is worse than this evaluation reference.',
    {'actual':[1.,2.,3.,4.],'predicted':[6.,6.,6.,6.]},
    "reference_mse = ((df['actual'] - df['actual'].mean()) ** 2).mean()\nanswer = 1 - ((df['actual'] - df['predicted']) ** 2).mean() / reference_mse",
    "np.isclose(answer,-9.8) and np.isclose(reference_mse,1.25)",outputs=['reference_mse','answer'])
add('ML-R03-2','Calculate residual = actual minus predicted, then average residuals within the supplied x regions into answer. The pattern can motivate a training-only model investigation.',
    {'region':['low','low','middle','middle','high','high'],'actual':[5.,6.,3.,4.,13.,14.],'predicted':[3.,4.,5.,6.,11.,12.]},
    "residuals = df['actual'] - df['predicted']\nanswer = residuals.groupby(df['region']).mean()",
    "isinstance(answer,pd.Series) and answer.equals((df['actual']-df['predicted']).groupby(df['region']).mean())")
add(['ML-R03-3','ML-R-R1-3'],'Compute city-level mean income and life expectancy into answer. Preserve city as the observation unit; an aggregate association is not an individual intervention effect.',
    {'city':['A','A','B','B','C','C'],'income':[20.,22.,35.,37.,50.,52.],'life_years':[70.,72.,74.,76.,78.,80.]},
    "answer = df.groupby('city')[['income','life_years']].mean()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('city')[['income','life_years']].mean())")
add('ML-R04-3','Use the supplied fitted coefficients to calculate the sugar contribution to a prediction difference in answer while price stays fixed.',
    {'sugarpercent':[.2,.4],'pricepercent':[.5,.5]},
    "answer = sugar_slope * (df['sugarpercent'].iloc[1]-df['sugarpercent'].iloc[0])",
    "np.isclose(answer,4)",setup='sugar_slope = 20.0\nprice_slope = 5.0')
add('ML-R05-3','Within each fixed chemistry stratum, subtract red’s fitted score from white’s into answer. Do not replace this conditional comparison with an overall wine-type difference.',
    {'chemistry':['low','low','high','high'],'type':['red','white','red','white'],'fitted_quality':[5.,5.4,6.,6.4]},
    "scores = df.pivot(index='chemistry', columns='type', values='fitted_quality')\nanswer = scores['white'] - scores['red']",
    "isinstance(answer,pd.Series) and np.allclose(answer,[.4,.4]) and list(answer.index)==['high','low']")
add('ML-R06-3','Convert square feet back to square metres into converted. Remove the duplicate representation and store only area_m2 in answer.',
    {'area_m2':[40.,60.,80.],'area_ft2':[430.556,645.834,861.112]},
    "converted = df['area_ft2'] / 10.7639\nanswer = df[['area_m2']].copy()",
    "np.allclose(converted,df['area_m2']) and isinstance(answer,pd.DataFrame) and answer.equals(df[['area_m2']])",outputs=['converted','answer'])
ranking('ML-R08-4',{'model':['line','degree-three'],'training':[2.,.5],'validation':[2.2,3.8]})
add('ML-R10-3','Calculate held-away mean residuals by distance_band into answer, then add absolute_mean_residual. Compare these observation-level errors with the separately supplied feature_importance; importance does not erase prediction error or establish a causal effect.',
    {'distance_band':['near','near','far','far'],'actual':[4.,8.,20.,25.],'predicted':[1.,5.,21.,26.]},
    "residuals = df['actual'] - df['predicted']\nanswer = residuals.groupby(df['distance_band']).mean().to_frame('mean_residual')\nanswer['absolute_mean_residual'] = answer['mean_residual'].abs()",
    "isinstance(answer,pd.DataFrame) and list(answer.index)==['far','near'] and list(answer.columns)==['mean_residual','absolute_mean_residual'] and np.allclose(answer,[[-1,1],[3,3]])",
    setup="feature_importance = pd.Series({'distance':0.85,'weight':0.15})",
    explanation='The supplied importance summary describes one fitted tree. Residuals belong to held-away observations, grouped here by distance band; they are not errors attached to individual feature names. Both bands still have errors despite distance’s high importance.')
add('ML-R11-2','Calculate the mean absolute error by evaluated model into answer. These errors describe the supplied evaluation; they cannot establish that no possible relationship exists.',
    {'model':['line','line','tree','tree'],'actual':[4.,8.,4.,8.],'predicted':[6.,6.,5.,7.]},
    "errors = (df['actual'] - df['predicted']).abs()\nanswer = errors.groupby(df['model']).mean()",
    "isinstance(answer,pd.Series) and answer.equals((df['actual']-df['predicted']).abs().groupby(df['model']).mean())")
add('ML-R11-3','Calculate the fitted prediction change for each study-time interval into answer using the supplied coefficient. These are model predictions, not guaranteed individual effects.',
    {'hours_before':[1.,2.,3.],'hours_after':[2.,4.,3.5]},
    "answer = slope * (df['hours_after'] - df['hours_before'])",
    "np.allclose(answer,[4,8,2])",setup='slope = 4.0')
# Classification: actual labels, thresholds, likelihoods and covariance evidence.
threshold_data={'actual':[1,1,1,0,0,0],'probability':[.9,.7,.4,.6,.2,.1]}
add(['ML-C02-2','ML-C07-2'],'For thresholds 0.3 and 0.7, count true positives and false positives. Store the two-row summary in answer, indexed by threshold. Use probability >= threshold for a positive prediction.',
    threshold_data,
    "low = df['probability'] >= 0.3\nhigh = df['probability'] >= 0.7\nanswer = pd.DataFrame({'true_positive':[(low & (df['actual']==1)).sum(), (high & (df['actual']==1)).sum()], 'false_positive':[(low & (df['actual']==0)).sum(), (high & (df['actual']==0)).sum()]}, index=[0.3,0.7])",
    "isinstance(answer,pd.DataFrame) and list(answer.index)==[.3,.7] and list(answer.columns)==['true_positive','false_positive'] and np.array_equal(answer,[[3,1],[2,0]])",
    explanation='Lowering the threshold enlarges the positive set. Here it catches one more actual positive and introduces one false alert; the trade-off depends on the observations.')
add('ML-C05-2','Compute the change in log-odds score for each one-unit increase in the scaled feature into answer, using the supplied positive fitted coefficient. Keep the other inputs fixed.',
    {'scaled_before':[-1.,0.,1.],'scaled_after':[0.,1.,2.]},
    "answer = coefficient * (df['scaled_after'] - df['scaled_before'])",
    "np.allclose(answer,[.8,.8,.8])",setup='coefficient = 0.8',
    explanation='For binary logistic regression this is a conditional change in the signed log-odds score. It is not a constant probability increase or a causal effect.')
add('ML-C07-3','Keep only the training-validation thresholds satisfying recall >= 0.9 in answer. Preserve precision so the cost of the choice remains visible.',
    {'threshold':[.3,.7],'recall':[.95,.7],'precision':[.6,.9]},
    "answer = df.loc[df['recall'] >= 0.9].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['recall']>=.9])")
add('ML-C07-4','Calculate missed-case cost plus false-alert cost for each training-validation threshold in answer. Each missed case costs 10 and each false alert costs 1.',
    {'threshold':[.3,.7],'missed':[1,6],'false_alerts':[8,2]},
    "answer = 10 * df['missed'] + df['false_alerts']",
    "np.allclose(answer,[18,62])",
    explanation='The threshold trades different errors under stated costs. These illustrative costs are part of the task, not universal clinical or operational values.')
add('ML-C08-3','Count neighbour rows and distinct machines per class into answer. Repeated rows do not supply the same independent-machine evidence as separate machines.',
    {'machine':['M1','M1','M1','M1','M2'],'label':['pass','pass','pass','pass','fail']},
    "answer = df.groupby('label')['machine'].agg(['count','nunique'])",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('label')['machine'].agg(['count','nunique']))",
    syntax=("agg(['count', 'nunique'])",'count counts observations; nunique counts distinct machines within each label. Validation for unfamiliar machines must keep each machine on one side.'))
add(['ML-C09-2','ML-C-R2-1'],'Remove the query case from the supplied fitting table into answer before fitting or learning a scale. Keep its row ID as the table index.',
    {'case_id':[117,81,96,63],'x':[2.,1.,3.,4.],'label':['A','A','B','B']},
    "answer = df.loc[df['case_id'] != query_id].set_index('case_id')",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['case_id']!=query_id].set_index('case_id'))",setup='query_id = 117',
    explanation='Removing a self-match only from the displayed neighbour list would not repair the original fit. Fit preparation and the classifier on the separated fitting rows.')
add('ML-C09-3','Calculate squared signal distance in signal_distance and total squared distance including the weak feature in answer, relative to the query (0, 0). Compare which row is nearest.',
    {'signal':[.2,1.0],'weak':[4.,0.]},
    "signal_distance = df['signal'] ** 2\nanswer = signal_distance + df['weak'] ** 2",
    "np.allclose(signal_distance,[.04,1]) and np.allclose(answer,[16.04,1])",outputs=['signal_distance','answer'])
add(['ML-C10-3','ML-C-R2-2'],'Keep signed scores in a column named margin and class-B probabilities in probability_B. Store the renamed table in answer; do not convert margins to probabilities by relabelling them.',
    {'decision_function':[-1.4,.2,2.8],'predict_proba_B':[.2,.7,.8]},
    "answer = df.rename(columns={'decision_function':'margin','predict_proba_B':'probability_B'})",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.rename(columns={'decision_function':'margin','predict_proba_B':'probability_B'}))",
    explanation='These records come from separately configured models. The margin can be negative or exceed one; valid probability range alone does not establish calibration.')
scores('ML-C11-2',{'gamma':[.1,1.,10.],'training':[.76,.94,1.],'validation':[.73,.89,.70]},higher=True,metric='macro F1')
add('ML-C11-3','Validation records macro F1. Create answer by selecting candidates with validation >= 0.85 and prediction_ms <= 3. Retain the scaled flag so the representation used for each result is explicit.',
    {'candidate':['scaled SVM','raw SVM','scaled large SVM'],'scaled':[True,False,True],'validation':[.89,.71,.90],'prediction_ms':[2.,1.,12.]},
    "answer = df.loc[(df['validation'] >= 0.85) & (df['prediction_ms'] <= 3)].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[(df['validation']>=.85)&(df['prediction_ms']<=3)])")
add('ML-C12-3','Calculate the paired One-R minus reference scores in answer and their mean in mean_gain. Use the matching folds, not the training accuracy.',
    {'fold':[1,2,3],'one_r':[.70,.72,.69],'reference':[.69,.70,.70]},
    "answer = df['one_r'] - df['reference']\nmean_gain = answer.mean()",
    "np.allclose(answer,[.01,.02,-.01]) and np.isclose(mean_gain,2/300)",outputs=['answer','mean_gain'])
add('ML-C14-2','For each proposed child node calculate Gini impurity in gini. Weight children by their row counts and sum within each split into answer. Lower weighted impurity means purer children.',
    {'split':['mixed','mixed','separated','separated'],'A':[6,4,9,1],'B':[4,6,1,9]},
    "count = df['A'] + df['B']\ngini = 1 - (df['A']/count)**2 - (df['B']/count)**2\nanswer = (gini * count / 20).groupby(df['split']).sum()",
    "isinstance(answer,pd.Series) and list(answer.index)==['mixed','separated'] and np.allclose(answer,[.48,.18]) and np.allclose(gini,[.48,.48,.18,.18])",outputs=['gini','answer'],
    syntax=('1 - p_A**2 - p_B**2','Gini is zero for a single-class node. Weight child impurities by their shares of the parent’s observations.'))
add('ML-C15-2','Find the maximum density in peak_density. Approximate total probability by summing density × the supplied grid spacing into answer. A density height may exceed one while its area is about one.',
    {'x':[-.3,-.2,-.1,0.,.1,.2,.3],'density':[.0443184841,.5399096651,2.4197072452,3.9894228040,2.4197072452,.5399096651,.0443184841]},
    "peak_density = df['density'].max()\nanswer = (df['density'] * 0.1).sum()",
    "np.isclose(peak_density,3.989422804) and np.isclose(answer,.99972985828)",outputs=['peak_density','answer'],
    explanation='The grid samples a Normal(0, 0.1²) density. Summing width-times-height rectangles approximates its area; it is not an exact integral or a class probability.')
add('ML-C15-3','For these observations from class A, calculate the radius/perimeter correlation matrix in answer. The near-duplicate measurements challenge a conditional-independence interpretation; this correlation alone does not measure probability calibration.',
    {'class':['A']*5,'radius':[1.,2.,3.,4.,5.],'perimeter':[6.1,12.2,18.4,24.2,30.6]},
    "answer = df[['radius','perimeter']].corr()","isinstance(answer,pd.DataFrame) and answer.equals(df[['radius','perimeter']].corr())")
for id in ['ML-C16-2']:
    add(id,'Use only the binary presence flags to fit BernoulliNB, then store the fitted probability of each flag within each class in answer. Leave the continuous measurement and named category outside this likelihood.',
        {'flag_a':[0,0,1,1,1,0],'flag_b':[0,1,1,1,0,0],'measurement':[1.2,2.4,3.1,4.2,2.8,1.1],'category':['x','y','x','y','x','y'],'label':['A','A','B','B','B','A']},
        "from sklearn.naive_bayes import BernoulliNB\nX = df[['flag_a','flag_b']]\nmodel = BernoulliNB().fit(X, df['label'])\nanswer = np.exp(model.feature_log_prob_)",
        "X.equals(df[['flag_a','flag_b']]) and np.allclose(answer,[[.2,.4],[.8,.6]]) and isinstance(model,BernoulliNB)",
        syntax=('np.exp(model.feature_log_prob_)','BernoulliNB stores logarithms of fitted presence probabilities, in model.classes_ and input-feature order. exp reverses the logarithm; these are feature likelihoods, not posterior class probabilities.'))
add('ML-C16-4','Select the three supported pure-type production recipes into answer. Preserve their preparation and estimator names; the mixed-type proposal needs likelihood handling outside the supported routes.',
    {'scenario':['continuous','binary flags','named categories','mixed types'],'supported':[True,True,True,False],'preparation':['passthrough','passthrough','one-hot','not available'],'estimator':['GaussianNB','BernoulliNB','BernoulliNB',None]},
    "answer = df.loc[df['supported'], ['scenario','preparation','estimator']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['supported'],['scenario','preparation','estimator']])")
add('ML-C18-2','For the supplied labelled measurements, calculate the per-class variance of x into answer. Separate covariance models can represent different within-class spreads; LDA uses a pooled covariance.',
    {'class':['A']*4+['B']*4,'x':[1.,2.,3.,4.,4.,6.,8.,10.]},
    "answer = df.groupby('class')['x'].var()",
    "isinstance(answer,pd.Series) and np.allclose(answer,[5/3,20/3])")
add('ML-C-R3-2','Compute observations per feature into answer for each supplied class. Keep the class labels. Small support relative to dimensionality warns that class-specific covariance estimates may be unstable.',
    {'class':['rare','common'],'observations':[12,150],'features':[20,20]},
    "answer = df['observations'] / df['features']\nanswer.index = df['class']",
    "isinstance(answer,pd.Series) and list(answer.index)==['rare','common'] and np.allclose(answer,[.6,7.5])",
    explanation='This is a support diagnostic, not a guarantee of stable covariance or a production-route permission. Correlation and regularisation also matter; use a supported simpler comparison on training folds.')
add('ML-C19-2','Calculate the regularised diagonal variances into answer: (1 - reg_param) × variance + reg_param. Compare this result in the supplied coordinate units.',
    {'variance_x':[100.,1.],'variance_y':[4.,1.]},
    'answer = (1 - reg_param) * df + reg_param',
    "isinstance(answer,pd.DataFrame) and np.allclose(answer,[[80.2,3.4],[1,1]])",setup='reg_param = 0.2',
    explanation='The identity contribution is tied to the chosen coordinates. Regularised QDA is therefore not generally invariant to arbitrary feature scaling.')
# Networks: configuration, optimisation and held-away evidence stay distinct.
add('ML-N01-2','Construct an unfitted quantity network with one hidden layer of 8 units. Store its hidden_layer_sizes in answer; fitting a regressor will later learn one numeric target.',
    {'concentration':[1.2,2.1,3.0]},
    'from sklearn.neural_network import MLPRegressor\nmodel = MLPRegressor(hidden_layer_sizes=(8,), random_state=42)\nanswer = model.hidden_layer_sizes',
    "isinstance(model,MLPRegressor) and tuple(answer)==(8,) and not hasattr(model,'coefs_')",
    syntax=('MLPRegressor(hidden_layer_sizes=(8,))','The tuple names hidden-layer widths, not output classes. This constructor creates a recipe; it has no learned weights until fit.'))
add('ML-N01-3','Select the numeric concentration target into numeric_target and count the material categories into answer. A material code names a class rather than a measured output.',
    {'concentration':[1.2,2.4,3.1,1.7],'material_code':[0,1,3,0]},
    "numeric_target = df['concentration'].copy()\nanswer = df['material_code'].value_counts().sort_index()",
    "isinstance(numeric_target,pd.Series) and numeric_target.equals(df['concentration']) and isinstance(answer,pd.Series) and answer.equals(df['material_code'].value_counts().sort_index())",outputs=['numeric_target','answer'])
add('ML-N02-2','Transform the incoming observations using the supplied fitted scaler and store them in answer. Reuse its fitting statistics rather than learning new ones from incoming rows.',
    {'small':[1.,2.,3.],'large':[1000.,2000.,3000.]},
    'answer = scaler.transform(incoming)',
    "np.allclose(answer,[[0,0],[2.449489742783178,2.449489742783178]]) and np.allclose(scaler.mean_,[2,2000])",
    setup="from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(df)\nincoming = pd.DataFrame({'small':[2.,4.],'large':[2000.,4000.]})")
add('ML-N02-3','Compute each metric’s change from its first budget into answer, with columns loss_change and error_rate_change. Compare directions within each metric; training loss and held-away classification error rate have different meanings.',
    {'budget':[100,200,400],'training_loss':[.8,.5,.3],'validation_error_rate':[.10,.25,.40]},
    "answer = pd.DataFrame({'loss_change':df['training_loss']-df['training_loss'].iloc[0], 'error_rate_change':df['validation_error_rate']-df['validation_error_rate'].iloc[0]})",
    "isinstance(answer,pd.DataFrame) and list(answer.columns)==['loss_change','error_rate_change'] and np.allclose(answer['loss_change'],[0,-.3,-.5]) and np.allclose(answer['error_rate_change'],[0,.15,.3])",
    explanation='Fitting loss falls while error on the same held-away cases rises. More fitting does not establish better generalisation. Compare changes within each metric rather than subtracting loss from an error rate.')
add('ML-N03-3','Keep candidates with macro_f1 >= 0.8, prediction_ms <= 3 and zero convergence warnings into answer. This applies the stated constraints without claiming a universally best model.',
    {'model':['logistic','network'],'macro_f1':[.81,.82],'prediction_ms':[1.,8.],'warnings':[0,2]},
    "answer = df.loc[(df['macro_f1'] >= .8) & (df['prediction_ms'] <= 3) & (df['warnings'] == 0)].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:1])")
add('ML-N05-2','Both loss and validation record log loss on their respective populations. Compute their changes between successive budgets into answer. The first row has no previous budget and should remain missing.',
    {'budget':[100,200,500],'loss':[2.,1.3,1.29],'validation':[2.4,1.7,1.69]},
    "answer = df[['loss','validation']].diff()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df[['loss','validation']].diff())",
    syntax=('DataFrame.diff()','Subtracts the previous row from each numeric column. The initial change is missing because there is no previous row. Use the ordered budgets shown here.'))
add(['ML-N05-3','ML-N-R1-3'],'Keep only the outer-fold validation records in answer for model nomination. Internal stopping and final-test scores have different roles.',
    {'role':['internal stopping','outer validation','outer validation','final test'],'width':[16,16,24,24],'score':[.86,.81,.82,.80]},
    "answer = df.loc[df['role'] == 'outer validation'].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[1:3])")
add('ML-N05-4','Select the earlier observations for fitting into answer using time <= 4. Keep the later observations out of any fitting subset, including a proposed internal stopping split.',
    {'time':[1,2,3,4,5,6],'demand':[3.,5.,4.,6.,8.,7.]},
    "answer = df.loc[df['time'] <= 4].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:4])")
scores('ML-N06-2',{'width':[16,32],'training':[.4,.2],'validation':[.7,.7]},metric='the same loss objective')
ranking('ML-N06-3',{'width':[16,24],'training':[.91,.96],'validation':[.81,.82]},higher=True)
# Discovery: original-unit profiles, row scope and useful geometry.
add('ML-U01-2','Create answer with just the two current customer measurements. Keep all rows and exclude the later cancellation label from label-independent discovery.',
    {'visits':[2,8,3,9],'spend':[20.,80.,25.,90.],'later_cancellation':[0,1,0,1]},
    "answer = df[['visits','spend']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df[['visits','spend']])")
add('ML-U01-3','Create X with visits and spend for all customers. Separately create answer with the visits, spend and observed cancellation outcome only for labelled customers. Group discovery can use all X rows; evaluating cancellation prediction needs known outcomes.',
    {'visits':[2,8,3,9,4,7],'spend':[20.,80.,25.,90.,35.,65.],'later_cancellation':[0,1,None,1,0,None]},
    "X = df[['visits','spend']].copy()\nanswer = df.loc[df['later_cancellation'].notna()].copy()",
    "X.equals(df[['visits','spend']]) and isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['later_cancellation'].notna()])",outputs=['X','answer'],
    explanation='X describes current customer behaviour. A group ID is an arbitrary similarity label, not a cancellation probability. Only observed later outcomes can support supervised cancellation evidence.')
add('ML-U02-3','Use the supplied scaler fitted on development rows to transform final rows into answer. Store the unchanged training mean in training_mean.',
    {'role':['development']*3+['final']*2,'length':[1.,2.,3.,4.,5.],'width':[10.,20.,30.,40.,50.]},
    "answer = scaler.transform(final_rows)\ntraining_mean = scaler.mean_.copy()",
    "np.allclose(answer,[[2.449489742783178,2.449489742783178],[3.6742346141747673,3.6742346141747673]]) and np.allclose(training_mean,[2,20]) and np.allclose(scaler.mean_,[2,20])",
    setup="from sklearn.preprocessing import StandardScaler\nfitting_rows = df.loc[df['role']=='development', ['length','width']]\nfinal_rows = df.loc[df['role']=='final', ['length','width']]\nscaler = StandardScaler().fit(fitting_rows)",outputs=['answer','training_mean'])
add(['ML-U04-4','ML-U-R1-2'],'Choose selected_k as 2 or 3, then store its group profiles in answer, including original-unit sugar, price and group size. Inspect the small group instead of declaring a winner from the nearly tied silhouettes alone.',
    {'k':[2,2,3,3,3],'group':[0,1,0,1,2],'size':[40,20,40,16,4],'sugar':[.3,.6,.3,.5,.95],'price':[.4,.5,.4,.5,.5]},
    "selected_k = 3\nanswer = df.loc[df['k']==selected_k].copy()",
    "selected_k in (2,3) and isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['k']==selected_k])",outputs=['selected_k','answer'],
    explanation='k=2 and k=3 have supplied silhouettes .58 and .57. Purpose, original-unit profiles and small-group stability can justify different exploratory choices.')
add('ML-U05-3','Relabel group IDs using the supplied one-to-one mapping, then calculate original-unit mean length by the new group in answer. Group names do not change membership.',
    {'group':[0,0,1,1,2,2],'length':[1.,3.,5.,7.,9.,11.]},
    "renamed = df['group'].map({0:2,1:0,2:1})\nanswer = df['length'].groupby(renamed).mean()",
    "isinstance(answer,pd.Series) and list(answer.index)==[0,1,2] and np.allclose(answer,[6,10,2])")
add('ML-U06-2','Calculate the mean x and y for each supplied assignment into answer. The centroids summarise compact pieces of an elongated cloud; that alone does not prove natural classes.',
    {'x':[0.,1.,2.,3.,4.,5.],'y':[0.,.9,2.1,3.,4.1,4.9],'group':[0,0,1,1,2,2]},
    "answer = df.groupby('group')[['x','y']].mean()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('group')[['x','y']].mean())")
add('ML-U06-3','Calculate size and original-unit spending range for each supplied group into answer. Use the profiles to inspect the chosen resolution along a continuum.',
    {'group':[0,0,1,1,2,2,3,3],'spend':[10.,12.,14.,16.,18.,20.,22.,24.]},
    "answer = df.groupby('group')['spend'].agg(['count','min','max'])",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('group')['spend'].agg(['count','min','max']))")
add('ML-U07-3','Read each Ward merge’s distance and observation count from the supplied linkage matrix into answer. The final merge combines all sampled observations.',
    {'x':[0.,1.,5.,6.],'y':[0.,0.,1.,1.]},
    "answer = pd.DataFrame(linkage_matrix[:,2:], columns=['merge_distance','observations'])",
    "isinstance(answer,pd.DataFrame) and np.allclose(answer,linkage_matrix[:,2:]) and list(answer.columns)==['merge_distance','observations']",
    setup="from scipy.cluster.hierarchy import linkage\nlinkage_matrix = linkage(df, method='ward')",
    syntax=('linkage_matrix[:, 2:]','Each linkage row is one merge. Columns 2 and 3 record its Ward distance and number of original observations, in merge order.'))
add('ML-U08-3','Use the supplied three-group cut to calculate count and mean length by group into answer. Keep the sample’s observation units in the summary.',
    {'group':[0,0,1,1,2,2],'length':[2.,3.,5.,6.,9.,10.]},
    "answer = df.groupby('group')['length'].agg(['count','mean'])",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('group')['length'].agg(['count','mean']))")
add('ML-U09-3','Align the two sets of group assignments on their shared sampled row IDs in answer. Preserve both named assignment columns; do not compare different observation populations.',
    {'row_id':[101,103,105,107,109],'kmeans':[0,0,1,1,2],'ward':[0,0,None,1,None]},
    "answer = df.dropna(subset=['ward']).set_index('row_id')[['kmeans','ward']]",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.dropna(subset=['ward']).set_index('row_id')[['kmeans','ward']])")
add(['ML-U10-2','ML-U-R2-3'],'Select sampled rows, then calculate their group counts and mean length into answer. Store the number of unsampled rows in outside_count; do not assign them these sample labels.',
    {'row_id':[1,2,3,4,5,6],'sampled':[True,True,True,True,False,False],'group':[0,0,1,1,None,None],'length':[2.,3.,7.,8.,4.,6.]},
    "sample = df.loc[df['sampled']]\nanswer = sample.groupby('group')['length'].agg(['count','mean'])\noutside_count = (~df['sampled']).sum()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['sampled']].groupby('group')['length'].agg(['count','mean'])) and outside_count==2",outputs=['answer','outside_count'])
add('ML-U10-3','Calculate group counts and mean sales for the fitted urban shops in answer. Store the unassigned rural observations in further_rows with their shop IDs and sales. Keep those rural rows outside the fitted group profiles.',
    {'shop_id':['U1','U2','U3','U4','R1','R2'],'setting':['urban']*4+['rural']*2,'group':[0,0,1,1,None,None],'sales':[100.,120.,240.,260.,140.,280.]},
    "urban = df.loc[df['setting']=='urban']\nanswer = urban.groupby('group')['sales'].agg(['count','mean'])\nfurther_rows = df.loc[df['setting']=='rural', ['shop_id','sales']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.loc[df['setting']=='urban'].groupby('group')['sales'].agg(['count','mean'])) and further_rows.equals(df.loc[df['setting']=='rural',['shop_id','sales']])",outputs=['answer','further_rows'],
    explanation='The fitted profiles describe the sampled urban shops. The rural measurements remain unassigned; inspect representative rural data and whether the same geometry is useful before generalising the grouping.')
# PCA: actual transformations, variance, aligned labels and sign invariance.
pca_data={'x':[1.,2.,3.,4.,5.,6.],'y':[1.,3.,2.,5.,4.,6.]}
pca_setup="from sklearn.decomposition import PCA\npca = PCA(n_components=2).fit(df)"
add('ML-P01-2','Transform the two measured columns with the supplied fitted PCA into answer. These are weighted component coordinates, not selected original columns or group IDs. Reuse the supplied axes without fitting again.',
    pca_data,'answer = pca.transform(df)',
    "np.asarray(answer).shape==(6,2) and np.allclose(answer,pca.transform(df)) and not np.allclose(answer,df) and not any(e['kind']=='fit' for e in trace.events)",setup=pca_setup,
    syntax=('pca.transform(df)','Reuses the supplied fitted axes and subtracts their fitted feature means before projecting each row. Output columns are PC1 and PC2, in that order.'))
add('ML-P01-3','Compress all three sensors into two component coordinates in answer, using the supplied fitted PCA without refitting. Compare these coordinates with the first two original sensor columns in same_as_slice; their shared two-column shape does not make their meanings identical.',
    {'sensor_a':[1.,2.,3.,4.,5.,6.],'sensor_b':[1.,3.,2.,5.,4.,6.],'sensor_c':[2.,5.,5.,9.,9.,12.]},
    "answer = pca.transform(df)\nsame_as_slice = np.allclose(answer, df[['sensor_a','sensor_b']])",
    "np.asarray(answer).shape==(6,2) and np.allclose(answer,pca.transform(df)) and isinstance(same_as_slice,(bool,np.bool_)) and not same_as_slice and not any(e['kind']=='fit' for e in trace.events)",setup=pca_setup,outputs=['answer','same_as_slice'],
    explanation='The supplied PCA learned axes from all three sensors. Its two scores combine centred measurements, while a two-column slice keeps original measurement units. Equal shape does not establish equal meaning.',
    syntax=('np.allclose(left, right)','Returns one Boolean comparing aligned numeric values within a small floating-point tolerance. Compare arrays of the same shape here; equal shape alone does not imply equal coordinates or meaning.'))
add('ML-P03-3','Calculate the cumulative explained variance into answer and store the first two components’ total in shown_variance. No classification outcomes are supplied.',
    {'component':['PC1','PC2','PC3','PC4'],'variance_share':[.6,.25,.1,.05]},
    "answer = df['variance_share'].cumsum()\nshown_variance = answer.iloc[1]",
    "np.allclose(answer,[.6,.85,.95,1]) and np.isclose(shown_variance,.85)",outputs=['answer','shown_variance'])
add('ML-P05-2','Flip PC1 scores and PC1 weights together. Calculate the PC1 contribution before and after the flip into answer as two columns; they should be identical.',
    {'score':[-2.,0.,2.]},
    "before = df['score'] * weight\nafter = (-df['score']) * (-weight)\nanswer = pd.DataFrame({'before':before,'after':after})",
    "isinstance(answer,pd.DataFrame) and list(answer.columns)==['before','after'] and np.allclose(answer,[[-1.6,-1.6],[0,0],[1.6,1.6]])",setup='weight = 0.8')
add(['ML-P06-3','ML-P-R1-3'],'Join the supplied fixed component coordinates with external labels by row ID into answer. Keep the two PC columns first. Labels are added after the representation was fitted.',
    {'row_id':[101,103,105,107],'PC1':[-2.,-1.,1.,2.],'PC2':[.3,-.6,.6,-.3]},
    "answer = df.set_index('row_id').join(external_labels)",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.set_index('row_id').join(external_labels))",
    setup="external_labels = pd.Series(['A','B','A','B'], index=[101,103,105,107], name='species')",
    syntax=('DataFrame.join(external_labels)','Adds a labelled Series using matching row indices. The operation changes the displayed table, not the fitted PCA axes or coordinates.'),
    explanation='Colouring a fixed representation can describe label patterns. Choosing components for attractive separation would use the labels in selection; neither display alone supplies predictive evaluation.')
add('ML-P07-4','List the three largest absolute weights of the supplied component into answer, preserving feature names and signed weights. They describe a fitted direction, not proven causal factors.',
    {'feature':['mass','length','width','depth'],'weight':[.8,.48,-.36,0.]},
    "order = df['weight'].abs().sort_values(ascending=False).index\nanswer = df.loc[order].head(3)",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:3])")
# Model choice and reporting: evidence tables replace text-only judgements.
add('ML-M01-2','Keep simple supported candidates that handle the mixed inputs and meet the stated prediction budget of 2 ms in answer. Preserve their preparation requirements.',
    {'model':['linear','tree','large network'],'preparation':['encode categories','encode categories','scale and encode'],'prediction_ms':[1.,1.5,9.]},
    "answer = df.loc[df['prediction_ms'] <= 2].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:2])")
add('ML-M01-3','Count distinct group IDs for each method into answer. A fixed K-Means partition and a cut of a hierarchy both need row-aligned assignments; this count describes their chosen resolutions.',
    {'kmeans':[0,0,1,1,2,2],'ward_cut':[0,0,0,1,1,2]},
    'answer = df.nunique()',"isinstance(answer,pd.Series) and answer.equals(df.nunique())",
    explanation='This counts distinct group IDs at the supplied resolution. Ward also retains the hierarchy of merges; the cut labels alone do not contain that nested structure.')
add(['ML-M01-4','ML-M-R1-1'],'Select the briefs requiring historical prediction outcomes into answer. Keep the requested artifact column to distinguish numeric forecasts from grouping and compression.',
    {'brief':['repair time','nested accounts','sensor storage'],'artifact':['hours prediction','merge hierarchy','component scores'],'has_prediction_target':[True,False,False]},
    "answer = df.loc[df['has_prediction_target']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:1])")
add('ML-M02-2','Keep only the forward-fold records in answer. A model comparison for later demand must use the same chronological evaluation design.',
    {'model':['line','tree','line','tree'],'design':['shuffled','shuffled','forward','forward'],'rmse':[4.,3.,6.,5.5]},
    "answer = df.loc[df['design']=='forward'].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[2:])")
add(['ML-M02-3','ML-M-R1-3'],'Keep candidates meeting the 2 ms prediction budget in answer and add gain_vs_dummy = 9.0 minus validation_rmse. Selection uses training-fold evidence and the stated constraint.',
    {'model':['line','tree'],'validation_rmse':[6.2,6.1],'prediction_ms':[1.,8.]},
    "answer = df.loc[df['prediction_ms'] <= 2].copy()\nanswer['gain_vs_dummy'] = 9.0 - answer['validation_rmse']",
    "isinstance(answer,pd.DataFrame) and list(answer['model'])==['line'] and np.allclose(answer['gain_vs_dummy'],[2.8]) and np.allclose(answer['validation_rmse'],[6.2])")
report_data={'model':['dummy','linear','tree'],'cv_rmse':[4.4,4.2,4.3],'fold_sd':[.7,.6,.8]}
report_evidence=('Supplied reporting summaries, not model fits executed here: repair completion time in hours at one workshop. '
    'Of 100 jobs, 80 development rows used the same five shuffled folds, seed 42, with preparation learned inside each fitting fold; 20 jobs remain reserved. '
    'The dummy predicts each fitting fold’s mean. Fold standard deviations describe variation, not confidence intervals. Paired fold scores and a final-test result are not supplied.')
add('ML-M03-2','Calculate each candidate’s descriptive gain in mean RMSE over the dummy into answer, indexed by model. Use hours. The supplied fold standard deviations cannot establish uncertainty about the paired improvement.',
    report_data,
    "candidates = df.loc[df['model']!='dummy'].set_index('model')\nanswer = df.loc[df['model']=='dummy','cv_rmse'].iloc[0] - candidates['cv_rmse']",
    "isinstance(answer,pd.Series) and list(answer.index)==['linear','tree'] and np.allclose(answer,[.2,.1])",evidence=report_evidence,
    explanation='Linear’s descriptive gain is 0.2 hours and the tree’s is 0.1 hours on the same development folds. These summaries establish neither a reliable winner nor a final-test improvement.')
add('ML-M03-3','Create answer retaining all report columns, then add gain_minutes over the dummy and fold_sd_minutes. Read development_rows and reserved_rows from study_size. Keep variation and descriptive gains separate; no paired confidence interval or final-test result can be calculated from these summaries.',
    report_data,
    "answer = df.copy()\ndummy_rmse = df.loc[df['model']=='dummy','cv_rmse'].iloc[0]\nanswer['gain_minutes'] = (dummy_rmse - answer['cv_rmse']) * 60\nanswer['fold_sd_minutes'] = answer['fold_sd'] * 60\ndevelopment_rows = study_size['development']\nreserved_rows = study_size['reserved']",
    "isinstance(answer,pd.DataFrame) and answer[df.columns].equals(df) and np.allclose(answer['gain_minutes'],[0,12,6]) and np.allclose(answer['fold_sd_minutes'],[42,36,48]) and development_rows==80 and reserved_rows==20",
    setup="study_size = pd.Series({'development':80,'reserved':20})",outputs=['answer','development_rows','reserved_rows'],evidence=report_evidence,
    explanation='The 12-minute linear and 6-minute tree gains are descriptive development evidence. The 36–48-minute fold standard deviations are not confidence intervals for those gains. Fix a defensible recipe before evaluating it once on the 20 reserved workshop jobs; wider-population and causal claims remain unsupported.')
add('ML-M04-2','Compute observed mean absolute error separately by institution into answer. Check the intended institution’s evidence before making a transport claim.',
    {'institution':['original']*3+['new']*3,'actual':[5.,8.,11.,5.,8.,11.],'prediction':[5.,7.,12.,3.,5.,7.]},
    "error = (df['actual']-df['prediction']).abs()\nanswer = error.groupby(df['institution']).mean()",
    "isinstance(answer,pd.Series) and answer.equals((df['actual']-df['prediction']).abs().groupby(df['institution']).mean())")
add('ML-M04-3','Count observed outcomes by the earlier policy decision into answer. Report missing outcomes in missing_count. The rejected group needs outcome evidence before its performance can be evaluated.',
    {'policy_decision':['accepted','accepted','rejected','rejected'],'later_outcome':[1.,0.,None,None]},
    "answer = df.groupby('policy_decision')['later_outcome'].count()\nmissing_count = df['later_outcome'].isna().groupby(df['policy_decision']).sum()",
    "isinstance(answer,pd.Series) and list(answer.index)==['accepted','rejected'] and np.array_equal(answer,[2,0]) and np.array_equal(missing_count,[0,2])",outputs=['answer','missing_count'])
# Retrieval deliberately combines familiar operations; no new model family.
scores('ML-F-R2-3',{'model':['A','B'],'training':[7.,2.],'validation':[7.2,4.5]})
add('ML-W-R2-2','Compute paired costly-minus-simple RMSE differences in answer and the two means in mean_rmse. Use matching training folds; the exposed reserved score cannot select the candidate.',
    {'simple':[4.,4.1,3.9,4.2,3.8],'costly':[4.,4.,3.9,4.1,3.8]},
    "answer = df['costly']-df['simple']\nmean_rmse = df.mean()",
    "np.allclose(answer,[0,-.1,0,-.1,0]) and np.allclose(mean_rmse,[4,3.96])",outputs=['answer','mean_rmse'])
add('ML-C-R3-1','Use the declared feature kinds to select only the binary flags in answer. Preserve row order and named columns for a Bernoulli recipe.',
    {'flag_a':[0,1,1],'flag_b':[1,0,1],'measurement':[1.4,2.8,3.1],'category':['red','green','blue']},
    "answer = df[['flag_a','flag_b']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df[['flag_a','flag_b']])",
    explanation='Bernoulli models binary presence. Continuous measurements need a matching likelihood; named categories need the separately supported encoded categorical route.')
ranking('ML-C-R3-3',{'depth':['unrestricted','5','3'],'training':[.99,.94,.85],'validation':[.60,.75,.78]},higher=True)
add('ML-N-R1-1','Construct the unfitted four-class-task network with hidden widths 16 then 8. Store its hidden_layer_sizes in answer; the number of output classes is learned from labels during fit.',
    {'material_code':[0,1,2,3]},
    "from sklearn.neural_network import MLPClassifier\nmodel = MLPClassifier(hidden_layer_sizes=(16,8), random_state=42)\nanswer = model.hidden_layer_sizes",
    "isinstance(model,MLPClassifier) and tuple(answer)==(16,8) and not hasattr(model,'coefs_')")
add('ML-N-R1-2','For each run, calculate successive changes in loss and validation error into answer. Preserve the budget order and initial missing changes for each run.',
    {'run':['A']*3+['B']*3,'budget':[100,200,400]*2,'loss':[2.,1.4,1.1,.8,.5,.3],'validation':[2.4,1.8,1.5,1.1,1.4,1.9]},
    "answer = df.groupby('run')[['loss','validation']].diff()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.groupby('run')[['loss','validation']].diff())")
add('ML-U-R1-1','Select measurements only into answer. Leave species out of both fitting and choice of group count; an external comparison comes after the grouping is fixed.',
    {'length':[1.,2.,4.,5.],'width':[2.,1.,4.,3.],'species':['A','B','A','B']},
    "answer = df[['length','width']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df[['length','width']])")
add('ML-U-R2-1','Standardise each of the two equivalent unit representations using its declared discovery population. Store them in scaled_mm and answer. Verify that the prepared geometry agrees.',
    {'length_mm':[10.,20.,30.,40.],'width_cm':[1.,3.,2.,4.]},
    "from sklearn.preprocessing import StandardScaler\nscaled_mm = StandardScaler().fit_transform(df)\nconverted = df.rename(columns={'length_mm':'length_cm'}).copy()\nconverted['length_cm'] = converted['length_cm'] / 10\nanswer = StandardScaler().fit_transform(converted)",
    "np.allclose(scaled_mm,answer) and np.allclose(np.mean(answer,axis=0),0) and np.allclose(np.std(answer,axis=0),1)",outputs=['scaled_mm','answer'])
add('ML-M-R1-2','Keep only the held-away patient’s visits in answer, and all other patients in fitting_rows. Use a whole-patient boundary when the goal is unfamiliar patients.',
    {'patient':['P1','P1','P2','P2','P3','P3'],'visit':[1,2,1,2,1,2],'outcome':[0,1,0,0,1,1]},
    "answer = df.loc[df['patient']=='P3'].copy()\nfitting_rows = df.loc[df['patient']!='P3'].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[4:]) and isinstance(fitting_rows,pd.DataFrame) and fitting_rows.equals(df.iloc[:4])",outputs=['fitting_rows','answer'])
add('ML-M-K1-1','Build five numeric audit outputs from the supplied evidence: candidate RMSE difference, minority misses, cluster-size proportions, unsampled row count and total variance retained in axes beyond the two-axis display. Preserve the names in the starter.',
    {'wine_rmse':[.8,.81],'minority_actual':[10,10],'minority_caught':[2,2],'profile_rows':[500,500],'population_rows':[569,569],'retained_variance':[.9,.9],'shown_variance':[.65,.65]},
    "rmse_difference = df['wine_rmse'].iloc[1]-df['wine_rmse'].iloc[0]\nminority_missed = df['minority_actual'].iloc[0]-df['minority_caught'].iloc[0]\ngroup_proportions = group_sizes/group_sizes.sum()\nunsampled = df['population_rows'].iloc[0]-df['profile_rows'].iloc[0]\nomitted_from_display = df['retained_variance'].iloc[0]-df['shown_variance'].iloc[0]",
    "np.isclose(rmse_difference,.01) and minority_missed==8 and np.allclose(group_proportions,[.6,.3,.1]) and unsampled==69 and np.isclose(omitted_from_display,.25)",
    setup="group_sizes = pd.Series([300,150,50], index=['group 0','group 1','group 2'])",
    outputs=['rmse_difference','minority_missed','group_proportions','unsampled','omitted_from_display'],
    explanation='The wine score gap is small relative to the stated fold variation of .1. Minority errors, group sizes, sample scope and display retention answer different questions; they cannot form one accuracy leaderboard.')

add('ML-C14-4','Create answer from the supplied Car-tree evidence and add fit_gap = training_f1 minus validation_f1. Retain safety_importance; its size describes the fitted tree, not an intervention effect.',
    {'depth':['3','5','unrestricted'],'training_f1':[.85,.94,.99],'validation_f1':[.78,.75,.60],'safety_importance':[.45,.50,.60]},
    "answer = df.copy()\nanswer['fit_gap'] = answer['training_f1'] - answer['validation_f1']",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.assign(fit_gap=df['training_f1']-df['validation_f1']))")
add('ML-C18-4','Select the supported QDA scenarios into answer using the supplied production-route table. A covariance calculation being possible does not make an unsupported 30-feature route available.',
    {'scenario':['Penguins','Breast'],'features':[4,30],'qda_supported':[True,False]},
    "answer = df.loc[df['qda_supported']].copy()",
    "isinstance(answer,pd.DataFrame) and answer.equals(df.iloc[:1])")
add('ML-C19-3','Calculate observations per feature into answer, indexed by class. Compare the rare class with the common classes before trying a separate covariance estimate on 40 correlated measurements.',
    {'class':['rare','common A','common B'],'observations':[12,50,70],'features':[40,40,40]},
    "answer = df['observations'] / df['features']\nanswer.index = df['class']",
    "isinstance(answer,pd.Series) and list(answer.index)==['rare','common A','common B'] and np.allclose(answer,[.3,1.25,1.75])",
    explanation='The rare class has fewer observations than dimensions. A ratio above one still does not ensure stable covariance with correlated features; compare supported simpler or regularised recipes on training folds.')

def apply(registry):
    found=set()
    for card in registry['cards']:
        for index,e in enumerate(card['exercises']):
            if e['kind']=='python':continue
            id=e['id'];found.add(id);case=copy.deepcopy(CASES[id])
            old_kind=e['kind'];previous=e['explanation']
            data=case['data'];columns=list(data);rows=list(map(list,zip(*data.values())))
            operation=case['operation']+'\n'
            solution=operation+'\n'.join('print('+name+')' for name in case['outputs'])+'\n'
            starter='# Your work\n'+'\n'.join(name+' = ...' for name in case['outputs'])+'\n'+'\n'.join('print('+name+')' for name in case['outputs'])+'\n'
            practice_end=len(card['exercises'])-1-int(bool(card['exercises'][-1].get('modelBridge')))
            label=('Follow' if index==0 else 'Change' if index==1 else 'Transfer' if index==practice_end else 'Practise') if card['kind']=='teaching' else ('Readiness' if card['kind']=='checkpoint' else 'Retrieval '+str(index+1))
            e.clear();e.update(id=id,kind='python',version=3,label=label,task=case['task'],dataset='Practice evidence · '+id,preload=False,
                setup='df = pd.DataFrame('+repr(data)+')\n'+case['setup'],starter=solution if label=='Follow' else starter,
                solution=solution,outputs=case['outputs'],checks=[dict(name='Computed evidence',test=case['check'],message='Compute the requested evidence from the supplied observations; preserve the required names, values, labels and row order.')],
                hints=dict(think=case['explanation'] or previous,
                    tools=card['title']+': use the supplied '+', '.join('`'+name+'`' for name in columns)+' columns and the pandas or model operations introduced in this lesson.',
                    approach='Compute '+', '.join('`'+name+'`' for name in case['outputs'])+' from the supplied evidence. Preserve the requested labels and row order, then inspect the values before checking.'),
                explanation=case['explanation'] or previous,activityExplanation=case['explanation'] or previous,
                demand='Compute and inspect the evidence',replacement=dict(previousKind=old_kind,objective=previous),
                inputPreview=dict(name='Exercise evidence · '+id,columns=columns,rows=rows),
                visual=dict(type='exercise-data',id=id,caption='Use the exercise evidence below for this computation.'),
                contract=[dict(name=name,description=case['task'] if len(case['outputs'])==1 else 'Computed '+name+' as requested in the task.') for name in case['outputs']],
                inputMeanings={'df':'The exercise evidence shown below; it is separate from the illustrative chart example.'})
            if case['syntax']:e['practiceSyntax']=[dict(id='practice-'+id,title=case['syntax'][0],code=case['syntax'][0],meaning=case['syntax'][1],lesson=card['id'])]
            if case['evidence']:e['evidence']=case['evidence']
            e['packages']=required(e)
    assert found==set(CASES),(sorted(found-set(CASES)),sorted(set(CASES)-found))
    return registry
