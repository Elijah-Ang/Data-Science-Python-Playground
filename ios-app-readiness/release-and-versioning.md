# Release and Versioning Rules

## Source traceability

- `main` remains the GitHub Pages release branch; feature work is merged through a reviewed pull request.
- `dist/` and `ios/App/App/public/` are generated artifacts and are not edited by hand.
- `scripts/build-web.mjs` records the source commit in `build-info.json` for both delivery surfaces.
- A native archive must be built from a clean, tested commit and recorded in the tracker with its commit, marketing version, and build number.

## Version fields

- `package.json` holds the shared product version.
- Xcode `MARKETING_VERSION` mirrors the public version, such as `1.0.0`.
- Xcode `CURRENT_PROJECT_VERSION` is an integer and increases for every uploaded build, including rebuilds of the same public version.

## Release gates

1. Run `npm ci`, `npm run check`, the representative Python runtime suite, and the bundled-runtime browser smoke test.
2. Run `npm run build:web` and verify the GitHub Pages artifact is compact and does not contain the native Pyodide bundle.
3. Run `npm run ios:sync` and build the Xcode target with the intended signing team.
4. Test a clean install, offline relaunch with bundled datasets, CSV/chart sharing, rotation, keyboard, VoiceOver, and the core analysis/ML journeys on iPhone and iPad.
5. Archive, validate, and upload; record the App Store Connect build and TestFlight result in the tracker.
6. Merge/publish the web artifact independently. Publishing web source never silently changes an installed app binary.
