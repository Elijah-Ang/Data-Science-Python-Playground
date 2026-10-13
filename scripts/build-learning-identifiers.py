"""Build scoped identifier semantics from the authored curriculum, never learner state.

Code supplies a conservative fallback; ``identifiers`` metadata and occurrence
overrides supply the authority for ambiguous prose. See code-identifiers.js.
"""
import argparse
import ast
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ROLE_FIELDS = {
    'inputColumns': ('column', 'input'),
    'derivedColumns': ('column', 'derived'),
    'outputColumns': ('column', 'output'),
    'columns': ('column', ''),
    'variables': ('variable', ''),
    'suppliedObjects': ('variable', 'supplied'),
    'createdObjects': ('variable', 'created'),
    'exampleVariables': ('variable', 'example'),
    'functions': ('function', ''),
    'parameters': ('parameter', ''),
    'operations': ('operation', ''),
    'syntax': ('syntax', ''),
    'literals': ('literal', ''),
    'prose': ('prose', ''),
    'keys': ('key', ''),
    'files': ('file', ''),
}


def authored_metadata(owner):
    """Normalize role arrays/maps without guessing roles from teaching prose."""
    metadata = owner.get('identifiers', {}) if isinstance(owner, dict) else {}
    if not metadata:
        return {}
    semantics = {}
    occurrences = []
    if isinstance(metadata, list):
        entries = metadata
    else:
        entries = metadata.get('names', [])
        for field, (role, kind) in ROLE_FIELDS.items():
            for name in metadata.get(field, []):
                semantics[name] = dict(role=role, **({'kind': kind} if kind else {}))
        # Name maps make a single ambiguous identifier convenient to author.
        for name, meaning in metadata.get('semantics', {}).items():
            semantics[name] = dict(role=meaning) if isinstance(meaning, str) else meaning
        occurrences = metadata.get('occurrences', [])
    for entry in entries:
        if isinstance(entry, dict) and entry.get('name') and entry.get('role'):
            semantics[entry['name']] = {k: v for k, v in entry.items() if k != 'name'}
    result = {'semantics': semantics} if semantics else {}
    if occurrences:
        result['occurrences'] = occurrences
    return result


def merge_metadata(*contexts):
    result = {}
    for context in contexts:
        if context.get('semantics'):
            result.setdefault('semantics', {}).update(context['semantics'])
        if context.get('occurrences'):
            result.setdefault('occurrences', []).extend(context['occurrences'])
    return result


def provided_metadata(owner):
    """The authored object contract also supplies exact Python-name roles."""
    if not isinstance(owner, dict):
        return {}
    provenance = owner.get('provenance', {})
    semantics = {}
    for kind, entries in [('supplied', owner.get('suppliedState', []) + provenance.get('supplied', [])),
                          ('created', owner.get('learnerOutputs', []) + provenance.get('created', []))]:
        for entry in entries:
            name = entry.get('name') if isinstance(entry, dict) else entry
            if not isinstance(name, str) or not name:
                continue
            semantics[name] = {'role': 'file' if isinstance(entry, dict) and entry.get('type') == 'CSV file' else 'variable', 'kind': kind}
    for name in owner.get('outputs', []):
        semantics.setdefault(name, {'role': 'variable', 'kind': 'created'})
    return {'semantics': semantics} if semantics else {}


def worked_code(owner):
    """Read executable worked examples, not descriptive concept metadata."""
    if not isinstance(owner, dict):
        return []
    result = []
    for field in ('example', 'exampleCode', 'syntaxCode', 'code', 'referenceCode'):
        if isinstance(owner.get(field), str):
            result.append(owner[field])
    for field in ('guide', 'teaching'):
        result.extend(worked_code(owner.get(field)))
    return result


def registry():
    source = """const vm=require('vm'),fs=require('fs');const c={};c.window=c;
vm.runInNewContext(fs.readFileSync('challenges/registry.js','utf8'),c);
console.log(JSON.stringify({curriculum:require('./foundations/curriculum.js'),challenges:c.DataWorkflowChallenges.challenges}));"""
    data = json.loads(subprocess.check_output(['node', '-e', source], cwd=ROOT, text=True))
    ml = json.loads(subprocess.check_output(['python3', 'ml-learning/authoring.py'], cwd=ROOT, text=True))
    datasets = json.loads((ROOT / 'ml-learning/datasets.json').read_text())
    result = {}

    def add(item, columns, supplied_tables=(), lesson=None):
        variables = set(item.get('outputs', []))
        input_columns = set(columns)
        columns = set(input_columns)
        derived_columns, output_columns, example_variables = set(), set(), set()
        read_columns = set()
        functions, parameters, operations = set(), set(), set()
        keys = set()
        frames = {'df', 'X', 'X_train', 'X_test', 'X_valid', *supplied_tables}
        containers = {}
        label_lists = {}
        instruction_objects = {'df', *item.get('outputs', []), *(entry['name'] for entry in item.get('contract', [])), *supplied_tables}
        if item.get('target') == 'copy':
            instruction_objects.add('clean')
        code_fields = [(field, item.get(field) or '') for field in ('setup', 'starter', 'solution', 'reference')]
        code_fields += [('example', code) for code in worked_code(lesson) + worked_code(item)]
        for field, code in code_fields:
            try:
                tree = ast.parse(code)
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
                    if value.func.attr in ('copy', 'head', 'tail', 'sample', 'drop', 'dropna', 'rename', 'assign', 'sort_values', 'reset_index', 'set_index', 'select_dtypes', 'groupby', 'agg', 'melt', 'pivot', 'pivot_table'):
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
                    if field == 'example':
                        example_variables.add(node.id)
                if isinstance(node, ast.Subscript) and isinstance(node.ctx, ast.Store):
                    if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str):
                        if frame_expression(node.value):
                            columns.add(node.slice.value)
                            derived_columns.add(node.slice.value)
                        else:
                            keys.add(node.slice.value)
                    elif isinstance(node.value, ast.Attribute) and node.value.attr == 'loc' and frame_expression(node.value) and isinstance(node.slice, ast.Tuple) and len(node.slice.elts) == 2:
                        selected_columns = labels(node.slice.elts[1])
                        columns.update(selected_columns)
                        derived_columns.update(selected_columns)
                if isinstance(node, ast.Subscript) and isinstance(node.ctx, ast.Load) and frame_expression(node.value):
                    selection = node.slice
                    if isinstance(node.value, ast.Attribute) and node.value.attr in ('loc', 'iloc'):
                        selection = node.slice.elts[1] if node.value.attr == 'loc' and isinstance(node.slice, ast.Tuple) and len(node.slice.elts) == 2 else None
                    read_columns.update(labels(selection))
                    columns.update(labels(selection))
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        function = node.func.attr
                        functions.add(function)
                        if isinstance(node.func.value, ast.Name):
                            functions.add(node.func.value.id + '.' + function)
                    elif isinstance(node.func, ast.Name):
                        function = node.func.id
                        functions.add(function)
                    else:
                        function = ''
                    for keyword in node.keywords:
                        if not keyword.arg:
                            continue
                        # pandas named aggregation is output authoring, not an
                        # arbitrary keyword parameter named mean_amount.
                        named_agg = function == 'agg' and isinstance(keyword.value, ast.Tuple) and len(keyword.value.elts) == 2
                        if named_agg:
                            columns.add(keyword.arg)
                            output_columns.add(keyword.arg)
                            operations.update(labels(keyword.value.elts[1]))
                        else:
                            parameters.add(keyword.arg)
                        if function == 'melt' and keyword.arg in ('var_name', 'value_name'):
                            output_columns.update(labels(keyword.value))
                            columns.update(labels(keyword.value))
                        if isinstance(node.func, ast.Attribute) and frame_expression(node.func.value) and keyword.arg in ('id_vars', 'value_vars', 'subset', 'by', 'on'):
                            read_columns.update(labels(keyword.value))
                            columns.update(labels(keyword.value))
                        if isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name) and node.func.value.id == 'sns' and keyword.arg in ('x', 'y', 'hue', 'style', 'size', 'row', 'col', 'vars', 'x_vars', 'y_vars'):
                            read_columns.update(labels(keyword.value))
                            columns.update(labels(keyword.value))
                        if function in ('to_frame', 'reset_index') and keyword.arg == 'name':
                            output_columns.update(labels(keyword.value))
                            columns.update(labels(keyword.value))
                        if function == 'assign':
                            derived_columns.add(keyword.arg)
                            columns.add(keyword.arg)
                        if function == 'rename' and keyword.arg == 'columns' and isinstance(keyword.value, ast.Dict):
                            output_columns.update(label for value in keyword.value.values for label in labels(value))
                            columns.update(output_columns)
                        if keyword.arg in ('aggfunc', 'estimator'):
                            operations.update(labels(keyword.value))
                    if function in ('agg', 'aggregate', 'transform') and node.args:
                        operations.update(labels(node.args[0]))
                        if isinstance(node.args[0], ast.Dict):
                            operations.update(operation for value in node.args[0].values for operation in labels(value))
                    if function == 'groupby' and node.args and isinstance(node.func, ast.Attribute) and frame_expression(node.func.value):
                        read_columns.update(labels(node.args[0]))
                        columns.update(labels(node.args[0]))
                    if function == 'insert' and len(node.args) >= 2 and isinstance(node.func, ast.Attribute) and frame_expression(node.func.value):
                        derived_columns.update(labels(node.args[1]))
                        columns.update(labels(node.args[1]))
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
        output_columns.update(columns - input_columns - derived_columns - read_columns)
        metadata = merge_metadata(provided_metadata(lesson), provided_metadata(item), authored_metadata(lesson), authored_metadata(item))
        # Observation units are authored descriptions of real-world entities,
        # not field references. A stone/sample/ticket ID can share that noun.
        # Preserve the structured row-unit phrase wherever a task uses it.
        unit = item.get('observationUnit')
        if isinstance(unit, str) and unit:
            metadata = merge_metadata(metadata, {'occurrences': [
                {'text': unit, 'role': 'prose', 'before': prefix, 'scope': 'task'}
                for prefix in ('Each row is ', 'Each row represents ', 'Each observation is ', 'Each observation represents ')
            ]})
        scopes = {}
        for scope, owner in [('guide', (lesson or {}).get('guide')), ('teaching', item.get('teaching'))]:
            scoped = authored_metadata(owner)
            if scoped:
                scopes[scope] = scoped
        for owner in (lesson or {}, item):
            identifiers = owner.get('identifiers', {})
            if isinstance(identifiers, dict):
                for scope, scoped in identifiers.get('scopes', {}).items():
                    scopes[scope] = merge_metadata(scopes.get(scope, {}), authored_metadata({'identifiers': scoped}))
        # Keep old flat arrays for consumers and diagnostics. Explicit metadata
        # wins in the renderer even when code has the same name in another role.
        for name, meaning in metadata.get('semantics', {}).items():
            if meaning['role'] == 'column':
                columns.add(name)
                {'input': input_columns, 'derived': derived_columns, 'output': output_columns}.get(meaning.get('kind'), set()).add(name)
            if meaning['role'] == 'variable':
                variables.add(name)
                if meaning.get('kind') == 'example':
                    example_variables.add(name)
        result[item['id']] = dict(columns=sorted(columns), variables=sorted(variables), keys=sorted(keys - columns - variables), instructionObjects=sorted(instruction_objects),
                                inputColumns=sorted(input_columns), derivedColumns=sorted(derived_columns), outputColumns=sorted(output_columns),
                                exampleVariables=sorted(example_variables), functions=sorted(functions), parameters=sorted(parameters), operations=sorted(operations), **metadata)
        if scopes:
            result[item['id']]['scopes'] = scopes

    lessons_by_id = {lesson['id']: lesson for lesson in data['curriculum']['lessons']}
    for lesson in data['curriculum']['lessons']:
        for item in lesson['rounds']:
            teaching_source = lessons_by_id.get(item.get('retrieves'), lesson)
            add(item, data['curriculum']['datasets'][item['dataset']]['columns'], lesson=teaching_source)
    for item in data['challenges']:
        add(item, [key for source in item['inputs'] for key in source.get('columns', {})], [source.get('name', '') for source in item['inputs']])
    for card in ml['cards']:
        for item in card['exercises']:
            dataset = datasets.get(item.get('dataset') or card.get('dataset'), {})
            cols = dataset.get('columns', [])
            cols = list(cols) if isinstance(cols, dict) else cols
            cols += [entry[0] for entry in item.get('dictionary', [])]
            add(item, cols, lesson=card)
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
