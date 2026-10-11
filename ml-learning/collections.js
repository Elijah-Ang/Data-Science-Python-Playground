/* Teaching collections reference existing cards; IDs, decks and prerequisites stay authored. */
(function(root){
  'use strict';
  const range=(prefix,start,end)=>Array.from({length:end-start+1},(_,i)=>'ML-'+prefix+String(start+i).padStart(2,'0'));
  const legacyOrder={
    foundations:[...range('F',1,5),'ML-F-R1',...range('F',6,10),'ML-F-R2','ML-F11','ML-F12','ML-F-K1'],
    workflow:[...range('W',1,7),'ML-W-R1',...range('W',8,14),'ML-W-R2','ML-W15','ML-W16','ML-W-K1','ML-W-K2','ML-W-K3'],
    regression:[...range('R',1,5),'ML-R-R1','ML-R06',...range('R',7,10),'ML-R-R2','ML-R11','ML-R-K1'],
    classification:[...range('C',1,6),'ML-C-R1',...range('C',7,13),'ML-C-R2',...range('C',14,18),'ML-C-R3','ML-C19','ML-C-K1'],
    networks:['ML-N01','ML-N02','ML-N05','ML-N-R1','ML-N03','ML-N-K2','ML-N04','ML-N-K1','ML-N06'],
    clustering:[...range('U',1,5),'ML-U-R1',...range('U',6,10),'ML-U-R2','ML-U-K1'],
    pca:[...range('P',1,6),'ML-P-R1','ML-P07','ML-P-K1'],
    comparison:[...range('M',1,3),'ML-M-R1','ML-M04','ML-M-K1']
  };
  const groups=[
    {id:'quantity',title:'Predict a quantity',description:'After the supervised workflow, choose a model for a numerical outcome. Each model deck keeps its own question, mechanism and limits.'},
    {id:'classes',title:'Predict a class',description:'Begin with shared classification evidence, then choose a classifier. Quantity-model decks are a separate branch.'},
    {id:'neural',title:'Neural networks',description:'Learn the shared network ideas, then choose classification or quantity prediction. Neither task route sends you through the other.'},
    {id:'discovery',title:'Discover structure',description:'Start with a discovery question and meaningful measurements. Clustering and PCA use no prediction target or supervised final test.'},
    {id:'capstone',title:'Compare and explain',description:'Bring the model families together when you are ready to defend a choice and communicate its evidence.'}
  ];
  const collection=(id,title,group,deck,ids,description,prior=[])=>({id,title,group,deck,ids,description,prior});
  const collections=[
    collection('simple-linear','Simple linear regression','quantity','regression',range('R',1,3),'Read a fitted line, distinguish RMSE from R², then inspect residuals and extrapolation limits.',['ML-W-K2']),
    collection('multiple-linear','Multiple linear regression','quantity','regression',range('R',4,6),'Use several inputs, interpret encoded coefficients and examine correlated predictors.',['ML-R01','ML-W04']),
    collection('polynomial','Polynomial regression','quantity','regression',range('R',7,8),'Build curved features and compare flexibility using training validation.',['ML-R01','ML-W06','ML-W11']),
    collection('regression-tree','Regression trees','quantity','regression',range('R',9,10),'Read leaf-average predictions, apply a full tree workflow and control complexity.',['ML-W-K2']),
    collection('regression-evidence','Regression reviews and checkpoint','quantity','regression',['ML-R-R1','ML-R-R2','ML-R11','ML-R-K1'],'Retrieve evidence across quantity models, examine explanation limits and assemble the regression checkpoint.',['ML-R03','ML-R05','ML-R08','ML-R10']),
    collection('classification-evidence','Classification evidence','classes','classification',range('C',1,4),'Read confusion, precision, recall and macro F1 before interpreting labels or probabilities.',['ML-W-K3']),
    collection('logistic','Logistic classification','classes','classification',range('C',5,7),'Connect logistic scores and probabilities to a complete workflow and cost-sensitive thresholds.',['ML-C04']),
    collection('knn','Nearest-neighbour classification','classes','classification',range('C',8,9),'Understand neighbour voting and validate k on a meaningful scale.',['ML-C03','ML-W03']),
    collection('svm','Support vector classification','classes','classification',range('C',10,11),'Read margins, build a guided workflow and compare nonlinear boundaries.',['ML-C03','ML-W03']),
    collection('one-r','One-R classification','classes','classification',range('C',12,13),'Learn a one-feature rule with categorical or numeric inputs and inspect what it ignores.',['ML-C03','ML-W06']),
    collection('classification-tree','Classification trees','classes','classification',['ML-C14'],'Use class evidence in threshold rules and diagnose overfitting or minority-class failures.',['ML-C03','ML-W11']),
    collection('naive-bayes','Naive Bayes and input variants','classes','classification',range('C',15,16),'Distinguish Gaussian measurements from Bernoulli flags; match the likelihood to the input and inspect independence assumptions.',['ML-C04','ML-W04']),
    collection('lda-qda','LDA and QDA','classes','classification',range('C',17,19),'Compare shared and class-specific covariance, then examine sample support and regularisation limits.',['ML-C15']),
    collection('classification-review','Classification reviews and checkpoint','classes','classification',['ML-C-R1','ML-C-R2','ML-C-R3','ML-C-K1'],'Retrieve classification evidence across model families and complete the class-prediction checkpoint.',['ML-C06','ML-C09','ML-C11','ML-C13','ML-C14','ML-C16','ML-C18']),
    collection('neural-foundations','Shared neural foundations','neural','networks',['ML-N01','ML-N02','ML-N05','ML-N-R1','ML-N06'],'Learn outputs, loss and convergence, retrieve the shared ideas, then optionally explore capacity and regularisation.',['ML-W-K1']),
    collection('neural-classification','Neural classification','neural','networks',['ML-N03','ML-N-K2'],'Apply shared network ideas to class prediction and complete its independent checkpoint.',['ML-N-R1','ML-C06']),
    collection('neural-quantity','Neural quantity prediction','neural','networks',['ML-N04','ML-N-K1'],'Apply shared network ideas to quantities in original target units and complete its independent checkpoint.',['ML-N-R1','ML-R03']),
    collection('discovery-foundations','Discovery foundations','discovery','clustering',range('U',1,2),'Frame a question without a prediction target, then decide what distance and scale mean for these observations.',['ML-F01','ML-F02','ML-W03']),
    collection('k-means','K-Means','discovery','clustering',['ML-U03','ML-U04','ML-U05','ML-U-R1','ML-U06'],'Fit centroids, compare k, describe original-unit profiles and test the limits of K-Means geometry.',['ML-U02']),
    collection('hierarchical','Hierarchical clustering','discovery','clustering',range('U',7,9),'Inspect Ward merges, compare cuts and explain the scope of a sampled hierarchy.',['ML-U02','ML-U04','ML-U05']),
    collection('discovery-interpretation','Discovery interpretation and checkpoint','discovery','clustering',['ML-U10','ML-U-R2','ML-U-K1'],'Interpret discovery without inventing true classes, retrieve hierarchy evidence and complete the discovery checkpoint.',['ML-U06','ML-U09']),
    collection('pca','Principal component analysis','discovery','pca',legacyOrder.pca,'Fit reusable axes, choose retained variation and interpret weights, scores and the limits of a two-dimensional view.',['ML-U02']),
    collection('model-comparison','Model comparison and reporting','capstone','comparison',legacyOrder.comparison,'Choose a task, compare candidates on common evidence and report supported conclusions with limits.',['ML-R-K1','ML-C-K1','ML-N-K1','ML-N-K2','ML-U-K1','ML-P-K1'])
  ];
  const byId=new Map(collections.map(c=>[c.id,c]));
  const byCard=new Map();
  for(const c of collections)for(const id of c.ids){
    if(byCard.has(id))throw Error('Duplicate ML collection card: '+id);
    byCard.set(id,c);
  }
  function primary(card){return byCard.get(typeof card==='string'?card:card.id)||null;}
  function selected(card,search=''){
    const candidate=byId.get(new URLSearchParams(search).get('collection'));
    return candidate?.ids.includes(card.id)?candidate:null;
  }
  root.MLLearningCollections={groups,collections,legacyOrder,primary,selected,get:id=>byId.get(id)||null,route:c=>'collections/'+(typeof c==='string'?c:c.id)};
})(typeof window!=='undefined'?window:globalThis);
