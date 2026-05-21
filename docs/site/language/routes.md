---
title: Routes
description: HTTP handlers with middleware chains, typed request inputs, and JSON responses.
quadrant: Reference
---

## Summary

`route` blocks declare HTTP handlers with explicit `method`, `path`, typed inputs, and typed outputs. Reusable `middleware` blocks run in route-level `before` order. Routes may take typed `query`, `body`, and `headers` record inputs in addition to path parameters. JSON handlers use `return json { ... }` with optional `status` and `headers` clauses.

The Bun target emits a composable fetch handler stack that parses request parts, runs middleware, and wraps JSON responses.

## Basic route

Path parameters use normal `input` bindings whose names match `:segment` names in `path`:

```point
module Routes

route get user
  method GET
  path "/users/:id"
  input id: Text
  output response: Text
  return id
```

See `examples/route.point`.

## Middleware

Define reusable middleware blocks that inspect request inputs and optionally short-circuit with a response. Return `none` to continue; any other value short-circuits with a 401 JSON response. Attach middleware with ordered `before` lines (first listed runs first):

```point
module Middleware Demo

record Auth Headers
  authorization: Text

record Item Response
  item: Text
  authenticated: Bool

middleware require auth
  input headers: Auth Headers
  output response: Maybe Text
  when headers.authorization != "Bearer demo-token" return "{\"error\":\"unauthorized\"}"
  otherwise return none

middleware audit request
  input headers: Auth Headers
  output response: Maybe Text
  otherwise return none

route get item
  method GET
  path "/items"
  before require auth
  before audit request
  input headers: Auth Headers
  output response: Item Response
  return json { item: "demo", authenticated: true }
```

## Typed HTTP inputs

Reserved input names `query`, `body`, and `headers` must reference **record types**. The runtime extracts matching fields from the URL search params, JSON body, or request headers:

```point
module Typed Routes

record Item Query
  limit: Text

record Create Item Body
  name: Text

record Item Response
  item: Text
  authenticated: Bool

route get item
  method GET
  path "/items"
  input query: Item Query
  output response: Item Response
  return json { item: query.limit, authenticated: true }

route create item
  method POST
  path "/items"
  input body: Create Item Body
  output response: Item Response
  return json status 201 { item: body.name, authenticated: true }
```

Path params remain separate from HTTP inputs — use `input id: Text` when `path` contains `:id`.

## JSON response helpers

Use `return json` inside route bodies instead of hand-building response strings:

```point
module Json Routes

record Payload
  ok: Bool

route health
  method GET
  path "/health"
  output response: Payload
  return json { ok: true }

route create
  method POST
  path "/items"
  output response: Payload
  return json status 201 { ok: true }

route missing
  method GET
  path "/missing"
  output response: Payload
  return json status 404 headers { "x-error": "missing" } { ok: false }
```

These lower to `pointJsonResponse` calls in the emitted fetch handler.

## Running route services

Pair routes with a `command` whose name starts with `serve`. Full example: `examples/api/middleware-demo.point`.

```bash
point build examples/api/middleware-demo.point generated/middleware-demo.js
bun generated/middleware-demo.js
```

## Common mistakes

- Using `query`, `body`, or `headers` with non-record types (checker reports `invalid-route-input`)
- Referencing middleware in `before` that is not defined in the module
- Expecting middleware to run after the route handler (middleware always runs first, in `before` order)

## See also

- [Applications](/point/language/applications) — overview of application blocks
- [Records](/point/language/records) — record types for typed HTTP inputs
