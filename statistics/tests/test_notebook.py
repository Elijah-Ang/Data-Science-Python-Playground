"""Additive session/proportion tests. All original engine tests stay unchanged."""
import hashlib
import inspect
from pathlib import Path
import unittest
import numpy as np
import pandas as pd
from scipy import stats
from numpy.testing import assert_allclose
from test_engine import CASES, source, engine, ROOT, PENGUINS, CANDY

HERE=Path(__file__).resolve().parents[1]
ns={}
for filename in ('engine.py','proportions.py','notebook.py'):exec(compile((HERE/filename).read_text(),filename,'exec'),ns)
Session=ns['NotebookSession']


def complete(session,start=0):
    outputs=[]
    for i,s in enumerate(session.plan['route'][start:],start):outputs.append(session.run(i,s['code'],s.get('advanced','')))
    return outputs


class SessionTests(unittest.TestCase):
    def test_original_recipes_unchanged_byte_for_byte(self):
        self.assertEqual(hashlib.sha256(inspect.getsource(engine.recipe).encode()).hexdigest(),(HERE/'tests/recipes-baseline.sha256').read_text().strip())

    def test_every_original_route_matches_original_engine(self):
        for name,config in CASES.items():
            with self.subTest(name=name):
                raw=source(config);s=Session(raw,config);outputs=complete(s)
                expected=engine.execute(raw,engine.build(raw,config),False)
                scalars=outputs[-1]['scalars']
                for key,target in [('p_value','p'),('statistic','statistic'),('estimate','estimate'),('effect_size','effect'),('interval','interval')]:
                    if expected[target] is not None:assert_allclose(scalars[key],expected[target],rtol=1e-10,atol=1e-10)
                if 'comparisons' in expected['tables']:
                    actual=next(o['tables']['comparisons'] for o in outputs if 'comparisons' in o['tables'])
                    self.assertEqual(len(actual),len(expected['tables']['comparisons']))
                    for a,b in zip(actual,expected['tables']['comparisons']):assert_allclose(a['adjusted p'],b['adjusted p'])

    def test_dependency_cannot_be_skipped(self):
        s=Session(PENGUINS,CASES['welch'])
        with self.assertRaisesRegex(ValueError,'preceding'):s.run(3,s.plan['route'][3]['code'])
        self.assertEqual(s.executions,[])

    def test_edited_upstream_arrays_change_actual_test_and_restore_prefix(self):
        s=Session(PENGUINS,CASES['welch']);complete(s)
        s.run(1,s.plan['route'][1]['code']+'\na = a[:20]')
        self.assertEqual(len(s.executions),2)
        self.assertNotIn('p_value',s.env)
        results=complete(s,2)
        a=PENGUINS.loc[PENGUINS.species=='Adelie','body_mass_g'].to_numpy()[:20]
        b=PENGUINS.loc[PENGUINS.species=='Chinstrap','body_mass_g'].to_numpy()
        assert_allclose(s.env['p_value'],stats.ttest_ind(a,b,equal_var=False).pvalue)
        self.assertTrue(results[-1]['edited']);self.assertIn('exploratory',results[-1]['interpretation'])

    def test_failed_mutation_rolls_back_and_retry_does_not_double_apply(self):
        s=Session(PENGUINS,CASES['welch']);complete(s)
        before=s.checkpoints[3]['a'].copy()
        with self.assertRaisesRegex(RuntimeError,'broken'):s.run(3,'a[:] = 0\nraise RuntimeError("broken")')
        assert_allclose(s.env['a'],before)
        self.assertEqual(len(s.executions),3)
        s.run(3,s.plan['route'][3]['code']);assert_allclose(s.env['a'],before)

    def test_omnibus_without_evidence_can_skip_posthoc_dependency(self):
        raw=pd.DataFrame([{'species':label,'body_mass_g':v} for label in ['A','B','C'] for v in [1,2,3,4,5,6]])
        s=Session(raw,{'family':'groups'})
        for i in range(5):
            cell=s.plan['route'][i];s.run(i,cell['code'])
        self.assertGreater(s.env['p_value'],.05)
        s.run(6,s.plan['route'][6]['code'])
        self.assertTrue(s.executions[5]['skipped'])
        self.assertNotIn('comparisons',s.env)

    def test_library_functions_survive_checkpoints(self):
        s=Session(PENGUINS,CASES['welch'])
        s.run(0,s.plan['route'][0]['code']+'\nfrom scipy.stats import ttest_ind')
        s.run(1,s.plan['route'][1]['code']);s.run(2,s.plan['route'][2]['code'])
        s.run(3,s.plan['route'][3]['code'].replace('stats.ttest_ind','ttest_ind'))
        self.assertTrue(np.isfinite(s.env['p_value']))

    def test_invalid_edited_samples_are_rejected(self):
        s=Session(PENGUINS,CASES['welch']);s.run(0,s.plan['route'][0]['code']);s.run(1,s.plan['route'][1]['code']+'\na = a[:3]');s.run(2,s.plan['route'][2]['code'])
        with self.assertRaisesRegex(ValueError,'four finite'):s.run(3,s.plan['route'][3]['code'])

    def test_cannot_drop_uncertainty_or_generate_nan_p(self):
        s=Session(PENGUINS,CASES['welch']);complete(s)
        with self.assertRaisesRegex(ValueError,'finite p_value'):s.run(3,'p_value = float("nan")')
        s.run(3,s.plan['route'][3]['code'])
        with self.assertRaisesRegex(ValueError,'interval variables'):s.run(4,'effect_size = 1')

    def test_factorial_machinery_is_optional_disclosure_and_still_executes(self):
        s=Session(PENGUINS,CASES['factorial3']);follow=s.plan['route'][5]
        self.assertNotIn('build_design_matrices',follow['code']);self.assertIn('build_design_matrices',follow['advanced'])
        complete(s);self.assertEqual(len(s.env['simple_effects']),18)


class ProportionTests(unittest.TestCase):
    def run_case(self,config,raw=CANDY):
        s=Session(raw,{'family':'proportions','dataset':'candy',**config});complete(s);return s

    def test_one_proportion_score_uses_null_variance_and_wilson_ci(self):
        s=self.run_case({});k=37;n=85;p=.5;z=(k/n-p)/np.sqrt(p*(1-p)/n)
        self.assertEqual(s.plan['method'],'prop_one_z');assert_allclose(s.env['statistic'],z);assert_allclose(s.env['p_value'],2*stats.norm.sf(abs(z)))
        zcrit=stats.norm.ppf(.975);phat=k/n;den=1+zcrit*zcrit/n
        center=(phat+zcrit*zcrit/(2*n))/den;half=zcrit*np.sqrt(phat*(1-phat)/n+zcrit*zcrit/(4*n*n))/den
        assert_allclose(s.env['interval'],[center-half,center+half])

    def test_sparse_one_proportion_routes_exact_and_matches_enumeration(self):
        s=self.run_case({'reference':.01});self.assertEqual(s.plan['method'],'prop_one_exact')
        probs=stats.binom.pmf(np.arange(86),85,.01);assert_allclose(s.env['p_value'],sum(probs[probs<=probs[37]*(1+1e-10)]),rtol=1e-10)
        ci=s.env['interval'];assert_allclose(ci,[stats.beta.ppf(.025,37,49),stats.beta.ppf(.975,38,48)])

    def test_two_proportions_pooled_formula_and_newcombe_interval(self):
        s=self.run_case({'dataset':'penguins','structure':'two','outcome':'sex','success':'female','group':'species'},PENGUINS)
        self.assertEqual(s.plan['method'],'prop_two_z');k,n=s.env['counts'],s.env['sizes'];p=k.sum()/n.sum();diff=k[0]/n[0]-k[1]/n[1]
        assert_allclose(s.env['statistic'],diff/np.sqrt(p*(1-p)*(1/n[0]+1/n[1])))
        self.assertLess(s.env['interval'][0],diff);self.assertGreater(s.env['interval'][1],diff)

    def test_sparse_two_proportions_fisher_and_exact_odds_interval(self):
        s=self.run_case({'structure':'two','outcome':'peanutyalmondy','success':'1','group':'caramel'})
        self.assertEqual(s.plan['method'],'prop_two_exact')
        tab=s.env['table'];assert_allclose(s.env['p_value'],stats.fisher_exact(tab).pvalue)
        self.assertIn('exact_odds_interval',s.env);self.assertIn('approximate',s.plan['steps'][3]['explanation'])

    def test_extreme_observed_one_proportion_has_valid_exact_bounds(self):
        # Include both observed categories but only one rare success.
        raw=pd.DataFrame({'chocolate':[1]+[0]*19})
        s=self.run_case({'reference':.01},raw);self.assertEqual(s.plan['method'],'prop_one_exact')
        self.assertTrue(0<=s.env['interval'].low<s.env['interval'].high<=1)

    def test_missing_events_not_silently_failures(self):
        raw=CANDY.copy();raw.loc[0,'chocolate']=np.nan
        # Float/string normalization is explicit: select the category as represented.
        s=self.run_case({'success':'1.0'},raw)
        self.assertEqual(s.plan['config']['omitted'],1);self.assertEqual(s.env['n'],84)

    def test_invalid_reference_and_same_group_rejected(self):
        for config in [{'reference':0},{'reference':1},{'reference':np.nan},{'structure':'two','group':'chocolate','outcome':'chocolate'},{'structure':'two','levels':['0','0']}]:
            with self.subTest(config=config), self.assertRaises(ValueError):self.run_case(config)

    def test_edited_z_counts_recheck_approximation(self):
        s=self.run_case({});s.run(1,s.plan['route'][1]['code']+'\nn = 8\ncount = 2');s.run(2,s.plan['route'][2]['code'])
        with self.assertRaisesRegex(ValueError,'exact binomial'):s.run(3,s.plan['route'][3]['code'])

if __name__=='__main__':unittest.main()
