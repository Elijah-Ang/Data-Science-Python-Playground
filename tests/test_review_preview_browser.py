"""Verify the single-file review without access to sibling app assets."""
import argparse
import json
import shutil
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base-url", default="http://127.0.0.1:8042")
parser.add_argument("--preview", type=Path, default=Path("/workspace/curriculum-preview.html"))
parser.add_argument("--output", type=Path, default=Path("docs/curriculum-evidence/standalone-preview.json"))
args = parser.parse_args()
errors, rejected, records = [], [], []


def visual_and_depth(page):
    page.wait_for_function('document.readyState === "complete" && !!window.FoundationWorkspace')
    page.wait_for_selector("#foundationEditor")
    assert page.locator("h2").first.inner_text() == "Histogram"
    assert page.locator("#jumpToWork").inner_text().endswith("↓")
    assert page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(239, 232, 215)"
    editor = page.locator("#foundationEditor")
    starter = editor.input_value()
    editor.fill(starter + "\n# Active preview work")
    page.locator('button[data-learning-mode="refresh"]').click()
    assert page.evaluate('document.body.dataset.learningMode') == 'refresh'
    page.locator('button[data-learning-mode="learn"]').click()
    assert page.evaluate('document.body.dataset.learningMode') == 'learn'
    assert editor.input_value().endswith("# Active preview work")
    page.locator("#resetExercise").click()
    assert editor.input_value() == starter
    explorer = page.locator(".foundation-visual-explorer")
    control = explorer.locator("select")
    before = explorer.locator(".teaching-visual-result > p").inner_text()
    values = control.locator("option").evaluate_all("xs=>xs.map(x=>x.value)")
    control.select_option(next(value for value in values if value != control.input_value()))
    assert explorer.locator(".teaching-visual-result > p").inner_text() != before
    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 2")


def switch_to_ml(page):
    page.locator(".review-preview-nav button").nth(1).click()
    page.wait_for_function('window.__ReviewPreview.active === "ml" && !!window.MLLearning')
    page.locator('a[href$="#foundations"]').first.click()
    page.locator('a[href$="#foundations/ML-F11/0"]').first.click()
    page.wait_for_selector("#mlEditor")
    assert page.locator("h2").first.inner_text() == "Your first complete regression workflow"
    assert page.locator(".ml-progressive-workflow > details").count() == 8


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=shutil.which("chromium"))
    context = browser.new_context(service_workers="block", viewport={"width": 390, "height": 844})

    def isolate(route):
        path = urlsplit(route.request.url).path
        if path == "/curriculum-preview.html" or path.startswith("/pyodide/"):
            route.continue_()
        else:
            rejected.append(route.request.url)
            route.abort()

    context.route("**/*", isolate)
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(args.base_url + "/curriculum-preview.html?runtime=local")
    visual_and_depth(page)
    page.locator("#foundationEditor").fill(page.evaluate("""()=>{
      const round=FoundationsCurriculum.lessons.find(l=>l.id==='V04').rounds[0];
      return FoundationWorkspace.code(FoundationsCurriculum, round, round.solution);
    }"""))
    page.locator("#checkExercise").click()
    page.wait_for_function('!document.getElementById("checkExercise").disabled', timeout=180000)
    assert page.locator("#foundationFeedback").get_attribute("data-state") == "pass"
    assert page.locator("#foundationOutput img").count() > 0
    records.append({"context": "isolated HTTP file", "activity": "V04-1", "pythonGrade": "passed"})
    page.screenshot(path=str(args.preview.parent / "curriculum-preview-data.png"), full_page=True)

    switch_to_ml(page)
    page.locator("#mlEditor").fill(page.evaluate("MLLearning.activity.solution"))
    page.locator("#mlRun").click()
    page.wait_for_function('!document.getElementById("mlRun").disabled', timeout=180000)
    assert page.locator("#mlStatus").inner_text().startswith("Run finished")
    page.locator("#mlCheck").click()
    assert page.locator("#mlResults .needs-attention,#mlResults .unavailable").count() == 0
    assert page.evaluate("async () => (await fetch('data/ml-learning/ML-X01.csv')).ok")
    records.append({"context": "isolated HTTP file", "activity": "ML-F11-1", "pythonGrade": "passed"})
    page.screenshot(path=str(args.preview.parent / "curriculum-preview-ml.png"), full_page=True)
    page.locator(".review-preview-nav button").nth(0).click()
    page.wait_for_selector('a[href$="#inspect"]')
    page.locator('a[href$="#inspect"]').click()
    page.locator('a[href$="#inspect/I19S/0"]').click()
    page.wait_for_selector("#foundationEditor")
    assert "# Active preview work" not in page.locator("#foundationEditor").input_value()
    assert not rejected, rejected

    # Match a file viewer's opaque sandbox, where local file URLs and history
    # changes are unavailable. No sibling CSS, script, JSON, or CSV may be loaded.
    sandbox = context.new_page()
    sandbox.set_viewport_size({"width": 1440, "height": 1000})
    sandbox.on("pageerror", lambda error: errors.append(str(error)))
    sandbox.set_content('<iframe title="Review" sandbox="allow-scripts allow-downloads" style="width:100%;height:980px;border:0"></iframe>')
    sandbox.locator("iframe").evaluate("(frame, html)=>frame.srcdoc=html", args.preview.read_text())
    frame = sandbox.frames[-1]
    visual_and_depth(frame)
    switch_to_ml(frame)
    frame.locator('button[data-learning-mode="refresh"]').click()
    frame.locator('button[data-learning-mode="learn"]').click()
    assert not frame.evaluate("document.documentElement.scrollWidth > innerWidth + 2")
    records.append({"context": "opaque HTML-file sandbox", "navigation": "Data to ML", "visualAndDepthControls": "passed"})
    browser.close()

assert not errors, errors
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps({"records": records, "pageErrors": errors,
                                  "requiredSiblingAssets": [], "artifactBytes": args.preview.stat().st_size}, indent=2) + "\n")
print(json.dumps({"records": records, "pageErrors": errors}, indent=2))
