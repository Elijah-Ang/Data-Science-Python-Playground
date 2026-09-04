# App Store Listing — Version 1 Metadata

This is the submission-ready copy candidate for the current Data Playground binary. The copy has been checked against Apple’s current App Store Connect limits on 2026-09-04. Account-owned, legal, and asset-gated fields remain explicitly marked below.

## Working identity

- **App name:** `Data Playground` — 15 characters; Apple limit 30. The product name is confirmed by the owner; the owner still needs to complete any trademark/name-rights check.
- **Subtitle:** `Learn Python with real data` — 27 characters; Apple limit 30.
- **Promotional text (optional):** `Explore curated datasets and run Python experiments locally, with no account or ads in version 1.` — 97 characters; Apple limit 170.
- **Primary category:** **Education** — recommended because the core experience is an interactive learning tool.
- **Secondary category:** **Developer Tools** — recommended because the app also provides an editable Python notebook and local coding environment.
- **Primary language:** **English (U.K.)** — recommended for the first localization because Apple lists English (U.K.) as Singapore’s default App Store language and the product uses British spelling such as “visualisations.”
- **Localization scope:** English (U.K.) only for version 1. Add other languages only after human translation, metadata review, and matching screenshots are ready. Simplified Chinese is an optional later localization for Singapore and other supported storefronts; it is not assumed here.
- **Price:** **Free**.
- **Version 1 monetization:** **No ads, no advertising SDK, and no in-app purchases in the submitted binary.** The separate AdMob/consent workstream remains deferred to a later release and must not be described as available in this version.
- **Support contact:** Elijah Ang · `elijahang77@gmail.com` · `+65 8822 7539`.
- **Bundle identifier:** `com.elijahang.datascienceplayground`.

## Public URLs

These GitHub Pages URLs were checked with HTTP 200 on 2026-09-04 and are suitable as the current App Store Connect links, subject to the owner confirming that the repository will remain public and the pages will remain available:

- **Privacy Policy URL:** <https://elijah-ang.github.io/Data-Science-Python-Playground/privacy.html>
- **Support URL:** <https://elijah-ang.github.io/Data-Science-Python-Playground/help.html>
- **Marketing URL (optional):** <https://elijah-ang.github.io/Data-Science-Python-Playground/>

The support page displays the confirmed email and phone contact. The privacy page is also linked from the app’s information surfaces.

## App Store description

Data Playground is a hands-on learning lab for exploring real datasets, writing Python, building visualisations, and understanding machine-learning evidence.

Choose a curated dataset, inspect its structure, ask a question, and work through a live local notebook. Edit Python cells, run them, read tables and charts, and export results when you choose.

The Machine Learning Playground guides you through feature and target selection, train/test splitting, preprocessing, cross-validation, model fitting, diagnostics, and a final holdout evaluation. Practice mode lets you make decisions before revealing reference code.

Python execution and the bundled dataset catalogue run locally inside the app. No account is required, and this version contains no ads or in-app purchases. Your active work is temporary: it remains available while the app process stays alive, but is cleared after the app is terminated.

Data Playground is designed for learners who want a clear, hands-on path from data questions to evidence-based conclusions.

## Keywords

Paste this single comma-separated value into App Store Connect:

`python,pandas,machine learning,statistics,visualisation,visualization,notebook,practice`

This is 87 ASCII bytes, below Apple’s 100-byte limit. It avoids repeating “Data Playground” and does not use another app or company name. The British and U.S. spellings of “visualisation/visualization” are intentional for the first English localization.

## Copyright suggestion

Suggested value: `2026 Elijah Ang`.

Use this only if Elijah Ang is the exact person or entity that owns the exclusive rights to the app’s original content. If the legal rights holder is different, replace it with the exact rights-holder name and year. This is an owner/legal confirmation gate, not an invented seller identity.

## Availability recommendation

- **Distribution:** Public App Store distribution.
- **Countries or regions:** **All available countries or regions** is the recommended starting point for this free, local-first educational app. The current scope has no account, payment, advertising, financial, or region-specific service dependency. This remains subject to the owner’s content-rights confirmation and any region-specific requirement App Store Connect presents.
- **Pre-order:** Not recommended for this first release; use normal release after approval.

This is a product recommendation, not legal advice. Apple currently lists 175 App Store countries or regions and notes that local legal/regulatory requirements can limit availability.

## Fields that still require the owner or App Store Connect account

- **Seller/developer legal name, SKU, Apple ID, and App Store Connect record:** account-specific; do not infer or invent them from the bundle identifier.
- **Age-rating questionnaire:** required before publication. Do not prefill answers here; the owner must answer the current questionnaire based on the submitted binary.
- **Content Rights declaration:** the dataset and dependency rights ledger plus the in-app Credits page are prepared, but the owner must confirm that the rights and attribution obligations are satisfied for every selected storefront before answering Apple’s field.
- **App Privacy questionnaire:** complete against the exact archived binary and any future SDK changes. The current audit finds no analytics, cross-app tracking, account, or advertising SDK flow, but the owner must make the final Apple declarations.
- **App icon, screenshots, and optional app preview:** the icon is in the native project; store screenshots still need to be captured from the tested build and uploaded.
- **Copyright:** use the suggestion above only after confirming the exact rights holder.
- **Final legal/privacy review:** confirm that the live privacy page accurately describes the submitted binary and third-party links.

## Source and rights notes

Version 1 uses the bundled dataset catalogue only. User-supplied CSV import is deferred; CSV export remains available when the user explicitly chooses it. Dataset attribution and dependency notices are maintained in `third-party-rights-and-licenses.md` and the in-app/web Credits page.

## Apple requirements checked (2026-09-04)

- [App information reference](https://developer.apple.com/help/app-store-connect/reference/app-information/) — name, subtitle, privacy URL, categories, bundle ID, content rights, age rating, and primary language.
- [Platform version information reference](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/) — promotional text (170 characters), description (4,000 characters), keywords (100 bytes), support URL, and copyright format.
- [Choosing a category](https://developer.apple.com/app-store/categories/) — primary and secondary category guidance.
- [App Store localizations](https://developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations/) — Singapore’s default English (U.K.) metadata and supported locales.
- [Manage availability](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store) — all-country/region availability and the current 175-storefront scope.
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — privacy-policy and metadata accuracy requirements.
