"""Read-only source server with existing built-runtime fallbacks for visual review.
No build, copy into production, service-worker edit, or deployment is performed.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

REPO=Path(__file__).resolve().parents[1]
ROOT=REPO
class ReviewHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def translate_path(self,path):
        target=Path(super().translate_path(path))
        relative=target.relative_to(ROOT)
        if relative.parts and relative.parts[0]=='pyodide':
            return str(REPO/'vendor'/relative)
        if not target.exists() and relative.name in ('app-platform.js','runtime-contracts.js','data-runtime.js'):
            return str(REPO/'dist'/relative.name)
        return str(target)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8012);parser.add_argument('--built',action='store_true');args=parser.parse_args()
    if args.built: ROOT=REPO/'dist'
    print(f'Review at http://127.0.0.1:{args.port}/statistics.html?runtime=local',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),ReviewHandler).serve_forever()
