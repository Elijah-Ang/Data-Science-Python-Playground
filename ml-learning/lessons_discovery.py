from authoring import lesson,py,decide,reflect

CLUSTER="""from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
X=df.copy()
scaler=StandardScaler()
scaled=scaler.fit_transform(X)
"""
PCA_SETUP="""from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
X=df.copy()
scaler=StandardScaler()
scaled=scaler.fit_transform(X)
pca=PCA().fit(scaled)
scores=pca.transform(scaled)
"""

def author():
    lesson('U01','Discovery has no prediction target','State the exploratory population and question.',
        'In supervised learning we had y. Here the goal is to describe structure in X. Cluster IDs are arbitrary identifiers, not predicted real-world classes. Reference labels must not guide fitting or selection.',
        'X = df[measurement_columns]','tasks',[
        py('Store only bill length, bill depth, flipper length and body mass in answer, keeping every Penguin row and the stated column order.',"answer=df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]","answer.equals(df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']])",dataset='penguins'),
        reflect('Why is there no supervised accuracy objective when fitting these groups?','No target class defines a correct answer during fitting. A later comparison with an external reference may aid interpretation, but does not turn the fitting process into supervised prediction.')])
    lesson('U02','Distance depends on scale and context','Fit a meaningful distance representation for the exploratory population.',
        'In discovery, fitting a scale on the declared population is part of describing that population. If PCA or clustering features later enter a supervised workflow, fit those transformations inside its training folds.',
        'scaled = StandardScaler().fit_transform(X)','geometry',[
        py('Standardise CLUSTER36’s unequal-unit measurements.',"from sklearn.preprocessing import StandardScaler\nscaler=StandardScaler()\nanswer=scaler.fit_transform(df)","answer.shape==df.shape and np.allclose(answer.mean(axis=0),0,atol=1e-7) and np.allclose(answer.std(axis=0),1)",dataset='CLUSTER36'),
        py('Calculate raw_distance and scaled_distance for the first pair of CLUSTER36 rows.',"from sklearn.preprocessing import StandardScaler\nscaled=StandardScaler().fit_transform(df)\nraw_distance=float(np.linalg.norm(df.iloc[0]-df.iloc[1]))\nscaled_distance=float(np.linalg.norm(scaled[0]-scaled[1]))","np.isclose(raw_distance,np.linalg.norm(df.iloc[0]-df.iloc[1])) and np.isclose(scaled_distance,np.linalg.norm(scaled[0]-scaled[1]))",dataset='CLUSTER36',outputs=['raw_distance','scaled_distance']),
        decide('If these transformed features become inputs to a supervised predictor, where should scaling be fitted?',['On all rows before CV','Within each training fold','On final-test rows'],1,'The fitting boundary changes with the goal. Predictive evaluation requires fold-local transformations.')])
    lesson('U03','K-Means assigns points to centroids','Understand centroids, distances and assignments.',
        'K-Means alternates assignments and centroid updates to reduce within-cluster squared distances. Production uses multiple initialisations and a reproducible seed. k=3 is a starting choice, not a discovered truth.',
        'KMeans(n_clusters=3, n_init=20, random_state=42)','geometry',[
        py('Fit three K-Means clusters to scaled CLUSTER36. Store the fitted centroid coordinates in answer.',"model=KMeans(n_clusters=3,n_init=20,random_state=42).fit(scaled)\nanswer=model.cluster_centers_","answer.shape==(3,2) and np.allclose(answer,model.cluster_centers_)",dataset='CLUSTER36',setup=CLUSTER),
        py('For the first row, store its assigned cluster ID in cluster and its distance to that centroid in distance.',"model=KMeans(n_clusters=3,n_init=20,random_state=42).fit(scaled)\ncluster=int(model.labels_[0])\ndistance=float(np.linalg.norm(scaled[0]-model.cluster_centers_[cluster]))","cluster==int(model.labels_[0]) and np.isclose(distance,np.linalg.norm(scaled[0]-model.cluster_centers_[cluster]))",dataset='CLUSTER36',setup=CLUSTER,outputs=['cluster','distance']),
        py('Group Candy by sugar/price measurements and describe original-unit profiles.',"from sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nX=df[['sugarpercent','pricepercent']]\nlabels=KMeans(n_clusters=3,n_init=20,random_state=42).fit_predict(StandardScaler().fit_transform(X))\nanswer=X.groupby(labels).mean()","answer.shape==(3,2) and np.allclose(answer.values,X.groupby(labels).mean().values)",dataset='candy')],chapter=1,models=['kmeans'])
    lesson('U04','Choosing k requires evidence and judgement','Combine compactness, separation and useful interpretation.',
        'Inertia decreases as more centres are added, so its minimum alone does not select k. Silhouette describes separation relative to cohesion. Neither proves a single natural grouping.',
        'model.inertia_\nsilhouette_score(scaled, labels)','comparison',[
        py('Fit k=3 and report inertia.',"model=KMeans(n_clusters=3,n_init=20,random_state=42).fit(scaled)\nanswer=model.inertia_","np.isclose(answer,np.sum((scaled-model.cluster_centers_[model.labels_])**2))",dataset='CLUSTER36',setup=CLUSTER),
        py('Compute silhouette for the same fitted assignments.',"from sklearn.metrics import silhouette_score\nmodel=KMeans(n_clusters=3,n_init=20,random_state=42).fit(scaled)\nanswer=silhouette_score(scaled,model.labels_)","-1<=answer<=1",dataset='CLUSTER36',setup=CLUSTER),
        py('Compare k=2 through 8, collecting inertia and silhouette.',"from sklearn.metrics import silhouette_score\nrows=[]\nfor k in range(2,9):\n    model=KMeans(n_clusters=k,n_init=20,random_state=42).fit(scaled)\n    rows.append({'k':k,'inertia':model.inertia_,'silhouette':silhouette_score(scaled,model.labels_)})\nanswer=pd.DataFrame(rows)","list(answer.k)==list(range(2,9)) and np.isfinite(answer[['inertia','silhouette']]).all().all()",dataset='CLUSTER36',setup=CLUSTER),
        reflect('Two k choices have similar silhouette but different useful profiles. Must one be graded wrong?','No. Explain the exploratory purpose, differences in size/profile and the trade-off. A defensible grouping need not maximise a single metric.')],chapter=1)
    penguin="""from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
X=df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]
scaled=StandardScaler().fit_transform(X)
labels=KMeans(n_clusters=3,n_init=20,random_state=42).fit_predict(scaled)
"""
    lesson('U05','Describe clusters in meaningful units','Use sizes and original-unit profiles with named features.',
        'Cluster labels may be permuted without changing the grouping. Report original-unit feature summaries and population sizes so the result is interpretable.',
        'X.groupby(labels).mean()','comparison',[
        py('Report cluster sizes and original-unit means.',"answer=X.groupby(labels).mean()\nsizes=pd.Series(labels).value_counts().sort_index()","np.allclose(answer.values,X.groupby(labels).mean().values) and sizes.sum()==len(X)",dataset='penguins',setup=penguin,outputs=['answer','sizes']),
        py('Plot bill length against bill depth using a different marker for each cluster. Store each cluster’s mean bill length and depth in answer.',"import matplotlib.pyplot as plt\nfig,ax=plt.subplots()\nfor label in np.unique(labels):\n    selected=X.loc[labels==label]\n    ax.scatter(selected.bill_length_mm,selected.bill_depth_mm,label='Group '+str(label),marker=['o','s','^'][int(label)%3])\nax.set(xlabel='Bill length (mm)',ylabel='Bill depth (mm)',title='Groups in two measured features')\nax.legend()\nanswer=X.groupby(labels)[['bill_length_mm','bill_depth_mm']].mean()","list(answer.columns)==['bill_length_mm','bill_depth_mm'] and np.allclose(answer.values,X.groupby(labels)[['bill_length_mm','bill_depth_mm']].mean().values) and len(fig.axes[0].collections)==3",dataset='penguins',setup=penguin),
        reflect('Would renaming cluster 0 to cluster 2 alter the result? What remains omitted by this plot?','Renaming IDs does not alter group membership. The two measured axes omit other clustering features, so apparent overlap or separation in the picture is incomplete evidence.')],chapter=1)
    lesson('U06','When K-Means geometry misleads','Recognise initialisation, scale and shape limitations.',
        'Different starting centres can find different local solutions. Multiple starts help, but do not remove the preference for compact centroid-based groups or resolve the meaning of k.',
        'random_state and n_init','geometry',[
        py('Fit four-cluster K-Means with one initialisation for each seed 1, 2 and 3. Store each inertia in answer in seed order.',"answer=[]\nfor seed in [1,2,3]:\n    model=KMeans(n_clusters=4,n_init=1,random_state=seed).fit(scaled)\n    answer.append(model.inertia_)","len(answer)==3 and np.allclose(answer,[KMeans(n_clusters=4,n_init=1,random_state=seed).fit(scaled).inertia_ for seed in [1,2,3]])",dataset='CLUSTER36',setup=CLUSTER),
        reflect('An elongated cloud is split into several compact pieces. Why might the result be mathematically valid but substantively unhelpful?','K-Means optimises squared distance to centroids, not the desired real-world definition of a group. Scale, shape and the selected k must be considered alongside scores.')],chapter=1)
    ward=CLUSTER+"from scipy.cluster.hierarchy import linkage,dendrogram,cut_tree\nlinkage_matrix=linkage(scaled,method='ward')\n"
    lesson('U07','Hierarchical merging','Interpret Ward linkage and merge height.',
        'Agglomerative clustering begins with individual observations and repeatedly merges groups. Ward chooses merges based on the increase in within-cluster variation. Dendrogram height represents its merge distance, not probability.',
        "linkage(scaled, method='ward')\ndendrogram(linkage_matrix)",'hierarchy',[
        py('Store the supplied Ward linkage matrix for scaled CLUSTER36 in answer.',"answer=linkage_matrix","answer.shape==(len(df)-1,4) and np.array_equal(answer,linkage_matrix)",dataset='CLUSTER36',setup=ward),
        py('Draw a truncated dendrogram showing the last ten groups.',"import matplotlib.pyplot as plt\nfig,ax=plt.subplots(figsize=(7,4))\nanswer=dendrogram(linkage_matrix,truncate_mode='lastp',p=10,ax=ax)\nax.set(xlabel='Merged observations/groups',ylabel='Ward merge distance',title='Ward hierarchy')","len(answer['leaves'])==10 and len(fig.axes[0].collections)>0",dataset='CLUSTER36',setup=ward),
        decide('What does a high Ward merge mean?',['A high probability of the same species','A larger merge distance under Ward’s criterion','A validated true class boundary'],1,'It measures the merge according to Ward geometry. It is not a class probability or proof of true groups.')],chapter=2,models=['hierarchical'])
    lesson('U08','Turn a hierarchy into groups','Choose a cut using evidence and purpose.',
        'A cut assigns observations to groups at a chosen resolution. Several cuts can be informative. Combine the dendrogram with sizes, profiles and the exploratory question.',
        'cut_tree(linkage_matrix, n_clusters=3).ravel()','hierarchy',[
        py('Cut the fitted Ward hierarchy into three groups and store one group assignment per row in answer.',"answer=cut_tree(linkage_matrix,n_clusters=3).ravel()","len(answer)==len(df) and _same_partition(answer,cut_tree(linkage_matrix,n_clusters=3).ravel())",dataset='CLUSTER36',setup=ward),
        py('Cut the fitted hierarchy into two groups and four groups. Store each cut’s group counts in sizes_2 and sizes_4.',"sizes_2=pd.Series(cut_tree(linkage_matrix,n_clusters=2).ravel()).value_counts()\nsizes_4=pd.Series(cut_tree(linkage_matrix,n_clusters=4).ravel()).value_counts()","sorted(sizes_2.tolist())==sorted(pd.Series(cut_tree(linkage_matrix,n_clusters=2).ravel()).value_counts().tolist()) and sorted(sizes_4.tolist())==sorted(pd.Series(cut_tree(linkage_matrix,n_clusters=4).ravel()).value_counts().tolist())",dataset='CLUSTER36',setup=ward,outputs=['sizes_2','sizes_4']),
        reflect('What should justify a chosen cut besides a visually appealing dendrogram?','State its group sizes, original-unit profiles, relevant separation evidence and usefulness for the exploratory question. A cut is a descriptive choice, not a discovered label truth.')],chapter=2)
    lesson('U09','Sampled hierarchies describe sampled rows','Keep population, sample and labels aligned.',
        'Production fits the scale on the exploratory population, then transforms a reproducible sample of at most 500 rows for the hierarchy. The resulting labels belong to those sampled rows.',
        'sample = X.sample(min(500,len(X)), random_state=42)','hierarchy',[
        py('Sample 100 Penguin measurement rows while retaining their original index.',"answer=X.sample(100,random_state=42)","answer.index.equals(X.sample(100,random_state=42).index)",dataset='penguins',setup=penguin),
        py('Apply the 500-row cap to Breast measurements.',"X=df[['radius_mean','texture_mean','smoothness_mean','concavity_mean','symmetry_mean']]\nanswer=X.sample(min(500,len(X)),random_state=42)","len(answer)==500 and answer.index.equals(X.sample(500,random_state=42).index)",dataset='breast'),
        reflect('You compare K-Means on all 569 rows with Ward profiles on a 500-row sample. What should change for a direct comparison?','Compare on the same sampled population and feature representation, or explicitly describe the different populations and why direct profile differences are not solely algorithm differences.')],chapter=2)
    lesson('U10','Interpret discovery without inventing truth','Keep external labels and claims separate from fitting.',
        'Reference labels may be inspected after fitting for interpretation, but must not secretly determine features, k or the hierarchy cut. Discovery describes a chosen population under chosen measurements and geometry.',
        'Fit using X; qualify later interpretations.','tasks',[
        decide('A learner chooses k to maximise agreement with hidden species labels, then claims unsupervised discovery. What happened?',['The reference influenced selection','Nothing changed','Silhouette proves the claim'],0,'The labels became selection information. The workflow is no longer the stated label-independent exploration.'),
        reflect('Write a qualified conclusion for a sampled Ward grouping.','For these sampled observations and scaled measurements, the chosen Ward cut yields groups with the reported profiles. Other measurements, samples or cuts may support different useful descriptions.')],chapter=2)
    pca();comparison()

def pca():
    lesson('P01','New coordinates, not selected original columns','Distinguish PCA from feature selection and clustering.',
        'PCA rotates numeric measurements into component axes and can retain fewer axes. Components combine original features; they are not selected original columns or cluster assignments.',
        'Standardise → fit axes → transform rows','pca',[
        decide('What does the first PCA component contain?',['A weighted combination of original features','Always the first original feature','The first cluster label'],0,'A principal axis is a weighted combination chosen to explain variation in the fitted representation.'),
        reflect('How does a request to compress correlated measurements differ from discovering groups?','Compression asks for a lower-dimensional representation preserving variation. Clustering asks for assignments or a hierarchy that describes similarity. PCA does not itself produce groups.')])
    lesson('P02','Fit a reusable PCA representation','Transform rows with the fitted axes and scale.',
        'Standardisation changes which variation PCA emphasises. Fit the representation on the intended population; transform new rows using those same fitted statistics and axes.',
        'pca = PCA().fit(scaled)\nscores = pca.transform(scaled)','pca',[
        py('Store the supplied PCA component scores for every PCA48 row in answer.',"answer=scores","answer.shape==df.shape and np.allclose(answer,scores)",dataset='PCA48',setup=PCA_SETUP),
        py('Transform the first two observations using the fitted scaler and PCA.',"answer=pca.transform(scaler.transform(X.iloc[:2]))","np.allclose(answer,scores[:2])",dataset='PCA48',setup=PCA_SETUP),
        py('Scale the four Penguin measurements, fit PCA and store one row of component scores per Penguin in answer.',"from sklearn.preprocessing import StandardScaler\nfrom sklearn.decomposition import PCA\nX=df[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']]\nscaled=StandardScaler().fit_transform(X)\npca=PCA().fit(scaled)\nanswer=pca.transform(scaled)","answer.shape==(len(df),4) and np.allclose(answer,pca.transform(scaled))",dataset='penguins')],models=['pca'])
    lesson('P03','Explained variance is not predictive accuracy','Interpret per-component variation.',
        'Explained variance ratios measure variation along fitted axes relative to total variation in the prepared inputs. They say nothing directly about predicting a target.',
        'pca.explained_variance_ratio_','pca',[
        py('Inspect the explained variance ratios.',"answer=pca.explained_variance_ratio_","len(answer)==5 and np.isclose(sum(answer),1) and np.all(answer>=0)",dataset='PCA48',setup=PCA_SETUP),
        py('Draw a labelled per-component variance chart.',"import matplotlib.pyplot as plt\nanswer=pca.explained_variance_ratio_\nfig,ax=plt.subplots()\nax.bar(np.arange(1,len(answer)+1),answer)\nax.set(xlabel='Component',ylabel='Explained variance ratio',title='Variance by component')","len(fig.axes[0].patches)==len(answer) and np.allclose([p.get_height() for p in fig.axes[0].patches],answer)",dataset='PCA48',setup=PCA_SETUP),
        decide('A representation retains 90% variance. Does that mean 90% classification accuracy?',['Yes','No'],1,'Variance retention describes the input representation, not prediction correctness.')],chapter=1)
    lesson('P04','Select a retained representation','Choose the smallest component prefix meeting a variance criterion.',
        'Production uses the smallest prefix reaching at least 90% cumulative variance. The threshold is a stated compression criterion, not a universal optimum.',
        'retained = np.searchsorted(cumulative, 0.9) + 1','pca',[
        py('Keep the fewest leading PCA components that explain at least 90% variance. Store that count in retained and the matching row scores in answer.',"cumulative=np.cumsum(pca.explained_variance_ratio_)\nretained=int(np.searchsorted(cumulative,.9)+1)\nanswer=scores[:,:retained]","retained==int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1) and answer.shape==(len(df),retained) and np.allclose(answer,scores[:,:retained])",dataset='PCA48',setup=PCA_SETUP),
        py('Store the smallest number of PCA components reaching 80% variance in retained_80 and the number reaching 95% in retained_95.',"cumulative=np.cumsum(pca.explained_variance_ratio_)\nretained_80=int(np.searchsorted(cumulative,.8)+1)\nretained_95=int(np.searchsorted(cumulative,.95)+1)","retained_80==int(np.searchsorted(cumulative,.8)+1) and retained_95==int(np.searchsorted(cumulative,.95)+1)",dataset='PCA48',setup=PCA_SETUP,outputs=['retained_80','retained_95']),
        py('Apply the 90% rule to all 30 Breast measurements.',"from sklearn.preprocessing import StandardScaler\nfrom sklearn.decomposition import PCA\nX=df[[c for c in df if c.endswith(('_mean','_se','_worst'))]]\npca=PCA().fit(StandardScaler().fit_transform(X))\nanswer=int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1)","1<=answer<=30 and answer==int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1)",dataset='breast')],chapter=1)
    lesson('P05','Component weights and scores','Distinguish feature-axis weights from row coordinates.',
        'Production calls components_.T “loadings”: these are component-axis weights. Other statistical conventions use scaled loadings. Scores locate observations on the axes. An axis sign can flip without changing its information.',
        "weights = pd.DataFrame(pca.components_.T, index=X.columns)",'pca',[
        py('Build a labelled first-two-component weight table.',"answer=pd.DataFrame(pca.components_[:2].T,index=X.columns,columns=['PC1','PC2'])","answer.shape==(5,2) and list(answer.index)==list(X.columns) and np.allclose(answer,pca.components_[:2].T)",dataset='PCA48',setup=PCA_SETUP),
        decide('If every weight and score for PC1 changes sign together, what changes?',['The represented information','The axis orientation only','The retained variance doubles'],1,'The axis points in the opposite direction. Distances, variance and the represented information remain equivalent.'),
        py('Return a score table with one row per observation.',"answer=pd.DataFrame(scores[:,:2],index=X.index,columns=['PC1','PC2'])","answer.shape==(len(df),2) and np.allclose(answer.values,scaled@pca.components_[:2].T)",dataset='PCA48',setup=PCA_SETUP)],chapter=2)
    lesson('P06','Two dimensions are a view','Separate a display from the retained representation.',
        'A two-component picture may show much less variation than the full reduced representation. Label the variance visible in it. Optional reference colouring belongs after fitting and does not prove classes are recovered.',
        'scores[:, :2]\nratios[:2].sum()','pca',[
        py('Report the variation visible in the first two axes.',"answer=float(pca.explained_variance_ratio_[:2].sum())","np.isclose(answer,pca.explained_variance_ratio_[:2].sum())",dataset='PCA48',setup=PCA_SETUP),
        py('Store the 90%-retained scores in retained_scores and the separate two-axis display in view_2d.',"retained=int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1)\nretained_scores=scores[:,:retained]\nview_2d=scores[:,:2]","retained==int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_),.9)+1) and retained_scores.shape==(len(df),retained) and view_2d.shape==(len(df),2) and np.allclose(retained_scores,scores[:,:retained]) and np.allclose(view_2d,scores[:,:2])",dataset='PCA48',setup=PCA_SETUP,outputs=['retained_scores','view_2d']),
        reflect('After fitting Penguin PCA without species, you colour the 2D points by species. What can this show, and what can it not prove?','It can help describe how the reference labels relate to the projection. It does not establish supervised accuracy, causal axes, complete separation in all dimensions or a label-independent choice if labels were used to select the representation.')],chapter=2)
    lesson('P07','Equivalent signs and reconstruction','Understand equivalent representations and information loss.',
        'Paired sign flips preserve the representation. Reconstructing from fewer axes omits variation; low reconstruction error is still not a causal interpretation.',
        'pca.inverse_transform(scores)','pca',[
        py('Flip the first component’s weights.',"answer=pca.components_[0]*-1","np.allclose(answer,-pca.components_[0])",dataset='PCA48',setup=PCA_SETUP),
        py('Flip its scores consistently and verify the same rank-one reconstruction.',"weights=-pca.components_[0]\nflipped_scores=-scores[:,0]\nanswer=np.outer(flipped_scores,weights)","np.allclose(answer,np.outer(scores[:,0],pca.components_[0]))",dataset='PCA48',setup=PCA_SETUP),
        py('Zero scores after the first two components and reconstruct the scaled inputs.',"compressed=scores.copy()\ncompressed[:,2:]=0\nanswer=pca.inverse_transform(compressed)","answer.shape==scaled.shape and np.allclose(answer,compressed@pca.components_+pca.mean_)",dataset='PCA48',setup=PCA_SETUP),
        reflect('Why should a component associated with several measurements not be named as a proven causal factor?','PCA describes variance combinations. Naming can be a useful interpretation, but causal claims require evidence beyond a variance decomposition.')],chapter=2)

def comparison():
    lesson('M01','Choose the task before the family','Build a complete model-choice mental model.',
        'Begin with the question: predict a quantity, predict a label, discover groups or reduce a representation. Then consider sample size, feature types, scale, flexibility, interpretability, probabilities, assumptions and cost. Core is essential within a relevant pathway, not a requirement to finish every model.',
        'Question → task family → constraints → plausible candidates','tasks',[
        decide('You have no labelled outcome and need compact summaries of correlated measurements. Which task fits?',['Classification','PCA reduction','Regression','Cluster classification accuracy'],1,'PCA addresses representation and variance; there is no labelled target to predict.'),
        reflect('Shortlist supervised candidates for mixed inputs, limited rows and a need to explain predictions.','Consider linear/logistic models with appropriate encoding, simple rules or trees where compatible; assess task type, flexibility and assumptions. More complex candidates need validation and cost justification. More than one shortlist can be defensible.'),
        decide('Which pairing correctly distinguishes the two clustering approaches?',['K-Means centres; Hierarchical a sequence of merges and cuts','K-Means predicts y; Hierarchical computes supervised accuracy','Both automatically reveal true labels'],0,'Both are exploratory. K-Means uses centroids; hierarchical clustering exposes a hierarchy that can be cut at several resolutions.'),
        reflect('A team asks to “find patterns”. What would you clarify before choosing K-Means, Ward or PCA?','Clarify whether it needs groups, a hierarchy or fewer numeric dimensions, which population/features matter, and what interpretation will be useful. A prediction goal additionally needs a defined target.')])
    lesson('M02','Compare candidates on common evidence','Use matching evaluation designs and practical constraints.',
        'Comparisons need the same population, outcome definition, split and folds when the aim is a paired predictive comparison. Nominate before the final test. Discovery and PCA use different evidence and must not be ranked by supervised accuracy.',
        'Paired validation evidence + assumptions + cost','comparison',[
        decide('Two models share five folds. Differences in RMSE are [.1,-.1,.0,.2,-.2]. What is a sound conclusion?',['One is universally superior','Differences are small and inconsistent; consider uncertainty and practical factors'],1,'The supplied paired differences do not justify an absolute ranking.'),
        decide('Model A uses random CV on Seoul; B uses forward CV. Is their score difference a clean model comparison?',['Yes','No'],1,'Validation design changed with the model, so score differences do not isolate model-family performance.'),
        reflect('Explain a nomination with similar scores but different cost and interpretability.','State the common evaluation design, size/variation of the score difference and relevant practical constraints. Nominate from training evidence, then reserve the final test for that chosen workflow.')],chapter=1)
    lesson('M03','Explain a result responsibly','Connect claims with evidence and limitations.',
        'Reports should name the task, population, evaluation design, reference, selected approach and limitations. Discovery reports describe profiles and assumptions; PCA reports retention and representation rather than prediction accuracy.',
        'Question → evidence → conclusion → limits','comparison',[
        py('Build answer as an evidence table with columns model, cv_rmse and fold_sd. The linear model has CV RMSE 4.2 and fold standard deviation 0.6; the tree has 4.3 and 0.8.',"answer=pd.DataFrame({'model':['linear','tree'],'cv_rmse':[4.2,4.3],'fold_sd':[.6,.8]})","list(answer.columns)==['model','cv_rmse','fold_sd'] and list(answer.model)==['linear','tree'] and np.allclose(answer.cv_rmse,[4.2,4.3]) and np.allclose(answer.fold_sd,[.6,.8])"),
        decide('Which report wording is supported by a held-out predictive result?',['The feature causes the outcome','This selected workflow achieved the reported error on the held-out population'],1,'The held-out result describes predictive evidence for that population and design, not a causal effect.'),
        reflect('Write a useful conclusion when all candidates are close to the dummy reference.','State the limited improvement and its uncertainty. Explain what was evaluated and what remains unresolved, rather than claiming there is no relationship or hiding the weak result.')],chapter=2)
    lesson('M04','What changes outside this dataset?','Identify evidence needed for a changed use context.',
        'Population shift, group structure and changed feature availability can break apparent validation success. State the intended use and the new evidence needed rather than promising transportability.',
        'Training context → intended use → evidence gap','tasks',[
        decide('Penguin island is missing at the proposed new site. What must be revisited?',['Only the chart colours','Feature availability and the fitted workflow','Nothing if old accuracy was high'],1,'The old feature contract no longer holds. Revisit preparation, candidate selection and validation for the intended use.'),
        reflect('A model trained on one institution is proposed for another. What additional evidence would you seek?','Check variable definitions and availability, population differences, grouped or external validation, error distribution and relevant costs. The original held-out split does not establish performance everywhere.')],chapter=2)
