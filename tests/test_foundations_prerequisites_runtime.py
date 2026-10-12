"""Check the prerequisite distinctions with discriminating values and labels."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
C = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT))
namespace = {}
exec((ROOT / 'table-serialization.py').read_text() + '\n' + (ROOT / 'foundations/runtime.py').read_text(), namespace)
run = namespace['run_foundation']
rounds = {r['id']: r for l in C['lessons'] for r in l['rounds']}
records = []

def check(id, code=None, expected=True):
    r = rounds[id]
    original = os.getcwd()
    with tempfile.TemporaryDirectory() as directory:
        try:
            os.chdir(directory)
            result = run(dict(exercise=r, columns=C['datasets'][r['dataset']]['columns'], code=code or r['solution'], check=True))
        finally:
            os.chdir(original)
    assert result.get('passed') is expected, (id, code, result.get('error'), result.get('feedback'))
    records.append({'id': id, 'expected': expected, 'passed': True})

for id in ['I06S', 'I13L', 'I19S', 'I19A']:
    for n in range(1, 4):
        check(f'{id}-{n}')
# Equivalent methods preserve the same requested object and pairing.
check('I06S-1', 'df["reading"].index.tolist()')
check('I06S-2', 'df["reading"].to_numpy().tolist()')
check('I06S-3', 's = df["reading"].tail(2)\n{"labels": s.index.tolist(), "values": s.values.tolist()}')
check('I13L-3', 'selected = df[df["hours"] <= 4]\nrow = selected.nlargest(1, "reading").iloc[0]\n{"hours": row["hours"], "reading": row["reading"]}')
check('I19S-2', 'ranked = df.groupby("bench")["reading"].agg("median").sort_values()\nranked.index.tolist()')
check('I19S-3', 'ranked = df.groupby("bench")["reading"].median().sort_values(ascending=False)\n{"labels": ranked.index.tolist(), "medians": ranked.values.tolist()}')
check('I19A-1', 'pd.concat([means.rename("mean"), counts.rename("records")], axis=1)')
check('I19A-3', 'quality = pd.concat([df.dtypes.astype(str).rename("dtype"), df.isna().sum().rename("missing")], axis=1)\nquality')
# Labels, positions and values must disagree on this fixture.
check('I06S-1', 'list(range(len(df)))', False)
check('I06S-1', 'list(df["reading"].to_numpy())', False)
check('I06S-1', 'list(df["reading"].index())', False)
check('I06S-2', 'df["reading"].to_numpy() * 2', False)
check('I06S-3', 's=df["reading"].tail(2).reset_index(drop=True)\n{"labels":list(s.index),"values":list(s.values)}', False)
check('I13L-1', 'df["reading"].max()', False)
check('I13L-1', 'df["reading"].to_numpy().argmax()', False)
check('I13L-2', 'row=df.loc[df["reading"].idxmin()]\nrow[["hours","reading"]]', False)
check('I13L-3', 'row=df.loc[df["reading"].idxmax()]\n{"hours":row["hours"],"reading":row["reading"]}', False)
check('I13L-3', '{"hours":df["hours"].min(),"reading":df["reading"].max()}', False)
check('I19S-2', 's=df.groupby("bench")["reading"].median().sort_index()\nlist(s.index)', False)
check('I19S-2', 's=df.groupby("bench")["reading"].mean().sort_values()\nlist(s.index)', False)
check('I19S-2', 's=df.groupby("bench")["reading"].median().sort_values(ascending=False)\nlist(s.index)', False)
check('I19S-3', 's=df.groupby("bench")["reading"].median().sort_values(ascending=False)\n{"labels":sorted(s.index),"medians":list(s.values)}', False)
check('I19A-1', 'pd.DataFrame({"mean":means.to_numpy(),"records":counts.to_numpy()},index=means.index)', False)
check('I19A-2', 'pd.DataFrame({"mean":means,"checks":checks}).fillna(0)', False)
check('I19A-3', 'pd.DataFrame({"dtype":df.dtypes.astype(str).to_numpy(),"missing":df.isna().sum().sort_values().to_numpy()},index=df.columns)', False)
check('I19A-3', 'pd.DataFrame({"dtype":df.dtypes.astype(str),"missing":df.isna().sum()}).T', False)
# The motivating plot is retained and remains executable.
check('V13-3')
out = ROOT / 'work/prerequisite-audit'
out.mkdir(parents=True, exist_ok=True)
(out / 'prerequisite-runtime-evidence.json').write_text(json.dumps(records, indent=2) + '\n')
print(f'Prerequisite runtime: {len(records)} references, equivalents and meaningful negatives passed; V13 Transfer retained.')
