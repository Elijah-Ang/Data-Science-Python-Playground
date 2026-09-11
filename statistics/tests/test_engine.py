"""Numerical oracles, structural rejection cases and executable notebook contracts.
Run: python3 -m unittest discover -s statistics/tests -p 'test_engine.py' -v
"""
import importlib.util
import itertools
import json
from pathlib import Path
import unittest
import numpy as np
import pandas as pd
from numpy.testing import assert_allclose
from scipy import stats

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parent
spec = importlib.util.spec_from_file_location('statistics_engine', HERE/'engine.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
PENGUINS = pd.read_csv(ROOT/'data/palmer-penguins.csv')
CANDY = pd.read_csv(ROOT/'data/candy-power-ranking.csv')
GAP = pd.read_csv(ROOT/'data/gapminder.csv')
CASES = {
    'one_t': {'family':'reference'},
    'one_z': {'family':'reference','known_sigma':True,'sigma':800},
    'bootstrap': {'family':'reference','goal':'estimate'},
    'welch': {'family':'independent'},
    'student': {'family':'independent','equal_variance':True},
    'paired_t': {'family':'paired','dataset':'gapminder'},
    'mannwhitney': {'family':'independent','goal':'rank'},
    'wilcoxon': {'family':'paired','dataset':'gapminder','goal':'rank'},
    'anova': {'family':'groups','equal_variance':True},
    'welch_anova': {'family':'groups'},
    'kruskal': {'family':'groups','goal':'rank'},
    'factorial2': {'family':'factorial','factors':['species','sex']},
    'factorial3': {'family':'factorial','factors':['species','sex','year']},
    'chi2': {'family':'categorical','x':'species','y':'sex'},
    'fisher': {'family':'categorical','dataset':'candy','x':'chocolate','y':'fruity'},
    'pearson': {'family':'association'},
    'spearman': {'family':'association','goal':'rank'},
}

def source(c):
    return {'penguins':PENGUINS,'gapminder':GAP,'candy':CANDY}[c.get('dataset','penguins')]


def evaluate(c, raw=None):
    raw = source(c) if raw is None else raw
    plan=engine.build(raw,c)
    return plan,engine.execute(raw,plan,False)


def holm(values):
    order=np.argsort(values)
    result=np.empty(len(values))
    running=0
    for k,i in enumerate(order):
        running=max(running,(len(values)-k)*values[i])
        result[i]=min(1,running)
    return result


class NumericalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.results={name:evaluate(c) for name,c in CASES.items() if name!='fisher'}
        # Explicit sparse independent counts; it is a fixture, not teaching data.
        cls.sparse=pd.DataFrame([{'chocolate':i,'fruity':j} for i,j,n in [(0,0,1),(0,1,9),(1,0,11),(1,1,1)] for _ in range(n)])
        cls.results['fisher']=evaluate(CASES['fisher'],cls.sparse)

    def test_all_route_recipes_run_and_serialize_without_nan(self):
        for name,(plan,result) in self.results.items():
            with self.subTest(name=name):
                self.assertEqual(plan['method'],'factorial' if name.startswith('factorial') else name)
                self.assertEqual(len(plan['steps']),len(result['outputs']))
                json.dumps(result,allow_nan=False)
                self.assertTrue(all(s['explanation'] and s['code'] for s in plan['steps']))
                self.assertNotIn('Traceback',''.join(result['outputs']))

    def test_rendered_evidence_for_every_route(self):
        import base64
        for name,(plan,_) in self.results.items():
            with self.subTest(name=name):
                raw=self.sparse if name=='fisher' else source(plan['config'])
                result=engine.execute(raw,plan,True)
                self.assertGreaterEqual(len(result['figures']),1)
                for figure in result['figures']:
                    blob=base64.b64decode(figure['src'].split(',')[1])
                    self.assertTrue(blob.startswith(bytes([137,80,78,71])))
                    self.assertGreater(len(blob),5000)
                    self.assertTrue(figure['caption'])

    def test_one_sample_t_formula_and_difference_interval(self):
        a=PENGUINS.body_mass_g.dropna().to_numpy()
        estimate=a.mean()-4000; se=a.std(ddof=1)/np.sqrt(len(a)); t=estimate/se
        r=self.results['one_t'][1]
        assert_allclose([r['statistic'],r['p'],r['estimate']],[t,2*stats.t.sf(abs(t),len(a)-1),estimate],rtol=1e-12)
        assert_allclose(r['interval'],estimate+np.array([-1,1])*stats.t.ppf(.975,len(a)-1)*se)
        assert_allclose(r['effect'],estimate/a.std(ddof=1))

    def test_known_sd_z_formula(self):
        a=PENGUINS.body_mass_g.dropna().to_numpy(); se=800/np.sqrt(len(a)); d=a.mean()-4000
        r=self.results['one_z'][1]
        assert_allclose(r['statistic'],d/se)
        assert_allclose(r['p'],2*stats.norm.sf(abs(d/se)))
        assert_allclose(r['interval'],d+np.array([-1,1])*stats.norm.ppf(.975)*se)

    def test_welch_and_student_against_explicit_standard_errors(self):
        a=PENGUINS.loc[PENGUINS.species=='Adelie','body_mass_g'].dropna().to_numpy()
        b=PENGUINS.loc[PENGUINS.species=='Chinstrap','body_mass_g'].dropna().to_numpy()
        va,vb=a.var(ddof=1),b.var(ddof=1); na,nb=len(a),len(b); diff=a.mean()-b.mean()
        pooled=((na-1)*va+(nb-1)*vb)/(na+nb-2)
        for name in ['welch','student']:
            se=np.sqrt(va/na+vb/nb) if name=='welch' else np.sqrt(pooled*(1/na+1/nb))
            df=(va/na+vb/nb)**2/((va/na)**2/(na-1)+(vb/nb)**2/(nb-1)) if name=='welch' else na+nb-2
            r=self.results[name][1]
            assert_allclose(r['p'],2*stats.t.sf(abs(diff/se),df))
            assert_allclose(r['interval'],diff+np.array([-1,1])*stats.t.ppf(.975,df)*se)
            assert_allclose(r['effect'],diff/np.sqrt(pooled))

    def test_pairing_by_identity_not_order_and_difference_direction(self):
        _,r=evaluate(CASES['paired_t'],GAP.sample(frac=1,random_state=71))
        b=GAP[GAP.year==1952].set_index('country').lifeExp
        a=GAP[GAP.year==2007].set_index('country').lifeExp
        d=(a-b).dropna(); se=d.std()/np.sqrt(len(d))
        assert_allclose(r['statistic'],d.mean()/se)
        assert_allclose(r['interval'],d.mean()+np.array([-1,1])*stats.t.ppf(.975,len(d)-1)*se)
        assert_allclose(r['effect'],d.mean()/d.std())
        self.assertGreater(r['estimate'],0)

    def test_mannwhitney_pairwise_probability_and_ties(self):
        a=PENGUINS.loc[PENGUINS.species=='Adelie','body_mass_g'].dropna().to_numpy()
        b=PENGUINS.loc[PENGUINS.species=='Chinstrap','body_mass_g'].dropna().to_numpy()
        u=np.sum(a[:,None]>b)+.5*np.sum(a[:,None]==b)
        r=self.results['mannwhitney'][1]
        assert_allclose(r['statistic'],u)
        assert_allclose(r['effect'],2*u/(len(a)*len(b))-1)
        self.assertLessEqual(r['interval'][0],r['effect']);self.assertGreaterEqual(r['interval'][1],r['effect'])

    def test_signed_rank_effect_independent_rank_sum(self):
        wide=GAP.pivot(index='country',columns='year',values='lifeExp')
        d=(wide[2007]-wide[1952]).dropna().to_numpy();d=d[d!=0]
        ranks=stats.rankdata(abs(d)); positive=sum(ranks[d>0]);negative=sum(ranks[d<0])
        r=self.results['wilcoxon'][1]
        assert_allclose(r['statistic'],min(positive,negative))
        assert_allclose(r['effect'],(positive-negative)/(positive+negative))

    def test_classical_anova_sums_of_squares_and_tukey_family(self):
        groups=[g.body_mass_g.dropna().to_numpy() for _,g in PENGUINS.groupby('species')]
        all_values=np.concatenate(groups); n=len(all_values); k=len(groups)
        ssb=sum(len(g)*(g.mean()-all_values.mean())**2 for g in groups)
        ssw=sum(sum((g-g.mean())**2) for g in groups)
        f=(ssb/(k-1))/(ssw/(n-k))
        r=self.results['anova'][1]
        assert_allclose(r['statistic'],f)
        assert_allclose(r['p'],stats.f.sf(f,k-1,n-k))
        assert_allclose(r['effect'],ssb/(ssb+ssw))
        for row,(i,j) in zip(r['tables']['comparisons'],itertools.combinations(range(k),2)):
            se=np.sqrt((ssw/(n-k))*(1/len(groups[i])+1/len(groups[j])))/np.sqrt(2)
            diff=groups[i].mean()-groups[j].mean()
            q=abs(diff)/se
            assert_allclose(row['adjusted p'],stats.studentized_range.sf(q,k,n-k),atol=1e-12)
            width=stats.studentized_range.ppf(.95,k,n-k)*se
            assert_allclose([row['CI low'],row['CI high']],[diff-width,diff+width])

    def test_welch_anova_formula_and_holm_pairs(self):
        g=[x.body_mass_g.dropna().to_numpy() for _,x in PENGUINS.groupby('species')]
        n=np.array([len(x) for x in g]);means=np.array([x.mean() for x in g]);var=np.array([x.var(ddof=1) for x in g]);k=len(g)
        w=n/var; mu=sum(w*means)/sum(w); correction=sum((1-w/sum(w))**2/(n-1))
        f=(sum(w*(means-mu)**2)/(k-1))/(1+2*(k-2)*correction/(k*k-1))
        r=self.results['welch_anova'][1]
        assert_allclose(r['statistic'],f)
        assert_allclose(r['p'],stats.f.sf(f,k-1,(k*k-1)/(3*correction)))
        tests=[stats.ttest_ind(g[i],g[j],equal_var=False) for i,j in itertools.combinations(range(k),2)]
        assert_allclose([x['adjusted p'] for x in r['tables']['comparisons']],holm([t.pvalue for t in tests]))
        for row,t in zip(r['tables']['comparisons'],tests):
            assert_allclose([row['CI low'],row['CI high']],t.confidence_interval(1-.05/len(tests)))

    def test_kruskal_rank_formula_tie_correction_and_posthoc(self):
        g=[x.body_mass_g.dropna().to_numpy() for _,x in PENGUINS.groupby('species')]
        values=np.concatenate(g);ranks=stats.rankdata(values);n=len(values);at=0;acc=0
        for a in g:
            acc+=ranks[at:at+len(a)].sum()**2/len(a);at+=len(a)
        _,counts=np.unique(values,return_counts=True)
        correction=1-sum(counts**3-counts)/(n**3-n)
        h=(12/(n*(n+1))*acc-3*(n+1))/correction
        r=self.results['kruskal'][1]
        assert_allclose(r['statistic'],h)
        assert_allclose(r['effect'],max(0,(h-len(g)+1)/(n-len(g))))
        p=[stats.mannwhitneyu(g[i],g[j]).pvalue for i,j in itertools.combinations(range(len(g)),2)]
        assert_allclose([x['adjusted p'] for x in r['tables']['comparisons']],holm(p))

    def test_factorial_against_independent_sum_coded_linear_algebra(self):
        for key in ['factorial2','factorial3']:
            plan,r=self.results[key];factors=plan['config']['factors']
            data=PENGUINS[[*factors,'body_mass_g']].dropna();blocks=[]
            for f in factors:
                levels=sorted(data[f].unique())
                blocks.append(np.column_stack([(data[f]==level).astype(float)-(data[f]==levels[-1]).astype(float) for level in levels[:-1]]))
            columns=[np.ones(len(data))];indices={}
            for degree in range(1,len(factors)+1):
                for subset in itertools.combinations(range(len(factors)),degree):
                    name=':'.join('C('+factors[i]+', Sum)' for i in subset)
                    start=len(columns)
                    for combination in itertools.product(*[range(blocks[i].shape[1]) for i in subset]):
                        columns.append(np.prod([blocks[i][:,j] for i,j in zip(subset,combination)],axis=0))
                    indices[name]=list(range(start,len(columns)))
            x=np.column_stack(columns); y=data.body_mass_g.to_numpy();beta=np.linalg.lstsq(x,y,rcond=None)[0]
            sse=np.sum((y-x@beta)**2);df=len(y)-x.shape[1];cov=np.linalg.inv(x.T@x)
            for row in r['tables']['anova_table']:
                name=row['index']
                if name=='Residual':continue
                ix=indices[name]; q=len(ix); ss=beta[ix]@np.linalg.solve(cov[np.ix_(ix,ix)],beta[ix]);f=(ss/q)/(sse/df)
                assert_allclose([row['sum_sq'],row['F'],row['PR(>F)']],[ss,f,stats.f.sf(f,q,df)],rtol=2e-8,atol=1e-10)
            # Model-based simple effects: complete cells make observed cell means the fitted means.
            cells=r['tables']['cell_means'];comps=r['tables']['comparisons'];raw_p=[]
            for row in comps:
                a,b=cells[row['cell A']],cells[row['cell B']]
                diff=a['mean']-b['mean'];se=np.sqrt((sse/df)*(1/a['count']+1/b['count']))
                raw_p.append(2*stats.t.sf(abs(diff/se),df))
                assert_allclose(row['difference'],diff,atol=1e-8)
                margin=stats.t.ppf(1-.05/(2*len(comps)),df)*se
                assert_allclose([row['CI low'],row['CI high']],[diff-margin,diff+margin],atol=1e-8)
            assert_allclose([row['adjusted p'] for row in comps],holm(raw_p),atol=1e-10)

    def test_chi_square_expected_counts_and_cramer_v(self):
        tab=pd.crosstab(PENGUINS.species,PENGUINS.sex).to_numpy();n=tab.sum();expected=tab.sum(1)[:,None]*tab.sum(0)[None,:]/n
        chi=sum(((tab-expected)**2/expected).ravel());r=self.results['chi2'][1]
        assert_allclose([r['statistic'],r['p'],r['effect']],[chi,stats.chi2.sf(chi,2),np.sqrt(chi/n)])
        self.assertEqual(len(r['tables']['row_proportion_intervals']),6)

    def test_fisher_matches_hypergeometric_enumeration(self):
        r=self.results['fisher'][1];observed=stats.hypergeom.pmf(1,22,12,10)
        probs=stats.hypergeom.pmf(np.arange(11),22,12,10)
        assert_allclose(r['p'],probs[probs<=observed*(1+1e-12)].sum())
        assert_allclose(r['statistic'],1/(9*11))
        self.assertGreater(r['interval'][0],0);self.assertLess(r['interval'][1],1)

    def test_pearson_formula_and_fisher_transform(self):
        d=PENGUINS[['flipper_length_mm','body_mass_g']].dropna();a=d.iloc[:,0].to_numpy();b=d.iloc[:,1].to_numpy()
        r=np.sum((a-a.mean())*(b-b.mean()))/np.sqrt(np.sum((a-a.mean())**2)*np.sum((b-b.mean())**2))
        out=self.results['pearson'][1]
        assert_allclose(out['effect'],r)
        ci=np.tanh(np.arctanh(r)+np.array([-1,1])*stats.norm.ppf(.975)/np.sqrt(len(a)-3))
        assert_allclose(out['interval'],ci)

    def test_spearman_is_pearson_of_average_ranks_and_permutation_is_valid(self):
        d=PENGUINS[['flipper_length_mm','body_mass_g']].dropna();r=self.results['spearman'][1]
        assert_allclose(r['effect'],np.corrcoef(stats.rankdata(d.iloc[:,0]),stats.rankdata(d.iloc[:,1]))[0,1])
        self.assertGreaterEqual(r['p'],2/10000)
        self.assertLessEqual(r['p'],1)

    def test_bootstrap_reproducibility_and_direct_resampling_oracle(self):
        a=PENGUINS.body_mass_g.dropna().to_numpy();rng=np.random.RandomState(42)
        values=np.mean(a[rng.randint(0,len(a),size=(1999,len(a)))],axis=1)
        r=self.results['bootstrap'][1]
        self.assertIsNone(r['p'])
        assert_allclose(r['interval'],np.percentile(values,[2.5,97.5]))

    def test_reversing_groups_reverses_effect_and_interval_not_p(self):
        _,r=evaluate({'family':'independent','levels':['Chinstrap','Adelie']})
        original=self.results['welch'][1]
        assert_allclose(r['p'],original['p'])
        assert_allclose(r['effect'],-original['effect'])
        assert_allclose(r['interval'],[-original['interval'][1],-original['interval'][0]])

    def test_no_posthoc_when_omnibus_is_inconclusive(self):
        rows=[{'species':label,'body_mass_g':v} for label in ['A','B','C'] for v in [1,2,3,4,5,6]]
        for c in [{'family':'groups'},{'family':'groups','equal_variance':True},{'family':'groups','goal':'rank'}]:
            _,r=evaluate(c,pd.DataFrame(rows))
            self.assertGreater(r['p'],.05)
            self.assertNotIn('comparisons',r['tables'])
            self.assertIn('does not establish equality',r['conclusion'])

    def test_confidence_changes_width_not_estimate_or_p(self):
        _,r=evaluate({'family':'independent','confidence':.99})
        original=self.results['welch'][1]
        assert_allclose([r['p'],r['estimate']],[original['p'],original['estimate']])
        self.assertLess(r['interval'][0],original['interval'][0])
        self.assertGreater(r['interval'][1],original['interval'][1])


class StructuralTests(unittest.TestCase):
    def test_degenerate_and_invalid_inputs_rejected(self):
        cases=[
            (PENGUINS,{'family':'independent','levels':['Adelie','Adelie']}),
            (PENGUINS,{'family':'association','x':'body_mass_g','y':'body_mass_g'}),
            (PENGUINS,{'family':'reference','sigma':800}),
            (PENGUINS,{'family':'reference','sigma':-1,'known_sigma':True}),
            (PENGUINS,{'family':'reference','reference':float('nan')}),
            (PENGUINS,{'family':'factorial','factors':['species','island']}),
            (PENGUINS,{'family':'factorial','factors':['species','species']}),
            (PENGUINS,{'family':'groups','group':'sex'}),
            (GAP,{'family':'paired','dataset':'gapminder','before':2007,'after':2007}),
            (GAP,{'family':'groups','dataset':'gapminder'}),
            (pd.concat([GAP,GAP.iloc[:1]]),{'family':'paired','dataset':'gapminder'}),
            (PENGUINS.assign(body_mass_g=1),{'family':'reference'}),
            (PENGUINS.assign(body_mass_g=np.inf),{'family':'reference'}),
            (PENGUINS.iloc[:3],{'family':'reference'}),
        ]
        for raw,c in cases:
            with self.subTest(config=c):
                with self.assertRaises(ValueError):engine.build(raw,c)

    def test_sparse_larger_contingency_is_not_silently_chi_square(self):
        d=pd.DataFrame({'species':['a','a','b','b','c','c'],'sex':['f','m']*3})
        with self.assertRaisesRegex(ValueError,'exact/Monte Carlo'):engine.build(d,{'family':'categorical','x':'species','y':'sex'})

    def test_zero_residual_factorial_is_rejected(self):
        data=PENGUINS.copy()
        data['body_mass_g']=data.groupby(['species','sex'])['body_mass_g'].transform('mean')
        with self.assertRaisesRegex(ValueError,'residual variation'):engine.build(data,CASES['factorial2'])

    def test_one_missing_pair_is_removed_as_a_unit(self):
        data=GAP.copy()
        data.loc[(data.country=='Afghanistan') & (data.year==1952),'lifeExp']=np.nan
        plan=engine.build(data,CASES['paired_t'])
        self.assertEqual(plan['config']['n'],141)
        self.assertEqual(plan['config']['omitted'],1)

    def test_wilcoxon_zero_and_tied_differences(self):
        differences=[0,0,-2,-2,-1,1,2,2,3,4]
        rows=[]
        for i,difference in enumerate(differences):
            rows.extend([{'country':str(i),'year':1952,'lifeExp':50+i},
                         {'country':str(i),'year':2007,'lifeExp':50+i+difference}])
        _,result=evaluate(CASES['wilcoxon'],pd.DataFrame(rows))
        d=np.array(differences);d=d[d!=0];ranks=stats.rankdata(abs(d))
        assert_allclose(result['effect'],np.dot(np.sign(d),ranks)/ranks.sum())
        self.assertTrue(np.isfinite(result['p']))

    def test_under_replicated_factorial_cells_rejected(self):
        d=PENGUINS.groupby(['species','sex','year']).head(3)
        with self.assertRaisesRegex(ValueError,'at least four'):engine.build(d,CASES['factorial3'])

    def test_missingness_only_uses_selected_variables(self):
        c={'family':'independent'};p=engine.build(PENGUINS,c)
        raw=PENGUINS.copy();raw['bill_length_mm']=np.nan
        self.assertEqual(p['config']['n'],engine.build(raw,c)['config']['n'])
        self.assertEqual(p['config']['omitted'],0)
        self.assertEqual(p['config']['excluded'],119)
        self.assertEqual(p['config']['n']+p['config']['omitted']+p['config']['excluded'],len(PENGUINS))
        raw.loc[0, 'body_mass_g'] = np.nan
        missing = engine.build(raw,c)['config']
        self.assertEqual(missing['omitted'],1)
        self.assertEqual(missing['n'],p['config']['n']-1)

    def test_no_mutation_of_source_and_no_namespace_leak(self):
        raw=PENGUINS.copy(deep=True);p,r=evaluate(CASES['welch'],raw)
        pd.testing.assert_frame_equal(raw,PENGUINS)
        r2=engine.execute(raw,p,False)
        assert_allclose(r['p'],r2['p'])

    def test_production_manifest_has_no_prototype_references(self):
        for file in ['index.html','playground.html','ml.html','service-worker.js','scripts/build-web.mjs']:
            self.assertNotIn('prototypes/statistics',(ROOT/file).read_text())

    def test_code_contract_contains_no_rendering_or_hidden_analysis_calls(self):
        for name,c in CASES.items():
            if name=='fisher':continue
            plan=engine.build(source(c),c)
            for s in plan['steps']:
                compile(s['code'],'notebook','exec')
                self.assertLessEqual(len(s['code'].splitlines()),32)
                for forbidden in ['base64','pyodide','engine.','exec(','eval(','__','json.dumps','model.summary()']:
                    self.assertNotIn(forbidden,s['code'])

    def test_nonfinite_serialization_distinguishes_unbounded_from_undefined(self):
        self.assertEqual(engine.clean([np.inf,-np.inf,np.nan]),['∞','−∞',None])


if __name__=='__main__':unittest.main()
