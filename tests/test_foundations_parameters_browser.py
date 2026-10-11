"""Build-ready rendered/source agreement probe; invoke through local adapter."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://127.0.0.1:8771")
parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
parser.add_argument("--output", default="tests/evidence/foundations/parameters")
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
errors, records, expected_first = [], [], {}

with sync_playwright() as pw:
    browser = getattr(pw, args.engine).launch()
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(args.base_url + "/data-foundations.html?runtime=local#visualise/V01/0")
    page.wait_for_function("!!window.FoundationParameters && !!window.FoundationsCurriculum")
    rounds = page.evaluate("""FoundationsCurriculum.lessons.filter(l=>l.deck==='visualise')
      .flatMap(l=>l.rounds.map((r,index)=>({id:l.id,round:r.id,index,title:l.title})))""")
    assert len({item["id"] for item in rounds}) == 43
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 1000})
        for item in rounds:
            page.evaluate("r=>location.hash=`#visualise/${r.id}/${r.index}`", item)
            page.wait_for_function("""r=>window.LearningRoutes?.route('data',location,document.body)
              ===`visualise/${r.id}/${r.index}`
              &&document.querySelector('.foundation-lesson-heading h2')?.textContent===r.title
              &&Array.from(document.querySelectorAll('.foundation-practices li'))
                .findIndex(e=>e.hasAttribute('aria-current'))===r.index""", arg=item)
            expected = page.evaluate("""r=>{
              const lesson=FoundationsCurriculum.lessons.find(l=>l.id===r.id);
              return FoundationParameters.entriesFor(FoundationsCurriculum,lesson,lesson.rounds[r.index]);
            }""", item)
            if item["index"] == 0:
                expected_first[item["id"]] = expected
            guides = page.locator(".foundation-parameter-guide")
            assert guides.count() == (1 if expected else 0), (width, item)
            entries = page.locator(".foundation-parameter-entry")
            assert entries.count() == len(expected), (width, item)
            for index, definition in enumerate(expected):
                entry = entries.nth(index)
                assert entry.get_attribute("data-parameter") == definition["id"], (width, item, definition["id"])
                assert entry.locator("h4").inner_text() == definition["keyword"] + " · " + definition["purpose"]
                assert entry.locator("dt").all_inner_texts() == [
                    "Accepted forms", "Meaningful range", "Default", "Effect", "Example", "For this function"
                ]
                for field_index, field in enumerate(("forms", "range", "default", "effect", "example")):
                    dd = entry.locator("dd").nth(field_index)
                    actual_field = dd.inner_text()
                    actual_content = dd.text_content()
                    field_visible = dd.is_visible()

                    def diagnostic(**extra):
                        return {
                            "width": width, "lesson": item["id"], "round": item["round"],
                            "parameter": definition["id"], "field": field,
                            "actual": repr(actual_field),
                            "expected": repr(definition[field]),
                            "actualTextContent": repr(actual_content),
                            "dom": dd.evaluate("e=>({textContent:e.textContent,innerHTML:e.innerHTML})"),
                            "visible": field_visible,
                            **extra,
                        }

                    assert field_visible, diagnostic()
                    assert actual_content == definition[field], diagnostic()
                    if field == "example":
                        code = dd.locator("pre > code")
                        assert dd.locator("pre").count() == 1 and code.count() == 1 and dd.locator("code").count() == 1, diagnostic()
                        code_visible = code.is_visible()
                        actual_code = code.inner_text()
                        assert code_visible, diagnostic(actualCode=repr(actual_code), codeVisible=code_visible)
                        assert actual_code == definition[field], diagnostic(actualCode=repr(actual_code), codeVisible=code_visible)
                    else:
                        assert actual_field == definition[field], diagnostic()
                assert entry.locator("dd").last.inner_text() == definition["caveat"] + " Version-matched source"
                assert entry.locator("dd a").get_attribute("href") == definition["source"]
                assert entry.locator("details").count() == 0
                entry.locator("h4").scroll_into_view_if_needed()
                assert entry.locator("h4").is_visible()
            assert not page.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1"), (width, item)
            assert page.locator("progress,[role=progressbar],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue").count() == 0
            if item["id"] in ("V09", "V13", "V14", "V15", "V19", "V30", "V37") and item["index"] == 0 and expected:
                guides.screenshot(path=str(out / f"{args.engine}-{width}-{item['id']}.png"))
            records.append({"width": width, **item, "parameters": [entry["id"] for entry in expected]})
    context.close()
    static = browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 740})
    page = static.new_page()
    for lesson_id, expected in expected_first.items():
        page.goto(args.base_url + "/data-foundations-" + lesson_id + ".html")
        article = page.locator('article[aria-label="Lesson content"]')
        assert article.is_visible()
        entries = article.locator(".foundation-parameter-entry")
        assert entries.count() == len(expected), ("no-JS", lesson_id)
        for index, definition in enumerate(expected):
            assert entries.nth(index).get_attribute("data-parameter") == definition["id"], ("no-JS", lesson_id)
            assert entries.nth(index).locator("pre code").inner_text() == definition["example"]
        assert not page.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1"), ("no-JS", lesson_id)
    static.close()
    browser.close()

assert not errors, errors
record = {"engine": args.engine, "visualiseLessons": len(expected_first), "renderedRounds": len(records), "sourceAgreement": records, "pageErrors": errors, "noJavaScriptWidth": 320}
(out / f"{args.engine}-parameters.json").write_text(json.dumps(record, indent=2) + "\n")
print(args.engine, len(records), "rendered round/viewport states and 43 static 320px lessons agree with reusable parameter entries")
