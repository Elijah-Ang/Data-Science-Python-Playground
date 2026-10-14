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
    state = page.evaluate("""r=>{
      const lesson=FoundationsCurriculum.lessons.find(l=>l.id===r.id),round=lesson.rounds[r.index];
      const primary=document.querySelector('article[aria-label="Lesson content"]');
      const editor=document.querySelector('.foundation-code-pane');
      const reference=document.querySelector('.foundation-reference-content');
      const visible=e=>!!e && !!e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
      const current=selector=>Array.from(primary.querySelectorAll(selector)).filter(e=>!e.closest('.foundation-reference-content'));
      const texts=selector=>current(selector).map(e=>e.textContent);
      const params=new Set([...(round.parameterTeaching?.introduces||[]),...(round.parameterTeaching?.extends||[])].map(name=>name.split('.').at(-1)));
      const essential=round.syntaxGuidance.current.filter(p=>!params.has(p[0].match(/^\\s*([A-Za-z_]\\w*)\\s*=/)?.[1]));
      return {
        expectedCode:FoundationWorkspace.code(FoundationsCurriculum,round),
        actualCode:document.querySelector('#foundationEditor').value,
        order:Array.from(document.querySelector('.foundation-split').children,e=>e.matches('.foundation-code-pane')?'code':'content'),
        referenceInsideArticle:reference.parentElement===primary,
        mobileOrder:primary.getBoundingClientRect().bottom<=editor.getBoundingClientRect().top+1,
        panelsFit:[primary,editor,reference].every(e=>{const b=e.getBoundingClientRect();return b.left>=-1&&b.right<=innerWidth+1&&b.width<=e.parentElement.getBoundingClientRect().width+1;}),
        details:Array.from(primary.querySelectorAll('details'),e=>({summary:e.querySelector('summary').textContent,open:e.open,nested:!!e.parentElement.closest('details')})),
        forbiddenModes:primary.querySelectorAll('.teaching-orientation,.learning-mode-selector,[data-learning-mode]').length,
        expectedQuestion:LearningLanguage.plain(round.brief.question).replace(/`/g,''),
        taskQuestion:document.querySelector('.foundation-task-reminder .practice-question')?.textContent,
        taskVisible:visible(document.querySelector('.foundation-task-reminder .practice-question')),
        primaryOverview:current('.teaching-overview').length,
        summaryVisible:visible(current('.teaching-summary')[0]),
        svgCount:current('svg[role="img"]').length,
        explorerCount:current('.foundation-visual-explorer').length,
        visibleExample:visible(current('.teaching-example')[0]),
        visibleTransition:visible(current('.teaching-transition')[0]),
        transitionCode:texts('.teaching-transition pre > code'),
        expectedTransitionCode:round.teaching?.code,
        transitionParts:texts('.teaching-transition .teaching-syntax-parts dt code'),
        expectedTransitionParts:round.teaching?.parts.map(part=>part[0])||[],
        transitionResult:visible(current('.teaching-transition .teaching-example-output')[0])||visible(current('.teaching-transition .teaching-example-result')[0]),
        transitionExpectedResult:!!(round.teaching?.output||round.teaching?.result),
        workedCount:current('.teaching-worked').length,
        workedCode:texts('.teaching-worked > pre > code'),
        expectedWorkedCode:lesson.deck==='visualise'?lesson.syntaxCode:lesson.example,
        currentSyntax:texts('.teaching-worked > .teaching-syntax-parts dt code'),
        expectedSyntax:essential.map(p=>p[0]),
        visibleParameterIds:current('.foundation-parameter-teaching [data-parameter]').filter(visible).map(e=>e.dataset.parameter),
        expectedParameterIds:[...new Set([...(round.parameterTeaching?.introduces||[]),...(round.parameterTeaching?.extends||[])])],
        hiddenSyntaxToken:current('.teaching-worked > .teaching-syntax-parts code span').some(e=>getComputedStyle(e).display==='none'),
        referenceRemoved:!primary.querySelector('.foundation-reference,.foundation-reference-body,.teaching-recall,.foundation-parameter-reference'),
        taskOnLeft:primary.contains(document.querySelector('.foundation-task-reminder')),
        workedMarks:primary.querySelectorAll('.teaching-worked mark').length,
        forbiddenState:document.querySelectorAll('progress,[role="progressbar"],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue').length
      };
    }""", item)
    label = (width, item)
    assert state["order"] == ["content", "code"], label
    assert state["referenceInsideArticle"] and state["panelsFit"], label
    if width == 320:
        assert state["mobileOrder"], label
    assert state["details"] == [
        {"summary": title, "open": False, "nested": False}
        for title in ("Hint", "Reveal solution")
    ], label
    assert state["forbiddenModes"] == state["forbiddenState"] == 0, label
    assert state["actualCode"] == state["expectedCode"], label
    assert state["taskVisible"] and state["taskQuestion"] == state["expectedQuestion"], label
    assert sorted(state["visibleParameterIds"]) == sorted(state["expectedParameterIds"]), label
    assert not state["hiddenSyntaxToken"], label
    if item["follow"]:
        assert state["primaryOverview"] == 1 and state["summaryVisible"], label
        if item["deck"] != "visualise" or item["id"] == "V35":
            assert state["explorerCount"] or state["visibleExample"], label
        assert state["svgCount"] >= 1, label
        assert state["workedCount"] == 1, label
        assert state["workedCode"] == [state["expectedWorkedCode"]], label
        assert state["currentSyntax"] == state["expectedSyntax"], label
    else:
        assert state["workedCount"] == 0, label
        if item["teaching"]:
            assert state["visibleTransition"] and state["visibleExample"], label
            assert state["transitionCode"] == [state["expectedTransitionCode"]], label
            assert state["transitionParts"] == state["expectedTransitionParts"], label
            if state["transitionExpectedResult"]:
                assert state["transitionResult"], label
        else:
            assert state["primaryOverview"] == 1 and state["svgCount"] >= 1, label

    assert state["referenceRemoved"] and state["taskOnLeft"] and state["workedMarks"] == 0, label
    reference = page.locator("#foundationHint")
    assert reference.count() == 1, label
    reference.locator(":scope > summary").click()
    assert reference.get_attribute("open") is not None, label
    assert reference.locator("details").count() == 0, label
    assert page.locator("#foundationEditor").input_value() == state["expectedCode"], label
    no_overflow(page, (label, "reference open"))
    reference.locator(":scope > summary").click()
    assert reference.get_attribute("open") is None, label

    explorer = page.locator('article[aria-label="Lesson content"] .foundation-visual-explorer')
    if explorer.count():
        control = explorer.locator("select[data-visual-choice]")
        before = control.input_value()
        options = control.locator("option").evaluate_all("items=>items.map(e=>e.value)")
        choice = next(value for value in options if value != before)
        control.select_option(choice)
        expected = explorer.evaluate("""(e,choice)=>FoundationVisuals.exploration(e.dataset.foundationExplorer,choice,{statistic:e.dataset.visualStatistic})""", choice)
        caption = explorer.locator(".teaching-visual-result > p").inner_text()
        assert 0 < len(caption) <= 180, (label, "concise live explanation", caption)
        assert explorer.locator(".teaching-visual-result pre > code").inner_text() == expected["code"], label
        assert explorer.locator(".teaching-visual-result svg").get_attribute("aria-label") == expected["summary"], label
        assert page.locator("#foundationEditor").input_value() == state["expectedCode"], label
        control.select_option(before)
    no_overflow(page, label)
    return {"width": width, **item, "syntax": state["expectedSyntax"] if item["follow"] else state["expectedTransitionParts"], "explorerInteracted": bool(explorer.count()), "hintOpenedAndClosed": True, "topLevelDisclosures": 2}


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
    reference = page.locator("#foundationHint")
    reference.locator("summary").focus()
    reference.locator("summary").press("Enter")
    assert reference.get_attribute("open") is not None
    assert reference.locator("p").inner_text()
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

    navigate(page, {"deck": "inspect", "id": "I02", "index": 0})
    assert page.locator('[data-learning-mode], .teaching-orientation').count() == 0
    no_overflow(page, (width, "editor and keyboard interactions"))
    return {"width": width, "jumpToWork": True, "indentAndOutdent": True, "escapeTabLeavesEditor": True, "resetRestoresSetupAndStarter": True, "keyboardHintPreservesEditor": True, "navigationAndReloadDiscardDraft": True, "noExplanationModes": True}


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
    page.goto(args.base_url + "/data-foundations.html?runtime=local#inspect/I01/0")
    page.wait_for_selector(".teaching-overview")
    build_info = page.evaluate("async()=>{const r=await fetch('build-info.json');return r.ok?await r.json():null;}")
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
    final_build = page.evaluate("async()=>{const r=await fetch('build-info.json');return r.ok?await r.json():null;}")
    assert (final_build or {}).get("contentId") == (build_info or {}).get("contentId"), "Build changed during the browser sweep"
    browser.close()

out = Path(args.output)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"engine": args.engine, "executable": executable, "buildInfo": build_info, "lessons": 110, "practices": len(rounds), "renderedStates": len(records), "states": records, "editorInteractions": interaction_records, "pageErrors": errors}, indent=2) + "\n")
print(f"All {len(rounds)} teaching views at 1440px and 320px passed: authored syntax, two-column order, computed explorers, two help disclosures, editor reset and keyboard interactions; zero page errors.")
