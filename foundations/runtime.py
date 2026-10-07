"""Local-only lesson execution and semantic checks; never included in learner code."""
import ast
import base64
import contextlib
import io
import json
import os
import traceback
import warnings
import unicodedata
import numpy as np
import pandas as pd
from pandas.testing import assert_frame_equal, assert_series_equal, assert_index_equal
plt = sns = None


def _ensure_plotting():
    global plt, sns, PathCollection, QuadMesh, LineCollection, Rectangle
    global _ORIGINAL_SHOW, _ORIGINAL_SUBPLOTS, _ORIGINAL_CLOSE, _ORIGINAL_SAVEFIG
    if plt is not None:
        return
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import seaborn as sns
    from matplotlib.collections import PathCollection, QuadMesh, LineCollection
    from matplotlib.patches import Rectangle
    _ORIGINAL_SHOW, _ORIGINAL_SUBPLOTS, _ORIGINAL_CLOSE = plt.show, plt.subplots, plt.close
    _ORIGINAL_SAVEFIG = plt.Figure.savefig


_ORIGINAL_DATAFRAME = pd.DataFrame
_ORIGINAL_SERIES = pd.Series


def _intent(code, exercise):
    """Inspect syntax nodes, ignoring comments/strings and resolving simple aliases."""
    tree = ast.parse(code)
    calls, attributes, indexes, aliases = set(), set(), set(), {}
    constants = {target.id: node.value for node in tree.body if isinstance(node, ast.Assign) for target in node.targets if isinstance(target, ast.Name)}
    def name(node):
        if isinstance(node, ast.Name):
            return aliases.get(node.id, node.id)
        if isinstance(node, ast.Attribute):
            return name(node.value) + '.' + node.attr
        if isinstance(node, (ast.Subscript, ast.Call)):
            return name(node.value if isinstance(node, ast.Subscript) else node.func)
        return ''
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for item in node.names: aliases[item.asname or item.name] = item.name
        elif isinstance(node, ast.ImportFrom):
            for item in node.names: aliases[item.asname or item.name] = (node.module or '') + '.' + item.name
        elif isinstance(node, ast.Assign) and isinstance(node.value, (ast.Attribute, ast.Name)):
            for target in node.targets:
                if isinstance(target, ast.Name): aliases[target.id] = name(node.value)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call): calls.add(name(node.func))
        elif isinstance(node, ast.Attribute): attributes.add(node.attr)
        elif isinstance(node, ast.Subscript) and isinstance(node.value, ast.Attribute): indexes.add(node.value.attr)
    def present(requirement):
        if requirement.startswith('attr:'): return requirement[5:] in attributes
        if requirement.startswith('index:'): return requirement[6:] in indexes
        return any(call == requirement or call.endswith('.' + requirement) for call in calls)
    for requirement in exercise.get('requiredCalls', []):
        assert present(requirement), 'Practise ' + requirement.split(':')[-1] + ' in this round, as requested in Your task.'
    for rule in exercise.get('requiredKeywords', []):
        matching = [node for node in ast.walk(tree) if isinstance(node, ast.Call) and (name(node.func) == rule['call'] or name(node.func).endswith('.' + rule['call']))]
        def keyword_matches(node):
            for kw in node.keywords:
                if kw.arg == rule['keyword']:
                    try:
                        value = ast.literal_eval(constants.get(kw.value.id, kw.value) if isinstance(kw.value, ast.Name) else kw.value)
                    except (ValueError, TypeError):
                        continue
                    if value == rule['value']: return True
            return False
        assert any(keyword_matches(node) for node in matching), 'Use ' + rule['keyword'] + '=' + repr(rule['value']) + ' as requested.'
    for requirement in exercise.get('forbiddenCalls', []):
        assert not present(requirement), 'Use the requested column operation instead of ' + requirement + '().'


def _equal(actual, expected, strict=False, unordered_index=False, unordered_columns=False, unordered_rows_by=None, unordered_columns_after=None):
    if expected is None:
        assert actual is None, 'Use the Python value None, not text or an omitted answer.'
    elif isinstance(expected, pd.DataFrame):
        assert isinstance(actual, pd.DataFrame), 'Return a DataFrame, keeping the requested rows and columns.'
        if unordered_rows_by:
            assert list(actual.columns) == list(expected.columns), 'Keep the requested output columns and their order.'
            assert actual[unordered_rows_by].is_unique and expected[unordered_rows_by].is_unique, 'Return one row per category.'
            actual = actual.set_index(unordered_rows_by).sort_index()
            expected = expected.set_index(unordered_rows_by).sort_index()
        elif unordered_index:
            assert actual.index.is_unique and expected.index.is_unique, 'Return one row per category.'
            assert_index_equal(actual.index.sort_values(), expected.index.sort_values(), exact=False, check_names=False)
            actual = actual.reindex(expected.index)
        if unordered_columns:
            assert actual.columns.is_unique and expected.columns.is_unique, 'Return one column per category.'
            assert_index_equal(actual.columns.sort_values(), expected.columns.sort_values(), exact=False, check_names=False)
            actual = actual.reindex(columns=expected.columns)
        if unordered_columns_after is not None:
            prefix = unordered_columns_after
            assert list(actual.columns[:prefix]) == list(expected.columns[:prefix]), 'Keep the requested leading columns in order.'
            assert actual.columns.is_unique and set(actual.columns[prefix:]) == set(expected.columns[prefix:]), 'Keep every requested indicator column with its exact name.'
            actual = actual.reindex(columns=expected.columns)
        assert_frame_equal(actual, expected, check_dtype=strict, check_names=False, check_exact=False, rtol=1e-6, atol=1e-7, check_categorical=strict)
    elif isinstance(expected, pd.Series):
        assert isinstance(actual, pd.Series), 'Return a Series (one labelled column).'
        if unordered_index:
            assert actual.index.is_unique and expected.index.is_unique, 'Return one summary per category.'
            # Align by labels only after checking the category set. Never discard
            # extra categories or accept swapped category/value associations.
            assert_index_equal(actual.index.sort_values(), expected.index.sort_values(), exact=False, check_names=False)
            actual = actual.reindex(expected.index)
        assert_series_equal(actual, expected, check_dtype=strict, check_names=False, check_exact=False, rtol=1e-6, atol=1e-7, check_categorical=strict)
    elif isinstance(expected, pd.Index):
        assert_index_equal(actual, expected, exact=strict, check_names=False)
    elif isinstance(expected, dict):
        assert isinstance(actual, dict) and set(actual) == set(expected), 'Check the requested dictionary keys.'
        for key in expected:
            _equal(actual[key], expected[key], strict)
    elif isinstance(expected, (list, tuple)):
        assert isinstance(actual, (list, tuple)) and len(actual) == len(expected), 'Check the number and order of items.'
        for a, e in zip(actual, expected):
            _equal(a, e, strict)
    elif isinstance(expected, np.ndarray):
        assert isinstance(actual, (np.ndarray, pd.DataFrame)), 'Return the calculated numeric array.'
        np.testing.assert_allclose(np.asarray(actual), expected, rtol=1e-6, atol=1e-7, equal_nan=True)
    elif isinstance(expected, (float, int, np.number)):
        assert np.isscalar(actual), 'Return one calculated number.'
        np.testing.assert_allclose(actual, expected, rtol=1e-6, atol=1e-7, equal_nan=True)
    else:
        assert str(actual) == str(expected), 'The result differs from the requested value.'


def _numeric(values):
    array = np.asarray(values)
    if array.dtype.kind in 'biufc':
        return np.where(np.isfinite(array), np.round(array.astype(float), 6), np.nan).tolist()
    return array.astype(str).tolist()


def _plot_text(value, rules):
    """Only presentation text is normalized; column/category identifiers stay exact."""
    if rules.get('textCaseInsensitive'):
        return ' '.join(unicodedata.normalize('NFKC', str(value)).split()).casefold()
    return value


def _category_bars(ax, unordered=False, empty_counts=False):
    """Compare labelled heights/baselines, independent of bar width or artist order."""
    ticks = list(ax.get_xticks())
    labels = [tick.get_text() for tick in ax.get_xticklabels()]
    rectangles = [patch for patch in ax.patches if isinstance(patch, Rectangle)
                  and (patch.get_width() or patch.get_height())]
    if not labels or len(set(labels)) != len(labels) or not rectangles:
        return None
    values = {label: [] for label in labels}
    for patch in rectangles:
        centre = patch.get_x() + patch.get_width() / 2
        nearest = min(range(len(ticks)), key=lambda i: abs(ticks[i] - centre))
        if abs(ticks[nearest] - centre) > 0.35:
            return None
        values[labels[nearest]].append(_numeric([patch.get_y(), patch.get_height()]))
    if any(not parts for parts in values.values()):
        if not empty_counts:
            return None
        # countplot(order=...) may retain a labelled category tick without
        # creating a Rectangle for its zero observations. An explicit zero bar
        # is scientifically equivalent, provided the label/order is retained.
        for label, parts in values.items():
            if not parts:
                values[label] = [[0, 0]]
    pairs = [(label, sorted(values[label])) for label in labels]
    return sorted(pairs) if unordered else pairs


def _encoded_scatter(ax, rules):
    """Read data-to-appearance mappings without prescribing a default palette/size."""
    legend = ax.get_legend()
    color_labels = {}
    if legend is not None:
        handles = getattr(legend, 'legend_handles', getattr(legend, 'legendHandles', []))
        for handle, label in zip(handles, legend.get_texts()):
            if hasattr(handle, 'get_facecolors'):
                colors = handle.get_facecolors()
                color = colors[0] if len(colors) else None
            else:
                color = handle.get_color() if hasattr(handle, 'get_color') else None
            if color is not None:
                from matplotlib.colors import to_rgba
                color_labels[tuple(np.round(to_rgba(color)[:3], 5))] = label.get_text()
    records = []
    for collection in ax.collections:
        if not isinstance(collection, PathCollection):
            continue
        points = np.asarray(collection.get_offsets())
        colors, sizes, paths = collection.get_facecolors(), collection.get_sizes(), collection.get_paths()
        for index, point in enumerate(points):
            color = colors[index % len(colors)] if len(colors) else np.array([0, 0, 0, 1])
            shape = tuple(map(tuple, np.round(paths[index % len(paths)].vertices, 5))) if paths else ()
            size = float(sizes[index % len(sizes)]) if len(sizes) else 0
            color_key = tuple(np.round(color[:3], 5))
            records.append({'point': _numeric(point), 'hue': color_labels.get(color_key, '<unlabelled>'),
                            'shape': shape, 'size': size, 'rgba': _numeric(color), 'alpha': collection.get_alpha()})
    # Shapes are interchangeable symbols, but their grouping must stay the same.
    shapes = {row['shape'] for row in records}
    memberships = {shape: sorted((tuple(row['point']), row['hue']) for row in records if row['shape'] == shape) for shape in shapes}
    shape_order = {shape: index for index, shape in enumerate(sorted(shapes, key=lambda shape: memberships[shape]))}
    sizes = [row['size'] for row in records]
    low, high = (min(sizes), max(sizes)) if sizes else (0, 0)
    result = []
    for row in records:
        size = 0 if high == low else round((row['size'] - low) / (high - low), 5)
        record = [row['point'], row['hue'], shape_order[row['shape']], size]
        if rules.get('fixedPalette'):
            record.append(row['rgba'])
        if rules.get('alpha'):
            record.append(row['alpha'])
        result.append(record)
    return sorted(result, key=lambda row: (tuple(row[0]), str(row[1]), row[2], row[3]))


def _box_summary(ax, rules):
    """Extract quartiles, medians, whiskers and outliers from drawn boxes."""
    horizontal = rules.get('categoryAxis') == 'y'
    ticks = list(ax.get_yticks() if horizontal else ax.get_xticks())
    labels = [t.get_text() for t in (ax.get_yticklabels() if horizontal else ax.get_xticklabels())]
    boxes = []
    for patch in ax.patches:
        if not isinstance(patch, Rectangle):
            path = patch.get_path()
            vertices = path.vertices if path.codes is None else path.vertices[path.codes != 79]
            boxes.append(np.asarray(vertices))
    for line in ax.lines:
        points = np.column_stack([line.get_xdata(orig=False), line.get_ydata(orig=False)])
        if len(points) >= 4 and np.allclose(points[0], points[-1]):
            boxes.append(points)
    result = []
    for vertices in boxes:
        categories, measured = vertices[:, int(horizontal)], vertices[:, int(not horizontal)]
        centre = (float(np.min(categories)) + float(np.max(categories))) / 2
        nearest = min(range(len(ticks)), key=lambda index: abs(ticks[index] - centre))
        if abs(ticks[nearest] - centre) > 0.35:
            continue
        q1, q3 = float(np.min(measured)), float(np.max(measured))
        medians, whiskers, outliers = [], [q1, q3], []
        for line in ax.lines:
            x, y = np.asarray(line.get_xdata(orig=False)), np.asarray(line.get_ydata(orig=False))
            category, values = (y, x) if horizontal else (x, y)
            if not len(values) or np.any(abs(category - centre) > 0.49):
                continue
            if line.get_linestyle() in (None, 'None', '', ' ') and line.get_marker() not in (None, 'None', '', ' '):
                outliers.extend(values.tolist())
            else:
                if np.ptp(category) < 1e-8:
                    whiskers.extend(values.tolist())
                elif np.ptp(values) < 1e-8 and q1 - 1e-8 <= values[0] <= q3 + 1e-8:
                    medians.append(float(values[0]))
        if not medians:
            return None
        result.append([labels[nearest], q1, q3, float(np.median(medians)), float(min(whiskers)), float(max(whiskers)), sorted(outliers)])
    return result or None


def _foundation_artist_visible(artist):
    """An encoded observation must actually draw, including unfilled markers."""
    from matplotlib.colors import to_rgba
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch
    if not artist.get_visible() or artist.get_alpha() == 0:
        return False
    if isinstance(artist, PathCollection):
        count = len(artist.get_offsets())
        if not count:
            return True  # Empty legend proxies do not encode observations.
        if not artist.get_paths() or (len(artist.get_sizes()) and np.any(artist.get_sizes() <= 0)):
            return False
        alpha = np.zeros(count)
        for colors in (artist.get_facecolors(), artist.get_edgecolors()):
            if len(colors):
                alpha = np.maximum(alpha, np.resize(colors[:, 3], count))
        return bool(np.all(alpha > 0))
    if isinstance(artist, Line2D) and len(artist.get_xdata()):
        stroke = (artist.get_linestyle() not in (None, 'None', '', ' ')
                  and artist.get_linewidth() > 0 and to_rgba(artist.get_color())[3] > 0)
        marker = (artist.get_marker() not in (None, 'None', '', ' ')
                  and artist.get_markersize() > 0
                  and (to_rgba(artist.get_markerfacecolor())[3] > 0
                       or (artist.get_markeredgewidth() > 0 and to_rgba(artist.get_markeredgecolor())[3] > 0)))
        return bool(stroke or marker)
    if isinstance(artist, Patch):
        return bool((artist.get_fill() and to_rgba(artist.get_facecolor())[3] > 0)
                    or (artist.get_linewidth() > 0 and to_rgba(artist.get_edgecolor())[3] > 0))
    return True


def _foundation_evidence_bounds(ax):
    """Compare visibility without imposing an incidental automatic axis range.

    Transform marks into display coordinates so rug/reference lines, images and
    ordinary data marks share a viewport. Non-finite ECDF sentinels and missing
    matrix cells carry no drawable position. Intentional clipping in the model
    remains allowed; an otherwise equivalent answer must retain its coverage.
    """
    points = []
    for line in ax.lines:
        if len(line.get_xdata()):
            values = np.column_stack([line.get_xdata(orig=False), line.get_ydata(orig=False)])
            points.extend(line.get_transform().transform(values))
    for patch in ax.patches:
        path = patch.get_path()
        values = path.vertices if path.codes is None else path.vertices[path.codes != 79]
        points.extend(patch.get_transform().transform(values))
    for collection in ax.collections:
        if isinstance(collection, PathCollection):
            points.extend(collection.get_offset_transform().transform(collection.get_offsets()))
        elif isinstance(collection, QuadMesh):
            points.extend(collection.get_transform().transform(collection.get_coordinates().reshape(-1, 2)))
        elif isinstance(collection, LineCollection):
            for segment in collection.get_segments():
                points.extend(collection.get_transform().transform(segment))
        else:
            for path in collection.get_paths():
                values = path.vertices if path.codes is None else path.vertices[path.codes != 79]
                points.extend(collection.get_transform().transform(values))
    for artist in ax.images:
        x0, x1, y0, y1 = artist.get_extent()
        points.extend(artist.get_transform().transform([[x0, y0], [x1, y1]]))
    if not points:
        return [True, True]  # The empty-canvas lesson intentionally has no marks.
    values = np.asarray(points, dtype=float)
    values = values[np.all(np.isfinite(values), axis=1)]
    if not len(values):
        return [True, False]
    box = ax.bbox
    inside = ((values[:, 0] >= box.x0 - 1e-5) & (values[:, 0] <= box.x1 + 1e-5)
              & (values[:, 1] >= box.y0 - 1e-5) & (values[:, 1] <= box.y1 + 1e-5))
    return [bool(np.all(inside)), bool(np.any(inside))]


def _foundation_numeric_annotation(text, value):
    """Accept a different precision only when it correctly rounds this cell."""
    from decimal import Decimal, InvalidOperation
    try:
        shown = Decimal(text.strip())
        numeric = float(shown)
        precision = -shown.as_tuple().exponent
        correct = round(float(value), precision)
        if np.isfinite(numeric) and np.isclose(numeric, correct, rtol=0, atol=1e-12):
            return float(value)
        return numeric
    except (InvalidOperation, ValueError, TypeError, OverflowError):
        return text


def _swarm_nonoverlap(ax):
    """Verify packing in displayed coordinates without prescribing offsets."""
    points = []
    for collection in ax.collections:
        if not isinstance(collection, PathCollection):
            continue
        offsets = np.asarray(collection.get_offsets())
        sizes = collection.get_sizes()
        if not len(offsets) or not len(sizes):
            continue
        for index, point in enumerate(ax.transData.transform(offsets)):
            radius = np.sqrt(sizes[index % len(sizes)]) * ax.figure.dpi / 144
            points.append((point, radius))
    return all(np.linalg.norm(first[0] - second[0]) + 0.1 >= first[1] + second[1]
               for index, first in enumerate(points) for second in points[index + 1:])


def _plot_state(figures, rules):
    result = []
    for figure_number, fig in enumerate(figures):
        fig.canvas.draw()
        state = {'axes': []}
        if rules.get('sharedLimits') and fig.axes:
            first = fig.axes[0]
            state['shared_limits'] = [all(np.allclose(ax.get_xlim(), first.get_xlim()) for ax in fig.axes),
                                      all(np.allclose(ax.get_ylim(), first.get_ylim()) for ax in fig.axes)]
        if rules.get('size'):
            state['size'] = _numeric(fig.get_size_inches())
        if rules.get('panelHeight'):
            state['panel_height'] = float(fig.get_size_inches()[1])
        for ax in fig.axes:
            if rules.get('matrixLabels') and ax.get_label() == '<colorbar>':
                continue  # A colourbar is an optional presentation aid in these tasks.
            item = {'title': _plot_text(ax.get_title(), rules), 'xlabel': _plot_text(ax.get_xlabel(), rules), 'ylabel': _plot_text(ax.get_ylabel(), rules),
                    'xscale': ax.get_xscale(), 'yscale': ax.get_yscale(), 'lines': [], 'patches': [], 'collections': []}
            marks = [*ax.lines, *ax.patches, *ax.collections, *ax.images]
            item['visibility'] = [bool(fig.get_visible() and ax.get_visible()),
                                  all(_foundation_artist_visible(artist) for artist in marks),
                                  *_foundation_evidence_bounds(ax)]
            required_text = [(ax.title, True), (ax.xaxis.label, ax.axison and ax.xaxis.get_visible()),
                             (ax.yaxis.label, ax.axison and ax.yaxis.get_visible())]
            if rules.get('annotations'):
                required_text.extend((text, True) for text in ax.texts)
            if rules.get('figureTextFits'):
                # A semantic spacing requirement: allow any layout method that
                # keeps the requested labels inside the Figure's own canvas.
                # Tight export cropping alone can include otherwise clipped text.
                renderer = fig.canvas.get_renderer()
                labels = [ax.title, ax.xaxis.label, ax.yaxis.label]
                # Locators may create ticks beyond the visible axis interval.
                # Those labels are not drawn; only inspect rendered tick labels.
                for axis in (ax.xaxis, ax.yaxis):
                    lower, upper = sorted(axis.get_view_interval())
                    tolerance = max(abs(upper - lower), 1) * 1e-9
                    for tick in [*axis.get_major_ticks(), *axis.get_minor_ticks()]:
                        if lower - tolerance <= tick.get_loc() <= upper + tolerance:
                            labels.extend(label for label in (tick.label1, tick.label2) if label.get_visible())
                    offset = axis.get_offset_text()
                    if offset.get_visible():
                        labels.append(offset)
                canvas = fig.bbox
                def fits(text):
                    if not text.get_text():
                        return True
                    if not text.get_visible():
                        return False
                    box = text.get_window_extent(renderer=renderer)
                    bounds = [box.x0, box.y0, box.x1, box.y1]
                    return bool(np.isfinite(bounds).all() and
                                box.x0 >= canvas.x0 - 0.5 and box.y0 >= canvas.y0 - 0.5 and
                                box.x1 <= canvas.x1 + 0.5 and box.y1 <= canvas.y1 + 0.5)
                item['figure_text_fits'] = all(fits(text) for text in labels)

            if rules.get('categorical') or rules.get('matrixLabels'):
                required_text.extend((text, ax.axison and axis.get_visible())
                                     for axis in (ax.xaxis, ax.yaxis) for text in axis.get_ticklabels())
            item['visible_text'] = all(not text.get_text() or (enabled and _foundation_artist_visible(text))
                                       for text, enabled in required_text)
            if rules.get('legend'):
                legend = ax.get_legend()
                item['visible_legend'] = bool(legend is not None and _foundation_artist_visible(legend))
            if rules.get('annotationDetails'):
                item['visible_arrows'] = all(_foundation_artist_visible(text.arrow_patch)
                                              for text in ax.texts if getattr(text, 'arrow_patch', None) is not None)
            if rules.get('layout'):
                centres = [(axis, (axis.get_position().x0 + axis.get_position().x1) / 2,
                            (axis.get_position().y0 + axis.get_position().y1) / 2) for axis in fig.axes]
                horizontal = np.ptp([centre[1] for centre in centres]) >= np.ptp([centre[2] for centre in centres])
                ordered = sorted(centres, key=lambda centre: centre[1] if horizontal else -centre[2])
                item['layout'] = [len(centres), 'row' if horizontal else 'column', next(index for index, centre in enumerate(ordered) if centre[0] is ax)]
            if rules.get('limits'):
                item['limits'] = [_numeric(ax.get_xlim()), _numeric(ax.get_ylim())]
            if rules.get('xLimits'):
                item['x_limits'] = _numeric(ax.get_xlim())
            if rules.get('yLimits'):
                item['y_limits'] = _numeric(ax.get_ylim())
            if rules.get('swarm'):
                item['swarm_nonoverlap'] = _swarm_nonoverlap(ax)
            if rules.get('zeroBaseline'):

                item['zero_baseline'] = abs(ax.get_ylim()[0]) < 1e-9
            if rules.get('ticks'):
                item['rotations'] = [t.get_rotation() for t in ax.get_xticklabels()]
            if rules.get('categorical'):
                category_ticks = ax.get_yticklabels() if rules.get('categoryAxis') == 'y' else ax.get_xticklabels()
                item['categories'] = [t.get_text() for t in category_ticks]
            if rules.get('matrixLabels'):
                item['matrix_labels'] = [[t.get_text() for t in ax.get_xticklabels()], [t.get_text() for t in ax.get_yticklabels()]]
            for line in ax.lines:
                # Legend proxy artists may have no observations.
                if len(line.get_xdata()):
                    part = [_numeric(line.get_xdata(orig=False)), _numeric(line.get_ydata(orig=False))]
                    if rules.get('lineStyles'):
                        part.append(line.get_linestyle())
                    if rules.get('lineDrawstyle'):
                        part.append(line.get_drawstyle())
                    if rules.get('markers'):
                        # Marker shape is only exact when the brief specifies "o".
                        part.append(line.get_marker() if rules.get('markerShape') else bool(line.get_marker() not in (None, '', 'None', ' ')))
                    item['lines'].append(part)
            for patch in ax.patches:
                if isinstance(patch, Rectangle):
                    if patch.get_width() or patch.get_height():
                        item['patches'].append(_numeric([patch.get_x(), patch.get_y(), patch.get_width(), patch.get_height()]))
                else:
                    item['patches'].append(_numeric(patch.get_path().vertices))
            # A categorical bar chart answers with label-height pairs. A
            # different category order is equivalent unless the brief asks
            # learners to rank or sequence the bars. Leave all other chart
            # geometry under the usual exact comparison.
            unordered_bars = rules.get('unorderedBars') and figure_number == rules.get('unorderedBarsFigure', 0)
            if unordered_bars or rules.get('barGeometry'):
                pairs = _category_bars(ax, unordered_bars, rules.get('categoryCounts', False))
                if pairs is not None:
                    item['bars_by_category'] = pairs
                    item['patches'] = []
                    if unordered_bars and 'categories' in item:
                        item['categories'] = sorted(item['categories'])
            for collection in ax.collections:
                part = {}
                if isinstance(collection, PathCollection):
                    offsets = np.asarray(collection.get_offsets()).copy()
                    if (rules.get('jitter') or rules.get('swarm')) and offsets.size:
                        category_axis = 1 if rules.get('categoryAxis') == 'y' else 0
                        offsets[:, category_axis] = np.round(offsets[:, category_axis])
                    part['points'] = _numeric(offsets)
                    if rules.get('alpha'):
                        part['alpha'] = collection.get_alpha()
                    if rules.get('sizes'):
                        part['sizes'] = _numeric(collection.get_sizes())
                    if rules.get('colors'):
                        part['colors'] = _numeric(collection.get_facecolors())
                        part['markers'] = [_numeric(p.vertices) for p in collection.get_paths()]
                elif isinstance(collection, QuadMesh):
                    part['matrix'] = _numeric(collection.get_array())
                    if rules.get('clim'):
                        part['clim'] = _numeric(collection.get_clim())
                    if rules.get('palette'):
                        part['palette'] = _numeric(collection.cmap(np.linspace(0, 1, 5)))
                elif isinstance(collection, LineCollection):
                    part['segments'] = [_numeric(x) for x in collection.get_segments()]
                else:
                    part['paths'] = [_numeric(p.vertices) for p in collection.get_paths()]
                item['collections'].append(part)
            for artist in ax.images:
                part = {'matrix': _numeric(artist.get_array())}
                if rules.get('clim'):
                    part['clim'] = _numeric(artist.get_clim())
                if rules.get('palette'):
                    part['palette'] = _numeric(artist.cmap(np.linspace(0, 1, 5)))
                item['collections'].append(part)
            if rules.get('legend'):
                legend = ax.get_legend()
                labels = [] if legend is None else [t.get_text() for t in legend.get_texts()]
                if rules.get('semantic') == 'encodedScatter':
                    # Seaborn's zero-size proxy handles are section headings.
                    # Their text may name an equivalently derived column; the
                    # category labels and encoded point memberships carry data.
                    handles = getattr(legend, 'legend_handles', getattr(legend, 'legendHandles', [])) if legend else []
                    headings = {label for label, handle in zip(labels, handles)
                                if hasattr(handle, 'get_markersize') and handle.get_markersize() == 0}
                    labels = [label for label in labels if label not in headings and label not in rules.get('legendFields', [])]
                if rules.get('semantic') == 'encodedScatter' and not rules.get('legendOrder'):
                    labels = sorted(labels)
                title = '' if rules.get('semantic') == 'encodedScatter' and not rules.get('legendTitle') else (legend.get_title().get_text() if legend else '')
                item['legend'] = None if legend is None else [_plot_text(title, rules), labels]
            if rules.get('annotations'):
                item['annotations'] = [[_plot_text(t.get_text(), rules), _numeric(getattr(t, 'xy', t.get_position()))] for t in ax.texts]
                if rules.get('matrixLabels'):
                    xticks, yticks = list(ax.get_xticks()), list(ax.get_yticks())
                    matrix = next((np.asarray(collection.get_array()) for collection in ax.collections if isinstance(collection, QuadMesh)), None)
                    if matrix is None and ax.images:
                        matrix = np.asarray(ax.images[0].get_array())
                    if matrix is not None:
                        matrix = matrix.reshape(len(yticks), len(xticks))
                    item['annotations'] = [[_plot_text(text.get_text(), rules),
                                            [min(range(len(xticks)), key=lambda index: abs(xticks[index] - text.get_position()[0])),
                                             min(range(len(yticks)), key=lambda index: abs(yticks[index] - text.get_position()[1]))]] for text in ax.texts]
                    if rules.get('numericAnnotations') and matrix is not None:
                        item['annotations'] = [[_foundation_numeric_annotation(text, matrix[position[1], position[0]]), position]
                                               for text, position in item['annotations']]
            if rules.get('annotationDetails'):
                item['annotation_details'] = [[_numeric(t.get_position()), getattr(t, 'anncoords', None),
                                               bool(getattr(t, 'arrow_patch', None))] for t in ax.texts]
            # In an ungrouped scatter, drawing order does not change the paired data.
            # Keep labels, scales, reference lines and observation multiplicity intact.
            if rules.get('semantic') == 'scatter':
                combined = []
                for line in list(ax.lines):
                    if line.get_linestyle() in (None, '', 'None', ' ') and line.get_marker() not in (None, '', 'None', ' '):
                        combined.extend(_numeric(np.column_stack([line.get_xdata(orig=False), line.get_ydata(orig=False)])))
                        index = list(ax.lines).index(line)
                        if index < len(item['lines']):
                            item['lines'][index] = None
                item['lines'] = [part for part in item['lines'] if part is not None]
                for part in item['collections']:
                    if 'points' in part:
                        combined.extend(part['points'])
                if combined and not any(rules.get(key) for key in ('colors', 'sizes', 'alpha')):
                    item['collections'] = [part for part in item['collections'] if 'points' not in part]
                    item['collections'].append({'points': sorted(combined, key=lambda p: tuple(p))})
            if rules.get('semantic') == 'encodedScatter':
                item['collections'] = [part for part in item['collections'] if 'points' not in part]
                item['encoded_points'] = _encoded_scatter(ax, rules)
            if rules.get('boxSummary'):
                summary = _box_summary(ax, rules)
                if summary is not None:
                    item['boxes'] = summary
                    item['lines'], item['patches'], item['collections'] = [], [], []
            if rules.get('fitLine'):
                observations = [point for part in item['collections'] for point in part.get('points', [])]
                fitted = []
                for line in ax.lines:
                    x, y = np.asarray(line.get_xdata(orig=False)), np.asarray(line.get_ydata(orig=False))
                    if len(x) >= 2 and np.ptp(x) > 0:
                        slope, intercept = np.polyfit(x, y, 1)
                        if np.allclose(y, slope * x + intercept, rtol=2e-4, atol=2e-5):
                            covers = bool(observations and min(x) <= min(point[0] for point in observations) and max(x) >= max(point[0] for point in observations))
                            fitted.append([float(slope), float(intercept), covers])
                if len(fitted) == len(item['lines']):
                    item['lines'] = fitted
            state['axes'].append(item)
        result.append(state)
    return result


def _plot_requirement(path):
    names = {'matrix_labels': 'heatmap row and column labels', 'annotation_details': 'annotation arrow and text offset',
             'encoded_points': 'point colours, shapes and size mappings', 'bars_by_category': 'category labels, bar heights and baselines',
             'zero_baseline': 'zero baseline', 'panel_height': 'panel height', 'xlabel': 'horizontal axis label',
             'ylabel': 'vertical axis label', 'title': 'chart title', 'annotations': 'annotations', 'layout': 'panel arrangement',
             'matrix': 'heatmap values', 'legend': 'legend', 'points': 'paired observations', 'lines': 'lines, markers and reference styles',
             'patches': 'bins, counts and distribution shapes', 'limits': 'axis limits', 'x_limits': 'horizontal limits', 'y_limits': 'vertical limits', 'shared_limits': 'common panel scales', 'swarm_nonoverlap': 'non-overlapping raw observations', 'size': 'Figure dimensions',
             'clim': 'colour scale range', 'palette': 'palette', 'rotations': 'tick rotation', 'categories': 'category labels',
             'visibility': 'visible observations and axis bounds', 'visible_text': 'visible titles, labels and annotations',
             'figure_text_fits': 'title, axis labels and tick labels inside the Figure canvas (adjust its margins)',
             'visible_legend': 'visible legend', 'visible_arrows': 'visible annotation arrows'}
    return next((label for key, label in names.items() if key in path), 'requested chart features')


def _compare_plots(actual, expected, path='Figure'):
    if isinstance(expected, dict):
        assert isinstance(actual, dict) and actual.keys() == expected.keys(), 'Check the figure structure.'
        for key in expected:
            _compare_plots(actual[key], expected[key], path + ' / ' + key)
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(actual) == len(expected), 'Check the number of figures, axes and plotted observations.'
        for index, (a, e) in enumerate(zip(actual, expected)):
            _compare_plots(a, e, path + ' ' + str(index + 1))
    elif isinstance(expected, (float, int)):
        try:
            np.testing.assert_allclose(actual, expected, rtol=2e-4, atol=2e-5, equal_nan=True)
        except (AssertionError, TypeError, ValueError):
            raise AssertionError('Check the ' + _plot_requirement(path) + '.') from None
    else:
        assert actual == expected, 'Check the ' + _plot_requirement(path) + '; expected ' + repr(expected) + '.'


def _execute(code, columns, setup='', construction=False, files=None, explicit_setup=False, plot_rules=None, savefig_capture=None):
    if plt is not None:
        plt.show = _ORIGINAL_SHOW
        plt.subplots = _ORIGINAL_SUBPLOTS
        plt.close = _ORIGINAL_CLOSE
        plt.Figure.savefig = _ORIGINAL_SAVEFIG
    pd.DataFrame = _ORIGINAL_DATAFRAME
    pd.Series = _ORIGINAL_SERIES
    if plt is not None:
        plt.close('all')
        plt.rcdefaults()
    np.random.seed(42)
    # Fresh names and fresh objects on every Run and Check, including after exceptions.
    data = {key: list(values) for key, values in columns.items()}
    env = {'__builtins__': __builtins__, 'pd': pd, 'np': np, 'plt': plt, 'sns': sns, 'data': data}
    if explicit_setup:
        env = {'__builtins__': __builtins__}
    elif construction:
        del env['data']
    if not construction and not explicit_setup:
        env['df'] = pd.DataFrame(data)
    for filename, content in (files or {}).items():
        if isinstance(content, str):
            with open(filename, 'w', encoding='utf-8') as supplied:
                supplied.write(content)
        else:
            pd.DataFrame(content).to_csv(filename, index=False)
    if setup and not explicit_setup:
        exec(setup, env)
    figures = []
    exports = []
    def capture_show(*args, **kwargs):
        for number in plt.get_fignums():
            fig = plt.figure(number)
            if fig not in figures:
                figures.append(fig)
    if plt is not None:
        plt.show = capture_show
        if savefig_capture is not None:
            plt.Figure.savefig = savefig_capture
        elif (plot_rules or {}).get('export'):
            def capture_savefig(fig, filename, *args, **kwargs):
                exports.append({'filename': str(filename), 'dpi': kwargs.get('dpi'),
                                'bbox_inches': kwargs.get('bbox_inches', plt.rcParams['savefig.bbox']), 'before_display': fig not in figures,
                                'plot': _plot_state([fig], plot_rules or {})})
                return _ORIGINAL_SAVEFIG(fig, filename, *args, **kwargs)
            plt.Figure.savefig = capture_savefig
    outputs = []
    printed_values = []
    def display(value):
        outputs.append(value)
    env['display'] = display
    import builtins
    def print_value(*values, **kwargs):
        if len(values) == 1 and kwargs.get('file') is None:
            printed_values.append(values[0])
        return builtins.print(*values, **kwargs)
    env['print'] = print_value
    stream = BoundedOutputStream()
    last = None
    has_result = False
    error = None
    with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream), warnings.catch_warnings():
        warnings.simplefilter('ignore', FutureWarning)
        try:
            tree = ast.parse(code, filename='your_python.py')
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                has_result = True
                expression = ast.Expression(tree.body.pop().value)
                exec(compile(tree, 'your_python.py', 'exec'), env)
                last = eval(compile(expression, 'your_python.py', 'eval'), env)
            else:
                exec(compile(tree, 'your_python.py', 'exec'), env)
            if last is not None or (has_result and not figures and not stream.getvalue() and not outputs):
                outputs.append(last)
        except Exception as exc:
            error = ''.join(traceback.format_exception_only(type(exc), exc)).strip()
    if plt is not None:
        plt.show = _ORIGINAL_SHOW
        plt.Figure.savefig = _ORIGINAL_SAVEFIG
    return {'env': env, 'last': last, 'has_result': has_result, 'outputs': outputs, 'printed_values': printed_values,
            'stdout': stream.getvalue(), 'figures': figures, 'exports': exports, 'error': error}


def run_foundation(request):
    exercise = request['exercise']
    columns = request['columns']
    checking = request.get('check', False)
    target = exercise.get('target', 'value')
    if target == 'plot' or any(word in request['code'] for word in ['matplotlib', 'seaborn', 'plt.', 'sns.']):
        _ensure_plotting()
    construction = exercise['id'].startswith('I01-') or bool(exercise.get('files'))
    setup = exercise.get('setup', '')
    expected = None
    # The answer namespace is never exposed to learner code; no shared df objects.
    if checking:
        expected = _execute(exercise['solution'], columns, setup, construction, exercise.get('files'), plot_rules=exercise.get('plot'))
        if expected['error']:
            raise RuntimeError('Reference exercise failed: ' + expected['error'])
        if target == 'plot':
            expected_plot = _plot_state(expected['figures'], exercise.get('plot') or {})
            if (exercise.get('plot') or {}).get('figureTextFits'):
                assert all(axis.get('figure_text_fits') for figure in expected_plot for axis in figure['axes']), 'Reference chart text must fit inside its Figure canvas.'

    if os.path.exists('chart.png'):
        os.remove('chart.png')
    actual = _execute(request['code'], columns, setup, construction, exercise.get('files'), request.get('explicitSetup', False), exercise.get('plot'))
    passed = False
    feedback = ''
    if checking and not actual['error']:
        try:
            _intent(request['code'], exercise)
            if target == 'plot':
                _compare_plots(_plot_state(actual['figures'], exercise.get('plot') or {}), expected_plot)
                assert actual['figures'], 'Display your figure with plt.show().'
                if exercise.get('checkPlotResponse'):
                    wanted, got = expected['last'], actual['last']
                    assert actual['has_result'], 'Finish with the requested interpretation as a Python value.'
                    if isinstance(wanted, str) and isinstance(got, str):
                        wanted, got = _plot_text(wanted, exercise.get('plot') or {}), _plot_text(got, exercise.get('plot') or {})
                    _equal(got, wanted)

                if (exercise.get('plot') or {}).get('export'):
                    assert os.path.isfile('chart.png') and os.path.getsize('chart.png') > 100, 'Save chart.png before displaying the figure.'
                    from PIL import Image
                    exported = Image.open('chart.png')
                    assert abs(exported.info.get('dpi', (0,))[0] - 150) < 1, 'Save the PNG at 150 dpi.'
                    saved = [item for item in actual['exports'] if os.path.normpath(item['filename']) == 'chart.png']
                    assert saved and saved[-1]['bbox_inches'] == 'tight', 'Save chart.png with bbox_inches="tight".'
                    assert saved[-1]['before_display'], 'Save the finished chart before calling plt.show().'
                    _compare_plots(saved[-1]['plot'], expected_plot, 'Exported Figure')
            elif target == 'copy':
                assert 'clean' in actual['env'], 'Keep the working copy in clean.'
                _equal(actual['env']['clean'], expected['env']['clean'], exercise.get('strictDtype', False))
                _equal(actual['env'].get('df'), pd.DataFrame(columns), True)
                assert actual['env']['clean'] is not actual['env']['df'], 'Make a separate copy before editing.'
            else:
                wanted = expected['env']['df'] if target == 'df' else expected['last']
                got = actual['env'].get('df') if target == 'df' else actual['last']
                if got is None and target == 'value':
                    if actual['outputs']:
                        got = actual['outputs'][-1]
                    elif actual['printed_values']:
                        got = actual['printed_values'][-1]
                    else:
                        got = actual['env'].get('result')
                if target == 'value':
                    assert actual['has_result'] or actual['outputs'] or actual['printed_values'] or 'result' in actual['env'], 'Display your answer with a final expression, display(...), or print(...).'
                if exercise.get('textCaseInsensitive') and isinstance(wanted, str) and isinstance(got, str):
                    wanted, got = _plot_text(wanted, exercise), _plot_text(got, exercise)
                _equal(got, wanted, exercise.get('strictDtype', False), exercise.get('unorderedIndex', False),
                       exercise.get('unorderedColumns', False), exercise.get('unorderedRowsBy'), exercise.get('unorderedColumnsAfter'))
            if exercise.get('preserveData'):
                _equal(actual['env'].get('df'), pd.DataFrame(columns), True)
            if exercise.get('compareWorkingDf'):
                _equal(actual['env'].get('df'), expected['env']['df'])
            if exercise.get('dtypeRules'):
                rule = exercise['dtypeRules']
                assert str(actual['env']['df'][rule['column']].dtype) == rule['dtype'], 'Store ' + rule['column'] + ' with the requested ' + rule['dtype'] + ' dtype.'
            passed = True
            feedback = 'That matches the task. Read the output, then try the next practice.'
        except (AssertionError, TypeError, ValueError, KeyError) as exc:
            message = str(exc).split('\n')[0][:220]
            fallback = 'Check the chart data, selected rows, labels and requested chart features.' if target == 'plot' else 'Check the requested values, row order, columns and data types.'
            feedback = 'Not yet. ' + (message if message and not message.startswith(('DataFrame', 'Series', 'Arrays', 'Not equal')) else fallback)
    elif actual['error']:
        feedback = 'Python could not finish. Read the error below, edit your code and run again.'
    rendered = []
    for value in actual['outputs']:
        if isinstance(value, (pd.DataFrame, pd.Series)):
            rendered.append({'kind': 'table', 'value': serialize_dataframe_result(value)})
        else:
            rendered.append({'kind': 'text', 'value': str(value)[:20000]})
    for fig in actual['figures']:
        buffer = io.BytesIO()
        fig.savefig(buffer, format='png', dpi=110, bbox_inches='tight')
        titles = [ax.get_title() for ax in fig.axes if ax.get_title()]
        rendered.append({'kind': 'figure', 'alt': ' / '.join(titles) or 'Chart from your Python', 'value': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()})
    if os.path.isfile('chart.png'):
        with open('chart.png', 'rb') as file:
            rendered.append({'kind': 'download', 'name': 'chart.png', 'value': 'data:image/png;base64,' + base64.b64encode(file.read()).decode()})
    if plt is not None:
        plt.close('all')
    return {'passed': passed, 'checked': checking, 'feedback': feedback, 'stdout': actual['stdout'], 'error': actual['error'], 'outputs': rendered}
