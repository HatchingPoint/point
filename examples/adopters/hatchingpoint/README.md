# Hatching Point — Store Readiness (dogfood)

App Store listing readiness scoring used internally for Hatching Point app templates and client apps.

## Modules

`store-readiness.point` — pure Point logic:

- **Listing Signals** record — what a listing must have
- **listing score** rule — weighted readiness score
- **listing status** label — human-readable status
- **get listing status** route — HTTP stub for Hono integration

`readiness-widget.point` — same listing logic plus a **readiness widget** view that emits a React component (`readinessWidgetView`). Use for interactive docs and Next.js embeds; see [Applications — view](/point/language/applications) for the embed recipe.

## Commands

From the repo root (monorepo dev):

```bash
bun packages/point/src/cli.ts check examples/adopters/hatchingpoint/store-readiness.point
bun packages/point/src/cli.ts build-ts examples/adopters/hatchingpoint/store-readiness.point generated/store-readiness.ts
bun packages/point/src/cli.ts build-ts examples/adopters/hatchingpoint/readiness-widget.point generated/readiness-widget.ts
```

With global install:

```bash
point check examples/adopters/hatchingpoint/store-readiness.point
point build-ts examples/adopters/hatchingpoint/store-readiness.point generated/store-readiness.ts
```

## Integration

Import generated TypeScript into a Bun/Hono service. Map your app database fields into `Listing Signals`, call the lowered `listingScore` function, then `listingStatusLabel`.

## Agent workflow

```bash
point check-json examples/adopters/hatchingpoint/store-readiness.point
point index examples/adopters/hatchingpoint/store-readiness.point
point explain examples/adopters/hatchingpoint/store-readiness.point point://semantic/StoreReadiness/rule.listing score
```
