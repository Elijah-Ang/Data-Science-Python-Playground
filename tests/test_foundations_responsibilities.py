"""Native regression checks for visible setup and focused learner responsibilities.

Run with the project's scientific Python environment. Optional --receipt-dir
writes the full executed programs, actual results and immutable input hashes.
The equivalent answers below are authored from the requested chart contracts,
rather than by replacing text in the reference answer.
"""
import argparse
import ast
import base64
import copy
import hashlib
import io
import json
import os
import platform
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FAMILIES = {"V02", "V16", "V26", "V27", "V28", "V34", "V36"}
SOURCE_FILES = (
    "foundations/curriculum.js", "foundations/clarity.js",
    "foundations/workspace.js", "foundations/runtime.py", "table-serialization.py",
)


def sha256(value):
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def json_hash(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False))


def source_hashes():
    return {name: sha256((ROOT / name).read_bytes()) for name in SOURCE_FILES}


def curriculum_export():
    # These programs are exactly the same FoundationWorkspace.code exports
    # used by the browser. Retrievals are enumerated by their source contracts.
    return json.loads(subprocess.check_output(["node", "-e", r'''
const C=require('./foundations/curriculum.js');
const W=require('./foundations/workspace.js');
console.log(JSON.stringify({datasets:C.datasets,rounds:C.lessons.flatMap(l=>
  l.rounds.map((r,i)=>({exercise:r,lessonId:l.id,sourceId:r.retrieves||l.id,
    sourceRound:r.retrieves?2:i,code:W.code(C,r,r.solution),
    starterCode:W.code(C,r),visibleSetup:W.setup(C,r),context:W.context(C,r)})))}));
'''], cwd=ROOT))


def contract(source, index):
    if source == "V02":
        return [
            ("hours", "score", "Study hours and scores", "Hours studied", "Score"),
            ("temperature", "humidity", "Weather relationship", "Temperature (°F)", "Humidity (%)"),
            ("volume_ml", "mass_g", "Trial batch", "Volume (mL)", "Mass (g)"),
        ][index]
    if source == "V16":
        return [
            ("hours", "score", "Study club", "hours", "score"),
            ("temperature", "humidity", "Weather diary", "Temperature (°F)", "Humidity (%)"),
            ("wait_minutes", "consult_minutes", "Clinic visits", "wait_minutes", "consult_minutes"),
        ][index]
    if source == "V26":
        return [
            ("requests", "response_ms", "Service load test", "Requests", "Response time (ms)"),
            ("temperature", "humidity", "Weather diary", "Temperature (°C)", "Humidity (%)"),
            ("minutes", "rating", "Board games", "minutes", "Rating (0–5)"),
        ][index]
    if source == "V15":
        return [
            ("flavour", "price", "Candy shop", "flavour", "price"),
            ("humidity", "sky", "Weather diary", "humidity", "sky"),
            ("batch", "mass_g", "Observations", "batch", "mass_g"),
        ][index]
    if source == "V36":
        return [
            ("flavour", "price", "Candy shop", "flavour", "Mean price"),
            ("size", "price", "Café orders", "size", "Mean price"),
            ("species", "weight", "Pet adoption", "species", "Mean weight"),
        ][index]
    if source == "V28" and index == 2:
        return ("hours", "output", "Installation outputs", "hours", "output")
    if source == "V34" and index == 2:
        return ("wait_minutes", "consult_minutes", "Clinic visits", "Wait (minutes)", "Consultation (minutes)")
    if source == "V34" and index == 1:
        return ("temperature", None, "Weather diary", "temperature", "Count")
    return [
        ("hours", "score", "Study club", "hours", "score"),
        ("temperature", "humidity", "Weather diary", "temperature", "humidity"),
        ("minutes", "rating", "Board games", "minutes", "rating"),
    ][index]


def alternative_work(source, index):
    x, y, title, xlabel, ylabel = contract(source, index)
    finish = "fig.tight_layout()\nplt.show()"
    if source == "V02":
        # Individual setters are the explicitly taught equivalent to ax.set.
        return (f"ax.set_title({title!r})\nax.set_xlabel({xlabel!r})\n"
                f"ax.set_ylabel({ylabel!r})\n" + finish)
    if source == "V16":
        if index == 1:
            return 'ax.scatter(df["temperature"] * 9 / 5 + 32, df["humidity"])\n' + finish
        select = 'observations = df.loc[df["wait_minutes"].notna() & df["consult_minutes"].notna()]' if index == 2 else "observations = df"
        return (select + f'\nobservations = observations.sort_values({y!r}, ascending=False)\n'
                f'ax.scatter(x=observations[{x!r}], y=observations[{y!r}])\n' + finish)
    if source == "V26":
        if index == 0:
            controls = 'ax.set(xscale="log", ylim=(0, ax.get_ylim()[1]))\nax.tick_params(axis="x", labelrotation=30)'
        elif index == 1:
            controls = "ax.set(xlim=(20, 35), ylim=(0, 100))"
        else:
            controls = "ax.set_ybound(lower=0, upper=5)"
        return controls + "\n" + finish
    if source == "V27":
        if index == 0:
            lines = ('vertical = ax.axvline\nhorizontal = ax.axhline\n'
                     'vertical(x=df["hours"].median(), linestyle="--")\n'
                     'horizontal(y=df["score"].median(), linestyle="--")')
        elif index == 1:
            lines = 'benchmark = ax.axhline\nbenchmark(y=df["humidity"].mean(), linestyle="--")'
        else:
            lines = 'benchmark = ax.axhline\nbenchmark(y=4, linestyle="--")'
        return lines + "\n" + finish
    if source == "V28":
        select = 'observations = df.loc[df["active"]]' if index == 2 else "observations = df"
        extreme = "idxmin" if index == 1 else "idxmax"
        label = "Driest" if index == 1 else "Active peak" if index == 2 else "Peak"
        return (select + f'\npoint = observations.loc[observations[{y!r}].{extreme}()]\n'
                f'annotation = dict(text={label!r}, xy=(point[{x!r}], point[{y!r}]), '
                'xytext=(8, 8), textcoords="offset points", arrowprops={"arrowstyle": "->"})\n'
                "ax.annotate(**annotation)\n" + finish)
    if source == "V34":
        # Select the supplied Figure explicitly before using pyplot.savefig.
        labels = 'ax.set(title="Clinic visits", xlabel="Wait (minutes)", ylabel="Consultation (minutes)")\n' if index == 2 else ""
        layout = "fig.subplots_adjust(left=0.16, bottom=0.18, right=0.94, top=0.88)" if index == 1 else "fig.tight_layout()"
        return (labels + layout + '\nplt.figure(fig.number)\n'
                'plt.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()')
    if source == "V36":
        controls = ["ax.set_ybound(lower=0)",
                    'ax.set(yscale="linear")\nax.set_ybound(lower=0)',
                    "ax.set(ylim=(0, 25))"][index]
        return controls + "\n" + finish
    if source == "V15" and index == 2:
        return ('for artist in [*axes[0].lines, *axes[0].collections, *axes[0].patches]:\n    artist.remove()\n'
                'sns.stripplot(x=df["batch"], y=df["mass_g"], jitter=False, ax=axes[0])\n'
                'axes[0].set(title="Observations", xlabel="batch", ylabel="mass_g")\n' + finish)
    if source == "V15":
        # Remove the supplied draft's mark artists without creating a second
        # Axes or discarding the supplied title. Series arguments are equivalent
        # to data=df with named x/y columns.
        return ('for artist in [*ax.lines, *ax.collections, *ax.patches]:\n    artist.remove()\n'
                f'sns.stripplot(x=df[{x!r}], y=df[{y!r}], jitter=False, ax=ax)\n' + finish)
    raise AssertionError(source)


def with_work(row, work):
    marker = "\n# Your work\n"
    assert row["code"].count(marker) == 1, row["exercise"]["id"]
    prefix, original = row["code"].split(marker)
    assert original == row["exercise"]["solution"]
    return prefix + marker + work


def before_show(code, extra):
    # Change a successfully constructed chart before its final display. The
    # near-miss is executable, and rejection therefore tests chart semantics.
    prefix, suffix = code.rsplit("plt.show()", 1)
    return prefix + extra + "\nplt.show()" + suffix


def edited_visible_data(row, work):
    source, index = row["sourceId"], row["sourceRound"]
    x, y, *_ = contract(source, index)
    column = x if source == "V34" and index == 1 else y
    if source == "V15" and index == 1:
        column = x
    code = with_work(row, work)
    supplied = row["exercise"]["setup"]
    boundary = supplied + "\n\n# Your work\n"
    assert supplied and code.count(boundary) == 1
    mutation = f'# Learner edits the supplied values before their marks are drawn.\ndf[{column!r}] = df[{column!r}] + 123\n'
    return code.replace(boundary, mutation + boundary, 1)


def focal_near_misses(source, index, alternative):
    if source == "V02":
        x, y, _, xlabel, ylabel = contract(source, index)
        return [("missing_title", f"ax.set_xlabel({xlabel!r})\nax.set_ylabel({ylabel!r})\nfig.tight_layout()\nplt.show()")]
    if source == "V16":
        x, y, *_ = contract(source, index)
        data = 'df.dropna(subset=["wait_minutes", "consult_minutes"])' if index == 2 else "df"
        return [
            ("swapped_axis_mapping", f"observations={data}\nax.scatter(observations[{y!r}], observations[{x!r}])\nfig.tight_layout()\nplt.show()"),
            ("missing_observations", f"observations=({data}).iloc[:2]\nax.scatter(observations[{x!r}], observations[{y!r}])\nfig.tight_layout()\nplt.show()"),
        ]
    if source == "V26":
        if index == 0:
            return [
                ("linear_instead_of_log", 'ax.set_ylim(bottom=0)\nax.tick_params(axis="x", labelrotation=30)\nfig.tight_layout()\nplt.show()'),
                ("wrong_tick_rotation", alternative.replace("labelrotation=30", "labelrotation=0")),
            ]
        return [("wrong_limits", alternative.replace("xlim=(20, 35)", "xlim=(21, 35)") if index == 1 else alternative.replace("upper=5", "upper=6"))]
    if source == "V27":
        if index == 0:
            wrong = alternative.replace('x=df["hours"].median()', 'x=df["hours"].median()+1')
        elif index == 1:
            wrong = alternative.replace('y=df["humidity"].mean()', 'y=df["humidity"].mean()+1')
        else:
            wrong = alternative.replace("y=4,", "y=4.1,")
        return [("wrong_benchmark", wrong), ("wrong_line_style", alternative.replace('linestyle="--"', 'linestyle=":"'))]
    if source == "V28":
        opposite = alternative.replace("idxmin()", "idxmax()") if index == 1 else alternative.replace("idxmax()", "idxmin()")
        return [
            ("wrong_extreme", opposite),
            ("wrong_annotation_offset", alternative.replace("xytext=(8, 8)", "xytext=(0, 0)")),
            ("missing_annotation_arrow", alternative.replace('arrowprops={"arrowstyle": "->"}', 'arrowprops=None')),
        ]
    if source == "V34":
        misses = [
            ("wrong_export_dpi", alternative.replace("dpi=150", "dpi=72")),
            ("missing_tight_export", alternative.replace('bbox_inches="tight"', 'bbox_inches=None')),
            ("export_after_show", 'fig.tight_layout()\nplt.show()\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")'),
            ("unfinished_export_before_show", ('ax.set(title="Clinic visits", xlabel="Wait (minutes)", ylabel="Consultation (minutes)")\n' if index == 2 else "") + 'title = ax.get_title()\nax.set_title("Incomplete export")\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")\nax.set_title(title)\nfig.tight_layout()\nplt.show()'),
        ]
        if index == 1:
            misses.append(("requested_layout_omitted", 'fig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()'))
            misses.append(("title_outside_figure_canvas", 'fig.subplots_adjust(left=0.16, bottom=0.18, right=0.94, top=0.98)\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()'))
            misses.append(("tick_labels_outside_figure_canvas", 'fig.subplots_adjust(left=0.20, bottom=0.20, right=0.90, top=0.85)\nax.tick_params(axis="x", pad=85)\nax.xaxis.set_label_coords(0.5, 0.05)\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()'))
        if index == 2:
            misses.append(("requested_axis_labels_omitted", 'fig.tight_layout()\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()'))
        return misses
    if source == "V36":
        misses = [("misleading_baseline", alternative.replace("lower=0", "lower=3").replace("ylim=(0, 25)", "ylim=(3, 25)"))]
        if index == 1:
            misses.append(("logarithmic_bar_scale_retained", 'ax.set_ybound(lower=0)\nfig.tight_layout()\nplt.show()'))
        if index == 2:
            misses.append(("wrong_common_report_range", alternative.replace("ylim=(0, 25)", "ylim=(0, 30)")))
        return misses
    if source == "V15" and index == 2:
        return [
            ("wrong_panel_cleared", alternative.replace("axes[0]", "axes[1]")),
            ("summary_instead_of_raw_points", alternative.replace("sns.stripplot", "sns.boxplot").replace("jitter=False, ", "")),
            ("raw_points_appended_to_draft", 'sns.stripplot(data=df, x="batch", y="mass_g", jitter=False, ax=axes[0])\naxes[0].set(title="Observations", xlabel="batch", ylabel="mass_g")\nfig.tight_layout()\nplt.show()'),
        ]
    if source == "V15":
        x, y, *_ = contract(source, index)
        return [
            ("summary_instead_of_raw_points", 'for artist in [*ax.lines, *ax.collections, *ax.patches]:\n    artist.remove()\n'
             f'sns.boxplot(data=df, x={x!r}, y={y!r}, ax=ax)\nfig.tight_layout()\nplt.show()'),
            ("raw_points_appended_to_draft", f'sns.stripplot(data=df, x={x!r}, y={y!r}, jitter=False, ax=ax)\nfig.tight_layout()\nplt.show()'),
            ("reversed_raw_point_mapping", 'for artist in [*ax.lines, *ax.collections, *ax.patches]:\n    artist.remove()\n'
             f'sns.stripplot(x=df[{y!r}], y=df[{x!r}], jitter=False, ax=ax)\nfig.tight_layout()\nplt.show()'),
        ]
    raise AssertionError(source)


def wrongly_paired_marks(source, index):
    if source == "V36":
        return ('heights = [bar.get_height() for bar in ax.patches]\n'
                'for bar, height in zip(ax.patches, heights[::-1]):\n    bar.set_height(height)')
    if source == "V34" and index == 1:
        return "ax.patches[0].set_height(ax.patches[0].get_height() + 1)"
    if source == "V15":
        coordinate = 1 if index == 1 else 0
        return ('for collection in ax.collections:\n    coordinates = collection.get_offsets().copy()\n'
                f'    coordinates[:, {coordinate}] += 1\n    collection.set_offsets(coordinates)')
    return ('coordinates = ax.collections[0].get_offsets().copy()\n'
            'coordinates[:, 1] = coordinates[::-1, 1]\nax.collections[0].set_offsets(coordinates)')


def output_receipts(response, artifact_dir=None, stem=None):
    from PIL import Image
    artifacts = []
    for index, output in enumerate(response.get("outputs", [])):
        item = {key: value for key, value in output.items() if key != "value"}
        value = output.get("value")
        if isinstance(value, str) and value.startswith("data:image/png;base64,"):
            raw = base64.b64decode(value.split(",", 1)[1])
            picture = Image.open(io.BytesIO(raw))
            item.update(sha256=sha256(raw), bytes=len(raw), width=picture.width,
                        height=picture.height, dpi=picture.info.get("dpi"))
            if artifact_dir is not None:
                artifact_dir.mkdir(parents=True, exist_ok=True)
                path = artifact_dir / f"{stem}-{index + 1}.png"
                path.write_bytes(raw)
                item["artifact"] = str(path)
        else:
            item["valueSHA256"] = json_hash(value)
        artifacts.append(item)
    return artifacts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt-dir", type=Path)
    parser.add_argument("--baseline-curriculum", type=Path)
    parser.add_argument("--include-v15", action="store_true")
    arguments = parser.parse_args()
    started = time.monotonic()
    frozen = source_hashes()
    exported = curriculum_export()
    families = set(FAMILIES)
    if arguments.include_v15 or any(row["sourceId"] == "V15" and row["exercise"].get("setupDescription") for row in exported["rounds"]):
        families.add("V15")
    # Fresh reviews retrieve concepts with their own contracts and fixtures;
    # the complete Visualise audit checks them. This suite isolates original
    # lessons whose editor splits fixed setup from focal learner work.
    rows = [row for row in exported["rounds"] if row["sourceId"] in families and row["lessonId"] == row["sourceId"]]
    datasets_before = json_hash(exported["datasets"])
    baseline = json.loads(arguments.baseline_curriculum.read_text()) if arguments.baseline_curriculum else None
    baseline_rounds = {r["id"]: r for lesson in baseline["lessons"] for r in lesson["rounds"]} if baseline else {}
    failures = []
    if baseline and any(exported["datasets"].get(key) != value for key, value in baseline["datasets"].items()):
        failures.append({"case": "dataset_preservation", "reason": "An original published dataset was changed instead of adding an authored fixture."})
    sys.path.insert(0, str(ROOT))
    namespace = {}
    exec((ROOT / "table-serialization.py").read_text() + "\n" + (ROOT / "foundations/runtime.py").read_text(), namespace)
    run = namespace["run_foundation"]
    namespace["_ensure_plotting"]()
    import matplotlib
    import numpy
    import pandas
    import seaborn
    import PIL
    versions = {"python": sys.version, "executable": sys.executable, "platform": platform.platform(),
                "node": subprocess.check_output(["node", "--version"], text=True).strip(),
                "matplotlib": matplotlib.__version__, "numpy": numpy.__version__,
                "pandas": pandas.__version__, "seaborn": seaborn.__version__, "pillow": PIL.__version__}
    receipt_dir = arguments.receipt_dir.resolve() if arguments.receipt_dir else None
    if receipt_dir:
        receipt_dir.mkdir(parents=True, exist_ok=True)
        (receipt_dir / "exported-workspaces.json").write_text(json.dumps(exported, indent=2, ensure_ascii=False) + "\n")
    counts = {"rounds": len(rows), "retrievals": sum(bool(r["exercise"].get("retrieves")) for r in rows),
              "cases": 0, "positive": 0, "negative": 0, "passed_expectations": 0,
              "workspace_single_figure_checks": 0, "duplicate_figure_rejections": 0}
    receipts = []
    for row in rows:
        exercise = row["exercise"]
        round_id = exercise["id"]
        source, index = row["sourceId"], row["sourceRound"]
        original = json_hash(exercise)
        supplied = exercise.get("setup", "")
        responsibilities = {"visible_setup_present": bool(supplied),
                            "setup_description_present": bool(exercise.get("setupDescription", "").strip()),
                            "workspace_contains_fixed_setup_once": bool(supplied) and row["code"].count(supplied + "\n\n# Your work\n") == 1,
                            "reference_has_no_new_figure": "plt.subplots" not in exercise["solution"],
                            "context_explains_visible_editable_setup": "visible and editable" in row["context"],
                            "reference_has_no_import_boilerplate": not any(isinstance(node, (ast.Import, ast.ImportFrom)) for node in ast.walk(ast.parse(exercise["solution"])))}
        if not all(responsibilities.values()):
            failures.append({"id": round_id, "case": "responsibility_contract", "actual": responsibilities})
        alternate = alternative_work(source, index)
        cases = [
            ("model_with_fixed_setup", exercise["solution"], False, True),
            ("full_visible_reference_workspace", row["code"], True, True),
            ("equivalent_focal_work", with_work(row, alternate), True, True),
            ("no_focal_work_still_show", with_work(row, "plt.show()"), True, False),
        ]
        cases += [(name, with_work(row, work), True, False) for name, work in focal_near_misses(source, index, alternate)]
        cases += [
            ("wrong_title", before_show(row["code"], 'axes[0].set_title("Incorrect chart title")' if source == "V15" and index == 2 else 'ax.set_title("Incorrect chart title")'), True, False),
            ("wrong_labelled_pairs_or_counts", before_show(row["code"], wrongly_paired_marks(source, index).replace("ax.", "axes[0].") if source == "V15" and index == 2 else wrongly_paired_marks(source, index)), True, False),
            ("edited_wrong_supplied_values", edited_visible_data(row, exercise["solution"]), True, False),
            # A second prepared chart must be rejected even if each chart has
            # the correct marks individually. Retain the actual two images in
            # the receipt rather than merely asserting a source-code pattern.
            ("duplicate_figure", row["code"] + "\n\n" + supplied + "\n\n" + exercise["solution"], True, False),
            ("fresh_reference_after_wrong_setup", row["code"], True, True),
        ]
        record = {"id": round_id, "sourceId": source, "sourceRound": index + 1,
                  "retrieves": exercise.get("retrieves"), "exercise": copy.deepcopy(exercise),
                  "columns": copy.deepcopy(exported["datasets"][exercise["dataset"]]["columns"]),
                  "inputSHA256": original, "visibleWorkspaceSHA256": sha256(row["code"]),
                  "visibleSetup": row["visibleSetup"], "visibleStarter": row["starterCode"],
                  "context": row["context"], "responsibilityContract": responsibilities,
                  "versions": versions, "sourceSHA256": frozen, "cases": []}
        if round_id in baseline_rounds:
            old = baseline_rounds[round_id]
            record["baseline"] = {"inputSHA256": json_hash(old), "setup": old.get("setup", ""),
                                  "solution": old["solution"], "datasetUnchanged": exercise["dataset"] == old["dataset"],
                                  "focalWorkLinesBefore": len(old["solution"].splitlines()),
                                  "focalWorkLinesAfter": len(exercise["solution"].splitlines())}
        for name, code, explicit, expected in cases:
            ast.parse(code)
            if name.startswith(("wrong", "missing", "linear", "export", "unfinished", "summary")):
                assert code != row["code"], (round_id, name, "near-miss must actually differ")
            case_started = time.monotonic()
            previous = os.getcwd()
            with tempfile.TemporaryDirectory(prefix="foundations-responsibilities-") as directory:
                try:
                    os.chdir(directory)
                    response = run(dict(exercise=exercise, columns=exported["datasets"][exercise["dataset"]]["columns"],
                                        code=code, explicitSetup=explicit, check=True))
                except Exception as exc:
                    response = {"passed": False, "checked": True, "error": repr(exc), "feedback": "", "outputs": []}
                finally:
                    os.chdir(previous)
            artifacts = output_receipts(response,
                receipt_dir / "figures" if receipt_dir and name in {"full_visible_reference_workspace", "equivalent_focal_work"} else None,
                round_id + "-" + name)
            figure_count = sum(output.get("kind") == "figure" for output in response.get("outputs", []))
            expected_figure_count = 2 if name == "duplicate_figure" else 1
            passed_expectation = response["passed"] == expected and not response.get("error") and figure_count == expected_figure_count
            immutable = json_hash(exercise) == original and json_hash(exported["datasets"]) == datasets_before
            passed_expectation = passed_expectation and immutable
            counts["cases"] += 1
            counts["positive" if expected else "negative"] += 1
            counts["passed_expectations"] += bool(passed_expectation)
            if name == "full_visible_reference_workspace" and passed_expectation:
                counts["workspace_single_figure_checks"] += 1
            if name == "duplicate_figure" and passed_expectation:
                counts["duplicate_figure_rejections"] += 1
            result = {"name": name, "code": code, "codeSHA256": sha256(code),
                      "check": True, "explicitSetup": explicit, "expectedPass": expected,
                      "actualPass": response["passed"], "passedExpectation": bool(passed_expectation),
                      "figureCount": figure_count, "expectedFigureCount": expected_figure_count,
                      "inputsUnchanged": immutable, "elapsedSeconds": round(time.monotonic() - case_started, 3),
                      "response": {key: value for key, value in response.items() if key != "outputs"}, "outputArtifacts": artifacts}
            record["cases"].append(result)
            if not passed_expectation:
                failures.append({"id": round_id, "case": name, "expectedPass": expected,
                                 "actualPass": response["passed"], "error": response.get("error"),
                                 "feedback": response.get("feedback"), "figureCount": figure_count,
                                 "expectedFigureCount": expected_figure_count, "inputsUnchanged": immutable})
        record["passed"] = all(responsibilities.values()) and all(case["passedExpectation"] for case in record["cases"])
        if receipt_dir:
            (receipt_dir / f"{round_id}.json").write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n")
        receipts.append({"id": round_id, "sourceId": source, "passed": record["passed"], "cases": len(record["cases"]),
                         "receipt": str(receipt_dir / f"{round_id}.json") if receipt_dir else None})
        print(f'{round_id}: {sum(case["passedExpectation"] for case in record["cases"])}/{len(record["cases"])} expectations passed', flush=True)
    after = source_hashes()
    if after != frozen:
        failures.append({"case": "source_freeze", "before": frozen, "after": after})
    report = {"passed": not failures, "createdAtUTC": datetime.now(timezone.utc).isoformat(),
              "candidate": str(ROOT), "families": sorted(families), "counts": counts,
              "sourceSHA256": frozen, "sourceSHA256After": after, "sourceUnchangedDuringRun": frozen == after,
              "datasetSHA256": datasets_before, "datasetsUnchangedDuringRun": json_hash(exported["datasets"]) == datasets_before,
              "baselineCurriculum": str(arguments.baseline_curriculum) if arguments.baseline_curriculum else None,
              "baselineCurriculumSHA256": sha256(arguments.baseline_curriculum.read_bytes()) if arguments.baseline_curriculum else None,
              "baselineDatasetsUnchanged": exported["datasets"] == baseline["datasets"] if baseline else None,
              "testSHA256": sha256(Path(__file__).read_bytes()), "versions": versions,
              "elapsedSeconds": round(time.monotonic() - started, 3), "rounds": receipts, "failures": failures}
    if receipt_dir:
        (receipt_dir / "summary.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
