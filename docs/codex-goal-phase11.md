# Codex Goals — Phase 11 Wave 2

**Master plan:** [phase11-plan.md](./phase11-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install && bun run ci
```

Expected: 124+ tests pass.

---

## Goal P10-5 — point-logic publish pipeline

```text
/goal Execute docs/phase11-plan.md P10-5: Add @hatchingpoint/point-logic to automated publish on tag push (extend .github/workflows/publish.yml or scripts/publish-npm.ts). Bump packages/point-logic to 0.0.2. Add publish:logic script. Tests prove npm pack. Document in docs/publishing.md. Run bun run ci. Commit: "Phase 11 P10-5: point-logic CI publish."
```

---

## Goal P10-2 — richer view props

```text
/goal Execute docs/phase11-plan.md P10-2: Extend view/page emit for controlled inputs and callback props — e.g. onSignalsChange callback in readiness-widget.point with checkboxes emitting React controlled components. Minimal semantic syntax (bind input, on change call). Update examples/adopters/hatchingpoint/readiness-widget.point, tests, docs/site/language/applications.md. Run bun run ci. Commit: "Phase 11 P10-2: controlled view props and callbacks."
```

---

## Goal P11-1 — point add

```text
/goal Execute docs/phase11-plan.md P11-1: Implement `point add <name> <spec>` CLI that adds dependencies to point.json and updates point.lock. Support workspace:path and file:path specs (npm: reserved stub). Resolve deps for check/build. Tests + docs/site/reference/cli.md + docs/package-management.md. Run bun run ci. Commit: "Phase 11 P11-1: point add and lockfile resolution."
```

---

## Goal P11-2 — std json/http shims

```text
/goal Execute docs/phase11-plan.md P11-2: Implement runtime shims at packages/point/src/std/json.ts and http.ts. Export via packages/point/package.json exports field (@hatchingpoint/point/std/json, std/http). json: parse/stringify using JSON API. http: fetch wrappers. Verify std/json.point and std/http.point examples still check and emit. Tests for runtime imports. Run bun run ci. Commit: "Phase 11 P11-2: std json and http runtime shims."
```

---

## Hard rules

- Public `.point` stays semantic
- Run `bun run ci` before done
- Append checkpoint to docs/codex-progress.md
