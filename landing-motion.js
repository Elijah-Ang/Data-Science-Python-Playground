/* Local WebGL motion layer for the responsive landing artwork. The source image remains the fallback. */
(() => {
  "use strict";
  const frame=document.querySelector("[data-scene]");
  const art=frame;
  const canvas=frame?.querySelector(".scene-motion");
  const still=frame?.querySelector(".scene-art");
  const portraitQuery=window.matchMedia("(max-width: 720px), (orientation: portrait)");
  const reducedMotionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(!frame || !canvas || !still || reducedMotionQuery.matches) return;
  const base=new URL("assets/landing/",document.baseURI).href;
  const state={layout:portraitQuery.matches?"portrait":"landscape",playing:true,motion:1,speed:1};
  let time=0,last=performance.now(),token=0,animationFrame=0,current=null,regions=[],loaded=false;
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if(!gl){console.info("[Landing motion] WebGL unavailable; keeping the original artwork.");return;}
const MAX=32;
    const vertex=`
      precision highp float;
      attribute vec2 position;
      varying vec2 uv;
      uniform vec2 size;
      uniform vec4 zones[32];
      uniform vec4 moves[32];
      uniform vec2 pivots[32];
      uniform float amount;
      void main(){
        uv=position;
        vec2 p=position*size, d=vec2(0.);
        for(int i=0;i<32;i++){
          vec4 z=zones[i];
          vec2 r=max(z.zw,vec2(1.));
          float w=1.-smoothstep(.55,1.,length((p-z.xy)/r));
          vec2 q=p-pivots[i];
          float a=moves[i].z,c=cos(a),s=sin(a);
          vec2 rotated=vec2(q.x*c-q.y*s,q.x*s+q.y*c);
          d+=(rotated-q+moves[i].xy+q*moves[i].w)*w;
        }
        vec2 outp=(p+d*amount)/size;
        gl_Position=vec4(outp.x*2.-1.,1.-outp.y*2.,0.,1.);
      }`;
    const fragment=`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D picture;
      uniform vec2 size;
      uniform float time,amount,portrait;
      uniform vec4 eyes[4];
      float ellipse(vec2 p,vec4 e){return 1.-smoothstep(.7,1.,length((p-e.xy)/e.zw));}
      void main(){
        vec2 px=uv*size;
        vec4 original=texture2D(picture,uv);
        vec4 pond=portrait>.5?vec4(670.,1310.,150.,90.):vec4(1353.,791.,145.,70.);
        float water=ellipse(px,pond);
        float falls=portrait>.5?0.:ellipse(px,vec4(1395.,674.,57.,85.));
        float blue=smoothstep(.10,.25,original.b-original.r)*smoothstep(.1,.23,original.g-original.r);
        vec2 ripple=vec2(sin(px.y*.12-time*2.8)*1.7+sin(px.x*.045+time*1.9)*.8,cos(px.x*.09-time*2.2)*1.1);
        ripple.y+=falls*sin(px.y*.15-time*6.)*2.;
        vec2 lookup=uv+(ripple/size)*(water+falls)*blue*amount;
        vec4 color=texture2D(picture,lookup);
        float shimmer=sin(px.y*.24-time*3.8+sin(px.x*.05))*sin(px.x*.047+time*.7);
        color.rgb+=vec3(.02,.055,.065)*shimmer*water*blue*amount;
        for(int i=0;i<4;i++){
          vec4 eye=eyes[i];
          float phase=mod(time+float(i)*1.27,5.1+float(i)*.31);
          float blink=smoothstep(0.,.10,phase)*(1.-smoothstep(.13,.25,phase));
          float mask=ellipse(px,eye);
          float lit=smoothstep(.10,.32,color.g-color.r);
          float lid=smoothstep((1.-blink)*eye.w, (1.-blink)*eye.w+1.,abs(px.y-eye.y));
          color.rgb=mix(color.rgb,vec3(.016,.034,.047),mask*lit*lid*blink*amount);
        }
        gl_FragColor=color;
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);}catch(e){console.warn('[Landing motion] Could not start animated preview.',e);return;}
    const locations={};['size','zones[0]','moves[0]','pivots[0]','amount','time','portrait','eyes[0]','picture'].forEach(k=>locations[k]=gl.getUniformLocation(program,k));
    const buffer=gl.createBuffer(),texture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.uniform1i(locations.picture,0);
    let vertexCount=0;
    const zones=new Float32Array(MAX*4),moves=new Float32Array(MAX*4),pivots=new Float32Array(MAX*2);
    function zone(x,y,rx,ry,dx,dy,angle,period,phase=0,pivotX=x,pivotY=y){return{x,y,rx,ry,dx,dy,angle,period,phase,pivotX,pivotY};}
    const Z=zone;
    function scene(layout){
      if(layout==='portrait')return{width:941,height:1672,eyes:[331,267,37,19,474,715,38,20,161,1122,42,20,686,1083,35,21],regions:[
        Z(312,149,295,157,3,0,.012,6.2,0,302,550),Z(96,286,83,95,2,1,.014,5.2,1),Z(484,211,120,116,3,1,.014,5.7,2),
        Z(246,61,100,52,2,1,.018,4.9,.4),Z(382,73,125,69,3,0,.012,5.4,1.4),
        Z(741,186,108,114,3,2,.028,5.2,1,725,295),Z(154,528,57,70,0,0,.05,4.1,.2,163,433),
        Z(339,274,64,61,0,2,.038,4.8,.5,338,308),Z(357,332,40,33,1,1,.027,4.8,1),
        Z(479,735,81,90,-7,12,.027,4.1,0,489,738),Z(530,735,24,27,0,1,.18,2.05,.3,510,758),Z(429,707,24,25,0,-1,-.12,2.05,1,443,735),
        Z(687,1084,89,113,0,0,.09,3.8,0,716,954),
        Z(160,1125,69,70,1,2,.045,4.7,1,166,1182),Z(219,1152,26,41,0,0,.19,2.35,1,207,1178),
        Z(678,1308,30,37,4,1.6,.025,5.3,.9),Z(732,1348,34,19,1,1,.025,4.2,2),Z(574,1287,40,20,1,1,.02,4.7,0),
        Z(608,439,64,38,0,2,.026,3.6,0,561,458),Z(816,592,37,31,0,1,.06,3.2,1,792,610),
        Z(474,433,67,43,1,2,.025,5.3,0,435,399),Z(139,650,73,55,2,0,.019,4.8,.2),Z(325,1033,96,47,0,1,0,3.8),
        Z(858,1171,60,72,2,1,.018,5.1,2),Z(738,1240,47,50,2,0,.04,4.6,1,730,1275),Z(66,1457,53,69,2,0,.023,5.3),
        Z(245,1617,114,52,2,0,.009,5.6,1),Z(810,807,48,41,1,1,.015,5.2,2),Z(225,1376,36,36,0,2,.025,3.9,2),
        Z(178,1009,32,29,0,1,.13,1.6,.2),Z(337,1541,44,35,1,0,.018,5.1,2)
      ]};
      return{width:1672,height:941,eyes:[475,209,39,18,864,322,39,20,349,609,43,20,1164,586,36,20],regions:[
        Z(443,138,280,146,3,0,.013,6.2,0,425,457),Z(262,204,88,103,2,1,.019,5.2,1),Z(683,224,88,101,3,1,.016,5.7,2),
        Z(438,60,110,67,2,1,.016,4.9,.4),Z(560,82,97,62,3,0,.014,5.4,1.4),Z(1138,170,107,65,2,0,.015,5.9,1),
        Z(1380,168,88,94,2,2,.027,5.2,1,1377,252),Z(318,403,47,60,0,0,.065,4.1,.2,316,332),
        Z(478,215,63,54,0,2,.037,4.8,.5,478,250),Z(485,265,38,30,1,1,.026,4.8,1),
        Z(867,342,77,78,-7,12,.025,4.1,0,859,360),Z(917,340,23,26,0,1,.19,2.05,.3,898,359),Z(813,321,23,26,0,-1,-.14,2.05,1,830,342),
        Z(1166,603,85,97,0,0,.09,3.8,0,1193,490),
        Z(350,610,65,69,1,2,.045,4.7,1,352,662),Z(410,638,26,36,0,0,.19,2.35,1,397,660),
        Z(1354,784,33,28,4,1.5,.027,5.3,.9),Z(1287,813,37,21,1,1,.024,4.2,2),Z(1420,783,33,20,1,1,.02,4.7),
        Z(1014,81,56,37,0,2,.027,3.6,0,966,95),Z(1554,400,44,31,0,1,.06,3.2,1,1534,420),
        Z(628,348,65,38,1,2,.027,5.3,0,582,316),Z(700,382,61,49,2,0,.02,4.8,.2),
        Z(123,368,70,51,2,0,.02,5.1,2),Z(1443,737,36,52,2,0,.043,4.6,1,1438,777),Z(95,786,68,66,2,0,.019,5.3),
        Z(1098,899,71,36,2,0,.012,5.6,1),Z(1398,569,30,28,0,1.5,.025,3.9,2),Z(1440,530,29,28,0,1,.13,1.6,.2),
        Z(309,514,28,26,0,1,.13,1.6,1),Z(482,802,39,28,0,1.5,.026,4.3,1)
      ]};
    }
    function geometry(w,h){
      const cols=Math.ceil(w/7),rows=Math.ceil(h/7),vertices=new Float32Array(cols*rows*12);let n=0;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=x/cols,b=y/rows,c=(x+1)/cols,d=(y+1)/rows;[a,b,c,b,a,d,a,d,c,b,c,d].forEach(v=>vertices[n++]=v);}
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);vertexCount=vertices.length/2;
    }
    const cache={};
    function loadImage(url){return cache[url]||(cache[url]=new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Artwork could not load.'));img.src=url;}));}
    function resize(){if(!current)return;const ratio=Math.min(devicePixelRatio||1,1.6),width=Math.min(current.width,Math.round(art.clientWidth*ratio)),height=Math.round(width*current.height/current.width);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,canvas.width,canvas.height);}}
    function draw(){if(!loaded)return;regions.forEach((r,i)=>{const wave=Math.sin(time*Math.PI*2/r.period+r.phase);moves.set([r.dx*wave,r.dy*Math.sin(time*Math.PI*2/r.period+r.phase+.4),r.angle*wave,0],i*4);});gl.uniform4fv(locations['moves[0]'],moves);gl.uniform1f(locations.time,time+1.8);gl.uniform1f(locations.amount,state.motion);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertexCount);}
function tick(now){if(!frame.isConnected){cancelAnimationFrame(animationFrame);return;}const delta=Math.min((now-last)/1000,.05);last=now;if(state.playing&&!document.hidden)time+=delta*state.speed;if(loaded){resize();draw();}animationFrame=requestAnimationFrame(tick);}
async function setLayout(layout){
  state.layout=layout;
  frame.dataset.layout=layout;
  frame.dataset.motion='loading';
  loaded=false;
  frame.classList.remove('motion-ready');
  const own=++token,name=layout==='portrait'?'mobile':'desktop',url=base+'data-playground-'+name+'-source.webp';
  still.src=url;
  try{
    const img=await loadImage(url);
    if(own!==token)return;
    current=scene(layout);
    regions=current.regions;
    zones.fill(0);moves.fill(0);pivots.fill(0);
    regions.forEach((r,i)=>{zones.set([r.x,r.y,r.rx,r.ry],i*4);pivots.set([r.pivotX,r.pivotY],i*2);});
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.uniform2f(locations.size,current.width,current.height);
    gl.uniform4fv(locations['zones[0]'],zones);
    gl.uniform2fv(locations['pivots[0]'],pivots);
    gl.uniform4fv(locations['eyes[0]'],new Float32Array(current.eyes));
    gl.uniform1f(locations.portrait,layout==='portrait'?1:0);
    geometry(current.width,current.height);
    resize();
    loaded=true;
    draw();
    frame.classList.add('motion-ready');
    frame.dataset.motion='ready';
  }catch(e){
    frame.dataset.motion='fallback';
    console.warn('[Landing motion] Artwork animation unavailable; keeping the original image.',e);
  }
}
portraitQuery.addEventListener('change',()=>setLayout(portraitQuery.matches?'portrait':'landscape'));
const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
observer?.observe(art);
window.addEventListener('resize',resize,{passive:true});
setLayout(state.layout);
animationFrame=requestAnimationFrame(tick);
})();
