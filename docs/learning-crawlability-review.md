# Local learning and privacy review — 30 September 2026

Changes prepared on current `main`, including merged PR #56, for pull-request review. No deployment, public tunnel or AdSense request.

## Crawlable learning

The web build emits substantive HTML through the existing lesson renderers: 106 Data Foundations cards, 110 ML cards, 11 deck pages and the two learning entry pages (229 learning pages total). Examples: `data-foundations-I17.html`, `data-foundations-inspect.html`, `ml-learn-ML-W-K1.html`, `ml-learn-workflow.html`.

`learning-routes.js` keeps ordinary anchor links usable without JavaScript. With JavaScript, its same-family history router preserves the Python bridge across navigation; back/forward, existing fragment entry links, practice selection/reload and chapter jumps remain supported. Practice variants use `?practice=N` and share the lesson’s canonical URL. The static response contains the first exercise’s full teaching, worked examples where authored, inputs, hints and explained solutions. JavaScript selects later practices. Existing independent workflow challenges keep their rich fragment-based interface; this change focuses indexing on guided lessons and checkpoints.

The static generator in `scripts/build-learning-pages.mjs` renders the same `landing`, `deckPage` and `lessonPage` components used interactively. Lesson content is not reauthored or reduced to summaries. Generated HTML is kept in ignored `dist`, included in the sitemap and build inventory, and available to the existing offline shell. Run `npm run build:web`; preview `dist`, never the repository root.

## Targeted corrections

The W-K1 card thumbnail and full sketch now say Final RMSE, consistent with `LINEAR` in `ml-learning/verticals.py`, its `neg_root_mean_squared_error` validation and `final_rmse` contract. The sketch describes the actual mixed-input/default linear workflow rather than implying the numeric inputs must be scaled. Supporting links lead to W06 (pipeline), W09 (validation evidence) and W13 (final evaluation), rather than the same checkpoint. Repeated brief text and doubled terminal punctuation have been removed while keeping the editor task reminder.

The MIX60/MISSING60 dictionary follows `ml-learning/fixtures.py`: numeric distance and weight inputs, categorical service, alternating binary weekend flag, and synthetic duration target. No physical units are assigned in this fixture; the dictionary explicitly leaves them unspecified. RMSE uses the synthetic target’s units. No km/kg/minute labels have been invented.

The Statistics tile retains its original planned lessons pathway and Coming soon announcement. The working Statistics Playground remains accessible through the top mode navigation.

## Privacy basis and owner decisions

The policy describes the current fail-closed ad gate (`advertisingEnabled = false`), absent ad/CMP/analytics SDKs, local Python processing, ML Playground local drafts and setup choices, transient other workspaces/lessons, local appearance preference, offline caches, exports, package requests and hosting/authentication providers. It makes no claim that account approval, a consent message or a live CMP is active. Future advertising is conditional.

Current official guidance checked 30 September 2026:
- Google EU user consent policy: https://www.google.com/about/company/user-consent-policy/
- Google certified-CMP requirements for personalised ads in the EEA, UK and Switzerland: https://support.google.com/adsense/answer/13554116

Owner input remains needed before a future ad integration: actual ad/CMP providers, personalised/non-personalised or limited-ad modes, audience/regions, consent and withdrawal configuration, cookie/identifier and consent-record retention, and any native SDK integration. The repository cannot verify provider log retention, Cloudflare Access session/log settings or support-mailbox retention. Those details have not been invented. No account settings were inspected or changed.

## Validation

The static-page test checks all 216 lesson articles, ordinary links, canonicals, sitemap and offline inventory, along with old routes, checkpoint corrections, planned Statistics lessons and advertising-disabled disclosures. Real Chromium/WebKit tests cover no-JavaScript reading, old links, new links, practice reload, repeated navigation, browser history, chapters and 320/390/1440 layouts. The existing ML UI suite covers every card/challenge, themes, six widths, real Run/repeated Check, keyboard and no lesson persistence. The visual-audit script regenerates contact sheets and fitted figures against bundled Python assets.


The entry-page overview panels were removed at the owner’s request. The actual lesson library, full lesson pages and PR #56 homepage remain intact. The homepage cat now sits inside the desktop sandpit, the slide robot travels further along the chute, and hover pose replacement keeps a decoded robot visible throughout.

Validation on the combined current-main branch: `npm run check` passes (including all 216 static lesson pages); Chromium and WebKit route/history/no-script checks pass; the ML Chromium UI suite covers all 110 cards and 19 challenges plus real Run/Check; the refreshed visual audit covers 256 captures and four fitted figures; all 324 Foundations solutions and semantic negative/recovery checks pass; ML mastery checks pass. Homepage checks cover seven widths, refresh, cat feet inside the sandpit, real slide travel, reduced motion, visibility and native navigation. Hover checks cover normal, delayed and failed displayed-layer decoding in Chromium and WebKit with no blank frame.

The three homepage plaques now use the same font size, line height, badge clearance and centred two-line label boxes. The longer Python phrase breaks after “Python” rather than shrinking its type. Browser checks compare all three actual label sizes and boxes at each desktop width.
