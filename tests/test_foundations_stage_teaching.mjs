import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const curriculum = require('../foundations/curriculum.js');
const teaching = require('../foundations/teaching.js');
const byId = Object.fromEntries(curriculum.lessons.map(lesson => [lesson.id, lesson]));
const words = text => String(text).trim().split(/\s+/).filter(Boolean).length;
const counts = {inspect: 0, wrangle: 0, visualise: 0};
let activities = 0;

for (const lesson of curriculum.lessons) {
  for (const [index, round] of lesson.rounds.entries()) {
    const html = teaching.newInTask(curriculum, lesson, round);
    assert.equal(Boolean(html), Boolean(round.stageTeaching), round.id + ': only an authored addition produces a panel');
    if (index === 0 || lesson.review || round.retrieves) {
      assert.equal(round.stageTeaching, null, round.id + ': introductory or retrieval stage has no new-task panel');
    }
    // This catches the original failure directly: calling the later-stage
    // renderer can never reproduce a concept illustration or explorer.
    assert(!/<svg\b|<figure\b|<table\b|teaching-explorer|operation-explorer|concept-visual|<details\b/.test(html), round.id + ': no repeated visual or disclosure');
    assert(!/A small example|What each part does|syntax-choice-callout/.test(html), round.id + ': no inherited mini-lesson');
    if (round.stageTeaching) {
      const addition = round.stageTeaching;
      assert(index > 0 && !lesson.review && !round.retrieves, round.id);
      assert(words(addition.idea) <= 40, round.id + ': one short new idea');
      assert(addition.parts.length >= 1 && addition.parts.length <= 2, round.id + ': only the new syntax');
      assert(addition.code.split('\n').length <= 3, round.id + ': short excerpt');
      assert(!/sample\s*=|pd\.DataFrame\(/.test(addition.code), round.id + ': use the visible exercise objects, not a second sample');
      assert.deepEqual(round.syntaxGuidance.current, addition.parts, round.id + ': current-stage syntax stays visible');
      assert(html.includes('What’s new in this task'), round.id);
      assert.equal((html.match(/<dt>/g) || []).length, addition.parts.length, round.id);
      counts[lesson.deck]++;
    }
    activities++;
  }
}

for (const id of ['I02-2', 'I01CSV-2', 'I03-2', 'I04-2', 'I06S-2', 'I08-3', 'I09-2', 'I13-2', 'I13L-2', 'I17-3', 'I18S-2', 'I18S-3', 'I19S-2', 'W06-2', 'W18-2', 'W19-2', 'W24-2', 'V04-3', 'V06-2', 'V25-2', 'V31-2', 'V33-2']) {
  const lesson = byId[id.slice(0, id.lastIndexOf('-'))];
  assert(lesson.rounds.find(round => round.id === id).stageTeaching, id + ': formerly hidden syntax has concise teaching');
}
for (const id of ['I06-2', 'I16-3', 'W02-2', 'W02-3', 'V04-2', 'V13-3', 'V33-3']) {
  const lesson = byId[id.slice(0, id.lastIndexOf('-'))];
  assert.equal(lesson.rounds.find(round => round.id === id).stageTeaching, null, id + ': familiar combination or setting needs no new concept panel');
}

assert(!byId.I14.guide.idea.includes('unique() '), 'Distinct-count Follow does not start by teaching the later value-list operation');
assert(!byId.W09.guide.idea.includes('map('), 'Recode Follow teaches replace before map');
assert(!byId.I06S.rounds[0].syntaxGuidance.current.some(([code]) => code.includes('to_numpy')), 'Series Follow teaches labels before unlabelled values');
assert(byId.I19S.rounds[0].syntaxGuidance.current.some(([code]) => code.includes('.mean()')), 'Grouped-Series Follow teaches the mean used in its task');
assert(!byId.I19S.rounds[0].syntaxGuidance.current.some(([code]) => /median|sort_values|to_numpy/.test(code)), 'Grouped-Series Follow does not front-load Change or Transfer');
assert.equal(byId.I19S.rounds[0].visual.summaryStatistic, 'mean');
assert.deepEqual(byId.V31.rounds.map(round => round.parameterTeaching.introduces.includes('corner')), [false, true, false], 'The pairplot corner setting is introduced at its first task');

// Prefer one operation illustration and never append a duplicate miniature.
globalThis.FoundationVisuals = require('../foundations/visuals.js');
globalThis.FoundationOperationVisuals = {render: () => '<div data-operation-test="one">Operation visual</div>'};
const operationIntro = teaching.intro(curriculum, byId.W02, byId.W02.rounds[0]);
assert.equal((operationIntro.match(/data-operation-test=/g) || []).length, 1);
assert(!operationIntro.includes('A small example'));
assert(!operationIntro.includes('teaching-illustration'));
delete globalThis.FoundationOperationVisuals;

console.log(JSON.stringify({activities, additions: counts, familiarOrIntroductory: activities - Object.values(counts).reduce((a, b) => a + b, 0), repeatedLaterVisuals: 0}));
