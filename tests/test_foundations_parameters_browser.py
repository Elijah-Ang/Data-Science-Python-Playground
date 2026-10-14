"""Verify current teaching and native reference disclosures in rendered lessons."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://127.0.0.1:8000")
parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
parser.add_argument("--browser-executable")
parser.add_argument("--output", default="tests/evidence/foundations/parameters")
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
errors, records, expected_first = [], [], {}


def parameter_ids(entries):
    return entries.evaluate_all("items=>items.map(item=>item.dataset.parameter)")


def assert_no_overflow(page, state):
    assert not page.evaluate(
        "Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1"
    ), state


def inspect_guidance(page, guidance, state):
    """Current meanings stay visible; reference contents are removed from lessons."""
    current = page.locator(".foundation-parameter-teaching")
    current_ids = [item["id"] for item in guidance["introduces"] + guidance["extends"]]
    reference_expected = guidance["reference"]
    assert current.count() == bool(current_ids), state
    assert parameter_ids(current.locator(".foundation-parameter-row")) == current_ids, state
    assert parameter_ids(page.locator('[data-parameter]:visible')) == current_ids, state
    assert not set(current_ids).intersection(item["id"] for item in guidance["reminders"]), state
    assert current.locator("details").count() == 0, state
    for level, definitions in (("introduce", guidance["introduces"]), ("extend", guidance["extends"])):
        for definition in definitions:
            entry = current.locator(f'[data-parameter="{definition["id"]}"]')
            assert entry.get_attribute("data-guidance") == level, state
            assert entry.is_visible(), state
            assert entry.locator('dt code[data-code-role="parameter"]').inner_text() == definition["keyword"], state
            meaning = entry.locator("dd").inner_text()
            assert meaning and len(meaning.split()) >= 3, (state, definition["id"])
            assert entry.locator("pre, details").count() == 0, state
            # Full authored contracts survive in the registry; the visible row
            # explains this use without repeating every contract field.
            for key in ("forms", "range", "default", "effect", "example", "caveat", "source"):
                assert definition[key], (state, definition["id"], key)

    support = page.locator('.foundation-reference-content')
    assert support.locator(":scope > details > summary").all_inner_texts() == ["Hint", "Reveal solution"], state
    assert support.locator("details details").count() == 0, state
    assert support.locator("details[open]").count() == 0, state
    assert page.locator('.foundation-reference,.foundation-parameter-reference,.foundation-reference-body').count() == 0, state
    assert page.locator('.foundation-content > .foundation-task-reminder').count() == 1, state
    assert parameter_ids(page.locator('[data-parameter]:visible')) == current_ids, state
    assert support.locator("details[open]").count() == 0, state
    assert_no_overflow(page, (state, "help closed"))
    return {
        "introduces": [item["id"] for item in guidance["introduces"]],
        "extends": [item["id"] for item in guidance["extends"]],
        "reminders": [item["id"] for item in guidance["reminders"]],
        "reference": [item["id"] for item in reference_expected],
        "referenceRemoved": True,
        "flatDisclosures": 2,
    }


with sync_playwright() as pw:
    launch = {}
    executable = args.browser_executable
    if args.engine == "chromium" and not executable and Path("/usr/bin/chromium").is_file():
        executable = "/usr/bin/chromium"
    if executable:
        launch["executable_path"] = executable
    browser = getattr(pw, args.engine).launch(**launch)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(args.base_url + "/data-foundations.html?runtime=local#visualise/V01/0")
    page.wait_for_function("!!window.FoundationParameters && !!window.FoundationsCurriculum")
    rounds = page.evaluate("""FoundationsCurriculum.lessons.filter(l=>l.deck==='visualise')
      .flatMap(l=>l.rounds.map((r,index)=>({id:l.id,round:r.id,index,title:l.title})))""")
    assert len({item["id"] for item in rounds}) == 43
    assert len(rounds) == 132
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 1000})
        for item in rounds:
            page.evaluate("r=>location.hash=`#visualise/${r.id}/${r.index}`", item)
            page.wait_for_function("""r=>window.LearningRoutes?.route('data',location,document.body)
              ===`visualise/${r.id}/${r.index}`
              &&document.querySelector('.foundation-lesson-heading h2')?.textContent===r.title
              &&Array.from(document.querySelectorAll('.foundation-practices li'))
                .findIndex(e=>e.hasAttribute('aria-current'))===r.index""", arg=item)
            guidance = page.evaluate("""r=>{
              const lesson=FoundationsCurriculum.lessons.find(l=>l.id===r.id);
              return FoundationParameters.guidanceFor(FoundationsCurriculum,lesson,lesson.rounds[r.index]);
            }""", item)
            if item["index"] == 0:
                expected_first[item["id"]] = guidance
            evidence = inspect_guidance(page, guidance, (width, item))
            assert page.locator("progress,[role=progressbar],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue").count() == 0
            if item["id"] in ("V09", "V13", "V14", "V15", "V19", "V30", "V37") and item["index"] == 0:
                current = page.locator(".foundation-parameter-teaching")
                if current.count():
                    current.screenshot(path=str(out / f"{args.engine}-{width}-{item['id']}-current.png"))
            records.append({"width": width, **item, **evidence})
    context.close()
    static_records = []
    static = browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 740})
    page = static.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    for lesson_id, guidance in expected_first.items():
        page.goto(args.base_url + "/data-foundations-" + lesson_id + ".html")
        assert page.locator('article[aria-label="Lesson content"]').is_visible()
        static_records.append({"lesson": lesson_id, **inspect_guidance(page, guidance, ("no-JS", lesson_id))})
    static.close()
    browser.close()

assert not errors, errors
record = {
    "engine": args.engine, "executable": executable, "visualiseLessons": len(expected_first),
    "renderedRounds": len(records), "sourceAgreement": records, "pageErrors": errors,
    "noJavaScriptWidth": 320, "staticDisclosures": static_records
}
(out / f"{args.engine}-parameters.json").write_text(json.dumps(record, indent=2) + "\n")
print(args.engine, len(records), "round/viewport states and 43 static 320px lessons verify concise current teaching, complete registry contracts, and visible data, task and two help disclosures")
