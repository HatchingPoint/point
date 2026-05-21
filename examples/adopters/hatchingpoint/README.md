# Hatching Point — Store Readiness (dogfood)

App Store listing readiness scoring used internally for Hatching Point app templates and client apps.

## Module

`store-readiness.point` — pure Point logic:

- **Listing Signals** record — what a listing must have
- **listing score** rule — weighted readiness score
- **listing status** label — human-readable status
- **get listing status** route — HTTP stub for Hono integration

## Commands

From the repo root (monorepo dev):

```bash
bun packages/point/src/cli.ts check examples/adopters/hatchingpoint/store-readiness.point
bun packages/point/src/cli.ts build-ts examples/adopters/hatchingpoint/store-readiness.point generated/store-readiness.ts
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
