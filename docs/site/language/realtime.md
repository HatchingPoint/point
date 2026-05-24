---
title: Realtime
description: stream route blocks and view subscriptions for WebSockets.
quadrant: Reference
---

## Summary

Stream routes declare WebSocket servers with typed message handlers. Views subscribe with `subscribe to` for live updates.

## Polling dashboards

Simple live dashboards **without Convex or WebSockets** can use **`refresh every N seconds`** (or **`minutes`**) alongside **`load data from action`** (or fetch / `on mount call`). The compiler emits a `setInterval` refetch plus cleanup — see [UI — Data loading](/point/language/ui) and **`examples/app/live-dashboard/live-dashboard.point`**.

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

## View subscriptions

Views subscribe with `subscribe to <stream route>` or `subscribe to "/ws/path"`. See `examples/app/log-viewer/log-viewer.point` for `when connecting`, `each line in messages`, and handler wiring.

## See also

- [Routes](/point/language/routes)
- [UI](/point/language/ui)
- [Applications index](/point/language/applications)
