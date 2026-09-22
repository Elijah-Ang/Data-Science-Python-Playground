"""Small activity package manifest derived from reviewed runnable code."""
import ast
NAMES={'numpy':'numpy','pandas':'pandas','sklearn':'scikit-learn','scipy':'scipy','matplotlib':'matplotlib','ml_helpers':'scikit-learn'}
def required(exercise):
    packages={'numpy','pandas'}
    for source in [exercise.get('setup',''),exercise.get('solution','')]:
        for node in ast.walk(ast.parse(source)):
            names=[a.name for a in node.names] if isinstance(node,ast.Import) else [node.module or ''] if isinstance(node,ast.ImportFrom) else []
            packages.update(NAMES[n.split('.')[0]] for n in names if n.split('.')[0] in NAMES)
    if exercise.get('protect'):packages.add('scikit-learn')
    return sorted(packages)
