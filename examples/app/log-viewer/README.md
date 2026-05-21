# Log Viewer

General-purpose example for Phase 16 subprocess streaming: spawns a demo shell loop, pipes stdout lines through a `stream route`, and displays them in a view that `subscribe to stream` the WebSocket channel.

## Run the server

```bash
point check examples/app/log-viewer/log-viewer.point
point build examples/app/log-viewer/log-viewer.point generated/log-viewer.js
bun generated/log-viewer.js
```

Connect a WebSocket client to `ws://localhost:3456/ws/logs` to receive JSON frames `{ "line": "..." }`.

Build TypeScript for the React view + navigation shell:

```bash
point build-ts examples/app/log-viewer/log-viewer.point generated/log-viewer.ts
```

## Backpressure limits

The emitted runtime uses a **64 KiB** WebSocket send buffer threshold (`POINT_STREAM_BACKPRESSURE_LIMIT`). When `ws.bufferedAmount` exceeds this limit, new stdout lines are **skipped** until the client drains the buffer — the subprocess keeps running, but slow consumers may miss lines.

This is intentional for the dev/demo bridge: it avoids unbounded memory growth when a browser tab stalls. Production deployments should:

- Use an external log aggregator with its own retention/backpressure policy
- Prefer bounded ring buffers or explicit drop policies per subscriber
- Scale fan-out with a dedicated message bus rather than piping one process directly to many WebSocket clients

The demo process exits after 24 lines; disconnecting the WebSocket stops pumping but the generator cleanup kills the child when the async iterator is abandoned.
