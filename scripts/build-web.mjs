import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "dist");
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

const files = [
  ".nojekyll",
  "index.html",
  "tutorial.html",
  "playground.html",
  "ml.html",
  "privacy.html",
  "about.html",
  "help.html",
  "acknowledgements.html",
  "offline.html",
  "tutorial.css",
  "landing.css",
  "playground-shared.css",
  "tutorial.js",
  "landing.js",
  "ml-app.js",
  "manifest.webmanifest",
  "service-worker.js"
];
const directories = ["assets", "data"];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const file of files) {
  await fs.copyFile(path.join(root, file), path.join(output, file));
}
for (const directory of directories) {
  await fs.cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

if (process.env.DSPP_NATIVE_RUNTIME === "1") {
  const localRuntime = path.join(root, "vendor", "pyodide");
  await fs.access(localRuntime);
  await fs.cp(localRuntime, path.join(output, "pyodide"), { recursive: true });
}

await build({
  entryPoints: [path.join(root, "app", "app-platform.js")],
  outfile: path.join(output, "app-platform.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["safari16"],
  minify: true,
  legalComments: "none"
});

let commit = "working-tree";
try {
  commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
} catch {
  // A source archive without Git metadata is still buildable.
}

await fs.writeFile(
  path.join(output, "build-info.json"),
  `${JSON.stringify({ version: packageJson.version, commit, builtAt: new Date().toISOString() }, null, 2)}\n`
);

console.log(`Built shared web assets in ${path.relative(root, output)} (${commit}).`);
