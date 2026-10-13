"""Execute short teaching excerpts with their already-taught imports and canvas."""
import json
from pathlib import Path
import subprocess

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

ROOT = Path(__file__).resolve().parents[1]
curriculum = json.loads(subprocess.check_output(
    ['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'],
    cwd=ROOT, text=True))
rounds = {r['id']: r for l in curriculum['lessons'] for r in l['rounds']}
expected = {'V04-3', 'V08-2', 'V13-3', 'V25-3', 'V32-2', 'V33-2', 'V33-3'}
assert {id for id, r in rounds.items() if r.get('teaching', {}).get('excerpt')} == expected

for id in sorted(expected):
    plt.close('all')
    r = rounds[id]
    fig, ax = plt.subplots()
    scope = {'pd': pd, 'np': np, 'sns': sns, 'plt': plt, 'fig': fig, 'ax': ax,
             'df': pd.DataFrame(curriculum['datasets'][r['dataset']]['columns'])}
    if id == 'V25-3':
        ax.plot([1, 2], [3, 1])
    exec(r['teaching']['code'], scope)
    for number in plt.get_fignums():
        plt.figure(number).canvas.draw()
    if id == 'V04-3':
        assert np.allclose([p.get_height() for p in ax.patches], [2, 2])
        assert np.allclose([p.get_width() for p in ax.patches], [4, 6])
    elif id == 'V08-2':
        assert [t.get_text() for t in ax.get_xticklabels()] == ['chat', 'email', 'phone']
        assert np.allclose([p.get_height() for p in ax.patches[:2]], [1, 2])
    elif id == 'V13-3':
        assert list(scope['order']) == ['A', 'B', 'C']
        assert np.allclose(scope['ranked'].to_numpy(), [4, 5, 7])
    elif id == 'V25-3':
        assert len(ax.lines) == 0 and len(ax.collections) == 1
        assert np.allclose(ax.collections[0].get_offsets(), [[1, 3], [2, 1]])
        assert ax.get_xlabel() == 'x' and ax.get_ylabel() == 'y'
    elif id == 'V32-2':
        g = scope['g']
        assert np.allclose(g.ax_joint.lines[-1].get_ydata(), [70, 70])
        assert not g.ax_marg_x.lines and not g.ax_marg_y.lines
    elif id == 'V33-2':
        assert scope['g'].col_names == ['East', 'West']
        assert all([t.get_text() for t in a.get_xticklabels()] == ['Brush', 'Spray']
                   for a in scope['g'].axes.flat)
    elif id == 'V33-3':
        g = scope['g']
        assert g.col_names == ['North', 'South']
        for a, region in zip(g.axes.flat, g.col_names):
            pairs = scope['df'].loc[scope['df']['region'] == region, ['inflow', 'outflow']]
            assert np.allclose(a.collections[0].get_offsets(), pairs.to_numpy())
plt.close('all')
print('Concise examples: seven excerpts retain counts, label ordering, paired values and grid targeting.')
