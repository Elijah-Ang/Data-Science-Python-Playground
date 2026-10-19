"""Compare displayed Python and actual SVG marks with independent native output.

Checking the model's counts alone misses a filled overlay that covers a correct
bar. These checks inspect every plotted rectangle/circle in the delivered SVG.
"""
import ast
import json
import subprocess
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = r'''
const fs=require('fs'),vm=require('vm'),c={window:{}};
vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),c);
const f=require('./foundations/visuals.js'),m=c.window.MLLearningVisuals;
const o=require('./foundations/operation-visuals.js');
const cases=[];
for(const [family,api] of [['data',f],['ml',m]])
 for(const [id,spec] of Object.entries(api.explorerSpecs))
  for(const [choice] of spec.options)cases.push({family,id,choice,static:!!spec.static,...api.exploration(id,choice)});
for(const id of o.ids)for(const [choice] of o.evaluate(id).choices)
 cases.push({family:'operation',id,choice,...o.evaluate(id,choice)});
console.log(JSON.stringify({cases,rows:f.exampleRows}));
'''
registry = json.loads(subprocess.check_output(['node', '-e', SCRIPT], cwd=ROOT))
by_control = defaultdict(list)
geometry_states = []
df = pd.DataFrame(registry['rows'])
for case in registry['cases']:
    # AST equality ignores comments, formatting and variable/token highlighting.
    tree = ast.dump(ast.parse(case['code']), include_attributes=False)
    if not case.get('static'):
        by_control[case['family'], case['id']].append(tree)
    if case['family'] != 'data' or case['id'] not in (
            'count-bars', 'mean-bars', 'exact-bars', 'scatter', 'log-scale', 'boxplot'):
        continue
    name, choice, data = case['id'], case['choice'], case['data']
    svg = ET.fromstring(case['svg']).find('.//svg')
    example = pd.DataFrame(data['rows'], columns=['x', 'value']) if name == 'log-scale' else df.copy()
    fig, ax = plt.subplots()
    namespace = dict(example=example, sns=sns, pd=pd, ax=ax, plt=plt)
    exec(case['code'], namespace)
    if name in ('count-bars', 'mean-bars', 'exact-bars'):
        expected = np.array([patch.get_height() for patch in ax.patches])
        # Include ALL rectangles, rather than filtering out a selection overlay.
        bars = svg.findall('.//rect')
        assert len(bars) == len(expected), (name, choice, 'extraneous filled geometry')
        heights = np.array([float(bar.attrib['height']) for bar in bars])
        bases = np.array([float(bar.attrib['y']) + height for bar, height in zip(bars, heights)])
        np.testing.assert_allclose(bases, bases[0], err_msg=f'{name}/{choice} zero baseline')
        np.testing.assert_allclose(heights / heights.sum(), expected / expected.sum(),
                                   err_msg=f'{name}/{choice} visible bar proportions')
        assert np.all(heights >= 0)
        np.testing.assert_allclose(expected, [group['value'] for group in data['groups']])
        assert 'visual-selected' not in case['svg']
        if name == 'count-bars':
            independent = example.groupby(choice, sort=False).size()
            np.testing.assert_array_equal(expected, independent)
            assert independent.index.tolist() == [g['group'] for g in data['groups']]
    elif name in ('scatter', 'log-scale'):
        points = np.asarray(ax.collections[0].get_offsets())
        circles = svg.findall('.//circle')
        assert len(circles) == len(points), (name, choice, 'extra/missing plotted observation')
        actual = np.array([[float(n.attrib['cx']), float(n.attrib['cy'])] for n in circles])
        if name == 'scatter':
            xlim, ylim = data['xDomain'], data['yDomain']
            transformed = np.column_stack((50 + (points[:, 0] - xlim[0]) / np.ptp(xlim) * 420,
                                           170 - (points[:, 1] - ylim[0]) / np.ptp(ylim) * 145))
            assert ax.get_xlabel() == data['xKey'] and ax.get_ylabel() == data['yKey']
        else:
            assert ax.get_xscale() == choice
            # Use Matplotlib's axis transform to independently check spacing.
            xscale = ax.xaxis.get_transform().transform(points[:, 0])
            fraction = (xscale - xscale.min()) / np.ptp(xscale)
            transformed = np.column_stack((50 + fraction * 420, 170 - points[:, 1] / 10 * 145))
        np.testing.assert_allclose(actual, transformed, atol=1e-9,
                                   err_msg=f'{name}/{choice} visible point coordinates')
        assert len({n.attrib['r'] for n in circles}) == 1, 'Axis controls must not change marker size'
    elif name == 'boxplot':
        # Native Matplotlib/seaborn lines carry the actual median, quartiles,
        # whisker endpoints and outlier positions for the chosen orientation.
        stats = matplotlib.cbook.boxplot_stats(example.value)[0]
        np.testing.assert_allclose([data['q1'], data['median'], data['q3']],
                                   [stats['q1'], stats['med'], stats['q3']])
        np.testing.assert_allclose(data['whiskers'], [stats['whislo'], stats['whishi']])
        boxes = svg.findall('.//rect')
        assert len(boxes) == 1
        box = boxes[0].attrib
        if choice == 'x':
            np.testing.assert_allclose([float(box['x']), float(box['width'])],
                                       [50 + stats['q1'] / 20 * 420, (stats['q3'] - stats['q1']) / 20 * 420])
        else:
            np.testing.assert_allclose([float(box['y']), float(box['height'])],
                                       [170 - stats['q3'] / 20 * 145, (stats['q3'] - stats['q1']) / 20 * 145])
        fliers = svg.findall('.//circle')
        assert len(fliers) == len(stats['fliers'])
        native_fliers = ax.lines[-1]
        np.testing.assert_allclose(native_fliers.get_xdata() if choice == 'x' else native_fliers.get_ydata(), stats['fliers'])
    plt.close(fig)
    geometry_states.append([name, choice])

for key, trees in by_control.items():
    assert len(set(trees)) == len(trees), (key, 'control changes only appearance, not executable Python')
print(json.dumps({'controls_with_distinct_python_ASTs': len(by_control),
                  'code_states': sum(map(len, by_control.values())),
                  'native_artist_and_SVG_geometry_states': geometry_states,
                  'passed': True}, indent=2))
