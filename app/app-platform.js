import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

const native = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const remotePyodideIndex = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const localTestHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const localRuntime = native || (localTestHost && new URLSearchParams(window.location.search).get("runtime") === "local");
const pyodideIndexUrl = localRuntime ? new URL("pyodide/", document.baseURI).href : remotePyodideIndex;
const seabornRequirement = localRuntime
  ? new URL("wheels/seaborn-0.13.2-py3-none-any.whl", pyodideIndexUrl).href
  : "seaborn==0.13.2";

function base64FromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read export."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(blob);
  });
}

async function shareBlob(blob, filename, title = "Data Playground export") {
  if (!native) return false;
  const safeName = String(filename || "playground-export").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const data = await base64FromBlob(blob);
  const path = `exports/${Date.now()}-${safeName}`;
  const written = await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Cache,
    recursive: true
  });
  try {
    await Share.share({ title, url: written.uri, dialogTitle: "Save or share export" });
    return true;
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {});
  }
}

async function shareDataUrl(dataUrl, filename, title) {
  const response = await fetch(dataUrl);
  return shareBlob(await response.blob(), filename, title);
}

async function openExternal(url) {
  const resolved = new URL(url, window.location.href);
  if (!/^https?:$/.test(resolved.protocol)) {
    window.location.href = resolved.href;
    return;
  }
  if (native) await Browser.open({ url: resolved.href, presentationStyle: "popover" });
  else window.open(resolved.href, "_blank", "noopener,noreferrer");
}

let wasOffline = false;
function showConnectivityState() {
  let notice = document.querySelector("[data-app-connectivity]");
  if (!notice) {
    notice = document.createElement("div");
    notice.dataset.appConnectivity = "";
    notice.className = "app-connectivity";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.append(notice);
  }
  const offline = !navigator.onLine;
  notice.textContent = offline ? (native ? "Offline · bundled Python and datasets are available" : "Offline · saved pages may be available; web Python needs a previously loaded runtime") : "Back online";
  notice.classList.toggle("is-visible", offline);
  if (!offline && wasOffline) {
    notice.classList.add("is-restored");
    window.setTimeout(() => notice.classList.remove("is-restored"), 1800);
  }
  wasOffline = offline;
}

function installExternalLinkRouting() {
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download")) return;
    const url = new URL(link.href, window.location.href);
    if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) return;
    event.preventDefault();
    openExternal(url.href).catch(() => { window.location.href = url.href; });
  });
}

async function configureNativeChrome() {
  if (!native) return;
  const theme = document.body?.dataset.theme === "dark" ? "dark" : "light";
  const backgroundColor = getComputedStyle(document.body || document.documentElement)
    .getPropertyValue("--bg")
    .trim() || (theme === "dark" ? "#0c1125" : "#efe8d7");
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // Status-bar overlay support varies by native target and OS version.
  }
  try {
    await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
  } catch {
    // Status-bar text style support varies by native target and OS version.
  }
  try {
    // With overlays disabled on iOS, the plugin owns the safe-area background
    // view above the web view. Keep that view on the same surface as the page.
    await StatusBar.setBackgroundColor({ color: backgroundColor });
  } catch {
    // Background-color support varies by native target and OS version.
  }
  try { await SplashScreen.hide(); } catch { /* The splash may already be hidden. */ }
  document.documentElement.dataset.nativePlatform = platform;
}

if (!native && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", async () => {
    try {
      const registration=await navigator.serviceWorker.register("./service-worker.js");
      const offer=() => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        const button=document.createElement('button'); button.className='app-update'; button.textContent='Update available — save draft and reload';
        button.addEventListener('click',() => {if (window.NotebookSession && !window.NotebookSession.save() && !confirm('Local saving failed. Copy any code you want to keep before updating. Reload anyway?')) return; registration.waiting.postMessage({type:'ACTIVATE_SAVED_UPDATE'}); navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});});
        document.body.append(button);
      };
      offer(); registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',offer));
    } catch {}
  });
}

window.addEventListener("appearancechange", configureNativeChrome);
window.addEventListener("online", showConnectivityState);
window.addEventListener("offline", showConnectivityState);
document.addEventListener("DOMContentLoaded", () => {
  showConnectivityState();
  installExternalLinkRouting();
  configureNativeChrome();
});

window.AppPlatform = Object.freeze({
  native,
  platform,
  localRuntime,
  pyodideIndexUrl,
  seabornRequirement,
  openExternal,
  shareBlob,
  shareDataUrl
});
window.dispatchEvent(new CustomEvent("appplatformready", { detail: { native, platform } }));
