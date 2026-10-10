"""Run an unchanged landing/mascot contract with flushed lifecycle diagnostics."""
import argparse
import json
import os
import runpy
import sys
import time
import traceback
from functools import wraps
from pathlib import Path

from playwright.sync_api import Browser, BrowserContext, BrowserType, Locator, Page

parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=['chromium', 'webkit'], required=True)
parser.add_argument('--base-url', required=True)
parser.add_argument('--case', choices=['landing', 'mascot'], required=True)
args = parser.parse_args()
test = Path(__file__).resolve().with_name('test_landing_refresh_browser.py' if args.case == 'landing' else 'test_mascot_hover_browser.py')
out = Path('tests/evidence/learn-discovery').resolve()
out.mkdir(parents=True, exist_ok=True)
log = (out / f'{args.engine}-{args.case}-lifecycle.jsonl').open('w', encoding='utf-8')
phase = 'startup'
watched = set()
os.environ.setdefault('DEBUG', 'pw:browser')


def processes():
    """Linux child-process state, without command lines or environment values."""
    rows = {}
    for path in Path('/proc').glob('[0-9]*/status'):
        try:
            fields = dict(line.split(':', 1) for line in path.read_text().splitlines())
            pid = int(fields['Pid'])
            rows[pid] = {'pid': pid, 'parent': int(fields['PPid']), 'name': fields['Name'].strip(),
                         **{k: fields[k].strip() for k in ('State', 'VmRSS', 'VmHWM', 'Threads') if k in fields}}
        except (OSError, ValueError, KeyError):
            continue
    children = {os.getpid()}
    while True:
        found = {pid for pid, row in rows.items() if row['parent'] in children}
        if found <= children:
            break
        children |= found
    return [rows[pid] for pid in sorted(children) if pid in rows]


def emit(event, **details):
    row = {'time': time.time(), 'monotonic': time.monotonic(), 'event': event, 'phase': phase, **details, 'processes': processes()}
    # A summed process RSS snapshot can count shared pages more than once.
    # It is neither unique memory consumption nor proof of an OOM kill.
    row['rss_kib'] = sum(int(p.get('VmRSS', '0 kB').split()[0]) for p in row['processes'])
    log.write(json.dumps(row, ensure_ascii=True) + '\n')
    log.flush()
    print('Browser lifecycle:', json.dumps({k: v for k, v in row.items() if k != 'processes'}), flush=True)


def watch_page(page):
    if page in watched:
        return
    watched.add(page)
    page.on('crash', lambda _: emit('page.crash', url=page.url, closed=page.is_closed(), connected=page.context.browser.is_connected()))
    page.on('close', lambda _: emit('page.close', url=page.url, closed=page.is_closed(), connected=page.context.browser.is_connected()))
    page.on('pageerror', lambda error: emit('page.error', error=str(error)))
    page.context.on('close', lambda _: emit('context.close'))
    emit('page.created', url=page.url)


def wrap(cls, method):
    original = getattr(cls, method)

    @wraps(original)
    def observed(self, *positional, **keywords):
        global phase
        # Other locator evaluations are unchanged and need no per-call sampling.
        if cls is Locator and method == 'evaluate' and '.garden-slider' not in str(self):
            return original(self, *positional, **keywords)
        caller = next((f for f in reversed(traceback.extract_stack()) if f.filename == str(test)), None)
        phase = f'{cls.__name__}.{method}' + (f' at {test.name}:{caller.lineno}' if caller else '')
        details = {'location': str(self)} if cls is Locator else {}
        frame = sys._getframe().f_back
        while frame and frame.f_code.co_filename != str(test):
            frame = frame.f_back
        if frame:
            details['case_state'] = {k: frame.f_locals[k] for k in ('mode', 'width', 'height', '_')
                                     if k in frame.f_locals and isinstance(frame.f_locals[k], (str, int))}
        del frame
        if cls is Page and method in ('set_viewport_size', 'emulate_media'):
            details['arguments'] = positional or keywords
        emit('call.begin', **details)
        result = original(self, *positional, **keywords)
        if cls is BrowserType:
            result.on('disconnected', lambda _: emit('browser.disconnected', connected=result.is_connected()))
        if method == 'new_page':
            watch_page(result)
        if cls is Page and method in ('goto', 'reload'):
            emit('navigation.response', url=self.url, status=result.status if result else None)
            emit('navigation.document', document=self.evaluate('''()=>({
                title:document.title,ready:document.readyState,viewport:[innerWidth,innerHeight],
                images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,
                    natural:[i.naturalWidth,i.naturalHeight],rect:[i.getBoundingClientRect().width,i.getBoundingClientRect().height],
                    display:getComputedStyle(i).display,visibility:getComputedStyle(i).visibility}))
            })'''))
        emit('call.end', **details)
        return result

    setattr(cls, method, observed)


for cls, methods in [(BrowserType, ['launch']), (Browser, ['new_page', 'new_context', 'close']),
                     (BrowserContext, ['new_page', 'close']),
                     (Page, ['goto', 'reload', 'set_viewport_size', 'emulate_media', 'wait_for_timeout', 'wait_for_function', 'close']),
                     (Locator, ['evaluate', 'hover', 'focus', 'get_attribute'])]:
    for method in methods:
        wrap(cls, method)

diagnostic_root = out / 'lifecycle' / f'{args.engine}-{args.case}'
diagnostic_root.mkdir(parents=True, exist_ok=True)
original_cwd = Path.cwd()
# The unchanged scripts write relative evidence paths. Separate these reruns
# so a diagnostic pass can never overwrite the original gate's failed evidence.
os.chdir(diagnostic_root)
emit('test.begin', test=str(test), engine=args.engine, diagnostic_root=str(diagnostic_root))
sys.argv = [str(test), '--engine', args.engine, '--base-url', args.base_url]
previous_trace = sys.gettrace()


def exception_trace(frame, event, value):
    if frame.f_code.co_filename != str(test):
        return None
    if event == 'exception':
        kind, error, _ = value
        emit('test.exception', line=frame.f_lineno, error_type=kind.__name__, error=str(error), before_scope_cleanup=True)
    return exception_trace


sys.settrace(exception_trace)
try:
    runpy.run_path(str(test), run_name='__main__')
except BaseException as error:
    emit('test.failed', error_type=type(error).__name__, error=str(error))
    raise
else:
    emit('test.passed')
finally:
    sys.settrace(previous_trace)
    os.chdir(original_cwd)
    log.close()
