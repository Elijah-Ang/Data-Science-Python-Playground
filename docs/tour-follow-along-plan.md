# Expanded follow-along tour

## Non-negotiables (updated after preview feedback)
- Keep the original pinned stage, smooth camera pan/zoom, spotlight and scroll-scrub interaction.
- Source-labelled HTML/CSS interface excerpts, not AI-generated interface text or a long illustrated article.
- Homepage unchanged apart from the already requested desktop tour button.
- No separate illustrated lesson library.
- One short instruction per stop; show where to act and the resulting interface state.

## Storyboard
1. Start: show the homepage gate and nerdy robot. Explain that the gate opens Data; the robot opens Learn / Refresh.
2. Choose: zoom to the Data dataset selector; then pull back to the inspector showing the selected data.
3. Inspect: focus the columns and small data preview; explain what one row represents.
4. Try: move to Suggested Route, show a selected task adding a notebook cell.
5. Run and read: follow that exact cell to its real output. On mobile, pan from notebook down to output; on desktop, pan sideways.
6. Get help: focus Challenges, open the real guide and show close/minimise controls without implying the screenshot itself is interactive.
7. Statistics: pull back to the current HOME / DATA / STATS / ML switcher, switch to STATS, focus Study setup and then its confidence control. End on one verified estimate/interval output and the assumptions.
8. Machine learning: switch to ML, focus setup and Workflow, then show the real train/validate/final-test sequence. Use a supervised example; do not imply clustering has a prediction target.
9. Learn / Refresh: return to the nerdy robot and open the light-mode hub. Show Data Foundations as available; Statistics and ML learning paths remain clearly Coming soon.
10. Choose a deck: follow Inspect, Wrangle / Preprocess and Visualise; zoom into the chapter buttons and connecting arrows.
11. Practise: open a real lesson; focus Follow, Change and Transfer, then Run / Check answer / Reset code. Show actual successful output. Do not introduce saved progress.
12. Finish: gently zoom out and offer direct links to Data, Stats, ML and Learn / Refresh, plus Replay.

## Motion and controls
- Retain scroll control, numbered chapter jumps, Back/Next and Replay.
- Pan/zoom continuously within a capture; crossfade only when switching workspaces or opening a changed UI state.
- Never interpolate unrelated capture coordinates across a page transition.
- Hold each focus long enough to read one concise caption. Text must stay outside the moving camera surface.
- Keep reduced-motion mode: immediate focus changes with no animated travel.
- Keyboard chapter navigation, visible focus, meaningful capture alt text, and no automatic advancing.

## Capture and accuracy plan
- Capture the current real app in light mode at desktop, tablet and phone widths.
- Execute one small deterministic Data task, one Statistics task and one supervised ML workflow; capture their actual results.
- Record target rectangles from visible controls in each capture profile, rather than stretching desktop coordinates onto mobile.
- Capture the hub, deck and practice views separately. Crop private information and browser chrome out.
- Review every caption against current control labels. Do not claim the guide is live interactive code.
- Keep a short text fallback inside the tour for accessibility and discovery, not a separate library.

## Acceptance checks before replacing the restored tour
- All 12 stops use current captures; captions and spotlight targets agree.
- Phone, tablet and desktop framing stays legible; no clipped targets or page overflow.
- Forward/back/replay, resizing mid-tour, reduced motion and keyboard navigation all work.
- Python packages do not load merely to view the tour.
- No unrelated changes to the homepage, lessons, theme choices or advertising.

## Implemented — 16 September 2026

The storyboard is now split into 24 focused stops: Data (5), Statistics (5), ML (7), Learn (7). The opening capture shows HOME / DATA / STATS / ML. Section shortcuts and direct workspace links keep the longer tour navigable. The homepage is unchanged.

The original screenshot implementation has been replaced after feedback about blur and incorrect crop coordinates. All 24 stops now render native HTML/CSS excerpts with the product's labels, palette, fonts, selected teaching examples and verified results. These are explicitly described as simplified interface excerpts, not pixel-exact screenshots or live controls. Historical captures remain in Git but are not shipped in the web build.

Focus bounds are measured from the rendered component. CSS zoom repaints text at its display size; there is no enlarged raster text. An Enlarge preview dialog shows only the current excerpt at readable size and can be dismissed with its button or Escape. The camera still pans between related sections, crossfades on scene changes, and respects reduced motion. No Python runtime is loaded by the tour itself.

Verified examples: Data df.head(10); penguin Welch comparison (mean difference −26.9239 g, 95% CI −145.665 to 91.8172 g); supervised ML five-feature logistic route (final macro F1 0.916, 114 held-out rows); I01 DataFrame lesson accepted by Check answer. Statistics and ML lesson pathways remain explicitly Coming soon.

Static tests check all 24 stops, four sections, source labels, matching focus selectors and absence of raster text/live controls. Browser regression coverage includes section jumps, every stop, spotlight alignment, enlarged excerpts and Back/Next/Replay. Release still depends on PR 46 review/merge and deployment verification; these changes do not imply AdSense approval.

Local Chrome interaction checks: all 24 stops at 1440×1000, 834×900, 390×844 and 375×667; no horizontal overflow or narrative/footer overlap. Back, Next, Replay and section jumps exercised. The retained CI script also covers reduced-motion Chromium/WebKit; that automated script was not run locally in this session.
