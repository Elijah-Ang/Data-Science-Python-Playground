"""All challenge references, alternative workflows and independent feedback."""
import json,subprocess,os,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
registry=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./challenges/registry.js")))'],cwd=ROOT))
ns={}
exec('\n'.join((ROOT/f).read_text() for f in ['table-serialization.py','foundations/runtime.py','challenges/runtime.py']),ns)
challenges={c['id']:c for c in registry['challenges']}
def run(id,code=None,check=True):
 c=challenges[id]
 return ns['run_challenge'](dict(challenge=c,code=code if code is not None else c['reference'],check=check))
def states(result):return {d['id']:d['status'] for d in result['deliverables']}
with tempfile.TemporaryDirectory() as temp:
 before=os.getcwd()
 try:
  os.chdir(temp)
  for id in challenges:
   result=run(id);assert result['passed'],(id,result['error'],result['deliverables'])
  r=run('IC08',challenges['IC08']['reference']+'\nmeans = means * 2')
  assert states(r)['eligible']=='correct' and states(r)['counts']=='correct' and states(r)['means']=='needs-attention'
  r=run('IC08',challenges['IC08']['reference']+'\ndel means')
  assert states(r)['means']=='unavailable' and states(r)['counts']=='correct'
  r=run('IC08',challenges['IC08']['reference'].replace("means = eligible.groupby('group')['score'].mean()","raise ValueError('test interruption')"))
  assert r['error'] and states(r)['eligible']=='correct' and states(r)['means']=='unavailable'
  r=run('IC08',challenges['IC08']['reference']+'\nmeans = "not numeric"')
  assert states(r)['means']=='needs-attention'
  r=run('IC09',challenges['IC09']['reference']+'\ncross_tab.index = [str(i) for i in range(len(cross_tab))]')
  assert states(r)['cross_tab']=='needs-attention'
  r=run('VC03',challenges['VC03']['reference'].replace('fig.tight_layout()', 'ax.set_xlim(100,101)\nfig.tight_layout()'))
  assert states(r)['fig']=='needs-attention'
  r=run('WC06',challenges['WC06']['reference'].replace('clean.discount.fillna(0)','clean.discount.fillna(9)'))
  assert states(r)['clean']=='needs-attention'
  r=run('WC07',challenges['WC07']['reference'].replace('joined = df.merge','lookup = pd.concat([lookup, lookup.iloc[:1]], ignore_index=True)\njoined = df.merge').replace(", validate='many_to_one'",''))
  assert not r['passed'] and states(r)['matched']=='needs-attention'
  r=run('IC02',challenges['IC02']['reference']+'\ndf.iloc[0, 3] = 1000')
  assert states(r)['extract']=='correct' and states(r)['source-inputs']=='needs-attention'
  r=run('WC03',challenges['WC03']['reference']+'\nclean.index = range(20, 20+len(clean))')
  assert states(r)['clean']=='needs-attention'
  r=run('VC05',challenges['VC05']['reference'].replace('.minutes.mean()', '.minutes.sum()'))
  assert states(r)['means']=='needs-attention' and states(r)['fig']=='needs-attention'
  r=run('VC01',challenges['VC01']['reference'].replace('fig.tight_layout()', 'ax.set_ylim(1, 10)\nfig.tight_layout()'))
  assert states(r)['counts']=='correct' and states(r)['fig']=='needs-attention'
  r=run('VC03',challenges['VC03']['reference'].replace('ax.scatter(pairs.hours, pairs.score)','ax.scatter(pairs.hours.iloc[:3],pairs.score.iloc[:3])'))
  assert states(r)['pairs']=='correct' and states(r)['fig']=='needs-attention'
  r=run('VC10',challenges['VC10']['reference'].replace("fig.savefig('challenge.png', dpi=150, bbox_inches='tight')","fig.savefig('challenge.png',dpi=72,bbox_inches='tight')"))
  assert states(r)['export']=='needs-attention' and states(r)['fig']=='correct'
  r=run('VC10',challenges['VC10']['reference'].replace("fig.savefig('challenge.png', dpi=150, bbox_inches='tight')",'# No export yet'))
  assert states(r)['export']=='unavailable' and states(r)['fig']=='correct'
  r=run('IC01','preview = df.head()');assert 'NameError' in r['error']
  alternatives={
   'IC03':"missing = df[['hours','score']].isna().sum()\neligible = df.loc[~df[['hours','score']].isna().any(axis=1)].copy()\nexcluded_count = len(df)-len(eligible)",
   'IC09':"available = df[df.in_stock]\ncross_tab = pd.crosstab(available.category, available.region)\ncategories = available.category.nunique()",
   'WC04':"clean = df.loc[~df.duplicated('order_id')].copy()\nremoved_count = len(df)-len(clean)",
  }
  for id,code in alternatives.items():assert run(id,challenges[id]['setup']+'\n'+code)['passed'],id
  # Labelled summaries and cross-tabs have the same meaning in a different display order.
  assert run('IC08',challenges['IC08']['reference']+'\ncounts = counts.iloc[::-1]\nmeans = means.iloc[::-1]')['passed']
  assert run('IC09',challenges['IC09']['reference']+'\ncross_tab = cross_tab.iloc[::-1, ::-1]')['passed']
  assert run('WC01',challenges['WC01']['reference']+'\nlabels = labels[::-1]')['passed']
  assert run('IC07',challenges['IC07']['reference']+'\nsummary = summary.iloc[::-1, ::-1]\nknown = known.iloc[::-1]')['passed']
  assert run('WC08',challenges['WC08']['reference']+'\ncombined = combined.iloc[::-1]')['passed']
  assert run('WC09',challenges['WC09']['reference']+'\nlong = long.iloc[::-1]\nduration_records = duration_records.iloc[::-1]')['passed']
  assert run('WC10',challenges['WC10']['reference']+'\nclean = clean.iloc[::-1]')['passed']
  assert states(run('IC08',challenges['IC08']['reference']+'\nmeans = means.iloc[::-1].set_axis(means.index)'))['means']=='needs-attention'
  assert states(run('IC09',challenges['IC09']['reference']+'\ncross_tab.columns = ["incorrect"] * len(cross_tab.columns)'))['cross_tab']=='needs-attention'
  assert states(run('WC09',challenges['WC09']['reference']+'\nlong.loc[long.index[0], "measure"] = "minutes"'))['long']=='needs-attention'
  assert run('VC01',challenges['VC01']['reference'].replace('counts = work.drink.value_counts()', 'counts = work.drink.value_counts().iloc[::-1]'))['passed']
  assert run('VC06',challenges['VC06']['reference'].replace("x='group', y='score', jitter=False", "x='group', y='score', order=['B', 'A'], jitter=False"))['passed']
  assert run('VC07',challenges['VC07']['reference'].replace("    y='minutes',\n", "    y='minutes',\n    order=sorted(observations.depot.unique(), reverse=True),\n"))['passed']
  for id in ('VC01','VC05','VC10'):
   c=challenges[id];code=c['reference'].replace('ax.bar(', 'ax.barh(')
   x,y=c['chart']['xLabel'],c['chart']['yLabel']
   code=code.replace("xlabel='"+x+"', ylabel='"+y+"'","xlabel='"+y+"', ylabel='"+x+"'").replace("xlabel='"+x+"',ylabel='"+y+"'","xlabel='"+y+"',ylabel='"+x+"'")
   assert run(id,code)['passed'],id
  assert run('VC02',challenges['VC02']['reference'].replace('bins=5','bins=3'))['passed']
  assert run('VC06',challenges['VC06']['reference'].replace('jitter=False','jitter=.15'))['passed']
  assert run('VC03',challenges['VC03']['reference'].replace('ax.scatter(pairs.hours, pairs.score)',"sns.scatterplot(data=pairs,x='hours',y='score',ax=ax)"))['passed']
  assert run('VC07',challenges['VC07']['reference'].replace("sns.boxplot(\n    data=observations,\n    x='depot',\n    y='minutes',\n    ax=ax,\n)","labels = sorted(observations.depot.unique())\nax.boxplot([observations.loc[observations.depot == label, 'minutes'] for label in labels], labels=labels)"))['passed']
  assert run('IC08')['passed']
 finally:os.chdir(before)
print('30 reference workflows, alternatives, independent failures, source preservation, charts, CSV isolation and export checks passed.')
