# Phase 22 — Language breadth & dedomainization

**Status:** Wave 2 complete (P22-8 optional remains).  
**Prerequisite:** Phase 21 complete (platform shipped); Phase 13/19 open items may run in parallel.  
**Platform context:** [platform-vision-plan.md](./platform-vision-plan.md) — Surgent and App Store readiness are **benchmarks only**, not language targets.

**North star:** Point reads and teaches as a **general-purpose** language on first contact. The grammar already supports full-stack + agents; this phase fixes narrative overfitting, doc taxonomy, and known primitive gaps.

---

## Diagnosis (why this phase exists)

| Layer | Application-agnostic? | Notes |
|-------|----------------------|-------|
| Parser / grammar | ✅ Yes | 20+ block kinds; no vendor keywords |
| Stdlib | ✅ Yes | http, json, sql, ai, fs, … |
| Example corpus | ✅ Mostly | ecommerce, HTTP, SaaS, agents, apps, tools |
| Onboarding & language guide | ❌ Overfit | Readiness/deploy scoring is the default first file |
| Language nav | ⚠️ Thin | Half the blocks live on one `Applications` page |
| Published npm logic | ⚠️ Narrow | `@hatchingpoint/point-logic` is store-readiness only |
| Type surface | ⚠️ Small | No `Map`, no money/decimal, no nested generic utilities |

**Verdict:** The language is **not** syntactically bound to Surgent or marketing. It **is** narratively bound to Hatching Point dogfood (App Store listing readiness). Rules and labels look “marketing-specific” because scoring and classification are how we teach them — but the same blocks model fraud risk, SLA tiers, eligibility, pricing, and ops runbooks.

---

## Success criteria (Phase 22 exit gate)

- [x] **Neutral onboarding** — README, quick-start, proof-of-concept, and `rules.md` lead with non-readiness examples (cart, subscription tier, order status, or HTTP route)
- [x] **Language docs split** — `applications.md` decomposed into dedicated pages (UI, workflows, agents, realtime) linked from overview
- [x] **View syntax documented** — `form`, `tabs`, `modal`, `each`, `load data from action`, `Handler T` have reference sections matching parser capability (Wave 2 P22-3)
- [x] **Cross-domain example rotation** — `docs/site/examples.md` “Start here” lists ≥3 domains without readiness as the only hero
- [x] **Spec sync** — remove stale `serverQuery`/`serverMutation` from `language-spec.md`; refresh `semantic-language-design.md` through Phase 21 blocks (Wave 2 P22-6)
- [x] **Primitive audit shipped** — documented decision on `Map`, money/decimal, and error types (implement or explicit non-goal with workaround)
- [x] **Cross-domain conformance fixtures** — cart, route, workflow, rich-view under `tests/conformance/fixtures/`
- [ ] **Optional:** second published logic package or rename positioning so npm isn’t “readiness-only” (P22-8)
- [x] `point check-docs` and targeted CI pass

---

## Non-goals

- Surgent-specific syntax or blessed modules
- Replacing React as the primary UI emit target
- Native VM / owned ORM
- Rewriting the semantic block model into functions/classes

---

## Workstreams (parallel)

### P22-1 — Dedomainize onboarding
Replace readiness-first teaching chain with a **neutral default** (`cart-total.point` or `subscription-tier.point`) and move store-readiness to `examples/adopters/hatchingpoint/` only.

**Touch:** `README.md`, `docs/site/guide/quick-start.md`, `docs/site/concepts/proof-of-concept.md`, `docs/site/language/rules.md`, `docs/site/language/labels.md` (if needed).

### P22-2 — Split language docs taxonomy
Break `docs/site/language/applications.md` into:

- `ui.md` — `view`, `page`, `layout`, `navigation`, rich components
- `workflows.md` — `workflow`, `schedule`, `command`
- `agents.md` — `pipeline`, `session`, `prompt`, `guard`
- `realtime.md` — `stream route`, subscribe patterns

Update sidebar config and `overview.md` block map.

### P22-3 — View & controlled-input reference
Document grammar that already exists in the parser but is only shown via readiness widget examples.

**Touch:** new `ui.md` sections; trim readiness-specific prose from generic pages.

### P22-4 — Cross-domain examples index
Revise `docs/site/examples.md` and agent-repair fixtures so “Start here” rotates ecommerce + HTTP + pure logic; readiness stays under adopters.

### P22-5 — Language primitive audit
Inventory gaps for arbitrary apps:

| Primitive | Today | Phase 22 outcome |
|-----------|-------|------------------|
| `Map<K,V>` / dict | Missing | Spike + spec section or documented workaround via records |
| Money / decimal | Int only | `Decimal` type spike or `external` money lib pattern |
| Rich errors | Diagnostics only | `Result`-style or typed error records — decide |
| Date/time | `std.time` shim | Author-facing `Instant` / `Date` blocks? |

Deliver `docs/language-primitive-audit.md` with implement vs defer decisions.

### P22-6 — Spec & design doc sync
Fix stale EBNF; extend `semantic-language-design.md` to cover routes, workflows, agents, UI.

### P22-7 — Conformance fixtures per domain
One checked `.point` file per major block family from a **different domain** than readiness (cart rule, support prompt, health schedule, notes page).

---

## After Phase 22

- Resume Phase 13 (Python routes) and Phase 19 parity with neutral examples
- Phase 23 (future): implement deferred primitives from audit (`Map`, money, …)
- Long-term: UI target abstraction (optional second emit backend)

---

## Agent dispatch

See [codex-goal-phase22.md](./codex-goal-phase22.md).
