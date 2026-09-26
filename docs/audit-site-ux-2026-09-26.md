# Learning UI and site consistency audit — 26 September 2026

## Scope and evidence

I inspected the Learn / Refresh hub, the Data, Statistics, and Machine Learning playgrounds, Data Foundations lessons and workflow challenges, and Machine Learning lessons and workflow challenges. The challenge screenshots in the request were evidence of the presentation problem; their text was not treated as an implementation instruction. I also reviewed the shared rendering code, CSS, and generated exercise inventory.

At 1440px and 390px, the hub and all three playgrounds retained the same header, palette, control language, and responsive composition. None produced page-level horizontal overflow or a browser script error in the route scan. The learning pages use the same Foundations shell, so changes to its prompt, code, and focus styles reach every Data Foundations and Machine Learning deck. The challenge styles and renderer reach every Data Foundations workflow challenge.

## Findings and changes

| Finding | Evidence | Change |
| --- | --- | --- |
| Explained challenge solutions appeared much longer than the work required. | All 30 Data Foundations challenges displayed `reference`, which includes the supplied input setup. Median reference length was 32 lines; median answer length was 6 lines. IC09's revised answer is 4 lines. | Show `solution` first, with a clear instruction to add it below `# Your work`. Keep the supplied setup in a separate closed disclosure for learners who want to inspect it. |
| ML practice briefs repeated the opening instruction. | In the generated curriculum, 226 of 242 non-Follow activities lacked a separate `question`. The renderer used the first task sentence as the heading and then printed the entire task below it. | Render the first sentence as the heading and only the remaining sentences as detail. Explicit question/task pairs still render both. |
| Long ML setup blocks interrupted the reading path. | 79 non-Follow ML activities include supplied setup. Their full code appeared in the lesson column before hints and solution. | Keep the setup available in a closed disclosure. The dataset preview and exercise brief remain visible. |
| Deliverables and check results required extra scanning. | Variable name, output type, and requirement were crowded together; every generic successful check repeated “Matches the requested evidence.” | Give output names a distinct chip and label, strengthen requirement spacing, and omit only that generic success sentence. Specific feedback and all failures remain visible. |
| Long code lines and section navigation were harder to use on phones or inside the desktop split pane. | IC09's compact `pd.crosstab` line extended beyond the phone code window; the desktop section links could cover the target heading. | Wrap answer code on narrow screens, give disclosure summaries a 44px target and visible focus, and offset brief navigation by its sticky height. |

The shared practice card now has a clearer question hierarchy, more readable code samples, consistent answer accent, and restrained line lengths. These styles apply across the Data and ML Learn / Refresh pages rather than one lesson. The editor reminder names the current challenge and repeats its question alongside requested outputs; routine run instructions only mention charts for chart tasks.

## Verification

- JavaScript syntax checks passed for the three changed renderers. The web build passed.
- Chromium and WebKit rendered the revised challenge and ML exercise at 1440px and 390px. In both engines, the answer was visible, supplied setup stayed closed, the phone answer code fit its container, the desktop brief jump cleared its sticky navigation, and neither route had page-level horizontal overflow or a script error.
- The Learn hub and Data, Statistics, and ML playgrounds were scanned at 1440px and 390px; all eight views had no page-level horizontal overflow or script error.
- Browser regression assertions now cover the answer-only challenge solution, hidden setup, and nonduplicated ML practice prompt.

The changes introduce no saved learning state, draft, resume, completion record, or progress indicator. Content and grading revisions are documented in the separate curriculum and workflow audits.
