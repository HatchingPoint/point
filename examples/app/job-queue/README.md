# Job queue

SQLite-backed job queue demo: **`jobs`** (`id`, `name`, `status`, `created_at`), routes **`POST /api/jobs`**, **`GET /api/jobs`**, **`GET /api/jobs/:id`**, admin UI (**enqueue** form + jobs table wired with **`load data from fetch`**), **`workflow init jobs db`**, **`workflow process next job`**.

## Routes API (plain `build`)

```bash
export DATABASE_URL='sqlite:./job-queue.db'
point check examples/app/job-queue/job-queue.point
point build examples/app/job-queue/job-queue.point ./job-queue-server.js
```

From Bun on the emitted module: **`await mod.initJobsDatabaseCommand()`**, then **`mod.startRoutesServer()`**. See **`tests/job-queue.test.ts`**.

Ports: **`process.env.PORT`** for **`serve job queue`** (default listener **3456**), or ephemeral port **0** for **`startRoutesServer()`**.

## Interactive UI (`build-ts`)

Plain **`point build`** emits **`startRoutesServer`** and route matchers; **`view`** and **`navigation`** React shells are produced with **`build-ts`** (same model as **`examples/app/dashboard/`**):

```bash
point build-ts examples/app/job-queue/job-queue.point ./job-queue-shell.ts
```

## CLI runner

**`command serve job queue`** runs **`Bun.serve`** and blocks (interactive dev router). **`command drain one job demo`** invokes **`await process next job`** once against **`DATABASE_URL`**.
