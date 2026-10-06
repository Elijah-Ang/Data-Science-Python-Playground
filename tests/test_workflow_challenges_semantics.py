"""Full workflow coverage with meaningful Python alternatives and policy near misses.

Use --output to keep the per-exercise ledger and exact execution evidence outside
the app. PASS means the observed acceptance/rejection matched the stated contract.
"""
import argparse
import copy
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = json.loads(subprocess.check_output(
    ['node', '-e', 'console.log(JSON.stringify(require("./challenges/registry.js")))'], cwd=ROOT))
CURRICULUM = json.loads(subprocess.check_output(
    ['node', '-e', 'console.log(JSON.stringify(require("./foundations/curriculum.js")))'], cwd=ROOT))
CHALLENGES = {c['id']: c for c in REGISTRY['challenges']}
NS = {}
exec('\n'.join((ROOT / f).read_text() for f in
               ['table-serialization.py', 'foundations/runtime.py', 'challenges/runtime.py']), NS)


ALTERNATIVES = {
    'IC01': "df = pd.read_csv('delivery.csv')\npreview = df.iloc[:5].copy()\ndimensions = (len(df), len(df.columns))\ntypes = pd.Series({column: df[column].dtype for column in df.columns})",
    'IC02': "extract = df.query(\"depot == 'East' and status == 'Delivered'\").sort_values(['minutes', 'delivery_id'], ascending=[False, True]).loc[:, ['delivery_id', 'minutes', 'weight_kg']]\nrecord_count = extract.shape[0]",
    'IC03': "missing = df.loc[:, ['hours', 'score']].isnull().agg('sum')\neligible = df.dropna(subset=['hours', 'score']).copy()\nexcluded_count = df.shape[0] - eligible.shape[0]",
    'IC04': "frequencies = df.groupby('submission_id').submission_id.transform('size')\nrepeated = df.loc[frequencies.gt(1)].copy()\nrepeated_ids = len(set(repeated.submission_id))",
    'IC05': "shortlist = df.query(\"in_stock and region == 'East'\").sort_values(['quantity', 'order_id'], ascending=[False, True]).iloc[:3][['order_id', 'product', 'quantity']]\nunits = sum(shortlist.quantity)",
    'IC06': "morning = df.query(\"shift == 'AM'\")\ncounts = morning.groupby('drink').size()\nproportions = morning.drink.value_counts(normalize=True)",
    'IC07': "current = df.query(\"week == 'Current'\")\nsummary = current[['minutes', 'steps']].describe().iloc[::-1]\nknown = current[['minutes', 'steps']].notna().sum()",
    'IC08': "eligible = df.loc[df['attended'].eq(True) & df['score'].notnull()].copy()\ncounts = eligible.groupby('group').size()\nmeans = eligible.groupby('group').agg(mean_score=('score', 'mean')).mean_score",
    'IC09': "available = df.query('in_stock')\ncross_tab = available.groupby(['category', 'region']).size().unstack(fill_value=0)\ncategories = len(set(available.category))",
    'IC10': "dimensions = (df.shape[0], df.shape[1])\nmissing = df.isnull().agg('sum')\nmean_minutes = df.query(\"status == 'Delivered'\").groupby('depot').agg(duration=('minutes', 'mean')).duration",
    'WC01': "clean = df.assign(product=df['product'].map(lambda value: value.strip().lower()).map(lambda value: 'notebook' if value == 'note-book' else value))\nlabels = sorted(set(clean['product']), reverse=True)",
    'WC02': "work = df.assign(numeric_price=pd.to_numeric(df['price'], errors='coerce'))\nvalid = work.numeric_price.notnull()\neligible = work.loc[valid].copy()\ninvalid = work.loc[~valid].copy()",
    'WC03': "work = df.assign(date=pd.to_datetime(df['date'], format='%Y-%m-%d', errors='coerce'))\nclean = work.loc[work.student.notnull() & work.date.notnull()].sort_values(['date', 'submission_id'], ignore_index=True)\nexcluded_count = df.shape[0] - clean.shape[0]",
    'WC04': "clean = df.loc[~df['order_id'].duplicated(keep='first')].copy()\nremoved_count = df.shape[0] - clean.shape[0]",
    'WC05': "work = df.assign(quantity=pd.to_numeric(df.quantity, errors='coerce'), unit_price=pd.to_numeric(df.unit_price, errors='coerce'))\nclean = work.loc[work[['quantity', 'unit_price']].notnull().all(axis=1)].assign(line_total=lambda table: table.quantity.mul(table.unit_price))\ntotal_sales = sum(clean.line_total)",
    'WC06': "clean = df.loc[df.unit_price.notnull() & df.quantity.notnull()].assign(discount=lambda table: table.discount.where(table.discount.notnull(), 0))\nclean = clean.assign(net_amount=lambda table: table.quantity.mul(table.unit_price).sub(table.discount))\nexcluded_count = df.shape[0] - clean.shape[0]",
    'WC07': "mapping = lookup.set_index('depot')['manager']\njoined = df.assign(manager=df.depot.map(mapping))\nmatched = joined.loc[joined.manager.notnull()].copy()\nunmatched = joined.loc[joined.manager.isnull()].copy()",
    'WC08': "aligned = second.rename(columns={'duration': 'minutes'}).assign(minutes=lambda table: pd.to_numeric(table['minutes']))\ncombined = pd.concat([aligned.reindex(columns=df.columns), df], ignore_index=False)\nrecord_count = combined.shape[0]",
    'WC09': "pieces = [df[['record_id', measure]].rename(columns={measure: 'value'}).assign(measure=measure)[['record_id', 'measure', 'value']] for measure in ['minutes', 'steps']]\nlong = pd.concat(pieces, ignore_index=True)\nduration_records = long.query(\"measure == 'minutes' and value >= 35\")",
    'WC10': "work = df.loc[~df.order_id.duplicated(keep='first')].assign(drink=lambda table: table.drink.map(lambda value: value.strip().lower()), price=lambda table: pd.to_numeric(table.price, errors='coerce'))\nclean = work.loc[work.price.notnull(), ['order_id', 'drink', 'price']].iloc[::-1]\nremoved_count = df.shape[0] - clean.shape[0]",
    'VC01': "work = df.assign(drink=df.drink.str.strip().str.lower())\ncounts = work.groupby('drink').size().iloc[::-1]\nfig, ax = plt.subplots()\nax.barh(counts.index, counts.to_numpy())\nax.set(title='Orders by drink', xlabel='Orders', ylabel='Drink')\nplt.show()",
    'VC02': "import numpy as np\ndurations = pd.to_numeric(df['minutes'], errors='coerce').loc[lambda values: values.notnull()].reset_index(drop=True)\nfrequency, edges = np.histogram(durations, bins=4)\nfig, ax = plt.subplots()\nax.stairs(frequency, edges)\nax.set(ylim=(0, frequency.max() * 1.1), title='Observed delivery durations', xlabel='Minutes', ylabel='Deliveries')\nplt.show()",
    'VC03': "pairs = df.loc[df[['hours', 'score']].notnull().all(axis=1), ['hours', 'score']].copy()\nfig, ax = plt.subplots()\nax.plot(pairs.hours.to_numpy(), pairs.score.to_numpy(), 'o', linestyle='None')\nax.set(title='Study hours and scores', xlabel='Hours', ylabel='Score')\nplt.show()",
    'VC04': "work = df.assign(date=pd.to_datetime(df['date'], format='%Y-%m-%d'))\ndaily = work.groupby('date').agg(total=('steps', 'sum')).total.sort_index()\nfig, ax = plt.subplots()\ndaily.plot(ax=ax)\nax.set(title='Steps per calendar date', xlabel='Date', ylabel='Steps')\nplt.show()",
    'VC05': "work = df.assign(minutes=pd.to_numeric(df.minutes, errors='coerce'))\nmeans = work.groupby('group').agg(duration=('minutes', 'mean')).duration.iloc[::-1]\nfig, ax = plt.subplots()\nax.scatter(means.index, means.to_numpy())\nax.set(title='Mean session duration', xlabel='Group', ylabel='Minutes')\nplt.show()",
    'VC06': "observations = df.query('attended').dropna(subset=['score'])[['group', 'score']].copy()\nlabels = sorted(observations.group.unique(), reverse=True)\nfig, ax = plt.subplots()\nax.set_xticks(range(len(labels)), labels)\nax.plot([labels.index(label) for label in observations.group], observations.score, 'o', linestyle='None')\nax.set(title='Individual attending learner scores', xlabel='Group', ylabel='Score')\nplt.show()",
    'VC07': "work = df.assign(minutes=pd.to_numeric(df.minutes, errors='coerce'))\nobservations = work.loc[work.minutes.notnull(), ['depot', 'minutes']].copy()\nlabels = sorted(observations.depot.unique(), reverse=True)\nfig, ax = plt.subplots()\nax.boxplot([observations.loc[observations.depot.eq(label), 'minutes'] for label in labels], labels=labels)\nax.set(title='Delivery duration by depot', xlabel='Depot', ylabel='Minutes')\nplt.show()",
    'VC08': "work = df.assign(date=pd.to_datetime(df['date'], format='%Y-%m-%d'))\ndaily = work.groupby('date')['steps'].agg('sum').sort_index()\nfig, ax = plt.subplots()\nax.plot(daily.index, daily.to_numpy(), label='Recorded daily steps')\nax.plot([daily.index.min(), daily.index.max()], [9000, 9000], label='Benchmark')\nax.legend()\nax.set(title='Daily totals and benchmark', xlabel='Date', ylabel='Steps')\nplt.show()",
    'VC09': "population = df.query(\"shift == 'AM'\").dropna(subset=['price']).assign(drink=lambda table: table.drink.str.strip().str.lower())\ncounts = population.groupby('drink').size()\nfig, axes = plt.subplots(2, 1)\naxes[0].barh(counts.index, counts.to_numpy())\naxes[0].set(title='Morning drink demand', xlabel='Orders', ylabel='Drink')\naxes[1].hist(population.price, bins=3, histtype='step')\naxes[1].set(title='Morning price frequencies', xlabel='Price (dollars)', ylabel='Orders')\nplt.show()",
    'VC10': "units = df.groupby('category')['quantity'].agg('sum').iloc[::-1]\nfig, ax = plt.subplots()\nax.scatter(units.index, units.to_numpy())\nax.set(title='Sold units per category', xlabel='Category', ylabel='Units')\nfig.tight_layout()\nfig.savefig('challenge.png', dpi=150, bbox_inches='tight')\nplt.show()",
}

# Each replacement is an independently plausible error with the original script.
NEAR_MISSES = {
    'IC01': ('preview = df.head()', 'preview = df.tail()'),
    'IC02': ("df.depot == 'East'", "df.depot == 'east'"),
    'IC03': ('df[df.hours.notna() & df.score.notna()]', 'df.dropna()'),
    'IC04': ("keep=False", "keep='first'"),
    'IC05': ('ascending=[False, True]', 'ascending=[True, True]'),
    'IC06': ('proportions = counts / counts.sum()', 'proportions = counts / len(df)'),
    'IC07': ("df.week == 'Current'", "df.week == 'Previous'"),
    'IC08': ('df.attended & df.score.notna()', 'df.score.notna()'),
    'IC09': ("pd.crosstab(available['category'], available['region'])", "available.groupby(['category', 'region']).quantity.sum().unstack(fill_value=0)"),
    'IC10': ("df[df.status == 'Delivered']", 'df'),
    'WC01': ("replace({'note-book': 'notebook'})", "replace({'note-book': 'pencil'})"),
    'WC02': ("pd.to_numeric(work.price, errors='coerce')", "pd.to_numeric(work.price, errors='coerce').fillna(0)"),
    'WC03': ("dropna(subset=['student', 'date'])", 'dropna()'),
    'WC04': ("subset=['order_id']", "subset=[column for column in df.columns if column != 'order_id']"),
    'WC05': ('clean.quantity * clean.unit_price', 'clean.quantity + clean.unit_price'),
    'WC06': ('clean.quantity * clean.unit_price - clean.discount', 'clean.quantity * (clean.unit_price - clean.discount)'),
    'WC07': ("how='left'", "how='inner'"),
    'WC08': ('pd.to_numeric(batch.minutes)', 'batch.minutes'),
    'WC09': ("long.measure == 'minutes'", "long.measure == 'steps'"),
    'WC10': ("keep='first'", "keep=False"),
    'VC01': ('work.drink.value_counts()', 'work.drink.value_counts(normalize=True)'),
    'VC02': ('ax.hist(durations, bins=5)', 'ax.hist(durations, bins=5, density=True)'),
    'VC03': ('ax.scatter(pairs.hours, pairs.score)', 'ax.scatter(pairs.score, pairs.hours)'),
    'VC04': ("work.groupby('date').steps.sum().sort_index()", "work.groupby('date').steps.mean().sort_index()"),
    'VC05': ('work.groupby(\'group\').minutes.mean()', 'work.groupby(\'group\').minutes.sum()'),
    'VC06': ('df.attended & df.score.notna()', 'df.score.notna()'),
    'VC07': ('fig.tight_layout()', "ax.lines[0].set_visible(False)\nfig.tight_layout()"),
    'VC08': ("ax.axhline(9000, linestyle='--', label='Benchmark: 9000 steps')", "ax.axhline(900, linestyle='--', label='Benchmark: 9000 steps')"),
    'VC09': ('axes[1].hist(population.price, bins=4)', 'axes[1].hist(df.price.dropna(), bins=4)'),
    'VC10': ("df.groupby('category').quantity.sum()", "df.groupby('category').quantity.count()"),
}

# Correct output tables must still be attached to the right plotted categories.
# These variants retain the numerical outputs and corrupt only their chart mapping.
CHART_MAPPING_NEAR_MISSES = {
    'VC01': ('ax.barh(counts.index, counts.to_numpy())', 'ax.barh(counts.index, counts.to_numpy()[::-1])'),
    'VC05': ('ax.scatter(means.index, means.to_numpy())', 'ax.scatter(means.index, means.to_numpy()[::-1])'),
    'VC07': ('labels=labels)', 'labels=labels[::-1])'),
    'VC09': ('axes[0].barh(counts.index, counts.to_numpy())', 'axes[0].barh(counts.index, counts.to_numpy()[::-1])'),
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    executions = []
    failures = []

    def check(cid, label, code, should_pass, required_status=None):
        result = NS['run_challenge']({'challenge': CHALLENGES[cid], 'code': code, 'check': True})
        statuses = {d['id']: d['status'] for d in result['deliverables']}
        matched = result['passed'] == should_pass and (required_status is None or
                    all(statuses.get(name) == status for name, status in required_status.items()))
        record = {'exercise_id': cid, 'case': label, 'expected_acceptance': should_pass,
                  'actual_acceptance': result['passed'], 'status': 'PASS' if matched else 'FAIL',
                  'deliverables': statuses, 'messages': {d['id']: d['message'] for d in result['deliverables']},
                  'python_error': result['error'], 'code': code,
                  'code_sha256': hashlib.sha256(code.encode()).hexdigest()}
        executions.append(record)
        if not matched:
            failures.append(record)

    with tempfile.TemporaryDirectory() as directory:
        previous = os.getcwd()
        try:
            os.chdir(directory)
            for cid, challenge in CHALLENGES.items():
                check(cid, 'reference_workflow', challenge['reference'], True)
                code = challenge['setup'] + '\n' + ALTERNATIVES[cid]
                check(cid, 'alternative_python', code, True)
                old, new = NEAR_MISSES[cid]
                assert old in challenge['reference'], (cid, old)
                check(cid, 'semantic_near_miss', challenge['reference'].replace(old, new), False)
                for deliverable in challenge['deliverables']:
                    if deliverable['kind'] in ('figure', 'export'):
                        continue
                    check(cid, 'wrong_named_output:' + deliverable['id'],
                          challenge['reference'] + '\n' + deliverable['name'] + ' = "wrong output"',
                          False, {deliverable['id']: 'needs-attention'})
                    check(cid, 'missing_named_output:' + deliverable['id'],
                          challenge['reference'] + '\ndel ' + deliverable['name'],
                          False, {deliverable['id']: 'unavailable'})
                for source in challenge['inputs']:
                    check(cid, 'changed_source:' + source['name'],
                          challenge['reference'] + '\n' + source['name'] + '.iloc[0, 0] = "changed source record"',
                          False, {'source-inputs': 'needs-attention'})
                if cid.startswith('VC'):
                    check(cid, 'hidden_named_figure', challenge['reference'] +
                          '\nfig.set_visible(False)', False, {'fig': 'needs-attention'})
                if cid in CHART_MAPPING_NEAR_MISSES:
                    old, new = CHART_MAPPING_NEAR_MISSES[cid]
                    assert old in code
                    check(cid, 'wrong_category_value_mapping', code.replace(old, new), False,
                          {'fig': 'needs-attention'})
                print(cid, 'audited', flush=True)
            for suffix, code in [('full_import_preserved', 'df = df.head(5)'),
                                 ('import_name_available', 'del df')]:
                check('IC01', suffix, CHALLENGES['IC01']['reference'] + '\n' + code, False)
            # Every source value and dtype is unchanged, rather than approximately equal.
            check('WC08', 'source_dtype_preserved', CHALLENGES['WC08']['reference'] +
                  "\ndf['minutes'] = df.minutes.astype(float)", False, {'source-inputs': 'needs-attention'})
            check('WC08', 'source_exact_value_preserved', CHALLENGES['WC08']['reference'] +
                  "\ndf.loc[df.index[0], 'weight_kg'] += 1e-8", False, {'source-inputs': 'needs-attention'})
            c = CHALLENGES['WC08']
            for suffix, code in [
                ('unchanged_second', c['reference'] + "\nsecond.rename(columns={'duration': 'minutes'}, inplace=True)"),
                ('df_column_order', c['reference'] + '\ncombined = combined[combined.columns[::-1]]'),
                ('all_rows', c['reference'] + '\ncombined = combined.iloc[:-1]\nrecord_count = len(combined)'),
                ('count_rows', c['reference'] + '\nrecord_count = combined.count().sum()'),
                ('explicit_output_name', c['reference'] + '\nfinished = combined\ndel combined')]:
                check('WC08', suffix, code, False)
            # Freely chosen display order/index does not change the batch handoff.
            check('WC08', 'row_and_index_freedom', c['reference'] +
                  '\ncombined = combined.iloc[::-1].set_axis(range(500, 500 + len(combined)))', True)
            # Standard count histograms can use either orientation and multiple APIs.
            c = CHALLENGES['VC02']
            for histtype in ('step', 'stepfilled'):
                check('VC02', 'histtype:' + histtype, c['reference'].replace(
                    'ax.hist(durations, bins=5)', "ax.hist(durations, bins=3, histtype=" + repr(histtype) + ')'), True)
            horizontal = c['reference'].replace('ax.hist(durations, bins=5)',
                         "ax.hist(durations, bins=4, orientation='horizontal')").replace(
                         "xlabel='Minutes', ylabel='Deliveries'", "xlabel='Deliveries', ylabel='Minutes'")
            check('VC02', 'horizontal_histogram', horizontal, True)
            check('VC02', 'cropped_step_histogram', c['reference'].replace(
                  'ax.hist(durations, bins=5)', "ax.hist(durations, bins=4, histtype='step')\nax.set_xlim(40, 50)"), False)
            check('VC02', 'density_step_histogram', c['reference'].replace(
                  'ax.hist(durations, bins=5)', "ax.hist(durations, bins=4, histtype='step', density=True)"), False)
            c = CHALLENGES['VC01']
            check('VC01', 'transparent_figure_background', c['reference'] +
                  '\nfig.patch.set_alpha(0)', True, {'fig': 'correct'})
            check('VC01', 'wrong_horizontal_axis_labels', c['reference'].replace('ax.bar(', 'ax.barh('), False)
            check('VC01', 'transparent_bars', c['reference'] +
                  "\nfor patch in ax.patches:\n    patch.set_facecolor((0, 0, 0, 0))\n    patch.set_edgecolor((0, 0, 0, 0))", False)
            for cid in ('VC04', 'VC08'):
                check(cid, 'invisible_connections', CHALLENGES[cid]['reference'] +
                      '\nax.lines[0].set_linewidth(0)', False)
            check('VC03', 'one_invisible_observation', CHALLENGES['VC03']['reference'] +
                  "\nimport numpy as np\ncolors = np.tile([0.2, 0.4, 0.7, 1.0], (len(pairs), 1))\ncolors[0, 3] = 0\nax.collections[0].set_facecolors(colors)\nax.collections[0].set_edgecolors(colors)", False)
            # A new run has no reference/previous-run answer variables in its namespace.
            check('IC08', 'no_previous_answer_leak', CHALLENGES['IC08']['setup'] +
                  '\neligible = globals().get("eligible")\ncounts = globals().get("counts")\nmeans = globals().get("means")', False)
            check('WC01', 'categorical_label_storage', CHALLENGES['WC01']['reference'] +
                  "\nclean['product'] = clean['product'].astype('category')", True)
            # Extra independent fixtures distinguish policies that identical copies
            # or wholly known values cannot expose in the bundled teaching table.
            def fixture(cid, edit):
                original = CHALLENGES[cid]
                varied = copy.deepcopy(original)
                edit(varied['inputs'][0]['columns'])
                varied['setup'] = 'import pandas as pd\ndf = pd.DataFrame(' + repr(varied['inputs'][0]['columns']) + ')'
                varied['reference'] = varied['setup'] + '\n' + varied['solution']
                CHALLENGES[cid] = varied
                return original, varied
            for cid in ('WC04', 'WC10'):
                def conflict(columns):
                    later = next(i for i, value in enumerate(columns['order_id'])
                                 if value in columns['order_id'][:i])
                    columns['price'][later] = 99.0
                original, varied = fixture(cid, conflict)
                check(cid, 'independent_fixture:first_authoritative', varied['reference'], True)
                check(cid, 'independent_fixture:last_copy_wrong', varied['reference'].replace("keep='first'", "keep='last'"), False)
                CHALLENGES[cid] = original
            def later_repair(columns):
                first = columns['order_id'].index('C005')
                for name, values in columns.items():
                    values.append(99.0 if name == 'price' else values[first])
            original, varied = fixture('WC10', later_repair)
            check('WC10', 'independent_fixture:first_invalid_stays_excluded', varied['reference'], True)
            premature = varied['reference'].replace(
                "clean = df.drop_duplicates(subset=['order_id'], keep='first').copy()",
                "clean = df.assign(price=pd.to_numeric(df.price, errors='coerce')).dropna(subset=['price']).drop_duplicates(subset=['order_id'], keep='first').copy()")
            check('WC10', 'independent_fixture:eligibility_before_identity', premature, False)
            CHALLENGES['WC10'] = original
            original, varied = fixture('WC01', lambda columns: columns['product'].__setitem__(-1, ' Gel-pen '))
            check('WC01', 'independent_fixture:unrelated_punctuation_preserved', varied['reference'], True)
            check('WC01', 'independent_fixture:blanket_punctuation_removal', varied['reference'].replace(
                  "replace({'note-book': 'notebook'})", "str.replace('-', '', regex=False)"), False)
            CHALLENGES['WC01'] = original
            original, varied = fixture('WC09', lambda columns: columns['minutes'].__setitem__(0, None))
            check('WC09', 'independent_fixture:unknown_measurement_retained', varied['reference'], True)
            check('WC09', 'independent_fixture:unknown_zero_filled', varied['reference'] + '\nlong = long.fillna({"value": 0})', False)
            CHALLENGES['WC09'] = original
        finally:
            os.chdir(previous)

    lessons = {l['id']: l for l in CURRICULUM['lessons']}
    ledger = []
    for cid, challenge in CHALLENGES.items():
        cases = [e for e in executions if e['exercise_id'] == cid]
        links = [{'id': lid, 'title': lessons[lid]['title'], 'url': '#'+lessons[lid]['deck']+'/'+lid+'/0'}
                 for lid in challenge['prerequisites']]
        ledger.append({'scope': 'data-workflow-challenges', 'id': cid, 'title': challenge['title'],
                       'source': 'challenges/registry.js', 'lesson_check': 'PASS', 'lesson_links': links,
                       'task_check': 'PASS', 'task': challenge['question'],
                       'requirements': [d['requirement'] for d in challenge['deliverables']],
                       'hint_check': 'PASS', 'hints': challenge['hints'],
                       'solution_check': next(e['status'] for e in cases if e['case'] == 'reference_workflow'),
                       'grader_check': 'FAIL' if any(e['status'] == 'FAIL' for e in cases) else 'PASS',
                       'valid_alternative_check': next(e['status'] for e in cases if e['case'] == 'alternative_python'),
                       'near_miss_check': next(e['status'] for e in cases if e['case'] == 'semantic_near_miss'),
                       'execution_count': len(cases), 'execution_cases': [e['case'] for e in cases],
                       'intentional_identifiers': [d['name'] for d in challenge['deliverables']],
                       'grader_note': 'Output names are explicitly stated; values/labels/population/order/mutation are checked semantically. Source tables remain exact.'})
    summary = {'challenges': len(ledger), 'executions': len(executions),
               'passed': len(executions) - len(failures), 'failed': len(failures),
               'meaningful_alternative_exercises': len(ALTERNATIVES), 'semantic_near_miss_exercises': len(NEAR_MISSES)}
    if args.output:
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output / 'workflow-coverage.json').write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + '\n')
        (args.output / 'workflow-executions.json').write_text(json.dumps(executions, indent=2, ensure_ascii=False) + '\n')
        (args.output / 'workflow-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
        fields = ['scope', 'id', 'title', 'lesson_check', 'task_check', 'hint_check', 'solution_check',
                  'grader_check', 'valid_alternative_check', 'near_miss_check', 'execution_count']
        with (args.output / 'workflow-coverage.csv').open('w', newline='') as output:
            writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
            writer.writeheader(); writer.writerows(ledger)
    print(json.dumps(summary, indent=2))
    if failures:
        raise AssertionError(json.dumps([{k: v for k, v in f.items() if k != 'code'} for f in failures], indent=2))


if __name__ == '__main__':
    main()
