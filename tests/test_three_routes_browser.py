"""Compatibility entry point for the approved insertion-only route audit."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test_slim_routes_browser.py')),run_name='__main__')
