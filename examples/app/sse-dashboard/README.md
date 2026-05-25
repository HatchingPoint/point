# SSE dashboard

Push live metrics with **`sse route`** + **`subscribe to sse`** — no `refresh every` polling.

```bash
point check examples/app/sse-dashboard/sse-dashboard.point
point build examples/app/sse-dashboard/sse-dashboard.point generated/sse-dashboard.js
bun generated/sse-dashboard.js  # runs serve command if wired via point launch
```

Open the app and watch the table fill from `EventSource` events at `/sse/metrics`.

Compare with **`examples/app/live-dashboard/`** (polling) and **`examples/app/log-viewer/`** (WebSocket).
