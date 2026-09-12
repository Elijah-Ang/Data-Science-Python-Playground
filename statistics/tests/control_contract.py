"""Browser proof that the production selectors expose the audited domain."""
import json
from pathlib import Path

D=json.loads((Path(__file__).resolve().parents[1]/'controls.json').read_text())


def audit_controls(page, choose, ready):
    def values(id):return page.locator('#'+id+' option').evaluate_all('(xs)=>xs.map(x=>x.value)')
    assert values('confidence')==[str(c) for c in D['confidence']]
    assert values('familySelect')==list(D['families'])
    for family,datasets in D['families'].items():
        choose(page,'familySelect',family)
        assert values('datasetSelect')==datasets
        for dataset in datasets:
            choose(page,'datasetSelect',dataset)
            if page.locator('#studyPanel').is_hidden():page.locator('#studyButton').click()
            c=page.evaluate('StatisticsPlayground.config')
            if family in ('proportions','goodness'):
                assert values('outcome')==D['categorical'][dataset]
            elif family=='categorical':
                assert values('x')==values('y')==D['categorical'][dataset]
                assert page.locator(f'#y option[value="{c["x"]}"]').is_disabled()
            else:assert values('y')==D['numeric'][dataset]
            if family in D['goals']:assert values('goal')==D['goals'][family]
            if family=='association':
                assert values('x')==D['numeric'][dataset]
                assert page.locator(f'#x option[value="{c["y"]}"]').is_disabled()
            if family=='paired':
                assert values('before')==[str(y) for y in D['years'][:-1]]
                assert values('after')==[str(y) for y in D['years']]
                choose(page,'before',2002)
                assert page.locator('#after option:not(:disabled)').evaluate_all('(xs)=>xs.map(x=>x.value)')==['2007']
            if family=='factorial':
                for count in D['factorCounts']:
                    choose(page,'factorCount',count)
                    assert len(values('factorOrder'))==(2 if count==2 else 6)
                    for order in values('factorOrder'):
                        choose(page,'factorOrder',order)
                        assert page.evaluate('StatisticsPlayground.plan.config.factors')==order.split('|')
                        for i in range(count):
                            other=order.split('|')[(i+1)%count]
                            assert page.locator(f'#factor{i} option[value="{other}"]').is_disabled()
            if family=='proportions':
                assert values('structure')==D['structures']
                choose(page,'structure','two')
                for outcome in D['categorical'][dataset]:
                    choose(page,'outcome',outcome)
                    assert values('success')==D['categories'][dataset][outcome]
                    assert outcome not in values('group')
                    state=page.evaluate('StatisticsPlayground.config')
                    assert state['outcome']!=state['group']
                    assert page.locator(f'#levelB option[value="{state["levels"][0]}"]').is_disabled()
            if family=='goodness':assert values('expected_mode')==D['expectedModes']
    print('PASS production controls: audited domains, disabled invalid choices, all factorial comparison orders',flush=True)
