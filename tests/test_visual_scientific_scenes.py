"""Independent NumPy/SciPy/pandas oracles for all quantitative Data scenes."""
import json
import subprocess
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import gaussian_kde
from sklearn.linear_model import LinearRegression
ROOT=Path(__file__).resolve().parents[1]
script="""const v=require('./foundations/visuals.js');const result={};for(const id of v.scienceIds)result[id]=v.scientificPlot(id).data;result.density2=v.scientificPlot('density',{bandwidth:2}).data;console.log(JSON.stringify({rows:v.exampleRows,scenes:result}));"""
r=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT))
df=pd.DataFrame(r['rows']);scenes=r['scenes'];values=df.value.to_numpy()
for key in ['density','density2']:
    d=scenes[key];reference=gaussian_kde(values,bw_method=lambda kde:kde.scotts_factor()*d['bwAdjust'])
    curve=np.array(d['curve']);np.testing.assert_allclose(curve[:,1],reference(curve[:,0]),rtol=1e-12)
    np.testing.assert_allclose(d['bandwidth'],np.sqrt(reference.covariance[0,0]))
for key,complement in [('ecdf',False),('ecdf-complement',True)]:
    for step in scenes[key]['steps']:
        np.testing.assert_allclose(step['share'],np.mean(values>step['x']) if complement else np.mean(values<=step['x']))
d=scenes['rug'];np.testing.assert_array_equal(d['counts'],np.histogram(values,d['edges'])[0])
for key in ['point-interval','median-points','violin']:
    for group in scenes[key]['groups']:
        vals=df.loc[df.group==group['group'],'value'];np.testing.assert_allclose([group['mean'],group['median'],group['sd']],[vals.mean(),vals.median(),vals.std(ddof=1)])
d=scenes['boxplot'];q1,median,q3=np.quantile(values,[.25,.5,.75]);fences=[q1-1.5*(q3-q1),q3+1.5*(q3-q1)]
np.testing.assert_allclose([d['q1'],d['median'],d['q3']],[q1,median,q3]);np.testing.assert_allclose(d['fences'],fences)
np.testing.assert_allclose(d['whiskers'],[values[values>=fences[0]].min(),values[values<=fences[1]].max()])
for key in ['line','line-band']:
    d=scenes[key];frame=pd.DataFrame(d['rows'],columns=['x','y']);summary=frame.groupby('x').y.agg(['mean','std']).fillna(0)
    np.testing.assert_allclose([[g['mean'],g['sd']] for g in d['groups']],summary)
for key in ['regression','residual']:
    d=scenes[key];rows=np.array(d['rows']);model=LinearRegression().fit(rows[:,:1],rows[:,1]);np.testing.assert_allclose([d['fit']['slope'],d['fit']['intercept']],[model.coef_[0],model.intercept_],atol=1e-12);np.testing.assert_allclose(np.array(d['residuals'])[:,1],rows[:,1]-model.predict(rows[:,:1]),atol=1e-12)
for key in ['correlation','correlation-heatmap']:
    d=scenes[key];np.testing.assert_allclose(d['values'],np.corrcoef(np.array(d['rows']).T),atol=1e-12)
for key in ['stacked','stacked-share','stacked-compare']:
    d=scenes[key];np.testing.assert_allclose(d['totals'],np.array(d['first'])+d['second'])
    if d['share']:np.testing.assert_allclose((np.array(d['first'])+d['second'])/d['totals']*100,100)
for key in ['facet-box','facet-hist']:
    for group in scenes[key]['groups']:np.testing.assert_allclose(group['values'],df.loc[df.group==group['group'],'value'])
for key in ['crosstab','count-heatmap','proportion-heatmap','mean-heatmap','rate-heatmap']:
    d=scenes[key];rows=[(group,column,value) for group,column,values in d['inputs'] for value in values];frame=pd.DataFrame(rows,columns=['group','column','value'])
    if key=='mean-heatmap':expected=frame.pivot_table(index='group',columns='column',values='value',aggfunc='mean')
    elif key=='rate-heatmap':expected=frame.assign(value=frame['value'].eq(0)).pivot_table(index='group',columns='column',values='value',aggfunc='mean')
    else:expected=pd.crosstab(frame['group'],frame['column'],normalize='index' if key=='proportion-heatmap' else False)
    np.testing.assert_allclose(d['values'],expected.reindex(index=d['names'],columns=d['columns'],fill_value=0))
assert scenes['pair-grid']['rows']==[[1,2],[2,4],[3,3],[4,6],[5,5]]
print(json.dumps({'scenes':len(scenes),'oracles':['SciPy Gaussian KDE','NumPy histogram/quantiles/correlation','pandas sample SD/aggregation','sklearn least squares'],'passed':True},indent=2))
