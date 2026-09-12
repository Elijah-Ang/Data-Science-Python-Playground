"""Generate the production finite control domain and its dataset compatibility facts.
Run --write after intentionally changing datasets/controls; --check prevents drift.
"""
import argparse
import importlib.util
import itertools
import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / 'statistics'
spec = importlib.util.spec_from_file_location('engine', HERE/'engine.py')
engine = importlib.util.module_from_spec(spec); spec.loader.exec_module(engine)


def make_schema():
    datasets = {k:pd.read_csv(ROOT/'data'/v['file']) for k,v in engine.SOURCES.items()}
    families = {k: ['gapminder'] if k=='paired' else ['penguins'] if k in ('groups','factorial') else ['penguins','candy']
                for k in [*engine.FAMILIES, 'proportions', 'goodness']}
    categories = {d:{c:sorted(raw[c].dropna().astype(str).unique()) for c in engine.CATEGORICAL[d]} for d,raw in datasets.items()}
    factors = {}
    for y in engine.NUMERIC['penguins']:
        factors[y] = []
        for n in (2,3):
            for fs in itertools.permutations(engine.CATEGORICAL['penguins'], n):
                try: engine.prepare(datasets['penguins'], {'family':'factorial','y':y,'factors':list(fs)})
                except ValueError: continue
                factors[y].append(list(fs))
    return {'families':families, 'numeric':engine.NUMERIC, 'categorical':engine.CATEGORICAL, 'categories':categories,
            'confidence':[.9,.95,.99], 'years':sorted(int(x) for x in datasets['gapminder'].year.unique()),
            'groupChoices':['species','island','year'], 'factorCounts':[2,3], 'validFactors':factors,
            'goals':{'reference':['mean','estimate'], 'independent':['mean','rank'], 'paired':['mean','rank'],
                     'groups':['mean','rank'], 'association':['mean','rank']},
            'structures':['one','two'], 'expectedModes':['equal','specified']}


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');p.add_argument('--check',action='store_true');args=p.parse_args()
    text=json.dumps(make_schema(),indent=2)+'\n';path=HERE/'controls.json'
    if args.write:path.write_text(text)
    else:assert path.read_text()==text, 'Production control schema is stale: run statistics/audit/controls.py --write'
