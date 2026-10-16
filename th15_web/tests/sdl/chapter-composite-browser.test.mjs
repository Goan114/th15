import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {launchBrowser} from '../../../th10_web/scripts/native/browser-launch.mjs';

for(const clipControl of [true,false])for(const scale of [1,2])test('original chapter animation cannot retain previous moving-object frames at '+scale+'x, clip-control='+clipControl, async () => {
 const root=new URL('../../',import.meta.url);
 const html='<canvas id="canvas" width="640" height="480"></canvas><script type="module">import factory from "/module.mjs";window.fixture=await factory({canvas:document.querySelector("canvas")});</script>';
 const paths=new Map([
  ['/module.mjs',new URL('artifacts/sdl-graphics/th15-graphics.mjs',root)],
  ['/th15-graphics.wasm',new URL('artifacts/sdl-graphics/th15-graphics.wasm',root)],
  ['/text.anm',new URL('reference/assets/text.anm',root)],
  ['/front.anm',new URL('reference/assets/front.anm',root)],
  ['/ascii.anm',new URL('reference/assets/ascii.anm',root)]
 ]);
 const server=createServer(async(req,res)=>{
  try {const path=new URL(req.url,'http://localhost').pathname;
   const data=path==='/'?html:paths.has(path)?await readFile(paths.get(path)):null;
   if(data===null){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':path.endsWith('.mjs')?'text/javascript':path.endsWith('.wasm')?'application/wasm':'text/html','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}).end(data);
  }catch(error){res.writeHead(500).end(String(error));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await launchBrowser();const results=[];
  for(const copy of [false,true]){const page=await browser.newPage();
  if(!clipControl)await page.addInitScript(()=>{
   const extension=WebGL2RenderingContext.prototype.getExtension;
   WebGL2RenderingContext.prototype.getExtension=function(name){return name==='EXT_clip_control'?null:extension.call(this,name);};
  });
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.fixture,{timeout:90000});
  const result=await page.evaluate(async ({scale,copy})=>{
   const c=window.fixture;
   c._sdl_test_capture_copies(copy?1:0);
   const string=p=>{let end=p;while(c.HEAPU8[end])end++;return new TextDecoder().decode(c.HEAPU8.subarray(p,end));};
   if(!c._graphics_initialize_scaled(scale))throw Error(string(c._graphics_error()));
   for(const [file,initialize] of [['text.anm',c._graphics_screen_initialize],['front.anm',c._graphics_chapter_initialize],['ascii.anm',c._graphics_chapter_ascii]]){
    const bytes=new Uint8Array(await(await fetch('/'+file)).arrayBuffer()),ptr=c._malloc(bytes.length);c.HEAPU8.set(bytes,ptr);
    const success=initialize(ptr,bytes.length);c._free(ptr);
    if(!success)throw Error(file+': '+string(c._graphics_screen_error()));
   }
   const samples=[],gl=document.querySelector('canvas').getContext('webgl2');
   if(!gl)throw Error('No WebGL2 context');
   const debug=gl.getExtension('WEBGL_debug_renderer_info');
   const renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
   for(let age=0;age<340;age++){
    if(!c._graphics_chapter_frame(age))throw Error(string(c._graphics_screen_error()));
    const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('WebGL error '+error+' during chapter frame '+age);
    if(age%20===19){const pixels=c._graphics_pixels();const row=[];
     for(let x=80;x<400;x++){const at=pixels+(364*640+x)*4;row.push(Array.from(c.HEAPU8.subarray(at,at+4)));}
     const bytes=c.HEAPU8.slice(pixels,pixels+640*480*4);
     const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
     samples.push({age,row,checksum});
    }
   }
   const copies=c.HEAPU32[(c._graphics_stats()>>>2)+17];
   c._graphics_screen_close();return {samples,renderer,copies};
  },{scale,copy});
  assert.deepEqual(errors,[]);
  console.log('Chapter composite GPU: '+result.renderer);
  if(copy)assert.ok(result.copies>=340,'the original chapter captures use framebuffer source-copy transfers');
  else assert.equal(result.copies,0,'raster baseline must not use the new copy path');
  for(const {age,row} of result.samples){
   const red=row.filter(([b,g,r])=>r>240&&g<10&&b<10).length;
   assert.equal(red,8,'only current marker remains during/after Chapter Finish at frame '+age);
  }
  results.push(result.samples.map(({age,checksum})=>({age,checksum})));await page.close();
  }
  assert.deepEqual(results[1],results[0],'exact copies preserve every captured RGBA pixel of the raster baseline');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
