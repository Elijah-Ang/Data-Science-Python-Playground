"""M03 reports supplied scores; omissions and invented baseline values must fail."""
import json
import subprocess
import sys
from pathlib import Path
import unittest
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]


class ReportingEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        curriculum=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')],cwd=ROOT))
        cls.card=next(c for c in curriculum['cards'] if c['id']=='ML-M03')
        built=ROOT/'dist/ml-learning/curriculum.json'
        if built.exists():
            built_card=next(c for c in json.loads(built.read_text())['cards'] if c['id']=='ML-M03')
            assert built_card==cls.card,'Built M03 must preserve final authoring and editorial hints'

    def test_each_practice_supplies_its_own_design_and_numeric_reference(self):
        for exercise in self.card['exercises'][:1]:
            with self.subTest(id=exercise['id']):
                evidence=exercise['evidence']
                for text in ('Illustrative','not scores fitted','hours','one workshop','80','20','same five','seed 42','within each training fold','dummy 4.4 / 0.7','linear 4.2 / 0.6','tree 4.3 / 0.8','not confidence intervals','paired fold scores are not supplied'):
                    self.assertIn(text,evidence)
                self.assertIs(exercise['showDatasetPreview'],False)
        for exercise in self.card['exercises'][1:]:
            for text in ('hours','one workshop','80','20','same five','seed 42','not confidence intervals','Paired fold scores and a final-test result are not supplied'):
                self.assertIn(text,exercise['evidence'])
            self.assertEqual(exercise['inputPreview']['columns'],['model','cv_rmse','fold_sd'])
            self.assertEqual(exercise['inputPreview']['rows'],[['dummy',4.4,.7],['linear',4.2,.6],['tree',4.3,.8]])

    def check_table(self,solution):
        exercise=self.card['exercises'][0]
        namespace={'pd':pd,'np':np}
        exec(solution,namespace)
        return all(eval(check['test'],namespace) for check in exercise['checks'])

    def test_model_solution_and_positive_equivalent_include_reference(self):
        self.assertTrue(self.check_table(self.card['exercises'][0]['solution']))
        self.assertTrue(self.check_table("answer=pd.DataFrame([['dummy',4.4,.7],['linear',4.2,.6],['tree',4.3,.8]], columns=['model','cv_rmse','fold_sd'])"))

    def test_checker_rejects_missing_or_invented_reference(self):
        solution=self.card['exercises'][0]['solution']
        self.assertFalse(self.check_table(solution+"\nanswer=answer.iloc[1:].reset_index(drop=True)"))
        self.assertFalse(self.check_table(solution+"\nanswer.loc[0,'cv_rmse']=5.4"))
        self.assertFalse(self.check_table(solution+"\nanswer.loc[0,'fold_sd']=0"))

    def test_computed_change_and_transfer_match_supplied_evidence(self):
        decision,transfer=self.card['exercises'][1:]
        for exercise in (decision,transfer):
            ns={'pd':pd,'np':np}
            exec(exercise['setup']+'\n'+exercise['solution'],ns)
            self.assertEqual(exercise['kind'],'python')
            self.assertTrue(all(eval(check['test'],ns) for check in exercise['checks']))
        np.testing.assert_allclose(ns['answer']['gain_minutes'],[0,12,6])
        np.testing.assert_allclose(ns['answer']['fold_sd_minutes'],[42,36,48])
        self.assertEqual((ns['development_rows'],ns['reserved_rows']),(80,20))
        ns['answer'].loc[1,'gain_minutes']=60
        self.assertFalse(all(eval(check['test'],ns) for check in transfer['checks']))

    def test_final_editorial_hints_preserve_the_reporting_contract(self):
        follow,decision,transfer=self.card['exercises']
        hints=' '.join(follow['hints'].values())
        for text in ('dummy','linear','tree','three aligned rows','hours'):
            self.assertIn(text,hints)
        self.assertNotIn('two stated model results',hints)
        self.assertIn('rather than confidence intervals',follow['explanation'])
        self.assertIn('development folds',decision['hints']['think'])
        self.assertIn('20 reserved',' '.join(transfer['hints'].values()))


if __name__=='__main__':unittest.main()
