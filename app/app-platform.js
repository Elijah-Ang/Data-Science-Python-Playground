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

async function shareBlob(blob, filename, title = "Data Science Playground export") {
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
  notice.textContent = offline ? "Offline · local features remain available" : "Back online";
  notice.classList.toggle("is-visible", offline);
  if (!offline) {
    notice.classList.add("is-restored");
    window.setTimeout(() => notice.classList.remove("is-restored"), 1800);
  }
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
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Status-bar support varies by native target and OS version.
  }
  try { await SplashScreen.hide(); } catch { /* The splash may already be hidden. */ }
  document.documentElement.dataset.nativePlatform = platform;
}

if (!native && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}

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
