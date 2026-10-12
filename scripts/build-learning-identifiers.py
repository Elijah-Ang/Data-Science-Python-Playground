"""Authored code-name contexts for Learn / Refresh; no learner-code inspection."""
import argparse
import ast
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def registry():
    source = """const vm=require('vm'),fs=require('fs');const c={};c.window=c;
vm.runInNewContext(fs.readFileSync('challenges/registry.js','utf8'),c);
console.log(JSON.stringify({curriculum:require('./foundations/curriculum.js'),challenges:c.DataWorkflowChallenges.challenges}));"""
    data = json.loads(subprocess.check_output(['node', '-e', source], cwd=ROOT, text=True))
    ml = json.loads(subprocess.check_output(['python3', 'ml-learning/authoring.py'], cwd=ROOT, text=True))
    datasets = json.loads((ROOT / 'ml-learning/datasets.json').read_text())
    result = {}

    def add(item, columns):
        variables = set(item.get('outputs', []))
        columns = set(columns)
        for field in ('setup', 'starter', 'solution', 'reference'):
            try:
                tree = ast.parse(item.get(field) or '')
            except SyntaxError:
                continue  # Deliberate starter blanks are not reference code.
            for node in ast.walk(tree):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    variables.add(node.id)
                if isinstance(node, ast.Subscript) and isinstance(node.ctx, ast.Store):
                    if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str):
                        columns.add(node.slice.value)
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == 'DataFrame':
                    if node.args and isinstance(node.args[0], ast.Dict):
                        columns.update(k.value for k in node.args[0].keys if isinstance(k, ast.Constant) and isinstance(k.value, str))
        result[item['id']] = dict(columns=sorted(columns), variables=sorted(variables - columns))

    for lesson in data['curriculum']['lessons']:
        for item in lesson['rounds']:
            add(item, data['curriculum']['datasets'][item['dataset']]['columns'])
    for item in data['challenges']:
        add(item, [key for source in item['inputs'] for key in source.get('columns', {})])
    for card in ml['cards']:
        for item in card['exercises']:
            dataset = datasets.get(item.get('dataset') or card.get('dataset'), {})
            cols = dataset.get('columns', [])
            cols = list(cols) if isinstance(cols, dict) else cols
            cols += [entry[0] for entry in item.get('dictionary', [])]
            add(item, cols)
    for challenge in ml['challenges']:
        item = dict(challenge['exercise'], id=challenge['id'])
        cols = [entry[0] for entry in item.get('dictionary', [])]
        cols += [key for source in challenge['inputs'] for key in source.get('columns', {})]
        add(item, cols)
        result[challenge['exercise']['id']] = result[challenge['id']]
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = registry()
    text = '/* Generated from authored inputs and reference code; never learner state. */\n' + \
        '(function(root){root.LearningIdentifiers=' + json.dumps(result, separators=(',', ':'), ensure_ascii=False) + \
        ';})(typeof window!=="undefined"?window:globalThis);\n'
    target = ROOT / 'learning-identifiers.js'
    if args.check:
        assert target.read_text() == text, 'Regenerate learning-identifiers.js from the authored curriculum'
    else:
        target.write_text(text)
    print(f'Authored identifier contexts: {len(result)} activity identities.')
