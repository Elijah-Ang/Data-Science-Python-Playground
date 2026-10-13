"""Exercise every teaching view, its disclosures and the active Python editor."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://127.0.0.1:8000")
parser.add_argument("--engine", default="chromium", choices=["chromium", "webkit"])
parser.add_argument("--browser-executable")
parser.add_argument("--output", default="docs/curriculum-evidence/foundations-teaching-browser.json")
args = parser.parse_args()
errors, records, interaction_records = [], [], []


def navigate(page, item):
    page.evaluate("r=>location.hash=`#${r.deck}/${r.id}/${r.index}`", item)
    page.wait_for_function("""r=>LearningRoutes.route('data',location,document.body)===`${r.deck}/${r.id}/${r.index}`
      && document.querySelector('.foundation-lesson-heading h2')?.textContent===FoundationsCurriculum.lessons.find(l=>l.id===r.id).title
      && Array.from(document.querySelectorAll('.foundation-practices li')).findIndex(e=>e.hasAttribute('aria-current'))===r.index
      && document.querySelector('.foundation-practices [aria-current=step] strong')?.textContent===FoundationsCurriculum.lessons.find(l=>l.id===r.id).rounds[r.index].label""", arg=item)


def no_overflow(page, state):
    assert page.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)<=innerWidth+1"), state


def inspect_round(page, item, width):
    # One DOM snapshot avoids hundreds of locator round-trips per page while
    # keeping disclosure, explorer and editor interactions as browser actions.
    state = page.evaluate("""r=>{
      const lesson=FoundationsCurriculum.lessons.find(l=>l.id===r.id),round=lesson.rounds[r.index];
      const primary=document.querySelector('article[aria-label="Lesson content"]');
      const editor=document.querySelector('.foundation-code-pane');
      const reference=document.querySelector('.foundation-reference-content');
      const visible=e=>!!e && !!e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
      const texts=selector=>Array.from(primary.querySelectorAll(selector),e=>e.textContent);
      const guidance=round.syntaxGuidance;
      const parts=items=>(items||[]).map(part=>Array.isArray(part)?part[0]:(part.code||part.title));
      const concepts=round.concepts||lesson.concepts;
      return {
        expectedCode:FoundationWorkspace.code(FoundationsCurriculum,round),
        actualCode:document.querySelector('#foundationEditor').value,
        order:Array.from(document.querySelector('.foundation-split').children,e=>e.matches('.foundation-code-pane')?'code':e.matches('.foundation-reference-content')?'reference':'content'),
        mobileOrder:primary.getBoundingClientRect().bottom<=editor.getBoundingClientRect().top+1 && editor.getBoundingClientRect().bottom<=reference.getBoundingClientRect().top+1,
        panelsFit:[primary,editor,reference].every(e=>e.scrollWidth<=e.clientWidth+1),
        orientation:primary.querySelector('.teaching-orientation')?.getAttribute('aria-label'),
        orientationLabels:texts('.teaching-orientation strong'),
        expectedOrientation:[concepts.reuses.length?'You already know:':null,concepts.introduces.length?'New here:':null,concepts.extends.length?'Extend:':null].filter(Boolean),
        expectedQuestion:LearningLanguage.plain(round.brief.question).replace(/`/g,''),
        taskQuestion:document.querySelector('.foundation-task-reminder .practice-question')?.textContent,
        taskVisible:visible(document.querySelector('.foundation-task-reminder .practice-question')),
        primaryOverview:primary.querySelectorAll('.teaching-overview').length,
        summaryVisible:visible(primary.querySelector('.teaching-summary')),
        svgCount:primary.querySelectorAll('svg[role="img"]').length,
        explorerCount:primary.querySelectorAll('.foundation-visual-explorer').length,
        visibleExample:visible(primary.querySelector('.teaching-example')),
        visibleTransition:visible(primary.querySelector('.teaching-transition')),
        transitionCodeCount:primary.querySelectorAll('.teaching-transition pre').length,
        transitionParts:texts('.teaching-transition .teaching-syntax-parts dt code'),
        expectedTransitionParts:round.teaching?.parts.map(part=>part[0])||[],
        transitionResult:visible(primary.querySelector('.teaching-transition .teaching-example-output'))||visible(primary.querySelector('.teaching-transition .teaching-example-result')),
        transitionExpectedResult:!!(round.teaching?.output||round.teaching?.result),
        workedCount:primary.querySelectorAll('.teaching-worked').length,
        workedCodeCount:primary.querySelectorAll('.teaching-worked > pre').length,
        essentialOpen:primary.querySelector('.teaching-essential')?.open||false,
        currentSyntax:texts('.teaching-worked > .teaching-syntax-parts dt code'),
        expectedSyntax:parts(guidance.current),
        taughtParameterKeywords:[...(round.parameterTeaching?.introduces||[]),...(round.parameterTeaching?.extends||[])].map(name=>name.split('.').at(-1)),
        visibleParameterIds:Array.from(primary.querySelectorAll('.foundation-parameter-teaching .foundation-parameter-entry')).filter(visible).map(e=>e.dataset.parameter),
        expectedParameterIds:[...new Set([...(round.parameterTeaching?.introduces||[]),...(round.parameterTeaching?.extends||[])])],
        expectedReminders:parts(guidance.reminders),
        expectedReference:parts(guidance.reference),
        miniatureHasValues:!!lesson.guide?.exampleOutput,
        syntaxDetails:Array.from(primary.querySelectorAll('.teaching-worked > details.teaching-more'),e=>({summary:e.querySelector('summary').textContent,open:e.open,parts:Array.from(e.querySelectorAll('dt code'),e=>e.textContent)})),
        calloutCount:primary.querySelectorAll('.teaching-worked > .syntax-choice-callout').length,
        hiddenSyntaxToken:!!primary.querySelector('.teaching-worked') && Array.from(primary.querySelectorAll('.teaching-worked > .teaching-syntax-parts code span')).some(e=>getComputedStyle(e).display==='none'),
        referenceCount:reference.querySelectorAll('details.teaching-reference').length,
        openOptional:reference.querySelectorAll('details[open]').length,
        obsoleteSetup:!!Array.from(document.querySelectorAll('summary')).find(e=>e.textContent==='View setup code'),
        forbiddenState:document.querySelectorAll('progress,[role="progressbar"],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue').length
      };
    }""", item)
    label = (width, item)
    assert state["order"] == ["content", "code", "reference"], label
    assert state["panelsFit"], label
    if width == 320:
        assert state["mobileOrder"], label
    assert state["orientation"] == "What this lesson builds on", label
    assert state["orientationLabels"] == state["expectedOrientation"], label
    assert state["actualCode"] == state["expectedCode"], label
    assert state["taskVisible"] and state["taskQuestion"] == state["expectedQuestion"], label
    assert state["openOptional"] == 0, label
    assert not state["obsoleteSetup"] and state["forbiddenState"] == 0, label
    if item["follow"]:
        assert state["primaryOverview"] == 1 and state["summaryVisible"], label
        if item["deck"] != "visualise" or item["id"] == "V35":
            assert state["explorerCount"] or state["visibleExample"], label
        assert state["svgCount"] >= 1, label
        assert state["workedCount"] == state["workedCodeCount"] == 1, label
        assert state["essentialOpen"], label
        repeated = next((d["parts"] for d in state["syntaxDetails"] if d["summary"] == "Parameter syntax · explained below"), [])
        # Every authored part remains available. Parameter-only repetitions
        # may move to a closed reminder when complete current teaching follows.
        assert sorted(state["currentSyntax"] + repeated) == sorted(state["expectedSyntax"]), label
        assert sorted(state["visibleParameterIds"]) == sorted(state["expectedParameterIds"]), label
        for code in repeated:
            assert code.split("=", 1)[0].strip() in state["taughtParameterKeywords"], label
        assert state["calloutCount"] == 1 and not state["hiddenSyntaxToken"], label
        expected_details = []
        if repeated:
            expected_details.append(("Parameter syntax · explained below", repeated))
        if state["expectedReminders"]:
            expected_details.append(("Familiar syntax · quick reminder", state["expectedReminders"]))
        if state["expectedReference"]:
            expected_details.append(("Full syntax reference", state["expectedReference"]))
        assert [(d["summary"], d["parts"]) for d in state["syntaxDetails"]] == expected_details, label
        assert not any(d["open"] for d in state["syntaxDetails"]), label
        assert state["referenceCount"] == 0, label
    else:
        assert state["workedCount"] == 0 and state["referenceCount"] == 1, label
        if item["teaching"]:
            assert state["visibleTransition"] and state["visibleExample"], label
            assert state["transitionCodeCount"] == 1, label
            assert state["transitionParts"] == state["expectedTransitionParts"], label
            if state["transitionExpectedResult"]:
                assert state["transitionResult"], label
        else:
            assert state["primaryOverview"] == 1 and state["svgCount"] >= 1, label
        reference = page.locator(".foundation-reference-content > details.teaching-reference")
        assert reference.get_attribute("open") is None, label
        reference.locator("summary").click()
        assert reference.get_attribute("open") is not None, label
        assert reference.locator(".teaching-comparison").is_visible(), label
        assert reference.locator(".syntax-choice-callout").is_visible(), label
        assert reference.locator(".teaching-example").is_visible(), label
        assert page.locator("#foundationEditor").input_value() == state["expectedCode"], label
        no_overflow(page, (label, "concept reference open"))
        reference.locator("summary").click()
        assert reference.get_attribute("open") is None, label
    miniature = page.locator(".foundation-reference-content > details").filter(
        has=page.locator("summary", has_text="Worked miniature and expected values")
    )
    expected_miniature = item["follow"] and item["id"] != "V35" and (
        item["deck"] == "visualise" or bool(state["explorerCount"])
    )
    assert miniature.count() == bool(expected_miniature), label
    if expected_miniature:
        assert miniature.get_attribute("open") is None, label
        assert not miniature.locator(".teaching-example").is_visible(), label
        editor = page.locator("#foundationEditor")
        note = "# Keep my active code while reading the worked miniature"
        editor.fill(note)
        miniature.locator("summary").click()
        assert miniature.get_attribute("open") is not None, label
        assert miniature.locator(".teaching-example").is_visible(), label
        if state["miniatureHasValues"]:
            assert miniature.locator(".teaching-example-output").is_visible(), label
        assert editor.input_value() == note, label
        no_overflow(page, (label, "worked miniature open"))
        miniature.locator("summary").click()
        assert miniature.get_attribute("open") is None, label
        assert editor.input_value() == note, label
        editor.fill(state["expectedCode"])
    explorer = page.locator('article[aria-label="Lesson content"] .foundation-visual-explorer')
    if explorer.count():
        control = explorer.locator("select[data-visual-choice]")
        before = control.input_value()
        options = control.locator("option").evaluate_all("items=>items.map(e=>e.value)")
        choice = next(value for value in options if value != before)
        control.select_option(choice)
        expected = explorer.evaluate("""(e,choice)=>FoundationVisuals.exploration(e.dataset.foundationExplorer,choice,{statistic:e.dataset.visualStatistic})""", choice)
        assert explorer.locator(".teaching-visual-result > p").inner_text() == expected["summary"], label
        assert explorer.locator(".teaching-visual-result pre > code").inner_text() == expected["code"], label
        assert explorer.locator(".teaching-visual-result svg").get_attribute("aria-label") == expected["summary"], label
        assert page.locator("#foundationEditor").input_value() == state["expectedCode"], label
        control.select_option(before)
    no_overflow(page, label)
    return {"width": width, **item, "syntax": state["expectedSyntax"] if item["follow"] else state["expectedTransitionParts"], "explorerInteracted": bool(explorer.count()), "referenceOpenedAndClosed": not item["follow"], "miniatureOpenedAndClosed": bool(expected_miniature)}


def editor_interactions(page, width):
    item = {"deck": "inspect", "id": "I02", "index": 1}
    navigate(page, item)
    editor = page.locator("#foundationEditor")
    starter = editor.input_value()
    page.locator("#jumpToWork").click()
    assert editor.evaluate("e=>e.selectionStart") == starter.index("# Your work\n") + len("# Your work\n")
    assert editor.evaluate("e=>document.activeElement===e")
    editor.fill("x = 1\nx")
    editor.evaluate("e=>e.setSelectionRange(0,0)")
    editor.press("Tab")
    assert editor.input_value() == "    x = 1\nx"
    editor.press("Shift+Tab")
    assert editor.input_value() == "x = 1\nx"
    editor.press("Escape")
    editor.press("Tab")
    assert page.locator("#runExercise").evaluate("e=>document.activeElement===e")
    editor.focus()
    editor.press("Escape")
    editor.press("Shift+Tab")
    assert page.locator(".foundation-task-reminder").evaluate("e=>document.activeElement===e")
    page.locator("#resetExercise").click()
    assert editor.input_value() == starter

    navigate(page, {"deck": "inspect", "id": "I17", "index": 2})
    note = "# Keep this work while checking the concept"
    editor.fill(note)
    reference = page.locator(".foundation-reference-content > details.teaching-reference")
    reference.locator("summary").focus()
    reference.locator("summary").press("Enter")
    assert reference.get_attribute("open") is not None
    assert reference.locator(".teaching-flags").is_visible()
    assert "B · unique" in reference.inner_text()
    assert editor.input_value() == note
    reference.locator("summary").press("Enter")
    assert reference.get_attribute("open") is None
    assert editor.input_value() == note
    navigate(page, item)
    assert editor.input_value() == starter
    editor.fill("# This editor draft is temporary")
    page.reload()
    navigate(page, item)
    assert editor.input_value() == starter

    follow = {"deck": "inspect", "id": "I02", "index": 0}
    navigate(page, follow)
    editor.fill("# Keep code while changing explanation depth")
    page.locator('[data-learning-mode="refresh"]').click()
    assert page.locator(".teaching-essential").get_attribute("open") is None
    assert editor.input_value() == "# Keep code while changing explanation depth"
    page.locator('[data-learning-mode="learn"]').click()
    assert page.locator(".teaching-essential").get_attribute("open") is not None
    assert editor.input_value() == "# Keep code while changing explanation depth"
    no_overflow(page, (width, "editor and keyboard interactions"))
    return {"width": width, "jumpToWork": True, "indentAndOutdent": True, "escapeTabLeavesEditor": True, "resetRestoresSetupAndStarter": True, "keyboardReferencePreservesEditor": True, "navigationAndReloadDiscardDraft": True, "explanationDepthPreservesEditor": True}


with sync_playwright() as pw:
    launch = {}
    executable = args.browser_executable
    if args.engine == "chromium" and not executable and Path("/usr/bin/chromium").is_file():
        executable = "/usr/bin/chromium"
    if executable:
        launch["executable_path"] = executable
    browser = getattr(pw, args.engine).launch(**launch)
    page = browser.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(args.base_url + "/data-foundations.html?runtime=local&mode=learn#inspect/I01/0")
    page.wait_for_selector(".teaching-overview")
    rounds = page.evaluate("""FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map((r,i)=>({id:l.id,round:r.id,deck:l.deck,index:i,follow:!l.review&&i===0,teaching:!!r.teaching,source:r.retrieves||l.id})))""")
    assert len(rounds) == 338
    assert len({item["id"] for item in rounds}) == 110
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 1000})
        for item in rounds:
            navigate(page, item)
            records.append(inspect_round(page, item, width))
        interaction_records.append(editor_interactions(page, width))
    assert not errors, errors
    browser.close()

out = Path(args.output)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"engine": args.engine, "executable": executable, "lessons": 110, "practices": len(rounds), "renderedStates": len(records), "states": records, "editorInteractions": interaction_records, "pageErrors": errors}, indent=2) + "\n")
print(f"All {len(rounds)} teaching views at 1440px and 320px passed: authored syntax, content/code/reference order, computed explorers, disclosures, editor reset and keyboard interactions; zero page errors.")
