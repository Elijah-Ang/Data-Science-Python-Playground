"""Exercise the assembled Visualise contracts, including scientific alternatives."""
import ast
import io
import tokenize
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
C = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT))
WORKSPACE = json.loads(subprocess.check_output(['node', '-e', 'const C=require("./foundations/curriculum.js"), W=require("./foundations/workspace.js"); console.log(JSON.stringify(Object.fromEntries(C.lessons.flatMap(l=>l.rounds.map(r=>[r.id,W.code(C,r,r.solution)])))))'], cwd=ROOT))
NS = {}
exec((ROOT / 'table-serialization.py').read_text() + '\n' + (ROOT / 'foundations/runtime.py').read_text(), NS)
RUN = NS['run_foundation']
EX = {r['id']: r for l in C['lessons'] if l['deck'] == 'visualise' for r in l['rounds']}
EVIDENCE = []

def canonical_python(code):
    """Normalize layout for semantic mutations while retaining string values."""
    code = ast.unparse(ast.parse(code))
    lines = code.splitlines(keepends=True)
    offsets = [0]
    for line in lines:
        offsets.append(offsets[-1] + len(line))
    replacements = []
    for token in tokenize.generate_tokens(io.StringIO(code).readline):
        if token.type != tokenize.STRING:
            continue
        try:
            value = ast.literal_eval(token.string)
        except (ValueError, SyntaxError):
            continue
        if isinstance(value, str):
            start = offsets[token.start[0] - 1] + token.start[1]
            end = offsets[token.end[0] - 1] + token.end[1]
            replacements.append((start, end, json.dumps(value, ensure_ascii=False)))
    for start, end, value in reversed(replacements):
        code = code[:start] + value + code[end:]
    return code

CODE = {key: canonical_python(exercise["solution"]) for key, exercise in EX.items()}

def check(key, code=None, passes=True, name='reference'):
    exercise = EX[key]
    with tempfile.TemporaryDirectory() as folder:
        old = os.getcwd()
        try:
            os.chdir(folder)
            response = RUN({'exercise': exercise, 'columns': C['datasets'][exercise['dataset']]['columns'],
                            'code': WORKSPACE[key] if code is None else code, 'explicitSetup': code is None, 'check': True})
        finally:
            os.chdir(old)
    actual = bool(response.get('passed'))
    EVIDENCE.append({'id': key, 'case': name, 'expected': passes, 'actual': actual,
                     'visibleReferenceWorkspace': code is None, 'error': response.get('error'), 'feedback': response.get('feedback')})
    (ROOT / 'work/audit/visualise-runtime-evidence.json').write_text(json.dumps({'seconds': round(time.time()-start, 1), 'cases': EVIDENCE}, indent=2) + '\n')
    assert actual == passes, (key, name, response.get('error') or response.get('feedback'))
    return response

def mutate(key, old, new, name):
    original = CODE[key]
    assert old in original, (key, old)
    check(key, original.replace(old, new), False, name)

start = time.time()
failures = []
for key in EX:
    try:
        check(key)
    except AssertionError as error:
        failures.append(str(error))
    if key.endswith('-3'):
        print(key, 'references checked', flush=True)
assert not failures, '\n'.join(failures)

# The same labelled count evidence can be drawn by countplot or prepared bars;
# absent labels, explicit order and the selected population still matter.
key = 'V08-2'
source = CODE[key]
call = 'sns.countplot(data=df, x="sky", order=["Sun", "Cloud", "Rain", "Snow"], ax=ax)'
check(key, source.replace(call, 'counts = df["sky"].value_counts().reindex(["Sun", "Cloud", "Rain", "Snow"], fill_value=0)\nax.bar(counts.index, counts.values)'), name='equivalent prepared zero bar')
mutate(key, ', "Snow"', '', 'missing empty category')
mutate(key, '["Sun", "Cloud", "Rain", "Snow"]', '["Rain", "Cloud", "Sun", "Snow"]', 'wrong reporting order')
mutate('V08-3', 'selected = df[df["status"] == "open"]', 'selected = df', 'wrong open-request population')
mutate('V08-3', 'selected["channel"].value_counts().index', 'sorted(selected["channel"].unique())', 'wrong count ranking')
# Median fixtures deliberately differ from means, even in Change.
mutate('V09-2', 'estimator="median"', 'estimator="mean"', 'wrong central statistic')
mutate('V09-3', 'estimator="median"', 'estimator="mean"', 'outlier-sensitive mean')
key = 'V09-3'; source = CODE[key]; call = 'sns.barplot(data=df, x="kind", y="cost", estimator="median", errorbar=None, ax=ax)'
check(key, source.replace(call, 'medians = df.groupby("kind")["cost"].median()\nax.bar(medians.index[::-1], medians.values[::-1])'), name='equivalent prepared reordered medians')
# New practice demands have a wrong strategy whose geometry must differ.
mutate('V02-2', 'Temperature (°F)', 'Temperature (°C)', 'mislabels transformed units')
mutate('V02-3', 'Trial batch', 'All samples', 'misstates prepared population')
mutate('V03-2', 'hue="latency_ms", legend="full", ', '', 'fixed appearance loses numeric mapping')
mutate('V03-3', 'y="mass_g", ax=ax', 'y="mass_g", hue="batch", ax=ax', 'unnecessary category mapping')
mutate('V16-2', ' * 9 / 5 + 32', '', 'wrong temperature units')
mutate('V16-3', 'df.dropna(subset=["wait_minutes", "consult_minutes"])', 'df.dropna()', 'unrelated note removes valid pair')
mutate('V04-3', 'data=df', 'data=df[df["weight_kg"] < 8]', 'drops sparse heavy tail')
mutate('V18-3', 'ordered.iloc[0]["reading"]', 'df.iloc[0]["reading"]', 'wrong chronological baseline')
mutate('V13-3', '.median().sort_values().index', '.median().sort_values(ascending=False).index', 'wrong centre-based raw-point order')
mutate('V11-3', 'data=df,', 'data=df[df["cost"] < 80],', 'drops valid high-cost invoice')
mutate('V17-3', 'style="surface", ', '', 'colour alone loses redundant cue')
mutate('V22-3', '["speed", "output", "defects"]', '["run_id", "speed", "output", "defects"]', 'correlates identifier')
mutate('V24-3', 'data=selected, x="distance_m"', 'data=df, x="distance_m"', 'inconsistent panel population')
mutate('V25-3', 'ax.clear()\n', '', 'leaves misleading draft evidence')
mutate('V29-3', 'rates = totals["resolved"] / totals["received"] * 100', 'rates = (df["resolved"] / df["received"] * 100).groupby(df["team"]).mean()', 'unweighted shift percentage')
mutate('V05-3', 'bw_adjust=2', 'bw_adjust=1', 'fails smoothing contrast')
mutate('V06-3', 'complementary=True', 'complementary=False', 'wrong tail direction')
mutate('V07-3', 'data=df,', 'data=df[df["rain_mm"] > 0],', 'drops dry-day zero evidence')
mutate('V10-3', 'errorbar="sd"', 'errorbar=None', 'removes observation-spread interval')
mutate('V12-3', 'sns.stripplot(data=df, x="batch", y="strength", jitter=False, color="black", ax=ax)\n', '', 'density without raw-evidence layer')
mutate('V14-3', 'sns.swarmplot(', 'sns.stripplot(jitter=False, ', 'coincident strip points are not packed')
mutate('V14-3', 'data=df,', 'data=df.drop_duplicates(subset=["bench", "reading"]),', 'drops coincident readings')
mutate('V15-3', 'axes[0].clear()', 'axes[1].clear()', 'repairs wrong panel')
mutate('V19-3', 'data=df, x="hour", y="output", estimator="mean"', 'data=selected, x="hour", y="output", estimator="mean"', 'summary uses only one replicate')
mutate('V20-3', 'selected = df[df["usable"]]', 'selected = df', 'fits unusable calibration outlier')
mutate('V21-3', 'sns.residplot(data=df, x="dose", y="response", ax=ax)', 'sns.scatterplot(data=df, x="dose", y="response", ax=ax)', 'original response is not residual')
mutate('V21-3', '"curved"', '"unstructured"', 'wrong residual interpretation')
mutate('V23-2', 'matrix.div(matrix.sum(axis=1), axis=0)', 'matrix / matrix.to_numpy().sum()', 'wrong normalization denominator')
mutate('V23-3', 'aggfunc="mean")', 'aggfunc="mean").fillna(0)', 'absent group is not measured zero')
mutate('V28-3', 'selected.loc[selected["output"].idxmax()]', 'df.loc[df["output"].idxmax()]', 'excluded global maximum')
mutate('V17-3', 'size="speed_kmh"', 'size="minutes"', 'raw duration is not speed')
mutate('V30-3', 'total = df["Online"] + df["Shop"]', 'total = df["Online"].sum() + df["Shop"].sum()', 'grand-total instead of within-item shares')
mutate('V30-2', 'bottom=df["paper"]', 'bottom=0', 'wrong stack bottom')
mutate('V31-3', '["light", "height", "leaf_area"]', '["tray_id", "light", "height", "leaf_area"]', 'extra identifier panels')
mutate('V32-3', 'g.ax_joint.axvline(60', 'g.ax_marg_x.axvline(60', 'reference on wrong joint panel')
mutate('V33-3', 'col="region", ', '', 'omits region facets')
mutate('V33-3', 'height=3)', 'height=3, facet_kws={"sharex": False})', 'incomparable facet x scales')
mutate('V34-3', 'xlabel="Wait (minutes)"', 'xlabel="Hours"', 'export labels wrong units')
mutate('V37-2', 'df.dropna(subset=["wait_minutes", "consult_minutes"])', 'df.dropna()', 'checkpoint unrelated missingness')
mutate('V37-3', 'selected["units"] * selected["unit_price"]', 'selected["unit_price"]', 'unit price is not revenue')
# Every fresh review tests one concept-specific plausible wrong answer.
mutate('VR1-1', '"line"', '"counts"', 'wrong view for ordered change')
mutate('VR1-2', '== "trial"', '== "standard"', 'wrong categorical eligibility')
mutate('VR1-3', 'data=df,', 'data=df[df["weight_kg"] < 8],', 'review drops heavy tail')
mutate('VR1-4', '["phone", "email", "chat", "web"]', '["email", "chat", "phone", "web"]', 'review ignores reporting order')
mutate('VR2-1', 'sns.lineplot(data=ordered, x="hour", y="reading", estimator=None, marker="o", ax=ax)', 'ax.plot(df["hour"], df["reading"], marker="o")', 'review uses row order')
mutate('VR2-2', 'estimator="mean"', 'estimator="sum"', 'review total versus per-shift mean')
mutate('VR2-3', 'data=df,', 'data=df.drop_duplicates(subset=["bench", "reading"]),', 'review loses repeated observation')
mutate('VR2-4', 'style="batch", ', '', 'review colour alone')
mutate('VR3-1', '["leaf_area", "height", "light"]', '["tray_id", "leaf_area", "height", "light"]', 'review includes identifier')
mutate('VR3-2', 'data=selected, x="measured"', 'data=df, x="measured"', 'review wrong histogram population')
mutate('VR3-3', 'ax.axvline(60', 'ax.axhline(60', 'review wrong benchmark orientation')
mutate('VR4-1', 'data=df,', 'data=df[df["rain_mm"] > 0],', 'review excludes observed zeros')
mutate('VR4-2', 'x="weight_kg", ax=ax', 'x="weight_kg", complementary=True, ax=ax', 'review wrong ECDF direction')
mutate('VR4-3', 'estimator="median"', 'estimator="mean"', 'review wrong typical cost')
mutate('VR4-4', 'ax.clear()\n', '', 'review leaves density draft')
mutate('VR5-1', 'data=df,', 'data=df[df["station"] == "Up"],', 'review confuses trajectory and mean')
mutate('VR5-2', 'data=standard,', 'data=trial,', 'review fits wrong comparison batch')
mutate('VR5-3', 'sns.residplot(data=df, x="response", y="dose", ax=ax)', 'sns.scatterplot(data=df, x="response", y="dose", ax=ax)', 'review response not reversed residual')
mutate('VR5-4', 'values="zero_wait"', 'values="wait_minutes"', 'review mean duration instead of zero rate')
mutate('VR5-4', 'aggfunc="mean")', 'aggfunc="mean").fillna(0)', 'review fills absent measurements')
mutate('VR6-1', 'idxmin()', 'idxmax()', 'review wrong eligible extremum')
mutate('VR6-2', 'bottom=df["glass"]', 'bottom=0', 'review unstacked components')
mutate('VR6-3', 'corner=True', 'corner=False', 'review mirrored panels retained')
mutate('VR6-4', 'col="surface", ', '', 'review omits distribution facets')
# Requested axes are strict; scientifically harmless display ranges remain free.
check('V05-3', CODE['V05-3'].replace('fig.tight_layout()', 'axes[0].set_ylim(0, 1)\naxes[1].set_ylim(0, 1)\nfig.tight_layout()'), name='equivalent density y display range')
check('V26-3', 'ax.set_xlim(0, 70)\n' + CODE['V26-3'], name='equivalent unrequested x range')
check('V17-3', CODE['V17-3'].replace('speed_kmh', 'speed'), name='equivalent derived-column name')
check('V29-3', CODE['V29-3'].replace('ax.bar(rates.index, rates.values)', 'import seaborn as sns\nsns.barplot(x=rates.index, y=rates.values, errorbar=None, ax=ax)'), name='equivalent prepared pooled-rate bars')
# Independently order and draw the time pairs: Seaborn and Matplotlib agree.
key = 'VR2-1'; source = CODE[key]
check(key, source.replace('sns.lineplot(data=ordered, x="hour", y="reading", estimator=None, marker="o", ax=ax)', 'ax.plot(ordered["hour"], ordered["reading"], marker="o")'), name='equivalent ordered Matplotlib line')
key = 'V16-3'; source = CODE[key]
check(key, source.replace('sns.scatterplot(data=selected, x="wait_minutes", y="consult_minutes", ax=ax)', 'ax.scatter(selected["wait_minutes"], selected["consult_minutes"])'), name='equivalent pairwise Matplotlib scatter')
(ROOT / 'work/audit/visualise-runtime-evidence.json').write_text(json.dumps({'seconds': round(time.time()-start, 1), 'cases': EVIDENCE}, indent=2) + '\n')
print(json.dumps({'visualise_reference_solutions': len(EX), 'total_cases': len(EVIDENCE), 'seconds': round(time.time()-start, 1)}))
