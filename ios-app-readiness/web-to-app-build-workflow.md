# Web-to-App Build Workflow

## Goal

Keep one maintainable website codebase while delivering both:

- the existing browser site through GitHub Pages; and
- a packaged iPhone/iPad app built from the same tested HTML, CSS, JavaScript, and data files.

## Source-of-truth rule

The files in the main project remain authoritative. Do not create a second hand-edited copy of the interface for iOS. A native build should synchronise the web assets from the selected project commit into the app bundle.

## Delivery flow

```text
site source files
      ├── test in browser ──> GitHub Pages release
      └── synchronise assets ──> Capacitor/Xcode build ──> TestFlight/App Store release
```

## What happens after an edit

1. Edit the existing site scripts, styles, HTML, or data.
2. Run the current browser checks and review the affected journey.
3. Publish the web version to GitHub Pages as usual.
4. Synchronise the same tested commit into the native project.
5. Test on iPhone and iPad, then archive and distribute a new app build when the change is ready.

The installed App Store binary cannot be treated as a live GitHub Pages window. A new native build is required for production changes; this is why the app must not depend on the live site URL.

## Mac surface

The GitHub Pages site remains the default computer experience. Once the iPad/iPhone app is stable, test one of these native options:

- make the iPad app available on compatible Apple-silicon Macs; or
- enable and optimise a Mac Catalyst target.

The choice should be recorded in the tracker after a real build is tested. A browser version and a native Mac target can coexist.

## Implemented commands

```bash
npm ci
npm run check
npm run build:web
npm run ios:sync
npm run ios:open
```

`npm run build:web` creates the compact browser artifact in `dist/`. `npm run ios:sync` first prepares the pinned native-only Python runtime, builds the local asset artifact, then synchronises it into the ignored `ios/App/App/public/` directory. Generated web assets are not hand-edited.

The builder records the source Git commit in `dist/build-info.json`. Release versions are kept in `package.json`; the Xcode marketing version and build number must be updated before an archive is distributed.

## Acceptance criteria

- A web edit can be traced to the GitHub Pages commit and the native app build commit.
- The iOS app loads local bundled assets and does not silently fall back to GitHub Pages.
- Browser, iPhone, and iPad checks are run before an app update is submitted.
- Mac support is described accurately as browser, Apple-silicon iPad-app availability, or Mac Catalyst—not as an untested promise.
