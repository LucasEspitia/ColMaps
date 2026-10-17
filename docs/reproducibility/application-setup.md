# Application setup and validation

[Workflow overview](README.md) · [Data pipeline](data-pipeline.md) · [Architecture](../architecture/README.md)

Commands in the current workflow are checked against repository configuration, not a fresh end-to-end execution. Historical setup commands are separated below to prevent scaffolding over an existing checkout.

## Environment and Compose execution

From the repository root, create local configuration:

```bash
cp .env.example .env
```

PowerShell equivalent: `Copy-Item .env.example .env`. Edit the copied file for your local environment; do not commit `.env`. The example declares `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=colmaps`, `DB_USER=colmaps`, `DB_PASSWORD=colmaps_pwd`, `COMPOSE_PARALLEL_LIMIT=1` and `COMPOSE_BAKE=false`. The earlier guide used `change_me` as an illustrative password; use consistent local credentials. Production secrets would need deployment-platform or secret-management configuration.

[Compose](../../docker-compose.yml) reads the root environment; [import automation](../../database/scripts/import_osm.py) explicitly loads the root `.env`. The backend reads process variables and dotenv's default working-directory path, so a root file is **not automatically loaded when starting inside backend/**; use the host command below or supply the variables explicitly.

With npm available:

```bash
npm run docker:up
```

This runs `docker:build` sequentially for data-pipeline, data-import, backend and frontend, then `up -d --no-build`. To build without starting, run `npm run docker:build`. Without host npm, run:

```bash
docker compose --parallel 1 build data-pipeline
docker compose --parallel 1 build data-import
docker compose --parallel 1 build backend
docker compose --parallel 1 build frontend
docker compose --parallel 1 up -d --no-build
```

Stop if any build fails. The `db` service uses the published `postgis/postgis:18-3.6` image and requires no local build. `COMPOSE_PARALLEL_LIMIT=1` reduces peak build resource usage; `COMPOSE_BAKE=false` selects the standard Compose build workflow. Explicit sequential builds avoid relying on shell builder defaults.

| Service | Behavior and readiness | Persistent data |
| --- | --- | --- |
| db | PostgreSQL 18 / PostGIS 3.6; `pg_isready` health check every 5 s, 5 s timeout, 5 retries | `colmaps_postgres_data` at `/var/lib/postgresql` (PostgreSQL 18 layout) |
| data-pipeline | Micromamba 2.0.8, existing Conda environment; download then filtering; one-shot exit 0 on success/skip | raw, filtered, processed named volumes |
| data-import | Micromamba environment plus apt-installed osm2pgsql; waits for healthy db and successful pipeline | shares processed volume at `/app/data-pipeline/processed` |
| backend | Node 24 Alpine, `npm ci`, Nest watch mode; waits for successful import; listens on `0.0.0.0:3000` | source bind mount and `backend_node_modules` |
| frontend | Node 24 Alpine, `npm ci`, Angular development SSR server on `0.0.0.0:4200`; waits for backend container start | source bind mount, `frontend_node_modules`, `frontend_angular_cache` |

Container database hostname is `db`; host tools use `localhost`. Defaults expose ports 5432, 3000 and 4200; `DB_PORT`, `BACKEND_PORT` and `FRONTEND_PORT` can change host mappings. **Current limitation:** data-import also receives `${DB_PORT}` as its internal connection port, although PostgreSQL still listens at 5432. Keep `DB_PORT=5432` for the documented full-stack workflow; changing it requires resolving that configuration mismatch. Backend's internal DB port is fixed at 5432.

Pipeline/database `.dockerignore` files exclude generated runtime data; frontend/backend exclusions avoid copying host dependencies, caches, artifacts and environment files. Named dependency volumes keep Linux packages separate from host installations; they also persist across rebuilds, so image rebuild alone may not refresh an existing dependency volume after manifest changes. Pipeline containers use unbuffered Python logs. The environment definitions are shared between host and container workflows, but are not fully locked; see [pipeline limitations](data-pipeline.md#execution-and-limitations).

Inspect execution:

```bash
docker compose ps -a
docker compose logs data-pipeline data-import backend frontend
```

The data services should complete with exit code 0, and db should be healthy. Large downloads and notebook runs can delay application startup. To run stages independently, the original procedures use `docker compose up --build data-pipeline`, `docker compose build backend` / `docker compose up backend`, and equivalent frontend commands. Compose still applies configured dependencies.

## Database and API checks

For host-mode processing or database inspection:

```bash
docker compose up -d db
docker compose ps
docker exec -it colmaps-db psql -U colmaps -d colmaps
```

Use your configured user/database if changed. Inside psql:

```sql
SELECT version();
SELECT PostGIS_Full_Version();
```

Both should return version information; exit with `\q`. Geometry distribution and import checks are in [data pipeline](data-pipeline.md#92-import-prepared-osm-data-into-postgis).

```bash
curl http://localhost:3000/health
curl 'http://localhost:3000/pois?bbox=-74.2,4.5,-73.9,4.8'
```

`/health` should return `status: ok`, `database: connected` and a `postgis` version string; the original example was `3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`. `/pois` should return a GeoJSON FeatureCollection with at most 200 points, possibly empty. A missing or invalid bbox should return HTTP 400. These are expected checks, not claimed results from this refactor. The default API base is `http://localhost:3000`. No root `Hello World!` endpoint is currently exposed.

## Host frontend and backend

Install locked dependencies from the root (root install configures Husky):

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
```

Prepare/import data using the [host pipeline procedures](data-pipeline.md) and ensure PostGIS is running. In a terminal from `backend/`, explicitly load the root environment before starting Nest:

```bash
node --env-file=../.env node_modules/@nestjs/cli/bin/nest.js start --watch
```

Alternatively, provide `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASSWORD` in the process environment, then run `npm run start:dev`. The [MikroORM configuration](../../backend/mikro-orm.config.ts) uses these variables, allows no entities during discovery, and connects through the PostgreSQL driver. No ORM migration command is needed for the current import-owned table.

In another terminal from `frontend/`:

```bash
npm start
```

Visit `http://localhost:4200`. The map route should initialize only in the browser and currently displays external demo tiles; it does not fetch the backend POIs. `npm run build` produces the frontend server build; `npm run serve:ssr:frontend` starts `dist/frontend/server/server.mjs`. This build/start path is configured but has not been validated as a production deployment.

## Browser and worker checks

With the frontend running, open:

```text
http://localhost:4200/maplibre/maplibre-gl-worker.mjs
http://localhost:4200/maplibre/maplibre-gl-shared.mjs
```

Both must serve JavaScript modules, not the Angular HTML fallback. Historical worker failures produced an empty geographic layer, background-only map, pending worker requests, failed shared-module requests or HTML in place of JavaScript/JSON. Check the browser Network panel and [Angular assets/prebundle configuration](../../frontend/angular.json). From `frontend/`, clear stale Angular cache if needed:

```bash
npx ng cache clean
```

Check Tab/Enter/Escape navigation, visible focus, drawer opening/closing, mobile-menu-to-accessibility focus restoration and scroll-to-top returning focus to the header link. Change preferences, reload and inspect SSR HTML for matching CSS variables/data attributes. Cookie defaults, malformed input and separate SSR requests have unit tests; real browser behavior still requires manual validation. The original Docker development check reported that theme flicker stopped after restart. Production SSR validation, effective panel focus trapping and final Windows Narrator checks remain outstanding.

## Image preparation

From `frontend/`, with originals in `assets-source/`:

```bash
node scripts/optimize-images.mjs
```

This writes WebP variants under `public/images/`. Settings and intended responsive behavior are documented in [frontend decisions](../architecture/frontend-decisions.md#decision-preprocessed-responsive-imagery). The script is a separate preprocessing step, not a container-startup transformation. Evaluate LCP, transferred image bytes, srcset selection, CLS and eager/lazy behavior using Lighthouse/browser tools before reporting performance improvements.

## Validation

From `frontend/`:

```bash
npm run lint
npm test -- --watch=false
npm run build
```

From `backend/`:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Backend also exposes `test:watch` (`vitest`), `test:cov` (`vitest run --coverage`, V8 provider), `test:debug` (`vitest --inspect-brk --no-file-parallelism`) and `lint:fix`. Both applications expose `lint:files` (`eslint`). Automated linting does not modify files. The original guide recorded successful tests/lint/build and an initial successful CI run; those results were not rerun or independently verified here. Active backend scripts use Vitest, but a stale Jest configuration remains in package.json.

[CI](../../.github/workflows/ci.yml) runs on pushes/PRs to main with read-only repository permissions, Ubuntu runners, Node from `.nvmrc`, `npm ci` and separate npm caches keyed by each application lockfile. Frontend runs lint → unit tests → build; backend runs lint → unit tests → HTTP tests → build in an independent job. Tests mock the database; CI starts no Docker/PostGIS services. Database integration, accessibility/performance automation and deployment remain planned.

[Pre-commit](../../.husky/pre-commit) uses `npx lint-staged` against staged frontend TS/HTML and backend TS via root package.json's application-specific `lint:files` commands. It deliberately omits tests/builds for fast feedback. [Pre-push](../../.husky/pre-push) runs frontend tests/build, backend unit/HTTP tests/build with `set -e`, stopping at the first failure. It does not repeat linting. CI remains authoritative because local hooks can be bypassed and depend on the local environment.

```text
stage → pre-commit: lint staged sources → commit
push → pre-push: frontend tests/build + backend unit/HTTP tests/build
     → GitHub Actions: independent frontend and backend lint/test/build jobs
```

## Development mounts, caching and historical WSL2 measurements

Both Node Dockerfiles copy dependency manifests before application source and use a BuildKit cache mount at `/root/.npm` for `npm ci`. Layer caching avoids repeated installation with unchanged manifests; the npm cache reduces repeated downloads when installation does rerun. Cache reuse requires the same builder and retained cache data; runtime named volumes are separate. To inspect reuse, run `docker compose --parallel 1 --progress plain build` twice without edits and inspect the second run for cached dependency steps. Avoid `--no-cache` or cache pruning for this comparison.

Source bind mounts allow watch recompilation without rebuilding images. Windows Docker Desktop initially synchronized files but did not reliably notify the backend watcher. [TypeScript watch options](../../backend/tsconfig.json) use fixed polling for files/directories, excluding node_modules and dist; Compose also sets `TSC_WATCHFILE=FixedPollingInterval`. Frontend initially used `--poll 1000`; its current Dockerfile omits polling following the recorded WSL2 migration. Current Angular serve configuration also has HMR disabled in the existing working tree; watch recompilation is distinct from HMR.

The original investigation moved the repository from a OneDrive-synchronized Windows NTFS directory to the WSL2 Linux filesystem, retaining Docker Desktop, Compose and persistent volumes:

| Recorded configuration | Angular compilation time |
| --- | ---: |
| Docker, Windows/OneDrive bind mount, initial startup | 62.496 s |
| Docker, Windows/OneDrive bind mount, subsequent startup | 27.995 s |
| Native Windows execution | 4.685 s |
| Docker, repository in WSL2 | 4.698 s |

The reported subsequent compilation reduction was approximately 83%; a template edit was manually observed to update in under one second. These historical observations lack a recorded hardware/build protocol and were not rerun. WSL2 is optional, not a reproduction requirement. After moving environments, install NVM if needed, select `.nvmrc` and reinstall environment-specific dependencies. The resulting frontend development command is `npm start -- --host 0.0.0.0`.

The original Docker Scout comparison selected Node Alpine after critical OS vulnerabilities were found in an initial Debian Bookworm image; remaining reported vulnerabilities were attributed to npm dependencies. This is a historical selection rationale, not a current vulnerability assessment. Both Dockerfiles use the moving `node:24-alpine` tag rather than the exact `.nvmrc` patch version.

## Stopping and resetting

```bash
docker compose down
```

This retains named volumes. The original reset command is:

```bash
docker compose down -v
docker compose up -d db
```

**`down -v` permanently removes all Compose named volumes**, including database, generated datasets, dependency volumes and Angular cache. Use it only for an intentional complete reset. It is broader than deleting just the database. Pipeline/import force options are documented separately and also replace their respective artifacts.

## Historical project creation record

These commands record initial development and dependency choices. **Do not run scaffold generators or replay dependency additions in an existing checkout; use npm ci above.** Lockfiles and current source supersede illustrative configuration from the old guide.

From a new frontend directory, the original Angular setup used:

```bash
npx @angular/cli@22 new frontend --directory=. --skip-git
npx ng add taiga-ui
npm install @taiga-ui/layout@5.20.0
npm install --save-dev less
npm install --save-dev @types/node@^24.10.11
npm install @ng-web-apis/universal
npm install maplibre-gl
npx ng generate component features/map
npx ng add angular-eslint@22
```

Selections were Tailwind CSS, SSR/SSG enabled, no AI configuration and no optional Taiga add-ons (charts/tables could be added later). LESS was needed for Taiga themes; Node 24 types supported the universal Web API package. MapLibre includes TypeScript types, so no additional @types package was installed. Angular's native Vitest builder required no custom frontend runner configuration.

The initial map demonstration used a full-viewport `#mapContainer`, an eager root import (`./features/map/map`) and `<app-map />` in the root template. These were integration checks, subsequently replaced by the current lazy route at `./features/map/map`. The old `./features/map/map/map` route example is stale. Both worker assets, global CSS and prebundle exclusion remain relevant. Initial bundle budget relaxation to 1.5 MB/2 MB was a development allowance rather than a performance target; the later historical 500 kB comparison does not describe the current configuration.

From a new backend directory, the original setup used:

```bash
npx @nestjs/cli new colmaps-backend --directory=. --skip-git --strict
npm install @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql @nestjs/config dotenv
```

The selected package manager was npm. `--directory=.` used the existing backend directory, `--skip-git` avoided a nested Git repository and `--strict` selected stricter TypeScript checks. Initial validation used the scaffold Hello World response, then a status-only health endpoint, then the current database-backed health query. ConfigModule and MikroOrmModule were registered in AppModule; discovery warnings for missing entities were disabled during initial setup. These stages are historical, not simultaneous API contracts.

The backend subsequently replaced Jest/ts-jest with Vitest after MikroORM 7 ESM compatibility problems, added SWC for Nest HTTP decorator metadata, excluded test configuration from application compilation and installed V8 coverage support. See [backend decisions](../architecture/backend-decisions.md) for current boundaries and limitations.
