"""Challenge validation is separate from the existing lesson checker."""


def _challenge_frame_equal(
    actual,
    expected,
    check_index=False,
    unordered_index=False,
    unordered_columns=False,
    unordered_rows_by=None,
):
    if isinstance(expected, pd.DataFrame):
        assert isinstance(actual, pd.DataFrame), "Produce the requested table."
        if unordered_columns:
            assert actual.columns.is_unique and expected.columns.is_unique, "Use each column label once."
            assert set(actual.columns) == set(expected.columns), "Check the requested column labels."
            actual = actual.reindex(columns=expected.columns)
        else:
            assert list(actual.columns) == list(
                expected.columns
            ), "Check column names and order."
        if unordered_index:
            assert actual.index.is_unique and expected.index.is_unique, "Use each row label once."
            assert set(actual.index) == set(expected.index), "Check the requested row labels."
            actual = actual.reindex(expected.index)
        if unordered_rows_by:
            keys = unordered_rows_by
            assert all(key in actual.columns for key in keys), "Keep the requested row identifiers."
            assert not actual.duplicated(keys).any(), "Use each record and measure once."
            assert not expected.duplicated(keys).any(), "The expected row identifiers are not unique."
            actual = actual.sort_values(keys).reset_index(drop=True)
            expected = expected.sort_values(keys).reset_index(drop=True)
        if not check_index:
            actual, expected = actual.reset_index(drop=True), expected.reset_index(
                drop=True
            )
        assert_frame_equal(
            actual,
            expected,
            check_dtype=False,
            check_names=False,
            check_exact=False,
            rtol=1e-6,
            atol=1e-7,
        )
    else:
        if isinstance(expected, pd.Series):
            # Category labels carry meaning even when their display order does not.
            if not check_index and not unordered_index and isinstance(actual, pd.Series):
                actual, expected = actual.reset_index(drop=True), expected.reset_index(
                    drop=True
                )
            _equal(actual, expected, False, unordered_index=unordered_index)
        else:
            _equal(actual, expected, False)


def _chart_numbers(values):
    import matplotlib.dates as mdates

    if isinstance(values, pd.DatetimeIndex) or pd.api.types.is_datetime64_any_dtype(
        values
    ):
        return np.asarray(mdates.date2num(values), dtype=float)
    return np.asarray(values, dtype=float)


def _same_points(actual, expected):
    a, b = np.asarray(actual, dtype=float), np.asarray(expected, dtype=float)
    if a.shape != b.shape:
        return False
    if a.ndim == 2:
        a = a[np.lexsort(a.T[::-1])]
        b = b[np.lexsort(b.T[::-1])]
    return bool(np.allclose(a, b, rtol=1e-5, atol=1e-6))


def _visible_artist(artist):
    if not artist.get_visible() or artist.get_alpha() == 0:
        return False
    # Per-point alpha can be zero even when the collection alpha is unset.
    if isinstance(artist, PathCollection):
        colors = [artist.get_facecolors(), artist.get_edgecolors()]
        present = [a for a in colors if len(a)]
        if present and all(np.all(a[:, 3] == 0) for a in present):
            return False
        if len(artist.get_sizes()) and np.all(artist.get_sizes() == 0):
            return False
    return True


def _check_axis(ax, rule, evidence):
    assert ax.get_visible() and ax.axison, "Keep the plotted evidence and axes visible."
    assert all(
        _visible_artist(a)
        for a in list(ax.patches) + list(ax.lines) + list(ax.collections)
    ), "Some plotted evidence is hidden or transparent."
    assert ax.get_title().strip(), "Give this view a meaningful title."
    assert (
        ax.get_xlabel().strip() and ax.get_ylabel().strip()
    ), "Label both axes with the measures and units."
    source = evidence[rule["source"]]
    kind = rule["type"]
    if kind == "bars":
        labels = [str(x) for x in source.index]
        values = np.asarray(source.values, dtype=float)
        assert len(set(labels)) == len(labels), "Use each category label once."
        by_label = dict(zip(labels, values))
        bars = [p for p in ax.patches if hasattr(p, "get_width")]
        assert len(bars) == len(values) or (
            not bars and rule.get("allowPoints")
        ), "Show every requested category exactly once."
        x_labels = [t.get_text() for t in ax.get_xticklabels()]
        y_labels = [t.get_text() for t in ax.get_yticklabels()]
        vertical = len(x_labels) == len(labels) and set(x_labels) == set(labels)
        horizontal = len(y_labels) == len(labels) and set(y_labels) == set(labels)
        valid = False
        if vertical and bars:
            valid = (
                _same_points(
                    [[p.get_x() + p.get_width() / 2, p.get_height()] for p in bars],
                    np.column_stack([ax.get_xticks(), [by_label[x] for x in x_labels]]),
                )
                and all(abs(p.get_y()) < 1e-7 for p in bars)
                and abs(ax.get_ylim()[0]) < 1e-7
            )
        if horizontal and bars:
            valid = valid or (
                _same_points(
                    [[p.get_y() + p.get_height() / 2, p.get_width()] for p in bars],
                    np.column_stack([ax.get_yticks(), [by_label[y] for y in y_labels]]),
                )
                and all(abs(p.get_x()) < 1e-7 for p in bars)
                and abs(ax.get_xlim()[0]) < 1e-7
            )
        if not bars and rule.get("allowPoints"):
            points = []
            for collection in ax.collections:
                if isinstance(collection, PathCollection):
                    points.extend(np.asarray(collection.get_offsets()).tolist())
            for line in ax.lines:
                if line.get_marker() not in ("None", "", None):
                    points.extend(
                        np.column_stack(
                            [line.get_xdata(orig=False), line.get_ydata(orig=False)]
                        ).tolist()
                    )
            valid = (
                vertical
                and _same_points(
                    points, np.column_stack([ax.get_xticks(), [by_label[x] for x in x_labels]])
                )
            ) or (
                horizontal
                and _same_points(
                    points, np.column_stack([[by_label[y] for y in y_labels], ax.get_yticks()])
                )
            )
        assert (
            valid
        ), "Check category positions and represented values; bars need a zero baseline."
    elif kind == "hist":
        values = source[rule["column"]] if rule.get("column") else source
        patches = [p for p in ax.patches if hasattr(p, "get_width")]
        assert (
            len(patches) >= 2
        ), "Show frequencies across multiple contiguous numeric intervals."
        patches.sort(key=lambda p: p.get_x())
        edges = np.array(
            [p.get_x() for p in patches]
            + [patches[-1].get_x() + patches[-1].get_width()]
        )
        assert np.all(np.diff(edges) > 0), "Use increasing bin boundaries."
        assert all(
            np.isclose(p.get_x() + p.get_width(), edges[i + 1])
            for i, p in enumerate(patches)
        ), "Numeric intervals should be contiguous."
        counts, _ = np.histogram(np.asarray(values, dtype=float), bins=edges)
        assert counts.sum() == len(
            values
        ), "Include every eligible observation in the distribution."
        assert _same_points(
            [p.get_height() for p in patches], counts
        ), "Check frequencies; plot counts rather than density."
        assert (
            all(abs(p.get_y()) < 1e-7 for p in patches) and abs(ax.get_ylim()[0]) < 1e-7
        ), "Keep a zero baseline for frequency counts."
    elif kind == "scatter":
        points = []
        for collection in ax.collections:
            if hasattr(collection, "get_offsets"):
                points.extend(np.asarray(collection.get_offsets()).tolist())
        for line in ax.lines:
            if line.get_marker() not in ("None", "", None):
                points.extend(
                    np.column_stack([line.get_xdata(), line.get_ydata()]).tolist()
                )
        assert _same_points(
            points, source[[rule["x"], rule["y"]]].to_numpy()
        ), "Plot every complete pair once, keeping the two coordinates together."
    elif kind == "points":
        labels = [t.get_text() for t in ax.get_xticklabels()]
        assert len(labels) == source[rule["group"]].nunique() and set(labels) == set(
            source[rule["group"]].astype(str)
        ), "Label every group once."
        points = []
        for collection in ax.collections:
            if hasattr(collection, "get_offsets"):
                points.extend(np.asarray(collection.get_offsets()).tolist())
        expected = np.array(
            [
                [labels.index(g), v]
                for g, v in source[[rule["group"], rule["value"]]].itertuples(
                    index=False, name=None
                )
            ]
        )
        actual = np.asarray(points, dtype=float)
        assert (
            actual.ndim == 2 and actual.shape == expected.shape
        ), "Show each eligible observation once."
        rounded = np.round(actual[:, 0])
        assert np.all(
            np.abs(actual[:, 0] - rounded) <= 0.45
        ), "Keep each observation within its group."
        assert _same_points(
            np.column_stack([rounded, actual[:, 1]]), expected
        ), "Check the group and measured value of each point."
    elif kind == "box":
        from matplotlib.cbook import boxplot_stats

        labels = [t.get_text() for t in ax.get_xticklabels()]
        assert len(labels) == source[rule["group"]].nunique() and set(labels) == set(
            source[rule["group"]].astype(str)
        ), "Label every depot once."
        # Standard Matplotlib and Seaborn boxes expose their median, caps and whiskers as lines.
        ticks = np.asarray(ax.get_xticks(), dtype=float)
        for position, label in zip(ticks, labels):
            stats = boxplot_stats(
                source.loc[source[rule["group"]] == label, rule["value"]], whis=1.5
            )[0]
            horizontal = []
            vertical = []
            fliers = []
            outlines = [
                np.column_stack(
                    [line.get_xdata(orig=False), line.get_ydata(orig=False)]
                )
                for line in ax.lines
                if len(line.get_xdata()) >= 5
            ]
            for patch in ax.patches:
                path = patch.get_path()
                vertices = path.vertices
                # CLOSEPOLY may carry a dummy (0, 0), depending on Matplotlib version.
                if path.codes is not None and 79 in path.codes:
                    vertices = vertices[path.codes != 79]
                    vertices = np.vstack([vertices, vertices[0]])
                outlines.append(
                    ax.transData.inverted().transform(
                        patch.get_transform().transform(vertices)
                    )
                )
            assert any(
                len(points) >= 5
                and np.allclose(points[0], points[-1])
                and points[:, 0].min() < position < points[:, 0].max()
                and np.ptp(points[:, 0]) < 0.98
                and all(
                    np.isclose(points[:, 1], stats[key]).any() for key in ("q1", "q3")
                )
                for points in outlines
            ), "Show the box representing each group’s middle 50%."
            for line in ax.lines:
                x, y = np.asarray(line.get_xdata(), dtype=float), np.asarray(
                    line.get_ydata(), dtype=float
                )
                if len(x) == 0:
                    continue
                if np.all(np.abs(x - position) < 0.49):
                    if len(y) >= 2 and np.allclose(y, y[0]) and np.ptp(x) > 0:
                        horizontal.append(float(y[0]))
                    if len(y) == 2 and np.allclose(x, position):
                        vertical.append(sorted(y.tolist()))
                    if line.get_marker() not in ("None", "", None):
                        fliers.extend(y.tolist())
            for key in ("med", "whislo", "whishi"):
                assert any(
                    np.isclose(stats[key], v) for v in horizontal
                ), "Check group medians and whisker endpoints."
            assert any(
                np.allclose([stats["whislo"], stats["q1"]], v) for v in vertical
            ), "Check the lower quartile and whisker."
            assert any(
                np.allclose([stats["q3"], stats["whishi"]], v) for v in vertical
            ), "Check the upper quartile and whisker."
            assert _same_points(
                sorted(fliers), sorted(stats["fliers"].tolist())
            ), "Retain observations beyond the whiskers."
    elif kind == "line":
        expected = np.column_stack([_chart_numbers(source.index), source.values])
        found = False
        benchmark = rule.get("benchmark")
        reference = False
        for line in ax.lines:
            try:
                x = _chart_numbers(line.get_xdata())
                y = np.asarray(line.get_ydata(), dtype=float)
                if (
                    line.get_linestyle() not in ("None", "", None)
                    and len(y) == len(source)
                    and _same_points(np.column_stack([x, y]), expected)
                    and np.all(np.diff(x) >= 0)
                ):
                    found = True
                if benchmark is not None and len(y) >= 2 and np.allclose(y, benchmark):
                    legend = ax.get_legend()
                    reference = (
                        line.get_linestyle() not in ("None", "", None)
                        and min(ax.get_ylim()) <= benchmark <= max(ax.get_ylim())
                        and legend is not None
                        and line.get_label()
                        in [t.get_text() for t in legend.get_texts()]
                    )
            except (TypeError, ValueError):
                pass
        assert found, "Check chronological order and the daily values represented."
        if benchmark is not None:
            assert (
                reference and ax.get_legend() is not None
            ), "Show and identify the supplied benchmark."
    else:
        raise AssertionError("Unsupported chart evidence rule.")
    # A technically present observation must also remain within the visible axes.
    visible_points = []
    for patch in ax.patches:
        if hasattr(patch, "get_width"):
            visible_points.extend(
                [
                    (patch.get_x(), patch.get_y()),
                    (
                        patch.get_x() + patch.get_width(),
                        patch.get_y() + patch.get_height(),
                    ),
                ]
            )
    for line in ax.lines:
        if line.get_transform() == ax.transData:
            visible_points.extend(
                zip(line.get_xdata(orig=False), line.get_ydata(orig=False))
            )
    for collection in ax.collections:
        if isinstance(collection, PathCollection):
            visible_points.extend(np.asarray(collection.get_offsets()).tolist())
    if visible_points:
        points = np.asarray(visible_points, dtype=float)
        xlo, xhi = sorted(ax.get_xlim())
        ylo, yhi = sorted(ax.get_ylim())
        assert np.all(
            (points[:, 0] >= xlo - 1e-6)
            & (points[:, 0] <= xhi + 1e-6)
            & (points[:, 1] >= ylo - 1e-6)
            & (points[:, 1] <= yhi + 1e-6)
        ), "Axis limits hide some of the requested evidence."
    # These briefs declare concrete measure/unit labels; case and extra wording are free.
    x, y = ax.get_xlabel().lower(), ax.get_ylabel().lower()
    wantx, wanty = rule["xLabel"].lower(), rule["yLabel"].lower()
    normal = wantx in x and wanty in y
    swapped = kind == "bars" and wantx in y and wanty in x
    assert (
        normal or swapped
    ), "Name the requested measures and units on the appropriate axes."


def _challenge_figure(fig, rule, evidence, displayed):
    from matplotlib.figure import Figure

    assert isinstance(fig, Figure), "Store the finished Figure in fig."
    assert fig in displayed, "Display the named figure with plt.show()."
    panels = rule.get("panels", [rule])
    assert len(fig.axes) == len(panels), "Check the requested number of panels."
    for ax, panel in zip(fig.axes, panels):
        _check_axis(ax, panel, evidence)


def run_challenge(request):
    challenge = request["challenge"]
    checking = request.get("check", False)
    if challenge.get("chart") or any(
        w in request["code"] for w in ("matplotlib", "plt.", "seaborn", "sns.")
    ):
        _ensure_plotting()
    files = {i["file"]: i["columns"] for i in challenge["inputs"] if i.get("file")}
    expected = None
    if checking:
        expected = _execute(
            challenge["reference"],
            {},
            construction=True,
            files=files,
            explicit_setup=True,
        )
        if expected["error"]:
            raise RuntimeError("Challenge reference failed: " + expected["error"])
    if os.path.exists("challenge.png"):
        os.remove("challenge.png")
    exports = []
    if challenge.get("chart"):
        from matplotlib.figure import Figure

        original_savefig = Figure.savefig

        def capture_savefig(figure, filename, *args, **kwargs):
            result = original_savefig(figure, filename, *args, **kwargs)
            if (
                isinstance(filename, (str, os.PathLike))
                and os.path.basename(str(filename)) == "challenge.png"
            ):
                figure.canvas.draw()
                bounds = figure.bbox
                renderer = figure.canvas.get_renderer()
                fits = kwargs.get("bbox_inches") == "tight" or all(
                    bounds.contains(box.x0, box.y0) and bounds.contains(box.x1, box.y1)
                    for box in (ax.get_tightbbox(renderer) for ax in figure.axes)
                )
                import hashlib

                with open(filename, "rb") as exported:
                    digest = hashlib.sha256(exported.read()).hexdigest()
                exports.append(
                    dict(
                        figure=figure,
                        state=_plot_state([figure], {}),
                        fits=fits,
                        digest=digest,
                    )
                )
            return result

        Figure.savefig = capture_savefig
        try:
            actual = _execute(
                request["code"], {}, construction=True, files=files, explicit_setup=True
            )
        finally:
            Figure.savefig = original_savefig
    else:
        actual = _execute(
            request["code"], {}, construction=True, files=files, explicit_setup=True
        )
    results = []
    if checking:
        for deliverable in challenge["deliverables"]:
            name = deliverable["name"]
            kind = deliverable["kind"]
            status = "correct"
            message = "Matches the requested evidence."
            if kind == "export" and (
                not os.path.isfile("challenge.png") or "fig" not in actual["env"]
            ):
                status = "unavailable"
                message = "The exported file or named figure is missing." + (
                    " Python stopped before all outputs were available."
                    if actual["error"]
                    else ""
                )
            elif kind != "export" and name not in actual["env"]:
                status = "unavailable"
                message = (
                    "Create the named output "
                    + name
                    + "."
                    + (
                        " Python stopped before all outputs were available."
                        if actual["error"]
                        else ""
                    )
                )
            else:
                try:
                    if kind == "figure":
                        _challenge_figure(
                            actual["env"][name],
                            challenge["chart"],
                            expected["env"],
                            actual["figures"],
                        )
                    elif kind == "export":
                        assert os.path.isfile(
                            "challenge.png"
                        ), "Save challenge.png from the finished figure."
                        from PIL import Image

                        with Image.open("challenge.png") as saved:
                            assert (
                                saved.format == "PNG"
                                and abs(saved.info.get("dpi", (0,))[0] - 150) < 1
                            ), "Export a PNG at 150 dpi."
                            assert (
                                "fig" in actual["env"]
                            ), "Create the finished fig before exporting."
                            assert (
                                exports
                                and exports[-1]["figure"] is actual["env"]["fig"]
                            ), "Export the named finished fig."
                            assert exports[-1]["state"] == _plot_state(
                                [actual["env"]["fig"]], {}
                            ), "Finish the data and labels before exporting the figure."
                            import hashlib

                            with open("challenge.png", "rb") as exported:
                                assert (
                                    hashlib.sha256(exported.read()).hexdigest()
                                    == exports[-1]["digest"]
                                ), "The exported file changed after saving the figure."
                            assert exports[-1][
                                "fits"
                            ], "Include all chart labels within the exported image."
                    else:
                        actual_value = actual["env"][name]
                        expected_value = expected["env"][name]
                        if deliverable.get("unorderedItems"):
                            assert isinstance(actual_value, list), "Produce the requested list."
                            assert len(actual_value) == len(expected_value) and sorted(
                                actual_value
                            ) == sorted(expected_value), "Check the distinct requested labels."
                        else:
                            _challenge_frame_equal(
                                actual_value,
                                expected_value,
                                check_index=deliverable.get("checkIndex", False),
                                unordered_index=deliverable.get("unorderedIndex", False),
                                unordered_columns=deliverable.get("unorderedColumns", False),
                                unordered_rows_by=deliverable.get("unorderedRowsBy"),
                            )
                except (
                    AssertionError,
                    TypeError,
                    ValueError,
                    KeyError,
                    AttributeError,
                    IndexError,
                    OSError,
                ) as error:
                    status = "needs-attention"
                    message = deliverable["feedback"]
                    if isinstance(error, OSError):
                        message = "The export is not a readable PNG. Save the finished figure again."
                    elif (
                        kind in ("figure", "export")
                        and str(error)
                        and "\n" not in str(error)
                    ):
                        message = str(error)[:220]
                    if (
                        actual["error"]
                        and kind == "export"
                        and not os.path.exists("challenge.png")
                    ):
                        status = "unavailable"
                        message = "Python stopped before the export was available."
            results.append(
                dict(
                    id=deliverable["id"],
                    label=deliverable["label"],
                    status=status,
                    message=message,
                )
            )
    if checking:
        supplied = [i for i in challenge["inputs"] if not i.get("file")]
        if supplied:
            state = "correct"
            message = "Supplied source tables are unchanged."
            try:
                for inp in supplied:
                    if inp["name"] not in actual["env"]:
                        state = "unavailable"
                        message = (
                            "The supplied input " + inp["name"] + " is not available."
                        )
                        break
                    _challenge_frame_equal(
                        actual["env"][inp["name"]], pd.DataFrame(inp["columns"]), True
                    )
            except (AssertionError, TypeError, ValueError):
                state = "needs-attention"
                message = "A supplied source table changed. Keep the incoming evidence intact and prepare separate outputs."
            results.append(
                dict(
                    id="source-inputs",
                    label="Source inputs",
                    status=state,
                    message=message,
                )
            )
    rendered = []
    # Named outputs are the evidence; no artificial dictionary wrapper is required.
    for deliverable in challenge["deliverables"]:
        name = deliverable["name"]
        value = actual["env"].get(name)
        if value is None or deliverable["kind"] in ("figure", "export"):
            continue
        if isinstance(value, (pd.DataFrame, pd.Series)):
            rendered.append(
                dict(
                    kind="table",
                    label=deliverable["label"],
                    value=serialize_dataframe_result(value),
                )
            )
        else:
            rendered.append(
                dict(kind="text", label=deliverable["label"], value=str(value)[:20000])
            )
    for fig in actual["figures"]:
        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", dpi=110, bbox_inches="tight")
        rendered.append(
            dict(
                kind="figure",
                alt=" / ".join(ax.get_title() for ax in fig.axes) or "Challenge figure",
                value="data:image/png;base64,"
                + base64.b64encode(buffer.getvalue()).decode(),
            )
        )
    valid_export = False
    if os.path.isfile("challenge.png"):
        try:
            from PIL import Image

            with Image.open("challenge.png") as exported:
                valid_export = exported.format == "PNG"
                exported.verify()
        except (OSError, ValueError):
            valid_export = False
    if valid_export:
        with open("challenge.png", "rb") as exported:
            rendered.append(
                dict(
                    kind="download",
                    name="challenge.png",
                    value="data:image/png;base64,"
                    + base64.b64encode(exported.read()).decode(),
                )
            )
    if plt is not None:
        plt.close("all")
    passed = bool(
        checking
        and not actual["error"]
        and all(r["status"] == "correct" for r in results)
    )
    return dict(
        passed=passed,
        checked=checking,
        deliverables=results,
        stdout=actual["stdout"],
        error=actual["error"],
        outputs=rendered,
        feedback=(
            "Python stopped with an error. Available outputs were checked; review the error below."
            if actual["error"]
            else (
                "Review each deliverable below."
                if checking
                else "Run finished. Inspect the evidence, then Check answer."
            )
        ),
    )
