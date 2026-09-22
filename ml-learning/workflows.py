"""Complete workflow briefs and cumulative retrieval, with ordinary notebook Python."""
import copy
import json
from pathlib import Path
from authoring import CARDS,lesson,py,decide,reflect,workflow_contract
from verticals import IMPORTS,check,SUPERVISED_CHECKS,REGRESSION_CHECKS,CLASSIFICATION_CHECKS,LINEAR,NEURAL,HIERARCHY,PCA,one_r
from brief_groups import groups

FLAGS=['chocolate','fruity','caramel','peanutyalmondy','nougat','crispedricewafer','hard','bar','pluribus']
CHEM=['fixed acidity','volatile acidity','citric acid','residual sugar','chlorides','free sulfur dioxide','total sulfur dioxide','density','pH','sulphates','alcohol']
PENG=['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']
BREAST=['radius_mean','texture_mean','smoothness_mean','concavity_mean','symmetry_mean']
WEATHER=['Temperature(°C)','Humidity(%)','Wind speed (m/s)','Visibility (10m)','Solar Radiation (MJ/m2)','Rainfall(mm)','Snowfall (cm)']
CAR=['buying','maintenance','doors','persons','luggage_boot','safety']
DATA={
 'gapminder':dict(file='data/gapminder.csv',target='lifeExp',numeric=['gdpPercap'],binary=[],category=[],task='regression',prepare="df=df.loc[df.year.eq(2007)].reset_index(drop=True)"),
 'candy_simple':dict(file='data/candy-power-ranking.csv',dataset='candy',target='winpercent',numeric=['sugarpercent'],binary=[],category=[],task='regression'),
 'candy':dict(file='data/candy-power-ranking.csv',target='winpercent',numeric=['sugarpercent','pricepercent'],binary=FLAGS,category=[],task='regression'),
 'seoul':dict(file='data/seoul-bike.csv',target='Rented Bike Count',numeric=WEATHER,binary=[],category=['Holiday','Hour','Seasons'],task='regression',time=True,prepare="df=df.assign(_date=pd.to_datetime(df['Date'],dayfirst=True)).sort_values(['_date','Hour']).reset_index(drop=True)"),
 'penguins_mixed':dict(file='data/palmer-penguins.csv',dataset='penguins',target='species',numeric=PENG,binary=[],category=['sex','island','year'],task='classification'),
 'penguins':dict(file='data/palmer-penguins.csv',target='species',numeric=PENG,binary=[],category=[],task='classification'),
 'car':dict(file='data/car-evaluation.csv',target='acceptability',numeric=[],binary=[],category=CAR,task='classification'),
 'breast':dict(file='data/breast-cancer.csv',target='diagnosis',numeric=BREAST,binary=[],category=[],task='classification'),
 'candy_binary':dict(file='data/candy-power-ranking.csv',dataset='candy_class',target='popular',numeric=[],binary=FLAGS,category=[],task='classification',prepare="df['popular']=np.where(df.winpercent>=50,'50% or above','below 50%')"),
 'Wine600':dict(file='data/wine-quality.csv',sep=';',target='quality',numeric=CHEM,binary=[],category=[],task='regression',prepare="df=df.drop_duplicates().reset_index(drop=True).sample(600,random_state=42).reset_index(drop=True)"),
}

def recipe(model,spec):
    scaled=model in ('logistic','svm_cls','knn_cls','mlp_cls','mlp_reg')
    parts=[]
    if spec['numeric']:parts.append("('numeric', "+("StandardScaler()" if scaled else "'passthrough'")+", "+repr(spec['numeric'])+")")
    if spec['binary']:parts.append("('flags', 'passthrough', "+repr(spec['binary'])+")")
    if spec['category']:parts.append("('category', OneHotEncoder(handle_unknown='ignore', sparse_output=False"+(", drop='first'" if model=='multiple_linear' else "")+"), "+repr(spec['category'])+")")
    prepare='ColumnTransformer(['+', '.join(parts)+'])'
    definitions={
      'simple_linear':('from sklearn.linear_model import LinearRegression','LinearRegression()',None),
      'multiple_linear':('from sklearn.linear_model import LinearRegression','LinearRegression()',None),
      'regression_tree':('from sklearn.tree import DecisionTreeRegressor','DecisionTreeRegressor(random_state=42)',{'model__max_depth':[3,5,None]}),
      'classification_tree':('from sklearn.tree import DecisionTreeClassifier','DecisionTreeClassifier(random_state=42)',{'model__max_depth':[3,5,None]}),
      'logistic':('from sklearn.linear_model import LogisticRegression','LogisticRegression(max_iter=2000,random_state=42)',{'model__C':[.1,1,10]}),
      'svm_cls':('from sklearn.svm import SVC','SVC(random_state=42)',{'model__C':[.5,2,10]}),
      'knn_cls':('from sklearn.neighbors import KNeighborsClassifier','KNeighborsClassifier()',{'model__n_neighbors':[3,5,9]}),
      'lda':('from sklearn.discriminant_analysis import LinearDiscriminantAnalysis',"LinearDiscriminantAnalysis(solver='lsqr')",{'model__shrinkage':[None,'auto']}),
      'qda':('from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis','QuadraticDiscriminantAnalysis(reg_param=.1)',{'model__reg_param':[.1,.2,.5,.9]}),
      'mlp_cls':('from sklearn.neural_network import MLPClassifier','MLPClassifier(hidden_layer_sizes=(24,),max_iter=500,early_stopping=True,random_state=42)',{'model__hidden_layer_sizes':[(16,),(24,)]}),
      'mlp_reg':('from sklearn.neural_network import MLPRegressor',"TransformedTargetRegressor(regressor=MLPRegressor(hidden_layer_sizes=(24,),max_iter=800,early_stopping="+str(not spec.get('time',False))+",tol=1e-3,random_state=42),transformer=StandardScaler())",{'model__regressor__hidden_layer_sizes':[(16,),(24,)]}),
    }
    if model=='polynomial':
        return "from sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import Ridge\nmodel=Pipeline([('polynomial',PolynomialFeatures(degree=2,include_bias=False)),('scale',StandardScaler()),('model',Ridge())])",{'polynomial__degree':[2,3]}
    if model=='naive_bayes':
        if spec['numeric']:
            definitions[model]=('from sklearn.naive_bayes import GaussianNB','GaussianNB()',{'model__var_smoothing':[1e-11,1e-9,1e-7]})
        else:
            definitions[model]=('from sklearn.naive_bayes import BernoulliNB','BernoulliNB()',{'model__alpha':[.1,1,5]})
    imports,estimator,grid=definitions[model]
    return imports+'\nmodel=Pipeline([(\'prepare\', '+prepare+"), ('model', "+estimator+")])",grid

def supervised(key,models,id='temporary'):
    s=DATA[key];classification=s['task']=='classification'
    metric='f1_macro' if classification else 'neg_root_mean_squared_error'
    columns=s['numeric']+s['binary']+s['category']
    code=IMPORTS+"\nimport matplotlib.pyplot as plt\nX=df["+repr(columns)+"]\ny=df["+repr(s['target'])+"]\n"
    if s.get('time'):
        code+="from sklearn.model_selection import TimeSeriesSplit\ncut=int(len(df)*.8)\nX_train,X_test=X.iloc[:cut],X.iloc[cut:]\ny_train,y_test=y.iloc[:cut],y.iloc[cut:]\nfolds=TimeSeriesSplit(n_splits=5)\n"
    else:
        code+="X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42"+(",stratify=y" if classification else "")+")\n"
        code+=("folds=StratifiedKFold" if classification else "folds=KFold")+"(n_splits=5,shuffle=True,random_state=42)\n"
    code+="candidates={}\ngrids={}\n"
    for model in models:
        build,grid=recipe(model,s)
        code+=build+"\ncandidates["+repr(model)+"]=model\ngrids["+repr(model)+"]="+repr(grid)+"\n"
    code+="""reference_results=cross_validate("""+("DummyClassifier(strategy='most_frequent')" if classification else "DummyRegressor(strategy='mean')")+""",X_train,y_train,cv=folds,scoring="""+repr(metric)+""")
rows=[]
selected={}
loss_curves={}
for name,candidate in candidates.items():
    initial=cross_validate(candidate,X_train,y_train,cv=folds,scoring="""+repr(metric)+""")
    grid=grids[name]
    if grid:
        search=GridSearchCV(candidate,grid,cv=folds,scoring="""+repr(metric)+""",n_jobs=1)
        search.fit(X_train,y_train)
        selected[name]=search.best_estimator_
        validation_score=float(search.best_score_)
        settings=search.best_params_
    else:
        selected[name]=candidate
        validation_score=float(np.mean(initial['test_score']))
        settings='Keep defaults: no production search'
    rows.append({'model':name,'initial_score':float(np.mean(initial['test_score'])),'selected_score':validation_score,'settings':str(settings)})
    fitted=selected[name].named_steps.get('model')
    if hasattr(fitted,'regressor_'):
        fitted=fitted.regressor_
    if hasattr(fitted,'loss_curve_'):
        loss_curves[name]=list(fitted.loss_curve_)
cv_results=pd.DataFrame(rows).set_index('model')
# This solution nominates by mean training-fold score. Other evidence-based choices can be defensible.
chosen_name=cv_results.selected_score.idxmax()
chosen=selected[chosen_name]
"""
    if s.get('time'):
        code+="""train_indices,validation_indices=list(folds.split(X_train))[-1]
diagnostic_model=clone(chosen).fit(X_train.iloc[train_indices],y_train.iloc[train_indices])
diagnostic_X=X_train.iloc[validation_indices]
diagnostic_y=y_train.iloc[validation_indices]
oof_predictions=diagnostic_model.predict(diagnostic_X)
"""
    else:
        code+="oof_predictions=cross_val_predict(chosen,X_train,y_train,cv=folds)\ndiagnostic_y=y_train\n"
    if classification:
        code+="""class_labels=sorted(y_train.unique())
matrix=confusion_matrix(diagnostic_y,oof_predictions,labels=class_labels)
fig,ax=plt.subplots(figsize=(6,4))
ax.imshow(matrix,cmap='Blues')
ax.set(xticks=range(len(class_labels)),yticks=range(len(class_labels)),xticklabels=class_labels,yticklabels=class_labels,xlabel='Predicted class',ylabel='Actual class',title='Training-only confusion matrix')
for (i,j),value in np.ndenumerate(matrix):
    ax.text(j,i,str(value),ha='center',va='center',color='black')
fig.tight_layout()
fig.savefig('diagnostic.png',dpi=150,bbox_inches='tight')
final_model=clone(chosen).fit(X_train,y_train)
final_predictions=final_model.predict(X_test)
final_f1=f1_score(y_test,final_predictions,average='macro')
final_accuracy=accuracy_score(y_test,final_predictions)
print('Final macro F1:',final_f1,'; accuracy:',final_accuracy)
"""
    else:
        code+="""residuals=pd.DataFrame({'actual':diagnostic_y,'predicted':oof_predictions,'residual':diagnostic_y-oof_predictions})
fig,ax=plt.subplots(figsize=(6,4))
ax.scatter(residuals.predicted,residuals.residual,s=12)
ax.axhline(0,color='black')
ax.set(xlabel='Training-validation prediction',ylabel='Residual',title='Training-only residuals')
fig.tight_layout()
fig.savefig('diagnostic.png',dpi=150,bbox_inches='tight')
final_model=clone(chosen).fit(X_train,y_train)
final_predictions=final_model.predict(X_test)
final_rmse=root_mean_squared_error(y_test,final_predictions)
print('Final RMSE:',final_rmse)
"""
    checks=copy.deepcopy(CLASSIFICATION_CHECKS if classification else REGRESSION_CHECKS)
    if s.get('time'):
        checks=[c for c in checks if c['name']!='Training-only diagnosis']
        checks+=[check('Forward split','X_train.index.max()<X_test.index.min() and max(train_indices)<min(validation_indices)','Keep all validation and final rows after the rows used for their model fit.'),check('Last-block diagnosis','len(oof_predictions)==len(validation_indices) and diagnostic_y.index.equals(y_train.iloc[validation_indices].index)','Time diagnostics must describe the last training-validation block, not every training row.')]
    checks+=[
        check('Declared features and target','X.equals(df['+repr(columns)+']) and y.equals(df['+repr(s['target'])+'])','Use precisely the declared population, legitimate feature columns and target.'),
        check('Candidate coverage','set(cv_results.index)==set('+repr(models)+') and len(selected)=='+str(len(models)),'Evaluate each requested candidate on the common validation design.'),
        check('Nomination','chosen_name in selected and type(final_model.named_steps["model"]).__name__==type(selected[chosen_name].named_steps["model"]).__name__','Fit the nominated model family before final testing; the reported choice must match the final estimator.'),
        dict(name='Interpretation',selfReview=True,message='Explain the question, validation/reference evidence, selection rationale and limitations. Model choice and prose are self-review; a complex model is not automatically better.')
    ]
    classes={'simple_linear':'LinearRegression','multiple_linear':'LinearRegression','polynomial':'Ridge','regression_tree':'DecisionTreeRegressor','classification_tree':'DecisionTreeClassifier','logistic':'LogisticRegression','svm_cls':'SVC','knn_cls':'KNeighborsClassifier','lda':'LinearDiscriminantAnalysis','qda':'QuadraticDiscriminantAnalysis','mlp_reg':'TransformedTargetRegressor','mlp_cls':'MLPClassifier','naive_bayes':'GaussianNB' if s['numeric'] else 'BernoulliNB'}
    expected={name:classes[name] for name in models}
    checks.append(check('Requested model families','all(type(selected[name].named_steps["model"]).__name__==expected for name,expected in '+repr(expected)+'.items())','Fit the requested production model families; a candidate name alone does not establish its estimator type.'))
    return dict(id=id,kind='python',dataset=s.get('dataset',key),solution=code,setup='',outputs=['cv_results','reference_results','chosen_name','loss_curves']+(['matrix','final_f1','final_accuracy'] if classification else ['residuals','final_rmse']),checks=checks,protect=dict(target=s['target'],stratified=classification,time=bool(s.get('time'))))

KMEANS=dict(id='ML-X17',kind='python',dataset='penguins',outputs=['evidence','sizes','profiles','labels'],
 solution="""from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
X=df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]
scaler=StandardScaler()
scaled=scaler.fit_transform(X)
rows=[]
for k in range(2,min(8,len(X)-1)+1):
    candidate=KMeans(n_clusters=k,n_init=20,random_state=42).fit(scaled)
    score=silhouette_score(scaled,candidate.labels_,sample_size=min(2000,len(X)),random_state=42)
    rows.append({'k':k,'inertia':candidate.inertia_,'silhouette':score})
evidence=pd.DataFrame(rows)
# Three is an illustrative choice to discuss against the evidence, not a unique optimum.
model=KMeans(n_clusters=3,n_init=20,random_state=42).fit(scaled)
labels=model.labels_
sizes=pd.Series(labels).value_counts().sort_index()
profiles=X.groupby(labels).mean()
fig,ax=plt.subplots(figsize=(6,4))
for label in np.unique(labels):
    group=X.loc[labels==label]
    ax.scatter(group.bill_length_mm,group.bill_depth_mm,label='Group '+str(label),marker=['o','s','^'][int(label)%3])
ax.set(xlabel='Bill length (mm)',ylabel='Bill depth (mm)',title='Exploratory Penguin groups')
ax.legend()
fig.savefig('clusters.png',dpi=150,bbox_inches='tight')
print(evidence)
""",
 checks=[
 check('Reference-free inputs',"list(X.columns)==['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']",'Fit using the four measurement columns only.'),
 check('k evidence','list(evidence.k)==list(range(2,9)) and np.isfinite(evidence[["inertia","silhouette"]]).all().all() and trace.cluster_scores(evidence,scaled)','Compare k=2–8 using finite inertia and silhouette evidence.'),
 check('Assignments','len(labels)==len(X) and _same_partition(labels,model.predict(scaled))','Assign each input row using the fitted geometry; cluster IDs may be renamed consistently.'),
 check('Original-unit profiles','sizes.sum()==len(X) and np.allclose(profiles.values,X.groupby(labels).mean().values)','Profile original-unit measurements with aligned labels.'),
 dict(name='Choice and interpretation',selfReview=True,message='Defend k using scores, geometry, sizes and useful profiles. No single k or real-world class claim is automatically correct.')])

BRIEFS=[
 ('Explain a simple regression result','gapminder',['simple_linear'],'Model life expectancy from GDP per capita in the 2007 country snapshot. Report predictive evidence and the limits of interpreting the fitted line.','Which population and prediction context does this relationship describe?','Separate association from causal explanation.','LinearRegression, KFold, cross_validate, residuals and RMSE.','Reserve final rows; compare a line with a mean reference; diagnose using training predictions; finish and qualify.'),
 ('Is a curve justified?','candy_simple',['simple_linear','polynomial'],'Compare a line and a polynomial workflow for Candy winpercent from sugarpercent. Decide whether the extra flexibility is supported.','What evidence would justify the added flexibility?','A lower training error is not enough.','PolynomialFeatures, StandardScaler, Ridge, Pipeline and GridSearchCV.','Compare both candidates on the same folds before choosing and opening final evidence.'),
 ('Mixed predictors, two regression families','candy',['multiple_linear','regression_tree'],'Compare multiple linear regression and a regression tree for Candy popularity using numeric and binary characteristics.','Which relationships can each candidate represent?','Flexibility and explanation have different costs.','ColumnTransformer, LinearRegression, DecisionTreeRegressor and common-fold CV.','Compare both prepared candidates, tune tree depth, diagnose and nominate before final evaluation.'),
 ('Predict in the direction of time','seoul',['multiple_linear','regression_tree'],'Compare linear and tree workflows for later Seoul hourly bike demand. Use the declared weather and calendar scenario and state prediction-time availability assumptions.','Which inputs would be available at the prediction time?','Future observations must not teach the past.','Chronological slicing, TimeSeriesSplit, mixed preparation and last-block diagnosis.','Sort by date/hour; reserve the final period; compare forward-validation evidence and diagnose the last training block.'),
 ('A classifier with a possible shortcut','penguins_mixed',['logistic'],'Classify Penguin species from measurements and context. Compare a training-only measurements-only ablation to investigate reliance on geography/context.','Would the same geographic context be available in the intended use?','Strong scores can depend on a shortcut.','OHE, StandardScaler, LogisticRegression, macro F1 and stratified CV.','Compare C within the pipeline and inspect the context ablation using the same training folds.'),
 ('Diagnose an overfitting classification tree','car',['classification_tree'],'Build and diagnose a Car acceptability tree. Compare depth choices and explain class errors and the limits of feature importance.','Which evidence distinguishes memorisation from useful rules?','Inspect validation error as complexity changes.','DecisionTreeClassifier, OneHotEncoder, GridSearchCV and confusion_matrix.','Evaluate depth choices within training folds before selecting a final tree.'),
 ('Choose neighbours on a meaningful scale','penguins',['knn_cls'],'Classify Penguin species with KNN using continuous measurements. Choose k without allowing held-away rows to become neighbours.','Which units would dominate unscaled distance?','Distance reflects measurement units.','StandardScaler, KNeighborsClassifier and a pipeline neighbour grid.','Fit scaling inside folds, compare k, diagnose class errors and finish.'),
 ('Validate a nonlinear margin classifier','breast',['svm_cls'],'Use the five-feature Breast measurement scenario to validate a scaled RBF SVM and explain its available outputs.','Does this SVM provide probabilities or decision values?','Margin scores are not probabilities.','SVC, StandardScaler, decision_function and macro F1.','Compare C using training evidence, inspect errors and report final metrics without inventing probabilities.'),
 ('One-R for categorical decisions','car',['one_r'],'Use the production One-R helper to classify Car acceptability from categorical inputs. Explain the selected rule and unknown-category fallback.','What can one input fail to represent?','One feature must carry the entire rule.','OneRPreprocessor, OneRClassifier, stratified CV and macro F1.','Evaluate the learned rule against the reference, inspect its failures and finish without a numeric-bin search.'),
 ('One-R with numeric bins','candy_binary',['one_r'],'Classify Candy popular using sugarpercent, pricepercent and the nine flags. Keep winpercent out of X and learn numeric bins only inside fits.','Which inputs need bins and which are already discrete?','Bin boundaries are learned information.','OneRPreprocessor numeric/discrete metadata and the bins grid.','Compare bin counts inside training folds, preserve binary types and explain the selected rule.'),
 ('Gaussian Naive Bayes for measurements','breast',['naive_bayes'],'Build a Gaussian NB workflow for the five continuous Breast measurements. Interpret class probabilities and the independence approximation.','What kind of values does each input represent?','Match feature evidence to measurement type.','GaussianNB, var_smoothing, predict_proba and macro F1.','Compare smoothing within training folds, inspect probability/class alignment and finish.'),
 ('Bernoulli Naive Bayes for binary characteristics','candy_binary',['naive_bayes'],'Classify Candy popular using only the nine presence/absence flags. Inspect smoothing and minority errors.','What information does an absent characteristic carry?','Zeros carry evidence too.','BernoulliNB, alpha, stratified CV and macro F1.','Compare smoothing using binary inputs and training evidence, then inspect errors and finish.'),
 ('Categorical Naive Bayes using the production path','car',['naive_bayes'],'Classify Car acceptability using the production categorical OHE–Bernoulli NB pipeline, preserving a reusable category schema.','How can categories become binary inputs without invented order?','Represent categories with indicators.','OneHotEncoder, BernoulliNB and a pipeline alpha grid.','Learn encoding inside each fit, compare smoothing, diagnose and finish.'),
 ('Shared and class-specific covariance','penguins',['lda','qda'],'Compare LDA and regularised QDA on the same Penguin measurement population and stratified folds. Explain covariance assumptions and stability evidence.','What extra information must support QDA’s flexibility?','Flexible covariance requires within-class support.','LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis, shrinkage and reg_param.','Compare both assumptions and validation evidence on the same population, then nominate before final testing.'),
 ('A neural regressor with trustworthy units','Wine600',['mlp_reg'],'Predict Wine quality using the fixed 600-row teaching sample, feature scaling and an internal target transformation. Inspect convergence and original-unit errors.','Which transformation acts on X and which on y?','Scaled optimisation must return meaningful output units.','MLPRegressor, TransformedTargetRegressor and nested width parameters.','Keep target transformation inside fitting, compare widths and report inverse-transformed predictions.'),
 ('Does a neural classifier justify its complexity?','breast',['mlp_cls','logistic'],'Compare a small neural classifier with logistic regression on the five-feature Breast scenario. Consider predictive evidence, convergence and cost.','What evidence would justify more complexity?','Complexity needs evidence.','MLPClassifier, LogisticRegression and matching stratified folds.','Compare both searches and training diagnostics before choosing; either model may be defensible.'),
 ('Discover and describe Penguin groups','penguins',['kmeans'],'Discover groups from Penguin measurements with species hidden during fitting. Combine k evidence with sizes and original-unit profiles.','What would make a grouping useful for this exploratory question?','No score proves natural classes.','StandardScaler, KMeans, silhouette_score and group profiles.','Combine geometry and scores with useful descriptions; state the chosen population and limitations.'),
 ('Describe a sampled hierarchy','breast',['hierarchical'],'Describe a Ward hierarchy of a reproducible sample of at most 500 Breast measurement rows, with diagnosis excluded from fitting.','Which rows will the group labels describe?','Sample labels belong to sampled rows.','linkage, dendrogram, cut_tree and index-aligned profiles.','Scale the population, preserve sample identity through the hierarchy, compare cuts and qualify the scope.'),
 ('Retain information without confusing it with a picture','breast',['pca'],'Reduce all 30 Breast measurements with PCA. Retain at least 90% variance and distinguish the reduced representation from a separate two-dimensional view.','Are two plotted axes enough to represent the retained information?','The picture and retained representation may have different dimensions.','PCA, explained_variance_ratio_, components_ and transform.','Choose retention from cumulative variance, label weights/scores and report the two-axis view separately.')
]

def challenges(specs):
    result=[]
    inputs=json.loads((Path(__file__).parent/'inputs.json').read_text())
    for i,(spec,brief) in enumerate(zip(specs,BRIEFS)):
        title,key,models,question,planning,think,tools,approach=brief
        assert spec['id']=='X'+str(i+1).zfill(2)
        assert spec['models']==models
        if i==8:exercise=one_r(False)
        elif i==9:exercise=one_r(True)
        elif i==16:exercise=copy.deepcopy(KMEANS)
        elif i==17:exercise=copy.deepcopy(HIERARCHY)
        elif i==18:exercise=copy.deepcopy(PCA)
        else:exercise=supervised(key,models,'ML-'+spec['id'])
        s=DATA[key]
        if i==9:
            s={**DATA['candy_binary'],'numeric':['sugarpercent','pricepercent']}
        prepared=inputs['ML-'+spec['id']]
        prefix="import numpy as np\nimport pandas as pd\ndf=pd.read_csv("+repr(prepared['file'])+")\n"
        exercise['solution']=prefix+exercise['solution']
        exercise.update(id='ML-'+spec['id'],dataset='ML-'+spec['id'],inputFile=prepared['file'],kind='python',preload=False,starter='# Write your workflow here.\n',task=question)
        if i==4:
            marker='# This solution nominates'
            ablation="""# Training-only contextual-feature ablation on identical folds.
from sklearn.linear_model import LogisticRegression
measurement_columns=['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']
measurement_model=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))])
ablation_results=cross_validate(measurement_model,X_train[measurement_columns],y_train,cv=folds,scoring='f1_macro')
"""
            exercise['solution']=exercise['solution'].replace(marker,ablation+marker)
            exercise['outputs'].append('ablation_results')
            exercise['checks'].append(check('Training-only ablation','len(ablation_results["test_score"])==5 and np.isfinite(ablation_results["test_score"]).all()','Compare measurements-only validation on the same five training folds.'))
        if i in (10,11,12):
            exercise['solution']+="probabilities=pd.DataFrame(final_model.predict_proba(X_test),columns=final_model.classes_,index=X_test.index)\n"
            exercise['outputs'].append('probabilities')
            exercise['checks'].append(check('Class-labelled probabilities','list(probabilities.columns)==list(final_model.classes_) and np.allclose(probabilities.sum(axis=1),1)','Align probability columns with fitted class labels.'))
        if i in (17,18):
            exercise['checks'].append(dict(name='Interpretation',selfReview=True,message=approach+' State assumptions and limitations; do not claim true classes or causal axes.'))
        exercise['hints']=dict(think=think,tools=tools,approach=approach)
        exercise['explanation']=approach
        workflow_contract(exercise)
        deliverables=[dict(name=c['name'],contract='Interpretation' if c.get('selfReview') else 'Workflow condition',label=c['name'],requirement=c['message'],format='Self-review' if c.get('selfReview') else 'Run evidence',kind='self-review' if c.get('selfReview') else 'value') for c in exercise['checks']]
        minutes='45–60 minutes' if i in (3,14,15) else '40–50 minutes' if len(models)>1 else '30–45 minutes'
        result.append(dict(id='ML-'+spec['id'],deck='workflows',title=title,question=question,minutes=minutes,
          family=('time' if i==3 else 'regression' if i<3 else 'neural' if i in (14,15) else 'clustering' if i in (16,17) else 'pca' if i==18 else 'classification'),tags=models+(['discovery','profiles'] if i>=16 else ['validation','reference','final-test discipline']),
          models=models,prerequisites=['ML-'+d for d in spec['deps']],planning=[planning],hints=exercise['hints'],
          inputs=[dict(prepared,name='df')],
          policies=['Keep target-derived inputs out of X.','Use training-only selection for prediction, or reference-free fitting for discovery.'],
          deliverables=deliverables,deliverableGroups=groups(exercise,i),deliverableType='Complete workflow and evidence',reference=exercise['solution'],
          explanationSteps=[think,approach,'Inspect the returned evidence and qualify the claim for the stated population.'],
          alternative='Equivalent ordinary Python is welcome. A defensible candidate or grouping need not match the solution’s choice; objective evidence must remain consistent.',
          exercise=exercise))
    assert len(result)==len(specs)
    return result

def author_retrieval():
    reviews={
      'F-R1':('Foundations retrieval',[('F02',0),('F04',0),('F05',0)]),
      'F-R2':('Honest evaluation retrieval',[('F10',1),('F09',2),('F06',1)]),
      'W-R1':('Preparation retrieval',[('W03',2),('W04',1),('W07',2)]),
      'W-R2':('Workflow evidence retrieval',[('W09',3),('W11',0),('W14',2)]),
      'R-R1':('Regression evidence retrieval',[('R04',1),('R02',2),('R03',2)]),
      'R-R2':('Flexibility retrieval',[('R07',2),('R08',2),('R10',1)]),
      'C-R1':('Classification evidence retrieval',[('C03',0),('C04',0),('C06',1)]),
      'C-R2':('Neighbours, margins and rules retrieval',[('C09',1),('C10',2),('C13',2)]),
      'C-R3':('Trees and distributions retrieval',[('C16',3),('C18',0),('C14',3)]),
      'N-R1':('Shared network retrieval',[('N01',0),('N02',2),('N05',2)]),
      'U-R1':('K-Means retrieval',[('U01',1),('U04',3),('U05',0)]),
      'U-R2':('Hierarchy retrieval',[('U07',2),('U09',2),('U10',1)]),
      'P-R1':('PCA retrieval',[('P04',1),('P05',2),('P06',2)]),
      'M-R1':('Model-choice retrieval',[('M01',2),('M02',1),('M03',2)]),
    }
    for id,(title,refs) in reviews.items():
        exercises=[]
        for source,index in refs:
            original=CARDS[source];e=copy.deepcopy(original['exercises'][index])
            e['task']='Retrieve without the worked example: '+e['task']
            if e['kind']=='python':
                e['dataset']=e.get('dataset') or original['dataset']
                e['dataset']+='_REVIEW'
                e['task']+=' Use the new retrieval population shown here.'
            exercises.append(e)
        lesson(id,title,'Retrieve earlier concepts before combining them.','Use the inputs and evidence to recover the method. Hints and explained solutions remain collapsed; exact phrasing is not graded.','Retrieve from memory','comparison',exercises,chapter=max(CARDS[source]['chapter'] for source,index in refs),example='')
        CARDS[id]['example']=None
    # Different scenarios retrieve the same concepts without repeating the teaching prompt.
    retrieval_prompts={
      ('F-R2',2):'A delivery model has training RMSE 0.2 minutes and new-route RMSE 9 minutes. Explain why the training result does not establish useful generalisation.',
      ('W-R2',0):'A five-fold search reports test_score for each fold. Your reserved 20% table has never been passed to it. Which evidence is this?',
      ('W-R2',1):'You have 240 development rows and 60 reserved rows. Which population may decide a parameter choice?',
      ('R-R1',2):'A city-level line links average income and life expectancy. Can its coefficient establish how an income intervention would affect one person?',
      ('C-R2',0):'A neighbour classifier stores all observations, including the row whose validation prediction is requested. Is this a valid held-away evaluation?',
      ('C-R2',1):'An RBF classifier returns decision values -1.4, 0.2 and 2.8. May a report label these as class probabilities?',
      ('C-R3',0):'A proposed Naive Bayes scenario contains a temperature, a yes/no flag and a named service category in one undifferentiated input block. Does the production recipe support that mixed likelihood?',
      ('C-R3',1):'Two classes show different orientations and spreads. Which covariance assumption would let QDA represent this difference?',
      ('C-R3',2):'A service-category tree scores 0.99 training macro F1 and 0.61 validation macro F1. Its largest importance is distance. Interpret the gap and qualify the importance claim.',
      ('N-R1',0):'A network diagram has 16 units in the first hidden layer and 8 in the next. What does hidden_layer_sizes=(16,8) encode?',
      ('N-R1',1):'At iterations 100, 200 and 400, training loss is 2.0, 1.2 and 0.7 while validation error is 2.3, 2.5 and 3.0. Interpret the two trends.',
      ('N-R1',2):'Two hidden-width settings stop at different internal scores. Which evidence should nominate the setting for the intended prediction task?',
      ('U-R1',0):'You group anonymous delivery measurements without a target label. Why is supervised accuracy unavailable as the fitting objective?',
      ('U-R1',1):'Grouping A has silhouette .51 and balanced sizes; B has .52 and one tiny specialised group. Must either answer be automatically rejected?',
      ('U-R2',0):'A truncated Ward diagram has its last merge far above the others. What does the merge height represent?',
      ('U-R2',1):'You compare K-Means profiles on 800 observations with Ward profiles on a 500-row sample. What must be aligned for a direct comparison?',
      ('U-R2',2):'A 500-row Ward sample yields groups with different original-unit measurement means. Write a conclusion that states the sample scope and avoids claiming true classes.',
      ('P-R1',2):'PCA fitted on anonymous measurements gives a 2D display. A researcher later colours points by an external category. What can the display suggest, and what does it not prove?',
      ('M-R1',0):'A team wants a centre-based grouping and a second view showing nested merges. Which pairing describes the two clustering methods?',
      ('M-R1',1):'For daily demand, candidate A uses shuffled folds and candidate B uses forward folds. Is their score gap a clean comparison of estimators?',
      ('M-R1',2):'Three regression candidates have mean validation RMSE 8.1, 8.2 and 8.0; a mean reference has 8.1, with fold variation 0.8. Write a useful, qualified conclusion.',
    }
    for (id,index),prompt in retrieval_prompts.items():CARDS[id]['exercises'][index]['task']=prompt
    foundation=dict(kind='python',dataset='LINE24B',solution="""from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import root_mean_squared_error
X=df[['distance']]
y=df.duration
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42)
model=LinearRegression().fit(X_train,y_train)
predictions=model.predict(X_test)
answer=root_mean_squared_error(y_test,predictions)
""",checks=[check('X and y',"X.equals(df[['distance']]) and y.equals(df.duration)",'Select distance as X and duration as y.'),check('Split integrity','set(X_train.index).isdisjoint(X_test.index) and len(X_test)==5 and trace.no_test_fit()','Keep test rows separate from fitting.'),check('RMSE','np.isclose(answer,np.sqrt(np.mean((y_test-predictions)**2)))','Use RMSE in duration units.')],outputs=['answer','predictions'],protect=dict(target='duration'))
    nclass=supervised('penguins',['mlp_cls'],'ML-N-K2-1')
    regression=supervised('candy',['multiple_linear','regression_tree'],'ML-R-K1-1')
    classification=supervised('penguins_mixed',['logistic'],'ML-C-K1-1')
    discovery=copy.deepcopy(KMEANS)
    discovery['dataset']='CLUSTER36B'
    discovery['solution']=discovery['solution'].replace("X=df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]","X=df.copy()").replace('group.bill_length_mm,group.bill_depth_mm','group.length_mm,group.width_cm').replace('Bill length (mm)','Length (mm)').replace('Bill depth (mm)','Width (cm)').replace('Exploratory Penguin groups','Exploratory measurement groups')
    discovery['checks'][0]=check('X-only inputs','X.equals(df)','Use the supplied measurements only.')
    pca=copy.deepcopy(PCA);pca['dataset']='penguins'
    pca['solution']=pca['solution'].replace("X = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]","X = df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]")
    pca['checks'][0]=check('Target-free inputs','X.shape[1]==4 and "species" not in X.columns','Use the four measurement columns only.')
    checkpoints=[
      ('F-K1','ML Foundations checkpoint',foundation,'Define X/y, split, fit, predict and evaluate a line.'),
      ('W-K1','Supervised Workflow checkpoint',copy.deepcopy(LINEAR),'Build a mixed LinearRegression pipeline, compare a mean reference with five-fold CV, create OOF residuals, keep defaults and report final RMSE. No tree tuning is required.'),
      ('R-K1','Regression checkpoint',regression,'Compare mixed-input linear regression and a tree on Candy with common training folds, a reference, diagnosis and final evidence.'),
      ('C-K1','Classification checkpoint',classification,'Complete a stratified mixed Penguin logistic workflow with macro F1, a reference, tuning and confusion evidence.'),
      ('N-K1','Neural regression checkpoint',copy.deepcopy(NEURAL),'Complete the Wine600 neural regression workflow with feature/target scaling, width selection, convergence evidence and original-unit errors.'),
      ('N-K2','Neural classification checkpoint',nclass,'Complete the Penguin neural classifier workflow with a reference, width selection, class diagnostics and final metrics.'),
      ('U-K1','Discovery checkpoint',discovery,'Scale the transfer population, compare k evidence, profile groups and qualify their interpretation.'),
      ('P-K1','PCA checkpoint',pca,'Fit Penguin PCA, retain at least 90% variance, label weights and report the separate 2D view.'),
    ]
    for id,title,e,task in checkpoints:
        workflow_contract(e)
        e.update(kind='python',task=task,starter='# Assemble the workflow from the brief.\n')
        e.setdefault('hints',dict(think='Identify the question and required evidence.',tools='Revisit the prerequisite cards when you need an API reminder.',approach=task))
        e.setdefault('explanation',task+' Keep interpretation proportional to the evidence.')
        lesson(id,title,task,'This checkpoint combines previously taught skills. Assemble the workflow; help remains available when needed.','Complete workflow','pipeline',[e],dataset=e['dataset'],chapter=2,example='')
        CARDS[id]['example']=None
    lesson('M-K1','Choose and Explain Models checkpoint','Audit task-family choice and evidence across the complete curriculum.',
        'Use the supplied briefs to distinguish predictive comparison, grouping and representation. Judge evidence within each task rather than ranking incompatible metrics.','Task and evidence audit','tasks',[
        reflect('Audit these five cases and write a concise report: (1) Wine candidate A/B CV RMSE 0.8/0.81 with fold variation 0.1; (2) Penguin classifier accuracy .95 but minority recall .2; (3) K-Means k=3/4 silhouettes .51/.52 with very different sizes; (4) Ward profiles computed on a 500-row sample but claimed for 569 rows; (5) PCA retains 90% in seven axes but displays only two. For each, state the task, defensible conclusion and a limitation.',
        'Wine: small CV difference does not establish universal superiority; consider uncertainty and cost. Penguins: accuracy hides minority errors; inspect macro F1 and per-class evidence. K-Means: either k may be defensible if supported by purpose and profiles. Ward: labels and profiles describe sampled rows only. PCA: the 2D view is distinct from the seven-axis retained representation. None of these establishes causal effects.')],chapter=2,example='')
    CARDS['M-K1']['example']=None
