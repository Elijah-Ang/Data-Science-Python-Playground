# Site health check — 17 September 2026

Overall: healthy in the checks run; the remaining priority is beginner teaching flow and exercise clarity. No blocking functional failure was found. This is a broad audit, not an exhaustive security, accessibility, performance or native-device certification. No application code was changed.

## Scope and evidence

Audited clean local commit `bd473733a1ed`, rebuilt production assets, reviewed the generated 106-card / 326-exercise curriculum and shared lesson renderer, and manually inspected desktop and mobile lessons. Executed:

| Check | Result |
|---|---|
| `npm run check` | Passed: build, syntax, curriculum contracts, worker transport, 254 ML route structures, public links/assets, app shell and tour contracts |
| Foundations Python runtime | 326/326 reference solutions; semantic, wrong-answer, intent and recovery regressions passed |
| Data Python runtime | 262 task scenarios plus trust regressions passed |
| Statistics unit suite | 64 tests passed |
| ML representative runtime | 56 routes, no runtime failures |
| Foundations browser journeys | Chromium and WebKit passed: responsive layouts through 320px, light/dark, navigation, recovery, stopping infinite code, chart validation, export and report |
| Product browser suite | Chromium passed: public pages at phone/tablet/desktop widths, Data recovery/undo and ML prerequisite enforcement |
| Statistics integration browser suite | Chromium passed: production Pyodide, numerical oracle, export and responsive layout |

Local Python uses pandas 3.0.1, NumPy 2.4.2, scikit-learn 1.9.0, Matplotlib 3.10.8 and Seaborn 0.13.2; this is not the pinned Pyodide-parity environment. Browser journeys independently exercised the web runtime, but did not execute all 326 solutions in-browser. Statistics emitted a non-fatal Matplotlib `boxplot(labels=...)` deprecation warning locally.

The live `build-info.json` returned commit `fbf3af8fa819` and a different content ID from the local build. Direct byte comparisons nevertheless found the deployed Foundations curriculum, refinements, app JS and CSS identical to this checkout. Do not generalize the local test results into proof that every deployed asset matches. Full 254-route ML runtime, exhaustive offline/update scenarios, assistive technology, physical devices and security penetration testing were outside this pass.

## Findings, in priority order

1. **P2 — Replace the temperature total in V37, Task 2.** The task and accepted solution sum temperatures by sky category. That runs correctly but has no clear analytical interpretation in this weather report, conflates group size with temperature, and undermines the stated goal of a coherent report. Use mean temperature with counts, or an additive measurement such as rainfall. Source: `foundations/curriculum.js:176`.

2. **P2 — Repair nine checkpoint hints that refer to a hidden example.** All three rounds of I22, W31 and V37 tell the learner to read the worked example. The renderer omits worked examples on review cards; only Reveal solution remains. Give a small actionable cue or link to the relevant earlier lesson without revealing the answer. Confirmed in the rendered V37 page. Sources: `foundations/curriculum.js:34`, `foundations/app.js:46`.

3. **P2 — Make the beginner visualization route truly optional beyond the core.** V03 introduces hue, style and size before the dedicated scatter explanation at V16. KDE, ECDF, violin, swarm and boxen appear along the ordinary Next sequence even though several are labelled Go Further. Chart selection is delayed to V35. Start with chart choice and plain scatter, histogram, category counts and line charts; then styling and grouped summaries; then optional advanced charts. Core/Go Further labels are useful, but Next currently traverses both. Sources: `foundations/curriculum.js:90`, `foundations/refinements.js:134`, `foundations/app.js:75`.

4. **P2 — Break checkpoint instructions into explicit steps.** V37 places filtering, three chart types, bins, titles, axis-label pairs and display instructions in one paragraph, repeated above the editor. On mobile this produces substantial scrolling and makes it harder to check one requirement at a time. Use a numbered static task list with a short expected-output summary, and an in-page “Go to editor” link. This needs no saved learning or completion tracking. Sources: `foundations/app.js:47`, `foundations/app.js:51`, `foundations/curriculum.js:176`.

5. **P3 — Clarify “return” in a script editor.** Generated tasks append “Return the Figure”, while reference code displays it with `plt.show()`. New learners may interpret “return” as the Python statement. Prefer “Display the chart with plt.show()” and, for values, “Leave this expression on the final line”; explain that each run starts from fresh given data. Source: `foundations/refinements.js:148`.

## Learning design assessment

- **Inspection: strong.** Small tables, construction/CSV before inspection, explicit Series versus DataFrame, positional versus labelled selection, missingness before summaries, and spaced retrieval form a coherent introduction. I18S's seven-summary dictionary is denser than its later single-summary rounds; splitting its Follow example into smaller questions would reduce the jump.
- **Wrangling: strong.** Copying, transformations, text/type/date repair, missingness, aggregation, reshaping and joins build sensibly. Join cardinality validation, distinguishing unknown from zero, preserving outlier evidence and training-only scaler fitting are good safeguards.
- **Visualization: technically sound in the tested solutions; flow needs refinement.** Counts versus means, SD versus confidence intervals, axes-level versus figure-level functions, signed correlation scales, real stacked components and tiny-sample cautions are explained carefully. The volume and order of chart types make it less beginner-friendly than the other two decks.
- **Shared exercise presentation: mostly intuitive.** Goal → explanation/diagram → given table → syntax → worked example → task → editor/output is consistent. Follow/Change/Transfer reduces scaffolding, task reminders retain context, and Run versus Check is distinguished. Tables, exact object names, hints, solutions and accessible labels are valuable. Passing layout checks establishes reachability and containment, not that every learner will understand every exercise without help.

## Handbook comparison

The conceptual coverage is broadly consistent with Jake VanderPlas's [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/), while the site's task-based ordering is a reasonable adaptation rather than a chapter-for-chapter copy.

- Inspection agrees with the book's distinction between [label and positional indexing](https://jakevdp.github.io/PythonDataScienceHandbook/03.02-data-indexing-and-selection.html), including inclusive `.loc` and exclusive `.iloc` slice endpoints.
- Wrangling agrees with the treatment of [missing data](https://jakevdp.github.io/PythonDataScienceHandbook/03.04-missing-values.html), [join relationships](https://jakevdp.github.io/PythonDataScienceHandbook/03.07-merge-and-join.html), and [split/apply/combine aggregation and transformation](https://jakevdp.github.io/PythonDataScienceHandbook/03.08-aggregation-and-grouping.html).
- Figure/Axes teaching and explicit axes ownership agree with the book's [object-oriented Matplotlib interface](https://jakevdp.github.io/PythonDataScienceHandbook/04.00-introduction-to-matplotlib.html). The site also covers the relationships/distributions/group comparisons discussed in [Visualization with Seaborn](https://jakevdp.github.io/PythonDataScienceHandbook/04.14-visualization-with-seaborn.html).

Use the supplied online edition as a conceptual reference, not an exact API template: it contains older examples such as `.ix` and `sns.distplot`. Keep modern site APIs and validate changes against the pinned runtime. The textbook comparison is a conceptual cross-check; executable reference solutions alone do not establish that each real-world analytical question is meaningful, as V37's temperature total illustrates.

Recommended next pass: fix the checkpoint question and hints first; then simplify visualization progression and task formatting. Preserve the existing no-saved-learning/no-progress-tracking policy.
