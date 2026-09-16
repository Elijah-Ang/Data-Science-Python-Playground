/* Actual light-theme UI captures, 16 September 2026. Rectangles are document pixels.
   Keep these paired with assets/tour-captures/v2-{wide,mobile}-*.jpg. */
window.TOUR_CONTENT = (() => {
  const scenes = {};
  function scene(name, wide, mobile, targets) {
    scenes[name] = {wide:{width:1440,height:wide,targets:{}},mobile:{width:390,height:mobile,targets:{}}};
    for (const [key, pair] of Object.entries(targets)) for (const [i, profile] of ['wide','mobile'].entries()) {
      const [x,y,w,h] = pair[i];
      scenes[name][profile].targets[key] = {x,y,w,h};
    }
  }
  scene('data',1000,1866,{
    nav:[[969,8,278,40],[11,39,272,40]],
    dataset:[[18,67,361,37],[11,101,368,53]],
    inspector:[[13,353,230,152],[11,372,368,104]],
    route:[[278,165,1142,44],[10,1443,370,50]],
    tools:[[1117,124,303,36],[10,1342,370,96]]
  });
  scene('data-run',1000,1987,{cell:[[278,264,672,107],[10,1048,370,127]],output:[[969,329,450,390],[10,1175,370,350]]});
  scene('data-guide',1000,1987,{guide:[[340,84,760,400],[24,84,358,240]]});
  scene('stats',1000,1879,{setup:[[0,58,1100,56],[0,92,390,163]],route:[[278,142,1142,44],[10,1411,370,50]]});
  scene('stats-study',1329,2467,{study:[[0,114,1440,331],[0,255,390,430]],confidence:[[891,67,93,34],[10,211,181,34]]});
  scene('stats-results',1000,6515,{output:[[968,237,452,690],[24,5500,342,185]]});
  scenes['stats-results'].wide = {width:1189,height:640,targets:{output:{x:817,y:300,w:351,h:280}}};
  scene('ml',1000,1878,{dataset:[[16,67,401,37],[10,101,370,37]],model:[[431,67,993,37],[10,146,370,108]],route:[[278,142,1142,44],[10,1404,370,50]]});
  scene('ml-guide',1000,1878,{guide:[[340,84,760,400],[8,8,374,240]]});
  scene('ml-results',1000,11407,{result:[[969,304,450,621],[10,10188,370,235]]});
  // This desktop output was captured at a smaller viewport without resizing its scroll panel.
  scenes['ml-results'].wide = {width:1200,height:640,targets:{result:{x:825,y:237,w:355,h:300}}};
  for (const name of ['ml-validate','ml-tune']) {
    scene(name,640,844,{guide:[[275,357,680,250],[54,446,317,275]]});
    scenes[name].wide.width = 1189;
  }
  scene('home',1307,1116,{robot:[[1080,78,180,278],[12.5,236,365,110]]});
  scene('learn',1000,1489,{pathways:[[102,373,1236,354],[18,388,354,330]]});
  scene('decks',1000,1241,{decks:[[40,350,1360,450],[16,330,358,500]]});
  scene('chapters',3641,8121,{chapters:[[40,281,1360,32],[16,313,358,228]],lesson:[[40,405,445,254],[16,633,358,254]]});
  scene('lesson',1063,3396,{exercise:[[587,162,813,94],[16,326,358,107]],practice:[[721,266,679,570],[16,2550,358,565]]});
  scene('lesson-result',1063,3611,{result:[[721,706,679,210],[17,3030,356,388]],progression:[[720,929,680,53],[16,3449,358,65]]});
  const chapters = [];
  const add = (group,scene,focus,label,title,description,context,mobile) => chapters.push({group,scene,focus,label,title,description,context,mobile});
  add('Data','data','nav','Navigate','Four places to explore.','HOME returns to the garden. DATA explores tables, STATS tests questions, and ML builds models. These buttons stay at the top of each workspace.','Scroll or use Next. Jump sections at the top.');
  add('Data','data','dataset','Choose','Start with a dataset.','Choose a bundled dataset. Wait for Python to be ready, then check the inspector for the source, columns and row count. Your working table is named df.','No upload or Python installation needed.');
  add('Data','data','route','Route','Follow a useful first route.','Start with Preview rows, then summary, filtering, a new column and a chart. Select a route task to add its Python cell. Read each result before continuing.','More tasks offers other questions to explore.','The suggested route is below the notebook. Swipe it sideways for later steps; tap a task to add its Python cell. Start with Preview rows, then read the result before continuing.');
  add('Data','data-run','cell','Run','Edit. Run. Read.','Change df.head(10) to df.head(5), then press Run. The result updates beside the notebook. Add cell gives you a blank place to try your own Python.','Notebook and output scroll independently.','Change df.head(10) to df.head(5), then tap Run. Read the result directly below that cell. Add cell gives you a blank place to try your own Python.');
  add('Data','data-guide','guide','Challenges','Find another question.','Challenges opens a reference for the current dataset. Expand a question to see what to try. Drag the booklet by its header; scroll its contents to read.','Close or minimise the booklet to return to your cells.');
  add('Stats','stats','setup','Question','Choose the question first.','Open STATS. Choose a question, a dataset and a confidence level. Here we ask whether mean penguin body mass differs between two species.','A question determines the analysis—not the other way round.');
  add('Stats','stats-study','study','Study setup','Tell it what to compare.','Open Study setup. Select the numeric outcome, grouping variable and groups. Here: body_mass_g, species, Adelie and Chinstrap. Check the research question before running.','Group order matters: the difference is A minus B.');
  add('Stats','stats','route','Sequence','Build the evidence in order.','Run Frame, Select / explore, Assumptions, Analyse, Effect & CI, then Conclude. Each completed step unlocks the next. Run suggested route executes the full sequence.','Read the generated Python and its output at each step.','Swipe the route sideways through Frame, Select / explore, Assumptions, Analyse, Effect & CI and Conclude. Each completed step unlocks the next; results sit below their cells.');
  add('Stats','stats-study','confidence','Uncertainty','Check before you conclude.','Keep the confidence level chosen before analysing. In Assumptions, inspect the plots and study design. A diagnostic p-value cannot prove independence or justify causation.','Welch’s t-test does not require equal group variances.');
  add('Stats','stats-results','output','Interpret','Read size and uncertainty.','In this run, Adelie minus Chinstrap is about −27 g; the 95% interval runs from −146 to +92 g. It includes zero: this is not clear evidence of a difference, nor proof of equality.','Report the estimate, interval and study limitations—not only a p-value.');
  add('ML','ml','dataset','Dataset','Define the prediction problem.','Open ML and choose a dataset. The inspector names the target and available features. This example predicts diagnosis from measurements; it is a teaching exercise, not a clinical tool.','X contains inputs. y contains the answer to predict.');
  add('ML','ml','model','Model setup','Choose inputs and a model.','Feature scenario selects the input columns. Model chooses the algorithm. Keep five folds for a first run: validation will repeatedly fit and check the model within the training data.','This example uses five measures and Logistic Regression.');
  add('ML','ml','route','Split','Save the final test first.','Follow the route from step 1. Step 2 saves 20% of rows for the final test. Explore only training rows, then define preparation and build the pipeline.','Keeping preparation inside the pipeline helps prevent data leakage.','Swipe the route sideways to move through its steps. Start at 1, then save 20% for the final test at step 2. Explore training rows and keep preparation inside the pipeline.');
  add('ML','ml-guide','guide','Workflow','Understand each step.','Workflow opens the full reference: the question, plain-language concepts, exact Python and what to look for. It changes with your dataset and model. Use it beside the editable cells.','Drag the header to move it; scroll inside to read later steps.');
  add('ML','ml-validate','guide','Validate','Compare before tuning.','At steps 6 and 7, read validation scores across folds and compare with a simple reference. Higher training scores alone do not mean a better model. Look for a large training–validation gap.','The saved final test is still untouched.');
  add('ML','ml-tune','guide','Tune','Tune, then inspect mistakes.','Step 8 compares settings using training folds. Step 9 helps explain errors, such as confused classes. Because selection used those folds, these diagnostics are not independent final evidence.','Do not use the final test to choose your settings.');
  add('ML','ml-results','result','Final test','Open the holdout last.','Only after choosing the model, run Final test. Compare its score with validation and describe a limitation. Here macro F1 is 0.916 on 114 held-out rows; it is not a performance guarantee.','The guided final test runs once per walkthrough.');
  add('Learn','home','robot','Robot','Start with the nerdy robot.','On HOME, tap the reading robot to open Learn / Refresh. You can practise a skill first, or come back whenever a line of Python is unfamiliar.','The Learn / Refresh button in DATA is another way in.');
  add('Learn','learn','pathways','Pathways','Choose what to practise.','Open Data Foundations for interactive Python lessons. The Statistics and Machine Learning lesson pathways are marked Coming soon; their playgrounds are already available via STATS and ML.','Lessons are optional. You can explore the playground directly.');
  add('Learn','decks','decks','Decks','Pick a deck.','Inspect teaches you to read a table. Wrangle / Preprocess helps clean and transform it. Visualise turns questions into charts. Choose the skill you need today.','Start with Inspect if pandas is new to you.');
  add('Learn','chapters','chapters','Chapters','Follow the chapter arrows.','Move from Getting oriented to Selecting data, Understanding values, then Reading the whole table. The arrows show the sequence; each chapter button lets you jump to that part of the deck.','Open a lesson card to begin.');
  add('Learn','lesson','exercise','Practice types','Follow. Change. Transfer.','First follow a guided example. Next change it for another context. Then transfer the idea independently. Read the tiny table and the task before writing code.','Hints and Reveal solution are there if you get stuck.');
  add('Learn','lesson','practice','Write Python','Try the code yourself.','Replace the blanks in Your Python. Run code shows what Python produces; Check answer also checks whether it meets the task. If it fails, read the feedback, edit and try again.','Control / Command + Enter runs your code.');
  add('Learn','lesson-result','progression','Next practice','Keep the skill moving.','After checking your result, choose Next practice to try the next variation. Use the breadcrumb or back link to return to the deck and pick another lesson.','Practice is session-only. No account or saved learning progress.');
  return {scenes,chapters};
})();
