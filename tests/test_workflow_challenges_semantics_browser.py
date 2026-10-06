"""Every workflow reference, meaningful alternative and near miss in real Pyodide."""
import argparse
import hashlib
import json
from pathlib import Path
import runpy
import time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
variants = runpy.run_path(str(ROOT / 'tests/test_workflow_challenges_semantics.py'))
parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8162')
parser.add_argument('--engine', choices=['chromium', 'webkit'], default='chromium')
parser.add_argument('--output', type=Path, default=ROOT / 'tests/evidence/workflow-semantic-audit')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
started = time.time()
checks = []
failures = []
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(args.base_url + '/data-foundations.html?runtime=local#inspect/challenges')
    page.wait_for_selector('.case-file')
    registry = page.evaluate('DataWorkflowChallenges.challenges')
    assert len(registry) == 30
    assert registry == variants['REGISTRY']['challenges'], 'Preview registry must match the reviewed source.'
    assert page.evaluate('JSON.parse(JSON.stringify(FoundationsCurriculum))') == variants['CURRICULUM'], 'Preview lessons must match the reviewed curriculum.'
    curriculum_sha256 = json.loads((ROOT / 'challenges/foundations-baseline.json').read_text())['sha256']
    browser_version = browser.version
    runtime_source = page.evaluate('FoundationsRuntimeSource')
    expected_runtime = '\n'.join((ROOT / name).read_text() for name in
                                 ('table-serialization.py', 'foundations/runtime.py', 'challenges/runtime.py'))
    assert runtime_source == expected_runtime, 'Preview runtime must match the reviewed source.'
    runtime_sha256 = hashlib.sha256(runtime_source.encode()).hexdigest()

    def open_challenge(c):
        page.evaluate('(c)=>location.hash=`#${c.deck}/challenges/${c.id}`', c)
        page.wait_for_function('(id)=>document.querySelector(".foundation-breadcrumb")?.textContent.endsWith(id)', arg=c['id'])
        page.wait_for_function('!document.querySelector("#runExercise").disabled', timeout=180000)

    def check(c, case, code, expected, required_status=None):
        page.locator('#foundationEditor').fill(code)
        page.locator('#checkExercise').click()
        page.wait_for_function('!document.querySelector("#runExercise").disabled', timeout=180000)
        statuses = page.locator('.case-results-body li').evaluate_all('(nodes)=>nodes.map(n=>({status:n.className,text:n.innerText}))')
        feedback = page.locator('#foundationFeedback').inner_text()
        accepted = bool(statuses) and all(s['status'] == 'check-correct' for s in statuses) and 'Python stopped' not in feedback
        named_statuses = {d['id']: statuses[i]['status'] for i, d in enumerate(c['deliverables']) if i < len(statuses)}
        matched = accepted == expected and (required_status is None or all(named_statuses.get(name) == state for name, state in required_status.items()))
        record = {'id': c['id'], 'case': case, 'expected_acceptance': expected,
                  'actual_acceptance': accepted, 'status': 'PASS' if matched else 'FAIL',
                  'deliverables': statuses, 'feedback': feedback,
                  'named_statuses': named_statuses, 'required_status': required_status,
                  'code_sha256': hashlib.sha256(code.encode()).hexdigest(), 'code': code}
        checks.append(record)
        if not matched:
            record['python_output'] = page.locator('#foundationOutput').inner_text()
            failures.append(record)
            page.screenshot(path=str(args.output / (args.engine + '-' + c['id'] + '-' + case + '-FAIL.png')))

    for c in registry:
        open_challenge(c)
        check(c, 'reference', c['reference'], True)
        check(c, 'meaningful_alternative', c['setup'] + '\n' + variants['ALTERNATIVES'][c['id']], True)
        old, new = variants['NEAR_MISSES'][c['id']]
        assert old in c['reference']
        check(c, 'semantic_near_miss', c['reference'].replace(old, new), False)
        for source in c['inputs']:
            check(c, 'source_mutation_' + source['name'], c['reference'] +
                  '\n' + source['name'] + '.iloc[0, 0] = "changed source record"', False)
        if c['id'].startswith('VC'):
            check(c, 'hidden_named_figure', c['reference'] + '\nfig.set_visible(False)', False, {'fig': 'check-needs-attention'})
        if c['id'] in variants['CHART_MAPPING_NEAR_MISSES']:
            old, new = variants['CHART_MAPPING_NEAR_MISSES'][c['id']]
            alternative = c['setup'] + '\n' + variants['ALTERNATIVES'][c['id']]
            assert old in alternative
            check(c, 'wrong_category_value_mapping', alternative.replace(old, new), False,
                  {'fig': 'check-needs-attention'})
        if c['id'] == 'VC01':
            check(c, 'transparent_figure_background', c['reference'] + '\nfig.patch.set_alpha(0)', True, {'fig': 'check-correct'})
        print(c['id'], 'browser audit finished', flush=True)
    c = next(c for c in registry if c['id'] == 'WC08')
    open_challenge(c)
    assert 'Store the finished table in combined.' in page.locator('#case-deliverables').inner_text()
    check(c, 'unchanged_second', c['reference'] +
          "\nsecond.rename(columns={'duration':'minutes'}, inplace=True)", False)
    check(c, 'free_row_and_index_order', c['reference'] +
          '\ncombined = combined.iloc[::-1].set_axis(range(500, 500 + len(combined)))', True)
    for theme in ('light', 'dark'):
        page.evaluate('(theme)=>AppAppearance.apply(theme)', theme)
        page.locator('.case-help > summary').click()
        if page.locator('.case-help').get_attribute('open') is None:
            page.locator('.case-help > summary').click()
        page.get_by_text('Hint 2 — Tools', exact=True).click()
        if not page.get_by_text('Hint 2 — Tools', exact=True).evaluate('(e)=>e.parentElement.open'):
            page.get_by_text('Hint 2 — Tools', exact=True).click()
        assert 'sort_values' not in page.locator('.case-help').inner_text()
        page.screenshot(path=str(args.output / (args.engine + '-WC08-' + theme + '.png')))
    assert not page.evaluate('Object.keys(localStorage).some(k=>/challenge|progress|completion|draft/i.test(k))')
    assert not errors, errors
    browser.close()

report = {'engine': args.engine, 'challenges': len(registry), 'executions': len(checks),
          'passed': len(checks) - len(failures), 'failed': len(failures), 'real_pyodide': True,
          'runtime_source_sha256': runtime_sha256,
          'reviewed_curriculum_sha256': curriculum_sha256, 'browser_version': browser_version,
          'seconds': round(time.time() - started, 1), 'checks': checks}
(args.output / (args.engine + '-coverage.json')).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'checks'}, indent=2))
assert not failures, failures
