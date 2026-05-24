# Live dashboard (polling refresh)

Demonstrates **`refresh every N seconds`** (or **`minutes`**) alongside **`load data from action`**. The emitter wires a `setInterval` refetch and clears it on unmount.

Build TypeScript:

```bash
bun packages/point/src/cli.ts build-ts examples/app/live-dashboard/live-dashboard.point generated/live-dashboard.ts
```

Check:

```bash
bun packages/point/src/cli.ts check examples/app/live-dashboard/live-dashboard.point
```
