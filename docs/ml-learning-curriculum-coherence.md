# ML Learn/Refresh implementation coverage

The final registry retains 110 cards: 85 teaching cards, 14 reviews and 11 checkpoints. All 327 existing card activities remain, with 11 new guided applications bringing the total to 338. The 19 independent workflow challenges remain separate. All 38 existing card dataset variants are preserved.

## Shared teaching and assembly

`ml-learning/curriculum_coherence.py` runs after editorial, prerequisite/Python, mastery, transfer, guided-application and historical repair layers. It assigns authored concept origins, introduction/reuse/extension metadata, activity-specific current teaching, compact reminders and full references. Learn and Refresh consume this same assembled registry.

New references contain purpose, accepted inputs, useful choices and examples. The first complete regression and classification workflows expose eight numbered teaching sections with the actual code belonging to each section. Repeated pipeline, fold, baseline, out-of-fold and final-fit explanations become reminders in F12. The renderer can disclose the detailed guidance beside the corresponding section instead of presenting another full syntax listing.

Supplied-state metadata inspects setup separately from learner operations. It identifies a prefit object, its fitting rows and derived fitted steps. A compact read-only setup retains feature/target, split and recipe provenance. Receiver mutations inside assignments, fitted step aliases and named Pipeline preparation preserve actual fitted state; transformed arrays remain data rather than fitted estimators. Small-activity evidence contracts name only learner-created outputs; grader reads of supplied `model`, `X_train`, `probe` or `pca` no longer turn those objects into deliverables.

Fifteen automatically appended validation paragraphs are removed from task strings. Their exact constraints remain in structured `validationDesign` metadata. Eight-step labels are produced only for scripts actually containing all eight numbered comments. Dataset construction, full references and unchanged setup remain available.

## Complete model applications

Each of the 14 supervised model families now has a guided full-workflow milestone and an existing independent application. Every guided script follows the same question → reserve → inspect training → define recipe → baseline/validate → select/diagnose → final fit/evaluate → explain order. Feature and target names, final prediction variables, training-only diagnosis and row provenance remain consistent.

| Collection | Guided full application | Change |
| --- | --- | --- |
| Simple linear regression | ML-R01-4 | Added |
| Multiple linear regression | ML-R04-4 | Added |
| Polynomial regression | ML-R07-4 | Added; expansion and scaling remain inside folds before Ridge |
| Regression tree | ML-R09-4 | Existing bridge; strengthened depth check |
| Logistic regression | ML-C06-4 | Added |
| KNN | ML-C08-4 | Added; checked input scaling and requested k |
| SVM | ML-C10-4 | Existing bridge; checked fold-local scaling |
| One-R | ML-C12-4 | Added; explicit numeric feature roles and fold-local bin preparation |
| Classification tree | ML-C14-5 | Added while retaining its four existing activities |
| Naive Bayes | ML-C15-4 | Existing Gaussian bridge retained |
| LDA | ML-C17-4 | Added |
| QDA | ML-C18-5 | Added while retaining its four existing activities; checked positive covariance regularisation |
| Neural classification | ML-N03-4 | Existing bridge retained; checked input scaling |
| Neural regression | ML-N04-5 | Added while retaining its four existing activities; checked separate input and target scaling and neural regressor |

The tree and SVM applications use the same CLASS180 measured specimens and declared features. Comparison metadata displays only the changed preparation and estimator lines. The test split, folds, dummy, diagnosis and final evaluation remain familiar. Other guided comparisons also control the specimen data; transfer exercises and independent challenges retain their varied populations.

Unsupervised applications retain a separate five-step sequence: select measurements → prepare → fit representation/grouping → inspect → interpret limits. K-Means ML-U03-4 is added; the existing Ward ML-U07-4 and PCA ML-P02-4 bridges remain. No supervised target, invented labels or inappropriate final-test split is added.

## Named issue traceability

| Evaluation finding | Implemented change | Verification |
| --- | --- | --- |
| F11/F12 simultaneous APIs | Eight actual code sections, concrete questions and detailed concept teaching attached to their numbered steps; F12 reuses familiar APIs | Assembly contracts; every workflow solution executed |
| KNN starts with internals | C08-1 now constructs, fits and predicts. `named_steps`, preparation, neighbour positions and labelled counts are taught in C08-2 | Semantic classifier references/equivalents/negative cases; metadata regression |
| Logistic title promises a full script | C06 is titled “Tune logistic regularisation”; C06-4 supplies the full guided workflow | Title/task and 8-section contracts; runtime |
| Tree/SVM milestones differ | Retained SVM inspection, added complete tree Apply, exposed prefit provenance and shared comparison excerpts | Same dataset/feature contracts; both full scripts and model-specific checks |
| LDA advanced opening clutter | C17 introduction focuses on means and shared shape; C17-3 is a labelled deeper score/midpoint investigation with its syntax immediately available | Default syntax exclusion; correct and invalid score investigations executed |
| Neural regression lacks full bridge/units | N04-5 is a full electricity workflow in kWh. Existing Wine activities explicitly use quality-score points and explain target inversion separately from input scaling | Neural wrapper/input-scale/target-scale/units contracts; dummy-wrapper and missing-scale submissions rejected |
| PCA/clustering forced consistency | Separate discovery sequence preserves actual existing unsupervised APIs and populations | 147 discovery audit cases; full K-Means/Ward/PCA references executed |
| Provided objects called outputs | Explicit supplied/fitted provenance and output-only small contracts | Prefit SVM/LDA/network assertions; supplied-state contract regression |
| Repeated scaffolding | Removed generated validation task suffixes; current/reuse/full-reference levels; conditional numbered code sections | All-card metadata and final assembly tests |
| Learn/Refresh divergence | One registry, one code/data/source convention, mode-independent metadata | Shared-mode contract; rendered mode verification recorded separately |
| Model family alone passes incorrect preparation | Guided checks observe scaling, tree depth, k, QDA regularisation, One-R numeric roles, neural target wrapper and polynomial preparation | 17 bridge references plus 10 targeted methodological near misses |

## Verification

Scientific execution used Python 3.10.21 with the exact Pyodide parity packages: NumPy 1.26.4, pandas 2.2.0, scikit-learn 1.4.2, SciPy 1.12.0, Matplotlib 3.5.2 and Seaborn 0.13.2. The environment is `/tmp/curriculum-validation-venv` for this workspace session.

- All 245 runnable Python activities passed; these include every Python card activity and all 19 challenges. The other 112 decision/reflection activities passed structural/content checks. Final full execution took 51.539 seconds.
- All 17 guided applications passed; 10 targeted methodological near misses were rejected. This focused execution took 3.759 seconds.
- Core audit: 112 reference solutions, 112 equivalent implementations, 112 numeric/identity near misses, 29 semantic negatives and a flexible independent-checkpoint alternative passed.
- Classification/neural audit: 121 cases, including 66 reference solutions, passed.
- Discovery audit: 147 cases, including 48 reference solutions, passed.
- Mastery/selection-boundary alternatives passed. All 39 supplied-state and equivalent-output contract regressions passed. Manifest, collections, content, receipts and the new curriculum-coherence metadata tests passed.
- All 107 supplied estimator states across 75 unique setups agree with native `check_is_fitted`, including aliases and indirectly fitted Pipeline steps.
- Real local Chromium/Pyodide executed all 245 solutions, rejected/accepted 19 semantic negative/equivalent cases, extended package imports and cleaned repeated-run references.
- All 23 model collections passed at 1440/390/320 pixels with context/history, neural fifth Apply, no-JavaScript disclosure/navigation, and no Python or learner storage while reading.
- The final Chromium UI gate passed all 110 card and 19 challenge routes, six widths in both themes, four/five-stage touch bounds, collapsed reference/output access, natural desktop flow, forced colours/reduced motion/zoom, real Run/Check and a leaking-input rejection, receipt reuse, reset/stop/reload, keyboard escape and no learning persistence.
- Remaining native CI gates passed: 19 exact challenge-input contracts; 6 difficult vertical references with leakage rejection and 12-run cleanup; 8 accepted semantic alternatives and 30 rejected wrong workflows; and five reporting-evidence tests including exact built/authored M03 equality.
- The generated registry audit and 357 activity/help fingerprints were refreshed after final source review.

Evidence is summarised in `docs/curriculum-evidence/ml-verification.json`. This report covers source, final registry assembly, scientific execution and the browser execution/collection gates listed above. Additional rendered Learn/Refresh checks, the complete responsive inventory, screenshots and visual review are recorded by the coordinated curriculum verification. Chromium was exercised locally; WebKit remains a CI matrix target with unchanged default engine launch.

The current host’s default scikit-learn 1.8 raised an existing string-label/early-stopping neural fitting error. Exact parity execution passes those unchanged activities. Matplotlib 3.5.2 also required Python 3.10 wheels rather than a host-Python 3.12 source build. Neither dependency issue required a curriculum workaround or a production package change.
