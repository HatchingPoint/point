# Hatching Point — Store Readiness (dogfood)

App Store listing readiness scoring used internally for Hatching Point app templates and client apps.

## Module

`store-readiness.point` — Point logic plus a runnable Bun HTTP service:

- **Listing Signals** record — what a listing must have
- **listing score** rule — weighted readiness score
- **listing status** label — human-readable status
- **get listing status** route — JSON readiness payload per app id
- **health check** route — service health JSON
- **serve store readiness** command — starts the Bun HTTP server

## Commands

From the repo root (monorepo dev):

```bash
bun packages/point/src/cli.ts check examples/adopters/hatchingpoint/store-readiness.point
bun packages/point/src/cli.ts build examples/adopters/hatchingpoint/store-readiness.point generated/store-readiness.js
PORT=3456 bun packages/point/src/cli.ts run examples/adopters/hatchingpoint/store-readiness.point
```

With global install:

```bash
point check examples/adopters/hatchingpoint/store-readiness.point
point build examples/adopters/hatchingpoint/store-readiness.point generated/store-readiness.js
PORT=3456 point run examples/adopters/hatchingpoint/store-readiness.point
```

Only `.point` source and generated JavaScript are part of this module — no hand-written TypeScript.

## HTTP API

After starting the service (default port `3456`, override with `PORT`):

```bash
curl -s http://localhost:3456/health
curl -s http://localhost:3456/apps/demo-app/listing-status
curl -s http://localhost:3456/apps/needs-work/listing-status
```

Example responses:

```json
{"status":"ok"}
```

```json
{"id":"demo-app","score":100,"status":"Ready to submit"}
```

```json
{"id":"needs-work","score":20,"status":"Needs work"}
```

Demo app ids are defined in Point source (`demo-app`, `needs-work`). Routes call **listing score** and **listing status** — not placeholder strings.

## Integration test

```bash
bun test tests/store-readiness-service.test.ts
```

## Agent workflow

```bash
point check-json examples/adopters/hatchingpoint/store-readiness.point
point index examples/adopters/hatchingpoint/store-readiness.point
point explain examples/adopters/hatchingpoint/store-readiness.point point://semantic/StoreReadiness/rule.listing score
```
