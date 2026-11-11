// GANDOPS deterministic local reliability analysis: no network calls or hidden AI.
export function analyzeScenario(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Expected a scenario object");
  const services = input.services;
  if (!Array.isArray(services) || !services.length || services.length > 25) throw Error("Provide 1–25 services");
  const ids = new Set();
  for (const s of services) {
    if (!s || typeof s !== "object" || !/^[a-z][a-z0-9-]{0,23}$/.test(s.id || "") || ids.has(s.id)) throw Error("Each service needs a unique lowercase ID");
    ids.add(s.id);
    if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 60) throw Error("Service name is required (max 60 characters)");
    for (const [field, min, max] of [["availability",0,100],["error_rate",0,100],["p95_ms",0,60000]]) {
      if (!Number.isFinite(s[field]) || s[field] < min || s[field] > max) throw Error(s.id + ": " + field + " out of range");
    }
    if (s.dependencies !== undefined && (!Array.isArray(s.dependencies) || s.dependencies.length > 25 || s.dependencies.some(d => typeof d !== "string"))) throw Error(s.id + ": invalid dependencies");
  }
  for (const s of services) if ((s.dependencies || []).some(d => !ids.has(d) || d === s.id) || new Set(s.dependencies || []).size !== (s.dependencies || []).length) throw Error(s.id + ": unknown, repeated or self dependency");
  const byId = new Map(services.map(s => [s.id,s]));
  const visited = new Set(), visiting = new Set();
  function visit(id) {
    if (visiting.has(id)) throw Error("Dependency cycle detected");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of (byId.get(id).dependencies || [])) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const s of services) visit(s.id);
  const baseRisk = new Map(services.map(s => [s.id,Math.min(100,Math.round((100 - s.availability) * 12 + s.error_rate * 10 + Math.max(0,(s.p95_ms - 300) / 30)))]));
  const ranked = services.map(s => {
    const unhealthyDependencies = (s.dependencies || []).filter(d => baseRisk.get(d) >= 35);
    const risk = Math.min(100,baseRisk.get(s.id) + unhealthyDependencies.length * 15);
    const status = risk >= 70 ? "critical" : risk >= 35 ? "watch" : "healthy";
    const evidence = [];
    if (s.availability < 99.9) evidence.push("Availability below 99.9%");
    if (s.error_rate > 1) evidence.push("Elevated error rate");
    if (s.p95_ms > 300) evidence.push("P95 latency exceeds 300 ms");
    if (unhealthyDependencies.length) evidence.push("At-risk dependencies: " + unhealthyDependencies.join(", "));
    if (!evidence.length) evidence.push("No configured thresholds exceeded");
    return {id:s.id,name:s.name,status,risk,availability:s.availability,error_rate:s.error_rate,p95_ms:s.p95_ms,dependencies:s.dependencies || [],evidence};
  }).sort((a,b) => b.risk-a.risk || a.id.localeCompare(b.id));
  const readiness = Math.round(100 - ranked.reduce((sum,s)=>sum+s.risk,0)/ranked.length);
  return {readiness,services:ranked,summary:{healthy:ranked.filter(s=>s.status==="healthy").length,watch:ranked.filter(s=>s.status==="watch").length,critical:ranked.filter(s=>s.status==="critical").length},method:"Illustrative deterministic weights; not a production SLO or incident predictor"};
}
