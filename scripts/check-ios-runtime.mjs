import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const nativeRuntimeFiles = [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
  "runtime-manifest.json",
  "wheels/seaborn-0.13.2-py3-none-any.whl"
];
const bundleRoots = [
  path.join(root, "dist", "pyodide"),
  path.join(root, "ios", "App", "App", "public", "pyodide")
];

for (const bundleRoot of bundleRoots) {
  for (const file of nativeRuntimeFiles) {
    const filename = path.join(bundleRoot, file);
    const stats = await fs.stat(filename);
    assert.ok(stats.isFile() && stats.size > 0, `${filename} must be a non-empty file`);
  }

  const manifest = JSON.parse(await fs.readFile(path.join(bundleRoot, "runtime-manifest.json"), "utf8"));
  assert.equal(manifest.pyodideVersion, "0.26.4", `${bundleRoot} has the wrong Pyodide version`);
  assert.equal(manifest.seabornWheel, "seaborn-0.13.2-py3-none-any.whl", `${bundleRoot} has the wrong Seaborn wheel`);
}

console.log("Bundled Pyodide runtime verified in dist and the iOS app payload.");
