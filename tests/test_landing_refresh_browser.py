"""Landing refresh and failed animation initialization regressions."""
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--engine', default='chromium')
parser.add_argument('--base-url', default='http://127.0.0.1:8001')
args = parser.parse_args()

with sync_playwright() as p:
    for width, height in [(1440, 900), (390, 844)]:
        # Fresh graphics process per viewport: closed WebKit pages can retain
        # decoded canvases until collection, contaminating the next case.
        browser = getattr(p, args.engine).launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        # A transient empty first GPU draw must recover before revealing motion.
        page.add_init_script("""const locations=new Map();window.landUniforms={};
            const location=WebGLRenderingContext.prototype.getUniformLocation;
            WebGLRenderingContext.prototype.getUniformLocation=function(program,name){const result=location.call(this,program,name);locations.set(result,name);return result;};
            const vectors=WebGLRenderingContext.prototype.uniform4fv;
            WebGLRenderingContext.prototype.uniform4fv=function(loc,values){window.landUniforms[locations.get(loc)]=Array.from(values);return vectors.call(this,loc,values);};
            const draw=WebGLRenderingContext.prototype.drawArrays;
            let first=true;
            WebGLRenderingContext.prototype.drawArrays=function(...args){
                if(first){first=false;return;}
                return draw.apply(this,args);
            };""")
        errors = []
        motion_messages = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        def record_motion(message):
            if '[Landing motion]' not in message.text:return
            motion_messages.append(message.text)
            for value in message.args:
                stack=value.evaluate('(value)=>value?.stack || null')
                if stack:motion_messages.append(stack)
        page.on('console', record_motion)
        for attempt in range(3):
            page.goto(args.base_url,wait_until='domcontentloaded') if attempt == 0 else page.reload(wait_until='domcontentloaded')
            # Inspect the on-screen scene, including the below-fold portrait layout.
            page.locator('[data-scene]').scroll_into_view_if_needed()
            try:
                page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'ready'",timeout=30000)
            except Exception:
                print(page.evaluate("""() => {
                    const c=document.querySelector('.scene-motion'),g=c.getContext('webgl');
                    const program=g.getParameter(g.CURRENT_PROGRAM);
                    const alpha=(w,h)=>{const p=new Uint8Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,p);let visible=0;for(let i=3;i<p.length;i+=4)if(p[i]>24)visible++;return {visible,total:w*h,error:g.getError()};};
                    const result={initial:alpha(c.width,c.height),uniforms:{}};
                    for(const name of ['size','amount','portrait','time'])result.uniforms[name]=g.getUniform(program,g.getUniformLocation(program,name));
                    const fb=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fb);
                    result.textures=[];
                    for(let unit=0;unit<2;unit++){
                        g.activeTexture(g.TEXTURE0+unit);
                        const tex=g.getParameter(g.TEXTURE_BINDING_2D);
                        g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);
                        result.textures.push({status:g.checkFramebufferStatus(g.FRAMEBUFFER),alpha:alpha(941,1672)});
                    }
                    g.bindFramebuffer(g.FRAMEBUFFER,null);g.deleteFramebuffer(fb);
                    g.uniform1f(g.getUniformLocation(program,'amount'),0);
                    g.drawArrays(g.TRIANGLES,0,Math.ceil(941/7)*Math.ceil(1672/7)*6);
                    result.still=alpha(c.width,c.height);
                    g.uniform1f(g.getUniformLocation(program,'amount'),1);
                    g.uniform1f(g.getUniformLocation(program,'portrait'),0);
                    g.drawArrays(g.TRIANGLES,0,Math.ceil(941/7)*Math.ceil(1672/7)*6);
                    result.landscapeShader=alpha(c.width,c.height);
                    g.uniform1f(g.getUniformLocation(program,'portrait'),1);
                    const shaders=g.getAttachedShaders(program);
                    const vert=shaders.find(s=>g.getShaderParameter(s,g.SHADER_TYPE)===g.VERTEX_SHADER);
                    const frag=shaders.find(s=>g.getShaderParameter(s,g.SHADER_TYPE)===g.FRAGMENT_SHADER);
                    const original=g.getShaderSource(frag);
                    result.variants={};
                    const variants={
                        original,
                        flat:'precision highp float; void main(){gl_FragColor=vec4(1.);}',
                        texture:'precision highp float; varying vec2 uv; uniform sampler2D picture; void main(){gl_FragColor=texture2D(picture,uv);}',
                        falls:original.replace("portrait>.5?0.:ellipse(px,vec4(1395.,680.,24.,62.))", "ellipse(px,vec4(1395.,680.,24.,62.))*(1.-step(.5,portrait))"),
                        noEyes:original.replace('if(i==1||i==3||(portrait>.5&&i==2))continue;', 'continue;'),
                        noRipple:original.replace('vec4 color=texture2D(picture,lookup);', 'vec4 color=texture2D(picture,uv);')
                    };
                    for(const [name,source] of Object.entries(variants)){
                        const f=g.createShader(g.FRAGMENT_SHADER);g.shaderSource(f,source);g.compileShader(f);
                        const test=g.createProgram();g.attachShader(test,vert);g.attachShader(test,f);g.linkProgram(test);g.useProgram(test);
                        for(let i=0;i<g.getProgramParameter(program,g.ACTIVE_UNIFORMS);i++){
                            const info=g.getActiveUniform(program,i),loc=g.getUniformLocation(test,info.name);
                            const value=g.getUniform(program,g.getUniformLocation(program,info.name));
                            if(info.size>1){
                                const values=window.landUniforms[info.name];
                                g.uniform4fv(loc,new Float32Array(values));
                            }else if(info.type===g.FLOAT)g.uniform1f(loc,value);
                            else if(info.type===g.FLOAT_VEC2)g.uniform2fv(loc,value);
                            else if(info.type===g.SAMPLER_2D)g.uniform1i(loc,value);
                        }
                        const a=g.getAttribLocation(test,'position');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);
                        g.clear(g.COLOR_BUFFER_BIT);g.drawArrays(g.TRIANGLES,0,Math.ceil(941/7)*Math.ceil(1672/7)*6);
                        result.variants[name]={linked:g.getProgramParameter(test,g.LINK_STATUS),alpha:alpha(c.width,c.height)};
                        g.deleteProgram(test);g.deleteShader(f);
                    }
                    return result;
                }"""),flush=True)
                print({'engine':args.engine,'viewport':[width,height],'attempt':attempt,'motion':page.locator('[data-scene]').get_attribute('data-motion'),'messages':motion_messages,'errors':errors},flush=True)
                raise
            assert page.locator('.scene-motion').is_visible()
        # GPU context loss must restore the full image without reloading.
        page.evaluate("""() => {
            const gl=document.querySelector('.scene-motion').getContext('webgl');
            gl.getExtension('WEBGL_lose_context').loseContext();
        }""")
        page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'fallback'")
        assert page.locator('.scene-art').is_visible()
        assert not errors, errors
        page.close()
        browser.close()

    for failure in ['blank-image', 'gpu-error', 'decode-error']:
        browser = getattr(p, args.engine).launch()
        page = browser.new_page()
        if failure == 'blank-image':
            page.add_init_script("""const draw=CanvasRenderingContext2D.prototype.drawImage;
                CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
                    if(image instanceof HTMLImageElement)return;
                    return draw.call(this,image,...args);
                };""")
        elif failure == 'gpu-error':
            page.add_init_script("WebGLRenderingContext.prototype.getError=function(){return this.INVALID_OPERATION;};")
        else:
            page.add_init_script("HTMLImageElement.prototype.decode=async function(){throw Error('decode failed');};")
        page.goto(args.base_url)
        page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'fallback'")
        assert page.locator('.scene-art').is_visible(), failure
        assert page.locator('.scene-actors').evaluate("(el)=>getComputedStyle(el).opacity") == '0'
        assert page.locator('.scene-motion').evaluate("(el)=>getComputedStyle(el).opacity") == '0'
        page.close()
        browser.close()
print(f'{args.engine}: refresh, portrait, context loss, and setup failure checks passed')
