---
title: Realtime
description: stream route blocks, SSE routes, and view subscriptions for live updates.
quadrant: Reference
---

## Summary

**WebSocket** `stream route` blocks handle bidirectional channels. **`sse route`** pushes one-way server events. Views subscribe with `subscribe to stream`, `subscribe to sse`, or `subscribe to "/path"`.

## Polling dashboards

Simple live dashboards can use **`refresh every N seconds`** (or **`minutes`**) alongside **`load data from action`**. See [UI — Data loading](/point/language/ui) and **`examples/app/live-dashboard/live-dashboard.point`**.

## sse route (server push)

One-way **Server-Sent Events** — no polling, no WebSocket client:

```point
record Metric Pulse
  value: Text

sse route metric pulses
  path "/sse/metrics"
  event Metric Pulse
  on connect stream from action stream metric pulses
  on disconnect return none

view live feed
  subscribe to sse metric pulses
  when connecting render "Connecting..."
  each pulse in messages render pulse.value
```

See **`examples/app/sse-dashboard/sse-dashboard.point`**. Server emits `text/event-stream`; client uses `EventSource` with the same guard states as WebSocket subscribe.

## stream route

See `examples/api/stream-echo.point`:

```point
module StreamEcho

record Echo Message
  text: Text

stream route echo
  path "/ws"
  message Echo Message
  on connect return "ready"
  on message message return { text: message.text }
  on disconnect return none
```

See `examples/app/log-viewer/log-viewer.point` for streaming from an action on connect.

## Owned runtime (default apps)

When `point.json` sets `runtime: "owned"`, the runtime in `packages/point/runtime/` serves stream and SSE routes and renders live view shells without React emit:

| Author syntax | Runtime behavior |
|---------------|-------------------|
| `refresh every N seconds` | Live region polling on the current page |
| `subscribe to sse …` | `EventSource` client + SSE route handler |
| `subscribe to stream …` | WebSocket client + message list |
| `terminal subscribe to stream …` | WebSocket client + `.point-terminal` log lines |

Use `point dev` or `point serve` on a runtime-owned app — no Vite host required.

## View subscriptions

Views subscribe with `subscribe to <stream route>`, `subscribe to sse <name>`, or `subscribe to "/ws/path"`. See `examples/app/log-viewer/log-viewer.point` for `when connecting`, `each line in messages`, and handler wiring.

## See also

- [Routes](/point/language/routes)
- [UI](/point/language/ui)
- [Applications index](/point/language/applications)
