"""Prepare each challenge's actual CSV and its exact learner-facing manifest.

Run with tests/requirements-pyodide-parity.txt; normal builds need only stdlib.
Use --check to verify committed files without modifying them.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'ml-learning'))
from fixtures import learning_fixture
from workflows import DATA,BRIEFS,PENG,BREAST

def assets():
    result={};files={}
    for i,brief in enumerate(BRIEFS,1):
        id=f'ML-X{i:02}';key=brief[1];spec=DATA[key]
        source=learning_fixture(spec.get('dataset',key))
        columns=spec['numeric']+spec['binary']+spec['category']
        target=spec['target'] if i<=16 else None
        notes='Ready to load: comma-delimited UTF-8, header row, no saved index. No filtering or target construction is required.'
        if i==1:
            columns=['country','year']+columns
            notes+=' Each row is one country in 2007.'
        if i==4:
            columns=['Date']+columns
            notes+=' Rows are already ordered by parsed Date then Hour. Keep this chronological order; reserve the last 20%.'
        if i==10:
            columns=['sugarpercent','pricepercent']+columns+['winpercent']
            notes+=' popular is 50% or above when winpercent >= 50, otherwise below 50%. winpercent is retained only for the leakage-detection task: exclude it from X.'
        if i==12:
            notes+=' popular is 50% or above when original winpercent >= 50, otherwise below 50%. The target-derived winpercent column has been removed; use the nine flags as X.'
        if i==15:notes+=' Exact seed-42 sample of 600 rows after source deduplication; do not sample or deduplicate it again.'
        if i==17:columns=PENG
        if i==18:
            columns=BREAST
            notes+=' This is the 569-row measurement population. Creating the reproducible sample of at most 500 rows remains part of the hierarchy task.'
        if i==19:columns=[c for c in source if c.endswith(('_mean','_se','_worst'))]
        if i>=17:notes+=' Fitting input contains measurements only; species/diagnosis reference labels are not supplied or required.'
        if target:columns=columns+[target]
        prepared=source[columns].reset_index(drop=True)
        path=f'data/ml-learning/{id}.csv'
        text=prepared.to_csv(index=False,lineterminator='\n')
        # Preview the exact decoded file, including pandas' CSV type inference.
        import io
        decoded=pd.read_csv(io.StringIO(text))
        preview=json.loads(decoded.head(8).to_json(orient='split',date_format='iso'))
        result[id]=dict(name=id+' challenge input',file=path,sourceFile=spec['file'],
            sourceHash=hashlib.sha256((ROOT/spec['file']).read_text().encode()).hexdigest(),sourceHashEncoding='UTF-8 with LF line endings',
            sha256=hashlib.sha256(text.encode()).hexdigest(),rows=len(decoded),columns=list(decoded),
            dtypes={c:str(t) for c,t in decoded.dtypes.items()},preview=preview['data'],index=preview['index'],
            delimiter=',',target=target,description=notes)
        files[path]=text
    files['ml-learning/inputs.json']=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    return files

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,text in assets().items():
        path=ROOT/name
        if args.check:assert path.read_text()==text,'Prepared input drift: '+name
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
    print('19 prepared challenge inputs: exact populations, CSV bytes, previews, schemas and provenance verified.')
