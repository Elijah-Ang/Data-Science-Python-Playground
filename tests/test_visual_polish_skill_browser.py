"""Apply the user's Visual Learning Sites collector to the repaired scenes."""

import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_code_browser import choose

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument("--skill-root", type=Path, required=True)
p.add_argument("--base-url", default="http://127.0.0.1:8015")
p.add_argument(
    "--output", type=Path, default=ROOT / "docs/curriculum-evidence/visual-polish"
)
args = p.parse_args()
out = args.output
out.mkdir(parents=True, exist_ok=True)
contract = json.loads((out / "qa/lesson-contract.json").read_text())
collector = (args.skill_root / "scripts/scene_geometry.js").read_text()
checks, reports, errors = [], [], []
routes = {
    "histogram": "data-foundations.html#visualise/V04/0",
    "table-transform": "data-foundations.html#wrangle/W02/0",
    "argument-row": "data-foundations.html#visualise/V04/0",
    "code-menu": "data-foundations.html#visualise/V18/0",
    "ml-plot": "ml-learn.html#classification/ML-C11/0",
}
with sync_playwright() as w:
    b = w.chromium.launch(executable_path="/usr/bin/chromium")
    page = b.new_page(service_workers="block", reduced_motion="reduce")
    page.on("pageerror", lambda e: errors.append(str(e)))
    for scene in contract["scenes"]:
        for viewport in scene["viewports"]:
            page.set_viewport_size({k: viewport[k] for k in ["width", "height"]})
            for state in scene["states"]:
                sid = state["id"] if isinstance(state, dict) else state
                page.goto(args.base_url + "/" + routes[scene["id"]])
                page.reload()
                page.wait_for_selector(".foundation-content")
                page.evaluate("document.fonts.ready")
                selector = (
                    state.get("selector", scene["selector"])
                    if isinstance(state, dict)
                    else scene["selector"]
                )
                if scene["id"] == "histogram":
                    section = page.locator('[data-foundation-explorer="histogram"]')
                    if sid == "two-bins":
                        choose(page, section, "bins", "2")
                    if sid == "other-column":
                        choose(page, section, "x", "cost")
                    assert section.locator("table").count() == 0
                if scene["id"] == "ml-plot" and sid == "changed":
                    section = page.locator('[data-ml-explorer="C11"]')
                    choose(page, section, "gamma", "0.1")
                    choose(page, section, "choice", "10")
                if scene["id"] == "code-menu":
                    section = page.locator('[data-foundation-explorer="line"]')
                    if sid == "changed":
                        choose(page, section, "marker", "*")
                    section.locator('[data-code-key="marker"]').first.click()
                    page.wait_for_selector(
                        '.inline-code-options[data-positioner="floating-ui"]'
                    )
                    menu = page.get_by_role("listbox")
                    assert menu.locator('[role="option"]').count() == 6
                    menu.locator('[role="option"]').first.focus()
                    page.keyboard.press("End")
                    assert menu.locator(":focus").get_attribute("data-value") == "x"
                    page.keyboard.press("Home")
                    assert menu.locator(":focus").get_attribute("data-value") == "None"
                    assert menu.locator('[role="option"]').evaluate_all(
                        "xs=>xs.every(e=>e.getBoundingClientRect().height>=44)"
                    )
                if scene["id"] == "argument-row":
                    row = page.locator(selector)
                    assert row.locator("dd>.argument-points>li").count() == 1
                    assert row.locator(".foundation-argument-values>li").count() >= 3
                    assert (
                        row.locator("dd").evaluate("e=>getComputedStyle(e).fontSize")
                        == "16px"
                    )
                    assert row.locator("code").evaluate_all(
                        'xs=>xs.every(e=>getComputedStyle(e).fontSize==="16px")'
                    )
                root = page.locator(selector)
                if scene["id"] != "code-menu":
                    root.evaluate(
                        "e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})"
                    )
                shot = f"{scene['id']}-{sid}-{viewport['id']}.png"
                page.screenshot(path=str(out / shot))
                applicable = [
                    c
                    for c in scene["checks"]
                    if sid in c.get("states", [sid])
                    and viewport["id"] in c.get("viewports", [viewport["id"]])
                ]
                for check in applicable:
                    evidence = []
                    details = ""
                    if check["kind"] == "geometry":
                        report = page.evaluate(
                            collector,
                            dict(
                                scene=scene,
                                state=sid,
                                viewport=viewport,
                                scene_selector=selector,
                                options={"bottom_inset": 8},
                            ),
                        )
                        path = (
                            out / f"geometry-{scene['id']}-{sid}-{viewport['id']}.json"
                        )
                        path.write_text(json.dumps(report, indent=2) + "\n")
                        reports.append(
                            dict(
                                scene=scene["id"],
                                state=sid,
                                viewport=viewport["id"],
                                evidence=str(path.relative_to(ROOT)),
                            )
                        )
                        evidence = [
                            str(path.relative_to(ROOT)),
                            str((out / shot).relative_to(ROOT)),
                        ]
                        verdict = "pass" if report["ok"] else "fail"
                        details = f"Observed {viewport['width']}×{viewport['height']}; {len(report['issues'])} geometry issues."
                    elif check["kind"] == "model":
                        filename = (
                            "native-operations.json"
                            if scene["id"] == "table-transform"
                            else "native-models.json"
                        )
                        native = json.loads((out / filename).read_text())
                        assert native["passed"]
                        evidence = [str((out / filename).relative_to(ROOT))]
                        verdict = "pass"
                        details = "Native calculation receipt independently checks the displayed operation and all offered numerical alternatives."
                    else:
                        evidence = [str((out / shot).relative_to(ROOT))]
                        verdict = "unverified" if check["kind"] == "visual" else "pass"
                        details = "Browser assertions and captured actual lesson state; visual verdict remains subject to inspection of these screenshots."
                    checks.append(
                        dict(
                            scene=scene["id"],
                            state=sid,
                            viewport=viewport["id"],
                            check=check["id"],
                            verdict=verdict,
                            evidence=evidence,
                            details=details,
                            **(
                                {
                                    "reason": "Awaiting direct inspection of the captured rendered state."
                                }
                                if verdict == "unverified"
                                else {}
                            ),
                        )
                    )
                if scene["id"] == "code-menu":
                    page.keyboard.press("Escape")
                    assert not page.get_by_role("listbox").count()
                    assert page.locator('[data-code-key="marker"]').first.evaluate(
                        "e=>e===document.activeElement"
                    )
    b.close()
assert not errors, errors
(out / "qa/verification.json").write_text(
    json.dumps(
        dict(
            version=1,
            revision=contract["revision"],
            checks=checks,
            geometry_reports=reports,
            pageErrors=errors,
        ),
        indent=2,
    )
    + "\n"
)
failed = [r for r in checks if r["verdict"] == "fail"]
print(json.dumps(dict(checks=len(checks), failed=failed), indent=2))
assert not failed
