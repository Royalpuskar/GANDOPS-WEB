import { analyzeScenario } from "./engine.mjs";

const el = id => document.getElementById(id);
let currentResult = null;
let baseline = null;

function setStatus(message, isError = false) {
  el("status").textContent = message;
  el("status").classList.toggle("error", isError);
}
function number(id, value) { el(id).textContent = String(value); }
function make(tag, text, className = "") {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render(report) {
  number("readiness", report.readiness + "/100");
  number("healthy", report.summary.healthy);
  number("watch", report.summary.watch);
  number("critical", report.summary.critical);
  el("readiness-note").textContent = "Illustrative weighted score";
  el("results").replaceChildren();
  for (const service of report.services) {
    const card = make("article", "", "service");
    const top = make("div", "", "service-top");
    const identity = make("div", "");
    identity.append(make("h3", service.name),make("div", service.id, "service-id"));
    const score = make("div", "", "score-block");
    score.append(make("div", String(service.risk), "risk"),make("span", service.status, "status-tag " + service.status));
    top.append(identity,score);
    const progress = make("div", "", "progress");
    const fill = make("span", "");
    fill.style.width = service.risk + "%";
    fill.className = service.status;
    fill.setAttribute("aria-label", "Risk score " + service.risk + " out of 100");
    progress.append(fill);
    const meta = make("p", "Availability " + service.availability + "% · Error rate " + service.error_rate + "% · P95 " + service.p95_ms + " ms");
    const reasons = make("ul", "", "evidence");
    for (const item of service.evidence) reasons.append(make("li", item));
    card.append(top,progress,meta,reasons);
    el("results").append(card);
  }
  el("export").disabled = false;
  setStatus("Analysis complete · " + report.services.length + " services evaluated locally");
}
function invalidate() {
  currentResult = null;
  el("export").disabled = true;
  el("results").replaceChildren();
  for (const id of ["readiness","healthy","watch","critical"]) number(id,"—");
  el("readiness-note").textContent = "Awaiting analysis";
  setStatus("Scenario changed. Run analysis to update priorities.");
}
function run() {
  try {
    currentResult = analyzeScenario(JSON.parse(el("scenario").value));
    render(currentResult);
  } catch (error) {
    invalidate();
    setStatus("Input error: " + error.message, true);
  }
}
async function initialize() {
  try {
    const res = await fetch("./sample.json");
    if (!res.ok) throw Error("Unable to fetch sample");
    baseline = await res.json();
    el("scenario").value = JSON.stringify(baseline,null,2);
    run();
  } catch {
    setStatus("Sample unavailable. Serve the project over localhost or HTTPS.",true);
  }
}
el("run").addEventListener("click",run);
el("scenario").addEventListener("input",invalidate);
el("sample").addEventListener("click",()=>{
  if (!baseline) return;
  el("scenario").value = JSON.stringify(baseline,null,2);
  run();
});
el("stress").addEventListener("click",()=>{
  if (!baseline) return;
  const scenario = structuredClone(baseline);
  for (const service of scenario.services) if (service.id==="identity") {
    service.availability = 94.2; service.error_rate = 7.6; service.p95_ms = 1500;
  }
  el("scenario").value = JSON.stringify(scenario,null,2);
  run();
});
el("export").addEventListener("click",()=>{
  if (!currentResult) return;
  const blob = new Blob([JSON.stringify(currentResult,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "gandops-readiness-report.json";
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
initialize();
