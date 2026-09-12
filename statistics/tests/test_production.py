"""Production additions: independent GOF oracles, boundaries and build contracts."""
import importlib.util
import contextlib
import io
import inspect
import json
from pathlib import Path
import re
import unittest
import numpy as np
import pandas as pd
from scipy import stats
from numpy.testing import assert_allclose
from test_notebook import ns, Session, complete, ROOT, PENGUINS, CANDY


class GoodnessTests(unittest.TestCase):
    def run_gof(self, raw=PENGUINS, **config):
        s=Session(raw,{'family':'goodness',**config});out=complete(s)
        return s,out

    def test_multinomial_against_explicit_formula(self):
        s,out=self.run_gof();observed=PENGUINS.species.value_counts().sort_index().to_numpy();expected=np.full(3,len(PENGUINS)/3)
        chi=((observed-expected)**2/expected).sum()
        assert_allclose([s.env['statistic'],s.env['p_value'],s.env['effect_size']],[chi,stats.chi2.sf(chi,2),np.sqrt(chi/observed.sum())])
        self.assertEqual(s.env['degrees_of_freedom'],2)
        self.assertEqual(set(s.env['departures'].index),set(PENGUINS.species.unique()))
        self.assertAlmostEqual(s.env['departures']['chi-square contribution'].sum(),chi)
        self.assertTrue(out[-2]['figures']);self.assertIn('Chi-square goodness-of-fit',out[-1]['interpretation'])

    def test_prespecified_shares_and_wilson_formula(self):
        s,_=self.run_gof(expected_mode='specified',expected=[.2,.3,.5])
        observed=s.env['observed'].to_numpy();n=observed.sum();z=stats.norm.ppf(.975);p=observed/n
        center=(p+z*z/(2*n))/(1+z*z/n);half=z*np.sqrt(p*(1-p)/n+z*z/(4*n*n))/(1+z*z/n)
        assert_allclose(s.env['category_intervals']['CI low'],center-half)
        assert_allclose(s.env['category_intervals']['CI high'],center+half)
        assert_allclose(s.env['expected'],n*np.array([.2,.3,.5]))

    def test_binary_exact_against_probability_enumeration(self):
        s,out=self.run_gof(CANDY,dataset='candy',outcome='chocolate',expected_mode='specified',expected=[.99,.01])
        self.assertEqual(s.plan['method'],'gof_exact');n=s.env['n'];k=int(s.env['observed'].iloc[0]);p=.99
        probabilities=stats.binom.pmf(np.arange(n+1),n,p);expected=probabilities[probabilities<=probabilities[k]*(1+1e-7)].sum()
        assert_allclose(s.env['p_value'],expected,rtol=1e-10,atol=1e-300)
        self.assertNotIn('statistic',out[-1]['scalars'])
        low,high=s.env['category_intervals'].iloc[0][['CI low','CI high']]
        assert_allclose([low,high],[stats.beta.ppf(.025,k,n-k+1),stats.beta.ppf(.975,k+1,n-k)])

    def test_expected_thresholds(self):
        f=ns['validate_goodness']
        self.assertEqual(f([5,5,5],[1/3]*3),'gof_chi2')
        with self.assertRaisesRegex(ValueError,'outside'):f([4,5,5],[1/3]*3)
        self.assertEqual(f([5,5],[.5,.5]),'gof_exact')
        self.assertEqual(f([10,10],[.5,.5]),'gof_chi2')

    def test_probability_boundaries_and_sparse_rejection(self):
        for probabilities in ([0,.5,.5],[-.1,.5,.6],[.2,.2,.2],[np.nan,.5,.5],[np.inf,.2,.8],[1],[],[.999,.0005,.0005]):
            with self.subTest(probabilities=probabilities),self.assertRaisesRegex(ValueError,'proportion|Expected count'):
                self.run_gof(expected_mode='specified',expected=probabilities)

    def test_edited_invalid_counts_rollback(self):
        s,_=self.run_gof();s.run(1,s.plan['route'][1]['code']+'\nobserved.iloc[0] = -1')
        s.run(2,s.plan['route'][2]['code'])
        with self.assertRaisesRegex(ValueError,'integer'):s.run(3,s.plan['route'][3]['code'])
        self.assertNotIn('p_value',s.env)

    def test_edited_shares_require_recalculation_and_route_conditions(self):
        s,_=self.run_gof();s.run(1,s.plan['route'][1]['code']+'\nexpected_proportions = np.array([.2,.3,.5])')
        s.run(2,s.plan['route'][2]['code'])
        with self.assertRaisesRegex(ValueError,'Recalculate'):s.run(3,s.plan['route'][3]['code'])
        with self.assertRaisesRegex(ValueError,'different route'):ns['validate_goodness']([8,8],[.5,.5],'gof_chi2')

    def test_confidence_widths_and_category_order(self):
        runs=[self.run_gof(confidence=c)[0] for c in (.9,.95,.99)]
        assert_allclose([s.env['p_value'] for s in runs],runs[0].env['p_value'])
        widths=[s.env['category_intervals']['CI high']-s.env['category_intervals']['CI low'] for s in runs]
        self.assertTrue(np.all(widths[0]<=widths[1]));self.assertTrue(np.all(widths[1]<=widths[2]))


class ProductionContracts(unittest.TestCase):
    def test_control_schema_matches_teaching_data(self):
        spec=importlib.util.spec_from_file_location('controls',ROOT/'statistics/audit/controls.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        self.assertEqual(json.loads((ROOT/'statistics/controls.json').read_text()),module.make_schema())

    def test_base_css_is_exact_canonical_source(self):
        canonical=re.search(r'<style>(.*?)</style>',(ROOT/'ml.html').read_text(),re.S).group(1)
        self.assertEqual((ROOT/'statistics/playground-base.css').read_text(),canonical)
        if (ROOT/'dist/statistics/playground-base.css').exists():self.assertEqual((ROOT/'dist/statistics/playground-base.css').read_text(),canonical)

    def test_continuous_numeric_boundaries(self):
        for reference in (0,-1,1e6):
            for family in ('reference',):
                s=Session(PENGUINS,{'family':family,'reference':reference});complete(s)
                self.assertTrue(np.isfinite(s.env['p_value']))
        for reference in (float('nan'),float('inf'),-float('inf')):
            with self.assertRaisesRegex(ValueError,'finite'):Session(PENGUINS,{'family':'reference','reference':reference})
        for sigma in (0,-1,float('nan'),float('inf')):
            with self.assertRaisesRegex(ValueError,'positive'):Session(PENGUINS,{'family':'reference','known_sigma':True,'sigma':sigma})
        for sigma in (.001,1e6):
            s=Session(PENGUINS,{'family':'reference','known_sigma':True,'sigma':sigma});complete(s);self.assertTrue(np.isfinite(s.env['statistic']))
        for reference in (0,1,-.1,1.1,float('nan')):
            with self.assertRaisesRegex(ValueError,'between'):Session(CANDY,{'family':'proportions','dataset':'candy','reference':reference})
        for reference in (.0001,.5,.9999):
            s=Session(CANDY,{'family':'proportions','dataset':'candy','reference':reference});complete(s);self.assertTrue(np.isfinite(s.env['p_value']))

    def test_reverse_years_are_rejected(self):
        gap=pd.read_csv(ROOT/'data/gapminder.csv')
        with self.assertRaisesRegex(ValueError,'later'):Session(gap,{'family':'paired','dataset':'gapminder','before':2007,'after':1952})

    def test_seeded_rank_swap_invariance(self):
        def evidence(c):
            s=Session(CANDY,{'dataset':'candy',**c});complete(s);return s.env
        a=evidence({'family':'independent','goal':'rank','group':'chocolate','levels':['0','1']})
        b=evidence({'family':'independent','goal':'rank','group':'chocolate','levels':['1','0']})
        assert_allclose(a['interval'],-np.array(b['interval'])[::-1],atol=1e-12)
        a=evidence({'family':'association','goal':'rank','x':'sugarpercent','y':'pricepercent'})
        b=evidence({'family':'association','goal':'rank','x':'pricepercent','y':'sugarpercent'})
        assert_allclose(a['p_value'],b['p_value']);assert_allclose(a['interval'],b['interval'])

    def test_correlation_axes_and_observations_swap(self):
        from unittest.mock import patch
        from matplotlib.figure import Figure
        captured=[];save=Figure.savefig
        def capture(fig,*args,**kwargs):
            ax=fig.axes[0]
            if ax.collections:
                captured.append((ax.get_xlabel(),ax.get_ylabel(),np.array(ax.collections[0].get_offsets())))
            return save(fig,*args,**kwargs)
        with patch.object(Figure,'savefig',capture):
            for x,y in [('sugarpercent','pricepercent'),('pricepercent','sugarpercent')]:
                s=Session(CANDY,{'family':'association','dataset':'candy','x':x,'y':y});complete(s)
        self.assertEqual(captured[0][:2],captured[1][:2][::-1])
        assert_allclose(captured[0][2],captured[1][2][:,::-1])

    def test_factorial_advanced_is_explicit_and_standalone(self):
        s=Session(PENGUINS,{'family':'factorial','factors':['year','sex','species']})
        follow=s.plan['route'][-2];self.assertIn('Prerequisite',follow['explanation']);self.assertIn('Advanced',follow['code'])
        env={'df':PENGUINS.copy()}
        with contextlib.redirect_stdout(io.StringIO()):
            for cell in s.plan['route']:
                exec(cell.get('advanced',''),env);exec(cell['code'],env)
        self.assertIn('simple_effects',env)
