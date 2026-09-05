"""Compatibility entry point for the current ML browser regression.

The route surface no longer exposes the old notebook-management toolbar or
the retired guided/practice controls. The focused suite owns the active
browser contract and exercises the same editable cells, optional evidence,
holdout latch, unsupervised routes, and reset behaviour used by CI. Keep this
filename as a stable command-line entry point for local users and downstream
scripts.
"""

from __future__ import annotations

from test_ml_workflow_browser import main


if __name__ == "__main__":
    raise SystemExit(main())
