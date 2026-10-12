"""Execute parameter-guide examples and important API distinctions in the pins."""
import inspect
import json
import subprocess
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from seaborn._statistics import EstimateAggregator, _validate_errorbar_arg

ROOT = Path(__file__).resolve().parents[1]
assert sns.__version__ == '0.13.2'
assert matplotlib.__version__ == '3.5.2'
assert pd.__version__ == '2.2.0'
df = pd.DataFrame({
    'group': ['a', 'a', 'a', 'b', 'b', 'b'],
    'cost': [1., 2., 12., 3., 4., 8.],
    'route': ['local', 'local', 'express', 'local', 'express', 'express'],
    'region': ['north', 'north', 'south', 'north', 'south', 'south'],
    'status': ['open', 'closed', 'open', 'closed', 'open', 'closed'],
    'distance': [1., 2., 3., 4., 5., 6.],
    'minutes': [7., 9., 11., 15., 18., 22.],
    'parcels': [1., 2., 3., 1., 2., 3.],
    'weight': [1., 2., 3., 4., 5., 6.],
    'day': [1, 1, 2, 2, 3, 3],
    'wait_minutes': [1., 2., np.nan, 4., 5., 6.],
    'consult_minutes': [7., np.nan, 11., 15., 18., 22.],
})

# Aggregation accepts strings beyond mean/median and a vector-to-scalar callable.
for estimator, expected in [('sum', [15., 15.]), ('max', [12., 8.]),
                            (lambda vector: vector.quantile(.75), [7., 6.])]:
    fig, ax = plt.subplots()
    sns.barplot(data=df, x='group', y='cost', estimator=estimator, errorbar=None, ax=ax)
    assert np.allclose([patch.get_height() for patch in ax.patches], expected)
    plt.close(fig)
    fig, ax = plt.subplots()
    sns.pointplot(data=df, x='group', y='cost', estimator=estimator, errorbar=None, ax=ax)
    assert np.allclose(ax.lines[0].get_ydata(), expected)
    assert len(ax.lines) == 1, 'errorbar=None leaves only the summary marks/line'
    plt.close(fig)
try:
    sns.barplot(data=df, x='group', y='cost', estimator=None, errorbar=None)
except (TypeError, ValueError):
    pass
else:
    raise AssertionError('barplot estimator=None cannot be taught as raw observations')
plt.close('all')
fig, ax = plt.subplots()
sns.lineplot(data=df, x='day', y='cost', estimator=None, ax=ax)
assert len(ax.lines[0].get_ydata()) == len(df)
plt.close(fig)
fig, ax = plt.subplots()
sns.lineplot(data=df, x='day', y='cost', estimator=lambda vector: vector.sum(), errorbar=None, ax=ax)
assert np.allclose(ax.lines[0].get_ydata(), [3., 15., 12.])
plt.close(fig)

# Interval methods have different level units, and callables return endpoints.
for name, level in [('ci', 95), ('pi', 95), ('se', 1), ('sd', 1)]:
    assert _validate_errorbar_arg(name) == (name, level)
assert _validate_errorbar_arg(None) == (None, None)
values = pd.DataFrame({'value': [1., 2., 3., 4.]})
sd = values['value'].std()
interval = EstimateAggregator('mean', errorbar=('sd', 2))(values, 'value')
assert np.isclose(interval['valuemin'], 2.5 - 2 * sd)
assert np.isclose(interval['valuemax'], 2.5 + 2 * sd)
interval = EstimateAggregator('mean', errorbar=('pi', 50))(values, 'value')
assert np.allclose([interval['valuemin'], interval['valuemax']], [1.75, 3.25])
interval = EstimateAggregator('median', errorbar=lambda vector: (vector.min(), vector.max()))(values, 'value')
assert interval['value'] == 2.5
assert interval['valuemin'] == 1 and interval['valuemax'] == 4
fig, ax = plt.subplots()
sns.pointplot(data=df, x='group', y='cost', estimator='median',
              errorbar=lambda vector: (vector.min(), vector.max()), ax=ax)
assert np.allclose(ax.lines[0].get_ydata(), [2., 4.])
assert np.allclose(ax.lines[1].get_ydata(), [1., 12.])
assert np.allclose(ax.lines[2].get_ydata(), [3., 8.])
plt.close(fig)

# Jitter uses categorical half-width and preserves measured values. Despite
# the pinned docstring's "True/1" wording, the implementation special-cases
# only boolean True; numeric 1 uses half-width 1.
offsets = {}
for jitter in [False, 0, True, 1, 1., .2, 2.]:
    np.random.seed(7)
    fig, ax = plt.subplots()
    sns.stripplot(data=df, x='group', y='cost', jitter=jitter, size=4, ax=ax)
    points = [np.asarray(collection.get_offsets()) for collection in ax.collections]
    assert np.allclose(np.concatenate([point[:, 1] for point in points]), df['cost'])
    assert all(np.allclose(collection.get_sizes(), [16.]) for collection in ax.collections)
    displacement = np.concatenate([point[:, 0] - index for index, point in enumerate(points)])
    offsets[str(jitter)] = displacement
    assert np.max(np.abs(displacement)) <= (0 if jitter is False else .1 if jitter is True else jitter)
    plt.close(fig)
assert np.allclose(offsets['True'] * 10, offsets['1'])
assert np.allclose(offsets['1'], offsets['1.0'])
assert np.allclose(offsets['False'], offsets['0'])
assert np.max(np.abs(offsets['2.0'])) > 1
fig, ax = plt.subplots()
sns.scatterplot(data=df, x='distance', y='minutes', size='parcels', ax=ax)
assert len(set(ax.collections[0].get_sizes())) == 3
plt.close(fig)
assert inspect.signature(sns.regplot).parameters['ci'].default == 95
assert 'errorbar' not in inspect.signature(sns.regplot).parameters
fig, ax = plt.subplots()
sns.regplot(data=df, x='distance', y='minutes', ci=None, ax=ax)
assert len(ax.collections) == 1, 'No confidence-band polygon when ci=None'
plt.close(fig)

# Every new reusable code example is a runnable contextual snippet. Supply
# named inputs rather than treating snippets as complete standalone analyses.
result = subprocess.run(['node', '-e', 'process.stdout.write(JSON.stringify(require("./foundations/parameter-guide.js").registry))'],
                        cwd=ROOT, capture_output=True, text=True, check=True, timeout=30)
registry = json.loads(result.stdout)
examples = {}
for entry in registry.values():
    examples.setdefault(entry['example'], []).append(entry['id'])
for code, ids in examples.items():
    fig, axes = plt.subplots(1, 2)
    namespace = dict(df=df.copy(), sns=sns, pd=pd, plt=plt, np=np,
                     fig=fig, axes=axes, ax=axes[0],
                     matrix=pd.DataFrame([[2., 3.], [4., 5.]]),
                     correlation=pd.DataFrame([[1., .5], [.5, 1.]]),
                     counts=pd.DataFrame([[2., 3.], [4., 5.]]),
                     groups=['a', 'b'], first=np.array([2., 3.]),
                     second=np.array([4., 5.]), measurements=['distance', 'minutes'])
    if code.startswith('ax.legend('):
        axes[0].plot([0, 1], [0, 1], label='Observed')
        axes[0].plot([0, 1], [0, .5], label='Reference')
    # Export examples should exercise saving without creating repository files.
    if 'fig.savefig(' in code:
        import io
        namespace['export_buffer'] = io.BytesIO()
        code = code.replace('"chart.png"', 'export_buffer')
    try:
        exec(code, namespace)
    except Exception as error:
        raise AssertionError(f'Parameter examples {ids} failed: {code}') from error
    finally:
        plt.close('all')
print(f'Pinned parameter contracts and {len(examples)} unique reusable examples passed (Seaborn {sns.__version__}, Matplotlib {matplotlib.__version__}, pandas {pd.__version__}).')
