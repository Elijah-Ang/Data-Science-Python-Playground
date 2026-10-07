"""Challenge rubrics bind evidence to observed operations and original inputs."""

def check(name,test,message):
    return dict(name=name,test=test,message=message)

def apply(registry):
    for challenge in registry['challenges']:
        e=challenge['exercise'];id=challenge['id']
        if id=='ML-X05':
            for c in e['checks']:
                if c['name']=='Training-only ablation':
                    c['test']="trace.validation_matches(ablation_results, X_train[['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']], y_train, scoring='f1_macro', family='LogisticRegression', cv=folds)"
                    c['message']='Return the observed measurements-only logistic validation scores on the same training rows and five folds; invented scores or context predictors do not perform an ablation.'
        if id in ('ML-X09','ML-X10'):
            numeric=[] if id=='ML-X09' else ['sugarpercent','pricepercent']
            categories=['buying','maintenance','doors','persons','luggage_boot','safety'] if id=='ML-X09' else ['chocolate','fruity','caramel','peanutyalmondy','nougat','crispedricewafer','hard','bar','pluribus']
            target='acceptability' if id=='ML-X09' else 'popular'
            e['checks'] += [check('Declared One-R inputs',f'X.equals(df[{numeric+categories!r}]) and y.equals(df[{target!r}])','Use the original declared features and aligned target; later outcomes and outcome-derived fields are excluded.'),
                check('Discrete and numeric One-R preparation',f"set(final_model.named_steps['prepare'].numeric_features)==set({numeric!r}) and set(final_model.named_steps['prepare'].categorical_features)==set({categories!r})",'Preserve numeric binning and discrete category metadata in the declared production One-R preparation.')]
        if id in ('ML-X11','ML-X12','ML-X13'):
            for c in e['checks']:
                if c['name']=='Class-labelled probabilities':
                    c['test']="probabilities.index.equals(X_test.index) and probabilities.columns.is_unique and set(probabilities.columns)==set(final_model.classes_) and trace.prediction_matches(probabilities.reindex(columns=final_model.classes_).to_numpy(),X_test,'predict_proba')"
                    c['message']='Return the observed fitted probabilities for the reserved rows with their original row indices and class labels; columns may be reordered consistently.'
        if id in ('ML-X15','ML-X16'):
            key='mlp_reg' if id=='ML-X15' else 'mlp_cls'
            fitted=f"selected[{key!r}].named_steps['model']"+('.regressor_' if id=='ML-X15' else '')
            e['checks'].append(check('Observed neural loss history',f"set(loss_curves)==set([{key!r}]) and len(loss_curves[{key!r}])>0 and np.allclose(loss_curves[{key!r}],{fitted}.loss_curve_)",'Report the fitted neural training-loss history for the named selected candidate; it is training evidence and does not replace held-out predictive metrics.'))
        if id=='ML-X17':
            e['task']+=' Plot bill length against bill depth in original units with labelled axes and distinct colours or markers for the aligned discovered groups.'
            e['checks'].append(check('Plotted discovered groups',"_scatter_matches(X.bill_length_mm,X.bill_depth_mm,labels,axis_quantities=('length','depth'))",'Draw the requested original-unit observations with their aligned exploratory group membership.'))
        if id=='ML-X18':
            e['task']+=' Draw the scaled sampled Ward hierarchy as a visible, labelled dendrogram truncated to the last 20 groups.'
            e['checks'].append(check('Visible sampled hierarchy',"_dendrogram_matches(linkage_matrix,20)",'Draw the declared truncated Ward hierarchy with visible merge lines and readable axes.'))
        if id=='ML-X19':
            e['task']+=' Plot the separate two-axis scores with PC1 and PC2 axis labels.'
            for c in e['checks']:
                if c['name']=='Target-free inputs':c['test']="X.equals(df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]) and X.shape[1]==30"
            e['checks'].append(check('Plotted PCA coordinates',"_scatter_matches(scores2[:,0],scores2[:,1],axis_quantities=('pc1','pc2'))",'Draw the actual two-axis PCA score view, with its component labels; this is separate from retained dimensions.'))
        e['version']=e.get('version',1)+1
        challenge['deliverables']=[dict(name=c['name'],contract='Interpretation' if c.get('selfReview') else 'Workflow condition',label=c['name'],requirement=c['message'],format='Self-review' if c.get('selfReview') else 'Run evidence',kind='self-review' if c.get('selfReview') else 'value') for c in e['checks']]
        from brief_groups import groups
        challenge['deliverableGroups']=groups(e,int(id.removeprefix('ML-X'))-1)
    return registry
