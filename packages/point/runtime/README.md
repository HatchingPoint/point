# Point Runtime

**Owned execution boundary** for the [Point runtime pivot](../../docs/point-runtime-pivot.md). Hard pivot — no app-level externals, no permanent emit fallbacks for the home-base app.

All host code for `point run`, `point dev`, `point serve`, and `point test` lives here — **not** in author trees and **not** as `*-runtime.js` shims next to `.point` files.

R0: `runModule(filePath)` stub. R1+: run bridge, builtins, interpreter, server, SSR — **replacing** emit-to-Bun/React paths for `experiments/point-only/`.
