# Homepage reference review — 29 September 2026

## Review before release

The user requires seeing and approving the result before deployment or AdSense
resubmission. This homepage is prepared locally for review. Do not merge, deploy,
or request an AdSense review until the user explicitly approves the finished work.

Local preview: http://127.0.0.1:8129/index.html

To recreate it, run `npm run build:web`, then
`python3 -m http.server 8129 --bind 127.0.0.1 -d dist`.

## Reference and changes

Reference: `ChatGPT Image Sep 29, 2026 at 05_26_56 PM.png` supplied by the user.

- Rebuilt the desktop garden composition with the cream airship, illustrated
  title, wooden information board, treehouse, sandpit, slide and entrance gate.
- Restored the robot cat and normalized the three garden robots to approximately
  108–111 visible pixels high at a 1448px viewport.
- Preserved the original treehouse robot controller and its book, wave, think,
  teach, code and celebrate poses. Restored the cat and slide motion, with
  reduced-motion and page visibility support.
- Removed the association quote. Expanded the three cards into the available
  board space, using bullet points with highlighted key phrases.
- Header navigation contains About and the short tour. Help & contact, Privacy
  and Credits occupy the navy footer.
- Reflowed content for phone and tablet reading; preserved the clickable robot
  and gate on the garden artwork. Updated the tour's four homepage snapshots.

## Artwork

Eight assets were made with the built-in ImageGen tool. Final workspace paths
and every generation prompt are in `docs/homepage-artwork-v1.json`.
Generated alpha and image framing are preserved in lossless WebP packaging.
Existing robot artwork and the original specialized pose animation are reused.

## Local verification

- `npm run check` and `git diff --check` passed.
- Landing refresh regression passed in Chromium and WebKit at 320, 390, 834,
  1024, 1280 and 1448px: readable bullets, no horizontal overflow, robot sizes,
  working targets, motion, reduced motion, page lifecycle and no-script routes.
- Learn discovery regression passed in Chromium and WebKit: all six poses,
  overlapping transitions, fixed position, hover/focus, lifecycle, routing and
  five viewport sizes in both appearance settings.
- Public learning entry content passed in WebKit without scripts and after
  interactive lesson navigation.
- All 25 short-tour stops passed on phone and desktop in Chromium, including
  the updated gate and robot views and their enlarged previews.

Visual evidence is under `tests/evidence/learn-discovery/` (ignored test output).
