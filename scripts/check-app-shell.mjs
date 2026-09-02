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
  "data/ml-embedded-datasets.js"
]) {
  await fs.access(path.join(dist, file));
}

const serviceWorker = await fs.readFile(path.join(root, "service-worker.js"), "utf8");
for (const match of serviceWorker.matchAll(/"\.\/([^"?]+)"/g)) {
  const relative = match[1];
  if (!relative) continue;
  await fs.access(path.join(dist, relative));
}

console.log("App shell, PWA metadata, local assets, and Capacitor configuration verified.");
