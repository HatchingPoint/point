# External pilot checklist

Use this when a **team outside core Point** runs their first project. Goal: one week, one shipped feature, blockers recorded.

## Before they start

- [ ] npm has latest `@hatchingpoint/point` (`npm view @hatchingpoint/point version`)
- [ ] VS Code / Cursor extension installed (`hatchingpoint.point`)
- [ ] Bun installed (recommended host)
- [ ] Send them [Point in 60 seconds](https://hatchingpoint.com/point/guide/point-in-60-seconds) + [Golden app demo](https://hatchingpoint.com/point/guide/golden-app-demo)

## Day 1 — Scaffold

```bash
npm install -g @hatchingpoint/point
point create my-app --template saas-app
cd my-app
bun install
point demo src/app.point
bun run init:db
bun run dev
```

- [ ] UI loads at http://localhost:5173
- [ ] API health at http://localhost:3456/api/health
- [ ] `point launch src/app.point admin demo` prints success

## Day 2–3 — Customize

- [ ] Edit `src/app.point` — add one calculation, rule, or route
- [ ] `point check` passes after every change
- [ ] Agent loop tried: `point check-json` + `point repair` on an intentional typo

## Day 4–5 — Ship something

Pick one:

- [ ] Add a real DB query (replace `sample members()`)
- [ ] Add a protected API route with auth middleware
- [ ] Deploy to Render/Fly using bundled `render.yaml`

## Record back

Add to `docs/adoption-postmortem.md`:

1. Team name + module path (`examples/adopters/<team>/`)
2. What worked (table)
3. What blocked (table with severity)
4. Agent prompts that worked
5. CLI commands they used most

## Escalation

| Blocker | First response |
|---------|----------------|
| Check fails on valid-looking code | `point repair-plan` output + file ref |
| Template won't run | `bash scripts/onboarding-smoke.sh` locally; compare versions |
| Deploy fails | [Deploy guide](https://hatchingpoint.com/point/toolchain/deploy) + env vars (`JWT_SECRET`, `DATABASE_URL`) |
| Missing capability | `point capabilities` — use `external` or file an issue |

## Success criteria

Pilot succeeds when the team can answer **yes** to all three:

1. We shipped a user-visible change authored in `.point`
2. We did not hand-edit `generated/` for normal work
3. We would scaffold the next feature the same way
