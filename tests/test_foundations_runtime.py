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
# Category summaries have no implicit sort requirement, but labels must still
# match their values and explicitly ordered exercises remain strict.
assert request('I15', code='df["flavour"].value_counts(normalize=True).sort_index()')['passed']
assert request('I15', 1, code='df["size"].value_counts().sort_index(ascending=False)')['passed']
assert request('I19', 1, code='df.groupby("size")["price"].sum().sort_index(ascending=False)')['passed']
assert not request('I15', code='df["flavour"].value_counts(normalize=True).iloc[:1]')['passed']
assert not request('I15', code='s = df["flavour"].value_counts(normalize=True)\ns.iloc[0] += 1\ns')['passed']
assert not request('I12', 1, code='df.sort_values("tip", ascending=False)')['passed']
# Executable truth table taught in Follow: A is a whole row repeated three times.
example = namespace['pd'].DataFrame({'record': ['A', 'B', 'A', 'A'], 'value': [2, 9, 2, 2]})
assert example.duplicated(keep='first').tolist() == [False, False, True, True]
assert example.duplicated(keep='last').tolist() == [True, False, True, False]
assert example.duplicated(keep=False).tolist() == [True, False, True, True]
assert request('I17', 2)['passed']
assert not request('I17', 2, code='df[df.duplicated()]')['passed']

# Method intent and semantic equivalence are independent checks.
assert not request('I02',code='df.iloc[:2]')['passed']
assert not request('I02',code='# df.head(2)\ndf.iloc[:2]')['passed']
assert not request('I02',code='"df.head(2)"\ndf.iloc[:2]')['passed']
assert request('I02',code='table = df\nanswer = table.head(\n 2\n)\nanswer')['passed']
assert request('I02',code='take = df.head\nresult = take(2)')['passed']
assert request('I02',2,code='df.sample(n=3, random_state=1)')['passed']
assert request('I02',2,code='answer = df.sample(n=3, random_state=1)\nanswer')['passed']
assert not request('I08',code='df.loc[:1, ["candy", "flavour"]]')['passed']
assert not request('I09',code='df.iloc[1:4, [2]]')['passed']
assert request('I09',2,code='df.iloc[[5, 1], [3, 2]]')['passed']
assert request('I10',2,code='df[(df["age"] >= 2) & (df["age"] <= 5)]')['passed']
assert request('I01CSV',code='df')['error']
assert request('I01CSV')['passed']
assert request('I01CSV',1,code='df = pd.read_csv("cafe.csv", delimiter=";")\ndf')['passed']
assert not request('I01CSV',1,code='pd.read_csv("cafe.csv")')['passed']
assert request('I18S')['passed']
for i in [0,1]:
 ex=next(l for l in C['lessons'] if l['id']=='W30')['rounds'][i]
 wrong=ex['solution'].replace('(df["price"] * 1.1).round(2)', 'df["price"].apply(lambda x: round(x * 1.1, 2))') if i==0 else 'df["difference"] = df["price"].apply(lambda x: x - df["price"].mean())\ndf'
 assert not request('W30',i,code=wrong)['passed']
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
assert request('V16',2,code=ex['solution'].replace('ax.scatter(selected["minutes"], selected["rating"])','sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)'))['passed']
ex=next(l for l in C['lessons'] if l['id']=='W24')['rounds'][0]
assert request('W24',code='relationship = "many_to_one"\n'+ex['solution'].replace('validate="many_to_one"','validate=relationship'))['passed']
# Syntax/runtime errors remain recoverable, and mutations never leak into a new run.
assert request('I02',code='df[')['error']
assert request('I02',code='df["missing"]')['error']
request('I02',code='df.drop(df.index, inplace=True)\npd = None\nnp = None\nplt = None',check=False)
assert request('I02')['passed']
assert request('W31')['passed']
assert not request('W25',1,code='pd.concat([first, second], ignore_index=True)')['passed']
assert request('W25',1,code='pd.concat([first, second])')['passed']
assert not request('I22',1,code='df[["hours", "score"]].describe()')['passed']
assert not request('W31',2,code='clean = df.copy().drop_duplicates()\nclean')['passed']
# Progression checks exercise different decisions, not column-name substitutions.
assert request('I03',1,code='df.shape[0]')['passed']
assert not request('I03',1,code='df.shape[1]')['passed']
assert not request('I05',1,code='None')['passed']
assert request('I05',1,code='df.head(3).dtypes')['passed']
assert request('I01CSV',2,code='table = pd.read_csv("pets.csv")\ntable.iloc[:5]')['passed']
assert not request('I01CSV',2,code='pd.read_csv("pets.csv")')['passed']
assert not request('I01CSV',2,code='{"predicted_rows": 6, "table": pd.read_csv("pets.csv")}')['passed']
assert request('I03',2,code='pd.read_csv("pets.csv").shape')['passed']
assert not request('I03',2,code='pd.read_csv("pets.csv").head().shape')['passed']
assert request('I16',1,code='df.isna().sum() / len(df) * 100')['passed']
assert not request('I16',1,code='df.isna().sum()')['passed']
assert request('I16',2,code='df[df["price"].notna()]')['passed']
assert not request('I16',2,code='df.dropna()')['passed']
assert request('W16',2,code='clean=df.copy()\nclean["price"]=pd.to_numeric(clean["price"],errors="coerce")\nrows=clean[clean["price"].notna()]\n{"rows":rows,"excluded":len(df)-len(rows)}')['passed']
assert not request('W28',2,code='from sklearn.preprocessing import StandardScaler\nStandardScaler().fit_transform(df.iloc[4:][["age", "weight"]])')['passed']
for id in ['V16','V18','V08','V09','V29']:
 ex=next(l for l in C['lessons'] if l['id']==id)['rounds'][2]
 assert request(id,2)['passed']
 if id=='V16':
  alternate=ex['solution'].replace('ax.scatter(selected["minutes"], selected["rating"])','sns.scatterplot(data=selected.sort_values("rating"), x="minutes", y="rating", ax=ax)')
 elif id=='V18':
  alternate=ex['solution'].replace('ax.plot(selected["day"], selected["visits"], marker="o")','sns.lineplot(data=selected, x="day", y="visits", estimator=None, marker="o", ax=ax)')
 else:
  series='counts' if id=='V08' else 'means'
  alternate=ex['solution'].replace(f'ax.bar({series}.index, {series}.values)',f'sns.barplot(x={series}.index, y={series}.values, errorbar=None, ax=ax)')
 assert alternate!=ex['solution']
 assert request(id,2,code=alternate)['passed'],id
ex=next(l for l in C['lessons'] if l['id']=='V37')['rounds'][1]
assert not request('V37',1,code=ex['solution'].replace('["temperature"].mean()','["temperature"].sum()'))['passed']
ex=next(l for l in C['lessons'] if l['id']=='V08')['rounds'][1]
assert not request('V08',1,code=ex['solution'].replace(', "Snow"',''))['passed']
ex=next(l for l in C['lessons'] if l['id']=='V36')['rounds'][1]
assert not request('V36',1,code=ex['solution'].replace('bottom=0','bottom=3'))['passed']
print(json.dumps({'solutions':count,'intent_semantic_negative_and_recovery_checks':'passed','seconds':round(time.time()-start,1)}))
