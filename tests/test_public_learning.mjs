import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), C=require('../foundations/curriculum.js');
const root=path.resolve(import.meta.dirname,'../dist');
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const files=(await fs.readdir(root)).filter(f=>f.endsWith('.html'));
files.push(...(await fs.readdir(path.join(root,'lessons'))).map(f=>'lessons/'+f));
for(const file of files){
 const html=await fs.readFile(path.join(root,file),'utf8');
 if(file!=='offline.html'){
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file);
  assert.ok(sitemap.includes('https://dataplayground.science/'+(file==='index.html'?'':file)),file);
 }
 for(const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
  const url=match[1].replaceAll('&amp;','&');
  if(/^(?:https?:|mailto:|tel:|data:|#)/.test(url))continue;
  const target=path.resolve(root,path.dirname(file),url.split(/[?#]/)[0]);
  assert.ok(target.startsWith(root+'/'),file+' path escape');
  await fs.access(target).catch(()=>assert.fail(file+' broken reference: '+url));
 }
}
for(const lesson of C.lessons){
 const html=await fs.readFile(path.join(root,'lessons',lesson.id.toLowerCase()+'.html'),'utf8');
 assert.ok(html.includes(lesson.title.replaceAll('&','&amp;')),lesson.id);
 assert.match(html,/concept-visual/);
 assert.match(html,/Open .* practice/);
 assert.ok(!html.includes('src="../foundations/app.js"'));
}
assert.match(await fs.readFile(path.join(root,'robots.txt'),'utf8'),/Sitemap:/);
console.log('Public reading: '+C.lessons.length+' lesson/review pages, canonical URLs, sitemap and all HTML asset/link targets passed.');
