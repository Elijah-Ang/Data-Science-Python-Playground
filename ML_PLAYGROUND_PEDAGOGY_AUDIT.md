# ML Playground full-scale pedagogy and learner-experience audit

Audit date: 25 August 2026  
Scope: current local main, 254 generated routes, rendered ML Playground, learner-visible Python, outputs, charts, Inspector, Workflow reference, custom cells, errors, invalidation, and reset  
Constraint observed: architecture frozen; no fixes implemented

## Executive verdict

The ML Playground is an unusually strong technical scaffold for honest beginner machine learning, but it is only a moderately effective teacher in its current form.

**Overall pedagogy score: 5.5/10.**

**Answer to the central question:** partly yes. After several workflows, a beginner is likely to remember the broad sequence—choose features and a target, split, prepare, validate, tune, diagnose, test—and is less likely to leak the final test set than a beginner using an unstructured notebook. They are not yet reliably closer to rebuilding or reasoning through that sequence independently. The site usually supplies correct code and evidence, but too often leaves the learner to infer what the evidence means, why a particular sklearn object exists, what decision follows, or what to change next.

**Strongest aspect:** the workflow architecture makes honest evaluation concrete. Training-only exploration, preprocessing inside pipelines, training-only CV/tuning, chronological Seoul handling, a sealed final test, and separate unsupervised routes are excellent foundations.

**Weakest aspect:** the evidence-to-meaning bridge. Tables and charts appear, but interpretation, metric meaning, model behaviour, and decision prompts are frequently absent or detached from the output.

**Biggest barrier to learner independence:** scaffolding never fades. Full code is always supplied, the prominent Run complete walkthrough button can execute the entire route, questions live mainly in a separate Workflow reference, and there are no graduated modification, recall, or partial-code tasks.

Two P0 correctness defects were found:

1. The output serializer drops meaningful DataFrame row indexes, making several learner-visible tables unlabeled or impossible to interpret.
2. Tuned One-R can merge ordinal-encoded categories and then display the merged bucket as a single original category, producing a false learner-visible rule.

No architecture or product code was changed.

## Audit method

The audit used both required surfaces:

- Source and generator: ml-app.js, ml.html, tests/generate_ml_routes.mjs, tests/test_ml_routes.py, tests/test_ml_state.mjs, and tests/test_ml_browser.py.
- Rendered product: the local app at http://127.0.0.1:8000/ml.html using its real Pyodide 0.26.4 runtime.

The generated route inventory was evaluated at 5 and 10 folds. A generator diff confirmed that the only learner-visible code difference between fold settings is n_splits in the baseline CV cell; tuning reuses the same cv object. Therefore, duplicate 10-fold journeys were not manually repeated.

The browser audit ran all eleven requested journeys end to end, then ran the remaining model families individually. It also inspected the Workflow reference, reset, custom cell, free-exploration cell, stale-state feedback after editing an earlier cell, successful warnings, and a learner-created Python error.

## Coverage

### Route-space totals

| Fold setting | Compatible routes | Supervised | Unsupervised |
|---|---:|---:|---:|
| 5 folds | 127 | 106 | 21 |
| 10 folds | 127 | 106 | 21 |
| Total generated | 254 | 212 | 42 |

### Datasets and scenarios

| Dataset family | Scenarios inspected |
|---|---|
| Breast Cancer Wisconsin | 5 less-redundant continuous measures; all 30 continuous measures |
| Palmer Penguins | continuous; continuous + binary; continuous + categorical geography; continuous + binary + categorical context |
| Car Evaluation | six categorical predictors |
| Wine Quality | one continuous; multiple continuous; continuous + binary |
| Seoul Bike | one continuous; multiple continuous; continuous + binary; continuous + categorical; all types; chronological modelling frame |
| Gapminder | one continuous; two continuous; derived 2007 modelling frame |
| Candy | one continuous; multiple continuous; all binary; continuous + binary; derived majority-win classification target |

The product exposes Candy as separate regression and derived-classification configurations, but both belong to the same underlying dataset family.

### Model-family coverage

| Model | 5-fold routes | Dataset families covered in generator | Review surface |
|---|---:|---|---|
| Simple Linear Regression | 4 | Candy, Gapminder, Seoul, Wine | Full browser journey |
| Multiple Linear Regression | 10 | Candy, Gapminder, Seoul, Wine | Full browser journey |
| Polynomial Regression | 8 | Candy, Gapminder, Seoul, Wine | Browser model review |
| Regression Tree | 14 | Candy, Gapminder, Seoul, Wine | Browser model review |
| Logistic Regression | 9 | Breast Cancer, Candy classification, Car, Penguins | Full browser journeys |
| Support Vector Machine | 9 | Breast Cancer, Candy classification, Car, Penguins | Browser model review |
| One-R | 9 | Breast Cancer, Candy classification, Car, Penguins | Browser model review |
| Classification Tree | 9 | Breast Cancer, Candy classification, Car, Penguins | Full browser journey |
| KNN | 9 | Breast Cancer, Candy classification, Car, Penguins | Full browser journey |
| QDA | 2 | Breast Cancer, Penguins | Browser model review |
| LDA | 3 | Breast Cancer, Penguins | Browser model review |
| Naive Bayes | 5 | Breast Cancer, Candy classification, Car, Penguins | Full browser journey |
| Neural Network classification | 7 | Breast Cancer, Car, Penguins | Full browser journey |
| Neural Network regression | 8 | Seoul, Wine | Browser model review |
| K-Means | 7 | Breast Cancer, Candy, Gapminder, Penguins, Seoul, Wine | Full browser journey |
| Hierarchical Clustering | 7 | Breast Cancer, Candy, Gapminder, Penguins, Seoul, Wine | Full browser journey |
| PCA | 7 | Breast Cancer, Candy, Gapminder, Penguins, Seoul, Wine | Full browser journey |

### Generated cell-pattern inventory

The counts below are distinct 5-fold code patterns. The 10-fold version only changes the baseline splitter count.

| Cell ID | Distinct code patterns | Notes |
|---|---:|---|
| frame | 30 | supervised/unsupervised, raw/derived modelling frames, feature lists |
| split | 3 | random regression, stratified classification, chronological |
| explore | 30 | task and feature-type-specific EDA |
| prepare | 57 | largest generator surface; 33 routes use ColumnTransformer |
| model | 16 | one per supervised estimator specification, with NB variants |
| baseline | 3 | classification, regression, time-series regression |
| tune | 14 | tuned grids plus keep-defaults pattern |
| diagnose | 19 | metric diagnostics plus model-specific interpretation |
| final | 2 | classification and regression |
| compare | 2 | K-Means candidate k; hierarchical candidate cuts |
| dendrogram | 1 | Ward-linkage sample |
| fit | 2 | K-Means and hierarchical |
| profile | 3 | cluster/group profiles |
| visualise | 2 | K-Means and hierarchical PCA maps |
| variance | 1 | PCA scree and cumulative variance |
| select | 1 | PCA 90% selection |
| loadings | 1 | PCA PC1/PC2 loadings |
| project | 6 | PCA label/color variants by dataset target |

The longest learner-visible generated cells are model diagnostics: up to 33 lines and about 1,600 characters. The mixed preprocessing cell reaches 16 lines before the learner encounters the model itself.

### Browser journeys

| Journey | Route | First likely confusion | Second likely confusion | Hardest cell | Weakest explanation | Best teaching moment | Could learner explain it afterward? |
|---|---|---|---|---|---|---|---|
| A | Gapminder, one feature, Simple Linear Regression | Why X and y are conventional names | Why passthrough and a pipeline exist for a straight line | Diagnostics, 24 lines | A coefficient of 0.00061 is shown without a meaningful unit translation | Explicit training/final-test partition table | Partly; sequence yes, coefficient and evidence no |
| B | Breast Cancer, five continuous, Logistic Regression | Why regression is classifying | What weight_M means after scaling | Diagnostics | Log-odds and weight direction are never translated | Stratified split and stable fold table | Partly |
| C | Penguins, all feature types, Logistic Regression | ColumnTransformer appears abruptly | Perfect CV from geography/year may be a shortcut | Prepare cell | No warning that island can nearly reveal species | Training-only preprocessing comment | Unlikely |
| D | Car, categorical, Naive Bayes | Why categories become yes/no columns | How probability table values should be read | Diagnostics | Conditional-independence assumption is not explained | Bernoulli/category mapping is concise | Unlikely |
| E | Breast Cancer, KNN | What distance means across several measurements | Why macro F1 differs from accuracy | Diagnostics | Diagnostic repeats k and weights instead of showing a neighbour vote | Scaling rationale is excellent | Partly |
| F | Breast Cancer, Classification Tree | Meaning of min_samples_leaf and criterion | Why final macro F1 0.876 is below CV about 0.936 | Diagnostics, 30 lines | No CV-versus-final comparison | If/then model framing and tree view | Partly |
| G | Penguins, Neural Network classification | Hidden layers/backpropagation | Early stopping and loss | Diagnostics | Loss curve has no interpretation or validation context | Scaling rationale | Unlikely |
| H | Seoul, continuous, Multiple Linear Regression | Why time changes both holdout and CV | Why fold RMSE rises sharply over later windows | Diagnostics | No time-oriented EDA or fold-window explanation | Earlier/later split table and forward-window comment | Partly |
| I | Penguins, K-Means | Difference between inertia and silhouette | Why k=2 is suggested but not correct | Compare k, 21 lines | Run-all silently accepts argmax silhouette | Cluster profile in original units | Partly |
| J | Penguins, Hierarchical | How to read a dendrogram | What the random sample changes | Dendrogram/compare | Merge IDs and truncated tree are unexplained | Original-unit group profile | Unlikely |
| K | Breast Cancer, 30 features, PCA | What a component is | How loadings connect to inputs | Variance cell, 22 lines | The loadings output loses feature names entirely | Labels are added only after PCA fitting; 90% called a rule of thumb | No |

Additional browser reviews covered Polynomial Regression, Regression Tree, SVM, One-R, QDA, LDA, and Neural Network regression.

## P0 findings

### P0-1 — Meaningful DataFrame row labels are silently discarded

**Problem:** the worker serializes DataFrames using their columns and to_numpy values but not their index. See ml-app.js:348–350.

**Why it matters:** several route cells deliberately put the semantic identifier in the index. Once rendered, the learner receives numbers without knowing what each row describes. This is not merely untidy; it makes the evidence incorrect or unusable.

**Where it occurs:**

- Regression EDA: X_train.describe().T loses feature names.
- Mixed regression EDA: describe(include="all").T loses feature names.
- Unsupervised EDA: describe(include="all").T loses feature names.
- PCA EDA: describe().T loses feature names.
- PCA loadings: original feature names are the index and disappear.
- Any custom learner result that relies on a meaningful pandas index.

**Current learner experience:** the Gapminder regression EDA showed one row of eight statistics with no gdpPercap label. Seoul showed seven unlabeled statistic rows. PCA showed PC1, PC2, and loading magnitudes but no input names, making “Which original inputs contribute most?” unanswerable.

**Recommended teaching approach:** preserve or explicitly materialize meaningful indexes before rendering. The learner should always be able to identify every row. This is a correctness gate before other pedagogy work.

**Example output contract:** if an index is named, render it as the first column. If it is unnamed but non-default, label it feature or index in a context-appropriate way. A route-specific minimal fallback is summary.reset_index(names="feature") and loading_view.reset_index(names="feature").

**Scope of impact:** global output layer plus every generated/custom table.

**Risk of increasing complexity:** low if fixed in rendering; medium if patched route by route. Preserve learner-visible code simplicity by preferring a renderer fix.

**Priority:** P0, Phase A.

### P0-2 — Tuned One-R can teach a false categorical rule

**Problem:** One-R ordinal-encodes categories, then treats a feature as continuous when its number of unique codes exceeds bins. Tuning can select bins=3 for a four-category feature, merging adjacent alphabetical codes. The rule-table formatter then maps the merged bucket number back to one original category label. See ml-app.js:136–150 and 209–216.

**Why it matters:** the displayed rule claims one category when the bucket actually covers multiple categories. The model also imposes an arbitrary order on nominal categories while merging them. This is both model-behaviour and interpretation correctness, not polish.

**Where it occurs:** confirmed in Car Evaluation + One-R. Grid search selected bins=3. The displayed best rule used buying and showed only high, low, and med; the med row contained 687 training rows and also absorbed the missing vhigh category.

**Current learner experience:** a beginner is shown an apparently intuitive three-row rule table that is factually false about category membership.

**Recommended teaching approach:** categorical One-R must keep one rule per original category. Binning should apply only to genuinely continuous features. The rendered rule must show an interval or an explicit set of categories that exactly matches the fitted bucket.

**Example improved result:** buying in {med, vhigh} → unacc, 687 rows, if grouping were ever deliberately supported; preferably keep med and vhigh as separate categorical rules.

**Scope of impact:** One-R categorical and mixed routes, especially Car.

**Risk of increasing complexity:** low in learner-visible output; medium in the hidden helper.

**Priority:** P0, Phase A.

## P1 findings

### P1-1 — The learner questions are detached from the primary run experience

**Problem:** route cards show titles and captions, and notebook cells show code, but the actual learner question is mainly visible in the separate Workflow reference. The normal click-and-run flow does not place the question beside the code and output.

**Why it matters:** the site says each step answers one beginner question, yet the learner can complete the full route without seeing those questions. Evidence becomes execution rather than inquiry.

**Where it occurs:** all routes. The Workflow reference builds questions at ml-app.js:1744; the route cards and notebook do not.

**Current learner experience:** click Step 03, code runs, a table/chart appears, but “What does the training data look like?” is not attached to the result. Run complete walkthrough bypasses every question.

**Recommended teaching approach:** place one concise question and one output-reading cue beside each active cell/result. The Workflow reference can remain as the manual overview.

**Scope of impact:** global.

**Risk of increasing complexity:** low if limited to one question and one cue.

**Priority:** P1.

### P1-2 — CV and metrics are presented as decimals rather than decisions

**Problem:** fold tables are technically sound but do not teach metric direction, typical value, fold spread, train-validation gap, or what conclusion follows.

**Why it matters:** cross-validation becomes cargo-cult Python. A learner can run cross_validate without understanding what a fold is or whether 0.93/0.90 is stable.

**Where it occurs:** all 106 supervised route families. It is especially visible in Seoul, where validation RMSE changes from about 155 to 678 across forward windows, and in One-R, where accuracy about 0.70 coexists with macro F1 about 0.21.

**Current learner experience:** a table of fold, train metric, validation metric, and secondary metric appears. No mean/range or plain-language reading is provided.

**Recommended teaching approach:** retain the fold table, then add a compact summary and prompt: direction, typical validation result, variability, and train-validation gap. Explain macro F1, accuracy, RMSE, MAE, and R² at first use.

**Scope of impact:** global supervised baseline, tuning, and final steps.

**Risk of increasing complexity:** low if expressed in two sentences or a small summary table.

**Priority:** P1.

### P1-3 — Several model diagnostics do not answer “what did it learn and where does it struggle?”

**Problem:** Step 8 promises behaviour and errors, but many model-specific additions expose implementation attributes rather than insight.

**Where it occurs:**

- KNN: only n_neighbors and weights.
- SVM: only support-vector counts per class.
- QDA: class means, not class-specific covariance shape or curved boundaries.
- LDA: a boundary coefficient row without class meaning.
- Neural networks: training loss, layers, iterations, final_loss; no learned behaviour.
- Polynomial regression: scaled polynomial coefficients, no fitted curve.
- Logistic regression: weight matrices without direction/magnitude guidance.
- Naive Bayes: probability tables without a reading example or independence caveat.

**Current learner experience:** the generic confusion matrix/residual plot may reveal errors, but the model-specific output often cannot explain the chosen algorithm.

**Recommended teaching approach:** one model-specific question, one interpretable output, and one limitation. Hide introspection machinery when it does not teach the model idea.

**Scope of impact:** global diagnostic template plus model-specific branches.

**Risk of increasing complexity:** medium; model-specific judgment is required.

**Priority:** P1.

### P1-4 — Final-test evidence is not connected back to CV

**Problem:** Step 9 reports final metrics and a chart but does not ask whether final performance is consistent with training-only validation.

**Why it matters:** the learner may celebrate a single final score or misread ordinary sampling variation as improvement. The final step does not complete the reasoning loop.

**Where it occurs:** all supervised routes.

**Observed examples:**

- Classification tree: best CV macro F1 about 0.936; final macro F1 0.876.
- Seoul multiple regression: forward-fold validation RMSE spans about 155–678; final RMSE 566.
- Neural network classification: best CV macro F1 0.713; final macro F1 0.871.

**Recommended teaching approach:** show the CV summary beside the one-time final result and ask whether the test result is within the range the folds suggested. State that one test score is an estimate, not proof.

**Scope of impact:** global final step.

**Risk of increasing complexity:** low.

**Priority:** P1.

### P1-5 — Mixed preprocessing is a cognitive cliff

**Problem:** 33 compatible routes generate ColumnTransformer cells. A beginner meets named feature lists, StandardScaler, OneHotEncoder, ColumnTransformer, passthrough branches, handle_unknown, sparse_output, and verbose_feature_names_out in one step.

**Why it matters:** the code is technically appropriate but exceeds the concept budget of a first-time learner. The subsequent estimator representation repeats the whole transformer, making it look even larger.

**Where it occurs:** Penguins mixed scenarios, Seoul mixed scenarios, and mixed/binary model combinations.

**Current learner experience:** the Penguins all-types logistic Prepare cell is 16 lines and 816 characters. The output is a verbose ColumnTransformer representation, followed by a verbose Pipeline representation.

**Recommended teaching approach:** keep the architecture and exact necessary code, but stage the explanation: “four numeric columns are scaled; three category columns become indicator columns; both are learned inside each training fold.” Defer sklearn options that are not the lesson.

**Scope of impact:** 33 routes.

**Risk of increasing complexity:** low if explanation replaces rather than adds clutter.

**Priority:** P1.

### P1-6 — The workflow supplies code before teaching prerequisites

**Problem:** X/y, feature, target, class, split, stratify, random_state, pipeline, fold, score direction, hyperparameter, residual, covariance, margin, backpropagation, silhouette, explained variance, and loading frequently appear before a plain-language introduction.

**Why it matters:** the learner can run the cells but cannot form a mental model of the objects.

**Where it occurs:** global, with the largest jumps at Steps 1, 2, 4, 6, 7, and model-specific Step 5.

**Recommended teaching approach:** introduce each term at first use in one sentence, reuse preferred vocabulary consistently, and delay aliases/internal sklearn terms.

**Scope of impact:** global.

**Risk of increasing complexity:** low if definitions are moment-of-need and concise.

**Priority:** P1.

### P1-7 — The experience encourages passive completion rather than active learning

**Problem:** the prominent Run complete walkthrough button executes the full route. Route cards immediately insert and run complete cells. The Workflow reference provides exact code for transcription. There are no prediction prompts, safe experiments, missing lines, or recall checkpoints.

**Why it matters:** completion can become “watch nine green checks” instead of run → read → understand → modify → predict → write.

**Where it occurs:** all routes and the Workflow reference.

**Recommended teaching approach:** keep run-all as a convenience but make guided mode ask for a prediction or observation before continuing. Add optional, staged practice after successful runs. Do not block expert use.

**Scope of impact:** global progression.

**Risk of increasing complexity:** medium; sequencing and state design need care.

**Priority:** P1.

### P1-8 — Unsupervised “target hidden” messaging conflicts with the Inspector

**Problem:** K-Means, Hierarchical, and PCA cards say target stays hidden and the seal says TARGET NOT USED, but the Inspector’s clean preview includes the dataset target/reference column, such as species or diagnosis.

**Why it matters:** seeing labels can bias how a learner judges clusters and contradicts the intended distinction between fitting without a target and interpreting later with a reference.

**Where it occurs:** all unsupervised routes whose dataset preview includes the target.

**Recommended teaching approach:** distinguish “not used for fitting” from “not visible.” Prefer hiding the reference column until the interpretation step, or explicitly label it as withheld from fitting and explain why it appears later.

**Scope of impact:** 21 unsupervised route families at each fold setting.

**Risk of increasing complexity:** low.

**Priority:** P1.

### P1-9 — Chart questions, labels, and accessibility are insufficient

**Problem:** supervised EDA charts use the literal y label target rather than the selected target name and units. Charts are selected from the first one or two feature names rather than a stated teaching purpose. Image alt text is generic: “Chart N generated by cell.”

**Why it matters:** a chart can be technically valid yet fail to tell the learner what to notice. Essential evidence is inaccessible to a learner who cannot inspect the image.

**Where it occurs:** most chart-generating cells; generic image alt at ml-app.js:1547–1549.

**Recommended teaching approach:** use actual target names/units, a one-sentence reading cue, and meaningful text summaries. Explain why each selected chart is present.

**Scope of impact:** global chart layer and route-specific chart generators.

**Risk of increasing complexity:** medium for dynamic alt summaries; low for labels and cues.

**Priority:** P1.

### P1-10 — Time-based teaching stops at the split

**Problem:** Seoul correctly sorts chronologically, saves the latest 20%, and uses TimeSeriesSplit, but EDA still shows ordinary feature-target plots and summaries. It does not show demand over time, drift, seasonality, or fold windows.

**Why it matters:** the learner is told time order matters but is not shown the evidence or validation geometry that makes it matter.

**Where it occurs:** all Seoul supervised scenarios.

**Recommended teaching approach:** keep the existing split/CV architecture; add a time-axis training-only plot or fold-window sketch and ask whether later windows look harder than earlier ones.

**Scope of impact:** Seoul routes.

**Risk of increasing complexity:** low to medium.

**Priority:** P1.

### P1-11 — Dataset shortcuts and target semantics need explicit treatment

**Problem:** some scenarios can produce impressive results for reasons a beginner may misunderstand.

**Examples:**

- Penguins all-types logistic achieved perfect CV and 0.985 final accuracy; island is a strong geography shortcut for species, but the route does not discuss generalization to new islands.
- Wine quality is an ordered discrete score treated as regression, but the consequence is not explained at model time.
- Car target labels unacc, acc, good, and vgood are not decoded.
- Breast Cancer outputs B and M without a nearby legend.

**Recommended teaching approach:** add a concise dataset-specific caveat or interpretation prompt, not a general warning wall.

**Scope of impact:** dataset-specific.

**Risk of increasing complexity:** low.

**Priority:** P1.

### P1-12 — PCA and hierarchical routes jump too quickly into advanced abstractions

**Problem:** the 30-feature PCA route displays an unreadable 30×30 correlation heatmap, a five-by-30 standardized array, 30 rows of variance values, and loadings before components are grounded. The hierarchical route presents a truncated unlabeled dendrogram and numeric merge IDs without teaching how to read branches and merge height.

**Why it matters:** the two most concept-heavy workflows have the weakest scaffolding.

**Recommended teaching approach:** stage the concept with a small interpretation cue, suppress raw arrays, and focus on one or two concrete observations before the full high-dimensional result.

**Scope of impact:** PCA and hierarchical.

**Risk of increasing complexity:** medium.

**Priority:** P1.

## P2 findings

1. **Irrelevant successful-cell warnings:** classification diagnostics and final cells repeatedly surface a Python 3.14 itertools deprecation warning. It is not learner-actionable and makes successful results look suspect.
2. **80/20 appears universal:** the split code uses 20% everywhere without saying it is a teaching choice, not a rule.
3. **random_state=42, shuffle=True, and stratify=y are unexplained:** these are central reproducibility/sampling ideas, not decoration.
4. **“stratified / random 20%” is ambiguous:** classification is both random and stratified; regression is random but not stratified. The slash does not teach the distinction.
5. **Estimator representations create noise:** Prepare and Build cells return raw sklearn object reprs, often wider and more complex than the learner-visible code.
6. **Internal implementation details are overexposed:** verbose_feature_names_out, sparse_output, handle_unknown, clone, hasattr, named_steps, get_feature_names_out, np.atleast_2d, solver, tol, and nested parameter prefixes often arrive before they are useful.
7. **Metric names lack plain-language direction:** macro F1, accuracy, RMSE, MAE, R², inertia, silhouette, and explained variance need “higher/lower is better” plus one limitation.
8. **Tuning lacks an explicit hyperparameter definition:** best_params_ and best_score_ appear without distinguishing learned parameters from settings chosen around fitting.
9. **“No meaningful hyperparameters to tune” needs context:** it is a good simplification for ordinary linear regression, but should say the walkthrough is keeping the estimator defaults rather than imply the model has no choices at all.
10. **Final-test wording overstates “genuinely unseen”:** say “not used for fitting, tuning, or model choice.” The Inspector previews the unsplit dataset, and unseen should be defined relative to the modelling process.
11. **Inspector previews too much:** Breast Cancer shows all 31 columns for a five-feature scenario; Seoul exposes the internal _date column; wide previews compete with selected-feature orientation.
12. **Free exploration is not beginner-free:** the starter introduces globals().get, select_dtypes, dtype selection, a list conversion, conditionals, dynamic column choice, and plotting at once.
13. **Custom cell is technically blank but pedagogically blank:** it provides aliases but no suggested next action, safe change, or route-state relationship.
14. **Error output includes internal traceback noise:** “Python needs a repair” is good, but File "<exec>", line 25 is not meaningful to the learner.
15. **Run-all hides choice points:** K-Means and hierarchical automatically use maximum silhouette, despite copy saying another solution may be more useful.
16. **PCA language equates variance with information:** “How quickly does information concentrate?” is too strong. Variance is not automatically task-relevant information.
17. **Model selection is a dropdown, not a developing intuition:** family labels group options, but the UI does not help a beginner choose one for a reason.
18. **Questions are too generic:** “What does my data look like?” and “Can better settings improve it?” do not specify what evidence to read or what decision follows.

## P3 findings

1. Prefer “final test set” consistently; introduce “holdout” once as an alias rather than alternating among saved test, final test, sealed test, holdout, and untouched data.
2. Prefer “feature” as the main term; introduce predictor/input and X once.
3. Prefer “target” as the main term; introduce outcome/label and y once.
4. Use “hyperparameter setting” before shortening to setting. Avoid parameter where hyperparameter is meant.
5. Use “class” for target values and “category” for input values.
6. Replace generic axes actual, predicted, and target with dataset-specific labels and units.
7. Replace snake_case chart labels such as explained_variance with reader-facing text.
8. Correct singular/plural metadata such as “1 cols.”
9. State when a displayed table is truncated to 50 rows or 20 columns; the current metadata reports the original size while silently showing fewer columns.
10. Make status labels distinguish a Python warning from a pedagogical caveat.
11. Use clearer route captions: “random, stratified 20% test split” or “chronological latest-20% test split.”
12. Decode dataset abbreviations near first use: M/B and unacc/acc/vgood.

## Model-by-model review

### Simple Linear Regression

**What works:** the straight-line concept is concise, preprocessing remains passthrough, original units are preserved, and Gapminder supplies an intuitive curved-versus-straight question.

**Blockers:** X/y and pipeline conventions arrive before explanation. The coefficient is shown without intercept, meaningful unit scaling, or a plotted fitted line. A coefficient per one GDP-dollar is numerically tiny and not beginner-friendly.

**Recommended teaching move:** explain the line as starting value plus change per meaningful unit, show the fitted line over the training scatter, and use association language.

### Multiple Linear Regression

**What works:** it preserves original feature units and exposes one coefficient per encoded predictor.

**Blockers:** “adjusted effect” is not explained. Coefficients in different units are ranked by magnitude even when magnitudes are not comparable. Holding-other-features-constant interpretation and non-causal language are absent.

**Recommended teaching move:** show change per meaningful unit, explain “compare two otherwise similar rows in the model,” and do not rank raw coefficients across incomparable units without a caveat.

### Polynomial Regression

**What works:** degree and Ridge strength use a small, comprehensible grid. Scaling happens after polynomial expansion inside the model pipeline.

**Blockers:** the learner sees nested pipelines and scaled polynomial coefficients. In Gapminder, terms gdpPercap, gdpPercap², and gdpPercap³ are shown as ranked coefficients, but the coefficients are not intuitive after scaling and regularization. No fitted curve is shown.

**Recommended teaching move:** make the curve the primary interpretation. Explain that polynomial terms let one input bend; keep coefficient introspection secondary or hidden.

### Regression Tree

**What works:** if/then framing, no-scaling explanation, a small depth/leaf grid, tree visualization, and feature-importance table form a coherent model story.

**Blockers:** the tree chart uses six-point text in a narrow output panel. Importance is not defined and can be mistaken for causation. Final-vs-CV gaps are not discussed.

**Recommended teaching move:** show the first two or three readable rules and explain importance as “used to reduce prediction error in this fitted tree,” not causal influence.

### Logistic Regression

**What works:** scaling and regularization are handled correctly; the route includes a useful confusion matrix.

**Blockers:** “log-odds with a regularised linear boundary” assumes too much and never explains why a regression-named model classifies. Weight_M and multiclass weight columns appear without interpretation. Scaled coefficients are not changes in original measurement units.

**Recommended teaching move:** first say it estimates class probability with a straight boundary; introduce log-odds later. Interpret only direction and relative model weight, with an association caveat.

### Support Vector Machine

**What works:** scaling rationale and small C/gamma grid are appropriate.

**Blockers:** maximum margin, kernel, RBF, C, gamma, and support vectors are all introduced with almost no scaffold. The diagnostic is only a support-vector count per class, which does not help a beginner understand the boundary or errors.

**Recommended teaching move:** explain a wide separating gap and flexible curved boundary in plain language. Use a two-feature teaching sketch where possible or focus on closest/misclassified validation rows.

### One-R

**What works:** “one feature whose simple rules make the fewest errors” is the clearest model concept in the site, and a correct rule table could be exceptionally educational.

**Blockers:** the categorical correctness defect is P0. The Car journey also creates an excellent but missed metric lesson: accuracy near 0.70 alongside macro F1 near 0.21 because the rule predicts the majority class.

**Recommended teaching move:** fix category handling, then explicitly compare the rule with a majority-class baseline and use the metric disagreement to teach imbalance.

### Classification Tree

**What works:** same strong if/then framing and readable tuning dimensions as regression trees.

**Blockers:** chart density, importance interpretation, and no explicit reading of the confusion matrix. The final drop below CV is not discussed.

**Recommended teaching move:** ask the learner to trace one row through two or three rules and identify which class confusion is most common.

### K-Nearest Neighbours

**What works:** “vote using nearby training examples” and the reason for scaling are exemplary concise comments.

**Blockers:** the model-specific diagnostic merely repeats selected k and weights. The learner never sees a new row, its neighbours, their classes, and the resulting vote.

**Recommended teaching move:** show one validation row’s nearest neighbours after preprocessing and narrate the vote. This is the model’s core idea and a high-value teaching moment.

### QDA

**What works:** regularization is kept small and the route is restricted to manageable continuous scenarios.

**Blockers:** covariance and curved boundary appear before prerequisite knowledge. The diagnostic shows class means, which does not explain class-specific covariance shapes.

**Recommended teaching move:** describe each class as having its own center and spread/shape. If a two-feature view is possible, show the different curved regions; otherwise show center and spread summaries.

### LDA

**What works:** the shared-shape versus QDA distinction is conceptually useful.

**Blockers:** “share one covariance shape” is not grounded. The diagnostic returns boundary_1 with large raw coefficients and no class direction.

**Recommended teaching move:** explain one shared notion of spread and a straight boundary. Label which class side a positive score favors; avoid raw coefficients when units dominate.

### Naive Bayes

**What works:** the generator selects Gaussian or Bernoulli variants appropriate to pure continuous, pure binary, or pure categorical input. “Categories become yes/no features” is useful.

**Blockers:** “independent probabilities” does not clearly state that independence is an assumption made within each class. Probability tables are not explained with an example. The learner cannot tell whether 0.654 means P(feature|class), P(class|feature), or predicted probability.

**Recommended teaching move:** say “the model combines per-feature evidence as if features were independent within a class.” Label tables P(feature=1 | class) or class-specific mean, and walk through one value.

### Neural Network classification

**What works:** scaling, early stopping, and a small architecture grid are sensible operational choices.

**Blockers:** weighted layers, backpropagation, early stopping, loss, alpha, tuple-shaped layers, and iteration counts arrive together. Training loss alone does not show generalization or what was learned.

**Recommended teaching move:** use a compact input → hidden pattern detectors → class output explanation. Treat the loss curve as optimization evidence, not interpretation, and pair it with error patterns.

### Neural Network regression

**What works:** target scaling is technically contained in TransformedTargetRegressor and evaluation returns to original target units.

**Blockers:** the nested wrapper is the most complex Step 5 cell, reaching 22 lines. The learner sees two StandardScalers, nested regressor parameter prefixes, and loss in an unexplained transformed space.

**Recommended teaching move:** keep target scaling in hidden infrastructure or add a single note: inputs and target are scaled for training; predictions are automatically converted back to original units. Do not make TransformedTargetRegressor the lesson.

## Unsupervised review

### K-Means

**What works:**

- No target is used for fitting.
- Scaling is explained as necessary for distances.
- Candidate k values are kept small.
- Inertia and silhouette are explicitly called exploratory, not test scores.
- Profiles return clusters to original feature units.
- The PCA map says the model used all dimensions.

**Problems:**

- Inspector still shows the target/reference column.
- Inertia, silhouette, center, and k lack first-use definitions.
- Run-all automatically accepts the highest silhouette as selected_k.
- The prompt asks which group count is useful, but the workflow does not require a learner choice.
- PCA axes do not show explained-variance percentages.

**Priority:** P1 for target visibility and automatic-choice pedagogy; P2 for chart annotations.

### Hierarchical Clustering

**What works:**

- Sampling is reproducible and the code states the quadratic-memory reason.
- Ward linkage and candidate cuts are kept to a small teaching range.
- Original-unit group profiles are useful.

**Problems:**

- The Prepare output does not report sample size; it only says the workspace was updated.
- A truncated, unlabeled dendrogram appears before branch/height/cut concepts are taught.
- Numeric left_group/right_group IDs are meaningless to a beginner.
- Silhouette argmax becomes the selected cut, weakening the purpose of reading the dendrogram.
- The sample’s effect on stability and interpretation is not discussed.

**Priority:** P1.

### PCA

**What works:**

- Scaling is explicit.
- The target stays out of fitting code.
- The 90% threshold is correctly called a rule of thumb, not a universal requirement.
- Labels are added only after fitting for interpretation.
- Scree and cumulative variance are shown together.

**Problems:**

- Target/reference is visible in Inspector before fitting.
- A 30×30 heatmap and 30-row describe table overload the Breast Cancer route.
- The scaled Z[:5] array is meaningless to most beginners.
- Loadings lose their feature labels because of the P0 renderer defect.
- “Information” is used as a synonym for variance.
- PC axes do not state variance explained.
- The learner is not told that components are weighted combinations, not retained original features.

**Priority:** P0 for loading labels; P1 for concept staging.

## Step-by-step supervised review

| Step | Current strengths | Main learner blockers | Recommended teaching focus |
|---|---|---|---|
| 1. Choose/frame | Feature list is explicit; derived modelling frames are visible | X/y unexplained; real-world question often only in Inspector; copy/indexing conventions arrive first | One sentence defining row, feature, target, X, and y; state the actual prediction question |
| 2. Split | Partition table is excellent; stratified and time paths are correct | Why split before EDA, why 20%, stratify, random_state, and “unseen” are unexplained | Protect decisions from test influence; 80/20 is a teaching choice; class balance/time order |
| 3. Explore training | Correctly training-only; charts respond to feature type | P0 row-label loss; arbitrary first features; target axis generic; dense describe tables; Seoul lacks time | Each chart answers one modelling question and names the real target |
| 4. Prepare | Best why-comments in the site; preprocessing remains inside CV pipeline | ColumnTransformer cliff; passthrough/binary/encoding distinction weak; raw object reprs | Explain exactly what this dataset-model pair needs, not generic preprocessing |
| 5. Build model | One estimator per route; model-specific concepts exist | Many captions use log-odds, covariance, margin, backpropagation before teaching them; nested wrappers | One plain-language model mechanism and one concrete prediction story |
| 6. Baseline CV | Training only; appropriate splitter families; train metrics included | Fold mechanics, score direction, mean/spread, train-validation gap, shuffle, and time windows unexplained | What repeats, what stays inside training, what stable/generalizing looks like |
| 7. Tune/defaults | Small grids; GridSearchCV inside training; final test protected | Hyperparameter concept and model__ naming absent; best_score_ meaning absent; automatic choice dominates | “Try these pre-fit settings using the same validation evidence; choose before final test” |
| 8. Diagnose | Confusion matrices and residual plots are strong structural choices | Reading cues absent; many model-specific diagnostics expose attributes rather than behaviour | What it learned, common errors, failure pattern, one model-specific limitation |
| 9. Final test | Seal is clear; refit on all training data; appropriate final metrics/charts | No comparison to CV; no uncertainty/context; generic axes; “genuinely unseen” overstatement | Compare expected validation range with one-time test; state valid and invalid conclusions |

## Chart audit

| Chart type | Purpose | Current assessment | What learner should notice | Needed change |
|---|---|---|---|---|
| Classification histograms + KDE | Compare feature distributions by class | Useful for one or two continuous features, but KDE is unexplained and class abbreviations may be opaque | Separation and overlap, not proof of predictability | Name classes; explain overlap; consider omitting KDE early |
| Classification countplots | Compare category frequencies by class | Technically valid; can become crowded | Whether categories have different class mixes | Normalize or narrate count imbalance where relevant |
| Regression scatterplots | See feature-target association | Good basic choice; y-axis says target, not lifeExp/quality/etc. | Direction, curvature, spread, outliers | Use real target label/units and a question-specific title |
| Regression boxplots | Compare target across category values | Useful, but no cue for median/spread | Group differences and overlap | Explain median/box briefly; use actual target label |
| Unsupervised histograms/bar charts | Inspect input shape without fitting labels | Arbitrarily picks first two features | Scale/skew/category imbalance | Explain why these two inputs were chosen |
| Confusion matrices | Locate classification errors | Strong; counts are clear | Which actual class is confused with which prediction | Add one reading example; mention class imbalance; optionally row percentages |
| Residual scatter | Detect bias/nonlinearity/unequal spread | Strong chart choice; no interpretation cue | Random cloud around zero versus patterns | Add two pattern examples; real target units |
| Residual histogram/KDE | See error distribution | Useful but KDE unexplained | Center near zero, skew, large tails | Add zero reference or concise reading cue |
| Tree plot | Show learned rules | Educationally valuable but six-point text is too small in output panel | First few split rules and leaf predictions | Show a readable top subtree or rule list |
| Neural-network loss line | Show optimization | Not model interpretation; training-only curve lacks validation context | Whether optimization settled | Label as training process, explain lower, avoid implying generalization |
| Actual-vs-predicted scatter | Final regression fit quality | Good diagonal reference; axes generic | Distance from diagonal and systematic pattern | Use target units and compare with CV expectation |
| Inertia line | Candidate cluster compactness | Jargon-heavy; lower direction not stated in title | Diminishing improvement as k rises | Plain-language axis/title and elbow cue |
| Silhouette line/table | Candidate cluster separation | Higher-is-better title helps in K-Means; not sufficient to choose “correct” k | Relative separation, tradeoff with usefulness | State no universally correct k; annotate selected candidate as suggestion |
| Cluster silhouette summary | Per-cluster separation | Table, not plot; weakest values useful | Small/negative silhouettes and imbalanced cluster sizes | Explain weakest and mean; consider a compact bar view |
| PCA cluster map | Two-dimensional teaching projection | Caveat that model used all dimensions is excellent | Visible overlap/separation only in projection | Add PC variance percentages and projection limitation |
| Dendrogram | Merge hierarchy and cut height | Too advanced as rendered: truncated, unlabeled, unexplained | Large vertical jumps and possible cuts | Teach branch, merge height, and horizontal cut before asking |
| Correlation heatmap | Motivate redundancy before PCA | Fine for few features; unreadable for 30 | Blocks of related inputs | Limit/cluster annotations or focus on strongest pairs |
| Scree + cumulative variance | Show component contribution/retention | Strong pairing; snake_case axes and “information” wording weaken it | Early components carry more variance; 90% is optional | Plain labels, integer ticks, variance not information |
| PCA projection with reference | Interpret structure after fitting | Good label-after-fit pattern | Separation/gradient without claiming supervised performance | Explain components are not original features; add variance percentages |

Across all charts, the generic image alt text is inadequate. Important visual evidence needs a text equivalent or a compact automatically generated summary.

## Terminology audit

### Preferred vocabulary

| Concept | Preferred term | Introduce aliases when |
|---|---|---|
| Input column | feature | First use: “also called a predictor/input”; then use feature |
| Output to predict | target | First use: “stored in y”; use label only for classification examples |
| Input table | X | After saying “the selected feature columns” |
| Training portion | training data | Use train only in variable names |
| Repeated checking inside training | cross-validation | Introduce CV after the full phrase |
| Untouched evaluation portion | final test set | Introduce holdout once in parentheses |
| Algorithm fitted to data | model | Introduce estimator only when sklearn API detail is necessary |
| Pre-fit model choice | hyperparameter | Use setting as a plain-language alias |
| Target value in classification | class | Reserve category for input values |
| Model output | prediction | Use fitted value only in later regression material |

### Current inconsistencies

- features, predictors, inputs, X
- target, label, outcome, y
- training + CV, training rows, fit rows
- validation, test_* keys from sklearn, cross-validation
- final test, saved final test, sealed test, holdout, untouched data
- model, estimator, fitted, pipeline
- parameter_grid, best_params, settings, hyperparameters
- class, category, label

Multiple terms are useful only when the equivalence is taught deliberately. The current experience often introduces the alias through code before the primary term is grounded.

## Concept prerequisite map

### Recommended core progression

~~~text
Real-world question
  ↓
Row and column meaning
  ↓
Feature and target
  ↓
X and y as Python variable conventions
  ↓
Training data and final test set
  ├─ random split → reproducibility → stratification
  └─ chronological split → future must stay later
  ↓
Training-only exploration
  ↓
Feature type
  ├─ numeric already usable
  ├─ scaling
  ├─ binary passthrough
  └─ categorical encoding
  ↓
Pipeline: preparation + model learned together
  ↓
Fit and predict
  ↓
Cross-validation
  ├─ fold
  ├─ train versus validation
  ├─ metric direction
  └─ stability / train-validation gap
  ↓
Hyperparameter and GridSearchCV
  ↓
Model-specific diagnostics
  ↓
One-time final evaluation
  ↓
Compare final result with CV expectation and state limitations
~~~

### Model-specific branches

~~~text
Distance
  ├─ KNN: neighbours and vote
  ├─ K-Means: centers, k, inertia, silhouette
  └─ Hierarchical: pair/group merges, dendrogram, cut

Linear relationship
  ├─ Simple regression: line, slope, residual
  ├─ Multiple regression: conditional association
  ├─ Logistic: probability and linear decision boundary
  └─ LDA: shared spread and linear boundary

Curved/nonlinear relationship
  ├─ Polynomial: added powers bend the fit
  ├─ Trees: if/then splits
  ├─ SVM: margin and kernel
  ├─ QDA: class-specific spread and curved boundary
  └─ Neural network: layers, weights, loss

Probability
  └─ Naive Bayes: P(feature | class), prior, conditional-independence assumption

Dimensionality
  └─ PCA: correlation → weighted components → explained variance → loadings
~~~

### Concepts currently appearing before prerequisites

| Concept | First visible use | Missing prerequisite |
|---|---|---|
| X and y | Step 1 | feature/target and why letters are used |
| copy and DataFrame indexing | Step 1 | mutable table/select-column mental model |
| stratify and random_state | Step 2 | class balance and reproducibility |
| KDE and describe statistics | Step 3 | chart/statistic reading |
| passthrough | Step 4 | what preparation is and why none may be needed |
| StandardScaler | Step 4 | distance/optimization sensitivity and transformed units |
| OneHotEncoder | Step 4 | why text/category values need numeric indicators |
| ColumnTransformer | Step 4 | different columns need different preparation |
| Pipeline | Step 5 | fit-time learning and leakage prevention |
| log-odds, covariance, margin, backpropagation | Step 5 | probability, spread, boundary, weights/loss |
| fold, shuffle, macro F1, negative RMSE scoring | Step 6 | validation and metric direction |
| hyperparameter and model__ prefix | Step 7 | learned parameter versus pre-fit setting |
| clone, cross_val_predict, residual | Step 8 | out-of-fold predictions and prediction error |
| inertia, silhouette | K-Means Step 4 | center/distance and within/between group quality |
| linkage, Ward, cut | Hierarchical Step 4 | pair/group merging and dendrogram geometry |
| explained variance, cumulative variance, loading | PCA Steps 4–6 | component as weighted combination |

## Challenge and practice audit

There is no ML-specific challenge progression in the current ML Playground.

The Data Playground has a separate challenge system, but the ML page’s Workflow panel is a reference containing the exact finished code. The ML page offers:

- route cards that immediately run complete cells;
- a Run complete walkthrough button;
- a blank custom cell containing only alias information;
- a free-exploration cell that is already advanced and generic;
- editable cells with stale-state recovery.

These are useful notebook affordances, not a practice curriculum.

The current system does not progress through:

1. reading one output;
2. changing one safe value;
3. predicting what will happen;
4. completing one missing line;
5. choosing a modelling decision;
6. rebuilding a section;
7. solving a small new problem.

Hints are absent because ML challenges are absent. The Workflow reference reveals the complete answer immediately.

## Independence and transfer audit

### Current verdict

A learner may remember the nine nouns in the workflow, but not the reasoning that connects them. The site provides procedural fluency—clicking steps and recognizing sklearn shapes—more reliably than generative fluency—deciding what to do in a blank notebook.

Transfer is prevented by:

- full code always visible;
- no deliberate code fading;
- no safe-change suggestions;
- no requirement to interpret before continuing;
- no prediction-before-run prompts;
- no recall checkpoints;
- no route summary in the learner’s own words;
- no clean export that separates essential workflow code from diagnostic scaffolding;
- no mini-project using a new question or dataset.

### Beginner-independence roadmap

| Stage | Experience | Minimum intervention |
|---|---|---|
| 1. Fully guided | Run one cell at a time; question and reading cue attached | Move questions beside cells/outputs |
| 2. Guided experiment | Change one clearly marked value and predict the effect | One safe experiment per route, such as k, degree, depth, or feature set |
| 3. Complete missing code | Fill one variable, metric, or split argument | Optional incomplete-cell mode |
| 4. Make a decision | Choose feature scenario/model/hyperparameter from evidence | Require a short selection before auto-fitting |
| 5. Rebuild from memory | Recreate split, pipeline, or CV from a compact prompt | Recall cells with hints that reveal one idea at a time |
| 6. Independent mini-project | New question, minimal scaffold, final self-check | Small route summary + blank project template |

This progression fits the current product because it can be layered on top of the existing frozen route architecture. The highest-value first intervention is not a large challenge engine; it is one attached question, one reading cue, and one safe experiment per step family.

## Cognitive-load audit

| Step | Typical simultaneous new concepts | Risk |
|---|---:|---|
| Frame | 3–5: list, feature names, DataFrame selection, copy, X/y | Medium |
| Split | 5–7: function import, four outputs, ratio, random state, stratification/time order | High |
| Explore | 4–7: copied view, target attachment, describe, subplots, seaborn geometry, chart reading | High |
| Prepare simple | 2–3: need/no need, scaler/passthrough, fit inside pipeline | Manageable |
| Prepare mixed | 6–9: feature lists, scaler, encoder, ColumnTransformer, options, branches, passthrough | Very high |
| Build | 3–8 depending on model; pipeline plus estimator-specific parameters/wrappers | Medium to very high |
| CV | 7–10: splitter, folds, shuffle, scoring dict, cross_validate, train/test keys, signs, table | Very high |
| Tune | 6–9: grid, namespaced parameters, CV reuse, scoring, fit, best estimator/score/params | Very high |
| Diagnose | 5–12: cloning, out-of-fold prediction, metric chart, model introspection | Very high |
| Final | 5–8: refit, predict, chart, several metrics, one-time interpretation | High |

The generator succeeds at hiding internal reusable abstractions, but it still exposes many sklearn implementation details that are not required for the selected lesson.

## What should not be taught yet

Keep these hidden, delayed, or optional unless they are directly relevant:

- verbose_feature_names_out=False
- sparse_output=False
- handle_unknown="ignore"
- clone
- hasattr-based wrapper inspection
- named_steps/get_feature_names_out plumbing
- np.atleast_2d coefficient normalization
- solver="lsqr"
- max_iter and tol unless convergence is the lesson
- TransformedTargetRegressor internals
- raw estimator reprs
- raw standardized arrays
- support-vector counts without a boundary story
- raw MLP final_loss values
- itertools/Python-version deprecation warnings
- sample_size optimization details before the sampling concept
- model__ and model__regressor__ parameter paths before pipeline naming is taught

The site does not need less correctness; it needs less irrelevant surface area.

## Inspector audit

### What works

- Dataset name, row count, selected-feature count, type mix, source, and a real-world question orient the learner.
- The saved-test seal is prominent.
- Selected feature types are visible.
- The Inspector is a suitable place for context rather than analytical Python.

### Problems

- The clean preview shows every dataset column, not the selected modelling view.
- Wide datasets overwhelm the rail; Breast Cancer shows 31 columns for a five-feature route.
- Seoul shows the internal derived _date column.
- Unsupervised previews reveal the reference target while cards say target stays hidden.
- Dataset questions are uneven: Penguins and Car ask preprocessing questions rather than state the actual prediction problem.
- Target values and units are not decoded.

### Recommended division of responsibility

**Inspector:** real-world question, row meaning, selected feature types, target meaning, target withheld/not used status, sample/missingness, short dataset caveats.

**Python:** construction of X/y, split, preparation, fitting, validation, diagnostics, and final evidence.

## Dataset and question audit

| Dataset | Current framing | Assessment | Recommended emphasis |
|---|---|---|---|
| Breast Cancer | Can continuous measurements separate diagnoses? | Clear and appropriately restrained; M/B needs decoding and no clinical claims | Association/classification exercise, not diagnosis advice or causation |
| Penguins | How does preprocessing change as feature types combine? | Method-centric; hides the actual species question; island shortcut underexplained | Predict species from measurements/context; ask whether geography would generalize |
| Car | What changes when every predictor is categorical? | Method-centric; target categories are cryptic | Predict acceptability from six categorical attributes; decode target levels |
| Candy classification | Can ingredients classify majority-win candy? | Clear derived target; small sample needs caution | Explain the fixed 50% threshold and class balance |
| Wine | Can chemistry estimate quality, and does it curve? | Understandable; ordered discrete target treated as regression needs explanation | Predictions may be between score levels; association, not chemistry causing quality |
| Seoul | Predict later demand without future leakage? | Strongest dataset question | Connect every later chart/CV explanation back to time |
| Gapminder | Is wealth–longevity straight or curved? | Strong question; avoid causal implication | Association across 2007 countries; note omitted context |
| Candy regression | How do percentile measures and ingredients relate to popularity? | Clear associative language | Explain percentiles and the small 85-row sample |

## Supervised model-selection guidance

The current family groupings are helpful, but the learner sees a dropdown rather than a choice framework. A compact, progressive intuition should emerge:

| Model | Beginner intuition |
|---|---|
| Simple linear | One numeric feature, straight trend |
| Multiple linear | Several features, additive straight effects |
| Polynomial | One or several continuous features may bend |
| Tree | Rule-like nonlinear splits |
| Logistic | Straight classification boundary with probabilities |
| KNN | Similar rows tend to share a class |
| SVM | A boundary with a wide gap; kernel can bend it |
| One-R | A deliberately simple one-feature rule baseline |
| LDA/QDA | Class centers and spread define straight/curved boundaries |
| Naive Bayes | Combine per-feature class evidence under a strong assumption |
| Neural network | Flexible nonlinear pattern learner with weaker transparency |

Do not turn this into a giant permanent comparison table. Show a one-sentence “why choose this?” cue at selection time and reinforce it in Step 5.

## Warning, error, reset, and state audit

### Warning handling

Warnings are clearly attached to successful cells and labeled as successful, which is good. The current captured deprecation warning is irrelevant to the learner and repeats in diagnostic/final classification cells. Filter known runtime noise or reframe only actionable warnings.

### Error handling

“Python needs a repair” is approachable. Cell and output statuses clearly switch to error. The traceback includes internal worker frames before the useful ZeroDivisionError line. Prefer the cell frame and final exception first, with full traceback optional.

### Reset

Reset is strong:

- clears cells and outputs;
- reseals the final test;
- retains raw data;
- returns only Step 1 to enabled;
- reports that modelling state was reset.

This should remain unchanged.

### Editing and invalidation

Editing an earlier completed cell marks it and downstream completed cells stale, removes invalid outputs, blocks later route cards, and shows “Workflow changed — rerun from this step.” This is excellent state teaching and should remain unchanged.

The missing pedagogical piece is an explanation that changed earlier objects may invalidate later results—not a state-management change.

## What should remain unchanged

Preserve these patterns:

1. The nine-step supervised architecture and route order.
2. Training-only exploration after the final test split.
3. Preprocessing inside the pipeline and therefore inside each CV fold.
4. Stratified classification splitting.
5. Chronological Seoul holdout and forward-only TimeSeriesSplit.
6. One saved final test and the visible one-use seal.
7. Separate unsupervised routes without a supervised test score.
8. Model compatibility restrictions.
9. Small beginner-scale tuning grids.
10. Simple passthrough routes that do not introduce ColumnTransformer unnecessarily.
11. Original-unit cluster profiles.
12. PCA label-after-fitting pattern.
13. The statement that 90% variance is a rule of thumb, not a law.
14. KNN’s concise distance/scaling explanation.
15. Tree no-scaling explanation.
16. “Each CV training fold learns preprocessing from its own rows.”
17. Editable cells, downstream invalidation, custom-cell independence, and reset recovery.
18. Clear training/final-test partition tables.
19. Confusion matrices and residual plots as the core diagnostic families.
20. Plain, intelligent, non-childish tone.

## Pedagogical consistency framework

Every future route step should pass this checklist:

1. **Question:** What learner question is this step answering?
2. **Action:** What are we doing?
3. **Reason:** Why is it necessary for this dataset/model?
4. **Code:** Can a beginner identify the input, operation, and output?
5. **Evidence:** What should the learner look for in the output?
6. **Decision:** What decision or conclusion does that evidence support?
7. **Limits:** What can the learner not conclude?
8. **Experiment:** What one value or choice is safe and useful to change?
9. **Vocabulary:** Are all new terms defined before use?
10. **Load:** Are more than three new ideas introduced at once? If so, stage or hide.
11. **Labels:** Do every table row, chart axis, legend, and class value have meaning?
12. **Accessibility:** Is essential visual evidence available in text?
13. **Transfer:** Does this step help the learner reproduce the idea later?
14. **Accuracy:** Is simplified wording still technically true and non-causal?

For generated cells specifically:

- no meaningful row index may be dropped;
- no table may rely on an unlabeled index;
- no chart may use generic target/actual/predicted labels when a real target name exists;
- no output may expose an implementation attribute without a reading cue;
- a question must be visible beside the evidence it refers to;
- the final step must compare test evidence with the CV expectation.

## Recommended implementation roadmap

### Phase A — Correctness and major comprehension blockers

1. Preserve meaningful DataFrame indexes in rendered tables.
2. Correct categorical One-R fitting and rule labeling.
3. Remove the target-visible/target-hidden contradiction in unsupervised Inspector previews.
4. Place route questions beside active cells and outputs.
5. Add first-use metric direction and final-vs-CV comparison.

### Phase B — Explanations and interpretations

1. Add moment-of-need definitions for X/y, split, stratify, random state, pipeline, fold, hyperparameter, residual, and model-specific terms.
2. Replace attribute dumps with model-specific explanations.
3. Add dataset-specific shortcut/target caveats.
4. Stage mixed preprocessing with a plain-language transformation map.
5. Remove or defer irrelevant sklearn options from beginner-facing code.

### Phase C — Graphs and questions

1. Use real target names and units.
2. Add reading cues and accessible text summaries.
3. Improve tree, PCA, dendrogram, and time-series readability.
4. Replace generic questions with evidence-and-decision questions.
5. Add a time-based EDA/fold view for Seoul.

### Phase D — Active learning and independence

1. Add one safe experiment per model/step family.
2. Add prediction-before-run prompts.
3. Add optional incomplete cells and recall mode.
4. Require learner choice at genuine decision points such as k/degree/depth.
5. Add a compact clean-workflow export and independent mini-project.

### Phase E — Polish

1. Standardize terminology and aliases.
2. Decode class abbreviations.
3. Filter irrelevant warnings and simplify tracebacks.
4. Fix singular/plural and truncation labels.
5. Refine Inspector preview scope and internal-column visibility.

## Top 10 highest-value changes

Ranked by educational impact divided by estimated implementation complexity:

| Rank | Change | Impact | Complexity | Why the ratio is high |
|---:|---|---|---|---|
| 1 | Preserve DataFrame indexes in table output | Very high | Low–medium | Fixes incorrect/unlabeled evidence globally |
| 2 | Attach the learner question and reading cue to each cell/output | Very high | Low | Converts execution into inquiry without changing architecture |
| 3 | Compare final test with CV summary | Very high | Low | Completes the evaluation mental model |
| 4 | Add first-use metric meanings and directions | Very high | Low | Makes every score table interpretable |
| 5 | Correct One-R categorical rules | High | Medium | Removes a genuine false lesson |
| 6 | Replace weak model diagnostics with one model-specific teaching output | Very high | Medium | Directly answers what the model learned |
| 7 | Stage mixed preprocessing in plain language | High | Low | Addresses 33 intimidating routes |
| 8 | Add one safe experiment/prediction prompt per route family | Very high | Medium | Starts the bridge to independence |
| 9 | Hide reference targets until unsupervised interpretation | High | Low | Makes the supervised/unsupervised distinction honest |
| 10 | Improve chart labels and accessible summaries | High | Medium | Makes visual evidence readable and inclusive |

## Concrete before/after examples

### 1. Framing X and y

**Before**

~~~python
feature_names = ["gdpPercap"]
X = model_df[feature_names].copy()
y = model_df["lifeExp"].copy()
~~~

**After teaching approach**

~~~python
# Each row is one country in 2007.
# X contains the feature used to make a prediction.
# y contains the target we want to predict.
feature_names = ["gdpPercap"]
X = model_df[feature_names].copy()
y = model_df["lifeExp"].copy()
~~~

Attached question: “Can GDP per person help predict a country’s life expectancy in 2007?”

### 2. Split rationale

**Before**

~~~python
# Split the data and save 20% for the final test
~~~

**After teaching approach**

~~~python
# Save a final test set before exploring or choosing the model.
# That keeps later decisions from being influenced by the final evidence.
# Here 20% is a teaching choice, not a universal rule.
~~~

For classification, add: “stratify keeps the class proportions similar in both parts.”  
For Seoul, add: “random splitting would let future rows leak into training, so the latest rows stay together.”

### 3. Cross-validation output

**Before**

Five fold rows only.

**After teaching approach**

Keep the fold table, then add:

~~~text
Typical validation macro F1: 0.93
Fold range: 0.90 to 0.95
Typical train–validation gap: 0.02

Read it: higher macro F1 is better. The folds are fairly similar, so
the model’s result is not depending on one unusually easy split.
~~~

Question: “Are the validation scores close enough that you would trust the average?”

### 4. Final-test connection

**Before**

“How well does it perform on genuinely unseen data?”

**After**

“The model was chosen using training/CV data only. Is the one-time test result similar to the validation range, and what does any gap suggest?”

Example compact table:

| Evidence | Macro F1 |
|---|---:|
| Mean CV | 0.936 |
| CV range | 0.904–0.952 |
| Final test | 0.916 |

### 5. Mixed preprocessing

**Before**

The learner meets ColumnTransformer and all sklearn options immediately.

**After teaching approach**

~~~text
This route has two preparation jobs:
1. Scale the four measurements because logistic regression is regularized.
2. Turn sex, island, and year categories into yes/no columns.

ColumnTransformer keeps those jobs separate and learns both from each
CV training fold only.
~~~

Keep only the necessary Python visible; move option details to an optional explainer.

### 6. KNN diagnostic

**Before**

~~~text
n_neighbors  weights
9            uniform
~~~

**After teaching approach**

Show one out-of-fold row:

~~~text
Nearest 9 training labels: B, B, B, B, B, B, M, B, M
Vote: B (7 of 9)
Actual label: B
~~~

Question: “Would the prediction change if k were 3? Why might a larger k be steadier but blur local patterns?”

### 7. Polynomial interpretation

**Before**

Ranked coefficients for gdpPercap, gdpPercap², and gdpPercap³ after scaling.

**After teaching approach**

Show the training points and fitted degree-3 curve. Ask: “Where does the curve bend, and does it seem to follow broad structure or individual countries?” Keep term coefficients optional.

### 8. Naive Bayes probability label

**Before**

~~~text
class  buying_high  buying_low ...
acc    0.293        0.222
~~~

**After**

~~~text
Estimated P(buying = high | class = acc): 0.293
~~~

Add: “Naive Bayes combines these pieces of class-specific evidence as if the features were independent within each class. That is a simplifying assumption, not a fact about the cars.”

### 9. PCA loadings

**Before**

~~~text
PC1    PC2    largest_absolute_loading
0.064  0.367  0.367
~~~

**After**

~~~text
feature                 PC1    PC2    strongest_of_PC1_PC2
fractal_dimension_mean  0.064  0.367  0.367
~~~

Question: “Which original measurements most shape PC1 and PC2? A large absolute loading means a stronger contribution; the sign gives direction.”

### 10. From guided to independent

After a completed route:

~~~text
Try it:
1. Predict: will using 10 folds make the mean score much better, or mainly
   give a more detailed stability check?
2. Change only n_splits from 5 to 10.
3. Run and explain what changed—and what did not.
~~~

Later, replace the splitter line with:

~~~python
cv = ______________________________
~~~

Offer a hint about classification needing stratified folds, not the completed answer.

## Final answer to the audit question

After several workflows, a beginner is meaningfully closer to remembering the shape of an honest ML workflow and respecting the final test set. They are only partly closer to building and reasoning about one independently.

What prevents transfer is not the frozen architecture. It is that the current experience:

- shows code before prerequisite concepts;
- separates questions from the evidence;
- reports metrics without teaching decisions;
- exposes sklearn machinery instead of model meaning;
- rarely asks the learner to predict, change, choose, or recall;
- never reduces scaffolding;
- contains two correctness defects in learner-visible outputs.

The best next phase is therefore not a redesign. It is a focused pedagogical layer over the existing architecture: correct table/rule output, attach concise questions and reading cues, improve model-specific diagnostics, compare CV with final test, and introduce small active-learning steps that gradually make the playground less necessary.
