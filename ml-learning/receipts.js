/* One active, in-memory receipt. No code, results, or completion state is saved. */
(function(root){
  'use strict';
  function createReceiptStore(){
    let generation=0,activity=null,receipt=null,submittedCode=null,testExposed=false;
    return {
      enter(id){generation++;if(activity!==id)testExposed=false;activity=id;receipt=null;submittedCode=null;},
      edit(){generation++;receipt=null;submittedCode=null;},
      begin(code){generation++;receipt=null;submittedCode=code;return generation;},
      accept(token,code,result){
        if(token!==generation||code!==submittedCode||result.exerciseId!==activity)return false;
        receipt=result;testExposed=testExposed||!!result.provenance?.testExposed;
        return true;
      },
      check(code){return code===submittedCode?receipt:null;},
      get exposed(){return testExposed;},
      get retainedReceipts(){return receipt?1:0;},
      get generation(){return generation;}
    };
  }
  const api={createReceiptStore};
  if(typeof module!=='undefined')module.exports=api;else root.MLLearningReceipts=api;
})(typeof window!=='undefined'?window:globalThis);
