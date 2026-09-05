# App Review Notes — Data Playground Version 1

Use these notes with the submitted Data Playground build after confirming the exact archived version/build in App Store Connect. The current project candidate is version `1.0.0` (build `1`); do not paste that value if the archive has changed.

## Reviewer-facing notes

Data Playground is a free, no-account educational app. Python execution and the bundled datasets run locally inside the app using a bundled WebAssembly/Pyodide runtime. The submitted version contains no advertising SDK, no ads, no in-app purchases, no analytics, and no cross-app tracking. No login or demo account is required.

### Suggested review path

1. Launch the app and choose **Data Playground**.
2. Select a bundled dataset and run an editable Python cell.
3. Export a CSV or chart and choose a destination from the iOS Share Sheet.
4. Open **Machine Learning**, select a compatible dataset/model route, and run the guided workflow.
5. Turn off network access after a successful clean launch and repeat a bundled-data journey to verify that the packaged runtime and dataset catalogue work offline.
6. Open a dataset source link to verify that it uses the system-backed browser surface, then dismiss the browser to return to the app.

Version 1 uses bundled datasets only; importing user-supplied CSV files is deferred beyond version 1. CSV export remains available from the analysis workspace.

Code drafts and bundled dataset text save automatically on this device for each setup. Python variables and results remain temporary and are reset when reopening. CSV and chart exports are created only when the reviewer chooses them; the browser, Files app or selected share destination controls the resulting file. There is no account, cloud synchronisation, analytics or project-operated storage for analysis work.

The Machine Learning Playground guides feature and target selection, train/test splitting, preprocessing, cross-validation, model fitting, diagnostics, and a final holdout evaluation. The app preserves a one-use final holdout in supervised teaching routes. Clustering and PCA routes are clearly separated from supervised evaluation. The reviewer can edit and run each workflow step and open its reference panel.

## Reviewer contact

- Elijah Ang
- `elijahang77@gmail.com`
- `+65 8822 7539`

## Links to provide in App Store Connect

- **Privacy Policy:** <https://elijah-ang.github.io/Data-Science-Python-Playground/privacy.html>
- **Support:** <https://elijah-ang.github.io/Data-Science-Python-Playground/help.html>

Both pages were reachable with HTTP 200 on 2026-09-04. Confirm they remain public and match the final binary before submission.

## Submission-time checks — do not paste this section into Review Notes

- Replace the candidate version/build with the exact archive values.
- Confirm the privacy-policy and support URLs are entered in their dedicated App Store Connect fields.
- Confirm the submitted binary still contains no ads, advertising SDK, or in-app purchase surface. If that changes, rewrite these notes and reconcile the privacy disclosures.
- Attach the final screenshots and any optional app preview.
- Complete the age-rating, content-rights, App Privacy, export-compliance, and seller/account fields in App Store Connect.
- Keep the reviewer path aligned with the actual build; remove any step that is not present or functional.
