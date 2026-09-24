import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createAI,ttsVoices} from '../profiler/server/ai.js';

test('voice menu updates when browser voices arrive and saves non-Korean selections',async()=>{
  const dom=new JSDOM(fs.readFileSync('profiler/dist/index.html','utf8'),{url:'http://localhost:3000',runScripts:'outside-only'}),w=dom.window;
  try{
    let voices=[],changed;
    w.speechSynthesis={getVoices:()=>voices,addEventListener:(event,cb)=>{changed=cb},cancel(){}};
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
    w.fetch=async url=>({ok:true,json:async()=>url==='/api/me'?{configured:{ai:true,chzzk:true},tts:{voices:ttsVoices,defaultVoice:'onyx'}}:url==='/api/catalog'?{cases:[]}:{rankings:[]}});
    w.eval(fs.readFileSync('profiler/dist/app.js','utf8'));
    await new Promise(r=>setTimeout(r,20));
    const d=w.document;
    d.querySelector('#sound-settings').click();
    voices=[{voiceURI:'en-test',name:'English',lang:'en-US'},{voiceURI:'ko-test',name:'한국어',lang:'ko-KR'}];changed();
    const select=d.querySelector('#voice-select');
    assert.equal(select.options.length,3);assert.equal(select.options[1].value,'ko-test');
    select.value='en-test';select.dispatchEvent(new w.Event('change'));
    changed();assert.equal(select.value,'en-test');
    assert.equal(JSON.parse(w.localStorage.getItem('profiler.audio')).voice,'en-test');
    assert.equal(d.querySelector('#openai-voice-select').options.length,14);
  }finally{w.close()}
});

test('TTS validates voices and caches each voice separately',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);calls.push(body);return new Response(body.voice)};
  try{
    const ai=createAI({apiKey:'test-only',ttsModel:'gpt-4o-mini-tts',ttsVoice:'onyx'});
    assert.equal((await ai.speech('맞습니다','onyx')).toString(),'onyx');
    assert.equal((await ai.speech('맞습니다','coral')).toString(),'coral');
    await ai.speech('맞습니다','onyx');assert.equal(calls.length,2);
    await assert.rejects(ai.speech('맞습니다','unknown'),/지원하지 않는/);
    assert.equal(calls.length,2);
  }finally{globalThis.fetch=original}
});
