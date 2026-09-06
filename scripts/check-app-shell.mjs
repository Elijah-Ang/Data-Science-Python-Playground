import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const htmlFiles = ["index.html", "tutorial.html", "playground.html", "ml.html", "privacy.html", "about.html", "help.html", "acknowledgements.html", "offline.html"];

const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.start_url, "./index.html");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some(icon => icon.sizes === "512x512"));

for (const file of htmlFiles) {
  const source = await fs.readFile(path.join(root, file), "utf8");
  assert.match(source, /viewport-fit=cover/, `${file} must support iOS safe areas`);
  assert.match(source, /app-platform\.js/, `${file} must load the shared app platform bridge`);
  assert.doesNotMatch(source, /fonts\.(googleapis|gstatic)\.com/, `${file} must not depend on Google Fonts`);
  await fs.access(path.join(dist, file));
}

const config = JSON.parse(await fs.readFile(path.join(root, "capacitor.config.json"), "utf8"));
assert.equal(config.appId, "com.elijahang.datascienceplayground");
assert.equal(config.webDir, "dist");

for (const file of [
  "app-platform.js",
  "landing.css",
  "landing.js",
  "tutorial.css",
  "tutorial.js",
  "playground-shared.css",
  "build-info.json",
  "manifest.webmanifest",
  "service-worker.js",
  "assets/icons/app-icon-512.png",
  "assets/fonts/nunito-latin.woff2",
  "assets/licenses/manifest.json",
  "data/ml-embedded-datasets.js",
  ...[
    "mobile-data",
    "mobile-guide",
    "mobile-ml",
    "tablet-data",
    "tablet-guide",
    "tablet-ml",
    "portrait-data",
    "portrait-guide",
    "portrait-ml",
    "wide-data",
    "wide-guide",
    "wide-ml"
  ].map(name => `assets/tour-captures/${name}.png`)
]) {
  await fs.access(path.join(dist, file));
}

const serviceWorker = await fs.readFile(path.join(root, "service-worker.js"), "utf8");
for (const match of serviceWorker.matchAll(/"\.\/([^"?]+)"/g)) {
  const relative = match[1];
  if (!relative) continue;
  await fs.access(path.join(dist, relative));
}

const landingHtml = await fs.readFile(path.join(root, "index.html"), "utf8");
const landingCss = await fs.readFile(path.join(root, "landing.css"), "utf8");
const dataHtml = await fs.readFile(path.join(root, "playground.html"), "utf8");
const mlHtml = await fs.readFile(path.join(root, "ml.html"), "utf8");
const mlApp = await fs.readFile(path.join(root, "ml-app.js"), "utf8");
const playgroundCss = await fs.readFile(path.join(root, "playground-shared.css"), "utf8");
const portraitMedia = "(max-width: 720px), (orientation: portrait)";
assert.equal(
  [...landingHtml.matchAll(/<source media="([^"]+)" srcset="assets\/landing\/(?:data-playground-mobile-source|gate-glow-mobile)\.(?:png|webp)">/g)]
    .filter(match => match[1] === portraitMedia).length,
  2,
  "The landing scene and gate glow must use portrait artwork at every portrait viewport width, including a 1024px iPad."
);
assert.ok(
  landingCss.includes(`@media ${portraitMedia} {`),
  "The portrait scene hitbox must follow the same orientation contract as its artwork."
);
assert.doesNotMatch(
  `${landingHtml}\n${landingCss}`,
  /\(orientation:\s*portrait\)\s+and\s+\(max-width:\s*900px\)/,
  "Do not restore the 900px portrait cap; 13-inch iPads are 1024 CSS pixels wide in portrait."
);

for (const [name, html] of [["Data Playground", dataHtml], ["Machine Learning", mlHtml]]) {
  for (const label of ["Home", "Data Playground", "Machine Learning"]) {
    assert.match(html, new RegExp(`<a[^>]+class="[^"]*mode-link[^"]*"[^>]+aria-label="${label}"`), `${name} must expose an accessible ${label} mode link.`);
  }
  assert.equal(
    (html.match(/class="mode-icon"/g) || []).length,
    3,
    `${name} must include all three pixel icons and visible navigation labels.`
  );
  assert.match(html, /id="outputStatus"[^>]+role="status"[^>]+aria-live="polite"/, `${name} must announce notebook run status.`);
  assert.ok(
    html.indexOf('id="notebookPanel"') < html.indexOf('class="output-panel"'),
    `${name} must place the notebook before output in the compact layout source order.`
  );
}
assert.match(dataHtml, /id="moreTasksToggle"[^>]+aria-expanded="false"[^>]+aria-controls="moreTasksPanel"/, "More tasks must expose its disclosure state and controlled panel.");
assert.match(dataHtml, /function captureFocusTarget\(\)/, "Data Playground must retain focus across notebook rerenders.");
assert.match(mlApp, /function captureFocusTarget\(\)/, "Machine Learning must retain focus across notebook rerenders.");
assert.match(landingCss, /\.gate-hitbox:focus-visible\s*\{[^}]*outline:/s, "The landing gate must have a visible keyboard focus indicator.");
assert.match(playgroundCss, /\.cell-action\s*\{[^}]*min-height:\s*44px/s, "Mobile notebook actions must provide 44px touch targets.");
assert.match(playgroundCss, /\.mode-link \.mode-icon[^}]*shape-rendering:\s*crispEdges/s, "Navigation icons must retain pixel edges.");
assert.match(playgroundCss, /\.mode-link:focus-visible[^}]*outline-offset:\s*-3px/s, "The switcher must keep keyboard focus inside its clipped frame.");
assert.match(
  playgroundCss,
  /body\[data-playground\] \.notebook-panel \{ order: 2; width: 100%; \}/,
  "The compact layout must place the cell stream before the mobile controls."
);
assert.match(
  playgroundCss,
  /body\[data-playground\] \.notebook-actions \{[\s\S]*?order: 3;/,
  "The compact layout must place notebook actions after the cell stream."
);
assert.match(
  playgroundCss,
  /body\[data-playground\] \.notebook-actions \.toolbar-button \{\s*min-height: 44px;\s*\}/,
  "Compact notebook controls must keep comfortable touch targets."
);
assert.match(
  playgroundCss,
  /body\[data-playground\] \.output-panel:not\(\.has-global-message\) \.output-actions,[\s\S]*?body\[data-playground\] \.output-panel:not\(\.has-global-message\) \.output-head > \.toolbar-button \{[\s\S]*?order: 4;/,
  "The compact layout must place export actions after cell outputs."
);
assert.match(
  playgroundCss,
  /body\[data-playground\] \.output-panel:not\(\.has-global-message\) \.output-action,[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px;/,
  "Compact export controls must keep comfortable touch targets."
);
assert.match(
  playgroundCss,
  /body\[data-playground\] \.route-tools \{ order: 5; \}[\s\S]*?body\[data-playground\] \.route-strip \{ order: 6; \}[\s\S]*?body\[data-playground\] \.more-tasks-panel \{ order: 7; \}/,
  "The compact layout must place suggested-route shortcuts after the notebook controls."
);
assert.doesNotMatch(
  playgroundCss,
  /body\[data-playground\] \.output-panel \{ order:\s*-1; \}/,
  "The shared compact layout must not move output above notebook cells."
);
assert.doesNotMatch(dataHtml, /Six small moves from first look to evidence\./, "Data Suggested Route must not keep the removed helper sentence.");
assert.doesNotMatch(mlHtml, /Prediction Workflow, each step answers one question\./, "ML Suggested Route must not keep the removed helper sentence.");
assert.match(playgroundCss, /\.notebook-panel\s*\{[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s, "The notebook must own vertical scrolling without chaining to the page.");
assert.match(playgroundCss, /\.output-body\s*\{[^}]*overflow:\s*auto;[^}]*overscroll-behavior:\s*contain;/s, "The output history must own vertical scrolling without chaining to the page.");
assert.match(
  playgroundCss,
  /@media \(max-width: 1120px\) \{[\s\S]*?body\[data-playground\] \.cell-inline-output \{\s*display: grid;/s,
  "The compact layout must expose cell outputs directly below their cells."
);
assert.match(
  playgroundCss,
  /@media \(max-width: 1120px\) \{[\s\S]*?body\[data-playground\] \.output-panel:not\(\.has-global-message\),[\s\S]*?body\[data-playground\] \.output-panel:not\(\.has-global-message\) \.output-head \{\s*display: contents;[\s\S]*?body\[data-playground\] \.output-panel\.has-global-message \{[\s\S]*?display: flex;/s,
  "The compact layout must flatten the duplicate global output shell while retaining temporary status messages."
);
assert.match(mlApp, /if \(mobileLayoutQuery\.matches\) \{[\s\S]*?cell-inline-output[\s\S]*?renderOutputItem\(cell\)/s, "Machine Learning must render completed outputs into mobile cell hosts.");

console.log("App shell, PWA metadata, local assets, and Capacitor configuration verified.");
