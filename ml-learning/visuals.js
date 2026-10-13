/* Reusable, labelled schematics. Executed model figures are rendered separately. */
(function(root){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const line=(x,y,a,b,extra='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+a+'" y2="'+b+'" '+extra+'/>';
  const text=(x,y,s,extra='')=>'<text x="'+x+'" y="'+y+'" '+extra+'>'+esc(s)+'</text>';
  const box=(x,y,w,h,label,cls='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="4" class="'+cls+'"/>'+text(x+w/2,y+h/2+5,label,'text-anchor="middle"');
  const arrow=(x,y,a,b)=>line(x,y,a,b,'marker-end="url(#ml-arrow)"');
  const dots=[[55,154],[95,158],[132,118],[178,122],[227,92],[278,80],[327,69],[372,34]];
  const types={
    workflow:()=>[['Question / X, y','Split: reserve test','Training-only folds'],['Dummy + candidate','Choose + diagnose','Final predict / explain']].map((row,r)=>row.map((label,c)=>box(12+c*182,30+r*96,166,60,label,c===2?'accent':'')+(c<2?arrow(179+c*182,60+r*96,192+c*182,60+r*96):'')).join('')).join('')+text(280,222,'Fit preparation inside folds. Open final evidence once.','text-anchor="middle"'),
    tasks:()=>box(10,92,112,45,'Question')+line(122,114,148,114)+line(148,27,148,192)+['Predict quantity','Predict label','Discover groups','Reduce dimensions'].map((label,i)=>arrow(148,27+i*55,178,27+i*55)+box(182,5+i*55,350,43,label)).join(''),
    table:()=>['Observation','Feature X₁','Feature X₂','Target y'].map((s,i)=>box(20+i*130,22,122,36,s,i===3?'accent':'' )).join('')+[0,1,2].map(r=>['row '+(r+1),[2,5,8][r],['standard','express','economy'][r],['known','known','unknown'][r]].map((v,i)=>box(20+i*130,65+r*41,122,35,v,i===3?'accent':'' )).join('')).join('')+text(282,218,'Keep row identities aligned; new rows provide X.','text-anchor="middle"'),
    split:()=>box(20,25,510,36,'Observations')+arrow(160,64,160,95)+arrow(440,64,440,95)+box(20,100,310,50,'Training → fit / validate','accent')+box(370,100,160,50,'Final test')+line(350,75,350,180,'stroke-dasharray="6 5"')+text(278,208,'Protect final rows from preparation and selection.','text-anchor="middle"'),
    pipeline:()=>box(10,80,110,54,'Training X')+arrow(120,107,155,107)+box(157,28,145,47,'Scale numbers','accent')+box(157,133,145,47,'Encode categories','accent')+line(145,50,145,157)+line(145,50,157,50)+line(145,157,157,157)+arrow(305,51,345,107)+arrow(305,157,345,107)+box(350,80,178,54,'Fit estimator')+text(276,216,'Each fold learns its own preparation.','text-anchor="middle"'),
    folds:()=>[0,1,2,3,4].map(r=>text(12,45+r*30,'Fold '+(r+1))+[0,1,2,3,4].map(c=>box(90+c*68,25+r*30,59,25,r===c?'V':'T',r===c?'accent':'')).join('')).join('')+box(455,25,75,145,'Final')+text(276,212,'T: fit on training rows   V: validate   Final: held away','text-anchor="middle"'),
    regression:()=>line(28,188,414,188)+line(28,188,28,15)+line(45,170,394,35,'class="accent-stroke"')+dots.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="5"/>'+line(x,y,x,170+(x-45)*(35-170)/(394-45),'stroke-dasharray="3 3"')).join('')+text(440,70,'actual −')+text(440,94,'predicted')+text(240,218,'Residuals measure signed vertical differences.','text-anchor="middle"'),
    comparison:()=>text(115,32,'Candidate A')+text(290,32,'Candidate B')+['Fit','Validate','Cost'].map((s,i)=>text(12,75+i*48,s)+box(110,51+i*48,[75,150,95][i],27,'','accent')+box(290,51+i*48,[100,112,160][i],27,'')).join('')+text(275,222,'Compare matching evidence; smaller error can cost more.','text-anchor="middle"'),
    classification:()=>text(205,22,'Predicted class')+text(120,64,'A')+text(250,64,'B')+text(17,115,'Actual A')+text(17,170,'Actual B')+box(98,78,103,49,'7','accent')+box(211,78,103,49,'1')+box(98,136,103,49,'3')+box(211,136,103,49,'1','accent')+text(355,101,'B precision: 1 / 2')+text(355,139,'B recall: 1 / 4')+text(275,218,'Inspect every class; accuracy can hide missed cases.','text-anchor="middle"'),
    tree:()=>box(180,15,180,45,'Feature ≤ threshold?')+arrow(223,63,140,105)+arrow(317,63,410,105)+text(141,86,'yes')+text(380,86,'no')+box(42,111,188,53,'Predict from leaf','accent')+box(310,111,188,53,'Split again')+text(275,214,'Leaves use training averages or class counts.','text-anchor="middle"'),
    geometry:()=>line(20,190,540,190)+line(20,190,20,10)+[0,1,2].map(g=>'<circle cx="'+(97.5+g*155)+'" cy="'+(85.5+(g%2)*35)+'" r="48" fill="none" stroke-dasharray="5 4"/>'+[0,1,2,3].map(i=>box(75+g*155+i*12,67+(g%2)*35+(i%2)*28,9,9,'',g===1?'accent':'')).join('')+text(97.5+g*155,90.5+(g%2)*35,'×','text-anchor="middle"')).join('')+text(278,216,'Distance, neighbourhoods and centres depend on scale.','text-anchor="middle"'),
    gaussian:()=>'<ellipse cx="165" cy="104" rx="110" ry="47" transform="rotate(25 165 104)"/><ellipse cx="371" cy="104" rx="94" ry="60" transform="rotate(-25 371 104)" class="accent"/>'+text(142,106,'Class A')+text(348,106,'Class B')+line(265,22,265,181,'stroke-dasharray="5 5"')+text(275,215,'Compare means, covariance shapes and assumptions.','text-anchor="middle"'),
    network:()=>[0,1,2].flatMap(layer=>Array.from({length:layer===1?4:2},(_,i)=>({x:85+layer*190,y:layer===1?35+i*43:65+i*83,layer}))).map((p,i,all)=>all.filter(q=>q.layer===p.layer+1).map(q=>line(p.x,p.y,q.x,q.y,'class="thin"')).join('')+'<circle cx="'+p.x+'" cy="'+p.y+'" r="12" class="'+(p.layer===1?'accent':'')+'"/>').join('')+text(67,203,'Inputs')+text(244,220,'Hidden units')+text(440,203,'Outputs'),
    hierarchy:()=>line(60,178,60,138)+line(140,178,140,138)+line(60,138,140,138)+line(100,138,100,88)+line(240,178,240,88)+line(100,88,240,88)+line(170,88,170,40)+line(370,178,370,116)+line(480,178,480,116)+line(370,116,480,116)+line(425,116,425,40)+line(170,40,425,40)+line(25,103,525,103,'class="accent-stroke" stroke-dasharray="6 5"')+text(25,24,'Merge distance')+text(276,216,'A cut chooses a descriptive grouping resolution.','text-anchor="middle"'),
    pca:()=>line(34,180,297,180)+line(34,180,34,15)+arrow(50,166,282,35)+arrow(158,104,112,23)+dots.slice(0,6).map(([x,y])=>'<circle cx="'+(x*.62+20)+'" cy="'+(y*.7+20)+'" r="4"/>').join('')+text(267,34,'PC1')+text(69,23,'PC2')+[110,54,27,12,4].map((h,i)=>box(345+i*37,175-h,27,h,'',i<2?'accent':'')).join('')+text(333,204,'Variance by component')+text(147,219,'New axes combine measurements.','text-anchor="middle"'),
    time:()=>[0,1,2].map(r=>box(25,25+r*55,145+r*85,35,'Earlier training','accent')+box(182+r*85,25+r*55,78,35,'Later')).join('')+arrow(25,211,523,211)+text(523,198,'Time','text-anchor="end"')
  };
  // Variants share geometry but teach the particular card's concept.
  function variant(v){
    const id=v.id||'';
    if(id==='W-K1')return box(12,65,145,60,'Mixed inputs')+arrow(161,95,194,95)+box(199,65,155,60,'Shared folds','accent')+arrow(358,95,391,95)+box(396,65,151,60,'Final RMSE')+text(280,189,'Compare the mean reference; diagnose training-only residuals.','text-anchor="middle"')+text(280,220,'Evaluate the fixed linear recipe on reserved rows once.','text-anchor="middle"');
    if(id==='F03'){
      const observations=[[12,85],[34,76],[57,53],[82,43],[108,18]];
      const plot=(x,fitted)=>line(x,172,x+132,172)+line(x,172,x,55)+
        (fitted?line(x+8,155,x+120,67,'class="accent-stroke"'):'')+
        observations.map(([a,b])=>'<circle cx="'+(x+a)+'" cy="'+(60+b)+'" r="4"/>').join('');
      return text(86,27,'Observations X, y','text-anchor="middle"')+plot(20,false)+
        arrow(158,112,186,112)+text(275,27,'Unfitted estimator','text-anchor="middle"')+
        '<rect x="193" y="55" width="164" height="117" rx="4"/>'+
        text(275,99,'LinearRegression()','text-anchor="middle"')+text(275,133,'No learned line yet','text-anchor="middle"')+
        arrow(364,112,392,112)+text(472,27,'Fitted estimator','text-anchor="middle"')+plot(406,true)+
        text(472,193,'Learned line','text-anchor="middle"')+
        text(280,225,'fit(X, y) learns the line from these observations.','text-anchor="middle"');
    }
    if(id==='F09')return box(20,25,520,45,'Illustrative population: 8 A + 4 B')+arrow(155,75,155,105)+arrow(415,75,415,105)+box(20,112,245,55,'Training: 6 A + 3 B','accent')+box(295,112,245,55,'Test: 2 A + 1 B')+text(278,216,'Stratification preserves class proportions approximately.','text-anchor="middle"');
    if(id==='W02')return box(20,25,240,60,'Training outcomes')+arrow(270,55,302,55)+box(310,25,230,60,'Learn a constant','accent')+text(278,140,'Regression: training mean','text-anchor="middle"')+text(278,176,'Classification: most frequent training class','text-anchor="middle"')+text(278,216,'Evaluate the reference on the same rows as the candidate.','text-anchor="middle"');
    if(id==='U04')return box(15,25,150,50,'Candidate k values')+arrow(170,50,205,50)+box(212,25,335,50,'Inertia + silhouette','accent')+arrow(378,80,378,115)+box(212,123,335,50,'Sizes + profiles + purpose')+text(278,218,'A score supports a choice; it does not prove natural classes.','text-anchor="middle"');
    if(id==='U05')return [['Group','Size','Mean length (mm)'],['0','n₀','μ₀'],['1','n₁','μ₁'],['2','n₂','μ₂']].map((row,r)=>row.map((x,c)=>box(15+c*180,15+r*42,170,35,x,c===2?'accent':'')).join('')).join('')+text(278,211,'Aggregate original measurements with aligned assignments.','text-anchor="middle"');
    if(id==='U09')return box(10,55,158,65,'Population: N rows')+arrow(172,87,198,87)+box(205,55,150,65,'Sample: n rows','accent')+arrow(360,87,389,87)+box(395,55,155,65,'n aligned labels')+text(278,179,'Preserve sampled row identities through fitting and profiles.','text-anchor="middle"')+text(278,214,'The hierarchy describes the sampled observations.','text-anchor="middle"');
    if(id==='U10')return box(10,25,150,60,'Measurements')+arrow(165,55,199,55)+box(205,25,150,60,'Fit groups','accent')+arrow(360,55,389,55)+box(395,25,155,60,'Interpretation')+box(205,128,150,55,'External labels')+arrow(360,155,467,92)+text(278,219,'External labels may aid interpretation after fitting.','text-anchor="middle"');
    if(id==='P05')return box(15,35,245,80,'Weights: features × axes','accent')+box(300,35,245,80,'Scores: rows × axes')+text(137,158,'How is each axis defined?','text-anchor="middle"')+text(422,158,'Where is each observation?','text-anchor="middle"')+text(278,216,'Label feature names, row identities and component order.','text-anchor="middle"');
    if(id==='P07')return box(20,30,230,65,'score × axis weights')+box(310,30,230,65,'(−score) × (−weights)','accent')+text(280,70,'=','text-anchor="middle"')+text(278,151,'Consistent sign reversal preserves the reconstruction.','text-anchor="middle"')+text(278,211,'Discarding components, unlike reversing signs, loses information.','text-anchor="middle"');
    if(id==='M04')return box(20,30,230,60,'Original setting')+arrow(257,60,300,60)+box(310,30,230,60,'Proposed new setting','accent')+text(278,138,'Same variable definitions and availability?','text-anchor="middle"')+text(278,174,'Comparable population, horizon and costs?','text-anchor="middle"')+text(278,214,'Seek validation evidence for the intended use.','text-anchor="middle"');
    if(id==='R11')return box(20,25,520,65,'Observed: predictive error under this evaluation','accent')+arrow(278,95,278,124)+box(20,132,520,65,'Qualify: population, model, inputs and uncertainty')+text(278,227,'Prediction evidence alone does not identify causal effects.','text-anchor="middle"');
    if(id==='F10')return box(10,70,155,60,'Available inputs','accent')+arrow(170,100,200,100)+box(207,70,145,60,'Prediction time')+arrow(357,100,391,100)+box(398,70,152,60,'Later outcome')+text(278,205,'Could this input be known when the prediction is made?','text-anchor="middle"');
    if(id==='W07')return box(10,40,150,65,'Training: 2, ?, 6')+arrow(165,73,207,73)+box(215,40,145,65,'Learn median: 4','accent')+arrow(365,73,393,73)+box(400,40,150,65,'Filled: 2, 4, 6')+text(278,161,'Reuse that replacement for later missing values.','text-anchor="middle"')+text(278,205,'Fit the replacement inside each training boundary.','text-anchor="middle"');
    if(id==='W10')return box(20,30,225,65,'Before fit: settings','accent')+box(315,30,225,65,'After fit: learned values')+text(133,125,'get_params()','text-anchor="middle"')+text(428,125,'coef_, intercept_','text-anchor="middle"')+arrow(248,63,308,63)+text(278,207,'Choose settings; fitting estimates parameters from data.','text-anchor="middle"');
    if(id==='R02')return box(20,35,240,70,'RMSE: outcome units','accent')+box(300,35,240,70,'R²: relative squared error')+text(140,150,'How large are errors?','text-anchor="middle"')+text(420,150,'Compared with a mean?','text-anchor="middle"')+text(278,211,'Use the same aligned outcomes and predictions.','text-anchor="middle"');
    if(id==='R04')return [['Row','Distance','Weight'],['A',5,2],['B',5,4]].map((row,r)=>row.map((x,c)=>box(20+c*180,20+r*43,170,35,x,c===2?'accent':'')).join('')).join('')+text(278,179,'Predicted difference = 2 × fitted weight coefficient','text-anchor="middle"')+text(278,214,'Change one input while holding the other fixed.','text-anchor="middle"');
    if(id==='R06')return box(20,25,230,65,'x₁ ≈ x₂')+arrow(257,58,300,58)+box(310,25,230,65,'Similar combined signal','accent')+text(278,137,'β₁ can rise while β₂ falls.','text-anchor="middle"')+text(278,173,'β₁x₁ + β₂x₂ can remain nearly unchanged.','text-anchor="middle"')+text(278,214,'Stable predictions do not imply stable coefficients.','text-anchor="middle"');
    if(id==='C05')return line(280,25,280,174,'class="accent-stroke"')+[[70,65],[135,125],[205,90]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="7"/>').join('')+[[340,120],[430,65],[485,135]].map(([x,y])=>box(x,y,14,14,'')).join('')+text(110,25,'Class A')+text(390,25,'Class B')+text(278,211,'Logistic classification uses a linear decision boundary.','text-anchor="middle"');
    if(['C08','C09'].includes(id))return '<circle cx="270" cy="100" r="75" fill="none" stroke-dasharray="5 4"/>'+text(263,107,'?')+[[230,65],[300,75],[120,140]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="7"/>').join('')+[[260,137],[430,100]].map(([x,y])=>box(x,y,14,14,'')).join('')+text(40,25,'○ Class A     □ Class B')+text(365,42,'? New row')+text(278,213,'Nearby training labels vote in the prepared feature space.','text-anchor="middle"');
    if(id==='C11')return '<path d="M160 45 C220 5 340 30 365 95 S290 180 205 156 S120 83 160 45Z" fill="none" class="accent-stroke"/>'+[[210,75],[285,120],[315,65]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="7"/>').join('')+[[80,115],[430,65],[455,155]].map(([x,y])=>box(x,y,14,14,'')).join('')+text(278,213,'An RBF boundary can curve; validate its flexibility.','text-anchor="middle"');
    if(id==='N04')return [60,125].map(y=>'<circle cx="75" cy="'+y+'" r="12"/>'+[40,95,150].map(b=>line(87,y,267,b)).join('')).join('')+[40,95,150].map(y=>'<circle cx="279" cy="'+y+'" r="12" class="accent"/>'+line(291,y,458,95)).join('')+'<circle cx="470" cy="95" r="12"/>'+text(45,193,'Features')+text(231,193,'Hidden units')+text(415,193,'One quantity')+text(278,225,'The target wrapper returns predictions in original units.','text-anchor="middle"');
    if(id==='R05'){
      return [['Service','express','standard'],['economy',0,0],['express',1,0],['standard',0,1]].map((row,r)=>row.map((x,c)=>box(20+c*180,20+r*43,170,35,x,c?'accent':'')).join('')).join('')+text(278,218,'Economy is the omitted reference in this example.','text-anchor="middle"');
    }
    if(id==='C17'){
      return '<ellipse cx="165" cy="104" rx="105" ry="47" transform="rotate(25 165 104)"/><ellipse cx="380" cy="104" rx="105" ry="47" transform="rotate(25 380 104)" class="accent"/>'+text(142,106,'Class A')+text(357,106,'Class B')+text(278,215,'LDA: different class means, one shared covariance shape.','text-anchor="middle"');
    }
    if(id==='C15'){
      return '<ellipse cx="165" cy="104" rx="100" ry="47"/><ellipse cx="380" cy="104" rx="60" ry="78" class="accent"/>'+text(142,106,'Class A')+text(357,106,'Class B')+text(278,215,'Gaussian NB: independent feature likelihoods within a class.','text-anchor="middle"');
    }
    if(id==='C13'){
      return [['Numeric interval','Rule prediction'],['x < a','Class A'],['a ≤ x < b','Class B'],['x ≥ b','Class A']].map((row,r)=>row.map((x,c)=>box(65+c*220,20+r*43,210,35,x,c?'accent':'')).join('')).join('')+text(278,218,'Cut points a and b are learned inside each fit.','text-anchor="middle"');
    }
    if(id==='W04'){
      return ['Service','standard','express','economy'].map((s,i)=>box(15+i*134,20,127,35,s)).join('')+
        [['standard',1,0,0],['express',0,1,0],['economy',0,0,1]].map((row,r)=>row.map((x,c)=>box(15+c*134,65+r*42,127,35,x,c?'accent':'')).join('')).join('')+
        text(275,218,id==='R05'?'Omit one category to make a linear reference explicit.':'Named categories become aligned indicator columns.','text-anchor="middle"');
    }
    if(id==='W03'||id==='U02'){
      return box(15,18,240,160,'')+box(302,18,240,160,'')+
        text(135,43,'Raw: unequal units','text-anchor="middle"')+text(422,43,'Standardised','text-anchor="middle"')+
        [[40,140],[80,130],[130,150],[175,125],[220,140]].map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="5"/><circle cx="'+(325+(x-40)*.98)+'" cy="'+(70+(y-125)*3)+'" r="5"/>').join('')+
        arrow(264,105,292,105)+text(278,218,'Fit statistics at the boundary appropriate to the question.','text-anchor="middle"');
    }
    if(id==='F08'){
      return box(15,30,150,60,'Measurements')+arrow(170,60,210,60)+box(217,30,135,60,'Fitted classifier','accent')+arrow(357,60,395,60)+box(402,30,135,60,'Class label')+
        text(60,142,'New row 1 → A')+text(300,142,'New row 2 → C')+text(278,209,'A label names a category, even when stored as a number.','text-anchor="middle"');
    }
    if(['C04','C07'].includes(id)){
      return text(22,30,'Probability for class B')+[.2,.6,.9].map((p,i)=>text(20,75+i*46,'Row '+(i+1))+box(100,52+i*46,p*350,28,'','accent')).join('')+
        line(275,40,275,189,'stroke-dasharray="5 4"')+text(278,216,'A threshold turns a probability into a class decision.','text-anchor="middle"');
    }
    if(id==='C03'){
      return box(20,30,150,55,'Class A F1: .78')+box(205,30,150,55,'Class B F1: .33')+arrow(280,92,280,126)+
        box(125,137,310,47,'Macro F1: (.78 + .33) / 2','accent')+text(278,219,'Each class contributes equally, regardless of frequency.','text-anchor="middle"');
    }
    if(['C12','C13'].includes(id)){
      return text(278,24,'One selected feature → majority rule for each value','text-anchor="middle"')+
        [['Service','Rule prediction'],['standard','on time'],['express','on time'],['economy','late']].map((row,r)=>row.map((x,c)=>box(75+c*205,43+r*36,195,30,x,c?'accent':'')).join('')).join('')+
        text(278,219,id==='C13'?'Continuous values use bins learned within each fit.':'Select by training errors; unseen values use a fallback.','text-anchor="middle"');
    }
    if(id==='C14'||id==='R09'||id==='R10'){
      const classification=id==='C14';
      return box(180,15,180,45,classification?'Width ≤ threshold?':'x ≤ threshold?')+arrow(223,63,140,105)+arrow(317,63,410,105)+text(140,86,'yes')+text(380,86,'no')+
        box(30,111,220,53,classification?'8 A, 1 B → predict A':'Targets 8,10,12 → mean 10','accent')+box(305,111,230,53,classification?'1 A, 9 B → predict B':'Targets 18,20 → mean 19')+
        text(278,218,classification?'Purer child class counts reduce impurity.':'Each leaf predicts its training target average.','text-anchor="middle"');
    }
    if(['C10','C11'].includes(id)){
      return line(280,180,280,20,'class="accent-stroke"')+line(200,180,200,20,'stroke-dasharray="5 4"')+line(360,180,360,20,'stroke-dasharray="5 4"')+
        [[80,65],[135,135],[200,95],[360,95],[430,65],[480,145]].map(([x,y],i)=>(i<3?'<circle cx="'+x+'" cy="'+y+'" r="6"/>':box(x-5.5,y-5.5,11,11,''))+(i===2||i===3?'<circle cx="'+x+'" cy="'+y+'" r="16" fill="none"/>':'')).join('')+
        text(278,204,'Linear-margin intuition · RBF operates in feature space.','text-anchor="middle"')+
        text(278,226,'Its boundary can curve in the original feature space.','text-anchor="middle"');
    }
    if(['R07','R08'].includes(id)){
      return line(25,184,530,184)+line(25,184,25,18)+'<path d="M40 45 Q270 270 510 40" fill="none" class="accent-stroke"/><path d="M40 155 Q270 110 510 70" fill="none" stroke-dasharray="6 4"/>'+
        text(60,38,'Curved features')+text(365,120,'Straight-line candidate')+text(278,219,'More flexibility must earn its place in validation.','text-anchor="middle"');
    }
    if(['N02','N05'].includes(id)){
      return line(30,180,520,180)+line(30,180,30,20)+'<path d="M45 35 C110 120 180 150 510 160" fill="none" class="accent-stroke"/><path d="M45 42 C130 100 260 130 340 100 S440 64 510 50" fill="none" stroke-dasharray="6 4"/>'+
        text(370,154,'Training loss')+text(358,37,'Validation error')+text(278,219,'Falling training loss does not establish generalisation.','text-anchor="middle"');
    }
    return null;
  }
  let diagramId=0;
  // Card-size scenes use short, lesson-specific labels. The full diagrams above
  // have a different purpose and remain available inside each lesson.
  const miniSpecs=Object.freeze({
    F01:'fork|Predict quantity|Predict class|Discover groups',
    F02:'table|One observation|Features X|Target y',
    F03:'plot|Observed points|fit(X, y)|Learned line',
    F04:'flow|New feature row|fitted.predict|Predicted value',
    F05:'residual|Actual y|Predicted y|Error distance',
    F06:'split|All observations|Seen for learning|Unseen for test',
    F07:'split|Aligned X and y|Seeded train rows|Reserved test rows',
    F08:'scatter|Feature space|Class A or B|New row label',
    F09:'split|A and B classes|Training mix|Test mix',
    F10:'guard|Known at decision|Prediction time|Later outcome',
    'F-R1':'choice|X versus y|fit versus predict|Recall the roles',
    'F-R2':'choice|Training evidence|Final evidence|Keep them apart',
    'F-K1':'flow|Frame and reserve|Dummy, CV, diagnose|One final error',
    F11:'pipeline|Delivery X|Linear model|Minutes of error',
    F12:'pipeline|Specimen X|Classifier|Class errors',
    W01:'table|Training rows|Types and gaps|Inspect before fit',
    W02:'bars|Dummy score|Model score|Same folds',
    W03:'scatter|Unequal units|Scaled distance|Nearby rows',
    W04:'table|Category value|One-hot columns|No false order',
    W05:'pipeline|Numeric: scale|Category: encode|Estimator',
    W06:'flow|Prepare in pipe|Fit each fold|Predict new rows',
    W07:'table|Missing value|Train median|Reuse at predict',
    W08:'folds|Fold fit rows|Validation rows|Final held out',
    W09:'bars|Fold 1|Fold 2|Score spread',
    W10:'choice|Set before fit|Learned after fit|Check quality',
    W11:'folds|Try settings|Compare folds|Choose recipe',
    W12:'residual|Out-of-fold|Training only|Test sealed',
    W13:'flow|Choose with CV|Refit training|Test only once',
    W14:'time|Earlier fit|Later validate|Latest test',
    'W-R1':'choice|Impute and scale|Encode categories|Fit within folds',
    'W-R2':'choice|Compare CV|Diagnose errors|Open test once',
    'W-K1':'pipeline|Mixed inputs|Shared folds|Final RMSE',
    W15:'guard|Spot the leak|Repair boundary|Rerun folds',
    W16:'bars|Training fit|Validation fit|Hidden errors',
    'W-K2':'flow|Frame question|Validate recipe|Report result',
    'W-K3':'flow|Stratify labels|Choose macro F1|Final class errors',
    R01:'plot|Intercept|Slope|New prediction',
    R02:'choice|RMSE: error units|R²: versus mean|Different meanings',
    R03:'residual|Residual pattern|Large misses|Limits',
    R04:'choice|Change weight|Hold distance|Compare prediction',
    R05:'table|Economy reference|Indicator columns|Coefficients',
    R06:'choice|Correlated X|Shifting weights|Stable predictions',
    R07:'curve|x and x²|Curved fit|Validate it',
    R08:'curve|More degrees|Train improves|Validate first',
    R09:'tree|Split on X|Leaf average A|Leaf average B',
    R10:'tree|Control depth|Larger leaves|Validate error',
    R11:'choice|Prediction works|Association seen|No causal claim',
    'R-R1':'choice|Read weights|Inspect residuals|Report RMSE',
    'R-R2':'choice|Line or curve|Tree flexibility|Common folds',
    'R-K1':'flow|Candy features|Compare models|Final RMSE',
    C01:'matrix|True class|Predicted class|Count each error',
    C02:'matrix|Precision|Recall|Error costs',
    C03:'bars|Class A F1|Class B F1|Macro average',
    C04:'prob|Class chance|Threshold|Final label',
    C05:'scatter|Linear boundary|Class A|Class B',
    C06:'folds|Scale inside CV|Logistic fit|Macro F1',
    C07:'prob|Lower threshold|More alerts|Fewer misses',
    C08:'scatter|Query point|Nearby votes|Chosen label',
    C09:'bars|Small k|Large k|Validate k',
    C10:'scatter|Linear intuition|Support rows|Scaled SVC',
    C11:'curve|RBF boundary|Curved regions|Tune with CV',
    C12:'tree|One feature|Majority rule|Default class',
    C13:'tree|Numeric cut|Binned values|One-R rule',
    C14:'tree|Class counts|Purer leaves|Predicted class',
    C15:'gauss|Class prior|Feature density|Posterior',
    C16:'table|Binary counts|Word counts|Continuous X',
    C17:'gauss|Different means|Shared shape|LDA',
    C18:'gauss|Class A shape|Class B shape|QDA',
    C19:'gauss|Few rows|Covariance fit|Regularise',
    'C-R1':'choice|Confusion counts|Macro F1|Reference score',
    'C-R2':'choice|Neighbour scale|SVM margin|One-R rule',
    'C-R3':'choice|Tree leaves|Bayes likelihood|LDA or QDA',
    'C-K1':'flow|Penguin X|Choose by CV|Inspect confusion',
    N01:'network|Input features|Hidden units|Output',
    N02:'curve|Current weights|Training loss|Update weights',
    N03:'network|Scaled X|Class outputs|Macro F1',
    N04:'network|Scaled X|One output|Original units',
    N05:'curve|Training loss|Validation gap|Stop in time',
    N06:'network|More capacity|Regularisation|Validation',
    'N-R1':'choice|Inputs and units|Loss and convergence|Class or value',
    'N-K1':'flow|Wine X|Tune network|Original RMSE',
    'N-K2':'flow|Penguin X|Tune network|Class errors',
    U01:'fork|No target y|Find groups|Describe structure',
    U02:'scatter|Original units|Scaled space|Distance changes',
    U03:'cluster|Assign point|Move centroid|Repeat',
    U04:'choice|Inertia|Silhouette|Inspect profiles too',
    U05:'table|Cluster label|Original units|Group profile',
    U06:'cluster|Elongated shape|Centroid limit|Check geometry',
    U07:'hierarchy|Small merges|Larger merges|Dendrogram',
    U08:'hierarchy|Cut height|Group count|Describe groups',
    U09:'hierarchy|Sample rows|Keep row IDs|Interpret sample',
    U10:'guard|Fit without label|Profile groups|Avoid truth claim',
    'U-R1':'choice|Scale distance|Choose k|Profile groups',
    'U-R2':'choice|Linkage|Cut height|Sample scope',
    'U-K1':'flow|Prepare X|Find groups|Profile in units',
    P01:'pca|Original X|New axes|Scores',
    P02:'pipeline|Fit scaler|Fit PCA|Transform new X',
    P03:'choice|Variance kept|Prediction score|Not equivalent',
    P04:'bars|Component shares|Retained prefix|Target variance',
    P05:'table|Feature weights|Row scores|Keep IDs',
    P06:'pca|Two-axis view|Other axes|Lost detail',
    P07:'pca|Flip both signs|Same projection|Same rebuilt X',
    'P-R1':'choice|Scale then PCA|Retain variance|Read loadings',
    'P-K1':'flow|Penguin X|Retain axes|Explain plot',
    M01:'fork|Predict number|Predict class|Discover pattern',
    M02:'choice|Candidate A|Candidate B|Use common folds',
    M03:'choice|Observed score|Error meaning|State limits',
    M04:'guard|Original setting|New setting|Check transfer',
    'M-R1':'choice|Pick the task|Match metric|Explain claim',
    'M-K1':'flow|Frame task|Choose evidence|Qualify result'
  });
  const miniTableRows=Object.freeze({
    F02:[['row 01','distance','minutes'],['row 02','weight','minutes']],
    W01:[['row 01','numeric','check range'],['row 02','category','check gaps']],
    W04:[['express','0 · 1 · 0','aligned'],['economy','0 · 0 · 1','aligned']],
    W07:[['missing','learn 4','fill with 4'],['new row','reuse 4','no refit']],
    R05:[['economy','0 · 0','reference'],['express','1 · 0','effect']],
    C16:[['binary','0 / 1','Bernoulli'],['measured','real value','Gaussian']],
    U05:[['group 0','mean length','n rows'],['group 1','mean length','n rows']],
    P05:[['feature','axis weight','component'],['row ID','axis score','location']]
  });
  const miniLabel=(x,y,value,cls='',anchor='middle')=>text(x,y,value,'class="'+cls+'" text-anchor="'+anchor+'"');
  function miniBox(x,y,w,h,value,accent=false){
    const limit=Math.floor((w-18)/10.5);
    const words=value.split(' ');
    let rows=[value];
    if(value.length>limit&&words.length>1&&h>=50){
      const midpoint=Math.ceil(words.length/2);
      rows=[words.slice(0,midpoint).join(' '),words.slice(midpoint).join(' ')];
    }
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="7" class="'+(accent?'accent':'')+'"/>'+
      rows.map((row,i)=>miniLabel(x+w/2,y+h/2+(rows.length===1?6:-3+i*21),row,rows.length===1&&row.length>limit?'tight':'main')).join('');
  }
  const miniArrow=(x,y,a,b)=>'<path d="M'+x+' '+y+'L'+a+' '+b+'m-7 -5l7 5l-7 5" class="mini-arrow"/>';
  const miniAside=parts=>'<path d="M376 24V176" class="mini-separator"/>'+parts.map((part,i)=>miniLabel(396,53+i*49,part,i===0?'aside-main':'aside','start')).join('');
  function miniScene(mode,parts,key){
    const [a,b,c]=parts;
    if(key==='F11')return '<path d="M30 25V158H305" class="mini-axis"/><path d="M50 144L290 43" class="mini-feature"/>'+
      [[65,131],[93,127],[128,103],[174,95],[206,76],[251,60]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('')+
      miniArrow(310,99,345,99)+miniBox(357,52,175,93,'MAE in minutes',true)+miniLabel(163,184,'Delivery line','main');
    if(key==='F12')return [0,1,2].map(row=>[0,1,2].map(col=>'<rect x="'+(28+col*65)+'" y="'+(24+row*48)+'" width="57" height="42" rx="4" class="'+(row===col?'accent':'mini-wash')+'"/>').join('')).join('')+
      miniArrow(240,95,279,95)+miniBox(290,50,242,88,'Which classes missed?',true)+miniLabel(124,188,'Class confusion','main');
    if(mode==='residual')return '<path d="M34 25V172H350" class="mini-axis"/><path d="M50 153L325 44" class="mini-feature"/>'+
      [[97,100],[161,151],[224,55],[310,90]].map(([x,y])=>'<path d="M'+x+' '+y+'V'+(153-(x-50)*109/275)+'" class="mini-cut"/><circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>').join('')+miniAside(parts);
    if(key==='W05')return miniBox(25,25,188,55,a,true)+miniBox(25,115,188,55,b,true)+
      '<path d="M215 52H310V95H345M215 142H310V95" class="mini-feature"/>'+miniBox(350,65,180,62,c);
    if(key==='W03')return '<path d="M25 152H235M320 152H535" class="mini-axis"/>'+
      [52,74,103,177,211].map(x=>'<circle cx="'+x+'" cy="135" r="6" class="mini-dot"/>').join('')+
      [356,386,415,444,475].map(x=>'<circle cx="'+x+'" cy="135" r="6" class="mini-dot"/>').join('')+
      '<path d="M130 35V155M415 35V155" class="mini-cut"/>'+miniArrow(245,100,306,100)+
      miniLabel(130,28,'Train: fit μ, σ','main')+miniLabel(427,28,'New X: reuse','main')+miniLabel(280,187,'No test-row fit','main');
    if(key==='U02')return '<path d="M35 155H245M35 155V35M310 155H530M310 155V35" class="mini-axis"/>'+
      [[70,63],[95,110],[168,83],[205,128]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>').join('')+
      [[358,72],[380,99],[409,84],[431,111]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>').join('')+
      miniLabel(140,29,'Raw units','main')+miniLabel(420,29,'Scaled space','main')+miniLabel(280,181,'Distances change','main');
    if(key==='C08')return '<path d="M25 170H350M25 170V25" class="mini-axis"/>'+
      [[87,65],[113,95],[125,54],[218,113],[245,136],[265,104]].map(([x,y],i)=>i<3?'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>':'<rect x="'+x+'" y="'+y+'" width="12" height="12" class="mini-dot"/>').join('')+
      '<circle cx="154" cy="100" r="58" class="mini-ring"/><circle cx="154" cy="100" r="8" class="accent"/>'+miniAside(parts);
    if(key==='C10')return '<path d="M25 170H350M25 170V25" class="mini-axis"/>'+
      '<path d="M125 170L222 25M95 170L192 25M155 170L252 25" class="mini-cut"/>'+
      [[70,70],[95,94],[132,60],[260,120],[280,88],[309,119]].map(([x,y],i)=>i<3?'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>':'<rect x="'+x+'" y="'+y+'" width="12" height="12" class="mini-dot"/>').join('')+miniAside(parts);
    if(key==='U03')return '<circle cx="103" cy="86" r="55" class="mini-ring"/><circle cx="267" cy="105" r="55" class="mini-ring"/>'+
      [[68,69],[95,59],[116,104],[235,79],[276,77],[290,123]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('')+
      '<path d="M94 77l17 18m0 -18L94 95M259 97l17 18m0 -18l-17 18" class="mini-feature"/>'+miniAside(parts);
    if(key==='U06')return '<ellipse cx="130" cy="100" rx="110" ry="32" transform="rotate(-25 130 100)" class="mini-ring"/>'+
      '<circle cx="275" cy="103" r="60" class="mini-ring"/>'+
      [[70,119],[100,105],[135,91],[170,71],[246,84],[277,120],[300,88]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('')+miniAside(parts);
    if(key==='R08'||key==='N05')return '<path d="M30 25V170H350" class="mini-axis"/>'+
      '<path d="M45 37Q130 150 330 154" class="mini-feature"/>'+
      '<path d="M45 42Q180 171 330 65" class="mini-cut"/>'+miniAside(parts);
    if(key==='N02')return '<path d="M30 25V170H350" class="mini-axis"/>'+
      '<path d="M45 45C92 100 147 133 205 144S290 150 330 152" class="mini-feature"/>'+
      [45,95,150,205,265,330].map((x,i)=>'<circle cx="'+x+'" cy="'+[45,100,133,144,150,152][i]+'" r="4" class="mini-dot"/>').join('')+miniAside(parts);
    if(key==='C11')return '<path d="M25 170H350M25 170V25" class="mini-axis"/>'+
      '<path d="M45 49Q120 171 200 102T330 145" class="mini-feature"/>'+
      [[68,87],[105,111],[171,44],[239,67],[289,94]].map(([x,y],i)=>i<3?'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>':'<rect x="'+x+'" y="'+y+'" width="12" height="12" class="mini-dot"/>').join('')+miniAside(parts);
    if(key==='C15')return '<path d="M35 155H345" class="mini-axis"/>'+
      '<path d="M45 153Q115 20 177 153M181 153Q260 15 335 153" class="mini-feature"/>'+
      miniLabel(114,174,'Class A','aside-main')+miniLabel(260,174,'Class B','aside-main')+miniAside(parts);
    if(key==='C17'||key==='C18'||key==='C19'){
      const first=key==='C19'?'<ellipse cx="105" cy="96" rx="68" ry="55" class="mini-ring"/>':'<ellipse cx="105" cy="96" rx="78" ry="45" class="mini-ring"/>';
      const second=key==='C17'?'<ellipse cx="263" cy="96" rx="78" ry="45" class="mini-ring"/>':key==='C18'?'<ellipse cx="263" cy="96" rx="48" ry="68" class="mini-ring"/>':'<ellipse cx="263" cy="96" rx="68" ry="55" class="mini-ring"/>';
      return first+second+'<circle cx="105" cy="96" r="5" class="mini-dot"/><circle cx="263" cy="96" r="5" class="mini-dot"/>'+miniAside(parts);
    }
    if(key==='N06')return [0,1].map(group=>[0,1,2].map(i=>'<circle cx="'+(80+group*270)+'" cy="'+(50+i*48)+'" r="'+(group?10:6)+'" class="'+(i===1?'accent':'mini-dot')+'"/>').join('')).join('')+
      '<path d="M100 98H325" class="mini-arrow"/>'+miniLabel(80,184,'Capacity','main')+miniLabel(350,184,'Penalty','main')+miniLabel(276,30,'Tune both','main');
    if(key==='N03'||key==='N04'){
      const inputs=[{x:40,y:61},{x:40,y:131}],hidden=[{x:170,y:35},{x:170,y:96},{x:170,y:157}];
      const outputs=key==='N03'?[{x:315,y:43},{x:315,y:96},{x:315,y:149}]:[{x:315,y:96}];
      return inputs.flatMap(p=>hidden.map(q=>'<path d="M'+p.x+' '+p.y+'L'+q.x+' '+q.y+'" class="mini-wire"/>')).join('')+
        hidden.flatMap(p=>outputs.map(q=>'<path d="M'+p.x+' '+p.y+'L'+q.x+' '+q.y+'" class="mini-wire"/>')).join('')+
        inputs.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="10" class="mini-dot"/>').join('')+
        hidden.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="10" class="accent"/>').join('')+
        outputs.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="10" class="mini-dot"/>').join('')+miniAside(parts);
    }
    if(key==='U07')return '<path d="M48 160V126H126V160M87 126V83H196V160M268 160V118H334V160M301 118V83H141M141 83V43H301" class="mini-feature"/>'+miniAside(parts);
    if(key==='U09')return miniBox(20,57,130,65,'Sample n',true)+miniArrow(155,89,180,89)+
      '<path d="M205 157V122H255V157M230 122V75H300V157M312 157V103H352V157M332 103V75H265M265 75V38H332" class="mini-feature"/>'+miniAside(parts);
    if(key==='P04')return '<path d="M30 158H345" class="mini-axis"/>'+
      [95,74,51,32,17].map((height,i)=>'<rect x="'+(42+i*56)+'" y="'+(157-height)+'" width="38" height="'+height+'" rx="3" class="'+(i<3?'accent':'mini-wash')+'"/>').join('')+
      '<path d="M217 24V175" class="mini-cut"/>'+miniAside(parts);
    if(key==='P06')return '<path d="M35 166H345M35 166V28" class="mini-axis"/><path d="M66 151L292 44M171 98L113 35" class="mini-feature"/>'+
      [[83,133],[118,121],[151,109],[185,88],[216,82],[244,60]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('')+
      '<path d="M60 49Q185 2 320 42" class="mini-cut"/>'+miniAside(parts);
    if(key==='P07')return '<path d="M35 168H350M35 168V25" class="mini-axis"/>'+
      '<path d="M178 100L314 33m-7 1l7 -1l-3 8M178 100L42 167m7 -1l-7 1l3 -8" class="mini-feature"/>'+
      '<circle cx="178" cy="100" r="7" class="mini-dot"/>'+miniAside(parts);
    if(mode==='flow'||mode==='pipeline')return miniBox(18,62,150,72,a)+miniArrow(172,98,198,98)+miniBox(205,62,150,72,b,true)+miniArrow(359,98,385,98)+miniBox(392,62,150,72,c);
    if(mode==='fork')return miniBox(20,67,172,66,a,true)+'<path d="M192 100H235V55H273M235 100V145H273"/>'+miniBox(280,25,255,60,b)+miniBox(280,115,255,60,c);
    if(mode==='split')return miniBox(120,18,320,45,a)+'<path d="M280 63V83H145V99M280 83H415V99"/>'+miniBox(28,105,235,65,b,true)+miniBox(297,105,235,65,c);
    if(mode==='guard')return '<path d="M30 102H530" class="mini-axis"/><path d="M360 27V171" class="mini-cut"/>'+miniBox(30,42,160,42,a,true)+miniBox(202,42,145,42,b)+miniBox(374,113,160,42,c)+miniLabel(357,188,'NOW','minor');
    if(mode==='table')return [a,b,c].map((part,i)=>miniBox(16+i*183,25,170,53,part,i===1)).join('')+[0,1].map((row)=>[0,1,2].map(col=>'<rect x="'+(16+col*183)+'" y="'+(89+row*42)+'" width="170" height="34" rx="3" class="'+(col===1?'mini-wash':'')+'"/>'+miniLabel(101+col*183,112+row*42,miniTableRows[key][row][col],'cell')).join('')).join('');
    if(mode==='bars')return [a,b,c].map((part,i)=>'<rect x="'+(55+i*170)+'" y="'+(146-[75,112,88][i])+'" width="90" height="'+[75,112,88][i]+'" rx="4" class="'+(i===1?'accent':'mini-wash')+'"/>'+miniLabel(100+i*170,172,part,'bar-label')).join('')+'<path d="M25 147H535" class="mini-axis"/>';
    if(mode==='plot'||mode==='curve'){
      const axes='<path d="M34 25V172H350" class="mini-axis"/>';
      const dots=[[64,143],[97,124],[131,128],[161,104],[196,85],[224,90],[264,59],[310,45]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('');
      const fit=mode==='curve'?'<path d="M47 42Q145 200 327 34" class="mini-feature"/>':'<path d="M50 153L325 44" class="mini-feature"/>';
      return axes+fit+dots+miniAside(parts);
    }
    if(mode==='choice')return miniBox(25,30,240,58,a,true)+miniBox(295,30,240,58,b)+miniLabel(280,143,c,'main')+'<path d="M120 107H440" class="mini-separator"/>';
    if(mode==='matrix')return [0,1].map(row=>[0,1].map(col=>'<rect x="'+(35+col*135)+'" y="'+(30+row*68)+'" width="125" height="58" rx="5" class="'+(row===col?'accent':'mini-wash')+'"/>'+miniLabel(97+col*135,67+row*68,[['TP','FP'],['FN','TN']][row][col],'main')).join('')).join('')+miniAside(parts);
    if(mode==='folds')return [0,1,2,3].map(row=>[0,1,2,3].map(col=>'<rect x="'+(30+col*76)+'" y="'+(28+row*37)+'" width="67" height="29" rx="3" class="'+(row===col?'accent':'mini-wash')+'"/>'+miniLabel(63+col*76,49+row*37,row===col?'V':'T','minor')).join('')).join('')+miniAside(parts);
    if(mode==='time')return [0,1,2].map((i)=>miniBox(22+i*103,27+i*54,150+i*72,37,parts[i],i===0)).join('')+'<path d="M30 181H540m-8 -6l8 6l-8 6" class="mini-axis"/>';
    if(mode==='tree')return miniBox(166,18,225,55,a,true)+'<path d="M225 73L134 113M332 73L426 113"/>'+miniBox(25,118,220,55,b)+miniBox(315,118,220,55,c);
    if(mode==='scatter'||mode==='cluster'){
      const dots1=[[65,58],[88,48],[114,78],[135,45],[89,92]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="6" class="mini-dot"/>').join('');
      const dots2=[[216,126],[245,104],[277,139],[302,110],[266,77]].map(([x,y])=>'<rect x="'+x+'" y="'+y+'" width="12" height="12" class="mini-dot"/>').join('');
      return '<path d="M35 172H350M35 172V22" class="mini-axis"/>'+(mode==='cluster'?'<circle cx="101" cy="70" r="53" class="mini-ring"/><circle cx="265" cy="119" r="55" class="mini-ring"/><path d="M95 63l12 14m0 -14L95 77M259 112l12 14m0 -14l-12 14" class="mini-feature"/>':'<path d="M145 169L208 30" class="mini-cut"/>')+dots1+dots2+miniAside(parts);
    }
    if(mode==='prob')return [0,1,2].map((i)=>'<rect x="45" y="'+(35+i*49)+'" width="'+[90,210,270][i]+'" height="26" rx="4" class="'+(i===1?'accent':'mini-wash')+'"/>').join('')+'<path d="M207 20V178" class="mini-cut"/>'+miniAside(parts);
    if(mode==='gauss')return '<ellipse cx="107" cy="95" rx="74" ry="48" class="mini-ring"/><ellipse cx="258" cy="96" rx="55" ry="67" class="mini-ring accent"/>'+miniAside(parts);
    if(mode==='network')return [0,1,2].map(layer=>Array.from({length:layer===1?3:2},(_,i)=>({x:45+layer*142,y:(layer===1?42+i*51:64+i*72),layer}))).flat().map((p,_,all)=>all.filter(q=>q.layer===p.layer+1).map(q=>'<path d="M'+p.x+' '+p.y+'L'+q.x+' '+q.y+'" class="mini-wire"/>').join('')+'<circle cx="'+p.x+'" cy="'+p.y+'" r="12" class="'+(p.layer===1?'accent':'mini-dot')+'"/>').join('')+miniAside(parts);
    if(mode==='hierarchy')return '<path d="M48 160V126H126V160M87 126V83H196V160M268 160V118H334V160M301 118V83H141M141 83V43H301" class="mini-feature"/><path d="M27 105H352" class="mini-cut"/>'+miniAside(parts);
    if(mode==='pca')return '<path d="M35 167H340M35 167V26" class="mini-axis"/><path d="M67 151L291 40M171 98L113 33" class="mini-feature"/>'+[[88,132],[119,123],[151,112],[181,91],[213,84],[247,59]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" class="mini-dot"/>').join('')+miniAside(parts);
    throw Error('Unknown card thumbnail mode: '+mode);
  }
  function thumbnail(card){
    const key=card.id.replace(/^ML-/,'');
    const spec=miniSpecs[key];
    if(!spec)throw Error('Missing lesson-specific thumbnail: '+key);
    const [mode,...parts]=spec.split('|');
    const description=card.title+': '+parts.join(', ');
    return '<svg class="concept-visual ml-thumbnail" viewBox="0 0 560 200" role="img" aria-label="'+esc(description)+'"><title>'+esc(description)+'</title><g>'+miniScene(mode,parts,key)+'</g></svg>';
  }
  const number=n=>Number(n.toFixed(3)).toString();
  const label=(x,y,s,anchor='start')=>text(x,y,s,'style="font-size:13px" text-anchor="'+anchor+'"');
  const teachingCircle=(x,y,r=4,cls='')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+cls+'"/>';
  const knnRows=Object.freeze([
    ['n1',.3,.2,'B'],['n2',.5,.2,'A'],['n3',.4,.5,'A'],
    ['n4',1,.4,'B'],['n5',-.9,.5,'B'],['n6',1.5,1.2,'A']
  ].map(([id,x,y,group])=>Object.freeze({id,x,y,group})));
  const treeRows=Object.freeze([
    ['t1',2,3,'A'],['t2',3,5,'A'],['t3',4,4,'A'],['t4',7,3,'B'],
    ['t5',8,6,'B'],['t6',6,6,'B'],['t7',7,8,'A']
  ].map(([id,width,length,group])=>Object.freeze({id,width,length,group})));
  const regressionRows=Object.freeze([[1,3],[2,5],[3,7],[6,12],[7,14],[8,16]].map(([x,y],i)=>Object.freeze({id:'r'+(i+1),x,y})));
  const polynomialTrain=Object.freeze([[0,1],[1,2.8],[2,3.6],[3,8.8],[4,10.6],[5,16.2]].map(Object.freeze));
  const polynomialValidation=Object.freeze([[.5,1.6],[1.5,3.4],[2.5,6],[3.5,9.4],[4.5,13.6]].map(Object.freeze));
  const pcaRows=Object.freeze([[1,1],[2,3],[3,2],[4,5],[5,4],[6,6]].map(([x,y],i)=>Object.freeze({id:'p'+(i+1),x,y})));
  const mlExplorerSpecs={
    C08:{title:'Change the neighbour vote',label:'Number of neighbours',options:[['1','k = 1'],['3','k = 3'],['5','k = 5']]},
    C09:{title:'Change the neighbour vote',label:'Number of neighbours',options:[['1','k = 1'],['3','k = 3'],['5','k = 5']]},
    C14:{title:'Trace a row through the tree',label:'Observation',options:treeRows.map(r=>[r.id,`${r.id}: width ${r.width}, length ${r.length}`])},
    R09:{title:'Trace a leaf prediction',label:'Observation',options:regressionRows.map(r=>[r.id,`${r.id}: x ${r.x}, actual y ${r.y}`])},
    R10:{title:'Trace a leaf prediction',label:'Observation',options:regressionRows.map(r=>[r.id,`${r.id}: x ${r.x}, actual y ${r.y}`])},
    C10:{title:'Connect C to a linear margin',label:'Penalty for margin violations',options:[['0.05','C = 0.05'],['0.2','C = 0.2'],['1','C = 1']]},
    C11:{title:'Linear-margin intuition for an RBF model',label:'Linear example penalty',options:[['0.05','C = 0.05'],['0.2','C = 0.2'],['1','C = 1']]},
    R07:{title:'Fit a curve on training rows',label:'Polynomial degree',options:[['1','Degree 1'],['2','Degree 2'],['4','Degree 4']]},
    R08:{title:'Compare flexibility using validation',label:'Polynomial degree',options:[['1','Degree 1'],['2','Degree 2'],['4','Degree 4']]},
    P01:{title:'Track every row into new axes',label:'Highlighted observation',options:pcaRows.map(r=>[r.id,`${r.id}: (${r.x}, ${r.y})`])},
    P06:{title:'Track every row into new axes',label:'Highlighted observation',options:pcaRows.map(r=>[r.id,`${r.id}: (${r.x}, ${r.y})`])}
  };
  // Small least-squares example. The degree changes a fit to the same training
  // rows, and validation rows are never used to learn its coefficients.
  function polynomialFit(rows,degree){
    const n=degree+1,matrix=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>rows.reduce((sum,[x])=>sum+x**(i+j),0)).concat(rows.reduce((sum,[x,y])=>sum+y*x**i,0)));
    for(let column=0;column<n;column++){
      let pivot=column;for(let i=column+1;i<n;i++)if(Math.abs(matrix[i][column])>Math.abs(matrix[pivot][column]))pivot=i;
      [matrix[column],matrix[pivot]]=[matrix[pivot],matrix[column]];
      const divisor=matrix[column][column];if(Math.abs(divisor)<1e-10)throw Error('Singular polynomial example');
      for(let j=column;j<=n;j++)matrix[column][j]/=divisor;
      for(let i=0;i<n;i++)if(i!==column){const factor=matrix[i][column];for(let j=column;j<=n;j++)matrix[i][j]-=factor*matrix[column][j];}
    }
    return matrix.map(row=>row[n]);
  }
  function polynomialPrediction(coefficients,x){return coefficients.reduce((sum,c,i)=>sum+c*x**i,0);}
  function mlExploration(id,choice){
    id=id.replace(/^ML-/,'');const spec=mlExplorerSpecs[id];if(!spec||!spec.options.some(([v])=>v===choice))throw Error('Unknown model teaching visual choice');
    let art='',summary='',code='',data,smallTree=false;
    if(id==='C08'||id==='C09'){
      const k=Number(choice),neighbours=knnRows.map(r=>({...r,distance:Math.hypot(r.x,r.y)})).sort((a,b)=>a.distance-b.distance).slice(0,k),votes={A:neighbours.filter(r=>r.group==='A').length,B:neighbours.filter(r=>r.group==='B').length},prediction=votes.A>votes.B?'A':'B',px=x=>180+x*85,py=y=>160-y*85;
      art=line(25,160,490,160)+line(180,25,180,190)+label(25,17,'Fixed prepared feature space · ○ A  □ B')+
        neighbours.map(r=>line(px(0),py(0),px(r.x),py(r.y),'stroke-dasharray="4 3"')).join('')+
        knnRows.map(r=>'<g><title>'+esc(`${r.id}: (${r.x}, ${r.y}), class ${r.group}`)+'</title>'+(r.group==='A'?teachingCircle(px(r.x),py(r.y),5):'<rect x="'+(px(r.x)-5)+'" y="'+(py(r.y)-5)+'" width="10" height="10"/>')+(neighbours.some(n=>n.id===r.id)?teachingCircle(px(r.x),py(r.y),10,'accent-stroke'):'')+label(px(r.x)+9,py(r.y)+4,r.id)+'</g>').join('')+teachingCircle(px(0),py(0),7,'accent')+label(188,185,'Query (0, 0)')+label(30,220,`${k} neighbours: ${votes.A} A + ${votes.B} B → ${prediction}`);
      summary=`k=${k}: ${neighbours.map(r=>`${r.id} (${r.group}), distance ${number(r.distance)}`).join('; ')}. Votes A=${votes.A}, B=${votes.B}; predicted class ${prediction}. All six training observations and the query stay fixed. Distances use the already prepared coordinates; no preprocessing is refitted.`;
      code=`model = KNeighborsClassifier(n_neighbors=${k})\nmodel.fit(X_train_prepared, y_train)\nmodel.predict([[0, 0]])  # ${prediction}`;data={k,neighbours,votes,prediction,count:knnRows.length};
    }else if(id==='C14'){
      smallTree=true;const row=treeRows.find(r=>r.id===choice),left=row.width<=5,lower=row.length<=7,prediction=left?'A':lower?'B':'A',conditions=[`width ${row.width} ≤ 5: ${left?'yes':'no'}`,...(left?[]:[`length ${row.length} ≤ 7: ${lower?'yes':'no'}`])];
      const node=(x,y,w,value,active=false)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="40" rx="4" class="'+(active?'accent':'')+'"/>'+text(x+w/2,y+25,value,'style="font-size:14px" text-anchor="middle"');
      art=node(82,12,176,'width ≤ 5?',true)+line(130,52,55,95,left?'class="accent-stroke"':'')+line(215,52,234,85,!left?'class="accent-stroke"':'')+label(72,72,'yes')+label(228,72,'no')+node(10,98,92,'A · 3 rows',left)+node(134,88,196,'length ≤ 7?',!left)+line(188,128,176,174,!left&&lower?'class="accent-stroke"':'')+line(267,128,284,174,!left&&!lower?'class="accent-stroke"':'')+label(147,153,'yes')+label(288,153,'no')+node(125,178,99,'B · 3 rows',!left&&lower)+node(235,178,95,'A · 1 row',!left&&!lower);
      summary=`${row.id} (${row.width}, ${row.length}): ${conditions.join(' → ')} → predict ${prediction}. Actual training label ${row.group}. Highlighted branches trace this one row through the illustrative fitted tree; leaf counts refer to the seven training rows.`;
      code=`row = pd.DataFrame([{"width": ${row.width}, "length": ${row.length}}])\nmodel.predict(row)  # ${prediction}`;data={row,conditions,prediction,count:treeRows.length};
    }else if(id==='R09'||id==='R10'){
      smallTree=true;const row=regressionRows.find(r=>r.id===choice),left=row.x<=4.5,leaf=regressionRows.filter(r=>(r.x<=4.5)===left),prediction=leaf.reduce((sum,r)=>sum+r.y,0)/leaf.length;
      const node=(x,y,w,value,active)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="47" rx="4" class="'+(active?'accent':'')+'"/>'+text(x+w/2,y+29,value,'style="font-size:14px" text-anchor="middle"');
      art=node(82,22,176,'x ≤ 4.5?',true)+line(128,69,80,133,left?'class="accent-stroke"':'')+line(213,69,260,133,left?'':'class="accent-stroke"')+label(73,105,'yes')+label(249,105,'no')+node(8,136,149,'Mean = 5',left)+node(183,136,149,'Mean = 14',!left)+label(170,219,'Each leaf has three training rows','middle');
      summary=`${row.id}: x=${row.x} → x ≤ 4.5 is ${left?'true':'false'} → leaf targets ${leaf.map(r=>r.y).join(', ')} → prediction ${prediction}. Actual y=${row.y}; residual=${row.y-prediction}. The leaf predicts the average of its training targets.`;
      code=`model.predict(pd.DataFrame({"x": [${row.x}]}))  # ${prediction}`;data={row,leaf,prediction,residual:row.y-prediction,count:regressionRows.length};
    }else if(id==='C10'||id==='C11'){
      const C=Number(choice),weight=C<=.0625?8*C:C<.125?.5:Math.min(1,4*C),margin=1/weight,rows=[[-2,0,'A'],[-1,-1,'A'],[-1,1,'A'],[1,-1,'B'],[1,1,'B'],[2,0,'B']].map(([x,y,group],i)=>({id:'s'+(i+1),x,y,group})),support=rows.filter(r=>Math.abs(weight*r.x)<=1+1e-10),px=x=>260+x*78,py=y=>110-y*55;
      art=line(35,185,485,185)+line(px(0),22,px(0),185,'class="accent-stroke"')+line(px(-margin),22,px(-margin),185,'stroke-dasharray="5 4"')+line(px(margin),22,px(margin),185,'stroke-dasharray="5 4"')+label(25,17,'Linear example · boundary x = 0')+rows.map(r=>(r.group==='A'?teachingCircle(px(r.x),py(r.y),5):'<rect x="'+(px(r.x)-5)+'" y="'+(py(r.y)-5)+'" width="10" height="10"/>')+(support.some(s=>s.id===r.id)?teachingCircle(px(r.x),py(r.y),11,'accent-stroke'):'')+label(px(r.x)+12,py(r.y)+4,r.id)).join('')+label(25,211,`C=${C} · margins x=±${number(margin)} · ○ A  □ B`);
      summary=`Linear-margin intuition: C=${C}, learned weight ${number(weight)}, boundary x=0, margin lines x=±${number(margin)}. Support candidates ${support.map(r=>r.id).join(', ')} are on or inside the margin; soft-margin candidates can violate it. Symmetry keeps every class prediction unchanged here: negative x → A, positive x → B. ${id==='C11'?'Your RBF model can curve in original feature space; this linear calculation does not simulate gamma or an RBF fit.':'These six symmetric prepared training rows permit an exact one-dimensional linear solution.'}`;
      code=`model = SVC(kernel="linear", C=${C})\nmodel.fit(X_train_prepared, y_train)`;data={C,weight,margin,support:support.map(r=>r.id),rows,boundary:0};
    }else if(id==='R07'||id==='R08'){
      const degree=Number(choice),coefficients=polynomialFit(polynomialTrain,degree),predict=x=>polynomialPrediction(coefficients,x),rmse=rows=>Math.sqrt(rows.reduce((sum,[x,y])=>sum+(y-predict(x))**2,0)/rows.length),trainRMSE=rmse(polynomialTrain),validationRMSE=rmse(polynomialValidation),px=x=>45+x*85,py=y=>185-y/20*155;
      art=line(45,185,470,185)+line(45,185,45,25)+label(45,17,'○ Training     □ Validation')+[0,2,4].map(x=>label(px(x),205,x)).join('')+[0,10,20].map(y=>label(15,py(y)+4,y)).join('')+'<path d="'+Array.from({length:61},(_,i)=>`${i?'L':'M'}${px(i/12)} ${py(predict(i/12))}`).join('')+'" fill="none" class="accent-stroke"/>'+polynomialTrain.map(([x,y])=>teachingCircle(px(x),py(y),5)).join('')+polynomialValidation.map(([x,y])=>'<rect x="'+(px(x)-4)+'" y="'+(py(y)-4)+'" width="8" height="8"/>').join('');
      summary=`Degree ${degree}: training RMSE ${number(trainRMSE)}; validation RMSE ${number(validationRMSE)}. The curve is fitted only to the same six training rows. Five fixed validation rows measure how it generalises; a smaller training error alone does not justify a degree. No final test rows are used.`;
      code=`model = make_pipeline(PolynomialFeatures(degree=${degree}, include_bias=False), LinearRegression())\nmodel.fit(X_train, y_train)\nvalidation_rmse = mean_squared_error(y_validation, model.predict(X_validation), squared=False)`;data={degree,coefficients,trainRMSE,validationRMSE,trainingCount:polynomialTrain.length,validationCount:polynomialValidation.length,points:Array.from({length:61},(_,i)=>[i/12,predict(i/12)])};
    }else{
      const means=[pcaRows.reduce((sum,r)=>sum+r.x,0)/pcaRows.length,pcaRows.reduce((sum,r)=>sum+r.y,0)/pcaRows.length],centered=pcaRows.map(r=>({...r,x:r.x-means[0],y:r.y-means[1]})),xx=centered.reduce((sum,r)=>sum+r.x*r.x,0),yy=centered.reduce((sum,r)=>sum+r.y*r.y,0),xy=centered.reduce((sum,r)=>sum+r.x*r.y,0),angle=.5*Math.atan2(2*xy,xx-yy),c=Math.cos(angle),s=Math.sin(angle),scores=centered.map(r=>({id:r.id,pc1:-c*r.x-s*r.y,pc2:-s*r.x+c*r.y})),row=pcaRows.find(r=>r.id===choice),score=scores.find(r=>r.id===choice),share=(xx+yy+Math.hypot(xx-yy,2*xy))/(2*(xx+yy));
      const px=x=>40+x/7*200,py=y=>185-y/7*145,sx=x=>390+x/5*105,sy=y=>112-y/5*75;
      art=line(40,185,240,185)+line(40,185,40,25)+label(40,17,'Original features')+line(280,112,500,112)+line(390,30,390,185)+label(295,17,'PCA coordinates')+pcaRows.map(r=>teachingCircle(px(r.x),py(r.y),r.id===choice?7:4,r.id===choice?'accent':'')+label(px(r.x)+5,py(r.y)-7,r.id)).join('')+scores.map(r=>teachingCircle(sx(r.pc1),sy(r.pc2),r.id===choice?7:4,r.id===choice?'accent':'')+label(sx(r.pc1)+6,sy(r.pc2)-6,r.id)).join('')+label(75,209,'features: x and y')+label(345,209,'PC1 and PC2');
      summary=`${row.id}: original (${row.x}, ${row.y}) → subtract training mean (${means.join(', ')}) → scores (${number(score.pc1)}, ${number(score.pc2)}). All six rows rotate with the same axes; PC1 weights (${number(-c)}, ${number(-s)}) retain ${number(share*100)}% of variance. Both features share units in this example. Fit any required scaler on training rows first. Consistently flipping a component and its scores gives an equivalent PCA.`;
      code=`pca = PCA(n_components=2).fit(X_train)\nscores = pca.transform(X_train)\nscores[${pcaRows.indexOf(row)}]  # ${row.id}`;data={row,score,scores,means,weights:[[-c,-s],[-s,c]],varianceShare:share,count:pcaRows.length};
    }
    const svg='<div class="teaching-visual-scroll" tabindex="0" role="region" aria-label="'+(smallTree?'Tree path':'Teaching chart; scroll if needed')+'"><svg class="concept-visual data-teaching-visual'+(smallTree?' is-tree':'')+'" viewBox="0 0 '+(smallTree?'340 235':'520 235')+'" role="img" aria-label="'+esc(summary)+'"><title>'+esc(summary)+'</title><g>'+art+'</g></svg></div>';
    return {summary,code,svg,data};
  }
  function mlResult(result){return result.svg+'<p>'+esc(result.summary)+'</p><pre><code>'+esc(result.code)+'</code></pre>';}
  function comparisonSummary(id,result){
    const d=result.data;
    if(id==='C08'||id==='C09')return `k=${d.k}: ${d.votes.A} A + ${d.votes.B} B → ${d.prediction}; nearest rows ${d.neighbours.map(r=>r.id).join(', ')}.`;
    if(id==='C14')return `${d.row.id}: ${d.conditions.join(' → ')} → predict ${d.prediction}.`;
    if(id==='R09'||id==='R10')return `${d.row.id}: x=${d.row.x} → prediction ${d.prediction}, residual ${d.residual}.`;
    if(id==='C10'||id==='C11')return `C=${d.C}: margins x=±${number(d.margin)}, boundary x=0, ${d.support.length} support candidates.`;
    if(id==='R07'||id==='R08')return `Degree ${d.degree}: training RMSE ${number(d.trainRMSE)}, validation RMSE ${number(d.validationRMSE)}.`;
    return `${d.row.id}: (${d.row.x}, ${d.row.y}) → (${number(d.score.pc1)}, ${number(d.score.pc2)}).`;
  }
  function observations(id){
    if(id==='C08'||id==='C09')return knnRows.map(r=>`${r.id}: (${r.x}, ${r.y}), class ${r.group}`).join('; ')+'. Query: (0, 0).';
    if(id==='C14')return treeRows.map(r=>`${r.id}: width ${r.width}, length ${r.length}, class ${r.group}`).join('; ')+'.';
    if(id==='R09'||id==='R10')return regressionRows.map(r=>`${r.id}: x=${r.x}, target=${r.y}`).join('; ')+'.';
    if(id==='R07'||id==='R08')return `Training (x, y): ${polynomialTrain.map(p=>`(${p.join(', ')})`).join(', ')}. Validation: ${polynomialValidation.map(p=>`(${p.join(', ')})`).join(', ')}.`;
    if(id==='C10'||id==='C11')return 'Class A: (−2, 0), (−1, −1), (−1, 1). Class B: (1, −1), (1, 1), (2, 0). Coordinates are already prepared and remain fixed.';
    return pcaRows.map(r=>`${r.id}: (${r.x}, ${r.y})`).join('; ')+'. All six rows fit the same mean and PCA axes.';
  }
  function interactive(visual){
    const id=(visual.id||'').replace(/^ML-/,''),spec=mlExplorerSpecs[id];if(!spec)return '';
    const baseline=spec.options[0][0],current=spec.options[1]?.[0]||baseline;
    return '<section class="teaching-explorer" data-ml-explorer="'+id+'"><h4>'+esc(spec.title)+'</h4><p>Illustrative training example · separate from your exercise and its final test rows. These controls compute the example in this page; run your Python to produce exercise evidence.</p><details><summary>Example observations</summary><p>'+esc(observations(id))+'</p></details><label class="teaching-visual-controls">'+esc(spec.label)+' <select data-ml-visual-choice>'+spec.options.map(([value,title])=>'<option value="'+value+'"'+(value===current?' selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label><p><strong>Starting view</strong> · '+esc(comparisonSummary(id,mlExploration(id,baseline)))+'</p><div class="teaching-visual-result" aria-live="polite" aria-atomic="true">'+mlResult(mlExploration(id,current))+'</div></section>';
  }
  const mounted=new WeakSet();
  function mount(container=root.document){if(!container||mounted.has(container))return;mounted.add(container);container.addEventListener('change',event=>{const control=event.target.closest?.('[data-ml-visual-choice]'),section=control?.closest('[data-ml-explorer]');if(section)section.querySelector('.teaching-visual-result').innerHTML=mlResult(mlExploration(section.dataset.mlExplorer,control.value));});}
  function render(visual){
    const kind=visual?.type||'tasks',id='ml-arrow-'+(++diagramId),content=(variant(visual)||(types[kind]||types.tasks)()).replaceAll('url(#ml-arrow)','url(#'+id+')');
    const schematic='<figure class="teaching-illustration ml-concept"><div class="ml-concept-scroll" tabindex="0" role="region" aria-label="'+esc(visual.caption)+'"><svg viewBox="0 0 560 235" role="img" aria-label="'+esc(visual.caption)+'"><title>'+esc(visual.caption)+'</title><defs><marker id="'+id+'" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z"/></marker></defs>'+content+'</svg></div><figcaption>Schematic · '+esc(visual.caption)+'<span class="ml-diagram-scroll-note">Scroll the diagram horizontally if needed.</span></figcaption></figure>';
    const explorer=interactive(visual);
    return explorer?explorer+'<details class="ml-schematic-reference"><summary>Concept schematic</summary>'+schematic+'</details>':schematic;
  }
  root.MLLearningVisuals={render,thumbnail,interactive,mount,exploration:mlExploration,polynomialFit,exampleRows:{knn:knnRows,tree:treeRows,regression:regressionRows,pca:pcaRows,polynomialTrain,polynomialValidation},types:Object.keys(types),family:v=>variant(v)?v.id:v.type};
})(window);
