"""Stored Data guide code and full-frame alternatives in the actual UI worker.

Data has no answer grader. These are audit comparisons of execution, visible
outputs, fresh-data isolation and equivalent result frames.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ALTERNATIVES = {
    ('seoul', 'filter'): 'df = df.loc[df["Functioning Day"].eq("Yes")].copy()',
    ('candy', 'filter'): 'df = df.query("chocolate == 1").copy()',
    ('gapminder', 'filter'): 'df = df.loc[df.year.eq(2007)].copy()',
    ('wine', 'filter'): 'df = df.query("quality >= 6").copy()',
    ('seoul', 'create'): 'df = df.assign(temp_c=df["Temperature(°C)"].round(1))',
    ('candy', 'create'): 'df = df.assign(low_price_high_win=df.pricepercent.le(0.5) & df.winpercent.ge(50))',
    ('gapminder', 'create'): 'df = df.assign(gdp_total=df["pop"].mul(df["gdpPercap"]).round(0))',
    ('wine', 'create'): 'df = df.assign(alcohol_band=pd.cut(df["alcohol"], [0,10,12,20], labels=["low","mid","high"]))',
    ('seoul', 'seoul-peak-flag'): 'df = df.assign(peak_hour=(df.Hour.ge(7) & df.Hour.le(10)) | (df.Hour.ge(17) & df.Hour.le(20)))',
    ('candy', 'candy-value-score'): 'df = df.assign(win_per_price=df["winpercent"].div(df["pricepercent"].clip(lower=0.01)).round(2))',
    ('gapminder', 'gapminder-period'): 'df = df.assign(period=np.select([df.year.lt(1980)], ["earlier"], default="later"))',
    ('wine', 'wine-sulfur-ratio'): 'df = df.assign(sulfur_ratio=df["free sulfur dioxide"].div(df["total sulfur dioxide"].clip(lower=1)).round(2))',
}
FRAME_AUDIT = '''import hashlib as _audit_hashlib, json as _audit_json
_audit_json.dumps({"frame_sha256": _audit_hashlib.sha256(df.to_csv(index=True).encode("utf-8")).hexdigest(), "rows": len(df), "columns": [str(c) for c in df.columns], "dtypes": [str(d) for d in df.dtypes]})'''


def sha(code):
    return hashlib.sha256(code.encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:8162')
    parser.add_argument('--engine', choices=['chromium', 'webkit'], default='chromium')
    parser.add_argument('--output', type=Path, default=ROOT / 'tests/evidence/data-guide-worker')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    subprocess.run(['node', 'tests/extract_data_tasks.mjs'], cwd=ROOT, check=True)
    payload = json.loads(Path('/tmp/dspp-data-tasks.json').read_text())
    started = time.time()
    executions, visibility, alternatives = [], [], []
    report = {'engine': args.engine, 'real_pyodide': True, 'no_answer_grader': True,
              'execution_records': executions, 'visibility_checks': visibility,
              'alternative_checks': alternatives,
              'audit_capture_note': 'Visibility cases execute stored task code unchanged. Comparison cases append read-only full-frame CSV SHA-256, row/column/dtype metadata. No app code or computation is replaced.'}
    try:
        with sync_playwright() as p:
            browser = getattr(p, args.engine).launch()
            page = browser.new_page(viewport={'width': 834, 'height': 1000})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(args.base_url + '/playground.html?runtime=local')
            page.wait_for_function('!datasetLoading && currentDataset && document.querySelector("#runtimeDot").classList.contains("ready")', timeout=180000)
            source = page.evaluate('DataRuntimeSource')
            assert source == payload['setup'], 'Served Data runtime must match reviewed source.'
            report['runtime_source_sha256'] = sha(source)
            report['runtime_index_url'] = page.evaluate('PYODIDE_INDEX_URL')
            report['browser_version'] = browser.version
            report['task_registry_sha256'] = {}

            def worker(action, **kwargs):
                return page.evaluate('(request)=>sendWorker(request.action, request.payload)',
                                     {'action': action, 'payload': kwargs})

            def run(code, independent, label, tid):
                output = worker('run', code=code, independent=independent)['output']
                executions.append({'id': tid, 'case': label, 'independent': independent,
                                   'status': 'PASS' if output['status'] == 'ok' else 'FAIL',
                                   'runtime_status': output['status'], 'code': code,
                                   'code_sha256': sha(code), 'error': output.get('error')})
                assert output['status'] == 'ok', (tid, label, output.get('error'))
                return output

            def frame_metadata(independent=False):
                return json.loads(run(FRAME_AUDIT, independent, 'read_only_frame_capture', 'audit')['value'])

            for dataset, entry in payload['datasets'].items():
                page.locator('#datasetSelect').select_option(dataset)
                page.wait_for_function('(id)=>!datasetLoading && currentDataset?.id===id && document.querySelector("#runtimeDot").classList.contains("ready")', arg=dataset, timeout=180000)
                csv_source = (ROOT / entry['config']['file']).read_text()
                assert page.evaluate('currentDataset.csv').replace('\r\n', '\n') == csv_source, 'Served CSV must match reviewed data: ' + dataset
                served = page.evaluate('currentTasks')
                reviewed = {t['id']: t for t in entry['tasks']}
                assert set(reviewed) == {t['id'] for t in served}, dataset
                report['task_registry_sha256'][dataset] = sha(json.dumps(served, sort_keys=True, separators=(',', ':'), ensure_ascii=False))
                for task in served:
                    local = reviewed[task['id']]
                    assert task == local, ('Served task contract must match reviewed source', dataset, task['id'])
                # Keep a visibly different route frame to prove optional tasks use
                # fresh original data and do not mutate the route frame.
                run('df = df.head(3).copy()\ndf["audit_route_marker"] = "retained route"\ndf', False, 'isolation_fixture', dataset)
                route_before = frame_metadata()
                wrangle = [t for t in served if t.get('optional') and t['stage'] == 'wrangle']
                assert len(wrangle) == 8, (dataset, len(wrangle))
                for task in wrangle:
                    cell = page.evaluate('async(id)=>{await insertTask(currentTasks.find(t=>t.id===id));const cell=cells.find(c=>c.taskId===id);return {id:cell.id, code:cell.code, independent:cell.independent, output:cell.output};}', task['id'])
                    output = cell['output']
                    assert cell['code'] == task['code'] and cell['independent'] is True
                    visible = bool(output and (output.get('table') is not None or output.get('value') or output.get('stdout', '').strip() or output.get('charts') or output.get('events')))
                    rendered = page.locator(f'[data-output-for="{cell["id"]}"]').inner_text().strip()
                    route_after = frame_metadata()
                    ok = output['status'] == 'ok' and visible and bool(rendered) and route_before == route_after
                    if task['id'] == 'quality-duplicates':
                        ok = ok and output['stdout'] == 'Before: 22\nKnown copies: 2\nAfter: 20\n'
                        identity_code = task['code'] + '\npd.testing.assert_frame_equal(cleaned.drop(columns=["teaching_record_id"]).reset_index(drop=True), df.head(20).reset_index(drop=True), check_exact=True)\nprint("All 20 source record identities retained.")'
                        run(identity_code, True, 'exact_known_copy_identity', dataset + '/' + task['id'])
                    record = {'id': dataset + '/' + task['id'], 'status': 'PASS' if ok else 'FAIL',
                              'dataset_specific_transformation': task['id'].startswith(dataset + '-'),
                              'runtime_status': output['status'], 'has_visible_evidence': visible,
                              'rendered_output': rendered[:2000], 'exact_route_frame_preserved': route_before == route_after,
                              'stored_code': task['code'], 'stored_code_sha256': sha(task['code']),
                              'displayed_table_rows': output['table']['rowCount'] if output.get('table') else None}
                    visibility.append(record)
                    executions.append({'id': record['id'], 'case': 'stored_code_ui', 'independent': True,
                                       'status': 'PASS' if output['status'] == 'ok' else 'FAIL',
                                       'runtime_status': output['status'], 'code': task['code'], 'code_sha256': sha(task['code'])})
                    assert ok, record
                print(dataset, 'all optional Wrangle UI outputs passed', flush=True)
                for (ds, tid), alternate in ALTERNATIVES.items():
                    if ds != dataset:
                        continue
                    task = reviewed[tid]
                    frames = []
                    runs = []
                    for label, code in [('canonical', task['code']), ('alternative', alternate)]:
                        worker('init', csv=csv_source, sep=entry['config']['sep'])
                        for prerequisite in entry['tasks']:
                            if prerequisite['id'] in task['prerequisites']:
                                run(prerequisite['code'], False, 'prerequisite:' + prerequisite['id'], dataset + '/' + tid)
                        before = frame_metadata()
                        output = run(code + '\n' + FRAME_AUDIT, task['optional'], label, dataset + '/' + tid)
                        frames.append(json.loads(output['value']))
                        preserved = not task['optional'] or frame_metadata() == before
                        runs.append({'case': label, 'status': 'PASS', 'route_frame_preserved': preserved,
                                     'code_sha256': sha(code), 'frame': frames[-1]})
                        assert preserved, (dataset, tid, label)
                    equal = frames[0] == frames[1]
                    record = {'id': dataset + '/' + tid, 'status': 'PASS' if equal else 'FAIL',
                              'full_frame_equivalence': equal, 'all_result_rows': frames[0]['rows'],
                              'canonical_stored_code_sha256': sha(task['code']), 'alternative_code': alternate,
                              'alternative_code_sha256': sha(alternate), 'runs': runs}
                    alternatives.append(record)
                    assert equal, record
                page.screenshot(path=str(args.output / (args.engine + '-' + dataset + '-wrangle.png')))
            assert not errors, errors
            browser.close()
        report['status'] = 'PASS'
    except BaseException as error:
        report['status'] = 'FAIL'
        report['blocking_error'] = str(error)
        raise
    finally:
        report.update(seconds=round(time.time() - started, 1), worker_run_executions=len(executions),
                      optional_wrangle_outputs=len(visibility),
                      dataset_specific_isolated_transformations=sum(r['dataset_specific_transformation'] for r in visibility),
                      meaningful_alternative_pairs=len(alternatives), full_frame_rows_compared=sum(r['all_result_rows'] for r in alternatives))
        (args.output / (args.engine + '-data-guide-coverage.json')).write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
        print(json.dumps({k: v for k, v in report.items() if k not in ('execution_records', 'visibility_checks', 'alternative_checks')}, indent=2), flush=True)


if __name__ == '__main__':
    main()
