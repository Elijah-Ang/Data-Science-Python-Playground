"""Execute the entire original curriculum and check equivalent and incorrect answers."""
import json
import subprocess
import sys
import time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
C=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./foundations/curriculum.js")))'],cwd=ROOT))
namespace={}
exec((ROOT/'table-serialization.py').read_text()+'\n'+(ROOT/'foundations/runtime.py').read_text(),namespace)
run=namespace['run_foundation']
def request(lesson,round_index=0,code=None,check=True):
    lesson=next(l for l in C['lessons'] if l['id']==lesson)
    ex=lesson['rounds'][round_index]
    return run(dict(exercise=ex,columns=C['datasets'][ex['dataset']]['columns'],code=ex['solution'] if code is None else code,check=check))
start=time.time();failures=[];count=0
for lesson in C['lessons']:
    for i,exercise in enumerate(lesson['rounds']):
        try:
            response=request(lesson['id'],i)
            assert response['passed'],response.get('error') or response['feedback']
            count+=1
        except Exception as exc:
            failures.append((exercise['id'],str(exc)))
    if lesson['id'] in ['I22','W31','V37']:print(lesson['id'],count,'checked',flush=True)
assert not failures, json.dumps(failures,indent=2)
# Result equivalence accepts a different method and ordinary variable names.
assert request('I02',code='df.iloc[:2]')['passed']
assert request('I02',code='answer = df.iloc[:2]\nanswer')['passed']
assert request('I02',code='result = df.iloc[:2]')['passed']
assert not request('I02',code='df.tail(2)')['passed']
assert not request('I07',code='df[["price", "rating"]]')['passed']
assert not request('W01',code='clean = df\nclean["price"] *= 2\nclean')['passed']
assert not request('W12',code='df')['passed']
assert not request('W13',code='df')['passed']
assert not request('W29',code='df = df.iloc[:2]\ndf')['passed']
assert not request('V16',code='fig, ax = plt.subplots()\nax.set(title="Study club", xlabel="hours", ylabel="score")\nplt.show()')['passed']
plot=next(l for l in C['lessons'] if l['id']=='V16')['rounds'][0]['solution']
assert not request('V16',code=plot.replace('data=df,','data=df.head(2),'))['passed']
assert not request('V16',code=plot.replace('x="hours", y="score"','x="score", y="hours"'))['passed']
assert not request('V16',code=plot.replace('title="Study club"','title="Incorrect"'))['passed']
assert not request('V30',code=next(l for l in C['lessons'] if l['id']=='V30')['rounds'][0]['solution'].replace('bottom=first','bottom=0'))['passed']
# Syntax/runtime errors remain recoverable, and mutations never leak into a new run.
assert request('I02',code='df[')['error']
assert request('I02',code='df["missing"]')['error']
request('I02',code='df.drop(df.index, inplace=True)\npd = None\nnp = None\nplt = None',check=False)
assert request('I02')['passed']
assert request('W31')['passed']
print(json.dumps({'solutions':count,'semantic_negative_and_recovery_checks':18,'seconds':round(time.time()-start,1)}))
