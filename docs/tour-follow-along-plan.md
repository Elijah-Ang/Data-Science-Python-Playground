# Expanded follow-along tour

## Non-negotiables
- Keep the original pinned stage, smooth camera pan/zoom, spotlight and scroll-scrub interaction.
- Actual interface captures, not substitute diagrams or a long illustrated article.
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

Status: original tour restored as an interim baseline. This extension is planned, not implemented or captured yet.
