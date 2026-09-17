(function(root){
  'use strict';
  function setup(curriculum, round) {
    const fromScratch = round.id.startsWith('I01-') || round.id === 'V01-1';
    const parts = [];
    if (!fromScratch && !round.files) parts.push(curriculum.setupCode(round.dataset));
    // Imports are visible too: the learner namespace has no hidden library aliases.
    const combined = [round.setup,round.starter,round.solution].join('\n');
    if (!fromScratch && !parts.length && !/^import pandas as pd$/m.test(round.starter) && /\bpd\./.test(combined)) parts.push('import pandas as pd');
    if (/\bnp\./.test(combined) && !/^import numpy as np$/m.test(round.starter)) parts.push('import numpy as np');
    if (round.target === 'plot') {
      if (!/^import matplotlib.pyplot as plt$/m.test(round.starter)) parts.push('import matplotlib.pyplot as plt');
      if (/\bsns\./.test(combined) && !/^import seaborn as sns$/m.test(round.starter)) parts.push('import seaborn as sns');
    }
    if (round.setup) parts.push(round.setup);
    return parts.join('\n\n');
  }
  function code(curriculum,round,body=round.starter) {
    const supplied=setup(curriculum,round);
    return (supplied ? '# Supplied setup — editable\n'+supplied+'\n\n# Your work\n' : '')+body;
  }
  function context(curriculum,round) {
    if (round.files) return 'Available file'+(Object.keys(round.files).length>1?'s':'')+': '+Object.keys(round.files).join(', ')+'. Load the file in your code; no table is loaded for you.';
    if (round.id.startsWith('I01-')) return round.setup ? 'The editor supplies the lists. Build the table yourself.' : 'Build the table from the values below. No table is created for you.';
    if (round.id === 'V01-1') return 'Start with a new Figure. This exercise needs no dataset.';
    return 'The editable setup on the right creates df'+(round.setup?' and the additional inputs shown below':'')+'. Run executes the setup and your work from top to bottom.';
  }
  const api={setup,code,context};
  root.FoundationWorkspace=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
