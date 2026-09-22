(()=>{
    const frame=document.querySelector("[data-scene]");
    const root=frame,art=frame,canvas=frame?.querySelector(".scene-motion"),still=frame?.querySelector(".scene-art"),actorCanvas=frame?.querySelector(".scene-actors");
    const portraitQuery=window.matchMedia("(max-width: 720px), (orientation: portrait)");
    const reducedMotionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(!frame || !canvas || !still || !actorCanvas || reducedMotionQuery.matches) return;
    const base=new URL("assets/landing/",document.baseURI).href;
    const state={layout:portraitQuery.matches?"portrait":"landscape",playing:true,motion:1,speed:1};
    const actorContext=actorCanvas.getContext("2d");
    let time=0,last=performance.now(),token=0,raf=0,current=null,regions=[],loaded=false,actors=[];
    const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true});
    if(!gl){console.info("[Landing motion] WebGL unavailable; keeping the original artwork.");return;}
    function fallback(){++token;loaded=false;actors=[];frame.classList.remove('motion-ready');frame.dataset.motion='fallback';}
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
    // Keep the static scene after context loss; do not force a page reload.
    const MAX=32;
    const vertex=`
      precision highp float;
      attribute vec2 position;
      varying vec2 uv;
      uniform vec2 size;
      uniform vec4 zones[32];
      uniform vec4 moves[32];
      uniform vec4 pivots[32];
      uniform float amount;
      uniform float portrait;
      void main(){
        uv=position;
        vec2 p=position*size, d=vec2(0.);
        for(int i=0;i<32;i++){
          vec4 z=zones[i];
          vec2 r=max(z.zw,vec2(1.));
          float w=1.-smoothstep(pivots[i].z,1.,length((p-z.xy)/r));
          if(pivots[i].w>0.)w*=1.-smoothstep(pivots[i].w-26.,pivots[i].w,p.y);
          vec2 q=p-pivots[i].xy;
          float a=moves[i].z,c=cos(a),s=sin(a);
          vec2 rotated=vec2(q.x*c-q.y*s,q.x*s+q.y*c);
          d+=(rotated-q+moves[i].xy+q*moves[i].w)*w;
        }
        if(portrait<.5){
          float tree=1.-smoothstep(.60,1.,length((p-vec2(455.,240.))/vec2(350.,310.)));
          d+=vec2(-(p.x-455.)*.04,p.y*.025)*tree;
        }
        vec2 outp=(p+d*amount)/size;
        gl_Position=vec4(outp.x*2.-1.,1.-outp.y*2.,0.,1.);
      }`;
    const fragment=`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D picture;
      uniform sampler2D untouched;
      uniform vec2 size;
      uniform float time,amount,portrait;
      uniform vec4 eyes[4];
      float ellipse(vec2 p,vec4 e){return 1.-smoothstep(.7,1.,length((p-e.xy)/e.zw));}
      void main(){
        vec2 px=uv*size;
        if(amount<.001){gl_FragColor=texture2D(untouched,uv);return;}
        vec4 original=texture2D(picture,uv);
        vec4 pond=portrait>.5?vec4(670.,1310.,150.,90.):vec4(1353.,791.,145.,70.);
        float water=ellipse(px,pond);
        float falls=portrait>.5?0.:ellipse(px,vec4(1395.,680.,24.,62.));
        float duck=portrait>.5?ellipse(px,vec4(678.,1308.,42.,46.)):ellipse(px,vec4(1354.,784.,44.,37.));
        water*=1.-duck; falls*=1.-duck;
        float blue=smoothstep(.10,.25,original.b-original.r)*smoothstep(.1,.23,original.g-original.r);
        vec2 ripple=vec2(sin(px.y*.12-time*2.8)*.65+sin(px.x*.045+time*1.9)*.3,cos(px.x*.09-time*2.2)*.45);
        ripple.y+=falls*sin(px.y*.15-time*6.)*2.;
        vec4 crown=portrait>.5?vec4(302.,143.,295.,170.):vec4(449.,128.,290.,154.);
        float foliage=ellipse(px,crown)*smoothstep(.08,.22,original.g-max(original.r,original.b));
        float breeze=sin(px.x*.055-time*1.5+px.y*.022)*.62;
        vec2 lookup=uv+((ripple*(water+falls)*blue)+vec2(breeze,0.)*foliage)*amount/size;
        vec4 color=texture2D(picture,lookup);
        float shimmer=sin(px.y*.24-time*3.8+sin(px.x*.05))*sin(px.x*.047+time*.7);
        color.rgb+=vec3(.02,.055,.065)*shimmer*water*blue*amount;
        for(int i=0;i<4;i++){
          if(i==1||i==3||(portrait>.5&&i==2))continue;
          vec4 eye=eyes[i];
          float phase=mod(time+float(i)*1.27,5.1+float(i)*.31);
          float blink=smoothstep(0.,.10,phase)*(1.-smoothstep(.13,.25,phase));
          float mask=ellipse(px,eye);
          float lit=smoothstep(.10,.32,color.g-color.r);
          float lid=smoothstep((1.-blink)*eye.w, (1.-blink)*eye.w+1.,abs(px.y-eye.y));
          color.rgb=mix(color.rgb,vec3(.016,.034,.047),mask*lit*lid*blink*amount);
        }
        if(color.a<.015)color=vec4(0.);
        gl_FragColor=color;
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);}catch(e){console.warn('[Landing motion] Could not start animated landing motion.',e);return;}
    const locations={};['size','zones[0]','moves[0]','pivots[0]','amount','time','portrait','eyes[0]','picture','untouched'].forEach(k=>locations[k]=gl.getUniformLocation(program,k));
    const buffer=gl.createBuffer(),untouched=gl.createTexture();
    let texture=null;
    function bindArtworkTexture(tex,unit){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);}
    bindArtworkTexture(untouched,1);gl.uniform1i(locations.picture,0);gl.uniform1i(locations.untouched,1);
    let vertexCount=0;
    const zones=new Float32Array(MAX*4),moves=new Float32Array(MAX*4),pivots=new Float32Array(MAX*4);
    function zone(x,y,rx,ry,dx,dy,angle,period,phase=0,pivotX=x,pivotY=y,inner=.55,stopY=0){return{x,y,rx,ry,dx,dy,angle,period,phase,pivotX,pivotY,inner,stopY};}
    const Z=zone;
    function scene(layout){
      if(layout==='portrait')return{width:941,height:1672,eyes:[331,267,37,19,474,715,38,20,161,1122,42,20,686,1083,35,21],regions:[
        Z(339,274,76,74,0,.7,.012,4.8,.5,338,308,.86),Z(357,332,40,33,.4,.5,.012,4.8,1),
        Z(678,1308,30,37,4,1.6,.025,5.3,.9),Z(732,1348,34,19,1,1,.025,4.2,2),Z(574,1287,40,20,1,1,.02,4.7,0),
        Z(608,439,64,38,0,2,.026,3.6,0,561,458),Z(816,592,37,31,0,1,.06,3.2,1,792,610),
        Z(474,433,67,43,1,2,.025,5.3,0,435,399),Z(139,650,73,55,2,0,.019,4.8,.2),Z(325,1033,96,47,0,1,0,3.8),
        Z(858,1171,60,72,2,1,.018,5.1,2),Z(738,1240,47,50,2,0,.04,4.6,1,730,1275),Z(66,1457,53,69,2,0,.023,5.3),
        Z(245,1617,114,52,2,0,.009,5.6,1),Z(810,807,48,41,1,1,.015,5.2,2),Z(225,1376,36,36,0,2,.025,3.9,2),
        Z(337,1541,44,35,1,0,.018,5.1,2)
      ]};
      return{width:1672,height:941,eyes:[475,209,39,18,864,322,39,20,349,609,43,20,1164,586,36,20],regions:[
        Z(1138,170,107,65,1,0,.007,5.9,1),
        Z(478,215,77,67,0,.7,.012,4.8,.5,478,250,.86),Z(485,265,38,30,.4,.5,.012,4.8,1),

        Z(1354,784,33,28,4,1.5,.027,5.3,.9),Z(1287,813,37,21,1,1,.024,4.2,2),Z(1420,783,33,20,1,1,.02,4.7),
        Z(1014,81,56,37,0,2,.027,3.6,0,966,95),Z(1554,400,44,31,0,1,.06,3.2,1,1534,420),
        Z(628,348,65,38,1,2,.027,5.3,0,582,316),Z(700,382,61,49,2,0,.02,4.8,.2),
        Z(123,368,70,51,2,0,.02,5.1,2),Z(1443,737,36,52,2,0,.043,4.6,1,1438,777),Z(95,786,68,66,2,0,.019,5.3),
        Z(1098,899,71,36,2,0,.012,5.6,1),Z(1398,569,30,28,0,1.5,.025,3.9,2),
        Z(482,802,39,28,0,1.5,.026,4.3,1)
      ]};
    }
    function geometry(w,h){
      const cols=Math.ceil(w/7),rows=Math.ceil(h/7),vertices=new Float32Array(cols*rows*12);let n=0;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=x/cols,b=y/rows,c=(x+1)/cols,d=(y+1)/rows;[a,b,c,b,a,d,a,d,c,b,c,d].forEach(v=>vertices[n++]=v);}
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);vertexCount=vertices.length/2;
    }
    const cache={};
    function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
    function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
    function butterfly(x,y,rx,ry,phase){
      const outline=[[-.07,-.32],[-.39,-.91],[-.72,-1],[-.96,-.78],[-1,-.38],[-.73,-.04],[-.91,.22],[-.81,.67],[-.4,.79],[-.02,.55],[.26,.88],[.73,.78],[.93,.4],[.78,.10],[.60,-.03],[.92,-.4],[.98,-.8],[.77,-1],[.48,-.96],[.09,-.48]];
      return{kind:'butterfly',pivot:[x,y],phase,shapes:[outline.map(([a,b])=>[x+a*rx,y+b*ry])]};
    }
    function baseActorSpecs(layout){
      if(layout==='portrait')return[
        {kind:'swing',pivot:[735,963],ropes:[[[690,955],[640,1122]],[[779,972],[721,1150]]],shapes:[
          [[646,1077],[652,1061],[663,1048],[679,1038],[696,1033],[714,1037],[730,1047],[741,1060],[744,1073],[741,1090],[734,1105],[740,1098],[749,1100],[754,1108],[754,1118],[746,1127],[737,1129],[733,1125],[729,1145],[733,1154],[730,1164],[719,1171],[700,1171],[684,1165],[679,1173],[668,1174],[657,1168],[652,1161],[641,1164],[631,1160],[623,1150],[620,1135],[624,1127],[634,1120],[642,1118],[652,1119],[661,1113],[649,1105],[646,1097],[638,1104],[631,1103],[627,1097],[628,1087],[635,1080]],
          [[694,1035],[688,1028],[688,1020],[692,1012],[697,1011],[705,1015],[709,1023],[709,1034]],
          [[709,1037],[713,1025],[723,1017],[729,1017],[734,1022],[734,1028],[729,1035],[716,1040]]
        ]},
        {kind:'balloons',pivot:[720,242],clear:true,shapes:[[[682,128],[686,99],[703,82],[728,79],[750,85],[766,102],[773,139],[787,151],[798,175],[799,203],[786,226],[770,235],[755,245],[703,235],[685,236],[643,226],[623,209],[613,187],[615,161],[628,140],[649,129]]]},
        butterfly(177,1010,27,25,.3)
      ];
      return[
        {kind:'swing',pivot:[1191,503],ropes:[[[1144,498],[1114,626]],[[1240,508],[1194,655]]],shapes:[
          [[1125,573],[1132,561],[1146,549],[1162,544],[1180,544],[1185,542],[1200,547],[1214,556],[1221,568],[1221,584],[1213,594],[1221,591],[1230,598],[1235,606],[1233,617],[1223,625],[1214,627],[1207,621],[1205,637],[1197,646],[1207,650],[1211,657],[1209,666],[1197,673],[1186,674],[1161,668],[1154,673],[1144,674],[1133,669],[1127,659],[1116,664],[1105,659],[1097,647],[1097,637],[1100,630],[1111,625],[1123,624],[1131,625],[1140,615],[1133,609],[1127,601],[1121,600],[1113,599],[1107,593],[1105,586],[1108,579],[1117,572]],
          [[1174,546],[1168,537],[1167,530],[1170,524],[1176,521],[1183,524],[1188,533],[1189,545]],
          [[1188,544],[1192,534],[1200,526],[1207,527],[1213,531],[1214,537],[1207,543],[1193,547]]
        ]},
        {kind:'balloons',pivot:[1382,242],clear:true,shapes:[[[1305,156],[1318,132],[1356,129],[1372,112],[1394,100],[1420,104],[1440,122],[1446,147],[1466,160],[1473,188],[1460,214],[1438,230],[1401,244],[1359,226],[1339,225],[1313,204],[1303,183]]]},
        butterfly(309,514,25,23,0),butterfly(1438,530,24,24,.4)
      ];
    }
    function actorSpecs(layout){
      const mobile=layout==='portrait';
      const specs=baseActorSpecs(layout).filter(a=>a.kind!=='balloons');
      const rider=specs.find(a=>a.kind==='swing');
      // Retain the original rope pixels and complete hands in one rigid assembly.
      // Nothing is painted over the robot's arms and no limb is scaled separately.
      rider.strokes=rider.ropes.map(points=>({points,width:13}));
      delete rider.ropes;rider.grow=.5;rider.erasePad=2;
      if(mobile){
        rider.paths=['M 649 1074 C 632 1074 625 1083 627 1095 C 628 1104 636 1110 645 1105 Z','M 738 1097 C 750 1093 759 1102 757 1115 C 756 1126 745 1133 734 1128 Z'];
        const insect=specs.find(a=>a.kind==='butterfly');
        insect.pivot=[181,1018];insect.shapes=[[[181,1010],[175,1000],[165,992],[158,991],[152,995],[150,1004],[153,1013],[160,1018],[155,1022],[154,1029],[160,1037],[167,1038],[176,1032],[181,1024],[187,1033],[195,1038],[202,1035],[206,1028],[204,1021],[200,1018],[207,1010],[210,1001],[207,993],[201,991],[193,994],[185,1003]]];
        insect.eraseRect=[147,987,67,55];insect.grow=.5;
        specs.push({kind:'slider',pivot:[478,732],grow:1,erasePad:9,shapes:[[[442,687],[453,677],[469,669],[489,665],[506,669],[521,678],[532,693],[536,707],[531,716],[542,716],[550,722],[553,731],[549,741],[539,745],[531,744],[522,754],[508,762],[500,761],[498,775],[488,786],[478,797],[466,797],[453,788],[451,782],[441,787],[431,784],[421,777],[417,765],[421,758],[431,752],[439,748],[432,740],[425,727],[422,722],[413,720],[407,712],[407,701],[412,692],[421,688],[431,690],[437,696]] ]});
        specs.push({kind:'tire',pivot:[161,438],erasePad:4,paths:['M 157 475 C 129 471 108 490 105 519 C 100 547 120 569 150 573 C 182 577 208 559 213 532 C 219 507 202 481 176 478 Z M 157 507 C 142 509 142 530 149 539 C 155 551 171 547 178 535 C 185 521 175 507 164 507 Z'],strokes:[{points:[[162,439],[162,465],[170,482],[170,494],[163,505]],width:11}]});
        specs.push({kind:'balloons',pivot:[708,235],clear:true,paths:[
          'M 714 91 L 731 91 Q 750 94 761 111 Q 770 127 768 146 L 751 155 L 712 174 L 699 159 Q 683 147 683 128 Q 684 106 703 96 Z',
          'M 643 135 Q 662 132 681 144 Q 702 155 707 175 Q 711 196 689 211 Q 677 221 666 220 L 666 225 L 656 228 L 651 221 Q 637 215 631 202 Q 624 188 628 167 Q 631 146 643 135 Z',
          'M 755 147 Q 774 146 789 161 Q 800 176 798 191 Q 796 211 772 222 L 760 224 L 756 229 L 746 228 L 742 222 Q 723 218 716 200 Q 708 180 718 164 Q 731 147 755 147 Z'
        ],edgePaths:['M 643 135 Q 631 146 628 167 Q 624 188 631 202 Q 637 215 651 221'],strokes:[{points:[[657,224],[670,233],[677,237]],width:2.8},{points:[[710,171],[706,203],[701,234]],width:3},{points:[[753,225],[749,238],[749,245]],width:3}],clearShape:[[607,84],[803,84],[805,242],[781,258],[742,234],[707,230],[663,238],[609,246]]});
      }else{
        rider.paths=['M 1128 570 C 1116 568 1106 574 1104 584 C 1101 595 1110 603 1123 602 Z','M 1218 589 C 1231 588 1240 597 1238 610 C 1236 623 1226 630 1212 628 Z'];
        for(const insect of specs.filter(a=>a.kind==='butterfly')){insect.grow=1.5;insect.eraseRect=[insect.pivot[0]-31,insect.pivot[1]-30,63,60];}
        specs.push({kind:'slider',pivot:[866,346],grow:1,erasePad:9,shapes:[[[829,307],[842,294],[858,285],[878,280],[896,284],[912,293],[923,310],[925,326],[920,333],[930,334],[939,342],[940,352],[934,361],[925,366],[917,365],[906,377],[891,382],[883,380],[881,393],[871,404],[861,408],[847,404],[839,394],[832,398],[819,397],[809,388],[807,376],[812,366],[824,360],[829,360],[820,351],[812,335],[803,335],[796,327],[795,315],[803,307],[813,303],[825,307]] ]});
        specs.push({kind:'tire',pivot:[316,328],erasePad:4,paths:['M 314 364 C 289 365 274 379 273 402 C 269 426 284 448 309 451 C 334 455 354 442 361 420 C 367 396 354 373 333 368 Z M 307 391 C 293 396 293 416 302 423 C 312 433 324 425 330 412 C 335 399 324 389 313 390 Z'],strokes:[{points:[[316,329],[315,356],[322,371],[322,383],[315,391]],width:10}]});
        specs.push({kind:'balloons',pivot:[1399,228],clear:true,paths:[
          'M 1396 105 L 1415 105 Q 1439 111 1446 133 L 1446 150 L 1404 171 L 1390 166 Q 1373 158 1371 140 Q 1370 119 1386 111 Z',
          'M 1333 132 L 1351 132 Q 1370 135 1381 151 Q 1391 169 1384 187 Q 1377 201 1363 205 L 1353 207 L 1352 213 L 1341 217 L 1338 207 Q 1316 206 1307 187 Q 1298 170 1308 152 Q 1316 137 1333 132 Z',
          'M 1428 149 Q 1453 147 1465 167 Q 1475 184 1466 199 Q 1455 216 1438 217 L 1433 224 L 1421 223 L 1419 217 Q 1401 213 1394 197 Q 1388 182 1396 168 Q 1404 153 1428 149 Z'
        ],strokes:[{points:[[1347,211],[1363,223],[1380,227]],width:3},{points:[[1397,170],[1390,197],[1388,227]],width:3},{points:[[1427,218],[1414,224],[1403,229]],width:3}],clearShape:[[1295,97],[1483,97],[1483,225],[1433,226],[1395,229],[1354,225],[1310,220],[1295,217]]});
      }
      const balloons=specs.find(a=>a.kind==='balloons');
      balloons.paths=[];balloons.shapes=[];delete balloons.edgePaths;
      const balloonShapes=[[1408,137,33,33],[1349,169,36.5,37.5],[1434,183,35,36]];
      balloons.ellipses=mobile?balloonShapes.map(([x,y,rx,ry])=>[725+(x-1408)*1.12,128+(y-137)*1.12,rx*1.12,ry*1.12]):balloonShapes;
      balloons.strokes=mobile?[{points:[[660,199],[670,231],[681,237]],width:1.7},{points:[[712,158],[708,203],[701,234]],width:1.7},{points:[[754,212],[753,237],[750,245]],width:1.7}]:[{points:[[1351,200],[1368,222],[1382,227]],width:1.7},{points:[[1399,164],[1392,198],[1388,227]],width:1.7},{points:[[1431,209],[1415,224],[1403,229]],width:1.7}];
      for(const actor of specs)if(actor.kind==='slider'){actor.grow=1;actor.erasePad=7;}
      if(mobile)specs.push({kind:'cat',pivot:[164,1208],erasePad:2,grow:.5,paths:['M 106 1120 C 100 1107 98 1083 105 1076 Q 115 1063 136 1083 L 171 1077 Q 190 1044 200 1057 Q 209 1074 207 1090 Q 220 1102 216 1129 Q 213 1146 199 1153 L 207 1160 L 216 1148 L 224 1146 L 222 1135 L 231 1121 L 243 1128 L 246 1144 L 231 1154 Q 232 1169 220 1175 L 208 1177 Q 222 1190 213 1208 Q 204 1219 189 1211 L 175 1206 Q 172 1226 154 1225 Q 139 1223 134 1213 Q 116 1207 117 1194 Q 103 1186 116 1160 Q 106 1153 104 1144 Q 91 1135 100 1125 Z']});
      if(!mobile){
        const cat=actorSpecs('portrait').find(a=>a.kind==='cat');
        cat.pivot=[355,701];
        cat.paths=cat.paths.map(path=>{let coordinate=0;return path.replace(/-?\d+(?:\.\d+)?/g,value=>{const isX=coordinate++%2===0;return String((Number(value)-(isX?164:1208))*.85+(isX?355:701));});});
        specs.push(cat);
      }
      return specs;
    }
    // Fill only the narrow background revealed by moving cutouts. The original
    // unmodified texture remains available for the comparison control.
    function mend(ctx,mask){
      const w=mask.width,h=mask.height,data=ctx.getImageData(0,0,w,h),p=data.data,m=mask.getContext('2d').getImageData(0,0,w,h).data;
      const unknown=new Uint8Array(w*h),queued=new Uint8Array(w*h),queue=[];
      for(let i=0;i<unknown.length;i++)unknown[i]=m[i*4+3]>24?1:0;
      const neighbors=[-w-1,-w,-w+1,-1,1,w-1,w,w+1];
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(unknown[i]&&neighbors.some(d=>!unknown[i+d])){queue.push(i);queued[i]=1;}}
      for(let k=0;k<queue.length;k++){
        const i=queue[k];let r=0,g=0,b=0,a=0,n=0;
        for(const d of neighbors){const j=i+d;if(j>=0&&j<unknown.length&&!unknown[j]){r+=p[j*4];g+=p[j*4+1];b+=p[j*4+2];a+=p[j*4+3];n++;}}
        if(!n)continue;p[i*4]=r/n;p[i*4+1]=g/n;p[i*4+2]=b/n;p[i*4+3]=a/n;unknown[i]=0;
        for(const d of neighbors){const j=i+d;if(j>w&&j<unknown.length-w&&unknown[j]&&!queued[j]){queue.push(j);queued[j]=1;}}
      }
      ctx.putImageData(data,0,0);
    }
    const slidePlates={portrait:{rect:[390,650,180,165],url:new URL("assets/landing/slide-plate-mobile.png",document.baseURI).href},landscape:{rect:[780,265,180,160],url:new URL("assets/landing/slide-plate-desktop.png",document.baseURI).href}};
    function prepareActors(img,layout,balloonSource=img,slidePlate){
      const w=img.naturalWidth,h=img.naturalHeight,clean=surface(w,h),ctx=clean.getContext('2d');ctx.drawImage(img,0,0);
      const repair=surface(w,h),repairContext=repair.getContext('2d'),specs=actorSpecs(layout);
      const original=surface(w,h),originalContext=original.getContext('2d');originalContext.drawImage(img,0,0);
      const pixels=originalContext.getImageData(0,0,w,h);
      // A successful load event does not guarantee a usable canvas image.
      assertArtwork(pixels.data);
      for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]<24){pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=pixels.data[i+3]=0;}
      originalContext.putImageData(pixels,0,0);
      for(const actor of specs){
        const pathPoints=(actor.paths||[]).flatMap(path=>{const n=path.match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];for(let i=0;i<n.length;i+=2)points.push([n[i],n[i+1]]);return points;});
        const points=[...(actor.shapes||[]).flat(),...pathPoints,...(actor.strokes||[]).flatMap(s=>s.points),...(actor.ellipses||[]).flatMap(([x,y,rx,ry])=>[[x-rx,y-ry],[x+rx,y+ry]])],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
        actor.x=Math.floor(Math.min(...xs))-12;actor.y=Math.floor(Math.min(...ys))-12;
        const sw=Math.ceil(Math.max(...xs))-actor.x+13,sh=Math.ceil(Math.max(...ys))-actor.y+13;
        const mask=surface(sw,sh),m=mask.getContext('2d');m.translate(-actor.x,-actor.y);m.lineJoin='round';m.lineCap='round';
        const grow=actor.grow||0;
        for(const shape of actor.shapes||[]){polygon(m,shape);m.fill();if(grow){m.lineWidth=grow*2;m.stroke();}}
        for(const path of actor.paths||[]){const p=new Path2D(path);m.fill(p,'evenodd');if(grow){m.lineWidth=grow*2;m.stroke(p);}}
        for(const [x,y,rx,ry] of actor.ellipses||[]){m.beginPath();m.ellipse(x,y,rx,ry,0,0,Math.PI*2);m.fill();}
        for(const stroke of actor.strokes||[]){m.beginPath();stroke.points.forEach(([x,y],i)=>i?m.lineTo(x,y):m.moveTo(x,y));m.lineWidth=stroke.width;m.stroke();}
        // The blue slide and frame are scenery, including gaps inside a robot's silhouette.
        // Keep the original blue neck and ear accents with their robot.
        if(actor.kind==='slider'){actor.removalMask=surface(sw,sh);actor.removalMask.getContext('2d').drawImage(mask,0,0);}
        if(actor.kind==='swing'||actor.kind==='butterfly'){
          const mp=m.getImageData(0,0,sw,sh),mobile=layout==='portrait';
          for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
            const gx=x+actor.x,gy=y+actor.y,j=(gy*w+gx)*4,k=(y*sw+x)*4;
            const r=pixels.data[j],g=pixels.data[j+1],b=pixels.data[j+2];
            const neck=actor.kind==='slider'&&(mobile?gx>446&&gx<492&&gy>731&&gy<760:gx>836&&gx<888&&gy>344&&gy<374);
            const face=actor.kind==='slider'&&(mobile?gx>444&&gx<520&&gy>679&&gy<734:gx>831&&gx<917&&gy>294&&gy<343);
            const ear=actor.kind==='swing'&&(mobile?gx>726&&gx<742&&gy>1080&&gy<1104:gx>1202&&gx<1219&&gy>588&&gy<613);
            if(actor.kind==='swing'&&!neck&&!face&&!ear&&b>90&&b-r>50&&b>g*1.12)mp.data[k+3]=0;
            if(actor.kind==='butterfly'&&g>r*1.12&&g>b*1.12)mp.data[k+3]=0;
          }
          m.putImageData(mp,0,0);
        }
        actor.image=surface(sw,sh);const c=actor.image.getContext('2d');c.drawImage(original,-actor.x,-actor.y);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';
        if(actor.kind==='balloons'){
          c.clearRect(0,0,sw,sh);c.save();c.translate(-actor.x,-actor.y);c.lineCap='round';c.lineJoin='round';
          for(const stroke of actor.strokes){c.beginPath();stroke.points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=stroke.width;c.strokeStyle='#51485d';c.stroke();}
          const sourceEllipses=[[1408,137,33,33],[1349,169,36.5,37.5],[1434,183,35,36]];
          actor.ellipses.forEach(([x,y,rx,ry],i)=>{const [sx,sy,srx,sry]=sourceEllipses[i];c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();c.drawImage(balloonSource,sx-srx,sy-sry,srx*2,sry*2,x-rx,y-ry,rx*2,ry*2);c.restore();});
          c.restore();
        }
        if(actor.edgePaths){c.save();c.translate(-actor.x,-actor.y);c.lineWidth=1.5;c.strokeStyle='#071329';for(const path of actor.edgePaths)c.stroke(new Path2D(path));c.restore();}
        if(actor.clear){
          const removal=surface(w,h),r=removal.getContext('2d');polygon(r,actor.clearShape);r.fill();
          const removalPixels=r.getImageData(0,0,w,h);
          const preserve=new Uint8Array(w*h);
          if(layout==='landscape')for(let i=0;i<preserve.length;i++){const red=pixels.data[i*4],green=pixels.data[i*4+1],blue=pixels.data[i*4+2];if(((i%w<1340&&Math.floor(i/w)>170)||Math.floor(i/w)>222)&&pixels.data[i*4+3]>128&&green>red*1.12&&green>blue*1.15)preserve[i]=1;}
          for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){const i=y*w+x;if(!removalPixels.data[i*4+3])continue;let keep=false;for(let dy=-3;dy<=3&&!keep;dy++)for(let dx=-3;dx<=3;dx++)if(preserve[i+dy*w+dx]){keep=true;break;}if(keep)removalPixels.data[i*4+3]=0;}
          r.putImageData(removalPixels,0,0);ctx.save();ctx.globalCompositeOperation='destination-out';ctx.drawImage(removal,0,0);ctx.restore();
        }
        else if(actor.eraseRect){repairContext.fillRect(...actor.eraseRect);}
        else{
          const pad=actor.erasePad||5;
          for(let dx=-pad;dx<=pad;dx+=2)for(let dy=-pad;dy<=pad;dy+=2)if(dx*dx+dy*dy<=pad*pad)repairContext.drawImage(actor.removalMask||mask,actor.x+dx,actor.y+dy);
          repairContext.drawImage(actor.removalMask||mask,actor.x,actor.y);
        }
      }
      // Never let repair dilation erase stationary blue rails or poles.
      const rp=repairContext.getImageData(0,0,w,h);
      for(const actor of specs.filter(a=>a.kind==='swing')){
        const ap=actor.image.getContext('2d').getImageData(0,0,actor.image.width,actor.image.height).data;
        for(let y=0;y<actor.image.height;y++)for(let x=0;x<actor.image.width;x++){
          const j=((y+actor.y)*w+x+actor.x)*4,k=(y*actor.image.width+x)*4;
          if(ap[k+3]<20&&pixels.data[j+2]>90&&pixels.data[j+2]-pixels.data[j]>50&&pixels.data[j+2]>pixels.data[j+1]*1.12)rp.data[j+3]=0;
        }
      }
      repairContext.putImageData(rp,0,0);mend(ctx,repair);
      const [px,py,pw,ph]=slidePlates[layout].rect,patch=surface(pw,ph),pc=patch.getContext('2d');
      pc.drawImage(slidePlate,0,0,pw,ph);ctx.drawImage(patch,px,py);
      return{clean,actors:specs};
    }
    function rotatePoint(p,pivot,angle){const c=Math.cos(angle),s=Math.sin(angle),x=p[0]-pivot[0],y=p[1]-pivot[1];return[pivot[0]+x*c-y*s,pivot[1]+x*s+y*c];}
    function drawActors(){
      const c=actorContext;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,actorCanvas.width,actorCanvas.height);
      c.scale(actorCanvas.width/current.width,actorCanvas.height/current.height);c.imageSmoothingEnabled=true;
      for(const actor of actors){
        let angle=0,scale=1,dx=0,dy=0;const strength=Math.min(state.motion,1.2);
        if(actor.kind==='swing')angle=.048*Math.sin(time*Math.PI*2/3.8)*strength;
        if(actor.kind==='tire')angle=.075*Math.sin(time*Math.PI*2/4.8+.4)*strength;
        if(actor.kind==='tire'&&state.layout==='landscape'){dx=5;dy=9;}
        if(actor.kind==='balloons')angle=.075*Math.sin(time*Math.PI*2/5.4+.7)*strength;
        if(actor.kind==='slider'){const glide=(.5-.5*Math.cos(time*Math.PI*2/6.4))*strength;dx=-24*glide;dy=43*glide;}
        if(actor.kind==='cat'&&state.layout==='landscape'){
          c.save();c.fillStyle='rgba(105,67,20,.18)';c.beginPath();
          c.ellipse(343,682,37,5,0,0,Math.PI*2);c.fill();c.restore();
        }
        if(actor.kind==='cat'){angle=.025*Math.sin(time*Math.PI*2/3.8)*strength;dy=-2*(.5+.5*Math.sin(time*Math.PI*2/3.8))*strength;}
        if(actor.kind==='butterfly')scale=1-(.60*strength)*(.5+.5*Math.sin(time*Math.PI*2/0.82+actor.phase));
        scale=Math.max(.30,scale);
        c.save();c.translate(actor.pivot[0]+dx,actor.pivot[1]+dy);c.rotate(angle);c.scale(scale,1);c.translate(-actor.pivot[0],-actor.pivot[1]);c.drawImage(actor.image,actor.x,actor.y);c.restore();
      }
    }
    function assertArtwork(pixels){
      let visible=0,total=0;
      for(let i=3;i<pixels.length;i+=64){total++;if(pixels[i]>24)visible++;}
      if(!total||visible/total<.1)throw Error('Artwork rendered empty or incomplete.');
    }
    function loadImage(url){return cache[url]||(cache[url]=new Promise((resolve,reject)=>{
      const img=new Image();img.crossOrigin='anonymous';
      img.onload=async()=>{try{await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw Error('Artwork is empty.');resolve(img);}catch(error){reject(error);}};
      img.onerror=()=>reject(Error('Artwork could not load: '+url));img.src=url;
    }));}
    function verifyFrame(){
      if(gl.isContextLost()||gl.getError()!==gl.NO_ERROR)throw Error('Artwork renderer unavailable.');
      const pixels=new Uint8Array(canvas.width*canvas.height*4);
      gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      if(gl.getError()!==gl.NO_ERROR)throw Error('Artwork frame could not be verified.');
      try{assertArtwork(pixels);}catch(error){throw Error(error.message+' Canvas '+canvas.width+'x'+canvas.height+', buffer '+gl.drawingBufferWidth+'x'+gl.drawingBufferHeight+'.');}
    }
    function resize(){if(!current)return;const ratio=Math.min(devicePixelRatio||1,2),width=Math.min(current.width,Math.round(art.clientWidth*ratio)),height=Math.round(width*current.height/current.width);if(canvas.width!==width||canvas.height!==height){canvas.width=actorCanvas.width=width;canvas.height=actorCanvas.height=height;gl.viewport(0,0,canvas.width,canvas.height);}}
    async function setLayout(layout){
      state.layout=layout;frame.dataset.layout=layout;frame.dataset.motion='loading';loaded=false;actors=[];frame.classList.remove('motion-ready');
      const own=++token,name=layout==='portrait'?'mobile':'desktop',url=base+'data-playground-'+name+'-source.webp';still.src=url;
      try{const img=await loadImage(url);if(own!==token)return;current=scene(layout);regions=current.regions;zones.fill(0);moves.fill(0);pivots.fill(0);regions.forEach((r,i)=>{zones.set([r.x,r.y,r.rx,r.ry],i*4);pivots.set([r.pivotX,r.pivotY,r.inner,r.stopY],i*4);});
        const balloonSource=layout==='portrait'?await loadImage(base+'data-playground-desktop-source.webp'):img;
        if(own!==token)return;
        const plate=await loadImage(slidePlates[layout].url);if(own!==token)return;
        const prepared=prepareActors(img,layout,balloonSource,plate);
        const cleanSlider=await loadImage(new URL('assets/landing/robot-slide-clean.png?v=1',document.baseURI).href);
        const slider=prepared.actors.find(a=>a.kind==='slider');
        // Opaque character sprite: never erase robot paint by its blue colour.
        const mobile=layout==='portrait';
        const sx=mobile?405:802,sy=mobile?665:293,sw=mobile?151:136,sh=mobile?135:122;
        slider.x=sx;slider.y=sy;slider.image=surface(sw,sh);
        slider.image.getContext('2d').drawImage(cleanSlider,14,195,1099,1107,0,0,sw,sh);
        if(layout==='landscape'){
          const sandbox=await loadImage(new URL('assets/landing/sandbox-background-desktop.png',document.baseURI).href);
          prepared.clean.getContext('2d').drawImage(sandbox,270,536,172,202,270,536,172,202);
          const mobileImage=await loadImage(base+'data-playground-mobile-source.webp');
          const mobilePlate=await loadImage(slidePlates.portrait.url);
          const mobileActors=prepareActors(mobileImage,'portrait',img,mobilePlate).actors;
          for(const kind of ['swing']){
            const source=mobileActors.find(a=>a.kind===kind),destination=prepared.actors.find(a=>a.kind===kind);
            const replacement=surface(destination.image.width,destination.image.height);
            replacement.getContext('2d').drawImage(source.image,0,0,replacement.width,replacement.height);
            destination.image=replacement;
          }
        }
        if(mobile){
          // Replace the old cat's entire repair area with sharp, aligned scenery.
          const sandbox=await loadImage(new URL('assets/landing/sandbox-background-mobile.png',document.baseURI).href);
          prepared.clean.getContext('2d').drawImage(sandbox,86,1040,174,196,86,1040,174,196);
        }
        // Share the clean character across layouts; keep its feet anchored on sand.
        const cleanCat=await loadImage(new URL('assets/landing/robot-cat-clean-v3.png',document.baseURI).href);
        const cat=prepared.actors.find(a=>a.kind==='cat');
        const cw=mobile?145:132,ch=mobile?166:151;
        cat.x=mobile?100:279;cat.y=mobile?1058:533;
        cat.pivot=mobile?[164,1222]:[343,682];cat.image=surface(cw,ch);
        cat.image.getContext('2d').drawImage(cleanCat,216,51,991,1136,0,0,cw,ch);
        if(own!==token)return;
        actors=prepared.actors;
        // Allocate after Canvas2D preparation and upload CPU pixels. Reusing a
        // canvas-backed texture can sample transparent on Linux WebKit.
        const pixels=prepared.clean.getContext('2d').getImageData(0,0,current.width,current.height);
        if(texture)gl.deleteTexture(texture);
        texture=gl.createTexture();
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
        bindArtworkTexture(untouched,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
        bindArtworkTexture(texture,0);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        gl.uniform2f(locations.size,current.width,current.height);gl.uniform4fv(locations['zones[0]'],zones);gl.uniform4fv(locations['pivots[0]'],pivots);gl.uniform4fv(locations['eyes[0]'],new Float32Array(current.eyes));gl.uniform1f(locations.portrait,layout==='portrait'?1:0);geometry(current.width,current.height);resize();loaded=true;draw();verifyFrame();frame.classList.add('motion-ready');frame.dataset.motion='ready';
      }catch(e){if(own!==token)return;fallback();console.warn('[Landing motion] Artwork animation unavailable; keeping the original image.',e);}
    }
    function draw(){if(!loaded)return;regions.forEach((r,i)=>{const wave=Math.sin(time*Math.PI*2/r.period+r.phase);moves.set([r.dx*wave,r.dy*Math.sin(time*Math.PI*2/r.period+r.phase+.4),r.angle*wave,0],i*4);});gl.uniform4fv(locations['moves[0]'],moves);gl.uniform1f(locations.time,time+1.8);gl.uniform1f(locations.amount,state.motion);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertexCount);drawActors();}
    function tick(now){if(!root.isConnected){cancelAnimationFrame(raf);return;}const delta=Math.min((now-last)/1000,.05);last=now;if(state.playing&&!document.hidden)time+=delta*state.speed;if(loaded){resize();draw();}raf=requestAnimationFrame(tick);}
    portraitQuery.addEventListener('change',()=>setLayout(portraitQuery.matches?'portrait':'landscape'));
    window.addEventListener('resize',resize,{passive:true});
    const observer=new ResizeObserver(resize);observer.observe(art);
    setLayout(state.layout);raf=requestAnimationFrame(tick);
  })();
