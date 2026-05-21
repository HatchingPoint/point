---
title: Integrations
description: How Point fits with JavaScript, TypeScript, Python, React, Hono, Bun, Node, and editors.
quadrant: Explanation
---

## Summary

Point is designed to fit existing stacks through emitted target code and explicit interop boundaries.

## Runtime stacks

Bun and Node can run emitted JavaScript. TypeScript projects can import emitted `.ts` files. Pure logic modules can emit Python where the current backend supports them.

## Frameworks

Views target React-style components. Routes target handler-style server code. Surrounding framework setup can stay in Next.js, Hono, Vite, or another host while product logic moves into `.point` files.

## Interop boundaries

Use `external` declarations for npm packages, Node built-ins, or host APIs. Use `action` blocks when behavior touches effects such as files, network, environment, time, randomness, or **database** IO.

For relational data, declare a driver `external` or use `std.sql` — see [Database interop](/point/ecosystem/database-interop).

## See also

- [Effects](/point/language/effects)
- [Database interop](/point/ecosystem/database-interop)
- [Applications](/point/language/applications)
- [Build and emit](/point/toolchain/build-emit)
