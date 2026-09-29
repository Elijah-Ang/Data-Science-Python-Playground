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

## Hanging banner desktop revision

- Replaced the desktop wooden board with a smaller cream fabric banner, hanging
  from two ropes attached to the blimp. Blimp, ropes and banner share one gentle
  float/sway, with reduced-motion and hidden-page pause support.
- Moved the banner right to show the treehouse while keeping the slide clear.
- Moved the cat left beside the blue bucket, revealing its body while retaining
  the sandcastle foreground layer and contact shadow.
- Reduced the sliding robot by about 17% and kept it on the slide.
- Increased the golden entrance glow and its minimum pulse brightness again.
- Updated only the two desktop tour snapshots. Mobile/tablet styles and content
  remain unchanged.

The banner was created with built-in ImageGen, then losslessly packaged as
`assets/landing/garden-banner-v4.webp`. Its exact prompt and original output are
recorded in `docs/homepage-banner-v4-artwork.json`.

Verification: the Chromium landing regression passes at six widths, including
reloads, text fit, robot proportions, motions, water, reduced motion, hidden-page
lifecycle, focus/navigation and no-script routes. Visual evidence is in
`tests/evidence/desktop-banner-v4/` and `tests/evidence/learn-discovery/`.

Local preview only; release and AdSense resubmission await approval.

WebKit desktop, 1100px breakpoint and phone visual checks also pass. Both desktop
tour entry snapshots load with their spotlight and enlarged preview. App-shell,
public-page, ad-mode, tour-content and whitespace checks pass.

## Banner reference and collision correction

Reference: `ChatGPT Image Sep 29, 2026 at 08_35_14 PM.png`.

- Moved the blimp right and attached both suspension ropes beneath its cabin.
- Matched the banner reference with blue, cream and green panels, large existing
  pixel-art icons, coloured number badges, cream heading plaques, gold sparkles,
  coloured gem bullets, dotted dividers and bold navy keywords. Text remains live
  HTML. The banner is slightly taller so all content fits within the cloth.
- Moved the cat onto the rear sand, with its body clear of both the bucket and
  castle. Sampled 39 frames across its full motion cycle: zero overlap with the
  bucket and at least 12px vertical clearance at the reference 1525px width.
- Kept the slide robot size, golden gate pulse and existing treehouse robot
  controller. Updated the two desktop tour snapshots only.

Verification: Chromium six-width landing regression and WebKit desktop,
1100px-breakpoint and phone layout checks pass. Evidence:
`tests/evidence/desktop-banner-v5/`. These desktop revisions remain local for
review; deployment and AdSense resubmission require approval.

## Pixel banner fidelity pass — 30 September 2026

Reference: the supplied close-up of the banner (`image-1.png`). The desktop
banner now uses four built-in ImageGen assets: a corrected blank fabric and rod,
a sheet of blue/orange/green numbered pixel badges, a golden pixel sparkle,
and a cream pixel-art heading plaque.
Exact source files, prompt stages and final workspace paths are recorded in
`docs/homepage-banner-v7-artwork.json`. The body text stays selectable HTML.

The three panel widths, insets, icon positions, heading plaques, badge overlap,
gem bullets and dividers were compared with the reference. The lower cloth
silhouette was regenerated until all panel borders sat within opaque fabric
and a visible stitched margin remained below them. The middle heading was sized
to stay inside its plaque. The suspension ropes now end at the new banner
loops. These are desktop-only changes; the phone screenshot is pixel-identical
to the previous mobile layout.

Regression checks cover seven widths from 320 to 1920px in Chromium and WebKit.
They verify text fit, opaque cream below each panel, motion, water, click
navigation, reduced motion and the no-script routes. The two desktop tour entry
snapshots were refreshed. Deployment and AdSense resubmission still await the
user's approval of the finished preview.
