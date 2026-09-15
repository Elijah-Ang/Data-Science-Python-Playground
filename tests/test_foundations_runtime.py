"""Execute the entire original curriculum and check equivalent and incorrect answers."""
import json
import subprocess
import sys
import time
import os
import tempfile
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
    previous=os.getcwd()
    with tempfile.TemporaryDirectory() as directory:
        try:
            os.chdir(directory)
            return run(dict(exercise=ex,columns=C['datasets'][ex['dataset']]['columns'],code=ex['solution'] if code is None else code,check=check))
        finally:
            os.chdir(previous)
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
# Method intent and semantic equivalence are independent checks.
assert not request('I02',code='df.iloc[:2]')['passed']
assert not request('I02',code='# df.head(2)\ndf.iloc[:2]')['passed']
assert not request('I02',code='"df.head(2)"\ndf.iloc[:2]')['passed']
assert request('I02',code='table = df\nanswer = table.head(\n 2\n)\nanswer')['passed']
assert request('I02',code='take = df.head\nresult = take(2)')['passed']
assert request('I02',2,code='df.iloc[:4]')['passed']
assert request('I02',2,code='answer = df.iloc[:4]\nanswer')['passed']
assert not request('I08',code='df.loc[:1, ["candy", "flavour"]]')['passed']
assert not request('I09',code='df.iloc[1:4, [2]]')['passed']
assert request('I09',2,code='df.iloc[1:6, [2]]')['passed']
assert request('I10',2,code='df[(df["age"] >= 2) & (df["age"] <= 5)]')['passed']
assert request('I01CSV',code='df')['error']
assert request('I01CSV')['passed']
assert request('I18S')['passed']
for i in [0,1]:
 ex=next(l for l in C['lessons'] if l['id']=='W30')['rounds'][i]
 assert not request('W30',i,code=ex['solution'].replace('(df["price"] * 1.1).round(2)', 'df["price"].apply(lambda x: round(x * 1.1, 2))'))['passed']
for i in range(3):
 ex=next(l for l in C['lessons'] if l['id']=='W24')['rounds'][i]
 assert not request('W24',i,code=ex['solution'].replace(', validate="many_to_one"',''))['passed']
# The IQR fixture has Q1=11.25, Q3=13.75, upper fence=17.5: only 40 is flagged.
assert request('W29',code='q1=df["price"].quantile(.25)\nq3=df["price"].quantile(.75)\ndf["needs_review"]=[False,False,False,False,False,True]\ndf')['passed']
assert not request('W29',code='df["needs_review"]=df["price"]>df["price"].quantile(.75)\ndf')['passed']
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
for id,old,new in [('V16','sns.scatterplot(data=df, x="hours", y="score", ax=ax)','ax.scatter(df["hours"], df["score"])'),('V04','sns.histplot(data=df, x="hours", bins=4, ax=ax)','ax.hist(df["hours"], bins=4)')]:
 ex=next(l for l in C['lessons'] if l['id']==id)['rounds'][0]
 assert not request(id,code=ex['solution'].replace(old,new))['passed']
ex=next(l for l in C['lessons'] if l['id']=='V16')['rounds'][2]
assert request('V16',2,code=ex['solution'].replace('sns.scatterplot(data=df, x="minutes", y="rating", ax=ax)','ax.scatter(df["minutes"], df["rating"])'))['passed']
ex=next(l for l in C['lessons'] if l['id']=='W24')['rounds'][0]
assert request('W24',code='relationship = "many_to_one"\n'+ex['solution'].replace('validate="many_to_one"','validate=relationship'))['passed']
# Syntax/runtime errors remain recoverable, and mutations never leak into a new run.
assert request('I02',code='df[')['error']
assert request('I02',code='df["missing"]')['error']
request('I02',code='df.drop(df.index, inplace=True)\npd = None\nnp = None\nplt = None',check=False)
assert request('I02')['passed']
assert request('W31')['passed']
print(json.dumps({'solutions':count,'intent_semantic_negative_and_recovery_checks':'passed','seconds':round(time.time()-start,1)}))
