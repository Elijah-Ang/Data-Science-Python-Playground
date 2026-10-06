"""Execute the 19 self-contained teaching transitions and verify shown claims."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--evidence-dir', type=Path, default=ROOT / 'tests/evidence/foundations-audit')
args = parser.parse_args()
args.evidence_dir.mkdir(parents=True, exist_ok=True)
curriculum = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT, text=True))
ns = {}
exec((ROOT / 'table-serialization.py').read_text() + '\n' + (ROOT / 'foundations/runtime.py').read_text(), ns)
ns['_ensure_plotting']()
pd, np = ns['pd'], ns['np']


def cell(value):
    if pd.isna(value):
        return None
    if isinstance(value, str):
        try:
            numeric = float(value)
            return None if np.isnan(numeric) else numeric
        except ValueError:
            return value
    return float(value) if isinstance(value, (int, float, np.number)) else value


def same_rows(actual, expected):
    actual, expected = [[cell(v) for v in row] for row in actual], [[cell(v) for v in row] for row in expected]
    assert actual == expected, (actual, expected)
    return actual


records = []
for lesson in curriculum['lessons']:
    for round in lesson['rounds']:
        teaching = round.get('teaching')
        if not teaching:
            continue
        result = ns['_execute'](teaching['code'], {}, explicit_setup=True)
        assert not result['error'], (round['id'], result['error'])
        value, env, figures = result['last'], result['env'], result['figures']
        actual = None
        if not figures and teaching.get('output'):
            expected = teaching['output']
            if isinstance(value, pd.DataFrame):
                headers = list(value.columns)
                actual = value.values.tolist()
                if expected['headers'][0] == 'row':
                    headers = ['row', *headers]
                    actual = [[index, *row] for index, row in zip(value.index, actual)]
                assert headers == expected['headers'], round['id']
            elif isinstance(value, pd.Series):
                actual = [[index, item] for index, item in value.items()]
            else:
                source = env['sample']['score'].iloc[-len(value):].tolist()
                actual = [[input_value, float(output[0])] for input_value, output in zip(source, value)]
            actual = same_rows(actual, expected['rows'])
        elif round['id'] == 'I14-2':
            assert value == ['S', 'M'], value
            actual = value
        elif round['id'] == 'V08-2':
            ax = figures[0].axes[0]
            expected = teaching['output']['rows']
            actual = same_rows([[label.get_text(), patch.get_height()] for label, patch in zip(ax.get_xticklabels(), ax.patches)], expected)
            assert (ax.get_xlabel(), ax.get_ylabel()) == ('sky', 'Count')
        elif round['id'] == 'V18-3':
            ax = figures[0].axes[0]
            actual = same_rows(list(zip(ax.lines[0].get_xdata(), ax.lines[0].get_ydata())), [[1, 5], [2, 7], [3, 6]])
            assert ax.lines[0].get_marker() == 'o'
        elif round['id'] == 'V32-2':
            grid = env['g']
            assert len(figures[0].axes) == 3
            actual = same_rows(grid.ax_joint.collections[0].get_offsets().tolist(), [[1, 60], [2, 70], [3, 80]])
            assert any(list(line.get_ydata()) == [70, 70] and line.get_linestyle() == '--' for line in grid.ax_joint.lines)
            assert sum(patch.get_height() for patch in grid.ax_marg_x.patches) == 3
            assert sum(patch.get_width() for patch in grid.ax_marg_y.patches) == 3
        elif round['id'] == 'V33-2':
            grid = env['g']
            assert grid.col_names == ['A', 'B']
            actual = []
            for ax, medians in zip(grid.axes.flat, ([21, 18], [25, 22])):
                boxes = ns['_box_summary'](ax, {})
                assert [box[0] for box in boxes] == ['Sun', 'Rain']
                assert [box[3] for box in boxes] == medians
                actual.append([[box[0], box[3]] for box in boxes])
            assert figures[0].get_size_inches()[1] == 3
        elif round['id'] == 'V33-3':
            grid = env['g']
            assert grid.col_names == ['Puzzle', 'Race']
            actual = []
            for genre, ax in zip(grid.col_names, grid.axes.flat):
                edges = [patch.get_x() for patch in ax.patches] + [ax.patches[-1].get_x() + ax.patches[-1].get_width()]
                observed = [float(patch.get_height()) for patch in ax.patches]
                expected = np.histogram(env['sample'].loc[env['sample']['genre'] == genre, 'minutes'], bins=edges)[0]
                np.testing.assert_array_equal(observed, expected)
                assert sum(observed) == 4
                actual.append([genre, observed])
            assert figures[0].get_size_inches()[1] == 3
        else:
            raise AssertionError('Missing teaching-example semantic check: ' + round['id'])
        records.append({'exercise': round['id'], 'title': teaching['title'], 'code': teaching['code'], 'claimed_output': teaching.get('output') or teaching['result'], 'observed': actual, 'status': 'passed'})
assert len(records) == 19
evidence = {'count': len(records), 'passed': len(records), 'failed': 0,
            'source_hashes': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in ('foundations/runtime.py', 'foundations/clarity.js', 'foundations/teaching.js')}, 'examples': records}
(args.evidence_dir / 'teaching-examples.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print('All 19 teaching transitions executed and their displayed table/plot claims passed semantic checks.')
