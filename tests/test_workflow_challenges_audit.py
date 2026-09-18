"""Adversarial and equivalence checks from the independent workflow audit."""
# The reference suite also runs here, so both share exactly the worker's Python path.
from test_workflow_challenges import challenges, run, states
import tempfile, os
from pathlib import Path
with tempfile.TemporaryDirectory() as folder:
    previous=os.getcwd()
    try:
        os.chdir(folder)
        # Every challenge independently rejects a wrong output and keeps checking others.
        for id,c in challenges.items():
            output=next(d for d in c['deliverables'] if d['kind'] not in ('figure','export'))
            result=run(id,c['reference']+'\n'+output['name']+' = "incorrect output type"')
            assert states(result)[output['id']]=='needs-attention',id
            assert len(result['deliverables']) >= len(c['deliverables']),id
            result=run(id,c['reference']+'\ndel '+output['name'])
            assert states(result)[output['id']]=='unavailable',id
            assert any(d['status']=='correct' for d in result['deliverables']),id
        # Policy-bearing fixtures catch plausible mistakes, not just changed constants.
        negatives=[
            ('IC03', "eligible = df[df.hours.notna() & df.score.notna()]", 'eligible = df.dropna()', 'eligible'),
            ('WC03', "dropna(subset=['student', 'date'])", 'dropna()', 'clean'),
            ('WC04', "subset=['order_id']", "subset=[c for c in df.columns if c != 'order_id']", 'clean'),
            ('VC06', "df.attended & df.score.notna()", 'df.score.notna()', 'observations'),
            ('VC01', 'fig.tight_layout()', 'ax.patches[0].set_x(0.2)\nfig.tight_layout()', 'fig'),
            ('VC03', 'fig.tight_layout()', 'ax.collections[0].set_alpha(0)\nfig.tight_layout()', 'fig'),
            ('VC04', 'fig.tight_layout()', "ax.lines[0].set_linestyle('None')\nfig.tight_layout()", 'fig'),
            ('VC07', 'fig.tight_layout()', '[p.remove() for p in list(ax.patches)]\nfig.tight_layout()', 'fig'),
            ('VC07', 'fig.tight_layout()', "[l.set_visible(False) for l in ax.lines if l.get_marker() not in ('None', '', None)]\nfig.tight_layout()", 'fig'),
            ('VC08', 'ax.legend()', "ax.lines[-1].set_label('_nolegend_')\nax.legend()", 'fig'),
        ]
        for id,old,new,output in negatives:
            assert old in challenges[id]['reference'],(id,old)
            r=run(id,challenges[id]['reference'].replace(old,new))
            assert states(r)[output]=='needs-attention',(id,r['deliverables'])
        # Corrupt exports must fail one deliverable, not crash the entire checker.
        r=run('VC10',challenges['VC10']['reference']+"\nwith open('challenge.png', 'w') as file:\n    file.write('not a PNG')")
        assert states(r)['export']=='needs-attention' and states(r)['fig']=='correct'
        assert not any(o['kind']=='download' for o in r['outputs'])
        # Legitimate approaches: bar construction order, point comparisons, reindexed observations.
        c=challenges['VC01']
        code=c['reference'].replace('ax.bar(counts.index, counts.values)', "ax.set_xticks(range(len(counts)), counts.index)\nfor i in reversed(range(len(counts))):\n    ax.bar(i, counts.iloc[i])")
        assert run('VC01',code)['passed']
        for id,name in [('VC01','counts'),('VC05','means'),('VC10','units')]:
            c=challenges[id]
            old=next(line for line in c['solution'].splitlines() if line.startswith('ax.bar('))
            code=c['reference'].replace(old,f'ax.scatter({name}.index, {name}.values)')
            assert run(id,code)['passed'],id
        assert run('VC02',challenges['VC02']['reference']+'\ndurations = durations.reset_index(drop=True)')['passed']
        r=run('IC08',challenges['IC08']['reference']+"\nraise ValueError('after outputs')")
        assert not r['passed'] and 'stopped' in r['feedback']
        # Supplied setup is exactly the declared preview fixture in all thirty challenges.
        from test_workflow_challenges import ns
        for id,c in challenges.items():
            env=ns['_execute'](c['setup'],{},construction=True,explicit_setup=True)['env']
            for inp in c['inputs']:
                if not inp.get('file'):
                    ns['_challenge_frame_equal'](env[inp['name']],ns['pd'].DataFrame(inp['columns']),True)
    finally:
        os.chdir(previous)
print('Audit: all 30 wrong/missing-output cases, policy traps, chart visibility/geometry, corrupt PNG and valid alternatives passed.')
