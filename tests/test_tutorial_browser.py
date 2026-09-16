"""Visual tour, script-free lessons and desktop-only homepage control sizing."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
parser.add_argument("--base-url", default="http://127.0.0.1:8000")
parser.add_argument("--evidence-dir", default="tests/evidence")
args = parser.parse_args()
base = args.base_url.rstrip("/")
evidence = {"engine": args.engine, "cases": []}
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    for width, height in [(390,844), (834,900), (1440,1000)]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(base + "/tutorial.html")
        assert page.locator(".tour-step").count() == 6
        assert page.locator("#stats").is_visible()
        assert page.locator("#learn").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
        for target in ["#data","#run","#stats","#ml","#learn","#practice"]:
            page.locator('nav[aria-label="Tour sections"] a[href="' + target + '"]').click()
            assert page.url.endswith(target)
        page.goto(base + "/lessons/i01.html")
        assert page.get_by_role("heading", name="Meet a DataFrame", exact=True).is_visible()
        assert page.locator("table").count() == 4
        assert page.locator(".concept-visual").count() == 1
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
        page.goto(base + "/index.html")
        button = page.locator(".tour-button")
        assert button.is_visible()
        size = button.bounding_box()
        assert size["height"] >= (44 if width >= 1100 else 30)
        evidence["cases"].append({"viewport":[width,height], "script_free":True})
    browser.close()
out = Path(args.evidence_dir)
out.mkdir(parents=True, exist_ok=True)
(out / f"tutorial-{args.engine}.json").write_text(json.dumps(evidence,indent=2)+"\n")
print(json.dumps({"status":"passed","cases":len(evidence["cases"])}))
