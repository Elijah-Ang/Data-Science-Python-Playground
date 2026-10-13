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
    """Compare levels separately; opening help must require a real interaction."""
    current = page.locator(".foundation-parameter-teaching")
    current_ids = [item["id"] for item in guidance["introduces"] + guidance["extends"]]
    reminders_expected = guidance["reminders"]
    reference_expected = guidance["reference"]
    assert current.count() == bool(current_ids), state
    assert parameter_ids(current.locator(".foundation-parameter-entry")) == current_ids, state
    assert parameter_ids(page.locator(".foundation-parameter-entry:visible")) == current_ids, state
    assert not set(current_ids).intersection(item["id"] for item in reminders_expected), state

    for definition in guidance["introduces"]:
        entry = current.locator(f'[data-parameter="{definition["id"]}"]')
        assert entry.get_attribute("data-guidance") == "introduce", state
        assert entry.is_visible(), state
        assert entry.locator("dt").all_inner_texts() == [
            "Accepted forms", "Useful choices", "Default", "Effect", "Small example"
        ], state
        assert entry.locator("dd").count() == 5, state
        assert all(entry.locator("dd").nth(index).inner_text() for index in range(5)), state
        assert entry.locator("pre > code").count() == 1, state
        assert entry.locator("dd a").count() == 0, state
    for definition in guidance["extends"]:
        entry = current.locator(f'[data-parameter="{definition["id"]}"]')
        assert entry.get_attribute("data-guidance") == "extend", state
        assert entry.is_visible(), state
        assert entry.locator("h4").inner_text() == definition["keyword"] + " · What changes here", state
        assert entry.locator("p").inner_text(), state
        assert entry.locator("pre > code").inner_text(), state
        assert entry.locator("dl").count() == 0, state

    optional = page.locator('.foundation-parameter-guide[aria-label="Optional parameter help"]')
    assert optional.count() == bool(reference_expected), state
    reminder = optional.locator("details.foundation-parameter-reminder")
    reference = optional.locator("details.foundation-parameter-reference")
    assert reminder.count() == bool(reminders_expected), state
    assert reference.count() == bool(reference_expected), state
    assert optional.locator("details[open]").count() == 0, state

    if reminders_expected:
        assert not reminder.locator("ul").is_visible(), state
        reminder.locator("summary").click()
        assert reminder.get_attribute("open") is not None, state
        assert reminder.locator("ul").is_visible(), state
        assert reminder.locator("li > code:first-child").all_inner_texts() == [
            item["keyword"] for item in reminders_expected
        ], state
        # Familiar reminders never duplicate the comprehensive parameter forms.
        assert reminder.locator(".foundation-parameter-entry, dl").count() == 0, state
        assert parameter_ids(page.locator(".foundation-parameter-entry:visible")) == current_ids, state
        reminder.locator("summary").click()
        assert reminder.get_attribute("open") is None, state
        assert not reminder.locator("ul").is_visible(), state

    if reference_expected:
        entries = reference.locator(".foundation-parameter-entry")
        assert parameter_ids(entries) == [item["id"] for item in reference_expected], state
        assert reference.locator(".foundation-parameter-entry:visible").count() == 0, state
        reference.locator("summary").click()
        assert reference.get_attribute("open") is not None, state
        rendered = entries.evaluate_all("""items=>{
          const visible=e=>!!e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
          return items.map(entry=>({
            level:entry.dataset.guidance, visible:visible(entry), header:entry.querySelector('h4').innerText,
            terms:Array.from(entry.querySelectorAll('dt'),e=>e.innerText),
            fields:Array.from(entry.querySelectorAll('dd'),e=>({
              visible:visible(e), text:e.textContent, displayed:e.innerText,
              code:Array.from(e.querySelectorAll('pre > code'),code=>code.innerText)
            })),
            source:entry.querySelector('dd a')?.getAttribute('href'),
            nestedDetails:entry.querySelectorAll('details').length
          }));
        }""")
        for actual, definition in zip(rendered, reference_expected, strict=True):
            assert actual["level"] == "reference", (state, definition["id"])
            assert actual["visible"], (state, definition["id"])
            assert actual["header"] == definition["keyword"] + " · " + definition["purpose"], state
            assert actual["terms"] == [
                "Accepted forms", "Useful choices", "Default", "Effect", "Small example",
                "Restrictions and other choices"
            ], state
            for field_index, field in enumerate(("forms", "range", "default", "effect", "example")):
                dd = actual["fields"][field_index]
                assert dd["visible"], (state, definition["id"], field)
                assert dd["text"] == definition[field], (state, definition["id"], field)
                if field == "example":
                    assert dd["code"] == [definition[field]], state
                else:
                    assert dd["displayed"] == definition[field], state
            assert actual["fields"][-1]["displayed"] == definition["caveat"] + " Version-matched source", state
            assert actual["source"] == definition["source"], state
            assert actual["nestedDetails"] == 0, state
        assert_no_overflow(page, (state, "reference open"))
        reference.locator("summary").click()
        assert reference.get_attribute("open") is None, state
        assert reference.locator(".foundation-parameter-entry:visible").count() == 0, state
    assert parameter_ids(page.locator(".foundation-parameter-entry:visible")) == current_ids, state
    assert optional.locator("details[open]").count() == 0, state
    assert_no_overflow(page, (state, "help closed"))
    return {
        "introduces": [item["id"] for item in guidance["introduces"]],
        "extends": [item["id"] for item in guidance["extends"]],
        "reminders": [item["id"] for item in reminders_expected],
        "reference": [item["id"] for item in reference_expected],
        "referenceOpenedAndClosed": bool(reference_expected),
        "reminderOpenedAndClosed": bool(reminders_expected),
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
print(args.engine, len(records), "round/viewport states and 43 static 320px lessons verify authored current teaching, closed help, and interactive full references")
