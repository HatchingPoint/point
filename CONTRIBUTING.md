# Contributing to Point

Thank you for helping make Point better. **You do not need HatchingPoint org membership** to contribute — fork, branch, open a pull request.

## Quick start

**Requirements:** [Bun](https://bun.sh) (repo CI uses Bun).

```bash
git clone https://github.com/HatchingPoint/point.git
cd point
bun install
bun run ci
```

`bun run ci` is the full gate: format, check, docs, builds, Point tests, agent repair benchmarks, VS Code extension package.

## Ways to contribute

| Type | Where to start |
|------|----------------|
| **Bug** | [Open an issue](https://github.com/HatchingPoint/point/issues/new/choose) with repro steps |
| **Language / compiler** | Fix or test under `packages/point/src/` |
| **Agent repair fixture** | `tests/fixtures/agent-repair/` + `scripts/agent-repair-sufficiency.ts` |
| **Docs** | `docs/site/` (synced to [hatchingpoint.com/point](https://www.hatchingpoint.com/point)) |
| **Examples** | `examples/` and `packages/point/templates/` |

## Pull request flow

1. **Fork** [HatchingPoint/point](https://github.com/HatchingPoint/point) on GitHub.
2. **Branch** from `main` — e.g. `fix/datagrid-sort-hint` or `docs/sse-route-guide`.
3. **Change** the smallest surface that solves the problem. Match existing style; run `bun run ci` locally.
4. **Open a PR** against `main`. Describe *why* and how you verified (commands run).
5. **CI** must pass. Agent repair gate and benchmarks run on every PR.

We do not require signed commits. Keep PRs focused — one logical change per PR when possible.

## Project layout

```text
packages/point/     Compiler, CLI, LSP, std, templates
packages/point-vscode/   VS Code / Cursor extension
tests/              Bun tests + agent repair fixtures
docs/site/          Public documentation source
examples/           Runnable .point samples
scripts/            CI gates, publish, benchmarks
```

## Agent repair fixtures

When adding a diagnostic agents should fix in one shot:

1. Add `*-broken.point` and `*-fixed.point` under `tests/fixtures/agent-repair/`.
2. Register the case in `scripts/agent-repair-sufficiency.ts`.
3. Run `bun scripts/agent-repair-gate.ts` and `bun scripts/export-agent-repair-cases.ts`.
4. Bump `minSingleShotCases` in `scripts/agent-repair-gate.ts` if adding a single-shot case.

## Docs

Public docs live in `docs/site/`. After editing:

```bash
bun run check-docs
```

LandingPage sync (separate repo): `npm run sync:point-docs` in [HatchingPoint/LandingPage](https://github.com/HatchingPoint/LandingPage).

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful and constructive.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## Maintainers

Release publishing (npm, VS Code Marketplace) uses **org secrets** on tag push. See [docs/maintainer-release.md](docs/maintainer-release.md). Contributors never need `NPM_TOKEN` or org admin access.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
