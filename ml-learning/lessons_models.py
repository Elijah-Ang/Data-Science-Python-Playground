from authoring import lesson,py,decide,reflect
from lessons_foundations import SPLIT,FIT,MIX

CURVE="""from sklearn.model_selection import train_test_split
X=df[['x']]
y=df.y
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42)
"""
CLASS="""from sklearn.model_selection import train_test_split
X=df[['length','width']]
y=df.label
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
"""
CLASS_FIT=CLASS+"""from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
model=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))]).fit(X_train,y_train)
"""
COV="""from sklearn.model_selection import train_test_split
X=df[['x1','x2']]
y=df.label
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
"""
PENGUIN="""from sklearn.model_selection import train_test_split
numeric=['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']
X=df[numeric]
y=df.species
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
"""

def author():
    regression();classification();networks()

def regression():
    lesson('R01','Read a fitted line','Interpret slope and intercept in context.',
        'A coefficient describes the predicted target change for one unit of its input. The intercept is the predicted value at input zero, which may be outside the useful data range.',
        'model.coef_\nmodel.intercept_','regression',[
        py('Store the fitted distance coefficient in slope and the intercept in intercept.',"slope=float(model.coef_[0])\nintercept=float(model.intercept_)","np.isclose(slope,model.coef_[0]) and np.isclose(intercept,model.intercept_)",setup=FIT,outputs=['slope','intercept']),
        py('Calculate the predicted duration difference for five additional distance units.',"answer=5*model.coef_[0]","np.isclose(answer,5*model.coef_[0])",setup=FIT),
        reflect('Candy uses sugarpercent, a dataset-relative percentile. What does a one-unit coefficient mean?','It is the predicted winpercent change per full unit of the supplied percentile scale, within this model and dataset context. It is not a causal effect of adding a gram of sugar.')],models=['simple_linear'])
    lesson('R02','RMSE and R² answer different questions','Distinguish target-unit errors from relative fit.',
        'RMSE measures errors in target units. R² compares squared error with variation around the evaluation-set mean. It can be negative. A trained mean dummy uses the training mean, so it is a distinct reference.',
        'root_mean_squared_error(y_test, predictions)\nr2_score(y_test, predictions)','comparison',[
        py('Compute RMSE and R² for the supplied predictions; store them in rmse and r2.',"from sklearn.metrics import root_mean_squared_error,r2_score\nrmse=root_mean_squared_error(y_test,predictions)\nr2=r2_score(y_test,predictions)","np.isclose(rmse,np.sqrt(np.mean((y_test-predictions)**2))) and np.isclose(r2,1-np.sum((y_test-predictions)**2)/np.sum((y_test-y_test.mean())**2))",setup=FIT,outputs=['rmse','r2']),
        decide('What does negative test R² mean?',['A negative amount of error','Worse squared error than using that evaluation population’s mean','The model proves no relationship'],1,'Negative R² means worse squared error than the evaluation-mean reference; it does not prove an absence of relationship.'),
        py('Calculate evaluation_mean from y_test and training_mean from y_train. Compare the two populations.',"evaluation_mean=float(y_test.mean())\ntraining_mean=float(y_train.mean())","np.isclose(evaluation_mean,y_test.mean()) and np.isclose(training_mean,y_train.mean())",setup=SPLIT,outputs=['evaluation_mean','training_mean'])])
    lesson('R03','Read residual patterns and limits','Use residual structure to question a fitted relationship.',
        'A pattern in residuals suggests the model has left systematic structure unexplained. Association, prediction, extrapolation and causation are different claims.',
        'residual = actual - predicted','regression',[
        py('Fit a line to CURVE48 training rows and plot residuals against x.',"from sklearn.linear_model import LinearRegression\nimport matplotlib.pyplot as plt\nmodel=LinearRegression().fit(X_train,y_train)\nanswer=y_test-model.predict(X_test)\nfig,ax=plt.subplots()\nax.scatter(X_test.x,answer)\nax.axhline(0,color='black')\nax.set(xlabel='x',ylabel='Residual',title='Line fitted to curved observations')","np.allclose(answer,y_test-model.predict(X_test)) and len(fig.axes[0].collections)==1",dataset='CURVE48',setup=CURVE),
        decide('Residuals are mostly positive at both ends and negative in the middle. What is sensible?',['Assume the line captured all structure','Investigate a curved relationship using training validation','Tune using final-test rows until the pattern disappears'],1,'The pattern motivates another candidate, selected using training-only evidence.'),
        reflect('A Gapminder line links GDP and life expectancy. Can its coefficient establish the effect of an intervention?','No. Countries differ in many ways; observational association and prediction do not identify an intervention effect. Extrapolating beyond the observed range adds another limitation.')])
    multi=MIX+"from sklearn.linear_model import LinearRegression\nmodel=LinearRegression().fit(X_train[['distance','weight']],y_train)\n"
    lesson('R04','Several predictors, conditional comparisons','Interpret one input while holding others fixed.',
        'Multiple regression fits several coefficients together. Each coefficient describes a conditional comparison with the other model inputs held constant.',
        "LinearRegression().fit(X_train[['distance','weight']], y_train)",'regression',[
        py('Fit distance and weight, and return their named coefficients.',"answer=pd.Series(model.coef_,index=['distance','weight'])","list(answer.index)==['distance','weight'] and np.allclose(answer,model.coef_)",setup=multi,dataset='MIX60'),
        py('Compare two rows with identical distance and a two-unit weight difference.',"rows=pd.DataFrame({'distance':[5,5],'weight':[2,4]})\nanswer=float(np.diff(model.predict(rows))[0])","np.isclose(answer,2*model.coef_[1])",setup=multi,dataset='MIX60'),
        reflect('A Candy model includes sugarpercent and pricepercent. How should the sugar coefficient be described?','It is the fitted sugar-percentile association with winpercent holding pricepercent fixed, subject to the dataset and model assumptions.')],chapter=1,models=['multiple_linear'])
    encoded=MIX+"""from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
prepare=ColumnTransformer([('numeric','passthrough',['distance','weight']),('service',OneHotEncoder(drop='first',handle_unknown='ignore',sparse_output=False),['service'])])
model=Pipeline([('prepare',prepare),('model',LinearRegression())]).fit(X_train,y_train)
"""
    lesson('R05','Read coefficients after encoding','Align coefficients with encoded feature names and a reference category.',
        'Dropping one category gives an explicit reference for linear coefficients with an intercept. Category coefficients compare with that reference, conditional on other inputs.',
        "OneHotEncoder(drop='first')\nprepare.get_feature_names_out()", 'table',[
        py('Identify the omitted service reference from the fitted encoder.',"encoder=model.named_steps['prepare'].named_transformers_['service']\nanswer=encoder.categories_[0][encoder.drop_idx_[0]]","answer=='economy'",dataset='MIX60',setup=encoded),
        py('Create a Series matching every transformed feature name to its coefficient.',"answer=pd.Series(model.named_steps['model'].coef_,index=model.named_steps['prepare'].get_feature_names_out())","len(answer)==len(model.named_steps['model'].coef_) and list(answer.index)==list(model.named_steps['prepare'].get_feature_names_out()) and np.allclose(answer,model.named_steps['model'].coef_)",dataset='MIX60',setup=encoded),
        reflect('Wine type is encoded in a multiple regression. Does its coefficient compare all red and white wines unconditionally?','No. It compares the encoded wine-type categories conditional on the included chemistry predictors and the chosen reference. It does not establish a causal type effect.')],chapter=1)
    lesson('R06','Correlated predictors and unstable coefficients','Separate coefficient stability from predictive stability.',
        'Highly correlated inputs can exchange coefficient weight with little change in predictions. This makes individual effects difficult to interpret.',
        'Compare coefficients and predictions after a small input perturbation.','comparison',[
        py('Fit a line using distance and a near-copy of distance. Store the two coefficients in answer, labelled by their feature names.',"from sklearn.linear_model import LinearRegression\nrng=np.random.default_rng(42)\nX=pd.DataFrame({'distance':df.distance,'near_copy':df.distance+rng.normal(0,.001,len(df))})\nmodel=LinearRegression().fit(X,df.duration)\nanswer=pd.Series(model.coef_,index=X.columns)","list(answer.index)==list(X.columns) and np.allclose(answer.values,model.coef_)",dataset='MIX60'),
        reflect('Why might a large coefficient change coexist with nearly unchanged predictions?','Correlated columns can offset each other in the fitted sum. The data may constrain their combined predictive contribution more strongly than either coefficient alone.')],chapter=1)
    lesson('R07','Make curved features','Understand expansion before fitting.',
        'PolynomialFeatures constructs powers and interactions. The subsequent regression remains linear in those expanded features, while predictions can curve in the original inputs.',
        'PolynomialFeatures(degree=2, include_bias=False)','regression',[
        py('Expand CURVE48 x into x and x squared.',"from sklearn.preprocessing import PolynomialFeatures\nexpander=PolynomialFeatures(degree=2,include_bias=False)\nanswer=expander.fit_transform(df[['x']])","np.allclose(answer,np.column_stack([df.x,df.x**2]))",dataset='CURVE48'),
        py('Use degree-three polynomial features to store x, x² and x³ for every row, in that column order, in answer.',"from sklearn.preprocessing import PolynomialFeatures\nanswer=PolynomialFeatures(degree=3,include_bias=False).fit_transform(df[['x']])","np.allclose(answer,np.column_stack([df.x,df.x**2,df.x**3]))",dataset='CURVE48'),
        py('Expand distance and weight to degree two; report feature names.',"from sklearn.preprocessing import PolynomialFeatures\nexpander=PolynomialFeatures(degree=2,include_bias=False).fit(df[['distance','weight']])\nanswer=list(expander.get_feature_names_out())","answer==['distance','weight','distance^2','distance weight','weight^2']",dataset='MIX60')],chapter=2,models=['polynomial'])
    poly="""from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures,StandardScaler
from sklearn.linear_model import Ridge
model=Pipeline([('polynomial',PolynomialFeatures(degree=2,include_bias=False)),('scale',StandardScaler()),('model',Ridge())])
"""
    lesson('R08','Validate polynomial flexibility','Choose degree inside the complete pipeline.',
        'Expansion, scaling and Ridge belong together inside CV. Scaling after expansion makes regularisation act on comparable terms. Compare a curve with a line on identical folds.',
        "GridSearchCV(model, {'polynomial__degree':[2,3]}, cv=folds, scoring='neg_root_mean_squared_error')",'folds',[
        py('Create the degree-two polynomial pipeline. Store the transformed training x and x² columns in answer, one row per training example.',poly+"answer=model.named_steps['polynomial'].fit_transform(X_train)","answer.shape==(len(X_train),2) and np.allclose(answer[:,0],X_train.x) and np.allclose(answer[:,1],X_train.x**2)",dataset='CURVE48',setup=CURVE),
        py('Fit the complete expansion–scale–Ridge pipeline and predict.',poly+"model.fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and np.isfinite(answer).all()",dataset='CURVE48',setup=CURVE),
        py('Search degrees 2 and 3 with five reproducible training folds.',poly+"from sklearn.model_selection import GridSearchCV,KFold\nfolds=KFold(5,shuffle=True,random_state=42)\nsearch=GridSearchCV(model,{'polynomial__degree':[2,3]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==2 and np.isfinite(answer).all() and search.best_params_['polynomial__degree'] in [2,3]",dataset='CURVE48',setup=CURVE),
        reflect('A degree-three curve has lower training error but higher CV RMSE than a line. What should be nominated before final testing?','The supplied evidence supports the line if predictive RMSE is the selection goal. Extra flexibility does not earn preference merely by fitting training data more closely.')],chapter=2)
    lesson('R09','Trees predict with leaf averages','Learn recursive splits and regression leaves within this branch.',
        'A regression tree repeatedly splits rows using thresholds. Each terminal leaf predicts an average training target. Threshold order matters; feature scaling is unnecessary.',
        'DecisionTreeRegressor(random_state=42)\nplot_tree(model)','tree',[
        py('Fit a depth-three tree to STEP60 and draw its splits and leaf values.',"from sklearn.tree import DecisionTreeRegressor,plot_tree\nimport matplotlib.pyplot as plt\nmodel=DecisionTreeRegressor(max_depth=3,random_state=42).fit(X_train,y_train)\nfig,ax=plt.subplots(figsize=(9,4))\nplot_tree(model,feature_names=['x'],ax=ax)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and model.get_depth()<=3",dataset='STEP60',setup=CURVE),
        py('For x=5, store the fitted tree’s terminal node in leaf and its predicted value in prediction.',"row=pd.DataFrame({'x':[5.]})\nleaf=int(model.apply(row)[0])\nprediction=float(model.predict(row)[0])","leaf==int(model.apply(pd.DataFrame({'x':[5.]}))[0]) and np.isclose(prediction,model.predict(pd.DataFrame({'x':[5.]}))[0])",dataset='STEP60',setup=CURVE+"\nfrom sklearn.tree import DecisionTreeRegressor\nmodel=DecisionTreeRegressor(max_depth=3,random_state=42).fit(X_train,y_train)",outputs=['leaf','prediction']),
        py('Fit a Candy tree directly on sugarpercent and pricepercent without scaling.',"from sklearn.tree import DecisionTreeRegressor\nmodel=DecisionTreeRegressor(max_depth=3,random_state=42).fit(train[['sugarpercent','pricepercent']],train.winpercent)\nanswer=model.predict(test[['sugarpercent','pricepercent']])","len(answer)==len(test) and np.isfinite(answer).all()",dataset='candy',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42)")],chapter=2,models=['regression_tree'])
    tree_setup=CURVE+"\nfrom sklearn.tree import DecisionTreeRegressor\nfrom sklearn.model_selection import GridSearchCV,KFold\nfolds=KFold(5,shuffle=True,random_state=42)\n"
    lesson('R10','Control tree complexity','Use depth and minimum leaf size with validation evidence.',
        'A deep tree can memorise small groups. Depth and minimum leaf size constrain flexibility. Impurity importance describes this fitted model, not causal importance.',
        "GridSearchCV(DecisionTreeRegressor(random_state=42), {'max_depth':[3,5,None]}, ...)",'tree',[
        py('Search the production depth choices with five training folds.',"search=GridSearchCV(DecisionTreeRegressor(random_state=42),{'max_depth':[3,5,None]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nanswer=-search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='STEP60',setup=tree_setup),
        py('Compare minimum leaf sizes 1, 5 and 10.',"search=GridSearchCV(DecisionTreeRegressor(random_state=42),{'min_samples_leaf':[1,5,10]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nanswer=-search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='STEP60',setup=tree_setup),
        reflect('A tree gives distance high importance but retains patterned residuals. What can you conclude?','Distance helped the fitted tree’s splits; the residuals suggest remaining structure. Importance is model- and sample-dependent and does not establish a causal effect.')],chapter=2)
    lesson('R11','What fitted explanations cannot establish','Match claim strength to the evidence.',
        'A useful model can still omit important factors. Weak predictive results do not prove no relationship; fitted explanations do not establish interventions.',
        'Evidence → qualified claim','comparison',[
        decide('Which claim exceeds an observational fitted model?',['The model had RMSE 4 on the held-out sample','Changing this input will cause the coefficient-sized outcome change'],1,'A causal intervention effect needs additional identification assumptions or study design.'),
        reflect('Rewrite: “The model is weak, so there is no relationship.”','The evaluated model and inputs showed limited predictive evidence on this sample. Other relationships, features, data or model specifications could behave differently.')],chapter=2)

def classification():
    lesson('C01','Read a confusion matrix','Track which labels are confused.',
        'Rows represent actual classes and columns predicted classes when using sklearn confusion_matrix. Explicit label order prevents accidental relabelling.',
        "confusion_matrix(actual, predicted, labels=['A','B'])",'classification',[
        py('Build the A/B confusion matrix from ERROR12.',"from sklearn.metrics import confusion_matrix\nanswer=confusion_matrix(df.actual,df.predicted,labels=['A','B'])","np.array_equal(answer,[[7,1],[3,1]])",dataset='ERROR12'),
        py('Correct the prediction at index 8 to B and rebuild the matrix.',"from sklearn.metrics import confusion_matrix\nchanged=df.predicted.copy()\nchanged.iloc[8]='B'\nanswer=confusion_matrix(df.actual,changed,labels=['A','B'])","np.array_equal(answer,[[7,1],[2,2]])",dataset='ERROR12'),
        py('Preserve A,B,C order even when no C predictions occur.',"from sklearn.metrics import confusion_matrix\nanswer=confusion_matrix(df.actual,df.predicted,labels=['A','B','C'])","answer.shape==(3,3) and answer.sum()==12 and np.all(answer[2]==0)",dataset='ERROR12')])
    lesson('C02','Precision and recall','Connect different errors to different questions.',
        'Precision asks how often predictions of a class are correct. Recall asks how many actual members of a class were found. Different costs can favour different trade-offs.',
        "precision_score(y, predicted, pos_label='B')",'classification',[
        py('Calculate class B precision and recall from the supplied actual and predicted labels. Store them in precision_b and recall_b.',"from sklearn.metrics import precision_score,recall_score\nprecision_b=precision_score(df.actual,df.predicted,pos_label='B')\nrecall_b=recall_score(df.actual,df.predicted,pos_label='B')","np.isclose(precision_b,.5) and np.isclose(recall_b,.25)",dataset='ERROR12',outputs=['precision_b','recall_b']),
        decide('Flagging more cases catches more positives but adds false positives. Which trade-off is plausible?',['Higher recall with lower precision','Both must improve','Recall cannot change'],0,'A broader positive prediction set can improve recall while reducing precision.'),
        py('Build answer as a table of precision and recall for classes A then B, with one row per class and columns precision and recall.',"from sklearn.metrics import precision_score,recall_score\nanswer=pd.DataFrame({'precision':precision_score(df.actual,df.predicted,labels=['A','B'],average=None),'recall':recall_score(df.actual,df.predicted,labels=['A','B'],average=None)},index=['A','B'])","list(answer.index)==['A','B'] and list(answer.columns)==['precision','recall'] and np.allclose(answer.precision,[.7,.5]) and np.allclose(answer.recall,[.875,.25])",dataset='ERROR12')])
    lesson('C03','Macro F1 and imbalance','Evaluate every class explicitly.',
        'F1 balances precision and recall for a class. Macro F1 averages class F1 values equally, regardless of frequency. Production uses macro F1 for classifier selection and reports accuracy alongside it.',
        "f1_score(y, predicted, average='macro')",'classification',[
        py('Compute macro F1 for ERROR12.',"from sklearn.metrics import f1_score\nanswer=f1_score(df.actual,df.predicted,average='macro')","np.isclose(answer,5/9)",dataset='ERROR12'),
        py('Calculate macro_f1 and accuracy from the same ERROR12 predictions.',"from sklearn.metrics import f1_score,accuracy_score\nmacro_f1=f1_score(df.actual,df.predicted,average='macro')\naccuracy=accuracy_score(df.actual,df.predicted)","np.isclose(macro_f1,5/9) and np.isclose(accuracy,2/3)",dataset='ERROR12',outputs=['macro_f1','accuracy']),
        py('Evaluate a most-frequent classifier on Car’s stratified test split. Store macro_f1 and accuracy from the same test predictions.',"from sklearn.dummy import DummyClassifier\nfrom sklearn.metrics import f1_score,accuracy_score\nmodel=DummyClassifier(strategy='most_frequent').fit(train[['buying']],train.acceptability)\npred=model.predict(test[['buying']])\nmacro_f1=f1_score(test.acceptability,pred,average='macro')\naccuracy=accuracy_score(test.acceptability,pred)","np.isclose(macro_f1,f1_score(test.acceptability,model.predict(test[['buying']]),average='macro')) and np.isclose(accuracy,accuracy_score(test.acceptability,model.predict(test[['buying']])))",dataset='car',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.acceptability)",outputs=['macro_f1','accuracy'])])
    lesson('C04','Labels and probabilities','Align probability columns with class labels.',
        'predict_proba columns follow classes_, not a guessed order. Thresholds turn binary probabilities into labels; multiclass prediction usually chooses the largest class score.',
        'model.classes_\nmodel.predict_proba(X_test)','classification',[
        py('Create a dataframe of test probabilities with the actual class labels as columns.',"answer=pd.DataFrame(model.predict_proba(X_test),index=X_test.index,columns=model.classes_)","list(answer.columns)==list(model.classes_) and np.allclose(answer.sum(axis=1),1)",dataset='CLASS180',setup=CLASS_FIT),
        py('Apply a 0.7 threshold to the supplied probabilities for class B.',"answer=np.where(probability_b>=.7,'B','A')","list(answer)==['A','A','B','B']",setup="probability_b=np.array([.1,.6,.7,.9])"),
        py('Recover multiclass labels using class-aligned argmax.',"probabilities=model.predict_proba(X_test)\nanswer=model.classes_[np.argmax(probabilities,axis=1)]","np.array_equal(answer,model.predict(X_test))",dataset='CLASS180',setup=CLASS_FIT)],chapter=1)
    lesson('C05','Logistic regression','Understand a regularised linear class boundary.',
        'Logistic regression is a classifier despite its name. It models class log-odds with a linear score and uses regularisation. Scaling helps optimisation and makes regularisation more comparable across inputs.',
        'LogisticRegression(max_iter=2000, random_state=42)','geometry',[
        py('Fit a scaled logistic classifier and predict test labels.',"from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nmodel=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))]).fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and set(answer).issubset(set(y_train))",dataset='CLASS180',setup=CLASS),
        reflect('A positive binary logistic coefficient is attached to a scaled feature. What does its direction describe?','Holding other inputs fixed, increasing that feature increases the model’s log-odds for its positive class. It is not an unqualified causal effect or an additive probability change.'),
        py('Build answer as a coefficient table with one row per fitted class and one column per input feature. Label rows with model.classes_ and columns with X_train column names.',"answer=pd.DataFrame(model.named_steps['model'].coef_,index=model.classes_,columns=X_train.columns)","answer.shape==(3,2) and list(answer.index)==list(model.classes_) and list(answer.columns)==list(X_train.columns) and np.allclose(answer.values,model.named_steps['model'].coef_)",dataset='CLASS180',setup=CLASS_FIT)],chapter=1,models=['logistic'])
    mixed=PENGUIN.replace('X=df[numeric]',"X=df[numeric+['island','sex','year']]")
    mixedmodel="""from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler,OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV,StratifiedKFold,cross_validate
prepare=ColumnTransformer([('numeric',StandardScaler(),numeric),('category',OneHotEncoder(handle_unknown='ignore',sparse_output=False),['island','sex','year'])])
model=Pipeline([('prepare',prepare),('model',LogisticRegression(max_iter=2000,random_state=42))])
folds=StratifiedKFold(5,shuffle=True,random_state=42)
"""
    lesson('C06','A logistic workflow','Tune regularisation and investigate shortcuts using training evidence.',
        'Larger C means weaker regularisation. Compare supported C values within a pipeline. A geographic-feature comparison must use matching training folds, not final-test results.',
        "GridSearchCV(model, {'model__C':[.1,1,10]}, cv=folds, scoring='f1_macro')",'folds',[
        py('Search C for the mixed Penguin pipeline.',"search=GridSearchCV(model,{'model__C':[.1,1,10]},cv=folds,scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='penguins',setup=mixed+mixedmodel),
        py('Evaluate a most-frequent reference on the same five folds.',"from sklearn.dummy import DummyClassifier\nanswer=cross_validate(DummyClassifier(strategy='most_frequent'),X_train,y_train,cv=folds,scoring='f1_macro')['test_score']","len(answer)==5 and np.isfinite(answer).all()",dataset='penguins',setup=mixed+mixedmodel),
        py('Compare with a measurements-only logistic pipeline on those same folds.',"measurement_model=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))])\nanswer=cross_validate(measurement_model,X_train[numeric],y_train,cv=folds,scoring='f1_macro')['test_score']","len(answer)==5 and np.isfinite(answer).all()",dataset='penguins',setup=mixed+mixedmodel)],chapter=1)
    lesson('C07','Threshold choices depend on costs','Choose thresholds using training-only evidence and explicit requirements.',
        'Threshold changes trade false positives against false negatives. The default need not match a particular use case. Choose with training-only predictions, and assess uncertainty and consequences.',
        "cross_val_predict(model, X_train, y_train, method='predict_proba', cv=folds)",'classification',[
        py('Compute OOF probabilities for the supplied class model.',"from sklearn.model_selection import cross_val_predict,StratifiedKFold\nanswer=cross_val_predict(model,X_train,y_train,cv=StratifiedKFold(5,shuffle=True,random_state=42),method='predict_proba')","answer.shape==(len(X_train),3) and np.allclose(answer.sum(axis=1),1)",dataset='CLASS180',setup=CLASS_FIT),
        decide('Lowering a positive-class threshold usually does what?',['Predicts positive for fewer rows','Predicts positive for more rows','Changes training labels'],1,'More scores cross a lower threshold, changing the balance of errors.'),
        decide('Training-only threshold evidence: t=.3 recall .95/precision .6; t=.7 recall .7/precision .9. A stated recall minimum is .9. Which supplied choice meets it?',['.3','.7','Neither'],0,'The .3 choice meets the stated recall constraint, at the cost of lower supplied precision.'),
        reflect('Why should the chosen threshold and its costs be stated in the report?','The threshold encodes a decision trade-off. Its justification depends on class definitions, costs, prevalence and validation evidence; it is not universally best.')],chapter=1)
    lesson('C08','Neighbour voting','Explain a classifier’s local distance-based decision.',
        'KNN stores training examples and predicts from nearby examples. k controls the neighbourhood size. Distance depends on input scales and can become less discriminating in many dimensions.',
        'KNeighborsClassifier(n_neighbors=3)','geometry',[
        py('Fit three-neighbour KNN on scaled training features. Store the positions of the three nearest training rows for the first test row in answer.',"from sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.preprocessing import StandardScaler\nscaler=StandardScaler().fit(X_train)\nmodel=KNeighborsClassifier(n_neighbors=3).fit(scaler.transform(X_train),y_train)\nanswer=model.kneighbors(scaler.transform(X_test.iloc[:1]),return_distance=False)","answer.shape==(1,3) and np.array_equal(answer,model.kneighbors(scaler.transform(X_test.iloc[:1]),return_distance=False))",dataset='CLASS18',setup=CLASS),
        py('Change to five neighbours and predict the first test row.',"from sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nmodel=Pipeline([('scale',StandardScaler()),('model',KNeighborsClassifier(n_neighbors=5))]).fit(X_train,y_train)\nanswer=model.predict(X_test.iloc[:1])","len(answer)==1 and answer[0] in set(y_train)",dataset='CLASS18',setup=CLASS),
        reflect('A neighbourhood contains competing classes. What does its vote tell you about the prediction?','The label is determined by the configured voting rule, but nearby disagreement indicates ambiguity. It is not evidence of a perfectly separated region.')],chapter=1,models=['knn_cls'])
    lesson('C09','Validate k on a meaningful scale','Choose k with fold-local scaling.',
        'Validation rows must not become training neighbours. Scaling belongs inside the candidate pipeline so each fold learns its own metric scale.',
        "Pipeline([('scale',StandardScaler()),('model',KNeighborsClassifier())])",'geometry',[
        py('Search production k values 3,5,9 on CLASS180.',"from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.model_selection import GridSearchCV,StratifiedKFold\nmodel=Pipeline([('scale',StandardScaler()),('model',KNeighborsClassifier())])\nsearch=GridSearchCV(model,{'model__n_neighbors':[3,5,9]},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='CLASS180',setup=CLASS),
        decide('May a validation row remain in the fitted KNN training table when scoring that row?',['Yes, because KNN has no coefficients','No'],1,'That row could become its own neighbour, leaking evaluation information.'),
        reflect('Why can many weak features hurt a distance-based method?','Distances can be dominated by irrelevant variation and become less informative about local similarity. Validate the chosen representation without selecting features on final-test rows.')],chapter=1)
    svc=CLASS+"from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.svm import SVC\nmodel=Pipeline([('scale',StandardScaler()),('model',SVC(random_state=42))]).fit(X_train,y_train)\n"
    lesson('C10','Margins and support vectors','Interpret the separating boundary and supporting examples.',
        'SVM fits boundaries influenced by support vectors near margins. Production SVC uses an RBF kernel and does not enable probability estimation. Decision values are not probabilities.',
        'SVC(random_state=42)\nmodel.decision_function(X_test)','geometry',[
        py('Fit the supplied scaled SVM and predict labels.',"answer=model.predict(X_test)","len(answer)==len(X_test) and set(answer).issubset(set(y_train))",dataset='CLASS180',setup=svc),
        py('Store the fitted SVM’s support-vector count for each class in answer, in model.classes_ order.',"answer=model.named_steps['model'].n_support_","len(answer)==3 and np.array_equal(answer,model.named_steps['model'].n_support_)",dataset='CLASS180',setup=svc),
        decide('Can SVC.decision_function values be labelled class probabilities?',['Yes','No'],1,'They are decision scores. This production SVC has probability=False; probability estimation would be a different configuration.')],chapter=2,models=['svm_cls'])
    lesson('C11','Nonlinear SVM behaviour','Relate C, kernel scale and cost to validation.',
        'RBF kernels support nonlinear boundaries. C controls the penalty/regularisation trade-off; gamma controls the locality of the kernel. Production searches C and keeps gamma="scale".',
        "GridSearchCV(model, {'model__C':[.5,2,10]}, scoring='f1_macro', cv=folds)",'geometry',[
        py('Search C=.5,2,10 using five stratified folds.',"from sklearn.model_selection import GridSearchCV,StratifiedKFold\nsearch=GridSearchCV(model,{'model__C':[.5,2,10]},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='CLASS180',setup=svc),
        decide('In supplied RBF comparisons, increasing gamma makes influence more local. What risk should be investigated?',['A more irregular boundary may overfit','It guarantees improved final accuracy','Scaling becomes irrelevant'],0,'More local influence can fit fine detail; validation must establish whether that flexibility transfers.'),
        reflect('Why report scaling and computational cost alongside an SVM result?','The kernel depends on feature distances, so units matter. Runtime and data size constrain useful choices; a small score change may not justify substantially greater cost.')],chapter=2)
    distributions()

def distributions():
    rules="""from ml_helpers import OneRClassifier,OneRPreprocessor
from sklearn.pipeline import Pipeline
X=df[['service','fragile']]
y=df.label
model=Pipeline([('prepare',OneRPreprocessor(numeric_features=[],categorical_features=['service','fragile'])),('model',OneRClassifier())]).fit(X,y)
"""
    lesson('C12','One feature, one rule','Understand the production One-R rule and fallback.',
        'One-R evaluates single-feature rules and chooses one with the fewest training errors. Production preserves discrete feature metadata and uses a majority fallback for unknown rule values.',
        'OneRPreprocessor(...)\nOneRClassifier(bins=5)','tree',[
        py('Store the fitted One-R classifier’s rules_ dictionary in answer.',"answer=model.named_steps['model'].rules_","isinstance(answer,dict) and answer==model.named_steps['model'].rules_",dataset='RULE24',setup=rules),
        py('Predict a row with an unseen service category using the fitted preprocessing.',"answer=model.predict(pd.DataFrame({'service':['overnight'],'fragile':[1]}))","len(answer)==1 and answer[0] in set(y)",dataset='RULE24',setup=rules),
        reflect('Car’s One-R score is close to its most-frequent reference. What should be explained?','The selected one-feature rule may offer an interpretable description but limited predictive improvement. It cannot express interactions among several car attributes.')],chapter=2,models=['one_r'])
    numeric="""from ml_helpers import OneRClassifier,OneRPreprocessor
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV,StratifiedKFold
X=df[['distance','fragile']]
y=df.label
model=Pipeline([('prepare',OneRPreprocessor(numeric_features=['distance'],categorical_features=['fragile'])),('model',OneRClassifier(bins=5))])
"""
    lesson('C13','One-R with numeric inputs','Keep numeric bin learning inside each fit.',
        'Production uses fold-local quantile bins for continuous values. Binary flags stay discrete. This is the Playground’s implementation, which differs in discretisation details from the original One-R paper.',
        "GridSearchCV(model, {'model__bins':[3,5,8]}, ...)",'tree',[
        py('Fit the numeric rule and inspect its predictions.',"model.fit(X,y)\nanswer=model.predict(X)","len(answer)==len(y) and set(answer).issubset(set(y))",dataset='RULE24',setup=numeric),
        py('Compare bins 3,5,8 with three teaching folds on this small fixture.',"search=GridSearchCV(model,{'model__bins':[3,5,8]},cv=StratifiedKFold(3,shuffle=True,random_state=42),scoring='f1_macro').fit(X,y)\nanswer=search.cv_results_['mean_test_score']","len(answer)==3 and np.isfinite(answer).all()",dataset='RULE24',setup=numeric),
        py('Fit the rule, then store its Boolean categorical_mask_ in answer for distance and fragile, in that feature order.',"model.fit(X,y)\nanswer=model.named_steps['model'].categorical_mask_","np.array_equal(answer,[False,True])",dataset='RULE24',setup=numeric)],chapter=2)
    lesson('C14','Classification trees','Learn recursive splits, impurity, class leaves and validation within Classification.',
        'A classification tree asks a sequence of threshold questions. A useful split separates class counts, reducing impurity. A leaf predicts from the classes reaching it. Scaling is unnecessary; depth and minimum leaf size constrain overfitting.',
        'DecisionTreeClassifier(random_state=42)\nplot_tree(model)','tree',[
        decide('A node contains 10 A and 10 B. Which candidate split has purer children?',['Two children each containing 5 A and 5 B','One child with 10 A and another with 10 B'],1,'Separating the classes produces pure children and reduces class mixing. A complete tree chooses and repeats such splits using training data.'),
        py('Fit a tree with maximum depth 3. For the first test row, store its terminal node ID in leaf and its predicted class in label.',"from sklearn.tree import DecisionTreeClassifier\nmodel=DecisionTreeClassifier(max_depth=3,random_state=42).fit(X_train,y_train)\nleaf=int(model.apply(X_test.iloc[:1])[0])\nlabel=model.predict(X_test.iloc[:1])[0]","label==model.predict(X_test.iloc[:1])[0] and leaf==int(model.apply(X_test.iloc[:1])[0]) and model.get_depth()<=3",dataset='CLASS180',setup=CLASS,outputs=['leaf','label']),
        py('Compare depth and minimum leaf-size settings with stratified CV.',"from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.model_selection import GridSearchCV,StratifiedKFold\nsearch=GridSearchCV(DecisionTreeClassifier(random_state=42),{'max_depth':[3,5,None],'min_samples_leaf':[1,5]},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==6 and np.isfinite(answer).all()",dataset='CLASS180',setup=CLASS),
        reflect('A Car tree has strong training fit, poorer validation macro F1 and high safety importance. What does each piece of evidence mean?','The gap suggests overfitting to investigate through training-only complexity selection. Safety importance describes this fitted tree’s impurity reductions; it is not proof of a causal effect.')],chapter=2,models=['classification_tree'])
    gaussian=COV+"from sklearn.naive_bayes import GaussianNB\nmodel=GaussianNB().fit(X_train,y_train)\n"
    lesson('C15','Gaussian Naive Bayes','Combine class priors with continuous feature evidence.',
        'GaussianNB models each feature’s class-conditional density and combines evidence using a conditional-independence assumption. Posterior class probabilities and probability densities are different quantities.',
        'GaussianNB()\nmodel.class_prior_\nmodel.predict_proba(X_test)','gaussian',[
        py('Inspect class priors and posterior probabilities.',"answer=pd.DataFrame(model.predict_proba(X_test),columns=model.classes_,index=X_test.index)\npriors=model.class_prior_","np.allclose(answer.sum(axis=1),1) and np.isclose(priors.sum(),1)",dataset='COV90',setup=gaussian,outputs=['answer','priors']),
        decide('A Gaussian density at one value exceeds 1. Is that automatically invalid?',['Yes, every density is a probability','No, probabilities are integrals over ranges'],1,'Density has units and can exceed one. Probability is the area over a range and remains between zero and one.'),
        reflect('Breast measurements are correlated. What limitation should accompany GaussianNB probabilities?','Conditional independence is an approximation. Correlated evidence can be effectively counted more than once, so probabilities may be overconfident even when classification is useful.')],chapter=3,models=['naive_bayes'])
    lesson('C16','Match Naive Bayes to feature types','Use each production Naive Bayes preparation path.',
        'Production selects GaussianNB for continuous inputs, BernoulliNB for binary flags and OHE–BernoulliNB for categorical inputs. It does not expose arbitrary mixed inputs or CategoricalNB.',
        'GaussianNB()\nBernoulliNB()\nPipeline([("encode", OneHotEncoder(...)), ("model", BernoulliNB())])','table',[
        decide('Which production path fits presence/absence flags?',['GaussianNB','BernoulliNB','Treat flags as unordered continuous bins'],1,'BernoulliNB models binary presence and absence evidence.'),
        py('Fit BernoulliNB to Candy’s binary flags and predict held-away rows.',"from sklearn.naive_bayes import BernoulliNB\nflags=['chocolate','fruity','caramel','peanutyalmondy','nougat','crispedricewafer','hard','bar','pluribus']\nmodel=BernoulliNB().fit(train[flags],train.popular)\nanswer=model.predict(test[flags])","len(answer)==len(test) and set(answer).issubset(set(train.popular))",dataset='candy_class',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.popular)"),
        py('Fit Car with the production OHE–Bernoulli path.',"from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import OneHotEncoder\nfrom sklearn.naive_bayes import BernoulliNB\ncolumns=['buying','maintenance','doors','persons','luggage_boot','safety']\nmodel=Pipeline([('encode',OneHotEncoder(handle_unknown='ignore',sparse_output=False)),('model',BernoulliNB())]).fit(train[columns],train.acceptability)\nanswer=model.predict(test[columns])","len(answer)==len(test) and set(answer).issubset(set(train.acceptability))",dataset='car',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.acceptability)"),
        decide('A proposed NB recipe mixes measurements, flags and named categories without separate likelihood handling. Does production support it?',['Yes','No'],1,'The production NB scenarios are pure-type paths. A valid mixed-likelihood design would require additional modelling work beyond the current workflow.')],chapter=3)
    lda=COV+"from sklearn.discriminant_analysis import LinearDiscriminantAnalysis\nmodel=LinearDiscriminantAnalysis(solver='lsqr').fit(X_train,y_train)\n"
    lesson('C17','LDA shares a covariance shape','Understand shared class geometry and linear boundaries.',
        'LDA gives classes different means but a shared covariance shape. Production uses the lsqr solver and optionally shrinkage. This module uses LDA as a classifier, not as a PCA replacement.',
        "LinearDiscriminantAnalysis(solver='lsqr', shrinkage='auto')",'gaussian',[
        py('Build answer as a table of the fitted LDA mean for each class and input feature. Use model.classes_ for rows and X_train columns for columns.',"answer=pd.DataFrame(model.means_,index=model.classes_,columns=X_train.columns)","answer.shape==(2,2) and list(answer.index)==list(model.classes_) and list(answer.columns)==list(X_train.columns) and np.allclose(answer.values,model.means_)",dataset='COV90_SHARED',setup=lda),
        py('Compare no shrinkage with automatic shrinkage.',"from sklearn.model_selection import GridSearchCV,StratifiedKFold\nsearch=GridSearchCV(LinearDiscriminantAnalysis(solver='lsqr'),{'shrinkage':[None,'auto']},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==2 and np.isfinite(answer).all()",dataset='COV90_SHARED',setup=lda),
        py('Return class-labelled probabilities for held-away rows.',"answer=pd.DataFrame(model.predict_proba(X_test),columns=model.classes_,index=X_test.index)","np.allclose(answer.sum(axis=1),1) and answer.index.equals(X_test.index)",dataset='COV90_SHARED',setup=lda)],chapter=3,models=['lda'])
    qda=COV+"from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis\n"
    lesson('C18','QDA allows class-specific shapes','Balance covariance flexibility against data support and stability.',
        'QDA fits a covariance shape for each class, allowing curved boundaries. More parameters require more within-class information. Production regularises covariance and limits input feature count to ten.',
        'QuadraticDiscriminantAnalysis(reg_param=0.1)','gaussian',[
        decide('Which assumption distinguishes QDA from LDA?',['All classes share one covariance','Each class can have its own covariance','QDA has no class labels'],1,'QDA permits class-specific covariance and therefore quadratic boundaries.'),
        py('Fit regularised QDA and predict held-away labels.',"model=QuadraticDiscriminantAnalysis(reg_param=.1).fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and set(answer).issubset(set(y_train))",dataset='COV90',setup=qda),
        py('Compare QDA regularisation values 0.1, 0.2, 0.5 and 0.9 on five stratified training folds. Store their mean validation macro F1 scores in answer, in the same order.',"from sklearn.model_selection import GridSearchCV,StratifiedKFold\nsearch=GridSearchCV(QuadraticDiscriminantAnalysis(),{'reg_param':[.1,.2,.5,.9]},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==4 and np.isfinite(answer).all() and list(search.param_grid['reg_param'])==[.1,.2,.5,.9] and search.scoring=='f1_macro' and np.allclose(answer,search.cv_results_['mean_test_score'])",dataset='COV90',setup=qda),
        decide('Is the 30-feature Breast scenario a supported production QDA route?',['Yes','No'],1,'Production limits QDA to at most ten continuous features. More flexibility also demands sufficient data per class.')],chapter=3,models=['qda'])
    lesson('C19','Covariance support and regularisation limits','Qualify numerical stability and unit effects.',
        'Regularisation can stabilise a covariance estimate but cannot manufacture missing class information. Adding a regularising identity term also means unit choices can matter.',
        'Compare covariance support, regularisation and measurement units.','gaussian',[
        decide('Which is more demanding to estimate reliably from a small class?',['A mean of one feature','A full covariance matrix of many features'],1,'A covariance matrix needs many pairwise quantities; dimensionality rapidly increases the information needed.'),
        reflect('Why is “QDA never depends on scaling” too strong for a regularised implementation?','Unregularised Gaussian discriminants have useful transformation properties, but regularisation changes the covariance estimate relative to an identity target. Units can therefore change the effect of regularisation.')],chapter=3)

def networks():
    lesson('N01','From inputs to network outputs','Understand layers, units and task-shaped outputs.',
        'A network combines weighted inputs, activations and learned layers. Hidden width counts units within a layer; a tuple describes successive hidden layers. Task-specific outputs come after the shared representation.',
        'hidden_layer_sizes=(24,) → one hidden layer with 24 units','network',[
        decide('What does hidden_layer_sizes=(16,8) describe?',['Two hidden layers with 16 then 8 units','24 hidden layers','Eight output classes'],0,'The tuple specifies hidden-layer widths. Output structure follows the prediction task.'),
        decide('Which network output suits one continuous target?',['One numeric prediction per row','A cluster number','Necessarily one output per training row'],0,'Neural regression returns a numeric target prediction for each supplied observation. Classification uses class-related outputs.')])
    lesson('N02','Learning weights by reducing loss','Separate optimisation from generalisation.',
        'Training adjusts weights to reduce an objective. Comparable feature scales help optimisation. Different initialisations can produce different learning trajectories. Training loss is not validation performance.',
        'Inspect training loss and separate validation evidence.','network',[
        decide('Loss over iterations: 5,3,2,1.8. What does this establish?',['The training objective decreased','Final-test performance improved','The model is calibrated'],0,'Only the supplied training objective is shown. Generalisation needs separate evidence.'),
        decide('A large-unit feature causes unstable optimisation; a scaled version trains more consistently. What is justified?',['Use a fold-local scaler and validate','Scale the entire dataset before splitting','Conclude the largest-unit feature is most important'],0,'Scaling can improve optimisation, but must be fitted within the relevant training boundary.'),
        reflect('Training loss falls while validation error rises. How should the result be interpreted?','The optimiser is fitting training examples more closely while generalisation evidence worsens. This is consistent with overfitting; falling loss alone is insufficient.')])
    lesson('N05','Convergence, early stopping and validation','Distinguish internal stopping, outer CV and final testing.',
        'A convergence warning means the stopping criterion was not reached within the budget. Internal early stopping, outer CV and final test have separate roles. sklearn’s internal stopping score need not equal the outer selection metric. Production disables early stopping for chronological MLP regression.',
        'max_iter, early_stopping, loss_curve_, n_iter_','network',[
        decide('A model reaches max_iter with a convergence warning. What follows?',['Ignore it if predictions exist','Inspect the trace and validate whether more iterations or preparation changes help','All results are invalid by definition'],1,'The warning deserves inspection. It does not by itself prove failure or adequate convergence.'),
        decide('Budget 100: loss still dropping. Budget 500: stable loss, similar validation. Which evidence supports a larger budget?',['The trace and validation together','Iteration count alone','The larger model must be better'],0,'The trace supports improved optimisation, while validation checks whether it matters for the task.'),
        decide('Which evidence is used to nominate a network setting?',['Internal early-stopping score alone','Outer training-fold score for the intended task','Final-test errors'],1,'Internal stopping controls a fit. Outer CV supports parameter selection. Final test is reserved for the nominated workflow.'),
        reflect('Why is random internal early stopping problematic in a chronological workflow?','A random internal split can mix later observations into training used to validate earlier ones. The current chronological regression path disables early stopping and relies on explicit forward validation.')])
    classifier=PENGUIN+"from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neural_network import MLPClassifier\nmodel=Pipeline([('scale',StandardScaler()),('model',MLPClassifier(hidden_layer_sizes=(24,),max_iter=500,early_stopping=True,random_state=42))])\n"
    lesson('N03','Neural classification workflow','Apply class outputs and classification evidence to a small network.',
        'A scaled MLPClassifier uses the shared optimisation ideas for class prediction. Search a small width grid and compare with logistic regression on the same training folds. Complexity needs evidence.',
        'MLPClassifier(hidden_layer_sizes=(24,), max_iter=500, early_stopping=True, random_state=42)','network',[
        py('Fit the supplied scaled neural classifier and predict labels.',"model.fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and set(answer).issubset(set(y_train))",dataset='penguins',setup=classifier),
        py('Compare hidden widths 16 and 24 using five stratified folds.',"from sklearn.model_selection import GridSearchCV,StratifiedKFold\nsearch=GridSearchCV(model,{'model__hidden_layer_sizes':[(16,),(24,)]},cv=StratifiedKFold(5,shuffle=True,random_state=42),scoring='f1_macro').fit(X_train,y_train)\nanswer=search.cv_results_['mean_test_score']","len(answer)==2 and np.isfinite(answer).all()",dataset='penguins',setup=classifier),
        reflect('The MLP and logistic model have similar macro F1, but the MLP is slower and occasionally warns. How could you justify a choice?','Consider validation variation, convergence, cost and explanatory needs. Similar predictive evidence may favour the simpler stable option; there is no automatic neural-model preference.')],dataset='penguins',chapter=1,models=['mlp_cls'])
    reg="""from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.compose import TransformedTargetRegressor
from sklearn.neural_network import MLPRegressor
X=df.drop(columns=['quality','wine_type'])
y=df.quality
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42)
model=Pipeline([('scale',StandardScaler()),('model',TransformedTargetRegressor(regressor=MLPRegressor(hidden_layer_sizes=(24,),max_iter=800,early_stopping=True,tol=1e-3,random_state=42),transformer=StandardScaler()))])
"""
    lesson('N04','Neural regression workflow','Keep feature scaling and target transformation distinct.',
        'The feature scaler acts on X. TransformedTargetRegressor learns a separate transformation of y during each fit and inverse-transforms predictions automatically. Evaluate returned predictions in original target units.',
        "TransformedTargetRegressor(regressor=MLPRegressor(...), transformer=StandardScaler())",'network',[
        py('Fit the supplied feature pipeline and target wrapper.',"model.fit(X_train,y_train)\nanswer=model.named_steps['model'].transformer_.mean_","np.allclose(answer,y_train.mean())",dataset='Wine600',setup=reg),
        py('Return original-unit predictions from the fitted wrapper.',"model.fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(y_test) and np.isfinite(answer).all()",dataset='Wine600',setup=reg),
        py('Search widths through the nested regressor parameter.',"from sklearn.model_selection import GridSearchCV,KFold\nsearch=GridSearchCV(model,{'model__regressor__hidden_layer_sizes':[(16,),(24,)]},cv=KFold(5,shuffle=True,random_state=42),scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nanswer=-search.cv_results_['mean_test_score']","len(answer)==2 and np.isfinite(answer).all()",dataset='Wine600',setup=reg),
        py('Repair target-unit scoring: calculate RMSE against original y_test.',"from sklearn.metrics import root_mean_squared_error\nmodel.fit(X_train,y_train)\npredictions=model.predict(X_test)\nanswer=root_mean_squared_error(y_test,predictions)","np.isclose(answer,np.sqrt(np.mean((y_test-predictions)**2)))",dataset='Wine600',setup=reg)],chapter=1,models=['mlp_reg'])
    lesson('N06','Capacity and regularisation','Interpret controlled width and alpha experiments.',
        'Width increases representational capacity. Alpha controls weight regularisation. Use controlled training/validation evidence to reason about both; production’s small width grid does not explore every possible network.',
        'hidden_layer_sizes and alpha','network',[
        decide('Same width, alpha .0001 gives train/validation error 1/8; alpha .1 gives 3/5. What does the supplied evidence favour?',['The stronger-regularised candidate for validation error','Always the lowest training error'],0,'The stronger-regularised candidate has better supplied validation error, despite fitting training examples less closely.'),
        decide('Doubling width reduces training loss but leaves validation unchanged. What is established?',['A generalisation gain','More capacity improved the training objective only'],1,'The provided validation evidence does not show a gain. Runtime and stability also matter.'),
        reflect('What can the Playground’s width 16/24 search conclude?','It compares those specified candidates under that validation design. It does not establish the globally best network, regularisation setting or architecture.')],chapter=2)
