# Curriculum presentation correction

This revision restores the original Follow / Change / Transfer indicators and removes the added Learn / Refresh lesson buttons. Desktop lessons have two bounded panes: the explanation and Python workspace scroll independently. Phones retain a stacked page.

Data teaching has been edited for brevity in the authored content itself. Guide prose decreased from 8,608 to 5,382 words (37.5%); later-practice explanations decreased from 2,805 to 1,308 words (53.4%); worked-example prose decreased by 49.9%. Using the same final rendering rules before and after isolates the editing from disclosure changes: default-visible authored explanations decreased by 42.1%, and the displayed task briefs decreased by 7.5%. The separately exported task text decreased by 24.3%. Required outputs and constraints remain intact. [The copy ledger](curriculum-evidence/foundations-copy-reduction.json) includes per-deck counts and preservation checks for all 338 activities. Exercise programs, datasets and grading contracts remain unchanged by this revision.

All Data and ML activities have three closed supporting rows: Reference, Hint(s), and Solution. Reference contains flat sections, rather than another list of toggles. The current concept, worked operation, new syntax and essential argument meanings stay visible. Data argument teaching uses one concise definition per new argument; the reference table retains accepted forms, defaults and pinned API sources.

Columns use teal outlines, Python objects use violet left rules, and syntax/functions/parameters use dotted rules. These distinctions appear in prose and teaching tables, including generated output names and worked-example variables. Titles, literal values, ordinary prose and editable Python remain protected. Long table identifiers remain intact; narrow tables scroll within their own wrapper.

ML curriculum content, examples, datasets, solutions, graders and workflow steps remain unchanged. Presentation uses a concise workflow outline and one primary visual; complete authored explanations remain together in Reference. Direct neural and discovery branch links are retained.

## Review evidence

The rejected previous presentation is archived in [before screenshots](curriculum-evidence/ui-revision-before/). The corrected actual browser renders are in [after screenshots](curriculum-evidence/ui-revision-after/).

| Page | Desktop | Phone |
|---|---|---|
| Group and aggregate | [Screenshot](curriculum-evidence/ui-revision-after/W19-1440-light.png) | [Screenshot](curriculum-evidence/ui-revision-after/W19-390-light.png) |
| Histogram | [Screenshot](curriculum-evidence/ui-revision-after/V04-1440-light.png) | [Screenshot](curriculum-evidence/ui-revision-after/V04-390-light.png) |
| Complete regression workflow | [Screenshot](curriculum-evidence/ui-revision-after/ML-F11-1440-light.png) | [Screenshot](curriculum-evidence/ui-revision-after/ML-F11-390-light.png) |
| Classification trees | [Screenshot](curriculum-evidence/ui-revision-after/ML-C14-1440-light.png) | [Screenshot](curriculum-evidence/ui-revision-after/ML-C14-390-light.png) |

Final reviewed asset content ID: `44729a3eb07e`. [Build/source receipt](curriculum-evidence/final-review-build.json).

Validation receipts:

- [All 1,352 phone/desktop activity renders, actual independent wheel scrolling, touch controls and semantic contrast](curriculum-evidence/responsive-coverage.json).
- [All 676 Data teaching renders](curriculum-evidence/foundations-teaching-browser.json), with flat references, editor interactions and preserved teaching.
- [Data parameter contracts](curriculum-evidence/foundations-parameters-browser.json) and [277 native positive/negative runtime cases](curriculum-evidence/foundations-runtime/summary.json).
- [Focused real browser Python runs and graders](curriculum-evidence/ui-revision-runtime.json).
- [ML presentation preservation](curriculum-evidence/ml-presentation-revision.json), plus [ML visual inventory](ml-learning-visual-review.json).
- [The self-contained HTML preview](curriculum-evidence/standalone-preview.json) is checked with sibling assets blocked and inside an opaque HTML viewer. Data/ML navigation and visuals pass in the opaque viewer; real Python checks pass in the isolated HTTP preview with sibling assets blocked.

The source branch is `curriculum-coherence-2026-10-13`. This is a local review revision; it has not been merged or published. Chromium checks are recorded here. WebKit and physical-device verification remain outside the available local environment. Earlier screenshots and execution receipts elsewhere in the evidence directory describe the prior implementation, not this corrected layout.
