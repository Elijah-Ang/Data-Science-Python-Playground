import fs from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
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
  "appearance.js",
  "notebook-session.js",
  "worker-bridge.js",
  "output-ui.js",
  "dataset-dictionary.js",
  "manifest.webmanifest",
  "service-worker.js"
];
const directories = ["data", "assets/tour-captures"];
const nativeRuntimeFiles = [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
  "runtime-manifest.json",
  "wheels/seaborn-0.13.2-py3-none-any.whl"
];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const file of files) {
  await fs.copyFile(path.join(root, file), path.join(output, file));
}
for (const directory of directories) {
  await fs.cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

// Copy only assets referenced by maintained entry points, styles and metadata.
const productionAssets = new Set();
const scanned = new Set();
async function scanReferences(file) {
  if (scanned.has(file)) return;
  scanned.add(file);
  const source = await fs.readFile(path.join(root,file), 'utf8');
  const references = [...source.matchAll(/(?:["'(])((?:assets\/)[^"'()\s<>?]+)(?:[?][^"'<>]*)?["')]/g)].map(match => match[1]);
  if (file.endsWith('.css')) for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const value=match[1]; if (!value.startsWith('data:') && !value.startsWith('http')) references.push(path.posix.join(path.posix.dirname(file),value));
  }
  for (const asset of references) {
    if (!asset.startsWith('assets/') || productionAssets.has(asset)) continue;
    try { if (!(await fs.stat(path.join(root,asset))).isFile()) continue; } catch { continue; }
    productionAssets.add(asset);
    if (/\.(css|json)$/.test(asset)) await scanReferences(asset);
  }
}
for (const file of files.filter(file => /\.(html|css|js|webmanifest)$/.test(file))) await scanReferences(file);
// License texts are accessed through their manifest and must accompany the app.
await fs.cp(path.join(root,'assets/licenses'),path.join(output,'assets/licenses'),{recursive:true});
for (const asset of [...productionAssets].sort()) {
  await fs.mkdir(path.dirname(path.join(output,asset)),{recursive:true});
  await fs.copyFile(path.join(root,asset),path.join(output,asset));
}

if (process.env.DSPP_NATIVE_RUNTIME === "1") {
  const localRuntime = path.join(root, "vendor", "pyodide");
  await fs.access(localRuntime);
  for (const file of nativeRuntimeFiles) {
    await fs.access(path.join(localRuntime, file));
  }
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

await fs.writeFile(path.join(output,'data-runtime.js'),'window.DataRuntimeSource = '+JSON.stringify((await fs.readFile(path.join(root,'table-serialization.py'),'utf8'))+'\n'+(await fs.readFile(path.join(root,'data-runtime.py'),'utf8')))+';\n');
await fs.writeFile(path.join(output,'runtime-contracts.js'),'window.DataframeSerializerSource = '+JSON.stringify(await fs.readFile(path.join(root,'table-serialization.py'),'utf8'))+';\nwindow.ScientificValidatorSource = '+JSON.stringify(await fs.readFile(path.join(root,'scientific-validators.py'),'utf8'))+';\n');
let commit = "working-tree";
try {
  commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
} catch {
  // A source archive without Git metadata is still buildable.
}

const hash = content => createHash('sha256').update(content).digest('hex');
async function inventory(directory, prefix='') {
  const entries=[];
  for (const item of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const relative=prefix+item.name;
    if (item.isDirectory()) entries.push(...await inventory(path.join(directory,item.name),relative+'/'));
    else {const content=await fs.readFile(path.join(directory,item.name)); entries.push({path:relative,bytes:content.length,sha256:hash(content)});}
  }
  return entries;
}
const entries=(await inventory(output)).filter(entry=>entry.path!=='service-worker.js');
const contentId=hash(JSON.stringify(entries));
let dirty=null;
try {dirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'}).trim());} catch {}
await fs.writeFile(path.join(output,'asset-manifest.json'),JSON.stringify({contentId,files:entries},null,2)+'\n');
await fs.writeFile(path.join(output,'build-info.json'),JSON.stringify({version:packageJson.version,commit,dirty,contentId,builtAt:new Date().toISOString(),bytes:entries.reduce((sum,file)=>sum+file.bytes,0)},null,2)+'\n');
const urls=new Set(['./',...entries.filter(entry=>!entry.path.startsWith('pyodide/')).map(entry=>'./'+entry.path),'./build-info.json','./asset-manifest.json']);
for (const file of files.filter(file=>file.endsWith('.html'))) {
  const html=await fs.readFile(path.join(output,file),'utf8');
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)) {
    const url=match[1]; if (/^(?:https?:|data:|mailto:)/.test(url)) continue;
    const pathname=url.split('?')[0];
    try {if ((await fs.stat(path.join(output,pathname))).isFile()) urls.add('./'+url);} catch {}
  }
}
const worker=(await fs.readFile(path.join(root,'service-worker.js'),'utf8')).replace("'dspp-app-shell-source'",JSON.stringify('dspp-app-shell-'+contentId.slice(0,16))).replace('const APP_SHELL = [];','const APP_SHELL = '+JSON.stringify([...urls].sort())+';');
await fs.writeFile(path.join(output,'service-worker.js'),worker);
console.log(`Built shared web assets in ${path.relative(root,output)} (${commit}, ${contentId.slice(0,12)}, dirty=${dirty}, ${entries.reduce((sum,file)=>sum+file.bytes,0)} bytes).`);
