"""Compare executable curriculum contracts with the pre-interaction revision."""

import argparse
import hashlib
import io
import json
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--baseline", default="b52d8600bd53d7f4592880944ed2e37577950892")
parser.add_argument(
    "--output",
    type=Path,
    default=ROOT
    / "docs/curriculum-evidence/inline-code-controls/exercise-contracts.json",
)
args = parser.parse_args()
baseline = subprocess.check_output(
    ["git", "rev-parse", args.baseline], cwd=ROOT, text=True
).strip()


def digest(value):
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def curriculum(path):
    return json.loads(
        subprocess.check_output(
            [
                "node",
                "-e",
                "console.log(JSON.stringify(require(process.argv[1])))",
                str(path / "foundations/curriculum.js"),
            ]
        )
    )


def ml(path):
    return json.loads(
        subprocess.check_output(
            [sys.executable, str(path / "ml-learning/authoring.py")], cwd=path
        )
    )


def without_meanings(value):
    if isinstance(value, dict):
        return {k: without_meanings(v) for k, v in value.items() if k != "meaning"}
    if isinstance(value, list):
        return [without_meanings(v) for v in value]
    return value


with tempfile.TemporaryDirectory(prefix="curriculum-contract-baseline-") as directory:
    base = Path(directory)
    archive = subprocess.check_output(
        ["git", "archive", baseline, "foundations", "challenges", "ml-learning"],
        cwd=ROOT,
    )
    with tarfile.open(fileobj=io.BytesIO(archive)) as saved:
        for member in saved:
            if not member.isfile():
                continue
            name = Path(member.name)
            assert not name.is_absolute() and ".." not in name.parts
            target = base / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(saved.extractfile(member).read())
    original_data, current_data = curriculum(base), curriculum(ROOT)
    assert original_data["datasets"] == current_data["datasets"]
    left = {e["id"]: e for c in original_data["lessons"] for e in c["rounds"]}
    right = {e["id"]: e for c in current_data["lessons"] for e in c["rounds"]}
    assert left == right
    original, current = ml(base), ml(ROOT)

a = {e["id"]: e for c in original["cards"] for e in c["exercises"]}
b = {e["id"]: e for c in current["cards"] for e in c["exercises"]}
assert a.keys() == b.keys()
changes = {}
for key in a:
    diffs = sorted(
        k for k in a[key].keys() | b[key].keys() if a[key].get(k) != b[key].get(k)
    )
    if diffs:
        changes[key] = diffs
    assert set(diffs) <= {"syntaxGuidance", "newInTask", "activityExplanation"}, (
        key,
        diffs,
    )
    for field in ["syntaxGuidance", "newInTask"]:
        assert without_meanings(a[key].get(field)) == without_meanings(
            b[key].get(field)
        ), (key, field)

old_challenges = {c["id"]: c for c in original["challenges"]}
new_challenges = {c["id"]: c for c in current["challenges"]}
assert old_challenges.keys() == new_challenges.keys()
challenge_changes = {}
for key, before in old_challenges.items():
    after = new_challenges[key]
    assert {k: v for k, v in before.items() if k != "exercise"} == {
        k: v for k, v in after.items() if k != "exercise"
    }
    old, new = before["exercise"], after["exercise"]
    diff = sorted(k for k in old.keys() | new.keys() if old.get(k) != new.get(k))
    assert set(diff) <= {"syntaxGuidance"}, (key, diff)
    assert without_meanings(old.get("syntaxGuidance")) == without_meanings(
        new.get("syntaxGuidance")
    )
    if diff:
        challenge_changes[key] = diff

challenge_contracts = {
    key: {k: v for k, v in c["exercise"].items() if k != "syntaxGuidance"}
    for key, c in new_challenges.items()
}
unchanged = {
    key: {
        k: v
        for k, v in item.items()
        if k not in {"syntaxGuidance", "newInTask", "activityExplanation"}
    }
    for key, item in b.items()
}
record = dict(
    baseline=baseline,
    passed=True,
    foundationsRounds=len(left),
    identicalFoundationsRoundSHA256=digest(left),
    identicalFoundationsDatasetsSHA256=digest(current_data["datasets"]),
    mlExercises=len(b),
    identicalMLContractSHA256=digest(unchanged),
    unchangedChallengeContracts=len(challenge_contracts),
    identicalChallengeContractSHA256=digest(challenge_contracts),
    challengeProseChanges=challenge_changes,
    mlProseChanges=changes,
    scope="All Data Foundations round fields and datasets are identical. ML changes are confined to meaning text in syntaxGuidance/newInTask and activityExplanation; code, accepted forms and concept identities match. Every other exercise field and all challenge contracts are identical; challenge syntaxGuidance meanings are simplified too.",
)
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(record, indent=2) + "\n")
print(
    f"{len(left)} Data rounds and datasets identical; {len(b)} ML exercise contracts and {len(challenge_contracts)} workflows unchanged."
)
