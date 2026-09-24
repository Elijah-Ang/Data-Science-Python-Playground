# Practice audit and revised progression

## Before editing: evidence of gaps

The existing 104 cards, 292 practices and 19 independent briefs already cover all 17 Playground models. This is topic coverage, not evidence of transfer. F02–F05 practise supplied X/y, fitting, predictions and error separately; F07/F09 practise prescribed splits; F10 identifies leakage. F-K1 combines a small split/fit/error task but omits a baseline and training-only selection. W01–W14 teach the missing tools separately. W-K1 then asks for a long complete workflow in a blank editor. Most targets, features, split designs and metrics are prescribed. Reviews change populations but largely retain schemas. There are no two unfamiliar-data readiness assessments, and the existing checks cannot verify the quality of written reasoning.

Sound material to retain: the Data Foundations shell and Python treatment; existing IDs and datasets; split/alignment/provenance checks; review and checkpoint inventory; all 19 independent CSV briefs; model-specific preparation and workflow steps generated from the actual Playground manual walkthrough. Existing model diagrams and family lessons teach useful mechanisms and pitfalls. New work should bridge learner practice rather than replace them.

## Revised core progression

| Stage | Practice and evidence |
| --- | --- |
| Data Foundations | Select aligned tables/series, inspect types and missingness, transform and plot data; no completion tracking. |
| F01–F10 + reviews | Frame a quantity/class question, X/y, fit/predict/error, split and feature availability. |
| F11 | Complete regression three times: runnable delivery example, fill essential steps, then assemble an energy scenario from eight numbered steps. Predict before running and explain results using a self-review rubric. |
| F12 | Complete classification three times: runnable measurements example, change the error priority, then assemble a rare-event scenario from the same eight numbered steps. Compare a dummy on training folds before final evaluation. |
| F-K1, W01–W14 + reviews | Retrieve the simple workflow, then learn mixed-type preparation, imputation, fold-local pipelines, CV, search, diagnosis and temporal validation. |
| W15–W16 | Diagnose and repair post-outcome inputs, preprocessing outside CV, test-driven selection, majority accuracy and overfitting. |
| W-K1, W-K2, W-K3 | Retain the existing mixed-data checkpoint; independently frame regression and classification readiness tasks on two new data dictionaries. Check observable workflow evidence; self-review the reasoning separately. |
| Regression / classification | Extend the same boundary to linear/multiple/polynomial/tree regression and logistic, SVM, One-R, tree, KNN, NB, LDA and QDA classification. Guided complete workflows now bridge the regression tree, SVC and Gaussian NB model lessons to independent briefs. |
| Networks | Extend classification and regression to MLPs, including convergence and overfitting. MLP classification has a guided complete workflow before its independent brief. |
| Clustering / PCA | Explicitly switch from prediction to grouping or representation; retain original-unit interpretation and separate external labels. Sampled Ward clustering and PCA have distinct, guided end-to-end discovery practices. |
| Comparison + Workflow Challenges | Compare defensible candidates and communicate limits; 19 preserved independent applications cover all 17 Playground models. |

All prerequisite links are advisory. No saved progress, locks or automatic mastery claims. Exact seed/feature contracts remain in legacy exercises where the brief deliberately specifies them; new readiness tasks accept supported alternatives. Automated success establishes runnable, internally consistent evidence, not independent scientific understanding.

## Implemented practice changes

- F11 and F12 each have a runnable worked workflow, a partially completed workflow and a different-scenario guided outline. Follow runs; Change asks learners to supply seven consequential steps; Transfer leaves more than ten holes across the same eight numbered stages. The first uses one numeric predictor, a linear model, a dummy and three training folds. The classification version introduces fold-local scaling and class-balanced metrics. Both explicitly explain the new `Pipeline`, `cross_validate`, `cross_val_predict`, `clone` and scoring syntax before presenting the full worked script. An independent blank-editor test arrives later in W-K2/W-K3.
- W15 addresses post-outcome features, preprocessing fitted outside folds and final-test model selection. W16 addresses misleading majority accuracy, training/validation gaps and transferring diagnosis to another decision context. Each asks for the fault, consequence and repair.
- W-K2 (REPAIR96) and W-K3 (SENSOR150) introduce previously unused deterministic datasets and prediction-time dictionaries. Learners choose supported legitimate feature subsets, seeds, 15–30% holdouts, 3–5 matching folds, suitable metrics and simple model families. The editor is blank; rubric and evidence-variable meanings remain visible. The reference is optional, not the starter.
- Fifteen formerly two-practice lessons now have a third, context-changing Transfer practice. Twenty-seven existing Python transfers additionally require a concrete decision or interpretation about units, availability, sampling, class errors or scope. Existing exercise IDs, reference code and checks are retained.
- Model lessons expose the question, mechanism, main failure mode, interpretation/debugging prompt and links to their complete applications. Six model cards now add a fourth Apply practice: regression tree, SVC, Gaussian NB, MLP classification, sampled Ward hierarchy and PCA. The first four reuse the supervised boundary checks; the last two use discovery-specific evidence and interpretation. All 17 models and all 19 independent challenges remain available.
- All 185 inherited generic Python failure messages were replaced with task- and check-specific next steps. Observable code decisions remain separate from self-reviewed interpretation.
- Follow/Change/Transfer/Apply remain non-interactive beside the title. Change, Transfer, reviews and checkpoints lead with the practice brief and place the visible concept reference after inputs, matching Data Foundations. Hints, deeper sources and solutions remain optional; essential teaching stays visible. Shared syntax colouring and layout remain in use. An editor-side question, data dictionary and workflow route keep context close to the code; on small screens the editor jump lands on the first code line and wraps long Python lines. New coded diagrams convey the workflow and its data boundary.
- Regression and Classification are shown as parallel routes after the shared supervised workflow. Discovery pages and challenges now describe grouping and representation without prediction targets, dummy baselines or reserved final tests.

## What the checks establish

The new runtime inspects original feature values and row alignment; disjoint, exhaustive holdout partitions; fitting provenance; fold-local preparation; actual cross_validate results for dummy and candidates; matched training folds and scoring; actual out-of-fold diagnostic predictions; the selected recipe and training fit; one final prediction call; and the final metric computed from saved predictions. It now detects a standalone preprocessing fit even when it occurs after dummy validation but before candidate validation. Feedback includes observed columns, scoring rules, dummy runs, final prediction-call counts or reported scores where relevant.

Written problem framing, trade-off justification, diagnostic interpretation and conclusions are explicitly self-review. No automatic score is awarded for prose. Matching code evidence must not be read as proof of scientific understanding. Reviews, readiness tasks and challenges have no mandatory locks, saved drafts or completion tracking.

## Remaining limits and later learner pilot

These are small synthetic learning populations, not deployment validation. Readiness checks support documented pandas/scikit-learn patterns; they are not a security sandbox or a general grader for arbitrary Python. They accept meaningful alternatives within that contract, not every scientifically possible estimator, split or custom transformation. Canonical model challenges deliberately retain the Playground’s declared preparation and validation contracts. Within-activity receipts flag exposed final evidence; they do not track learner actions across navigation or reload. A learner can view a reference solution, so passing code cannot prove independent assembly.

Pilot with six beginners who have completed Data Foundations. Use one facilitated 90-minute session on F11/F12 and selected debugging tasks, followed 48–72 hours later by counterbalanced, unfamiliar regression/classification assessments with references initially withheld by the facilitator. Observe thinking aloud, feature-availability decisions, help requests and how learners react to errors. Do not add in-product tracking.

Score each readiness rubric criterion 0 (missing/unsafe), 1 (plausible but unsupported) or 2 (correct and evidence-based). For each learner, require no target leakage, no test-row fitting or test-driven selection, no criterion scored 0, and at least 8/10 on both unfamiliar tasks without step-by-step rescue. They must explain one limitation and one validation diagnostic in plain language. As a small usability gate, seek at least five of six learners meeting this criterion; investigate every critical mistake rather than averaging it away. This is a revision signal, not a statistical claim of course effectiveness. Repeat with revised lessons and another cohort before making a mastery claim.

## Two-lens review · 24 September 2026

**Software engineering.** The authoring registry, package list and manual Playground recipes remain internally consistent. The six new bridge IDs are manifest-listed; a model-family check prevents a different classifier from passing the SVC bridge. Ward and PCA bridge checks reject incorrect fitted evidence. Every generated Python answer executes without retained Python objects. Browser routing, keyboard interaction, viewport geometry, actual Run/Check and no-persistence behavior pass in both supported engines. The generated help, registry and visual review records are kept in sync with the source.

**Data science teaching.** Learners now see the purpose and syntax of each unfamiliar API before a long worked example. The same eight-stage workflow moves from runnable Follow to consequential Change to an outlined new-scenario Transfer, then to later blank-editor readiness tasks. Baseline and training-only validation claims are explicit; negative scikit-learn error scores are translated into positive target-unit errors. Regression and Classification are parallel choices. Discovery practices use samples, scaling, group or component evidence and original-unit interpretation without pretending there is a prediction target or final test. All 17 models retain independent applications, and six selected models have an intermediate complete-workflow practice. Written decisions remain self-review.

## Verification record · 24 September 2026

| Gate | Current result |
| --- | --- |
| Curriculum, receipts and authored review records | 110 cards, 327 card practices, 19 independent challenges; 346 activities in total. There are 85 teaching lessons and 17 production models. Prerequisite graph is acyclic and Regression/Classification routes are independent. Help fingerprints cover all 346 tasks. |
| Native ML Python | All 232 reference solutions pass, with no retained Python objects after execution. |
| Pyodide 0.26.4 in Chromium and WebKit | All 232 reference solutions pass in each engine. Leakage, changed validation evidence, repeated final-test exposure and invalid PCA axes are rejected; documented alternatives pass. |
| Semantic tests | New workflow references and six model bridges pass. Invalid model substitution, scaled-data omissions, falsified PCA weights, target/post-outcome leakage, preprocessing leakage, test-driven selection and fabricated scores are rejected. Legitimate alternative features, folds, metrics and reporting pass. |
| Challenge input integrity | All 19 prepared CSV populations, schemas, previews and source hashes match when checked in the pinned pandas 2.2 / scikit-learn 1.4 parity environment used by Pyodide. The machine-wide pandas 3.0 default changes inferred string dtype labels, so it is not the correct environment for this generator. |
| ML UI | Every card and challenge route; 320, 390, 768, 1024, 1280 and 1440 px; light/dark, forced colours, zoom, editor keyboard exit, real Run/Check, readiness feedback and no learning persistence pass in Chromium and WebKit. Discovery copy and shared-route handoff have explicit assertions. |
| ML visual audit | 85 teaching concepts, 57 diagram families/variants, 256 captures, four actual fitted figures and all 19 challenge tiles reviewed. |
| Production build and shared gates | `npm run check` passes, including the web build, JS checks, Playground routes and app shell. The local toolchain prints an Xcode license notice, but it does not prevent the web build. |

This is a code and browser review, not a measured learning-outcome result. Browser structure checks are not a screen-reader-user study. The six-learner pilot above remains the next evidence needed before claiming that beginners reliably transfer the workflow to unfamiliar data. No deployment was performed in this implementation pass.
