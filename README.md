# GANDOPS — Operational Readiness Lab

**Interactive, standalone, browser-based DevOps reliability simulator.**

GANDOPS is a distinct Royalpuskar portfolio project demonstrating explainable scenario evaluation for service reliability, latency, errors and dependencies. It does **not** connect to live infrastructure or execute commands.

## Live browser UI

The site includes a responsive dashboard, editable JSON scenario input, a preloaded sample, an incident simulation, per-service evidence, severity labels and downloadable JSON reports. All calculations happen locally in the browser without backend services, accounts or analytics.

To run locally:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Serve from localhost or HTTPS; opening an HTML file directly is not supported because the site uses ES modules and loads `sample.json`.

## Automated checks

Requires Node.js 22+:

```sh
node --test
node --check app.mjs
```

GitHub Actions runs these checks on push and pull request.

## Scoring model

Inputs per service: `id`, `name`, `availability` (0–100%), `error_rate` (0–100%), `p95_ms` (0–60,000) and an optional `dependencies` array.

- Base risk = rounded `(100 - availability) × 12 + error_rate × 10 + max(0, (p95_ms - 300) / 30)`, capped to 100.
- Add 15 points per directly dependent service whose base risk is 35 or higher, capped to 100.
- Risk 0–34: healthy, 35–69: watch, 70–100: critical.
- Readiness index = `100 - average risk`, rounded.

This is an **illustrative scoring method**, not an SRE standard, validated incident predictor, or guarantee of reliability. The engine rejects malformed data, unknown dependencies, repeated IDs, and dependency cycles. It does not mutate inputs.

## Files

- `index.html`, `style.css`, `app.mjs`: responsive website.
- `engine.mjs`: pure simulation engine.
- `sample.json`: synthetic input.
- `engine.test.mjs`: validation and deterministic-output tests.
- `.github/workflows/verify.yml`: CI.

## Security & privacy

No keys, passwords, real customer data, or production telemetry are required. Nothing is uploaded by the application. Only use authorized or synthetic telemetry when experimenting. GitHub Pages can host this app as static files if repository Pages settings are enabled.

**Author / Portfolio:** [Royalpuskar](https://github.com/Royalpuskar)
