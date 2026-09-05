"""Observable reference-predictor and tutorial semantics."""
import re, html
from pathlib import Path
import numpy as np
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.metrics import r2_score, f1_score
# Evaluation-mean R² denominator differs from a predictor fitted to training mean.
train=np.array([0.,0.,0.]);test=np.array([9.,10.,11.]);model=DummyRegressor().fit(np.arange(3).reshape(-1,1),train)
assert r2_score(test,model.predict(np.arange(3).reshape(-1,1)))<0
assert r2_score(test,np.full(3,test.mean()))==0
labels=np.array([0]*95+[1]*5);pred=DummyClassifier(strategy='prior').fit(np.zeros((100,1)),labels).predict(np.zeros((100,1)))
assert np.mean(pred==labels)==.95 and f1_score(labels,pred,average='macro')<.5
source=Path('tutorial.html').read_text();code=source.split('<details class="tutorial-code">',1)[1].split('<pre>',1)[1].split('</pre>',1)[0];exec(html.unescape(code),{})
print('Tutorial counts/snippets, shifted train/test means and imbalanced-reference fixtures passed.')
