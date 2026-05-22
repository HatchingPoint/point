# Codex Goals — Phase 24 (Path B native full stack)

**Master plan:** [phase24-plan.md](./phase24-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Wave 1 (launch in parallel)

### P24-1 — Combined dev server

```text
/goal Execute docs/phase24-plan.md P24-1: Extend point dev with app mode — auto-detect navigation + routes + web/vite.config, emit JS+TS on rebuild, run Bun API + Vite together. Add --api flag for API-only. Tests in tests/point-dev.test.ts. Commit: "Phase 24 P24-1: point dev app mode."
```

### P24-2 — point serve

```text
/goal Execute docs/phase24-plan.md P24-2: Add point serve command — static dist/ + API from generated JS, SPA fallback. serve-app.ts + CLI wiring + tests. Commit: "Phase 24 P24-2: point serve production."
```

### P24-3 — Full-stack template

```text
/goal Execute docs/phase24-plan.md P24-3: Upgrade full-stack-app template and examples/full-stack-template with /api routes, web/ Vite scaffold, package.json scripts. Sync README. point check src/app.point. Commit: "Phase 24 P24-3: native full-stack template."
```

### P24-4 — Docs

```text
/goal Execute docs/phase24-plan.md P24-4: Update docs/site/toolchain/deploy.md and quick-start with Path B dev/build/serve flow. point check-docs. Commit: "Phase 24 P24-4: Path B deploy docs."
```

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun test tests/point-dev.test.ts tests/point-serve.test.ts tests/point-build-app.test.ts
bun packages/point/src/cli.ts check examples/full-stack-template/src/app.point
bun packages/point/src/cli.ts check-docs
```

---

## Wave 2

### P24-5 — point build-app

```text
/goal Execute docs/phase24-plan.md P24-5: Add point build-app — emit JS+TS and run vite build to dist/. build-app.ts + CLI + tests. Commit: "Phase 24 P24-5: point build-app."
```

### P24-6 — Dev toolchain doc

```text
/goal Execute docs/phase24-plan.md P24-6: Add docs/site/toolchain/dev.md, update cli.md and deploy.md. point check-docs. Commit: "Phase 24 P24-6: dev and serve docs."
```

### P24-7 — Docker template

```text
/goal Execute docs/phase24-plan.md P24-7: Add Dockerfile to full-stack template. Commit: "Phase 24 P24-7: Path B Dockerfile."
```
