"""Fetch only the two extra pinned Pyodide wheels; verify the existing lock hashes."""
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
LOCK = json.loads((HERE.parent / 'vendor/pyodide/pyodide-lock.json').read_text())
(HERE / 'runtime').mkdir(exist_ok=True)
for name in ('patsy', 'statsmodels'):
    package = LOCK['packages'][name]
    target = HERE / 'runtime' / package['file_name']
    if not target.exists():
        partial = target.with_suffix('.part')
        try:
            subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                            'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' + target.name,
                            '--output', str(partial)], check=True)
            if hashlib.sha256(partial.read_bytes()).hexdigest() != package['sha256']:
                raise RuntimeError(f'Checksum mismatch: {partial}')
            partial.replace(target)
        finally:
            partial.unlink(missing_ok=True)
    if hashlib.sha256(target.read_bytes()).hexdigest() != package['sha256']:
        raise RuntimeError(f'Checksum mismatch: {target}; remove this file and rerun preparation.')
    print(f'Verified {name} {package["version"]}')
