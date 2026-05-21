# @hatchingpoint/point-logic

Store listing readiness scoring logic for app publishers. **Source of truth is Point** (`src/*.point` only) — there is no hand-written TypeScript in `src/`. The published API is emitted JavaScript in `dist/`.

## Install

```bash
npm install @hatchingpoint/point-logic
# or
bun add @hatchingpoint/point-logic
```

Requires a runtime that supports ES modules (Node 18+, Bun, or bundlers that resolve `import`).

## Use

```javascript
import { listingScore, listingStatusLabel } from "@hatchingpoint/point-logic";

const signals = {
  hasScreenshots: true,
  hasDescription: true,
  hasPrivacyPolicy: true,
  hasSupportUrl: true,
  hasAgeRating: true,
};

const score = listingScore(signals); // 100
const status = listingStatusLabel(score); // "Ready to submit"
```

### Field names

Emitted JavaScript uses camelCase record fields (`hasScreenshots`, `hasDescription`, etc.) matching Point’s naming rules.

## Build from source (monorepo)

From the Point repo root:

```bash
bun run --cwd packages/point-logic check
bun run --cwd packages/point-logic build
```

`build` runs `point build` on `src/store-readiness.point` and writes `dist/store-readiness.js`. Run `prepublishOnly` automatically before `npm publish`.

## Package layout

| Path | Role |
|------|------|
| `src/store-readiness.point` | Authoritative semantic Point module |
| `point.json` | Point project manifest |
| `dist/store-readiness.js` | Generated JS (npm `files` — not edited by hand) |

Do not add `.ts` files under `src/`. Extend behavior by editing `.point` and rebuilding.
