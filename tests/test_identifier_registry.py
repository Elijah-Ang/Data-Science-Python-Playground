"""Identifier generation must retain authored meaning across varied datasets."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('identifier_builder', ROOT / 'scripts/build-learning-identifiers.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class IdentifierRegistryTests(unittest.TestCase):
    def registry(self, lesson):
        source = {'curriculum': {'lessons': [lesson], 'datasets': {'fixture': {'columns': ['category', 'amount']}}}, 'challenges': []}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'ml-learning').mkdir()
            (root / 'ml-learning/datasets.json').write_text('{}')
            with patch.object(builder, 'ROOT', root), patch.object(builder.subprocess, 'check_output', side_effect=[json.dumps(source), json.dumps({'cards': [], 'challenges': []})]):
                return builder.registry()

    def test_outputs_and_example_only_names(self):
        lesson = {
            'id': 'example',
            'example': 'medians = df.groupby("category")["amount"].median()\nranked = medians.sort_values()\norder = ranked.index',
            'rounds': [{
                'id': 'example-1', 'dataset': 'fixture',
                'solution': 'result = df.groupby("category", as_index=False).agg(\n    average_bill=("amount", "mean"),\n    observed_rows=("amount", "size"),\n)\nlong = df.melt(id_vars="category", value_vars="amount", var_name="measure", value_name="value")\ndf["adjusted_amount"] = df["amount"] * 2',
            }],
        }
        context = self.registry(lesson)['example-1']
        self.assertTrue({'medians', 'ranked', 'order'} <= set(context['exampleVariables']))
        self.assertTrue({'average_bill', 'observed_rows', 'measure', 'value'} <= set(context['outputColumns']))
        self.assertEqual(context['inputColumns'], ['amount', 'category'])
        self.assertIn('adjusted_amount', context['derivedColumns'])
        self.assertTrue({'mean', 'size'} <= set(context['operations']))
        self.assertNotIn('average_bill', context['parameters'])
        self.assertIn('as_index', context['parameters'])

    def test_authored_scopes_override_fallback(self):
        lesson = {
            'id': 'example',
            'identifiers': {'exampleVariables': ['order'], 'scopes': {'task': {'semantics': {'order': {'role': 'column', 'kind': 'output'}}}}},
            'rounds': [{'id': 'example-1', 'dataset': 'fixture', 'starter': 'result = ____(', 'identifiers': {'outputColumns': ['chosen_heading'], 'occurrences': [{'text': 'value', 'role': 'prose'}]}}],
        }
        context = self.registry(lesson)['example-1']
        self.assertEqual(context['semantics']['order'], {'role': 'variable', 'kind': 'example'})
        self.assertEqual(context['scopes']['task']['semantics']['order'], {'role': 'column', 'kind': 'output'})
        self.assertIn('chosen_heading', context['columns'])
        self.assertEqual(context['occurrences'], [{'text': 'value', 'role': 'prose'}])

    def test_guide_operations_do_not_override_task_columns(self):
        lesson = {'id': 'example', 'guide': {'identifiers': {'operations': ['size']}}, 'rounds': [{'id': 'example-1', 'dataset': 'fixture', 'identifiers': {'inputColumns': ['size']}}]}
        context = self.registry(lesson)['example-1']
        self.assertEqual(context['semantics']['size'], {'role': 'column', 'kind': 'input'})
        self.assertEqual(context['scopes']['guide']['semantics']['size'], {'role': 'operation'})

    def test_row_unit_descriptions_preserve_ordinary_entity_nouns(self):
        lesson = {'id': 'example', 'rounds': [{'id': 'example-1', 'dataset': 'fixture', 'observationUnit': 'one measured stone', 'identifiers': {'inputColumns': ['stone']}}]}
        context = self.registry(lesson)['example-1']
        self.assertIn({'text': 'one measured stone', 'role': 'prose', 'before': 'Each row is ', 'scope': 'task'}, context['occurrences'])
        self.assertEqual(context['semantics']['stone'], {'role': 'column', 'kind': 'input'})

    def test_authored_object_contracts_supply_variable_roles(self):
        lesson = {'id': 'example', 'rounds': [{'id': 'example-1', 'dataset': 'fixture', 'suppliedState': [{'name': 'model', 'description': 'Already fitted.'}, {'name': 'X', 'description': 'Supplied measurements.'}], 'learnerOutputs': [{'name': 'candidates'}], 'solution': 'folds = KFold(n_splits=3)\ny = df["response"]'}]}
        context = self.registry(lesson)['example-1']
        for name in ['model', 'X', 'candidates']:
            self.assertEqual(context['semantics'][name]['role'], 'variable')
            self.assertIn(name, context['variables'])
        self.assertIn('n_splits', context['parameters'])
        self.assertIn('response', context['columns'])
        self.assertNotIn('response', context['outputColumns'])

    def test_dictionary_keys_do_not_become_columns(self):
        lesson = {'id': 'example', 'rounds': [{'id': 'example-1', 'dataset': 'fixture', 'solution': 'candidates = {}\ncandidates["logistic"] = model\nreport = [{"setting": 1, "score": 2}]\nsummary = pd.DataFrame(report)'}]}
        context = self.registry(lesson)['example-1']
        self.assertIn('logistic', context['keys'])
        self.assertNotIn('logistic', context['columns'])
        self.assertTrue({'setting', 'score'} <= set(context['columns']))


if __name__ == '__main__':
    unittest.main()
