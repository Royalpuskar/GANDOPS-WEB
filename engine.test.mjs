import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {analyzeScenario} from "./engine.mjs";
const sample=JSON.parse(await readFile(new URL("./sample.json",import.meta.url),"utf8"));
test("sample produces reproducible risk ordering",()=>{
  const before=JSON.stringify(sample),r=analyzeScenario(sample);
  assert.equal(r.services.length,3);
  assert.equal(r.services[0].id,"checkout");
  assert.equal(r.services[0].status,"critical");
  assert.equal(r.summary.healthy,2);
  assert.equal(r.summary.critical,1);
  assert.equal(JSON.stringify(sample),before);
  assert.equal(analyzeScenario(sample).readiness,r.readiness);
});
test("rejects malformed scenarios and dependency cycles",()=>{
  const invalid=[null,{}, {services:[]}, {services:[{id:"x"}]}, {services:[{id:"x",name:"X",availability:101,error_rate:1,p95_ms:0}]}, {services:[{id:"x",name:"X",availability:100,error_rate:0,p95_ms:1,dependencies:["x"]}]}];
  for(const v of invalid)assert.throws(()=>analyzeScenario(v));
  assert.throws(()=>analyzeScenario({services:[
    {id:"a",name:"A",availability:100,error_rate:0,p95_ms:0,dependencies:["b"]},
    {id:"b",name:"B",availability:100,error_rate:0,p95_ms:0,dependencies:["a"]}
  ]}),/cycle/);
});
