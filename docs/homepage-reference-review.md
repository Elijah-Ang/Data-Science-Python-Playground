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

## Desktop follow-up

The follow-up applies at 1100px and wider. Phone/tablet artwork, layout and
existing animations are retained for the user's separate mobile design review.

- Removed all five requested decorative signs, including the tree sign.
- Positioned the cat's feet inside the sandpit and centered the slide robot on
  the chute through both ends of its animation. Robot scale remains consistent.
- Moved the information board left and slightly up to expose the slide.
- Added independent tire, balloon and flag motion; the cleaned background has
  no stationary duplicates. Added flowing waterfall highlights and pond ripples,
  with a mask that keeps the bridge, duck, rocks and lily pads stationary.
- Added a golden entrance-plaque pulse and replaced the blue gate focus ring
  with gold. Kept the Learn / Refresh scroll and nerdy-robot focus behavior.
- Centered the blimp heading, increased its float/sway, removed the desktop
  subtitle, and placed About next to the short-tour button.
- Updated only the two desktop homepage tour snapshots.

Four additional assets used built-in ImageGen. Prompts, original outputs and
final asset paths are recorded in `docs/homepage-desktop-v2-artwork.json`.

Verification: Chrome and WebKit responsive/interaction checks, actual animated
water frame changes, stationary pond foreground, gate pulse, reduced motion,
hidden-page pause, and native navigation. Visual comparisons at 390, 834 and
1024px confirm that the mobile/tablet layout and artwork are unchanged. The full project check and
desktop tour entry previews also pass. Additional visual evidence is in
`tests/evidence/desktop-revisions/`.

These changes are local review work. Deployment and AdSense resubmission still
require the user's approval of the finished preview.

## Further desktop refinements

- Swapped the title and blimp, reducing the blimp and its contents by about 10%.
- Made the information board shorter and its heading smaller. Removed the
  dataset names and the "A question, a table..." line from the desktop view.
- Moved the cat behind the sandcastle. A clipped foreground copy of the
  original artwork covers its lower body throughout the animation; a soft
  contact shadow grounds it in the sand. No new raster artwork was needed.
- Strengthened the entrance plaque's golden halo and minimum pulse brightness.
- Refreshed the two desktop tour snapshots. Mobile styles and content remain
  as before. Chromium responsive/navigation regression, Safari visual checks,
  app-shell checks and whitespace validation pass.

Preview evidence: `tests/evidence/desktop-refinement-v3/`.
