"""Compatibility entrypoint for the current committed-selection regression.

The previous insertion-only contract is superseded by approved automatic runs.
Historical source remains in the recoverable pre-change source backup.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test_committed_routes_browser.py')),run_name='__main__')
