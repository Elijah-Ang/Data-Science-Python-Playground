"""Multiple independent editable arguments in the actual lesson UI."""

import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_code_browser import choose

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument("--base-url", default="http://127.0.0.1:8015")
p.add_argument("--output", default="docs/curriculum-evidence/inline-code-controls")
args = p.parse_args()
out = ROOT / args.output
out.mkdir(parents=True, exist_ok=True)
scenarios = [
    ("data-foundations", "visualise/V33/0", {"x": "cost", "y": "x", "col": "shift"}),
    (
        "data-foundations",
        "visualise/V18/0",
        {"x": "period", "y": "cost", "estimator": "median", "marker": "*"},
    ),
    ("data-foundations", "wrangle/W06/0", {"choice": "rating", "ascending": "False"}),
    ("data-foundations", "wrangle/W19/0", {"choice": "shelf", "method": "sum"}),
    ("ml-learn", "classification/ML-C11/0", {"choice": "10", "gamma": "0.1"}),
    ("ml-learn", "classification/ML-C14/0", {"width": "7", "length": "8"}),
    ("ml-learn", "clustering/ML-U06/0", {"choice": "3", "n_init": "20"}),
    ("ml-learn", "workflow/ML-W07/0", {"choice": "constant", "fill_value": "-1"}),
]
records = []
errors = []
with sync_playwright() as w:
    b = w.chromium.launch(executable_path="/usr/bin/chromium")
    page = b.new_page(service_workers="block", reduced_motion="reduce")
    page.on("pageerror", lambda e: errors.append(str(e)))
    for width in [1440, 390, 320]:
        page.set_viewport_size({"width": width, "height": 1000})
        for theme in ["light", "dark"]:
            for family, route, changes in scenarios:
                page.goto(args.base_url + "/" + family + ".html#" + route)
                page.wait_for_selector("[data-code-key]")
                page.evaluate("(t)=>AppAppearance.apply(t)", theme)
                section = page.locator(".teaching-explorer").first
                assert not section.locator("select").count()
                applied = {}
                for key, value in changes.items():
                    button = section.locator('[data-code-key="' + key + '"]').first
                    assert button.bounding_box()["height"] >= 44
                    button.click()
                    menu = page.get_by_role("listbox")
                    r = menu.bounding_box()
                    assert (
                        r["x"] >= 0
                        and r["x"] + r["width"] <= width + 1
                        and r["y"] >= 0
                        and r["y"] + r["height"] <= 1001
                    )
                    page.keyboard.press("Escape")
                    assert button.evaluate("e=>e===document.activeElement")
                    choose(page, section, key, value)
                    applied[key] = value
                    for previous, expected in applied.items():
                        assert (
                            section.locator(
                                '[data-code-key="' + previous + '"]'
                            ).first.get_attribute("data-code-value")
                            == expected
                        ), (route, key, previous)
                code = section.locator(".inline-code-source").inner_text()
                assert section.locator(".inline-code-source").count() == 1
                assert section.evaluate(
                    's=>!!(s.querySelector(".inline-code-editor").compareDocumentPosition(s.querySelector("[aria-live]")) & Node.DOCUMENT_POSITION_FOLLOWING)'
                )
                assert not page.evaluate(
                    "document.documentElement.scrollWidth>innerWidth+1"
                )
                colours = section.locator("[data-code-key]").evaluate_all(
                    """nodes=>{const keys=new Set();return nodes.filter(n=>{if(keys.has(n.dataset.codeKey))return false;keys.add(n.dataset.codeKey);return true;}).map(n=>getComputedStyle(n).borderBottomColor);}"""
                )
                assert len(set(colours)) == len(
                    colours
                ), "Editable positions need distinct colours"
                # Resolve color-mix through canvas, then measure actual text contrast.
                contrasts = section.locator("[data-code-key]").evaluate_all(
                    """nodes=>nodes.map(n=>{const c=document.createElement('canvas').getContext('2d');const rgb=color=>{c.fillStyle=color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3);};const lum=a=>a.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);const css=getComputedStyle(n),a=lum(rgb(css.color)),b=lum(rgb(css.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);})"""
                )
                assert min(contrasts) >= 4.5, (route, theme, contrasts)
                if (
                    family == "ml-learn"
                    and page.locator(".ml-syntax .teaching-syntax-heading").count()
                ):
                    assert (
                        page.locator(".ml-syntax .teaching-syntax-heading").evaluate(
                            "e=>[getComputedStyle(e).fontSize,getComputedStyle(e).fontFamily,getComputedStyle(e).color]"
                        )[0]
                        == "18px"
                    )
                if route.endswith("V18/0"):
                    assert (
                        page.locator(".teaching-syntax-parts dd").first.inner_text()
                        == "Creates a line plot."
                    )
                    sizes = page.evaluate(
                        """()=>{const description=document.querySelector('.teaching-syntax-parts dd'),argument=document.querySelector('.foundation-parameter-row dd');const heading=document.querySelector('.teaching-syntax-heading'),args=document.querySelector('.foundation-parameter-teaching>h3');return [getComputedStyle(description).fontSize,getComputedStyle(argument).fontSize,getComputedStyle(heading).font,getComputedStyle(args).font,getComputedStyle(heading).color,getComputedStyle(args).color];}"""
                    )
                    assert (
                        sizes[0] == sizes[1] == "16px"
                        and sizes[2] == sizes[3]
                        and sizes[4] == sizes[5]
                    ), sizes
                if width in [1440, 390] and theme == "light":
                    height = section.bounding_box()["height"]
                    page.set_viewport_size(
                        {"width": width, "height": max(1000, int(height) + 700)}
                    )
                    section.scroll_into_view_if_needed()
                    section.screenshot(
                        path=str(
                            out / (route.split("/")[1] + "-" + str(width) + ".png")
                        )
                    )
                    page.set_viewport_size({"width": width, "height": 1000})
                records.append(
                    dict(
                        route=route,
                        width=width,
                        theme=theme,
                        arguments=applied,
                        code=code,
                        minContrast=min(contrasts),
                    )
                )
    b.close()
assert not errors, errors
(out / "multiple-arguments.json").write_text(
    json.dumps(
        dict(passed=True, contexts=len(records), records=records, pageErrors=errors),
        indent=2,
    )
    + "\n"
)
print(json.dumps(dict(contexts=len(records), passed=True, pageErrors=errors)))
