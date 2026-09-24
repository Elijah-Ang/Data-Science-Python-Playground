"""Workflow-level learner deliverables; granular checks remain intact."""
def groups(exercise,index):
    if index<16:
        diagnosis=('Diagnose the last forward validation block; keep later final rows sealed.' if index==3 else
                   'Use out-of-fold training predictions to inspect residuals or class errors before opening the final test.')
        if index==4:diagnosis+=' Compare the measurements-only ablation on the same training folds.'
        if index in (14,15):diagnosis+=' Inspect neural convergence and loss history as well as prediction error.'
        descriptions=[
          ('Data boundary','Load the supplied challenge CSV, define the declared X/y and preserve aligned row identities through the split. Keep learned preparation inside each training fit.'),
          ('Validation & selection','Compare the requested initial model families with a dummy reference on matching training folds. Evaluate the declared settings where applicable and nominate from training evidence.'),
          ('Diagnosis',diagnosis),
          ('Final evidence','Fit the nominated model on training rows and evaluate the reserved rows once. Report saved predictions, the requested metrics and labelled evidence; explain limitations without using the final test for further selection.')]
        mapping={
          0:['Aligned split inputs and targets','Protected final rows','Observable training provenance','Declared features and target','Forward split'],
          1:['Cross-validation','Matching folds','Fold-local preparation','Reference evidence','Candidate coverage','Nomination','Requested model families','Production preparation','Production One-R'],
          2:['Training-only diagnosis','Last-block diagnosis','Training-only ablation'],
          3:['Final-test discipline','Predictions match the chosen fit','Original-unit RMSE','Class predictions','Macro F1','Interpretation','Class-labelled probabilities']}
    elif index==16:
        descriptions=[('Discovery population','Load the four supplied Penguin measurements and fit scaling to this declared population; no species labels enter fitting.'),
          ('Compare groupings','Compare k=2–8 with inertia, silhouette and geometry. Justify a grouping without treating a score as proof of natural classes.'),
          ('Assignments & profiles','Return one assignment per fitted row, group sizes and aligned original-unit profiles.'),
          ('Interpretation','Use a labelled measurement-space figure and the evidence to explain the grouping and its limitations.')]
        mapping={0:['Reference-free inputs'],1:['k evidence'],2:['Assignments','Original-unit profiles'],3:['Choice and interpretation']}
    elif index==17:
        descriptions=[('Population & sample','Scale the supplied five-measurement population; preserve the identities of the seed-42 sample of at most 500 rows.'),
          ('Hierarchy & cuts','Build Ward linkage on the scaled sample and compare cuts from k=2–8. Include a labelled truncated dendrogram.'),
          ('Aligned profiles','Attach the chosen cut labels to exactly the sampled rows and report original-unit group means.'),
          ('Interpretation','Explain a defensible cut, sample scope and distance assumptions; group identifiers are names, not classes.')]
        mapping={0:['Sampled population','Population scaler'],1:['Ward hierarchy','Hierarchy cut'],2:['Aligned profiles'],3:['Interpretation']}
    else:
        descriptions=[('Measurement population','Load all 30 supplied measurements and standardise them without diagnosis labels.'),
          ('Variance & retention','Fit PCA and find the smallest component count retaining at least 90% variance; report ratios and cumulative variance.'),
          ('Representation & view','Return the retained scores plus consistent feature weights and a separate labelled two-component view.'),
          ('Interpretation','Distinguish retained information from the two-axis picture. Explain axis weights without claiming causal effects.')]
        mapping={0:['Target-free inputs'],1:['Minimum retained dimension','Variance evidence'],2:['Weights and scores','Two-dimensional view'],3:['Interpretation']}
    names=[c['name'] for c in exercise['checks']]
    result=[dict(title=title,summary=summary,checks=[name for name in mapping[i] if name in names]) for i,(title,summary) in enumerate(descriptions)]
    assert sorted(name for group in result for name in group['checks'])==sorted(names),'Every semantic check needs one workflow group'
    return result
