// Local-only authoring tool. No capture endpoints are included in deployment.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const destination=path.join(root,'assets/tour-snapshots');
await fs.mkdir(destination,{recursive:true});
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:8004');
    if(req.method==='POST'){
      if(req.headers.origin!=='http://127.0.0.1:8004'||!/^\/__capture\/(wide|mobile)-[a-z-]+\.html$/.test(url.pathname)){res.writeHead(403).end();return;}
      let body='';for await(const chunk of req){body+=chunk;if(body.length>15000000)throw Error('Too large');}
      await fs.writeFile(path.join(destination,path.basename(url.pathname)),body);res.end('saved');return;
    }
    const relative=['/','/tutorial.html'].includes(url.pathname)?'scripts/tour-capture.html':decodeURIComponent(url.pathname.slice(1));
    if(relative.split('/').includes('..')||relative==='service-worker.js'){res.writeHead(404).end();return;}
    const file=path.join(relative.startsWith('scripts/')?root:path.join(root,'dist'),relative);
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
  }catch{res.writeHead(500).end('Capture server error');}
}).listen(8004,'127.0.0.1',()=>console.log('Capture UI: http://127.0.0.1:8004/'));
