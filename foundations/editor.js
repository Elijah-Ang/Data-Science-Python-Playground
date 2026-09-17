/* Textarea indentation with an explicit way to leave the editor by keyboard. */
(function(root){
'use strict';
function indentation(value,start,end,outdent=false){
 const lineStart=start===0?0:value.lastIndexOf('\n',start-1)+1;
 if(!outdent&&start===end){
  const spaces=' '.repeat(4-(start-lineStart)%4);
  return {from:start,to:end,text:spaces,start:start+spaces.length,end:start+spaces.length};
 }
 const lastPosition=end>start&&value[end-1]==='\n'?end-1:end;
 const nextBreak=value.indexOf('\n',lastPosition);
 const lineEnd=nextBreak<0?value.length:nextBreak;
 const lines=value.slice(lineStart,lineEnd).split('\n');
 const removed=lines.map(line=>outdent?(line.startsWith('\t')?1:Math.min(4,line.match(/^ */)[0].length)):0);
 const text=lines.map((line,i)=>outdent?line.slice(removed[i]):'    '+line).join('\n');
 const shift=outdent?-removed.reduce((sum,n)=>sum+n,0):4*lines.length;
 return {from:lineStart,to:lineEnd,text,
  start:outdent?Math.max(lineStart,start-removed[0]):start+4,
  end:outdent?Math.max(lineStart,end+shift):end+shift};
}
function attach(editor,run,leave){
 let leaveOnTab=false;
 editor.addEventListener('blur',()=>{leaveOnTab=false;});
 editor.addEventListener('keydown',event=>{
  if(['Shift','Control','Alt','Meta'].includes(event.key))return;
  if(event.key==='Escape'){leaveOnTab=true;event.stopPropagation();return;}
  if(event.key==='Tab'&&leaveOnTab){leaveOnTab=false;if(leave){event.preventDefault();leave(event.shiftKey);}return;}
  leaveOnTab=false;
  if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();run();return;}
  if(event.key!=='Tab'||event.ctrlKey||event.metaKey||event.altKey)return;
  event.preventDefault();
  const edit=indentation(editor.value,editor.selectionStart,editor.selectionEnd,event.shiftKey);
  const top=editor.scrollTop,left=editor.scrollLeft;
  editor.setSelectionRange(edit.from,edit.to);
  // Native insertion retains the browser's undo history; setRangeText is a fallback.
  if(!document.execCommand('insertText',false,edit.text)){
   editor.setRangeText(edit.text,edit.from,edit.to,'end');
  }
  editor.setSelectionRange(edit.start,edit.end);
  editor.scrollTop=top;editor.scrollLeft=left;
  editor.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
const api={indentation,attach};
if(typeof module!=='undefined')module.exports=api;else root.FoundationEditor=api;
})(typeof window!=='undefined'?window:globalThis);
