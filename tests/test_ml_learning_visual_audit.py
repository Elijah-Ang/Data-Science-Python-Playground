"""A visual/content change invalidates the reviewed contact-sheet inventory."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
r=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')]))
a=json.loads((ROOT/'docs/ml-learning-visual-review.json').read_text())
for path,expected in a['sourceHashes'].items():assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==expected,'Visual source changed: '+path
cards=[c for c in r['cards'] if c['kind']=='teaching']
assert a['teachingCount']==len(cards)
assert a['thumbnailCount']==len(r['cards'])
assert set(a['thumbnailSignatures'])=={c['id'] for c in r['cards']}
assert len(set(a['thumbnailSignatures'].values()))==len(r['cards'])
assert set(a['cardHashes'])=={c['id'] for c in cards}
for c in cards:
 expected=hashlib.sha256(json.dumps({k:c[k] for k in ['title','goal','explanation','visual']},sort_keys=True).encode()).hexdigest()
 assert a['cardHashes'][c['id']]==expected,'Visual content changed: '+c['id']
assert {c['id'] for c in a['captures'] if c['theme']=='light' and c['width']==1440}=={c['id'] for c in cards}
for theme,width in [('dark',1440),('light',320),('light',390)]:
 assert len({c['family'] for c in a['captures'] if c['theme']==theme and c['width']==width})==a['primitiveVariantCount']
print(str(len(cards))+' concept visuals, '+str(len(r['cards']))+' distinct card thumbnails and every primitive/variant dark + 320/390 contact-sheet audit remain current.')
