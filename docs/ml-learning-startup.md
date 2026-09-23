# ML learning Python cold-start measurement

Three independent fresh browser contexts per activity and engine; no service worker, no shared browser cache. Production Pyodide 0.26.4 assets were served locally, with a warm OS file cache. Times cover worker startup, package loading, activity setup, execution, validation and serialized receipt. These isolate browser/runtime cost and are not public-network latency guarantees. The same input-file payload was used for both implementations.

| Engine | First activity | Eager median | Staged median |
|---|---|---:|---:|
| chromium | ML-F02-1 | 5.62s | 2.58s |
| chromium | ML-F03-1 | 5.55s | 4.66s |
| chromium | ML-W01-1 | 5.31s | 5.59s |
| chromium | ML-X01 | 5.42s | 5.81s |
| webkit | ML-F02-1 | 5.85s | 2.86s |
| webkit | ML-F03-1 | 5.89s | 5.12s |
| webkit | ML-W01-1 | 6.06s | 6.36s |
| webkit | ML-X01 | 6.23s | 6.55s |

F02 selects dataframe columns; F03 fits the first LinearRegression estimator; W01 is the first plotting activity; X01 is a complete regression challenge.

Decision: retain staged loading. The simple beginner activity improves by about 3 seconds (54% Chromium / 51% WebKit), and the first estimator improves by 0.8–0.9 seconds. Full-package activities cost about 0.3–0.4 seconds more in these cold contexts. This is a worthwhile trade-off without introducing worker pools, parallel runtimes or retained estimator state.

Activity metadata derives packages from reviewed setup/reference imports. NumPy/pandas are the shared base. Estimator activities add scikit-learn and its SciPy dependencies; plotting adds Matplotlib. Learner imports may extend the set through Pyodide’s standard import loader. Runtime tracing and figure collection activate only when their packages are present. Concepts instantiate no worker. The full 197-answer browser gates exercise transitions between package stages; an additional fresh-worker test imports estimator and plotting tools beyond a simple activity’s metadata.

Exact loaded sets, every timing sample and medians: [eager measurements](ml-learning-startup-eager.json), [staged measurements](ml-learning-startup-staged.json). The staged record also separates base startup, activity-package loading and execution durations.

Loaded sets (including transitive packages; order is immaterial):

- Early dataframe: numpy, pandas, python-dateutil, pytz, six.
- First estimator: joblib, numpy, openblas, pandas, python-dateutil, pytz, scikit-learn, scipy, six, threadpoolctl.
- Plot/challenge: Pillow, cycler, fonttools, joblib, kiwisolver, matplotlib, matplotlib-pyodide, numpy, openblas, packaging, pandas, pyparsing, python-dateutil, pytz, scikit-learn, scipy, six, threadpoolctl.
