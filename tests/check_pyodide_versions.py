"""Check that the CI scientific-Python environment matches Pyodide 0.26.4."""

from __future__ import annotations

import importlib.metadata
import json


EXPECTED = {
    "numpy": "1.26.4",
    "pandas": "2.2.0",
    "scikit-learn": "1.4.2",
    "scipy": "1.12.0",
    "matplotlib": "3.5.2",
    "seaborn": "0.13.2",
}


def main() -> int:
    installed = {name: importlib.metadata.version(name) for name in EXPECTED}
    if installed != EXPECTED:
        raise SystemExit(
            "Pyodide-parity version check failed:\n"
            + json.dumps({"expected": EXPECTED, "installed": installed}, indent=2)
        )
    print(json.dumps({"pyodide": "0.26.4", "versions": installed}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
