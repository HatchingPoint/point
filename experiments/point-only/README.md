# Point runtime pivot — home-base app

**Plan:** [docs/point-runtime-pivot.md](../../docs/point-runtime-pivot.md)  
**Goals:** [docs/codex-goal-point-only.md](../../docs/codex-goal-point-only.md)

This is the **home base** for rewriting Point from the inside out — **not** a soft launch with fallbacks.

**Hard rules:**

- Only `.point`, `point.json`, assets, README — no author TS/JS/React/Vite
- No author `external` to local `.js` — extend `packages/point/runtime/` instead
- Execution goes through runtime only (R1+); no permanent emit path

```bash
bun run point check experiments/point-only/src/app.point
```
