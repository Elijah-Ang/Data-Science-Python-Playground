# Machine Learning Learn / Refresh

Baseline: 30471719bcbe44fa66b3bb06641416337ecb0696.
Feature branch: codex/ml-learn-refresh. Stop at a green review-ready pull
request. This work does not authorize merging or deployment.

## Curriculum contract

The approved eight decks contain 81 teaching cards (74 Core, seven Go Further),
14 reviews, nine checkpoints and 292 exercises. Nineteen independent Workflow
Challenges retrieve all 17 production model entries. Derive counts from
ml-learning/manifest.json rather than substituting counts for coverage checks.

Core means essential within the relevant pathway/model family. Learners can
enter any lesson, challenge or Playground model directly. No locks, accounts,
scores, timers, saved drafts, completion records or learning storage.

W-K1 is a LinearRegression workflow with a justified defaults decision. W11
teaches search mechanics without a hidden tree prerequisite. Tree-depth tuning
belongs to the tree modules. Classification Tree is self-contained.

W03 depends directly on F-K1. W06 and W09 explicitly also depend on W02, keeping
dummy-reference knowledge in supervised comparison while freeing discovery/PCA
from W01/W02. Shared neural cards precede independent regression/classification
routes and checkpoints. M01 is the intentional full-family capstone.

Challenge IDs X01–X19 follow learner display order. Discrete and numeric One-R
are X09/X10; Gaussian, binary Bernoulli and categorical OHE–Bernoulli NB are
X11/X12/X13; LDA/QDA X14; neural regression/classification X15/X16;
K-Means/Hierarchical/PCA X17/X18/X19.

## Release gates

1. Manifest, prerequisite graph and exact production model coverage.
2. Difficult slices in pinned native Python and real Chromium/WebKit Pyodide:
   linear workflow, both One-R inputs, target-transformed neural regression,
   sampled Ward hierarchy, PCA and receipt lifecycle.
3. Full authored curriculum, visuals, reviews/checkpoints and challenge help.
4. Every reference solution and semantic negatives/alternatives; repeated-run
   cleanup, responsive and accessibility checks.
5. Existing Data Foundations/challenges, Data, Statistics and ML regressions,
   production build and hosted PR checks.

## Receipt lifecycle

Run executes once in an isolated temporary directory and namespace. It collects
serialized outputs, checks and provenance while fitted objects are available.
The immutable receipt contains no PyProxy or live fitted model. Check reveals
the receipt without executing or fitting again. Replacing code makes it stale.
Only the active receipt is retained. Reset/navigation/worker restart release it.
Bundled CSVs are copied into each temporary run so learner exports cannot
overwrite the inputs used by subsequent runs.

Instrumentation uses weak references, is restored in finally, and records row
identity for supported teaching APIs. Repeated row sets are deduplicated in
serialized provenance. Stream text, array previews, figures and downloads are
bounded. Temporary learner files and figures are deleted after serialization.
No scientific security guarantee is made for arbitrary Python implementations.

## Validation commands

    node tests/test_ml_learning_manifest.mjs
    python tests/test_ml_learning_verticals.py
    python tests/test_ml_learning_browser.py --engine chromium
    python tests/test_ml_learning_browser.py --engine webkit

Use tests/requirements-pyodide-parity.txt for native scientific versions.
Browser tests use actual Pyodide 0.26.4, vendored locally or loaded from the
pinned CDN in hosted CI. A modern native sklearn
installation is not evidence of browser compatibility.

## Delivered surface and computed audit

The Learn hub now opens `ml-learn.html`. Eight decks, a 17-model index and
19 independent briefs use the existing shell/editor and shared challenge
renderer. The registry contains 81 teaching cards (74 Core, 7 Go Further),
14 retrieval reviews and 9 checkpoints: 104 cards / 292 exercises.
The 19 challenge workflows are additional to those card exercise counts.

[Complete computed prerequisite and coverage audit](ml-learning-registry-audit.md)
lists every Core card, all cross-deck dependencies and final challenge order.
Regenerate it with `node scripts/audit-ml-learning.mjs`; CI rejects drift.

Each review uses a changed population or a newly stated scenario. Shared
network selection uses a task-neutral metric description until the learner
chooses classification or regression. Python contract variables are explicit
in checkpoint/challenge briefs. Interpretations are self-review; equivalent
scientific answers are accepted where the declared evidence can verify them.

## Validation evidence

The difficult slice gate passed before bulk authoring in native pinned Python
and actual Chromium/WebKit Pyodide: mixed LinearRegression workflow, both
One-R paths, target-transformed MLP regression, sampled Ward hierarchy and PCA.

New validation covers all 197 Python activities, 95 conceptual decision or
self-review exercises structurally, every card/challenge route, six viewport
widths, light/dark themes, forced colours/reduced motion, 200% zoom, keyboard
editor escape, no saved learning, stale receipts, repeated Check without Run,
12 repeated fits without retained Python models, source/export isolation and
semantic negatives/equivalent alternatives. Automated accessibility checks
are not a claim of a human screen-reader audit.

Semantic checks reject leakage before splitting, preparation fitted before
CV, mismatched folds, validation after final-test exposure, target-derived
features, modified predictions/metrics, sample misalignment and arbitrary PCA
axes. They accept equivalent RMSE, consistent renamed clusters and paired PCA
sign choices. Checks use ordinary scientific outputs plus provenance from the
supported APIs; this is educational validation, not a sandbox for hostile code.

Existing regression scope includes 324 Data Foundations solutions, all 30 Data
Workflow Challenges with semantic audit, 262 Data task scenarios, 64 Statistics
unit tests, 6,945 exhaustive Statistics configurations and all 254 production
ML route/fold configurations. Hosted CI retains the existing audit workflows
and adds ML curriculum/semantic and Chromium/WebKit full-solution/UI jobs.

The branch must finish with all PR checks green. Merge and deployment remain
separate user decisions.
