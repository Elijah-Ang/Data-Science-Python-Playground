"""Validate final variety content, scientific choices and equivalent chart forms."""
import ast
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import tokenize

ROOT = Path(__file__).resolve().parents[1]
C = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT))
def canonical_python(code):
    # Mutation targets follow Python structure, not the presentation formatter.
    code = ast.unparse(ast.parse(code))
    lines = code.splitlines(keepends=True)
    offsets = [0]
    for line in lines:
        offsets.append(offsets[-1] + len(line))
    replacements = []
    for token in tokenize.generate_tokens(io.StringIO(code).readline):
        if token.type == tokenize.STRING:
            value = ast.literal_eval(token.string)
            if isinstance(value, str):
                replacements.append((offsets[token.start[0]-1]+token.start[1], offsets[token.end[0]-1]+token.end[1], json.dumps(value, ensure_ascii=False)))
    for start, end, value in reversed(replacements):
        code = code[:start]+value+code[end:]
    return code

ROUNDS = {r['id']: {**r, 'solution': canonical_python(r['solution'])} for l in C['lessons'] if l['deck'] == 'visualise' for r in l['rounds']}
CHANGED = C['visualiseVariety']['changedRounds']
ns = {}
exec((ROOT/'table-serialization.py').read_text()+'\n'+(ROOT/'foundations/runtime.py').read_text(), ns)
records = []
started = time.time()

def check(key, code, expected, name):
    r = ROUNDS[key]
    old = os.getcwd()
    with tempfile.TemporaryDirectory() as folder:
        try:
            os.chdir(folder)
            result = ns['run_foundation']({'exercise': r, 'columns': C['datasets'][r['dataset']]['columns'], 'code': code, 'check': True})
        finally:
            os.chdir(old)
    records.append({'round': key, 'case': name, 'expected': expected, 'passed': bool(result.get('passed')), 'error': result.get('error'), 'feedback': result.get('feedback')})
    path = ROOT/'work/four-improvements/variety-runtime-evidence.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({'seconds': round(time.time()-started, 1), 'cases': records}, indent=2)+'\n')
    assert bool(result.get('passed')) == expected, records[-1]
    assert not result.get('error'), records[-1]  # A meaningful negative is executable.

def replace(key, old, new):
    code = ROUNDS[key]['solution']
    assert old in code and old != new, (key, old)
    return code.replace(old, new)

# Inventory the final assembly, including reviews and visible worked code.
assert len(ROUNDS) == 132
alkaline = ROUNDS['V24-2']
assert sum(value > 7 for value in C['datasets'][alkaline['dataset']]['columns']['ph']) == 4
assert 'four alkaline samples' in alkaline['datasetRationale']
assert 'same report population' in alkaline['datasetRationale']
assert len([l for l in C['lessons'] if l['deck']=='visualise']) == 43
for l in [l for l in C['lessons'] if l['deck']=='visualise']:
    for r in l['rounds']:
        for field in ('question', 'observationUnit', 'datasetRationale', 'decision'):
            assert r.get(field), (r['id'], field)
        assert r['brief']['question'] in r['task'], r['id']
        assert r['brief']['rows'] in r['task'], r['id']
        assert 'These data are useful because' not in r['task'], r['id']
        assert r['datasetRationale'], r['id']  # Authoring rationale remains inspectable metadata.
    if not l['review'] and l['id'] != 'V01':
        assert l['rounds'][0]['dataset'] not in ('students', 'weather', 'candy', 'games'), l['id']
        assert l['rounds'][0]['solution'] in l['example'], l['id']

# Reference cases cover every changed Follow/Change, beyond the full 132-round audit.
for key in CHANGED:
    check(key, ROUNDS[key]['solution'], True, 'authored reference')

class IndividualLabels(ast.NodeTransformer):
    """The explicitly taught individual Axes setters are equivalent to set."""
    def visit_Expr(self, node):
        if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == 'set':
            call = node.value
            if call.keywords and all(k.arg in ('title', 'xlabel', 'ylabel') for k in call.keywords):
                return [ast.Expr(ast.Call(ast.Attribute(call.func.value, 'set_'+k.arg, ast.Load()), [k.value], [])) for k in call.keywords]
        return node

# Use a different accepted argument form or explicitly taught plotting API.
for key in CHANGED:
    code = ROUNDS[key]['solution']
    if key.startswith('V35'):
        alternative = repr(ast.literal_eval(code))
    elif key == 'V16-1':
        alternative = replace(key, 'sns.scatterplot(data=df, x="volume_ml", y="pressure_kpa", ax=ax)', 'ax.scatter(df["volume_ml"], df["pressure_kpa"])')
    elif key.startswith('V04'):
        bins = 4 if key.endswith('-1') else 2
        alternative = replace(key, f'sns.histplot(data=df, x="diameter_mm", bins={bins}, ax=ax)', f'ax.hist(df["diameter_mm"], bins={bins})')
    elif key.startswith('V09'):
        stat = 'mean' if key.endswith('-1') else 'median'
        alternative = replace(key, f'sns.barplot(data=df, x="route", y="fare", estimator="{stat}", errorbar=None, ax=ax)', f'heights = df.groupby("route")["fare"].{stat}()\nax.bar(heights.index, heights.values)')
    elif key.startswith('V10'):
        stat = 'mean' if key.endswith('-1') else 'median'
        alternative = replace(key, f'estimator="{stat}"', f'estimator=lambda values: values.{stat}()')
    elif key.startswith('V20'):
        table = 'df' if key.endswith('-1') else 'selected'
        alternative = replace(key, f'sns.regplot(data={table}, x="known_g", y="read_g", ci=None, ax=ax)', f'from numpy.polynomial.polynomial import polyfit\nintercept, slope = polyfit({table}["known_g"], {table}["read_g"], 1)\nax.scatter({table}["known_g"], {table}["read_g"])\nlimits = [{table}["known_g"].min(), {table}["known_g"].max()]\nax.plot(limits, [intercept + slope * value for value in limits])')
    elif key.startswith('V27'):
        alternative = code.replace('ax.axvline(', 'ax.axvline(x=').replace('ax.axhline(', 'ax.axhline(y=')
    elif key.startswith('V28'):
        alternative = code.replace('ax.annotate("Peak",', 'ax.annotate(text="Peak",').replace('ax.annotate("Smallest area",', 'ax.annotate(text="Smallest area",')
    elif key == 'V34-1':
        alternative = replace(key, 'fig.savefig("chart.png",', 'plt.figure(fig.number)\nplt.savefig("chart.png",')
    elif key.startswith('V36'):
        alternative = code.replace('ax.set_ylim(bottom=0)', 'ax.set_ybound(lower=0)').replace('ax.set_yscale("linear")', 'ax.set(yscale="linear")')
    else:
        alternative = ast.unparse(ast.fix_missing_locations(IndividualLabels().visit(ast.parse(code))))
        if ast.dump(ast.parse(alternative)) == ast.dump(ast.parse(code)):
            # Figure-level functions own the canvas; either documented handle
            # references that same Figure, without creating an extra one.
            assert 'g.figure' in code, key
            alternative = code.replace('g.figure', 'g.fig')
    assert alternative != code, key
    check(key, alternative, True, 'meaningful equivalent API/form')

# Each revised question has an executable wrong analytical/display strategy.
mutations = {
'V35-1': ('"scatter"', '"line"'), 'V35-2': ('"histogram"', '"counts"'),
'V02-1': ('Distance (km)', 'Distance (miles)'),
'V16-1': ('x="volume_ml", y="pressure_kpa"', 'x="pressure_kpa", y="volume_ml"'),
'V04-1': ('bins=4', 'bins=2'), 'V04-2': ('bins=2', 'bins=8'),
'V08-1': ('sns.countplot(data=df, x="shelf", ax=ax)', 'sns.barplot(data=df, x="shelf", y="late_days", errorbar=None, ax=ax)'),
'V09-1': ('estimator="mean"', 'estimator="median"'), 'V09-2': ('estimator="median"', 'estimator="mean"'),
'V13-1': ('jitter=0.15', 'jitter=False'), 'V13-2': ('jitter=False', 'jitter=0.15'),
'V11-1': ('data=df,', 'data=df[df["hours"] < 30],'), 'V11-2': ('x="hours", y="design"', 'x="design", y="hours"'),
'V03-1': ('hue="habitat", ', ''), 'V17-1': ('style="instrument", ', ''), 'V17-2': ('style="instrument", ', ''),
'V22-1': ('["light", "height", "water_ml"]', '["sample_id", "light", "height", "water_ml"]'),
'V22-2': ('["light", "height"]', '["light", "height", "water_ml"]'),
'V24-1': ('sns.scatterplot(data=df,', 'sns.scatterplot(data=df.iloc[:2],'), 'V24-2': ('plt.subplots(2, 1,', 'plt.subplots(1, 2,'),
'V25-1': ('style="line", ', ''), 'V25-2': ('alpha=0.6', 'alpha=1'),
'V27-1': ('df["rpm"].median()', 'df["yield_g"].median()'), 'V27-2': ('df["yield_g"].mean()', 'df["yield_g"].median()'),
'V28-1': ('df["output_w"].idxmax()', 'df["output_w"].idxmin()'), 'V28-2': ('df["area_m2"].idxmin()', 'df["output_w"].idxmin()'),
'V29-1': ('.mean()', '.sum()'), 'V29-2': ('.sum()', '.mean()'),
'V05-1': ('cut=0', 'cut=3'), 'V05-2': ('bw_adjust=2', 'bw_adjust=0.5'),
'V06-1': ('x="hours", ax=ax', 'x="hours", complementary=True, ax=ax'), 'V06-2': ('complementary=True', 'complementary=False'),
'V07-1': ('sns.rugplot(data=df, x="conductivity", ax=ax)', 'sns.rugplot(data=df.iloc[:2], x="conductivity", ax=ax)'),
'V07-2': ('sns.rugplot(data=df, x="conductivity", ax=ax)', 'sns.rugplot(data=df.iloc[:2], x="conductivity", ax=ax)'),
'V10-1': ('errorbar="sd"', 'errorbar=None'), 'V10-2': ('estimator="median"', 'estimator="mean"'),
'V12-1': ('cut=0', 'cut=2'), 'V12-2': ('inner="point"', 'inner="quart"'),
'V14-1': ('sns.swarmplot(', 'sns.stripplot(jitter=False, '), 'V14-2': ('x="length_mm", y="lot"', 'x="lot", y="length_mm"'),
'V15-1': ('ax.clear()\n', ''), 'V15-2': ('x="flow", y="ink", jitter=False', 'x="ink", y="flow", jitter=False'),
'V20-1': ('sns.regplot(data=df, x="known_g", y="read_g", ci=None, ax=ax)', 'sns.scatterplot(data=df, x="known_g", y="read_g", ax=ax)'),
'V20-2': ('data=selected,', 'data=df,'),
'V21-1': ('sns.residplot(', 'sns.scatterplot('), 'V21-2': ('data=selected,', 'data=df,'),
'V23-1': ('pd.crosstab(df["door"], df["ticket"])', 'pd.crosstab(df["door"], df["ticket"], normalize=True)'),
'V31-1': ('["oxygen", "temperature"]', '["sample_id", "oxygen", "temperature"]'), 'V31-2': ('corner=True', 'corner=False'),
'V32-1': ('y="passengers"', 'y="platform"'), 'V33-1': ('col="workshop", ', ''),
'V34-1': ('dpi=150', 'dpi=72'),
'V36-1': ('bottom=0', 'bottom=3'), 'V36-2': ('ax.set_yscale("linear")\n', ''),
'V37-1': ('selected = df[df["minutes"] > 20]', 'selected = df'),
}
assert set(mutations) == set(CHANGED)
for key, (old, new) in mutations.items():
    wrong = replace(key, old, new)
    # Integer format would make normalized fractional counts invalid Python
    # plotting; use an executable decimal annotation while preserving the wrong denominator.
    if key == 'V23-1':
        wrong = wrong.replace('fmt="d"', 'fmt=".2f"')
    check(key, wrong, False, 'wrong scientific or chart choice')

# Jitter checking examines geometry and preserves the measured axis, so a
# manually placed equivalent is welcome and measured-axis noise is rejected.
manual = 'groups = {"A": 0, "B": 1}\npositions = df["sensor"].map(groups).to_numpy()\nsideways = [-0.1, 0.1, 0, -0.1, 0.1, 0]\nax.scatter(positions + sideways, df["offset"])\nax.set_xticks([0, 1])\nax.set_xticklabels(["A", "B"])\nax.set(title="Sensor repeat checks", xlabel="sensor", ylabel="offset")\nfig.tight_layout()\nplt.show()'
manual = 'import matplotlib.pyplot as plt\nfig, ax = plt.subplots(figsize=(6, 4))\n' + manual
check('V24-2', replace('V24-2', 'selected = df[df["ph"] > 7]', 'selected = df'), False, 'wrong alkaline-sample population')
check('V11-2', replace('V11-2', 'ascending=False', 'ascending=True'), False, 'wrong median-lifetime ranking')
wrong_style = replace('V25-2', 'style="line"', 'style="run"').replace('style_order=["South", "North"], ', '')
check('V25-2', wrong_style, False, 'wrong style variable')
check('V13-1', manual.replace('positions + sideways', 'positions + 0.1'), False, 'rigid shift without within-category spread')
check('V08-1', replace('V08-1', 'sns.countplot(data=df, x="shelf", ax=ax)', 'counts = df["shelf"].value_counts().sort_index(ascending=False)\nax.bar(counts.index, counts.values)'), True, 'equivalent prepared reordered counts')
check('V13-1', manual, True, 'manual category-only spread')
check('V13-1', manual.replace('df["offset"])', 'df["offset"] + 0.1)'), False, 'manual measured-axis noise')
manual_line = manual.replace('ax.scatter(positions + sideways, df["offset"])', 'ax.plot(positions + sideways, df["offset"], linestyle="none", marker="o")')
check('V13-1', manual_line, True, 'manual marker-only line spread')
check('V13-1', manual_line.replace('df["offset"], linestyle=', 'df["offset"] + 0.1, linestyle='), False, 'manual line measured-axis noise')
print(json.dumps({'changed_rounds': len(CHANGED), 'cases': len(records), 'seconds': round(time.time()-started, 1)}))
