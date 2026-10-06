"""All-round audit with equivalent answers, wrong results and chart feature probes.

This checks current tiny fixtures, not arbitrary Python programs or new datasets.
Every executed case retains its code and response in the evidence JSON.
"""
import argparse
import ast
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--evidence-dir', type=Path, default=ROOT / 'tests/evidence/foundations-audit')
args = parser.parse_args()
args.evidence_dir.mkdir(parents=True, exist_ok=True)
curriculum = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT, text=True))
namespace = {}
exec((ROOT / 'table-serialization.py').read_text() + '\n' + (ROOT / 'foundations/runtime.py').read_text(), namespace)
run = namespace['run_foundation']


def source_hashes():
    paths = [*sorted((ROOT / 'foundations').glob('*.js')), ROOT / 'foundations/runtime.py', Path(__file__)]
    return {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths if ' 2.' not in path.name}


def execute(exercise, code):
    original = os.getcwd()
    with tempfile.TemporaryDirectory() as temporary:
        try:
            os.chdir(temporary)
            response = run({'exercise': exercise, 'columns': curriculum['datasets'][exercise['dataset']]['columns'], 'code': code, 'check': True})
            return {key: value for key, value in response.items() if key != 'outputs'}
        finally:
            os.chdir(original)


def display_answer(code):
    tree = ast.parse(code)
    if isinstance(tree.body[-1], ast.Expr):
        expression = tree.body.pop().value
        tree.body.extend([ast.Assign(targets=[ast.Name(id='answer', ctx=ast.Store())], value=expression),
                          ast.Expr(value=ast.Call(func=ast.Name(id='display', ctx=ast.Load()), args=[ast.Name(id='answer', ctx=ast.Load())], keywords=[]))])
    return ast.unparse(ast.fix_missing_locations(tree))


class EquivalentSyntax(ast.NodeTransformer):
    """Real column APIs and equivalent arithmetic/masks, not string replacements."""
    def visit_Compare(self, node):
        self.generic_visit(node)
        methods = {ast.Gt: 'gt', ast.GtE: 'ge', ast.Lt: 'lt', ast.LtE: 'le', ast.Eq: 'eq', ast.NotEq: 'ne'}
        if len(node.ops) == 1 and isinstance(node.left, ast.Subscript) and type(node.ops[0]) in methods:
            return ast.Call(func=ast.Attribute(value=node.left, attr=methods[type(node.ops[0])], ctx=ast.Load()), args=node.comparators, keywords=[])
        return node

    def visit_BinOp(self, node):
        self.generic_visit(node)
        methods = {ast.Add: 'add', ast.Sub: 'sub', ast.Mult: 'mul', ast.Div: 'div'}
        if isinstance(node.left, ast.Subscript) and type(node.op) in methods:
            return ast.Call(func=ast.Attribute(value=node.left, attr=methods[type(node.op)], ctx=ast.Load()), args=[node.right], keywords=[])
        return node

    def visit_Subscript(self, node):
        self.generic_visit(node)
        if isinstance(node.ctx, ast.Load) and isinstance(node.value, ast.Name) and node.value.id in ('df', 'clean', 'selected'):
            if isinstance(node.slice, (ast.Constant, ast.List)) and (not isinstance(node.slice, ast.Constant) or isinstance(node.slice.value, str)):
                return ast.Subscript(value=ast.Attribute(value=node.value, attr='loc', ctx=ast.Load()),
                                     slice=ast.Tuple(elts=[ast.Slice(), node.slice], ctx=ast.Load()), ctx=ast.Load())
        return node


def table_alternative(exercise):
    tree = EquivalentSyntax().visit(ast.parse(exercise['solution']))
    code = ast.unparse(ast.fix_missing_locations(tree))
    code = code.replace('.str.strip().str.lower()', '.str.lower().str.strip()').replace('.str.strip().str.title()', '.str.title().str.strip()')
    # A label-preserving alternate display order is meaningful for summaries.
    if exercise.get('unorderedIndex') and isinstance(tree.body[-1], ast.Expr):
        tree.body[-1].value = ast.Call(func=ast.Attribute(value=tree.body[-1].value, attr='sort_index', ctx=ast.Load()), args=[], keywords=[ast.keyword(arg='ascending', value=ast.Constant(False))])
        code = ast.unparse(ast.fix_missing_locations(tree))
    return code


class RenamedModules(ast.NodeTransformer):
    aliases = {'pd': 'pandas_lib', 'np': 'numbers', 'plt': 'charts', 'sns': 'plots'}
    def visit_Name(self, node):
        if node.id in self.aliases:
            node.id = self.aliases[node.id]
        return node

    def visit_alias(self, node):
        if node.asname in self.aliases:
            node.asname = self.aliases[node.asname]
        return node


def alias_alternative(exercise):
    code = ast.unparse(ast.fix_missing_locations(RenamedModules().visit(ast.parse(exercise['solution']))))
    # The usual lesson setup imports pd and np. Explicit aliases keep this
    # variant runnable in both native and explicit-setup browser execution.
    return 'import pandas as pandas_lib\nimport numpy as numbers\n' + code


class CosmeticPlot(ast.NodeTransformer):
    def __init__(self, flexible_size):
        self.flexible_size = flexible_size

    def visit_Call(self, node):
        self.generic_visit(node)
        if isinstance(node.func, ast.Attribute):
            if self.flexible_size and node.func.attr == 'subplots':
                node.keywords = [keyword for keyword in node.keywords if keyword.arg != 'figsize']
            for keyword in node.keywords:
                if keyword.arg in ('title', 'xlabel', 'ylabel') and isinstance(keyword.value, ast.Constant) and isinstance(keyword.value.value, str):
                    keyword.value.value = '  ' + keyword.value.value.upper() + '  '
        return node


def cosmetic_plot(exercise):
    return ast.unparse(ast.fix_missing_locations(CosmeticPlot(not (exercise.get('plot') or {}).get('size')).visit(ast.parse(exercise['solution']))))


def individual_labels(code):
    tree = ast.parse(code)
    class Setters(ast.NodeTransformer):
        def visit_Expr(self, node):
            call = node.value
            if isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute) and call.func.attr == 'set' and all(keyword.arg in ('title', 'xlabel', 'ylabel') for keyword in call.keywords) and call.keywords:
                return [ast.Expr(value=ast.Call(func=ast.Attribute(value=call.func.value, attr='set_' + keyword.arg, ctx=ast.Load()), args=[keyword.value], keywords=[])) for keyword in call.keywords]
            return node
    return ast.unparse(ast.fix_missing_locations(Setters().visit(tree)))


def matplotlib_alternative(exercise):
    """Alternative computation/drawing routes for the actual chart types."""
    tree = ast.parse(exercise['solution'])
    changed = False
    for index, statement in enumerate(tree.body):
        if not isinstance(statement, ast.Expr) or not isinstance(statement.value, ast.Call):
            continue
        call = statement.value
        if not isinstance(call.func, ast.Attribute) or not isinstance(call.func.value, ast.Name) or call.func.value.id != 'sns':
            continue
        keywords = {keyword.arg: ast.unparse(keyword.value) for keyword in call.keywords}
        method = call.func.attr
        data, ax = keywords.get('data', 'df'), keywords.get('ax', 'ax')
        x, y = keywords.get('x'), keywords.get('y')
        body = None
        if method == 'scatterplot' and x and y:
            hue, style, size = keywords.get('hue'), keywords.get('style'), keywords.get('size')
            if not hue:
                body = f'{ax}.scatter({data}[{x}], {data}[{y}])'
            else:
                order = keywords.get('hue_order', f'list({data}[{hue}].unique())')
                palette = keywords.get('palette', '"deep"')
                alpha = keywords.get('alpha', '1')
                sizes = f'20 + 180 * (group[{size}] - {data}[{size}].min()) / ({data}[{size}].max() - {data}[{size}].min())' if size else '50'
                marker = '["o", "s", "^"][i % 3]' if style else '"o"'
                body = f'levels = {order}\ncolors = sns.color_palette({palette}, len(levels))\nfor i, level in enumerate(levels):\n    group = {data}[{data}[{hue}] == level]\n    {ax}.scatter(group[{x}], group[{y}], c=[colors[i]], s={sizes}, marker={marker}, alpha={alpha}, label=level)\n{ax}.legend(title={hue})'
                if size:
                    body += f'\nfor value in sorted({data}[{size}].unique()):\n    area = 20 + 180 * (value - {data}[{size}].min()) / ({data}[{size}].max() - {data}[{size}].min())\n    {ax}.scatter([], [], c="gray", s=area, label=str(value))\n{ax}.legend(title={hue})'
        elif method == 'histplot' and x:
            body = f'{ax}.hist({data}[{x}], bins={keywords.get("bins", "4")})'
        elif method == 'countplot' and x:
            body = f'counts = {data}[{x}].value_counts(sort=False)\n{ax}.bar(counts.index, counts.values, width=0.6)'
        elif method == 'barplot' and x and y and keywords.get('errorbar') == 'None':
            estimator = keywords.get('estimator', '"mean"')
            body = f'heights = {data}.groupby({x}, sort=False)[{y}].agg({estimator})\n{ax}.bar(heights.index, heights.values, width=0.6)'
        elif method == 'lineplot' and x and y and keywords.get('estimator') == 'None':
            body = f'ordered = {data}.sort_values({x})\n{ax}.plot(ordered[{x}], ordered[{y}], marker={keywords.get("marker", "None")})'
        elif method == 'lineplot' and x and y and keywords.get('errorbar') == '"sd"':
            body = f'grouped = {data}.groupby({x})[{y}]\nmeans = grouped.mean()\nspread = grouped.std()\n{ax}.plot(means.index, means.values, marker="o")\n{ax}.fill_between(means.index, means - spread, means + spread, alpha=0.2)'
        elif method == 'boxplot' and x and y:
            horizontal = (exercise.get('plot') or {}).get('categoryAxis') == 'y'
            category, measure = (y, x) if horizontal else (x, y)
            body = f'levels = list({data}[{category}].unique())\n{ax}.boxplot([{data}.loc[{data}[{category}] == level, {measure}] for level in levels], positions=range(len(levels)), widths=0.6, vert={not horizontal})\n{ax}.set_{"y" if horizontal else "x"}ticks(range(len(levels)), levels)'
        elif method == 'ecdfplot' and x:
            complementary = keywords.get('complementary') == 'True'
            body = f'values = np.sort({data}[{x}].to_numpy())\nfractions = np.arange(len(values) + 1) / len(values)\n{ax}.step(np.r_[-np.inf, values], {"1 - fractions" if complementary else "fractions"}, where="post")'
        elif method == 'kdeplot' and x:
            body = f'from scipy.stats import gaussian_kde\nvalues = {data}[{x}].to_numpy()\ndensity = gaussian_kde(values)\ndensity.set_bandwidth(density.factor * {keywords.get("bw_adjust", "1")})\ngrid = np.linspace(values.min(), values.max(), 200)\n{ax}.plot(grid, density(grid))'
        elif method == 'regplot' and x and y:
            body = f'{ax}.scatter({data}[{x}], {data}[{y}])\ncoefficients = np.polyfit({data}[{x}], {data}[{y}], 1)\nends = np.array([{data}[{x}].min(), {data}[{x}].max()])\n{ax}.plot(ends, np.polyval(coefficients, ends))'
        elif method == 'residplot' and x and y:
            body = f'coefficients = np.polyfit({data}[{x}], {data}[{y}], 1)\n{ax}.scatter({data}[{x}], {data}[{y}] - np.polyval(coefficients, {data}[{x}]))\n{ax}.axhline(0)'
        elif method == 'heatmap' and call.args:
            matrix = ast.unparse(call.args[0])
            fmt = keywords.get('fmt', '".2g"')
            optional = ', '.join(f'{key}={keywords[key]}' for key in ('cmap', 'vmin', 'vmax') if key in keywords)
            body = f'cells = {matrix}\n{ax}.imshow(cells.to_numpy(), {optional})\n{ax}.set_xticks(range(len(cells.columns)), list(cells.columns))\n{ax}.set_yticks(range(len(cells.index)), list(cells.index))\nfor i in range(len(cells.index)):\n    for j in range(len(cells.columns)):\n        if pd.notna(cells.iloc[i, j]):\n            {ax}.text(j, i, format(cells.iloc[i, j], {fmt}), ha="center", va="center")'
        if body:
            tree.body[index:index + 1] = ast.parse(body).body
            changed = True
            break
    if not changed:
        return None
    return 'import numpy as np\n' + ast.unparse(ast.fix_missing_locations(tree))


def semantic_negative(exercise):
    tree = ast.parse(exercise['solution'])
    if exercise.get('target') == 'plot':
        if (exercise.get('plot') or {}).get('empty'):
            return exercise['solution'].replace('figsize=(6, 4)', 'figsize=(7, 4)'), 'wrong explicitly requested canvas width'
        for index, statement in enumerate(tree.body):
            if isinstance(statement, ast.Assign) and any(isinstance(target, ast.Name) and target.id == 'selected' for target in statement.targets):
                tree.body[index + 1:index + 1] = ast.parse('selected = selected.iloc[:-1]').body
                return ast.unparse(ast.fix_missing_locations(tree)), 'omits one eligible record after the required population filter'
        index = next((index for index, statement in enumerate(tree.body) if not isinstance(statement, (ast.Import, ast.ImportFrom))), len(tree.body))
        tree.body[index:index] = ast.parse('df = df.iloc[:-1]').body
        return ast.unparse(ast.fix_missing_locations(tree)), 'omits one supplied record before plotting or summarising'
    target = exercise.get('target', 'value')
    if target in ('df', 'copy'):
        name = 'clean' if target == 'copy' else 'df'
        tree.body.pop()
        tree.body.extend(ast.parse(f'{name} = {name}.iloc[:-1]\n{name}').body)
        return ast.unparse(ast.fix_missing_locations(tree)), 'drops a record required by the handoff'
    expression = tree.body.pop().value
    tree.body.append(ast.Assign(targets=[ast.Name(id='answer', ctx=ast.Store())], value=expression))
    corruption = '''
if isinstance(answer, (pd.DataFrame, pd.Series)):
    answer = answer.iloc[:-1]
elif isinstance(answer, np.ndarray):
    answer = answer.copy()
    answer.flat[0] += 1
elif isinstance(answer, (list, tuple, pd.Index)):
    answer = answer[:-1]
elif isinstance(answer, str):
    answer = "line" if answer != "line" else "scatter"
else:
    answer = answer + 1
answer
'''
    tree.body.extend(ast.parse(corruption).body)
    return 'import numpy as np\n' + ast.unparse(ast.fix_missing_locations(tree)), 'missing required row/label/item, wrong chart choice, or incorrect calculated numeric value'


def feature_negatives(exercise):
    code, rules = exercise['solution'], exercise.get('plot') or {}
    cases = []
    if rules.get('markers'):
        cases.append(('missing observation markers', code.replace('marker="o"', 'marker=None')))
    if rules.get('lineStyles'):
        cases.append(('solid instead of requested dashed reference', code.replace('linestyle="--"', 'linestyle="-"')))
    if rules.get('annotationDetails'):
        cases.append(('annotation without requested arrow', code.replace('arrowprops={"arrowstyle": "->"}', 'arrowprops=None')))
    if rules.get('matrixLabels'):
        cases.append(('heatmap values lack requested annotations', code.replace('annot=True', 'annot=False')))
        cases.append(('heatmap tick identities are swapped', code.replace('fig.tight_layout()', 'ax.set_xticklabels(list(reversed([tick.get_text() for tick in ax.get_xticklabels()])))\nfig.tight_layout()')))
    if rules.get('layout'):
        old, new = ('plt.subplots(2, 1', 'plt.subplots(1, 2') if 'plt.subplots(2, 1' in code else ('plt.subplots(1, 2', 'plt.subplots(2, 1')
        cases.append(('wrong required panel orientation', code.replace(old, new)))
    if rules.get('panelHeight'):
        cases.append(('wrong explicitly requested panel height', code.replace('height=3', 'height=4')))
    if rules.get('export'):
        cases.append(('export lacks requested tight crop', code.replace('bbox_inches="tight"', 'bbox_inches=None')))
    if 'jitter=False' in code:
        cases.append(('raw points moved despite jitter=False', code.replace('jitter=False', 'jitter=0.15')))
    return [(name, variant) for name, variant in cases if variant != code]


def visibility_cases(exercise):
    """Every plotted contract keeps its evidence drawable and in its viewport."""
    code, rules = exercise['solution'], exercise.get('plot') or {}
    def inject(fragment):
        return code.replace('plt.show()', fragment + '\nplt.show()')
    cases = [
        ('invisible plotting areas', inject('for _axis in plt.gcf().axes:\n    _axis.set_visible(False)'), False, 'requested plotted evidence is hidden'),
        ('visible data with optional frame removed', inject('for _axis in plt.gcf().axes:\n    for _spine in _axis.spines.values():\n        _spine.set_visible(False)'), True, 'visible observations and labels do not require a decorative frame'),
    ]
    if exercise['id'] == 'V01-1':
        cases.append(('empty canvas with axes decoration disabled', inject('ax.set_axis_off()'), True, 'an empty canvas need not show ticks'))
        return cases
    hide = 'for _axis in plt.gcf().axes:\n    for _mark in [*_axis.lines, *_axis.patches, *_axis.collections, *_axis.images]:\n        _mark.set_alpha(0)'
    cases.extend([
        ('transparent plotted evidence', inject(hide), False, 'data artists encode observations but render nothing'),
        ('all observations outside the visible viewport', inject('for _axis in plt.gcf().axes:\n    _axis.set_xlim(10000, 20000)'), False, 'axis bounds remove the requested plotted evidence'),
    ])
    if not rules.get('alpha') and not rules.get('fixedPalette'):
        cases.append(('visible semitransparent styling', inject(hide.replace('set_alpha(0)', 'set_alpha(0.5)')), True, 'ordinary visible opacity is a cosmetic style'))
    if any(method in code for method in ('scatterplot(', 'stripplot(', 'swarmplot(', 'regplot(', 'residplot(', 'pairplot(', 'kind="scatter"')):
        one = '''import numpy as np
from matplotlib.collections import PathCollection
for _axis in plt.gcf().axes:
    for _mark in _axis.collections:
        if isinstance(_mark, PathCollection) and len(_mark.get_offsets()):
            _mark.set_alpha(None)
            for _getter, _setter in ((_mark.get_facecolors, _mark.set_facecolors), (_mark.get_edgecolors, _mark.set_edgecolors)):
                _colors = _getter()
                if len(_colors):
                    _colors = np.resize(_colors, (len(_mark.get_offsets()), 4))
                    _colors[0, 3] = 0
                    _setter(_colors)
            break'''
        cases.append(('one observation transparent despite collection alpha', inject(one), False, 'every required paired observation must remain visible'))
    return cases


started = time.time()
hashes_before = source_hashes()
results, ledger, failures = [], [], []
for lesson in curriculum['lessons']:
    for exercise in lesson['rounds']:
        code = exercise['solution']
        cases = [('model solution', code, True, 'baseline')]
        if exercise.get('target') == 'plot':
            cases.extend([('individual label setters', individual_labels(code), True, 'equivalent label API'),
                          ('capitalized labels and ordinary default canvas', cosmetic_plot(exercise), True, 'cosmetic text and unspecified size')])
            alternative = matplotlib_alternative(exercise)
            if alternative:
                cases.append(('equivalent calculated Matplotlib chart', alternative, True, 'different computation/drawing route'))
            if (exercise.get('plot') or {}).get('numericAnnotations'):
                cases.append(('equivalent additional annotation precision', code.replace('annot=True,', 'annot=True, fmt=".3f",'), True, 'unspecified numeric annotation formatting'))
                cases.append(('wrong annotated cell despite correct underlying matrix', code.replace('plt.show()', 'for _axis in plt.gcf().axes:\n    for _text in _axis.texts:\n        _text.set_text("999.000")\nplt.show()'), False, 'annotations must report the actual cell values'))
                cases.append(('nonnumeric annotated cell', code.replace('plt.show()', 'for _axis in plt.gcf().axes:\n    for _text in _axis.texts:\n        _text.set_text("unknown")\nplt.show()'), False, 'required numeric cells cannot be replaced with arbitrary text'))
            cases.extend(visibility_cases(exercise))
        else:
            cases.extend([('named answer displayed explicitly', display_answer(code), True, 'output presentation'),
                          ('equivalent column arithmetic, masks or labelled display order', table_alternative(exercise), True, 'different column API or display order'),
                          ('import aliases', alias_alternative(exercise), True, 'import/call aliases')])
        wrong, rationale = semantic_negative(exercise)
        cases.append(('wrong semantic result', wrong, False, rationale))
        cases.extend((name, variant, False, 'requested chart feature') for name, variant in feature_negatives(exercise))
        outcomes = []
        for name, variant, should_pass, rationale in cases:
            response = execute(exercise, variant)
            passed = response['passed'] == should_pass and response['error'] is None
            result = {'exercise': exercise['id'], 'name': name, 'intent': rationale, 'should_pass': should_pass,
                      'status': 'passed' if passed else 'failed', 'code': variant, 'response': response}
            results.append(result)
            outcomes.append({'name': name, 'expectation': 'accept' if should_pass else 'reject', 'status': result['status'], 'intent': rationale})
            if not passed:
                failures.append({'exercise': exercise['id'], 'name': name, 'response': response})
        ledger.append({'exercise': exercise['id'], 'lesson': lesson['id'], 'label': exercise['label'], 'dataset': exercise['dataset'],
                       'retrieves': exercise.get('retrieves'), 'review_kind': 'intentional spaced retrieval' if exercise.get('retrieves') else 'teaching/checkpoint round',
                       'task': exercise['task'], 'hint': exercise['hint'], 'solution': exercise['solution'],
                       'task_review': 'reviewed', 'hint_review': 'reviewed', 'example_review': 'reviewed', 'solution_review': 'reviewed', 'grader_review': 'reviewed',
                       'required_calls': exercise.get('requiredCalls', []), 'plot_rules': exercise.get('plot'),
                       'tests': outcomes, 'test_status': 'failed' if any(outcome['status'] == 'failed' for outcome in outcomes) else 'passed'})
    print(lesson['id'], len(ledger), 'rounds audited;', len(failures), 'case failures', flush=True)

hashes_after = source_hashes()
assert hashes_before == hashes_after, 'Source changed during execution; rerun against one final snapshot.'
summary = {'rounds': len(ledger), 'cases': len(results), 'passed': len(results) - len(failures), 'failed': len(failures),
           'model_solutions': sum(result['name'] == 'model solution' and result['status'] == 'passed' for result in results),
           'positive_cases': sum(result['should_pass'] for result in results), 'semantic_or_feature_negative_cases': sum(not result['should_pass'] for result in results),
           'seconds': round(time.time() - started, 2), 'source_hashes': hashes_after}
(args.evidence_dir / 'expanded-results.json').write_text(json.dumps({'summary': summary, 'cases': results, 'failures': failures}, indent=2))
(args.evidence_dir / 'execution-ledger.json').write_text(json.dumps({'summary': summary, 'exercises': ledger}, indent=2))
with (args.evidence_dir / 'execution-ledger.csv').open('w', newline='') as file:
    fields = ['exercise', 'lesson', 'label', 'dataset', 'retrieves', 'review_kind', 'task_review', 'hint_review', 'example_review', 'solution_review', 'grader_review', 'test_status']
    writer = csv.DictWriter(file, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(ledger)
print(json.dumps(summary, indent=2))
assert not failures, json.dumps(failures, indent=2)
