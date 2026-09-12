"""Computed-style contract in actual production pages, light/dark at every breakpoint.

Real controls/cells plus identical output primitives in their real output containers
make the CSS comparison deterministic even when each page prints different data.
Existing Data/ML differences are explicitly bounded; Stats must match canonical ML
for those properties. No arbitrary Statistics-only property value is permitted.
"""
PROPS=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft']
SELECTORS={
    'brand':'.brand h1','topbar':'.topbar','navigation':'.mode-link',
    'control label':'.control label, .eyebrow','select':'#datasetSelect',
    'Inspector':'.panel-head h2','source':'.source-block',
    'notebook toolbar':'#runAllButton','notebook heading':'.notebook-bar h3',
    'editor':'.code-input','cell header':'.cell-head','cell label':'.cell-label',
    'output heading':'.output-head h3','output header':'[data-visual-probe] .output-item-head strong',
    'console':'[data-visual-probe] .console-output',
    'table heading':'[data-visual-probe] th','table value':'[data-visual-probe] td',
    'route':'.route-card, .route-task'}
# Data's established typography/layout differences are not a license for Stats drift.
LEGACY=set()


def install_probes(pages):
    for page in pages.values():
        page.add_style_tag(content='*, *::before, *::after {transition:none!important;animation:none!important}')
        page.mouse.move(0,0)
        page.evaluate('''()=>{const p=document.createElement('div');p.dataset.visualProbe='';p.style.cssText='position:absolute;visibility:hidden;width:200px;pointer-events:none;';p.innerHTML='<div class="output-item"><div class="output-item-head"><strong>Output</strong></div><pre class="console-output">Python output</pre><div class="result-table-wrap"><table class="result-table"><thead><tr><th>category</th></tr></thead><tbody><tr><td>Observed</td></tr></tbody></table></div></div>';document.querySelector('.output-panel').append(p);}''')


def compare(pages,width,theme):
    samples={name:page.evaluate('''({selectors,props})=>Object.fromEntries(Object.entries(selectors).map(([name,q])=>{const e=document.querySelector(q);if(!e)throw Error('Missing representative '+name);const s=getComputedStyle(e);return [name,Object.fromEntries(props.map(k=>[k,s[k]]))]}))''',{'selectors':SELECTORS,'props':PROPS}) for name,page in pages.items()}
    failures=[]
    for component in SELECTORS:
        for prop in PROPS:
            values={name:s[component][prop] for name,s in samples.items()}
            if len(set(values.values()))==1:continue
            # State colors of route cards intentionally reflect different route progress.
            if component=='route' and prop in ('color','backgroundColor'):continue
            if (component,prop) not in LEGACY or values['statistics']!=values['ml']:failures.append((component,prop,values))
    # Expanded study controls use the same label/select primitives as the top rail.
    page=pages['statistics']
    for selector,canonical in [('.study-field > label:not(.check-label)','control label'),('.study-field select','select')]:
        actual=page.locator(selector).first.evaluate('(e,props)=>{const s=getComputedStyle(e);return Object.fromEntries(props.map(k=>[k,s[k]]))}',PROPS)
        assert actual==samples['statistics'][canonical],(width,theme,selector,actual,samples['statistics'][canonical])
    assert not failures,(width,theme,failures)
    return samples
