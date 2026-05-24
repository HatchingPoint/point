# Script runner (Phase 54)

Demonstrates **`terminal subscribe to stream`** on a WebSocket fed by **`processStreamLines`**.

When the route message record has **`stream`** and **`text`** fields (see `record Script Line` in [`script-runner.point`](./script-runner.point)), the server runtime emits one JSON payload per stdout line (`stream: stdout`), stderr lines (`stream: stderr`) after the process finishes, then an exit marker (`stream: exit`).

Serve with your usual Point app flow (compile + run the generated server’s `serve script runner` command). Open the demo page and watch the live terminal pane.
