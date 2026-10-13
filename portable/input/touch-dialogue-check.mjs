import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {WASI} from 'node:wasi';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'th15_web/artifacts/touch-dialogue');
mkdirSync(out,{recursive:true});const temp=resolve(out,'temp');mkdirSync(temp,{recursive:true});
const sdk=process.env.TH15_EMSDK??resolve(root,'../../th08/tools/emsdk');
const emcc=['install','upstream'].map(p=>resolve(sdk,p,'emscripten/emcc.py')).find(existsSync);assert(emcc,'Set TH15_EMSDK');
const result=spawnSync('python',[emcc,'-O2','-std=c++17','-sDEFAULT_TO_CXX=1','--no-entry','-sSTANDALONE_WASM=1',resolve(import.meta.dirname,'touch-dialogue-check.cpp'),'-o',resolve(out,'verify.wasm')],{env:{...process.env,EM_CONFIG:resolve(sdk,'.emscripten'),TEMP:temp,TMP:temp},encoding:'utf8',windowsHide:true});
if(result.error||result.status)throw result.error??Error(result.stdout+result.stderr);
const wasi=new WASI({version:'preview1'}),{instance}=await WebAssembly.instantiate(readFileSync(resolve(out,'verify.wasm')),{wasi_snapshot_preview1:wasi.wasiImport});wasi.initialize(instance);assert.equal(instance.exports.verify(),0);
// Check the production single-player adapter provides the explicit dialogue
// context without discarding movement coordinates or the replay guard.
const source=readFileSync(resolve(root,'th15_web/cpp/sdl/BrowserRuntime.cpp'),'utf8');
assert(source.includes('value.context=stage.messages.active()?2:1;'));
assert(source.includes('app->progress.replay'));
console.log('PASS: single-player dialogue drag/tap/hold, fire/Bomb isolation, shield retention and death/pause lifecycle (not real-device acceptance)');
