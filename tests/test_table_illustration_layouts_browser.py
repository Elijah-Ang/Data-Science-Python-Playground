"""Inspect native table illustrations and long editable code at reading size."""

import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument("--base-url", default="http://127.0.0.1:8015")
p.add_argument(
    "--output",
    type=Path,
    default=ROOT / "docs/curriculum-evidence/visual-polish/table-layouts.json",
)
args = p.parse_args()
records, errors = [], []
with sync_playwright() as w:
    b = w.chromium.launch(executable_path="/usr/bin/chromium")
    page = b.new_page(service_workers="block", reduced_motion="reduce")
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(args.base_url + "/data-foundations.html")
    page.wait_for_function("!!window.FoundationsCurriculum")
    lessons = page.evaluate(
        'FoundationsCurriculum.lessons.filter(l=>!l.review&&l.deck!=="visualise").map(l=>({id:l.id,deck:l.deck}))'
    )
    for width in [1440, 1280, 390, 320]:
        page.set_viewport_size({"width": width, "height": 900 if width > 500 else 844})
        for theme in ["light", "dark"]:
            page.evaluate("(t)=>AppAppearance.apply(t)", theme)
            for lesson in lessons:
                page.evaluate("(l)=>location.hash=`#${l.deck}/${l.id}/0`", lesson)
                page.wait_for_function(
                    '(id)=>document.querySelector(".teaching-overview")?.dataset.teachingSource===id',
                    arg=lesson["id"],
                )
                result = page.evaluate(
                    """()=>{
     const root=document.querySelector('.teaching-overview'),tables=[...root.querySelectorAll('.operation-table')];
     return {tables:tables.length,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
      codeBlocks:root.querySelectorAll('pre code').length,duplicateCode:root.querySelectorAll('.operation-result pre code').length,
      cells:tables.flatMap(t=>[...t.querySelectorAll('th,td')].map(n=>({font:parseFloat(getComputedStyle(n).fontSize),transform:getComputedStyle(n).transform}))),
      scroll:tables.map(t=>({focus:t.parentElement.tabIndex,vertical:t.parentElement.scrollHeight>t.parentElement.clientHeight+1,horizontal:t.parentElement.scrollWidth>t.parentElement.clientWidth+1}))};
    }"""
                )
                assert (
                    result["tables"]
                    and result["codeBlocks"] == 1
                    and not result["duplicateCode"]
                ), (lesson, result)
                assert not result["pageOverflow"], (lesson, width, theme, result)
                assert all(
                    c["font"] >= 14 and c["transform"] == "none"
                    for c in result["cells"]
                ), (lesson, result)
                assert all(
                    not s["vertical"] and (not s["horizontal"] or s["focus"] == 0)
                    for s in result["scroll"]
                ), (lesson, result)
                records.append(dict(**lesson, width=width, theme=theme, **result))
    # A text-enlargement stress pass uses a separate page, with no production CSS changes.
    for width in [1280, 390]:
        page.set_viewport_size({"width": width, "height": 900})
        for route in [
            "data-foundations.html#inspect/I03/0",
            "data-foundations.html#inspect/I19A/0",
            "data-foundations.html#wrangle/W19/0",
            "ml-learn.html#workflow/ML-W03/0",
            "ml-learn.html#clustering/ML-U02/0",
        ]:
            page.goto(args.base_url + "/" + route)
            page.wait_for_selector(".foundation-content")
            override = page.add_style_tag(
                content=".foundation-content :is(p,li,dt,dd,code,th,td){font-size:20px!important}"
            )
            assert not page.evaluate(
                "document.documentElement.scrollWidth>innerWidth+1"
            ), (width, route)
            records.append(
                dict(route=route, width=width, textEnlargedTo=20, passed=True)
            )
            override.evaluate("e=>e.remove()")
    b.close()
assert not errors, errors
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(
    json.dumps(
        dict(passed=True, records=records, pageErrors=errors), separators=(",", ":")
    )
    + "\n"
)
print(f"{len(records)} native-table/long-code/enlarged-text contexts passed.")
