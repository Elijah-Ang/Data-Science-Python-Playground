# Current Web Runtime Inventory

## Product surface

The active product is a static learning and analysis tool delivered through GitHub Pages and a local Capacitor shell:

- Welcome landing page: `index.html`, `landing.css`, `landing.js`
- Product tutorial: `tutorial.html`, `tutorial.css`, `tutorial.js`
- Data Playground: `playground.html`
- Machine Learning Playground: `ml.html`, `ml-app.js`
- Bundled datasets: `data/`
- Automated checks: `tests/` and `.github/workflows/`

## Existing strengths

- Editable Python notebook cells.
- Browser-side execution through Pyodide in a Web Worker.
- Data inspection, wrangling, charts, model training, diagnostics, and guided/practice flows.
- Generated CSV and chart downloads.
- Responsive layouts and touch-oriented pointer interactions are already present in parts of the UI.
- The current project checks JavaScript syntax, state invalidation, teaching metadata, and generated ML routes. The fast syntax/state/teaching/route checks pass in the inspected release copy.

## App conversion risks

| Area | Current behaviour | iOS implication |
|---|---|---|
| Python runtime | Web release fetches pinned Pyodide 0.26.4 on demand; native release packages the required runtime and wheels locally | Validate cold start, memory, and offline recovery on physical devices |
| Fonts | JetBrains Mono, Nunito, and Silkscreen are self-hosted | Confirm rendering and font licenses in the release archive |
| Persistence | Active work stays in memory only; notebooks and recent work are not restored after the process terminates | Validate foreground/background continuity and fresh-canvas relaunch behavior |
| Export | Browser uses downloads; native bridge writes temporary files and opens Share Sheet | Validate Files/Share destinations on iPhone and iPad |
| External sources | Browser opens new tabs; native bridge uses Capacitor Browser | Validate dismissal and iPad presentation |
| Native project | Capacitor/Xcode project, privacy manifest, icons, and launch assets exist | Full Xcode, signing, simulator/device builds remain required |
| Mac delivery | The browser site already works as the computer surface; no native Mac target has been validated | Keep GitHub Pages available, then test Apple-silicon iPad-app availability or Mac Catalyst |
| Advertising | No ad SDK or analytics flow is currently present | Treat ads as a separate consent/privacy workstream; do not let an ad SDK silently add tracking |
| Permissions | No active account, location, camera, microphone, or notification flow was found | Keep the first release permission-light |

## Scope decisions to preserve

- Keep the original dataset copy protected during exploration.
- Keep the ML final holdout sealed until the final step.
- Keep the free/no-account model for the first release unless the product scope changes.
- Keep in-app purchases on hold for now; plan advertising separately with no analytics or cross-app tracking initially.
- Treat the web release and iOS release as separate build targets from the same source.
- Keep the GitHub Pages/browser version as the computer experience while the native Mac delivery option is validated.
