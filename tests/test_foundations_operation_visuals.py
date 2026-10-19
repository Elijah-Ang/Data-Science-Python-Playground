"""Run every displayed operation on the same inputs in real pandas/sklearn.

This is deliberately independent of the JavaScript calculations: the authored
Python is evaluated and its native labels, cells and values must match the UI.
"""
import ast
import json
import math
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = """
const v=require('./foundations/operation-visuals.js');
function expand(fields,state={},at=0){if(at===fields.length)return [state];return fields[at].options.flatMap(([value])=>expand(fields,{...state,[fields[at].key]:value},at+1));}
console.log(JSON.stringify(v.ids.flatMap(id=>expand(v.operationArguments(id)).map(args=>({
  ...v.evaluate(id,args.choice,args), setup:v.pythonSetup(id,args.choice,args), arguments:args
})))));
"""
states = json.loads(subprocess.check_output(['node', '-e', SCRIPT], cwd=ROOT))


def clean(value):
    if value is None or value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if math.isnan(value) else float(value)
    if isinstance(value, pd.Timestamp):
        return value.strftime('%Y-%m-%d')
    return value


def same(actual, expected, context):
    if isinstance(expected, list):
        assert len(actual) == len(expected), (context, actual, expected)
        for i, (left, right) in enumerate(zip(actual, expected)):
            same(left, right, f'{context}[{i}]')
    elif isinstance(expected, (int, float)) and not isinstance(expected, bool):
        assert isinstance(actual, (int, float)) and not isinstance(actual, bool), (context, actual, expected)
        np.testing.assert_allclose(actual, expected, rtol=1e-12, atol=1e-12, err_msg=context)
    else:
        assert actual == expected, (context, actual, expected)


def check_result(actual, expected, context):
    kind = expected['kind']
    if kind == 'scalar':
        same(clean(actual), expected['value'], context)
    elif kind == 'list':
        same([clean(value) for value in actual], expected['values'], context)
    else:
        if kind == 'array':
            assert isinstance(actual, np.ndarray), (context, type(actual))
            cells = actual.tolist()
        elif kind == 'series':
            assert isinstance(actual, pd.Series), (context, type(actual))
            same([clean(value) for value in actual.index], expected['index'], context + ' index')
            if actual.name is not None:
                same(actual.name, expected['columns'][0], context + ' Series name')
            if expected.get('indexName'):
                same(actual.index.name, expected['indexName'], context + ' index name')
            cells = [[value] for value in actual.tolist()]
        else:
            assert isinstance(actual, pd.DataFrame), (context, type(actual))
            same(list(actual.columns), expected['columns'], context + ' columns')
            same([clean(value) for value in actual.index], expected['index'], context + ' index')
            if expected.get('indexName'):
                same(actual.index.name, expected['indexName'], context + ' index name')
            cells = actual.to_numpy(dtype=object).tolist()
        same([[clean(value) for value in row] for row in cells], expected['rows'], context + ' cells')


for state in states:
    namespace = {}
    exec(state['setup'], namespace)
    tree = ast.parse(state['code'])
    assert isinstance(tree.body[-1], ast.Expr), state['id']
    prefix = ast.Module(body=tree.body[:-1], type_ignores=[])
    exec(compile(prefix, '<operation visual>', 'exec'), namespace)
    actual = eval(compile(ast.Expression(tree.body[-1].value), '<operation result>', 'eval'), namespace)
    context = state['id'] + '/' + state['choice']
    check_result(actual, state['result'], context)
    if state.get('intermediate'):
        check_result(namespace['means'], state['intermediate'], context + ' intermediate means')

print(json.dumps({'lessons': len({state['id'] for state in states}), 'native_operation_states': len(states),
                  'oracles': ['pandas labelled operations', 'NumPy array values', 'sklearn StandardScaler'],
                  'passed': True}, indent=2))
