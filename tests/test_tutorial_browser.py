"""Guided-tour chapters, responsive captures, and replay behaviour."""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
parser.add_argument("--base-url", default="http://127.0.0.1:8000")
parser.add_argument("--evidence-dir", default="tests/evidence")
args = parser.parse_args()

CASES = (
    (390, 844, "mobile", (
        "Start with a question.",
        "Meet your data.",
        "A little Python. A new insight.",
        "Make the result mean something.",
        "A first step, ready for you.",
        "A nudge when you need one.",
        "Take your next question further.",
    )),
    (834, 900, "mobile", (
        "Start with a question.",
        "Meet your data.",
        "A little Python. A new insight.",
        "Make the result mean something.",
        "A first step, ready for you.",
        "A nudge when you need one.",
        "Take your next question further.",
    )),
    (1440, 1000, "wide", (
        "Start with a question.",
        "Meet your data.",
        "A first step, ready for you.",
        "A little Python. A new insight.",
        "A nudge when you need one.",
        "Make the result mean something.",
        "Take your next question further.",
    )),
)

evidence = {"engine": args.engine, "base_url": args.base_url, "cases": []}
with sync_playwright() as playwright:
    browser = getattr(playwright, args.engine).launch()
    context = browser.new_context(reduced_motion="reduce")
    page = context.new_page()
    for width, height, view, titles in CASES:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(f"{args.base_url.rstrip('/')}/tutorial.html?view={view}", wait_until="networkidle")
        page.wait_for_function("document.querySelector('#siteCapture')?.naturalWidth > 0", timeout=30000)
        assert page.locator(".steps button").count() == 7
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
        for chapter, title in enumerate(titles):
            page.locator(".steps button").nth(chapter).click()
            page.wait_for_function(
                "expected => document.querySelector('#headline').textContent === expected",
                arg=title,
                timeout=10000,
            )
            assert page.locator(".steps button").nth(chapter).get_attribute("aria-current") == "step"
        page.locator("#next").click()
        page.wait_for_function(
            "document.querySelector('#headline').textContent === 'Start with a question.'",
            timeout=10000,
        )
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
        evidence["cases"].append({"viewport": [width, height], "view": view, "chapters": 7, "replay": True})
    evidence["browser_version"] = browser.version
    browser.close()

evidence_dir = Path(args.evidence_dir)
evidence_dir.mkdir(parents=True, exist_ok=True)
(evidence_dir / f"tutorial-{args.engine}.json").write_text(json.dumps(evidence, indent=2) + "\n")
print(json.dumps({"status": "passed", "evidence": str(evidence_dir), "cases": len(CASES)}))
