import test from 'node:test';
import assert from 'node:assert/strict';
import {createAI,reportInstructions,verdictInstructions} from '../profiler/server/ai.js';
import {findCase} from '../profiler/server/cases.js';

test('question judging treats generated images as non-evidence and separates displayed from actual time',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'{"verdict":"맞습니다"}'}]}]})};
  try{
    const ai=createAI({apiKey:'test-only',model:'gpt-5.6-sol'}),result=await ai.ask(findCase('case-10'),[],'단체 사진에는 8시라고 표시되어 있나요?');
    assert.equal(result.verdict,'맞습니다');assert.equal(calls.length,1);assert.equal(calls[0].instructions,verdictInstructions);
    assert.match(calls[0].instructions,/AI 생성 현장 이미지/);assert.match(calls[0].instructions,/표시된 시각/);assert.match(calls[0].instructions,/실제 발생 시각/);
    const input=JSON.parse(calls[0].input);assert.equal(input.canonicalCase.id,'case-10');assert.equal(input.question,'단체 사진에는 8시라고 표시되어 있나요?');
    assert.match(reportInstructions,/현장 이미지는 채점 근거가 아니다/);assert.match(reportInstructions,/이전 답안의 정답 요소를 현재 답안 점수에 합치지 않는다/);
  }finally{globalThis.fetch=original}
});
