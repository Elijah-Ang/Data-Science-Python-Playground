"""Package the reviewed curricula for HTML viewers that cannot serve sibling files.

The curriculum, rendering, editors, visuals, and graders are the built site files.
Only asset loading and navigation are adapted for a single-file review artifact.
Python continues to use the site's pinned CDN runtime; nothing is published.
"""
import argparse
import base64
import gzip
import json
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def js_json(value):
    return json.dumps(value, ensure_ascii=True).replace("<", "\\u003c")


def asset_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode()


def stylesheet(path):
    text = path.read_text()

    def replace_url(match):
        value = match.group(1).strip(" \"'")
        if value.startswith(("data:", "http:", "https:", "#")):
            return match.group(0)
        local = (path.parent / value.split("?")[0]).resolve()
        if not local.is_file():
            raise FileNotFoundError(local)
        return 'url("' + asset_uri(local) + '")'

    return re.sub(r"url\(([^)]+)\)", replace_url, text)


ROUTER = r"""
(() => {
  const state = window.__ReviewPreview;
  LearningRoutes.url = (family, route = '') => '#' + route.replace(/^#/, '');
  LearningRoutes.route = () => state.route;
  LearningRoutes.enhance = (family, main) => {
    for (const anchor of main.querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href');
      if (href.startsWith('#')) continue;
      const target = new URL(href, document.baseURI);
      let route = state.routes[target.pathname.split('/').pop()];
      if (route === undefined) continue;
      const practice = target.searchParams.get('practice');
      if (practice && /^\d+$/.test(practice) && route.split('/').length === 3)
        route = route.split('/').slice(0, 2).join('/') + '/' + practice;
      anchor.setAttribute('href', '#' + route);
    }
  };
  LearningRoutes.installRouter = (family, curriculum, render) => {
    const changed = () => { state.route = location.hash.slice(1); render(); };
    addEventListener('hashchange', changed);
    addEventListener('popstate', changed);
    document.addEventListener('click', event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
          anchor.hasAttribute('download') || anchor.target) return;
      const href = anchor.getAttribute('href');
      const target = new URL(href, document.baseURI);
      const fragment = href.startsWith('#') ? href :
        target.origin === location.origin && target.pathname === location.pathname ? target.hash : null;
      if (fragment === null) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (/^(?:#foundationsMain|#chapter-\d+)$/.test(fragment)) {
        const element = document.getElementById(fragment.slice(1));
        element?.focus(); element?.scrollIntoView(); return;
      }
      state.route = fragment.slice(1);
      try { state.pushState(null, '', target.href); } catch { /* Opaque file-viewer origin. */ }
      render();
      scrollTo(0, 0);
    }, true);
    render();
  };
})();
"""


def page_template(file_name):
    text = (DIST / file_name).read_text()
    deferred = []

    def replace_script(match):
        attrs, source = match.group(1), match.group(2)
        code = (DIST / source).read_text()
        if source == "foundations/learning-ui.js":
            code = code.replace("root.location.href", "root.document.baseURI")
        if source == "learning-routes.js":
            code += ROUTER
        code = re.sub(r"</script", r"<\\/script", code, flags=re.I)
        tag = "<script>" + code + "</script>"
        if re.search(r"\bdefer\b", attrs):
            deferred.append(tag)
            return ""
        return tag

    text = re.sub(r'<script\s+([^>]*?)src="([^"]+)"[^>]*>\s*</script>', replace_script, text)
    text = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>',
                  lambda m: "<style>" + stylesheet(DIST / m.group(1)) + "</style>", text)
    text = re.sub(r'<link\s+rel="icon"\s+href="([^"]+)"\s*/?>',
                  lambda m: '<link rel="icon" href="' + asset_uri(DIST / "assets/icons/app-icon-192.png") + '">', text)
    text = text.replace('<meta charset="utf-8">', '<meta charset="utf-8"><script>window.__ReviewPreview.mount();</script>', 1)
    nav = """<nav class="review-preview-nav" aria-label="Curriculum preview">
      <strong>Curriculum preview</strong>
      <button type="button" onclick="__ReviewPreview.show('data','')">Data Foundations</button>
      <button type="button" onclick="__ReviewPreview.show('ml','')">Machine Learning</button>
    </nav>"""
    nav_style = """<style>
      .review-preview-nav{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 20px;
        background:#efe8d7;color:#172238;border-bottom:1px solid #d4c59e;font:14px Nunito,sans-serif}
      .review-preview-nav strong{margin-right:auto}
      .review-preview-nav button{min-height:44px;padding:8px 12px;background:#f7f2e5;color:#172238;
        border:1px solid #c4b487;border-radius:4px;font:inherit;cursor:pointer}
      .review-preview-nav button:focus-visible{outline:3px solid #167c70;outline-offset:2px}
    </style>"""
    text = text.replace("</head>", nav_style + "</head>", 1)
    text = re.sub(r"(<body\b[^>]*>)", lambda m: m.group(1) + nav, text, count=1)
    text = text.replace("</body>", "\n".join(deferred) + "</body>", 1)
    return text


BOOTSTRAP = r"""
(() => {
  const packed = PAYLOAD;
  const state = window.__ReviewPreview = {
    resources: {}, templates: {}, routes: {}, active: 'data', route: 'visualise/V04/0', workers: [],
    fetch: window.fetch.bind(window), Worker: window.Worker,
    pushState: history.pushState.bind(history), replaceState: history.replaceState.bind(history),
    async show(family, route = '') {
      await this.ready;
      for (const worker of this.workers) worker.terminate();
      this.workers = []; this.active = family; this.route = route;
      try { this.replaceState(null, '', '#' + route); } catch {}
      document.open(); document.write(this.templates[family]); document.close();
      scrollTo(0, 0);
    },
    mount() {
      if (location.protocol === 'about:') {
        const base = document.createElement('base');
        base.href = 'https://curriculum-preview.invalid/'; document.head.append(base);
      }
      // An HTML file preview may have an opaque origin; changing disclosure depth
      // still works even when its host does not allow history.replaceState.
      history.replaceState = (...args) => { try { this.replaceState(...args); } catch {} };
      window.fetch = async (input, init) => {
        await this.ready;
        const name = typeof input === 'string' ? input.replace(/^\.\//, '') : '';
        const body = this.resources[name];
        if (body !== undefined) {
          const type = name.endsWith('.json') ? 'application/json' :
            name.endsWith('.csv') ? 'text/csv' : 'text/javascript';
          return new Response(body, {headers: {'Content-Type': type}});
        }
        return this.fetch(input, init);
      };
      const preview = this;
      window.Worker = class extends preview.Worker {
        constructor(...args) { super(...args); preview.workers.push(this); }
      };
      document.addEventListener('click', event => {
        const anchor = event.target.closest?.('a[href]');
        if (!anchor || event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const href = anchor.getAttribute('href');
        if (['playground.html', 'data-foundations.html'].includes(href)) {
          event.preventDefault(); event.stopImmediatePropagation(); this.show('data'); return;
        }
        if (['ml.html', 'ml-learn.html'].includes(href)) {
          event.preventDefault(); event.stopImmediatePropagation(); this.show('ml'); return;
        }
        if (anchor.hasAttribute('download')) {
          const name = Object.keys(this.resources).find(key => href === key || href.endsWith('/' + key));
          if (!name) return;
          event.preventDefault();
          const url = URL.createObjectURL(new Blob([this.resources[name]], {type:'text/csv'}));
          const link = document.createElement('a'); link.href=url; link.download=name.split('/').pop();
          link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
        }
        // Unchanged pages outside this curriculum review open on the existing site.
        if (/^(?:index|learn|statistics|about|help|privacy|acknowledgements)\.html$/.test(href)) {
          anchor.href = 'https://dataplayground.science/' + href;
          anchor.target = '_blank'; anchor.rel = 'noopener';
        }
      });
    }
  };
  const bytes = Uint8Array.from(atob(packed), value => value.charCodeAt(0));
  state.ready = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))
    .json().then(payload => { Object.assign(state, payload); });
})();
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT.parent / "curriculum-preview.html")
    args = parser.parse_args()
    resources = {name: (DIST / name).read_text() for name in [
        "foundations/worker.js", "ml-learning/worker.js", "ml-learning/curriculum.json",
        "ml-learning/datasets.json", "ml-learning/inputs.json",
    ]}
    for name in ["ml-learning/datasets.json", "ml-learning/inputs.json"]:
        for dataset in json.loads(resources[name]).values():
            for key in ["file", "sourceFile"]:
                if dataset.get(key) and (DIST / dataset[key]).is_file():
                    resources[dataset[key]] = (DIST / dataset[key]).read_text()
    templates = {"data": page_template("data-foundations-V04.html"),
                 "ml": page_template("ml-learn.html")}
    routes = {}
    for pattern in ["data-foundations*.html", "ml-learn*.html"]:
        for path in DIST.glob(pattern):
            match = re.search(r'data-learning-route="([^"]*)"', path.read_text())
            if match:
                routes[path.name] = match.group(1)
    payload = json.dumps({"templates": templates, "resources": resources, "routes": routes}).encode()
    packed = base64.b64encode(gzip.compress(payload, mtime=0)).decode()
    bootstrap = BOOTSTRAP.replace("PAYLOAD", js_json(packed))
    output = templates["data"].replace('<meta charset="utf-8">', '<meta charset="utf-8"><script>' + bootstrap + "</script>", 1)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    print(json.dumps({"path": str(args.output.resolve()), "bytes": args.output.stat().st_size,
                      "embeddedFetchResources": len(resources), "curricula": list(templates)}))


if __name__ == "__main__":
    main()
