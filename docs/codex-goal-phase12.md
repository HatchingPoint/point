# Codex Goals — Phase 12 Wave 1

**Master plan:** [phase12-plan.md](./phase12-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

Launch **four parallel sessions** for maximum speed.

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install && bun run ci
```

Expected: 133+ tests pass.

---

## Goal P12-1 — `npm:` deps in `point add`

```text
/goal Execute docs/phase12-plan.md P12-1: Implement npm: dependency resolution in point add. When user runs point add logic npm:@hatchingpoint/point-logic, run npm install (or use existing node_modules), locate package point.json or src/*.point, pin path in point.lock under node_modules/. Support npm:@scope/pkg@version optional version. Wire modulePathFromLock for use logic.* imports. Tests with mock or real @hatchingpoint/point-logic in devDependencies. Update docs/package-management.md and docs/site/ecosystem/npm-packages.md. bun run ci. Commit: "Phase 12 P12-1: npm dependency resolution in point add."
```

---

## Goal P12-2 — std shims fs/env/time/text

```text
/goal Execute docs/phase12-plan.md P12-2: Add packages/point/src/std/fs.ts, env.ts, time.ts, text.ts mirroring json.ts/http.ts patterns. Export from package.json. Extend tests/std-runtime.test.ts. Verify std/*.point and examples/std-usage.point check and build. bun run ci. Commit: "Phase 12 P12-2: std fs env time text runtime shims."
```

---

## Goal P12-3 — Standalone runtime spike (honest scope)

```text
/goal Execute docs/phase12-plan.md P12-3: NOT a full VM today. Deliver a credible runtime bridge spike: (1) update docs/native-target-research.md with Phase 12 decision and timeline; (2) add point run --bundle or document point run as already-standalone for .point authors; (3) optional: examples/pure/math-only runner that executes emitted JS via Function() without writing temp file to project — prove pure logic runs without author seeing paths. Tests if implemented. No WASM required unless trivial. bun run ci. Commit: "Phase 12 P12-3: standalone runtime research and run bridge spike."
```

---

## Goal P12-4 — Phase 12 docs truth (parallel, docs only)

```text
/goal Update docs/phase12-plan.md checkboxes as goals land. Write docs/site/ecosystem/point-add.md explaining workspace, file, and npm specs. Run point check-docs. Commit only if other agents have not touched same files; otherwise append checkpoint only.
```

---

## Hard rules

- Public `.point` stays semantic
- Full standalone VM/GC is NOT this sprint — spike and docs only for P12-3
- Run bun run ci before done
- Append checkpoint to docs/codex-progress.md
