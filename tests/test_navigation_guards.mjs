import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const shared = fs.readFileSync('notebook-session.js', 'utf8');
const statistics = fs.readFileSync('statistics/app.js', 'utf8');
for (const file of ['playground.html', 'ml-app.js']) {
  assert.match(fs.readFileSync(file, 'utf8'), /NotebookSession\?\.install\(\{\s*(?:persist:false,\s*)?confirmLeave:true/);
}
for (const source of [shared, statistics]) {
  const registration = source.match(/window\.addEventListener\('beforeunload',[\s\S]*?\}\);/)[0];
  let handler;
  const cells = [];
  vm.runInNewContext(registration, {
    window: {addEventListener: (_, callback) => {handler = callback;}},
    cells, adapter: {confirmLeave: true, get: () => ({cells})},
    save() {}, savingFailed: false,
  });
  let prevented = false;
  const event = {preventDefault() {prevented = true;}};
  handler(event);
  assert.equal(prevented, source === shared, 'The shared adapter confirms leaving even an empty workspace when explicitly enabled; Statistics guards existing work');
  cells.push({code: 'df.head()', output: {}});
  handler(event);
  assert.equal(prevented, true, 'Notebook work requests navigation confirmation');
  assert.equal(event.returnValue, '');
}
console.log('Data, ML and Statistics request leave confirmation when notebook work exists.');
