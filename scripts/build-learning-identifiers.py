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

    def add(item, columns, supplied_tables=()):
        variables = set(item.get('outputs', []))
        columns = set(columns)
        keys = set()
        frames = {'df', 'X', 'X_train', 'X_test', 'X_valid', *supplied_tables}
        containers = {}
        label_lists = {}
        instruction_objects = {'df', *item.get('outputs', []), *(entry['name'] for entry in item.get('contract', [])), *supplied_tables}
        if item.get('target') == 'copy':
            instruction_objects.add('clean')
        for field in ('setup', 'starter', 'solution', 'reference'):
            try:
                tree = ast.parse(item.get(field) or '')
            except SyntaxError:
                continue  # Deliberate starter blanks are not reference code.
            if field == 'setup':
                instruction_objects.update(node.id for node in ast.walk(tree) if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store))
            def labels(value):
                if isinstance(value, ast.Constant) and isinstance(value.value, str):
                    return {value.value}
                if isinstance(value, ast.Name):
                    return label_lists.get(value.id, set())
                if isinstance(value, (ast.List, ast.Tuple)):
                    return set().union(*(labels(v.value if isinstance(v, ast.Starred) else v) for v in value.elts))
                if isinstance(value, ast.BinOp) and isinstance(value.op, ast.Add):
                    return labels(value.left) | labels(value.right)
                return set()
            def frame_expression(value):
                if isinstance(value, ast.Name):
                    return value.id in frames
                if isinstance(value, ast.Subscript):
                    # One quoted column selects a Series, not another table.
                    return not (isinstance(value.slice, ast.Constant) and isinstance(value.slice.value, str)) and frame_expression(value.value)
                if isinstance(value, ast.Call) and isinstance(value.func, ast.Attribute):
                    if value.func.attr in ('DataFrame', 'read_csv'):
                        return True
                    if value.func.attr in ('copy', 'head', 'tail', 'sample', 'drop', 'dropna', 'rename', 'assign', 'sort_values', 'reset_index', 'set_index', 'select_dtypes'):
                        return frame_expression(value.func.value)
                if isinstance(value, ast.Attribute) and value.attr in ('loc', 'iloc'):
                    return frame_expression(value.value)
                return False

            # Propagate only demonstrated table receivers. A dict assignment
            # such as candidates['logistic'] must never invent a table column.
            for _ in range(3):
                for node in ast.walk(tree):
                    if isinstance(node, ast.Assign) and frame_expression(node.value):
                        frames.update(target.id for target in node.targets if isinstance(target, ast.Name))
                    if isinstance(node, ast.Assign):
                        dictionaries = [node.value] if isinstance(node.value, ast.Dict) else []
                        if isinstance(node.value, (ast.List, ast.Tuple)):
                            dictionaries += [v for v in node.value.elts if isinstance(v, ast.Dict)]
                        if isinstance(node.value, ast.ListComp) and isinstance(node.value.elt, ast.Dict):
                            dictionaries.append(node.value.elt)
                        names = {k.value for d in dictionaries for k in d.keys if isinstance(k, ast.Constant) and isinstance(k.value, str)}
                        for target in node.targets:
                            if isinstance(target, ast.Name):
                                containers.setdefault(target.id, set()).update(names)
                                label_lists.setdefault(target.id, set()).update(labels(node.value))
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == 'append' and isinstance(node.func.value, ast.Name) and node.args and isinstance(node.args[0], ast.Dict):
                        containers.setdefault(node.func.value.id, set()).update(k.value for k in node.args[0].keys if isinstance(k, ast.Constant) and isinstance(k.value, str))
            for node in ast.walk(tree):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    variables.add(node.id)
                if isinstance(node, ast.Subscript) and isinstance(node.ctx, ast.Store):
                    if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str):
                        (columns if frame_expression(node.value) else keys).add(node.slice.value)
                if isinstance(node, ast.Dict):
                    keys.update(k.value for k in node.keys if isinstance(k, ast.Constant) and isinstance(k.value, str))
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == 'DataFrame':
                    for keyword in node.keywords:
                        if keyword.arg == 'columns':
                            columns.update(labels(keyword.value))
                    if node.args and isinstance(node.args[0], ast.Dict):
                        columns.update(k.value for k in node.args[0].keys if isinstance(k, ast.Constant) and isinstance(k.value, str))
                    if node.args and isinstance(node.args[0], ast.Name):
                        columns.update(containers.get(node.args[0].id, set()))
                    if node.args and isinstance(node.args[0], ast.ListComp) and isinstance(node.args[0].elt, ast.Dict):
                        columns.update(k.value for k in node.args[0].elt.keys if isinstance(k, ast.Constant) and isinstance(k.value, str))
        result[item['id']] = dict(columns=sorted(columns), variables=sorted(variables), keys=sorted(keys - columns - variables), instructionObjects=sorted(instruction_objects))

    for lesson in data['curriculum']['lessons']:
        for item in lesson['rounds']:
            add(item, data['curriculum']['datasets'][item['dataset']]['columns'])
    for item in data['challenges']:
        add(item, [key for source in item['inputs'] for key in source.get('columns', {})], [source.get('name', '') for source in item['inputs']])
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
