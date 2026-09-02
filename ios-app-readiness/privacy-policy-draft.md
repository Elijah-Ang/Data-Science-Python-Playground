# Privacy Policy Draft — Data Playground

**Status:** Source page created at `../privacy.html`; the policy still requires owner review, final native/SDK reconciliation, and a recorded public GitHub Pages URL before it is used as the App Store privacy-policy URL.

**Last updated:** 2026-09-02

## 1. Who this policy is for

This policy describes the planned privacy treatment for Data Playground, the iPhone/iPad application built from the existing browser project. The service is intended to be free and usable without an account.

## 2. Contact

The person responsible for this project is:

- **Name:** Elijah Ang
- **Email:** `elijahang77@gmail.com`
- **Optional support phone:** +65 8822 7539

## 3. Information processed by the app

The app may process the following information when a user chooses to use the related features:

- Bundled CSV files, dataset values, Python code, notebook inputs, model settings, charts, and generated results.
- Basic preferences or temporary working state needed to keep the current screen functioning.
- Messages and contact details that a user voluntarily sends to support.

The current product is designed to process bundled datasets and in-session analysis locally in the browser or app web view. These data are not sent to a project-operated server by default. This statement must be re-checked against the final native build and every integrated SDK before publication.

## 4. How information is used

Information is used to:

- run data analysis and machine-learning examples;
- display tables, charts, diagnostics, and learning guidance;
- save or export a result when the user explicitly requests it through the device or browser; and
- respond to support requests.

The project does not currently include user accounts, cloud synchronisation, analytics, or cross-app tracking.

## 5. Storage and retention

The app keeps active analysis work only in temporary memory. Work may remain available while iOS keeps the app process alive, but it is not restored after the app is terminated or swiped away. Files saved or exported by the user are controlled by the operating system or browser destination selected by the user. The project does not provide notebook history, a cloud account, or project-operated storage for analysis work.

Users should avoid entering information they are not authorised to process, including confidential, regulated, or personally identifying data.

## 6. Network requests and third-party services

The browser version uses self-hosted fonts but may request the Python runtime or package resources from third-party hosts and may open external dataset-source links. Those hosts may receive ordinary technical request information such as an IP address and browser/device information under their own policies. The native app packages its Python runtime and required assets locally and does not depend on the live GitHub Pages site.

Advertising is planned as a separate feature. Ads are not covered as an enabled feature by this draft. Before an ad SDK is added, this policy must identify the provider, the data the SDK processes, the ad-personalisation choices available to users, and any consent or Apple permission flow. Bundled dataset contents and learning activity should not be used to target ads.

The app may also link to third-party websites. Those websites operate under their own privacy policies, and opening a link may take the user outside the app.

## 7. Sharing and sale

The project does not intentionally sell or rent analysis data. A user may choose to share an exported file or chart through the browser, Files app, or system share sheet; that sharing is controlled by the user and the selected destination.

## 8. Children

The final audience classification and age-rating decision are still pending. Before publication, the owner must confirm whether the app is directed to children or is a general-audience educational tool. The advertising configuration, data practices, and store disclosures must match that decision.

## 9. User requests

For questions about this policy or a support/privacy request, contact Elijah Ang using the confirmed email address above. Requests may require enough information to identify the relevant interaction, and applicable law may affect what can be provided.

## 10. Security

Reasonable measures will be used to protect the project and its release infrastructure. No internet-connected software can guarantee absolute security. Users should keep their devices and operating systems updated and should not use data they do not have permission to process.

## 11. Changes to this policy

This policy will be updated when the app’s data flows, native dependencies, advertising setup, persistence model, or support process changes. The effective date will be updated whenever a revised policy is published.

## Publication checklist

- Confirm the public support email is displayed consistently as `elijahang77@gmail.com`.
- Decide whether the phone number should be displayed publicly.
- Reconcile this draft with the final native SDK list and network requests.
- Publish `privacy.html`, record its public GitHub Pages URL, and add that URL to App Store Connect and the app’s Privacy/About surface.
- Complete Apple App Privacy answers and any advertising consent disclosures.
- Obtain appropriate legal review before publication.
