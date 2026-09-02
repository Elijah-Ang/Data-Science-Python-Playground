# Advertising and Consent Plan

## Decision for version 1

Use Google AdMob through the maintained `@capacitor-community/admob` Capacitor 8 plugin. Version 1 will use banner ads only. No ad SDK is present in the current website or native build; integration waits for the owner-created AdMob account, app registration, and test ad-unit IDs.

AdMob is the lowest-friction fit among the evaluated iOS networks: it has documented iOS banner, consent, and privacy flows; the community plugin supports Capacitor 8; and there is no SDK fee. AppLovin MAX adds more onboarding and domain/app-ads.txt work, while Unity LevelPlay lacks a direct Capacitor path. Revenue is not guaranteed, and Google requires an account/payment profile before production monetisation.

## Placement policy

- One anchored adaptive banner may appear at the bottom of Home, Help/About, lesson/content, and completed-results surfaces.
- The banner must sit inside safe-area-aware layout and never cover navigation, code, outputs, or controls.
- Hide it while the software keyboard is open, Python is executing, or the user is actively editing in the Playground or machine-learning workspace.
- Let the SDK manage refresh. Do not create a rapid custom refresh timer.
- Do not use dataset contents, code, model inputs, or learning activity for targeting.

## Interstitial decision

Do **not** show a timed interstitial every 15 minutes. A timer can interrupt a task in progress and conflicts with Google guidance that interstitials belong at natural transition points. Version 1 has no interstitials.

If later testing justifies them, an interstitial may appear only after an explicit completion or route transition, never at launch, exit, during execution, or while editing. Start with a maximum of one per 30 minutes per active session and make the close path clear.

## Privacy and consent boundary

- Do not add Firebase Analytics or another analytics product with the ad integration.
- Start with privacy-preserving/non-personalised requests where available, while recognising that the SDK can still process IP address, device identifiers, advertising data, performance data, and interactions.
- Refresh Google User Messaging Platform consent information on every launch and expose the required privacy-options entry point.
- Do not request IDFA or show App Tracking Transparency unless cross-app/site tracking is deliberately introduced and separately approved.
- Before enabling production ads, update this privacy policy, App Store App Privacy answers, age rating, and `PrivacyInfo.xcprivacy` from the exact shipped SDK/configuration.

## Remaining owner prerequisites

1. Create/verify the AdMob account and payment profile.
2. Register the production iOS app after the App Store bundle record exists.
3. Create banner test/production ad units and provide their IDs.
4. Approve the final regional consent messages in AdMob.

## References

- Capacitor Community AdMob plugin: https://github.com/capacitor-community/admob
- Google iOS quick start: https://developers.google.com/admob/ios/quick-start
- Google iOS banner guidance: https://developers.google.com/admob/ios/banner
- Google iOS privacy/data disclosure: https://developers.google.com/admob/ios/privacy/data-disclosure
- Google User Messaging Platform: https://developers.google.com/admob/ios/privacy
- Google disallowed interstitial implementations: https://support.google.com/admob/answer/6201362
- Google recommended interstitial implementations: https://support.google.com/admob/answer/6201350
- AdMob account setup: https://support.google.com/admob/answer/7356219
