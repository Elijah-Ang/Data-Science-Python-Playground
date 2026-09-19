"""Local-only lesson execution and semantic checks; never included in learner code."""
import ast
import base64
import contextlib
import io
import json
import os
import traceback
import warnings
import numpy as np
import pandas as pd
from pandas.testing import assert_frame_equal, assert_series_equal, assert_index_equal
plt = sns = None


def _ensure_plotting():
    global plt, sns, PathCollection, QuadMesh, LineCollection, Rectangle
    global _ORIGINAL_SHOW, _ORIGINAL_SUBPLOTS, _ORIGINAL_CLOSE
    if plt is not None:
        return
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import seaborn as sns
    from matplotlib.collections import PathCollection, QuadMesh, LineCollection
    from matplotlib.patches import Rectangle
    _ORIGINAL_SHOW, _ORIGINAL_SUBPLOTS, _ORIGINAL_CLOSE = plt.show, plt.subplots, plt.close


_ORIGINAL_DATAFRAME = pd.DataFrame
_ORIGINAL_SERIES = pd.Series


def _intent(code, exercise):
    """Inspect syntax nodes, ignoring comments/strings and resolving simple aliases."""
    tree = ast.parse(code)
    calls, attributes, indexes, aliases = set(), set(), set(), {}
    constants = {target.id: node.value for node in tree.body if isinstance(node, ast.Assign) for target in node.targets if isinstance(target, ast.Name)}
    def name(node):
        if isinstance(node, ast.Name):
            return aliases.get(node.id, node.id)
        if isinstance(node, ast.Attribute):
            return name(node.value) + '.' + node.attr
        if isinstance(node, (ast.Subscript, ast.Call)):
            return name(node.value if isinstance(node, ast.Subscript) else node.func)
        return ''
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for item in node.names: aliases[item.asname or item.name] = item.name
        elif isinstance(node, ast.ImportFrom):
            for item in node.names: aliases[item.asname or item.name] = (node.module or '') + '.' + item.name
        elif isinstance(node, ast.Assign) and isinstance(node.value, (ast.Attribute, ast.Name)):
            for target in node.targets:
                if isinstance(target, ast.Name): aliases[target.id] = name(node.value)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call): calls.add(name(node.func))
        elif isinstance(node, ast.Attribute): attributes.add(node.attr)
        elif isinstance(node, ast.Subscript) and isinstance(node.value, ast.Attribute): indexes.add(node.value.attr)
    def present(requirement):
        if requirement.startswith('attr:'): return requirement[5:] in attributes
        if requirement.startswith('index:'): return requirement[6:] in indexes
        return any(call == requirement or call.endswith('.' + requirement) for call in calls)
    for requirement in exercise.get('requiredCalls', []):
        assert present(requirement), 'Practise ' + requirement.split(':')[-1] + ' in this round, as requested in Your task.'
    for rule in exercise.get('requiredKeywords', []):
        matching = [node for node in ast.walk(tree) if isinstance(node, ast.Call) and (name(node.func) == rule['call'] or name(node.func).endswith('.' + rule['call']))]
        def keyword_matches(node):
            for kw in node.keywords:
                if kw.arg == rule['keyword']:
                    try:
                        value = ast.literal_eval(constants.get(kw.value.id, kw.value) if isinstance(kw.value, ast.Name) else kw.value)
                    except (ValueError, TypeError):
                        continue
                    if value == rule['value']: return True
            return False
        assert any(keyword_matches(node) for node in matching), 'Use ' + rule['keyword'] + '=' + repr(rule['value']) + ' as requested.'
    for requirement in exercise.get('forbiddenCalls', []):
        assert not present(requirement), 'Use the requested column operation instead of ' + requirement + '().'


def _equal(actual, expected, strict=False, unordered_index=False):
    if expected is None:
        assert actual is None, 'Use the Python value None, not text or an omitted answer.'
    elif isinstance(expected, pd.DataFrame):
        assert isinstance(actual, pd.DataFrame), 'Return a DataFrame, keeping the requested rows and columns.'
        assert_frame_equal(actual, expected, check_dtype=strict, check_names=False, check_exact=False, rtol=1e-6, atol=1e-7, check_categorical=strict)
    elif isinstance(expected, pd.Series):
        assert isinstance(actual, pd.Series), 'Return a Series (one labelled column).'
        if unordered_index:
            assert actual.index.is_unique and expected.index.is_unique, 'Return one summary per category.'
            # Align by labels only after checking the category set. Never discard
            # extra categories or accept swapped category/value associations.
            assert_index_equal(actual.index.sort_values(), expected.index.sort_values(), exact=False, check_names=False)
            actual = actual.reindex(expected.index)
        assert_series_equal(actual, expected, check_dtype=strict, check_names=False, check_exact=False, rtol=1e-6, atol=1e-7, check_categorical=strict)
    elif isinstance(expected, pd.Index):
        assert_index_equal(actual, expected, exact=strict, check_names=False)
    elif isinstance(expected, dict):
        assert isinstance(actual, dict) and set(actual) == set(expected), 'Check the requested dictionary keys.'
        for key in expected:
            _equal(actual[key], expected[key], strict)
    elif isinstance(expected, (list, tuple)):
        assert isinstance(actual, (list, tuple)) and len(actual) == len(expected), 'Check the number and order of items.'
        for a, e in zip(actual, expected):
            _equal(a, e, strict)
    elif isinstance(expected, np.ndarray):
        assert isinstance(actual, (np.ndarray, pd.DataFrame)), 'Return the calculated numeric array.'
        np.testing.assert_allclose(np.asarray(actual), expected, rtol=1e-6, atol=1e-7, equal_nan=True)
    elif isinstance(expected, (float, int, np.number)):
        assert np.isscalar(actual), 'Return one calculated number.'
        np.testing.assert_allclose(actual, expected, rtol=1e-6, atol=1e-7, equal_nan=True)
    else:
        assert str(actual) == str(expected), 'The result differs from the requested value.'


def _numeric(values):
    array = np.asarray(values)
    if array.dtype.kind in 'biufc':
        return np.where(np.isfinite(array), np.round(array.astype(float), 6), np.nan).tolist()
    return array.astype(str).tolist()


def _plot_state(figures, rules):
    result = []
    for fig in figures:
        fig.canvas.draw()
        state = {'axes': []}
        if rules.get('size'):
            state['size'] = _numeric(fig.get_size_inches())
        for ax in fig.axes:
            item = {'title': ax.get_title(), 'xlabel': ax.get_xlabel(), 'ylabel': ax.get_ylabel(),
                    'xscale': ax.get_xscale(), 'yscale': ax.get_yscale(), 'lines': [], 'patches': [], 'collections': []}
            if rules.get('limits'):
                item['limits'] = [_numeric(ax.get_xlim()), _numeric(ax.get_ylim())]
            if rules.get('zeroBaseline'):
                item['zero_baseline'] = abs(ax.get_ylim()[0]) < 1e-9
            if rules.get('ticks'):
                item['rotations'] = [t.get_rotation() for t in ax.get_xticklabels()]
            if rules.get('categorical'):
                item['categories'] = [t.get_text() for t in ax.get_xticklabels()]
            for line in ax.lines:
                # Legend proxy artists may have no observations.
                if len(line.get_xdata()):
                    item['lines'].append([_numeric(line.get_xdata(orig=False)), _numeric(line.get_ydata(orig=False))])
            for patch in ax.patches:
                if isinstance(patch, Rectangle):
                    if patch.get_width() or patch.get_height():
                        item['patches'].append(_numeric([patch.get_x(), patch.get_y(), patch.get_width(), patch.get_height()]))
                else:
                    item['patches'].append(_numeric(patch.get_path().vertices))
            for collection in ax.collections:
                part = {}
                if isinstance(collection, PathCollection):
                    offsets = np.asarray(collection.get_offsets()).copy()
                    if rules.get('jitter') and offsets.size:
                        offsets[:, 0] = np.round(offsets[:, 0])
                    part['points'] = _numeric(offsets)
                    if rules.get('alpha'):
                        part['alpha'] = collection.get_alpha()
                    if rules.get('sizes'):
                        part['sizes'] = _numeric(collection.get_sizes())
                    if rules.get('colors'):
                        part['colors'] = _numeric(collection.get_facecolors())
                        part['markers'] = [_numeric(p.vertices) for p in collection.get_paths()]
                elif isinstance(collection, QuadMesh):
                    part['matrix'] = _numeric(collection.get_array())
                    if rules.get('clim'):
                        part['clim'] = _numeric(collection.get_clim())
                elif isinstance(collection, LineCollection):
                    part['segments'] = [_numeric(x) for x in collection.get_segments()]
                else:
                    part['paths'] = [_numeric(p.vertices) for p in collection.get_paths()]
                item['collections'].append(part)
            if rules.get('legend'):
                legend = ax.get_legend()
                item['legend'] = None if legend is None else [legend.get_title().get_text(), [t.get_text() for t in legend.get_texts()]]
            if rules.get('annotations'):
                item['annotations'] = [[t.get_text(), _numeric(getattr(t, 'xy', t.get_position()))] for t in ax.texts]
            # In an ungrouped scatter, drawing order does not change the paired data.
            # Keep labels, scales, reference lines and observation multiplicity intact.
            if rules.get('semantic') == 'scatter':
                for part in item['collections']:
                    if 'points' in part:
                        part['points'] = sorted(part['points'], key=lambda p: tuple(p))
            state['axes'].append(item)
        result.append(state)
    return result


def _compare_plots(actual, expected):
    if isinstance(expected, dict):
        assert isinstance(actual, dict) and actual.keys() == expected.keys(), 'Check the figure structure.'
        for key in expected:
            _compare_plots(actual[key], expected[key])
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(actual) == len(expected), 'Check the number of figures, axes and plotted observations.'
        for a, e in zip(actual, expected):
            _compare_plots(a, e)
    elif isinstance(expected, (float, int)):
        np.testing.assert_allclose(actual, expected, rtol=2e-4, atol=2e-5, equal_nan=True)
    else:
        assert actual == expected, 'Check titles, labels, categories and axis scales.'


def _execute(code, columns, setup='', construction=False, files=None, explicit_setup=False):
    if plt is not None:
        plt.show = _ORIGINAL_SHOW
        plt.subplots = _ORIGINAL_SUBPLOTS
        plt.close = _ORIGINAL_CLOSE
    pd.DataFrame = _ORIGINAL_DATAFRAME
    pd.Series = _ORIGINAL_SERIES
    if plt is not None:
        plt.close('all')
        plt.rcdefaults()
    np.random.seed(42)
    # Fresh names and fresh objects on every Run and Check, including after exceptions.
    data = {key: list(values) for key, values in columns.items()}
    env = {'__builtins__': __builtins__, 'pd': pd, 'np': np, 'plt': plt, 'sns': sns, 'data': data}
    if explicit_setup:
        env = {'__builtins__': __builtins__}
    elif construction:
        del env['data']
    if not construction and not explicit_setup:
        env['df'] = pd.DataFrame(data)
    for filename, content in (files or {}).items():
        if isinstance(content, str):
            with open(filename, 'w', encoding='utf-8') as supplied:
                supplied.write(content)
        else:
            pd.DataFrame(content).to_csv(filename, index=False)
    if setup and not explicit_setup:
        exec(setup, env)
    figures = []
    def capture_show(*args, **kwargs):
        for number in plt.get_fignums():
            fig = plt.figure(number)
            if fig not in figures:
                figures.append(fig)
    if plt is not None:
        plt.show = capture_show
    outputs = []
    def display(value):
        outputs.append(value)
    env['display'] = display
    stream = BoundedOutputStream()
    last = None
    has_result = False
    error = None
    with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream), warnings.catch_warnings():
        warnings.simplefilter('ignore', FutureWarning)
        try:
            tree = ast.parse(code, filename='your_python.py')
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                has_result = True
                expression = ast.Expression(tree.body.pop().value)
                exec(compile(tree, 'your_python.py', 'exec'), env)
                last = eval(compile(expression, 'your_python.py', 'eval'), env)
            else:
                exec(compile(tree, 'your_python.py', 'exec'), env)
            if last is not None or (has_result and not figures and not stream.getvalue()):
                outputs.append(last)
        except Exception as exc:
            error = ''.join(traceback.format_exception_only(type(exc), exc)).strip()
    if plt is not None:
        plt.show = _ORIGINAL_SHOW
    return {'env': env, 'last': last, 'has_result': has_result, 'outputs': outputs, 'stdout': stream.getvalue(), 'figures': figures, 'error': error}


def run_foundation(request):
    exercise = request['exercise']
    columns = request['columns']
    checking = request.get('check', False)
    target = exercise.get('target', 'value')
    if target == 'plot' or any(word in request['code'] for word in ['matplotlib', 'seaborn', 'plt.', 'sns.']):
        _ensure_plotting()
    construction = exercise['id'].startswith('I01-') or bool(exercise.get('files'))
    setup = exercise.get('setup', '')
    expected = None
    # The answer namespace is never exposed to learner code; no shared df objects.
    if checking:
        expected = _execute(exercise['solution'], columns, setup, construction, exercise.get('files'))
        if expected['error']:
            raise RuntimeError('Reference exercise failed: ' + expected['error'])
        if target == 'plot':
            expected_plot = _plot_state(expected['figures'], exercise.get('plot') or {})
    if os.path.exists('chart.png'):
        os.remove('chart.png')
    actual = _execute(request['code'], columns, setup, construction, exercise.get('files'), request.get('explicitSetup', False))
    passed = False
    feedback = ''
    if checking and not actual['error']:
        try:
            _intent(request['code'], exercise)
            if target == 'plot':
                _compare_plots(_plot_state(actual['figures'], exercise.get('plot') or {}), expected_plot)
                assert actual['figures'], 'Display your figure with plt.show().'
                if (exercise.get('plot') or {}).get('export'):
                    assert os.path.isfile('chart.png') and os.path.getsize('chart.png') > 100, 'Save chart.png before displaying the figure.'
                    from PIL import Image
                    exported = Image.open('chart.png')
                    assert abs(exported.info.get('dpi', (0,))[0] - 150) < 1, 'Save the PNG at 150 dpi.'
            elif target == 'copy':
                assert 'clean' in actual['env'], 'Keep the working copy in clean.'
                _equal(actual['env']['clean'], expected['env']['clean'], exercise.get('strictDtype', False))
                _equal(actual['env'].get('df'), pd.DataFrame(columns), True)
                assert actual['env']['clean'] is not actual['env']['df'], 'Make a separate copy before editing.'
            else:
                wanted = expected['env']['df'] if target == 'df' else expected['last']
                got = actual['env'].get('df') if target == 'df' else actual['last']
                if got is None and target == 'value':
                    got = actual['env'].get('result')
                if target == 'value':
                    assert actual['has_result'] or 'result' in actual['env'], 'Write your answer as the final expression, or assign it to result.'
                _equal(got, wanted, exercise.get('strictDtype', False), exercise.get('unorderedIndex', False))
            if exercise.get('preserveData'):
                _equal(actual['env'].get('df'), pd.DataFrame(columns), True)
            passed = True
            feedback = 'That matches the task. Read the output, then try the next practice.'
        except (AssertionError, TypeError, ValueError, KeyError) as exc:
            message = str(exc).split('\n')[0][:220]
            feedback = 'Not yet. ' + (message if message and not message.startswith('DataFrame') and not message.startswith('Series') else 'Check the requested values, row order, columns and data types.')
    elif actual['error']:
        feedback = 'Python could not finish. Read the error below, edit your code and run again.'
    rendered = []
    for value in actual['outputs']:
        if isinstance(value, (pd.DataFrame, pd.Series)):
            rendered.append({'kind': 'table', 'value': serialize_dataframe_result(value)})
        else:
            rendered.append({'kind': 'text', 'value': str(value)[:20000]})
    for fig in actual['figures']:
        buffer = io.BytesIO()
        fig.savefig(buffer, format='png', dpi=110, bbox_inches='tight')
        titles = [ax.get_title() for ax in fig.axes if ax.get_title()]
        rendered.append({'kind': 'figure', 'alt': ' / '.join(titles) or 'Chart from your Python', 'value': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()})
    if os.path.isfile('chart.png'):
        with open('chart.png', 'rb') as file:
            rendered.append({'kind': 'download', 'name': 'chart.png', 'value': 'data:image/png;base64,' + base64.b64encode(file.read()).decode()})
    if plt is not None:
        plt.close('all')
    return {'passed': passed, 'checked': checking, 'feedback': feedback, 'stdout': actual['stdout'], 'error': actual['error'], 'outputs': rendered}
