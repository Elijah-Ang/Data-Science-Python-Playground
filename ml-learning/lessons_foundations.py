from authoring import lesson,py,decide,reflect

SPLIT="""from sklearn.model_selection import train_test_split
X = df[['distance']]
y = df['duration']
X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=.2,random_state=42)
"""
FIT=SPLIT+"""from sklearn.linear_model import LinearRegression
model = LinearRegression().fit(X_train,y_train)
predictions = model.predict(X_test)
"""
MIX="""from sklearn.model_selection import train_test_split
X = df[['distance','weight','service','weekend']]
y = df['duration']
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42)
"""

def author():
    lesson('F01','What question are we answering?','Distinguish prediction, grouping and reduction.',
        'Supervised learning uses examples with a known target. Regression predicts quantities; classification predicts labels. Clustering describes groups without a target. PCA creates a lower-dimensional representation.',
        'Question → available inputs → desired output','tasks',[
        decide('A table has measurements and known species. What is predicting species?', ['Regression','Classification','Clustering','Dimensionality reduction'],1,'Species is a label, so this is supervised classification.'),
        reflect('Compare predicting journey duration, grouping similar products and compressing correlated measurements. Does each have y?','Duration prediction has a numeric target. Grouping and PCA use X without a prediction target; they answer different exploratory questions.')])
    lesson('F02','Features and target','Construct X and y without leaking outcomes into inputs.',
        'Rows are observations. X is a two-dimensional feature table; y is the target for the same observations. Select columns by meaning, not simply by numeric dtype.',
        "X = df[['distance']]\ny = df['duration']", 'table',[
        py('Create X with distance and y with duration.',"X=df[['distance']]\ny=df['duration']", "X.equals(df[['distance']]) and y.equals(df.duration)",outputs=['X','y'],dataset='LINE12'),
        py('In MIX60, use distance and weight as legitimate inputs.',"answer=df[['distance','weight']]","answer.equals(df[['distance','weight']])",dataset='MIX60'),
        py('In CLASS180, create X from length and width, excluding the label.',"answer=df[['length','width']]","answer.equals(df[['length','width']])",dataset='CLASS180')])
    lesson('F03','What fitting does','Recognise learned state from examples.',
        'fit estimates model parameters from supplied examples. A fitted line has learned an intercept and coefficient; creating an estimator alone has not learned anything.',
        'model = LinearRegression()\nmodel.fit(X, y)','regression',[
        py('Fit a LinearRegression model using distance to predict duration.',"from sklearn.linear_model import LinearRegression\nmodel=LinearRegression().fit(df[['distance']],df.duration)","hasattr(model,'coef_') and model.n_features_in_==1 and np.isfinite(model.coef_).all()",dataset='LINE12',outputs=['model']),
        py('Fit a fresh model on this new 24-row batch and inspect its coefficient.',"from sklearn.linear_model import LinearRegression\nmodel=LinearRegression().fit(df[['distance']],df.duration)\nanswer=model.coef_","np.allclose(answer,np.cov(df.distance,df.duration,ddof=0)[0,1]/np.var(df.distance))",dataset='LINE24B')],chapter=1)
    lesson('F04','Predicting new rows','Preserve feature shape and meaning at prediction time.',
        'predict uses fitted parameters. New rows must provide the same feature meaning and order. A one-row dataframe remains two-dimensional.',
        "model.predict(pd.DataFrame({'distance':[4,7]}))",'table',[
        py('Predict durations for distance 4 and 7; store answer.',"answer=model.predict(pd.DataFrame({'distance':[4,7]}))","np.allclose(answer,model.intercept_+model.coef_[0]*np.array([4,7]))",setup=FIT),
        py('Predict a single observation at distance 5 using a dataframe.',"answer=model.predict(pd.DataFrame({'distance':[5]}))","np.shape(answer)==(1,) and np.allclose(answer,model.intercept_+model.coef_[0]*5)",setup=FIT),
        py('incoming has an extra identifier. Select the model’s distance column and predict both rows.',"answer=model.predict(incoming[['distance']])","len(answer)==2 and np.allclose(answer,model.intercept_+model.coef_[0]*incoming.distance)",setup=FIT+"\nincoming=pd.DataFrame({'id':['new-a','new-b'],'distance':[2,9]})")],chapter=1)
    lesson('F05','Measuring prediction error','Connect residuals and RMSE to target units.',
        'A residual is actual minus predicted. RMSE squares residuals, averages them, and returns to target units with a square root. Large errors have more influence.',
        'root_mean_squared_error(actual, predicted)','regression',[
        py('Create answer with actual, predicted and residual columns for evaluation rows.',"answer=pd.DataFrame({'actual':y_test,'predicted':predictions,'residual':y_test-predictions})","np.allclose(answer.residual,answer.actual-answer.predicted) and answer.index.equals(y_test.index)",setup=FIT),
        py('Compare the supplied predictions with predictions shifted upward by 10. Store both RMSE values in answer.',"from sklearn.metrics import root_mean_squared_error\nanswer=[root_mean_squared_error(y_test,predictions),root_mean_squared_error(y_test,predictions+10)]","np.allclose(answer,[np.sqrt(np.mean((y_test-predictions)**2)),np.sqrt(np.mean((y_test-predictions-10)**2))])",setup=FIT),
        decide('If the target is minutes and RMSE is 4, which interpretation is valid?',['Squared error is four minutes','Errors have an RMSE of four minutes','Every prediction is wrong by exactly four minutes'],1,'RMSE is in minutes. It is a summary, not a guarantee for every prediction.')],chapter=1)
    lesson('F06','Seen is not unseen','Explain why training performance is insufficient.',
        'Training examples influenced fitting. Evaluation on separate rows asks whether the learned relationship transfers. A low training error can coexist with a large unseen error.',
        'Compare training evidence with genuinely held-away observations.','split',[
        decide('Model A: training RMSE 1, validation RMSE 8. Model B: training 4, validation 5. Which has stronger supplied validation evidence?',['A','B','Training error alone decides'],1,'B has lower validation RMSE on the stated comparable evaluation. The result does not establish universal superiority.'),
        reflect('Why can a model that nearly memorises training rows disappoint on new rows?','Fitting can capture accidental patterns specific to the sample. New observations did not influence those fitted parameters, so their errors reveal a different question.')],chapter=2)
    lesson('F07','Making a reproducible split','Protect evaluation rows before fitting.',
        'A random state makes this split reproducible. It does not make a poor study design valid. Split before learning preprocessing statistics or model parameters.',
        'train_test_split(X, y, test_size=0.2, random_state=42)','split',[
        py('Split distance/duration into 80% training and 20% test with seed 42.',SPLIT,"len(X_test)==5 and set(X_train.index).isdisjoint(X_test.index) and set(X_train.index)|set(X_test.index)==set(df.index)",outputs=['X_train','X_test']),
        py('Change the declared final-test proportion to 25%, still seed 42.',SPLIT.replace('test_size=.2','test_size=.25'),"len(X_test)==6 and X_train.index.equals(y_train.index) and X_test.index.equals(y_test.index)",outputs=['X_train','X_test']),
        py('Transfer to Candy: split sugarpercent and winpercent, 80/20, seed 42.',SPLIT.replace("'distance'","'sugarpercent'").replace("'duration'","'winpercent'"),"len(X_test)==17 and list(X_train.columns)==['sugarpercent'] and y_train.name=='winpercent' and set(X_train.index).isdisjoint(X_test.index)",dataset='candy',outputs=['X_train','X_test'])],chapter=2)
    lesson('F08','Predicting classes','Distinguish class labels from quantities.',
        'A classifier returns labels. The supplied tree recipe is only an example of the familiar fit/predict interface here; tree mechanics and depth choices come later.',
        'classifier.fit(X, y)\nclassifier.predict(new_rows)','classification',[
        py('Use the supplied classifier recipe to predict these observations’ class labels.',"from sklearn.tree import DecisionTreeClassifier\nclassifier=DecisionTreeClassifier(max_depth=2,random_state=42)\nclassifier.fit(df[['length','width']],df.label)\nanswer=classifier.predict(df[['length','width']])","len(answer)==len(df) and set(answer).issubset(set(df.label))",dataset='CLASS18'),
        decide('Car acceptability is stored as codes 0,1,2,3. Is predicting it necessarily regression?',['Yes, numeric storage decides the task','No, codes can stand for class labels'],1,'Meaning decides the task. Binary and multiclass labels may be numeric codes without being measured quantities.')],chapter=2)
    class_split="""from sklearn.model_selection import train_test_split
X=df[['length','width']]
y=df.label
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
answer=y_test.value_counts().sort_index()
"""
    lesson('F09','Preserving class representation','Apply and explain stratification.',
        'Stratification preserves approximate class proportions across a random split. It does not create additional minority examples or solve all sampling problems.',
        'train_test_split(X, y, stratify=y, random_state=42)','split',[
        py('Split CLASS180 with stratification and inspect test class counts.',class_split,"answer.to_dict()=={'A':12,'B':12,'C':12}",dataset='CLASS180',outputs=['answer']),
        py('Compare unstratified test counts with the supplied stratified counts.',class_split.replace(',stratify=y',''),"answer.sum()==36 and set(answer.index)==set(df.label)",dataset='CLASS180'),
        py('Stratify Candy classification using the fixed popular label.',class_split.replace("df[['length','width']]","df[['sugarpercent','pricepercent']]").replace('df.label','df.popular'),"answer.sum()==int(np.ceil(len(df)*.2)) and set(answer.index)==set(df.popular)",dataset='candy_class')],chapter=2)
    lesson('F10','Could we know this at prediction time?','Recognise leakage and context-dependent shortcuts.',
        'A feature must exist at the intended prediction time and must not encode the answer. A genuine predictor can still be a shortcut that will fail in another setting.',
        "X = df[available_predictors]",'pipeline',[
        decide('Predict duration before delivery. Which input is unavailable?',['Distance','Requested service','Actual arrival timestamp'],2,'Arrival is only known after the event and directly reveals the outcome.'),
        py('Candy popular is derived from winpercent. Select sugarpercent and pricepercent only.',"answer=df[['sugarpercent','pricepercent']]","answer.equals(df[['sugarpercent','pricepercent']])",dataset='candy_class'),
        reflect('Species prediction improves with Penguin island. What must a report qualify?','Island may be useful in this sampled geography but may not transfer to new islands or a different collection process. Strong validation within one context does not settle external usefulness.')],chapter=2)
    workflow()

def workflow():
    lesson('W01','Explore training data','Keep input exploration inside the training population.',
        'Training summaries help define preparation and expose unusual values. Keep final-test rows out of decisions made from exploratory patterns.',
        'X_train.describe()\nX_train.plot(...)','split',[
        py('Summarise the numeric training inputs and draw distance against training duration.',"answer=X_train.describe()\nimport matplotlib.pyplot as plt\nfig,ax=plt.subplots()\nax.scatter(X_train.distance,y_train)\nax.set(xlabel='Distance',ylabel='Duration',title='Training delivery observations')","answer.equals(X_train.describe()) and len(fig.axes[0].collections)==1",dataset='MIX60',setup=MIX),
        py('Inspect species counts on the supplied Penguin training rows.',"answer=y_train.value_counts()","answer.equals(y_train.value_counts())",dataset='penguins',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.species)\ny_train=train.species")])
    lesson('W02','A useful reference','Compare with a simple predictor that ignores X.',
        'A mean regressor and a most-frequent classifier establish reference behaviour. A feature-based model needs evidence that its additional structure is useful.',
        "DummyRegressor(strategy='mean')\nDummyClassifier(strategy='most_frequent')",'comparison',[
        py('Fit a mean reference on training rows and predict the evaluation rows.',"from sklearn.dummy import DummyRegressor\nreference=DummyRegressor(strategy='mean').fit(X_train,y_train)\nanswer=reference.predict(X_test)","np.allclose(answer,y_train.mean())",setup=SPLIT),
        py('Calculate model RMSE and mean-reference RMSE on the supplied evaluation rows.',"from sklearn.metrics import root_mean_squared_error\nanswer=[root_mean_squared_error(y_test,predictions),root_mean_squared_error(y_test,np.repeat(y_train.mean(),len(y_test)))]","np.allclose(answer,[np.sqrt(np.mean((y_test-predictions)**2)),np.sqrt(np.mean((y_test-y_train.mean())**2))])",setup=FIT),
        decide('A classifier always predicts the 90% majority class. Which statement follows?',['It detects every minority case','Its accuracy can be 90% while missing every minority case','It has learned feature relationships'],1,'The majority reference can look strong on accuracy while having zero recall for the minority class.')])
    lesson('W03','Learn a scale from training rows','Distinguish fitting a scale from transforming with it.',
        'StandardScaler learns means and scales during fit; transform reuses them. In supervised prediction learn them on training rows. In discovery fit them on the declared exploratory population, as U02 explains. You can enter here directly from Foundations.',
        'scaler.fit(X_train)\nscaler.transform(X_new)','geometry',[
        py('Fit a scaler on the supplied training distance column; store its transformed values.',"from sklearn.preprocessing import StandardScaler\nscaler=StandardScaler().fit(X_train)\nanswer=scaler.transform(X_train)","np.allclose(scaler.mean_,X_train.mean()) and np.allclose(np.mean(answer,axis=0),0,atol=1e-7)",setup=SPLIT),
        py('Use the fitted scaler to transform X_test without refitting.',"answer=scaler.transform(X_test)","np.allclose(answer,(X_test.to_numpy()-X_train.mean().to_numpy())/X_train.std(ddof=0).to_numpy())",setup=SPLIT+"\nfrom sklearn.preprocessing import StandardScaler\nscaler=StandardScaler().fit(X_train)"),
        py('Repair full-table scaling: learn the scale from X_train and transform X_test.',"from sklearn.preprocessing import StandardScaler\nscaler=StandardScaler().fit(X_train)\nanswer=scaler.transform(X_test)","np.allclose(scaler.mean_,X_train.mean()) and np.allclose(answer,(X_test.to_numpy()-X_train.mean().to_numpy())/X_train.std(ddof=0).to_numpy())",setup=SPLIT)])
    encoder="from sklearn.preprocessing import OneHotEncoder\nencoder=OneHotEncoder(handle_unknown='ignore',sparse_output=False).fit(X_train[['service']])\n"
    lesson('W04','Encode categories without inventing order','Preserve a reusable categorical schema.',
        'One-hot encoding creates indicator columns. Unknown categories must not change the fitted schema. Binary flags, measured numbers and named categories carry different meanings.',
        "OneHotEncoder(handle_unknown='ignore', sparse_output=False)",'table',[
        py('Fit an encoder to training service values and transform them.',encoder+"answer=encoder.transform(X_train[['service']])","answer.shape==(len(X_train),3) and np.all(answer.sum(axis=1)==1)",setup=MIX,dataset='MIX60'),
        py('Transform the unseen service overnight with the fitted schema.',"answer=encoder.transform(pd.DataFrame({'service':['overnight']}))","answer.shape==(1,3) and np.all(answer==0)",setup=MIX+encoder,dataset='MIX60'),
        decide('Which column should be interpreted as a named category?',['Weight in kilograms','Weekend flag 0/1','Service: standard/express/economy'],2,'Service categories have no implied metric order; weight is measured and weekend is already an indicator.'),
        py('Encode Penguin island on training rows, transform test rows and report the feature names.',"from sklearn.preprocessing import OneHotEncoder\nencoder=OneHotEncoder(handle_unknown='ignore',sparse_output=False).fit(train[['island']])\nanswer=encoder.transform(test[['island']])\nnames=encoder.get_feature_names_out()","answer.shape[0]==len(test) and answer.shape[1]==len(names) and all(str(n).startswith('island_') for n in names)",dataset='penguins',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.species)",outputs=['answer','names'])])
    prepare="""from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
prepare=ColumnTransformer([('numeric',StandardScaler(),['distance','weight']),('categories',OneHotEncoder(handle_unknown='ignore',sparse_output=False),['service']),('flags','passthrough',['weekend'])])
"""
    lesson('W05','Prepare different feature types together','Apply each preparation to the intended columns.',
        'ColumnTransformer combines separate operations by column meaning. Each branch is fitted on the same training population, then the transformed columns are combined.',
        "ColumnTransformer([('numeric', StandardScaler(), numeric_columns), ...])",'pipeline',[
        py('Fit the supplied mixed preparation recipe and transform the training inputs.',prepare+"answer=prepare.fit_transform(X_train)","answer.shape==(len(X_train),6) and np.allclose(answer[:,:2].mean(axis=0),0,atol=1e-7)",setup=MIX,dataset='MIX60'),
        py('Verify that the final prepared column preserves weekend flags.',prepare+"prepared=prepare.fit_transform(X_train)\nanswer=prepared[:,-1]","np.array_equal(answer,X_train.weekend)",setup=MIX,dataset='MIX60'),
        py('Prepare Penguin measurements by scaling and island/sex/year by encoding.',"from sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import StandardScaler,OneHotEncoder\nnumeric=['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']\nprepare=ColumnTransformer([('numeric',StandardScaler(),numeric),('category',OneHotEncoder(handle_unknown='ignore',sparse_output=False),['sex','island','year'])])\nanswer=prepare.fit_transform(train)","answer.shape[0]==len(train) and np.allclose(answer[:,:4].mean(axis=0),0,atol=1e-7)",dataset='penguins',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.species)")])
    pipeline=prepare+"from sklearn.pipeline import Pipeline\nfrom sklearn.linear_model import LinearRegression\nmodel=Pipeline([('prepare',prepare),('model',LinearRegression())])\n"
    lesson('W06','Keep preparation with the estimator','Fit and predict through one pipeline.',
        'A pipeline fits each preparation only from the rows passed to fit. During predict, it reuses the learned preparation. Putting it inside CV gives each fold its own fitted statistics.',
        "Pipeline([('prepare', prepare), ('model', estimator)])",'pipeline',[
        py('Build the mixed pipeline, fit training rows and predict test rows.',pipeline+"model.fit(X_train,y_train)\nanswer=model.predict(X_test)","len(answer)==len(X_test) and np.isfinite(answer).all() and 'prepare' in model.named_steps",setup=MIX,dataset='MIX60'),
        py('Replace the final estimator with the already-introduced mean dummy and compare its predictions.',pipeline+"from sklearn.dummy import DummyRegressor\nmodel.set_params(model=DummyRegressor(strategy='mean'))\nmodel.fit(X_train,y_train)\nanswer=model.predict(X_test)","np.allclose(answer,y_train.mean())",setup=MIX,dataset='MIX60'),
        py('Build a Penguin pipeline with OHE and the supplied classification recipe.',"from sklearn.pipeline import Pipeline\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import OneHotEncoder\nfrom sklearn.tree import DecisionTreeClassifier\nprepare=ColumnTransformer([('category',OneHotEncoder(handle_unknown='ignore',sparse_output=False),['island','sex'])])\nmodel=Pipeline([('prepare',prepare),('model',DecisionTreeClassifier(max_depth=2,random_state=42))]).fit(train,train.species)\nanswer=model.predict(test)","len(answer)==len(test) and set(answer).issubset(set(train.species))",dataset='penguins',setup="from sklearn.model_selection import train_test_split\ntrain,test=train_test_split(df,test_size=.2,random_state=42,stratify=df.species)")])
    lesson('W07','Learn missing-value replacements safely','Fit replacement statistics inside the training workflow.',
        'Imputation learns replacements from observed training values. This fixture intentionally has missing data; current production scenarios are already complete after their configured preparation.',
        "SimpleImputer(strategy='median')",'pipeline',[
        py('Impute training distance with its training median.',"from sklearn.impute import SimpleImputer\nimputer=SimpleImputer(strategy='median').fit(X_train[['distance']])\nanswer=imputer.transform(X_train[['distance']])","np.isclose(imputer.statistics_[0],X_train.distance.median()) and np.isfinite(answer).all()",dataset='MISSING60',setup=MIX),
        py('Impute service with the training most-frequent category.',"from sklearn.impute import SimpleImputer\nimputer=SimpleImputer(strategy='most_frequent').fit(X_train[['service']])\nanswer=imputer.transform(X_train[['service']])","imputer.statistics_[0]==X_train.service.mode().iloc[0] and not pd.isna(answer).any()",dataset='MISSING60',setup=MIX),
        py('Combine numeric imputation/scaling and categorical imputation/encoding inside one estimator pipeline.',"from sklearn.impute import SimpleImputer\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import StandardScaler,OneHotEncoder\nfrom sklearn.linear_model import LinearRegression\nnumeric=Pipeline([('impute',SimpleImputer(strategy='median')),('scale',StandardScaler())])\ncategory=Pipeline([('impute',SimpleImputer(strategy='most_frequent')),('encode',OneHotEncoder(handle_unknown='ignore',sparse_output=False))])\nprepare=ColumnTransformer([('numeric',numeric,['distance','weight']),('category',category,['service']),('flags','passthrough',['weekend'])])\nmodel=Pipeline([('prepare',prepare),('model',LinearRegression())]).fit(X_train,y_train)\nanswer=model.predict(X_test)","np.isfinite(answer).all() and len(answer)==len(X_test)",dataset='MISSING60',setup=MIX)])
    validate()

def validate():
    lesson('W08','What a fold does','Separate fitting, validation and final-test row roles.',
        'Cross-validation repeatedly holds away part of the training population. The final test is outside this process. Each fold fits a fresh estimator.',
        "KFold(n_splits=5, shuffle=True, random_state=42)",'folds',[
        py('Inspect three folds of X_train; store pairs of index arrays.',"from sklearn.model_selection import KFold\nanswer=list(KFold(3,shuffle=True,random_state=42).split(X_train))","len(answer)==3 and all(set(a).isdisjoint(b) for a,b in answer) and sorted(np.concatenate([b for a,b in answer]).tolist())==list(range(len(X_train)))",setup=SPLIT),
        decide('Which rows can participate in training-fold validation?',['Only the training population','All rows including the final test','Only final-test rows'],0,'Fold validation partitions the training population. Final-test rows stay outside all candidate fitting and selection.'),
        py('Construct five stratified folds on CLASS180.',"from sklearn.model_selection import StratifiedKFold\nanswer=list(StratifiedKFold(5,shuffle=True,random_state=42).split(df[['length','width']],df.label))","len(answer)==5 and all(len(b)==36 and set(df.label.iloc[b])=={'A','B','C'} for a,b in answer)",dataset='CLASS180')],chapter=1)
    cvsetup=SPLIT+"from sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import KFold,cross_validate\nfolds=KFold(5,shuffle=True,random_state=42)\nmodel=LinearRegression()\n"
    lesson('W09','Read cross-validation evidence','Interpret scores and compare on matching folds.',
        'sklearn scorers follow “larger is better”, so RMSE scoring is negated. The test_score key returned by cross_validate refers to fold validation, not the final test. A dummy reference uses the same folds.',
        "cross_validate(model, X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')",'comparison',[
        py('Cross-validate the supplied linear model and store the result dictionary.',"answer=cross_validate(model,X_train,y_train,cv=folds,scoring='neg_root_mean_squared_error')","len(answer['test_score'])==5 and np.isfinite(answer['test_score']).all()",setup=cvsetup),
        py('Convert the supplied negative validation scores into positive RMSE values.',"answer=-cv_results['test_score']","np.allclose(answer,-cv_results['test_score']) and np.all(answer>=0)",setup=cvsetup+"cv_results=cross_validate(model,X_train,y_train,cv=folds,scoring='neg_root_mean_squared_error')\n"),
        py('Evaluate a mean dummy on the same folds.',"from sklearn.dummy import DummyRegressor\nanswer=cross_validate(DummyRegressor(strategy='mean'),X_train,y_train,cv=folds,scoring='neg_root_mean_squared_error')","len(answer['test_score'])==5 and np.isfinite(answer['test_score']).all()",setup=cvsetup),
        decide('In this cross_validate result, what does test_score contain?',['Final-test evidence','Training-fold validation scores','Training fit scores'],1,'It contains scores on each fold’s validation rows. Naming in the library does not change the role of the protected final test.')],chapter=1)
    lesson('W10','Settings, learned values and fit quality','Separate hyperparameters, learned parameters and generalisation evidence.',
        'Settings control fitting; learned parameters are estimated from examples. Supplied curves illustrate underfitting and overfitting without requiring an untaught model family.',
        'model.get_params()\nmodel.coef_', 'comparison',[
        decide('Which value is learned by LinearRegression.fit?',['fit_intercept setting','coef_','random split seed'],1,'coef_ is learned. fit_intercept is a constructor setting and the split seed controls the partition.'),
        decide('Training/validation RMSE: A 12/13, B 5/6, C 1/11. Which suggests overfitting?',['A','B','C'],2,'C has a large gap: very low training error but much worse validation error. These are supplied comparable experiments, not a request to tune an unfamiliar model.')],chapter=1)
    lesson('W11','How a search makes a choice','Understand search boundaries before model-specific tuning.',
        'GridSearchCV compares declared candidate settings through training-fold validation, selects by the scorer and refits the chosen candidate on training rows. LinearRegression has no search in the shared checkpoint; keeping defaults is a valid decision.',
        'GridSearchCV(pipeline, parameter_grid, cv=folds, scoring=scorer)','folds',[
        decide('Which population may a candidate search use?',['The final test to choose settings','Training folds only','Rows with the best-looking final predictions'],1,'Candidate fitting and selection use training folds. The final test remains outside the search.'),
        decide('Candidate A fold scores: 0.6,0.7,0.8. B: 0.7,0.75,0.8. For a larger-is-better scorer, which has the higher mean?',['A','B','The final test must decide'],1,'B has mean 0.75 versus 0.70 for A. A search can nominate B and refit on training rows without using the final test.'),
        reflect('The shared workflow uses LinearRegression with no supported grid. What should you do?','Keep the estimator’s sensible defaults and state that no parameter search is needed. Complete CV, reference comparison, diagnosis and final evaluation; do not introduce tree depth.')],chapter=2)
    lesson('W12','Diagnose without opening the final test','Use predictions from models that did not fit each diagnostic row.',
        'Out-of-fold predictions allow training-only diagnostic plots. After parameter selection they remain development evidence, not an unbiased substitute for final evaluation.',
        'cross_val_predict(model, X_train, y_train, cv=folds)','regression',[
        py('Create out-of-fold predictions for every training row.',"from sklearn.model_selection import cross_val_predict\nanswer=cross_val_predict(model,X_train,y_train,cv=folds)","len(answer)==len(X_train) and np.isfinite(answer).all() and trace.phase_present('oof')",setup=cvsetup),
        py('Build residuals from the supplied out-of-fold predictions and plot them against predicted values.',"answer=y_train-oof_predictions\nimport matplotlib.pyplot as plt\nfig,ax=plt.subplots()\nax.scatter(oof_predictions,answer)\nax.axhline(0,color='black')\nax.set(xlabel='OOF predicted duration',ylabel='Residual',title='Training-only residuals')","np.allclose(answer,y_train-oof_predictions) and len(fig.axes[0].collections)==1",setup=cvsetup+"from sklearn.model_selection import cross_val_predict\noof_predictions=cross_val_predict(model,X_train,y_train,cv=folds)\n"),
        py('From supplied class predictions, select the misclassified rows.',"answer=df.loc[df.actual.ne(df.predicted)]","answer.equals(df.loc[df.actual.ne(df.predicted)])",dataset='ERROR12')],chapter=2)
    lesson('W13','Finish once, then report','Separate selection from final evidence.',
        'After selecting a workflow using training evidence, refit it on all training rows and predict final-test rows. Reuse those predictions for reporting; choosing new settings after inspecting final errors is exploratory.',
        'final_model = clone(chosen).fit(X_train, y_train)','split',[
        py('Refit the supplied chosen line and compute final RMSE.',"from sklearn.base import clone\nfrom sklearn.metrics import root_mean_squared_error\nfinal_model=clone(model).fit(X_train,y_train)\nfinal_predictions=final_model.predict(X_test)\nanswer=root_mean_squared_error(y_test,final_predictions)","np.isclose(answer,np.sqrt(np.mean((y_test-final_predictions)**2)))",setup=cvsetup),
        py('Draw actual versus predicted values from the same supplied final predictions.',"import matplotlib.pyplot as plt\nfig,ax=plt.subplots()\nax.scatter(y_test,predictions)\nax.set(xlabel='Actual duration',ylabel='Predicted duration',title='Final-test predictions')\nanswer=pd.DataFrame({'actual':y_test,'predicted':predictions})","np.allclose(answer.predicted,predictions) and answer.index.equals(y_test.index)",setup=FIT),
        decide('A final-test plot looks poor. Can we select a new setting using that plot and call the same rows an untouched final test?',['Yes','No'],1,'The rows have influenced selection. Further work is exploratory; resetting an interface does not erase what has been learned.')],chapter=2)
    timeset="cut=int(len(df)*.8)\ntrain=df.iloc[:cut]\ntest=df.iloc[cut:]\n"
    lesson('W14','Respect time','Validate in the direction the model will be used.',
        'Random shuffling can leak future patterns into past training. TimeSeriesSplit uses forward validation. Its validation blocks do not cover every training row, so use the last block for the demonstrated diagnostic.',
        'TimeSeriesSplit(n_splits=5)','time',[
        py('Split the first 80% of TIME240 into train and the last 20% into test.',timeset+"answer=[train.time.max(),test.time.min()]","len(train)==192 and len(test)==48 and train.time.max()<test.time.min()",dataset='TIME240'),
        py('Inspect five forward training/validation index pairs.',"from sklearn.model_selection import TimeSeriesSplit\nanswer=list(TimeSeriesSplit(5).split(train))","len(answer)==5 and all(max(a)<min(b) for a,b in answer)",dataset='TIME240',setup=timeset),
        py('Fit a line on the last fold’s earlier rows and predict its later validation block.',"from sklearn.model_selection import TimeSeriesSplit\nfrom sklearn.linear_model import LinearRegression\na,b=list(TimeSeriesSplit(5).split(train))[-1]\nmodel=LinearRegression().fit(train[['temperature']].iloc[a],train.demand.iloc[a])\nanswer=model.predict(train[['temperature']].iloc[b])","len(answer)==len(b) and max(a)<min(b) and np.isfinite(answer).all()",dataset='TIME240',setup=timeset),
        reflect('Seoul includes measured rainfall and temperature. What must be stated before calling the workflow a forecast?','State the prediction horizon and whether those weather inputs are known or forecast then. Observed future weather is not automatically available for a real advance forecast.')],chapter=2)
