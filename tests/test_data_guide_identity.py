"""Known teaching copies retain distinct source records with identical measurements."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    subprocess.run(['node', 'tests/extract_data_tasks.mjs'], cwd=ROOT, check=True)
    payload = json.loads(Path('/tmp/dspp-data-tasks.json').read_text())
    ns = {}
    exec(payload['setup'], ns)
    captured = []
    original_serializer = ns['_frame_payload']

    def capture(value, *positional, **keywords):
        if not positional and not keywords and isinstance(value, ns['pd'].DataFrame):
            captured.append(value.copy(deep=True))
        return original_serializer(value, *positional, **keywords)

    ns['_frame_payload'] = capture
    records = []
    for dataset, entry in payload['datasets'].items():
        task = next(t for t in entry['tasks'] if t['id'] == 'quality-duplicates')
        for scenario in ('fresh', 'after_route'):
            ns['initialize']((ROOT / entry['config']['file']).read_text(), entry['config']['sep'])
            if scenario == 'after_route':
                for prerequisite in entry['tasks'][:6]:
                    result = ns['execute_cell'](prerequisite['code'])
                    assert result['status'] == 'ok', (dataset, prerequisite['id'], result.get('error'))
            route_before = ns['user_namespace']['df'].copy(deep=True)
            source = ns['original_df'].head(20).reset_index(drop=True)
            canonical = ns['execute_cell'](task['code'], True)
            assert canonical['status'] == 'ok', (dataset, scenario, canonical.get('error'))
            assert canonical['stdout'] == 'Before: 22\nKnown copies: 2\nAfter: 20\n', (dataset, canonical['stdout'])
            ns['pd'].testing.assert_frame_equal(route_before, ns['user_namespace']['df'], check_exact=True)
            captured.clear()
            # Read the actual cleaned table before normal bounded serialization;
            # the authored transformation and runtime remain unchanged.
            audit_code = task['code'] + '\ncleaned'
            audit = ns['execute_cell'](audit_code, True)
            assert audit['status'] == 'ok' and captured, (dataset, scenario, audit.get('error'))
            cleaned = captured[-1]
            assert list(cleaned['teaching_record_id']) == list(range(20))
            ns['pd'].testing.assert_frame_equal(source, cleaned.drop(columns=['teaching_record_id']).reset_index(drop=True), check_exact=True)
            ns['pd'].testing.assert_frame_equal(route_before, ns['user_namespace']['df'], check_exact=True)
            records.append({'id': dataset + '/' + task['id'], 'scenario': scenario, 'status': 'PASS',
                            'stored_code': task['code'], 'stored_code_sha256': hashlib.sha256(task['code'].encode()).hexdigest(),
                            'canonical_stdout': canonical['stdout'], 'canonical_visible_evidence': True,
                            'canonical_table_rows': canonical['table']['rowCount'] if canonical.get('table') else None,
                            'canonical_runtime_state': canonical['state'],
                            'source_duplicate_measurement_records': int(source.duplicated().sum()),
                            'all_20_source_record_identities_preserved': True, 'exact_source_values_and_types_preserved': True,
                            'route_data_preserved': True, 'native_runtime_executions': 2,
                            'audit_capture_code': audit_code, 'no_answer_grader': True})
    report = {'affected_scenarios': len(records), 'executions': len(records) * 2,
              'status': 'PASS', 'checks': records, 'no_answer_grader': True,
              'execution_engine': 'native Python with the extracted production DataRuntimeSource'}
    if args.output:
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output / 'data-known-copy-final-executions.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'checks'}, indent=2))


if __name__ == '__main__':
    main()
