import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const runtime = path.join(root, "vendor", "pyodide");
const output = path.join(root, "assets", "licenses");

const remoteLicenses = [
  ["fonts/JetBrains-Mono-OFL-1.1.txt", "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt"],
  ["fonts/Nunito-OFL-1.1.txt", "https://raw.githubusercontent.com/googlefonts/nunito/main/OFL.txt"],
  ["fonts/Silkscreen-OFL-1.1.txt", "https://raw.githubusercontent.com/googlefonts/silkscreen/main/OFL.txt"],
  ["native/capacitor-swift-pm-8.5.0-MIT.txt", "https://raw.githubusercontent.com/ionic-team/capacitor-swift-pm/8.5.0/LICENSE.md"],
  ["native/ion-ios-filesystem-1.1.2-MIT.txt", "https://raw.githubusercontent.com/ionic-team/ion-ios-filesystem/1.1.2/LICENSE"],
  ["runtime/Pyodide-0.26.4-MPL-2.0.txt", "https://raw.githubusercontent.com/pyodide/pyodide/0.26.4/LICENSE"],
  ["runtime/CPython-3.12.1-PSF.txt", "https://raw.githubusercontent.com/python/cpython/v3.12.1/LICENSE"],
  ["runtime/OpenBLAS-0.3.26-BSD-3-Clause.txt", "https://raw.githubusercontent.com/OpenMathLib/OpenBLAS/v0.3.26/LICENSE"],
];

const localPackageLicenses = [
  "@capacitor/core",
  "@capacitor/browser",
  "@capacitor/filesystem",
  "@capacitor/share",
  "@capacitor/splash-screen",
  "@capacitor/status-bar",
  "@capacitor/ios",
  "@capacitor/synapse",
];

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`License download failed (${response.status}): ${url}`);
  return response.text();
}

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

const manifest = [];
for (const [relative, url] of remoteLicenses) {
  const destination = path.join(output, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, await fetchText(url));
  manifest.push({ source: url, file: relative });
}

for (const packageName of localPackageLicenses) {
  const packageRoot = path.join(root, "node_modules", ...packageName.split("/"));
  const metadata = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8"));
  const licenseLabel = typeof metadata.license === "string"
    ? metadata.license.replace(/[^a-z0-9.-]+/gi, "-")
    : "NOTICE";
  const relative = `javascript/${packageName.replace("/", "-")}-${metadata.version}-${licenseLabel}.txt`;
  const destination = path.join(output, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const licenseFile = (await Promise.all(["LICENSE", "LICENSE.md", "LICENSE.txt"].map(async file => {
    try {
      await fs.access(path.join(packageRoot, file));
      return file;
    } catch {
      return null;
    }
  }))).find(Boolean);
  if (!licenseFile) throw new Error(`No package license found for ${packageName}`);
  await fs.copyFile(path.join(packageRoot, licenseFile), destination);
  manifest.push({ source: `${packageName}@${metadata.version}`, file: relative });
}

const runtimeFiles = (await fs.readdir(runtime))
  .filter(file => file.endsWith(".whl"))
  .map(file => path.join(runtime, file));
runtimeFiles.push(...(await fs.readdir(path.join(runtime, "wheels")))
  .filter(file => file.endsWith(".whl"))
  .map(file => path.join(runtime, "wheels", file)));

for (const wheel of runtimeFiles.sort()) {
  const packageName = path.basename(wheel, ".whl");
  const entries = execFileSync("unzip", ["-Z1", wheel], { encoding: "utf8" })
    .split("\n")
    .filter(entry => /(^|\/)(license|copying|notice|copyright)/i.test(entry));
  if (!entries.length) throw new Error(`No embedded license notice found in ${path.basename(wheel)}`);
  for (const entry of entries) {
    const safeName = entry.replaceAll("/", "__");
    const relative = `runtime/wheels/${packageName}/${safeName}`;
    const destination = path.join(output, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, execFileSync("unzip", ["-p", wheel, entry]));
    manifest.push({ source: path.relative(root, wheel), archiveEntry: entry, file: relative });
  }
}

await fs.writeFile(path.join(output, "manifest.json"), `${JSON.stringify({ generatedFrom: "Pyodide 0.26.4 native runtime", files: manifest }, null, 2)}\n`);
console.log(`Prepared ${manifest.length} third-party license and notice files in assets/licenses.`);
