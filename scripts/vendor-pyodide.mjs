import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const VERSION = "0.26.4";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "vendor", "pyodide");
const roots = ["pandas", "numpy", "matplotlib", "scipy", "scikit-learn", "micropip"];
const coreFiles = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function save(url, destination, expectedHash = null) {
  try {
    const existing = await fs.readFile(destination);
    const existingHash = crypto.createHash("sha256").update(existing).digest("hex");
    if (existing.length > 0 && (!expectedHash || existingHash === expectedHash)) {
      console.log(`Reused ${path.relative(root, destination)} (${Math.ceil(existing.length / 1024)} KiB)`);
      return;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const bytes = await fetchBytes(url);
  if (expectedHash) {
    const actual = crypto.createHash("sha256").update(bytes).digest("hex");
    if (actual !== expectedHash) throw new Error(`Checksum mismatch for ${path.basename(destination)}`);
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
  console.log(`Saved ${path.relative(root, destination)} (${Math.ceil(bytes.length / 1024)} KiB)`);
}

await fs.mkdir(output, { recursive: true });
for (const file of coreFiles) await save(`${CDN}${file}`, path.join(output, file));

const lock = JSON.parse(await fs.readFile(path.join(output, "pyodide-lock.json"), "utf8"));
const selected = new Set();
const visit = name => {
  if (selected.has(name)) return;
  const entry = lock.packages[name];
  if (!entry) throw new Error(`Pyodide package is absent from the ${VERSION} lock: ${name}`);
  selected.add(name);
  for (const dependency of entry.depends || []) visit(dependency);
};
for (const name of roots) visit(name);

for (const name of [...selected].sort()) {
  const entry = lock.packages[name];
  await save(`${CDN}${entry.file_name}`, path.join(output, entry.file_name), entry.sha256);
}

const seabornMetadata = await fetch("https://pypi.org/pypi/seaborn/0.13.2/json").then(response => {
  if (!response.ok) throw new Error(`Could not resolve seaborn wheel (${response.status})`);
  return response.json();
});
const seabornWheel = seabornMetadata.urls.find(file => file.filename === "seaborn-0.13.2-py3-none-any.whl");
if (!seabornWheel) throw new Error("Could not find the pinned seaborn 0.13.2 wheel.");
await save(seabornWheel.url, path.join(output, "wheels", seabornWheel.filename), seabornWheel.digests.sha256);

await fs.writeFile(
  path.join(output, "runtime-manifest.json"),
  `${JSON.stringify({
    pyodideVersion: VERSION,
    directPackages: roots,
    packageClosure: [...selected].sort(),
    seabornWheel: seabornWheel.filename,
    generatedAt: new Date().toISOString()
  }, null, 2)}\n`
);

console.log(`Prepared a native-only offline Pyodide bundle with ${selected.size} locked packages.`);
