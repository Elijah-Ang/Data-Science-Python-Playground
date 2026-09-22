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
    tasks:()=>box(10,72,112,54,'Question')+arrow(122,99,168,99)+box(170,15,150,45,'Predict quantity')+box(170,75,150,45,'Predict label')+box(170,135,150,45,'Discover groups')+box(370,75,150,45,'Reduce dimensions')+arrow(330,99,360,99)+text(280,216,'Choose the task before the estimator.','text-anchor="middle"'),
    table:()=>['Observation','Feature X₁','Feature X₂','Target y'].map((s,i)=>box(20+i*130,22,122,36,s,i===3?'accent':'' )).join('')+[0,1,2].map(r=>['row '+(r+1),[2,5,8][r],['standard','express','economy'][r],['known','known','unknown'][r]].map((v,i)=>box(20+i*130,65+r*41,122,35,v,i===3?'accent':'' )).join('')).join('')+text(282,218,'Keep row identities aligned; new rows provide X.','text-anchor="middle"'),
    split:()=>box(20,25,510,36,'Observations')+arrow(160,64,160,95)+arrow(440,64,440,95)+box(20,100,310,50,'Training → fit / validate','accent')+box(370,100,160,50,'Final test')+line(350,75,350,180,'stroke-dasharray="6 5"')+text(278,208,'Protect final rows from preparation and selection.','text-anchor="middle"'),
    pipeline:()=>box(10,80,110,54,'Training X')+arrow(120,107,155,107)+box(157,28,145,47,'Scale numbers','accent')+box(157,133,145,47,'Encode categories','accent')+line(145,50,145,157)+line(145,50,157,50)+line(145,157,157,157)+arrow(305,51,345,107)+arrow(305,157,345,107)+box(350,80,178,54,'Fit estimator')+text(276,216,'Each fold learns its own preparation.','text-anchor="middle"'),
    folds:()=>[0,1,2,3,4].map(r=>text(12,45+r*30,'Fold '+(r+1))+[0,1,2,3,4].map(c=>box(90+c*68,25+r*30,59,25,r===c?'V':'T',r===c?'accent':'')).join('')).join('')+box(455,25,75,145,'Final')+text(276,212,'T: fit on training rows   V: validate   Final: held away','text-anchor="middle"'),
    regression:()=>line(28,188,414,188)+line(28,188,28,15)+line(45,170,394,35,'class="accent-stroke"')+dots.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="5"/>'+line(x,y,x,190-x*.39,'stroke-dasharray="3 3"')).join('')+text(440,70,'actual −')+text(440,94,'predicted')+text(240,218,'Residuals measure signed vertical differences.','text-anchor="middle"'),
    comparison:()=>text(115,32,'Candidate A')+text(290,32,'Candidate B')+['Fit','Validate','Cost'].map((s,i)=>text(12,75+i*48,s)+box(110,51+i*48,[75,150,95][i],27,'','accent')+box(290,51+i*48,[100,112,160][i],27,'')).join('')+text(275,222,'Compare matching evidence; smaller error can cost more.','text-anchor="middle"'),
    classification:()=>text(205,22,'Predicted class')+text(120,64,'A')+text(250,64,'B')+text(17,115,'Actual A')+text(17,170,'Actual B')+box(98,78,103,49,'7','accent')+box(211,78,103,49,'1')+box(98,136,103,49,'3')+box(211,136,103,49,'1','accent')+text(355,101,'B precision: 1 / 2')+text(355,139,'B recall: 1 / 4')+text(275,218,'Inspect every class; accuracy can hide missed cases.','text-anchor="middle"'),
    tree:()=>box(180,15,180,45,'Feature ≤ threshold?')+arrow(223,63,140,105)+arrow(317,63,410,105)+text(141,86,'yes')+text(380,86,'no')+box(42,111,188,53,'Predict from leaf','accent')+box(310,111,188,53,'Split again')+text(275,214,'Leaves use training averages or class counts.','text-anchor="middle"'),
    geometry:()=>line(20,190,540,190)+line(20,190,20,10)+[0,1,2].map(g=>'<circle cx="'+(105+g*155)+'" cy="'+(95+(g%2)*35)+'" r="48" fill="none" stroke-dasharray="5 4"/>'+[0,1,2,3].map(i=>box(75+g*155+i*12,67+(g%2)*35+(i%2)*28,9,9,'',g===1?'accent':'')).join('')+text(94+g*155,100+(g%2)*35,'×')).join('')+text(278,216,'Distance, neighbourhoods and centres depend on scale.','text-anchor="middle"'),
    gaussian:()=>'<ellipse cx="165" cy="104" rx="110" ry="47" transform="rotate(25 165 104)"/><ellipse cx="371" cy="104" rx="94" ry="60" transform="rotate(-25 371 104)" class="accent"/>'+text(142,106,'Class A')+text(348,106,'Class B')+line(265,22,265,181,'stroke-dasharray="5 5"')+text(275,215,'Compare means, covariance shapes and assumptions.','text-anchor="middle"'),
    network:()=>[0,1,2].flatMap(layer=>Array.from({length:layer===1?4:2},(_,i)=>({x:85+layer*190,y:layer===1?35+i*43:65+i*83,layer}))).map((p,i,all)=>all.filter(q=>q.layer===p.layer+1).map(q=>line(p.x,p.y,q.x,q.y,'class="thin"')).join('')+'<circle cx="'+p.x+'" cy="'+p.y+'" r="12" class="'+(p.layer===1?'accent':'')+'"/>').join('')+text(67,203,'Inputs')+text(244,220,'Hidden units')+text(440,203,'Outputs'),
    hierarchy:()=>line(60,178,60,138)+line(140,178,140,138)+line(60,138,140,138)+line(100,138,100,88)+line(240,178,240,88)+line(100,88,240,88)+line(170,88,170,40)+line(370,178,370,116)+line(480,178,480,116)+line(370,116,480,116)+line(425,116,425,40)+line(170,40,425,40)+line(25,103,525,103,'class="accent-stroke" stroke-dasharray="6 5"')+text(25,24,'Merge distance')+text(276,216,'A cut chooses a descriptive grouping resolution.','text-anchor="middle"'),
    pca:()=>line(34,180,297,180)+line(34,180,34,15)+arrow(50,166,282,35)+arrow(158,104,95,25)+dots.slice(0,6).map(([x,y])=>'<circle cx="'+(x*.62+20)+'" cy="'+(y*.7+20)+'" r="4"/>').join('')+text(267,34,'PC1')+text(69,23,'PC2')+[110,54,27,12,4].map((h,i)=>box(345+i*37,175-h,27,h,'',i<2?'accent':'')).join('')+text(333,204,'Variance by component')+text(147,219,'New axes combine measurements.','text-anchor="middle"'),
    time:()=>[0,1,2].map(r=>box(25,25+r*55,145+r*85,35,'Earlier training','accent')+box(182+r*85,25+r*55,78,35,'Later')).join('')+arrow(25,211,523,211)+text(535,216,'Time')
  };
  // Variants share geometry but teach the particular card's concept.
  function variant(v){
    const id=v.id||'';
    if(id==='W04'||id==='R05'){
      return ['Service','standard','express','economy'].map((s,i)=>box(15+i*134,20,127,35,s)).join('')+
        [['standard',1,0,0],['express',0,1,0],['economy',0,0,1]].map((row,r)=>row.map((x,c)=>box(15+c*134,65+r*42,127,35,x,c?'accent':'')).join('')).join('')+
        text(275,218,id==='R05'?'Omit one category to make a linear reference explicit.':'Named categories become aligned indicator columns.','text-anchor="middle"');
    }
    if(id==='W03'||id==='U02'){
      return box(15,18,240,160,'')+box(302,18,240,160,'')+
        text(135,43,'Raw: unequal units','text-anchor="middle"')+text(422,43,'Standardised','text-anchor="middle"')+
        [[40,140],[80,130],[130,150],[175,125],[220,140]].map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="5"/><circle cx="'+(325+i*44)+'" cy="'+[140,80,155,65,100][i]+'" r="5"/>').join('')+
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
      return line(145,185,370,20,'class="accent-stroke"')+line(90,185,315,20,'stroke-dasharray="5 4"')+line(200,185,425,20,'stroke-dasharray="5 4"')+
        [[90,65],[155,60],[120,110],[350,145],[420,85],[400,165]].map(([x,y],i)=>(i<3?'<circle cx="'+x+'" cy="'+y+'" r="6"/>':box(x,y,11,11,''))+(i===2||i===3?'<circle cx="'+x+'" cy="'+y+'" r="16" fill="none"/>':'')).join('')+
        text(278,219,'Support vectors influence the boundary and its margin.','text-anchor="middle"');
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
  function render(visual){
    const kind=visual?.type||'tasks',content=variant(visual)||(types[kind]||types.tasks)();
    return '<figure class="ml-concept"><div class="ml-concept-scroll" tabindex="0" role="region" aria-label="'+esc(visual.caption)+'"><svg viewBox="0 0 560 235" role="img" aria-label="'+esc(visual.caption)+'"><title>'+esc(visual.caption)+'</title><defs><marker id="ml-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z"/></marker></defs>'+content+'</svg></div><figcaption>Schematic · '+esc(visual.caption)+'<span class="ml-diagram-scroll-note">Scroll the diagram horizontally if needed.</span></figcaption></figure>';
  }
  root.MLLearningVisuals={render,types:Object.keys(types)};
})(window);
