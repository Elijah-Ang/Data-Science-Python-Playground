"""Reviewed per-exercise support; missing entries are authoring errors, never boilerplate."""
from pathlib import Path

TASKS = {
 'ML-R04-1':'Return named distance and weight coefficients from the supplied fitted two-feature line.',
 'ML-C10-1':'Use the supplied fitted scaled SVM to predict held-away labels.',
 'ML-C12-1':'Store the fitted One-R classifier’s rules_ dictionary in answer.',
 'ML-C17-1':'Build answer as a table of fitted LDA means, with model.classes_ as rows and X_train column names as columns.',
 'ML-U07-1':'Store the supplied Ward linkage matrix for scaled CLUSTER36 in answer.',
 'ML-P02-1':'Store the supplied PCA component scores for every PCA48 row in answer.',
}

def apply(registry):
    entries={}
    for path in sorted((Path(__file__).parent/'editorial').glob('*.tsv')):
        for line in path.read_text().splitlines():
            if not line or line.startswith('#'):continue
            parts=line.split('|')
            assert len(parts)==5,(path,line)
            key,think,tools,approach,why=parts
            key='ML-'+key
            assert key not in entries,key
            entries[key]=(think,tools,approach,why)
    exercises=[e for c in registry['cards'] for e in c['exercises']]+[c['exercise'] for c in registry['challenges']]
    assert set(entries)=={e['id'] for e in exercises},('Editorial inventory mismatch',set(entries)^{e['id'] for e in exercises})
    for e in exercises:
        think,tools,approach,why=entries[e['id']]
        e['hints']=dict(think=think,tools=tools,approach=approach)
        if why!='@answer':
            e['explanation']=why
            if e['kind']!='python':e['solution']=why
        if e['id'] in TASKS:e['task']=TASKS[e['id']]
    for c in registry['challenges']:
        c['hints']=c['exercise']['hints']
        c['explanationSteps']=[c['exercise']['explanation']]
    from packages import required
    for e in exercises:
        if e['kind']=='python':e['packages']=required(e)
    return registry
