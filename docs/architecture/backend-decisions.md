# Backend decisions

## Decision: REST API with separate POI boundaries

- **Problem:** Retrieve spatial data independently of presentation while keeping request validation, response shaping and database access separable.
- **Solution:** [PoisModule](../../backend/src/pois/pois.module.ts) wires a controller, `ParseBboxPipe`, service and repository. `GET /pois?bbox=west,south,east,north` delegates the validated tuple to the service, then repository. [GET /health](../../backend/src/app.controller.ts) executes `SELECT PostGIS_Version() AS postgis_version` through MikroORM and returns status, database and PostGIS version. Nest listens on `0.0.0.0`, port `PORT` or `3000`.
- **Rationale:** The code establishes distinct HTTP, validation, transformation and persistence responsibilities, each independently tested. Further original motivation is not recorded.
- **Trade-offs:** There is no current frontend consumer, CORS configuration, authentication, pagination or routing endpoint. The health endpoint requires database availability rather than checking only process liveness. The scaffold `AppService.getHello()` remains, but there is no root Hello World controller route.

## Decision: Validate the bounding box before querying

- **Problem:** Spatial queries require a well-formed, ordered geographic extent.
- **Solution:** [ParseBboxPipe](../../backend/src/pois/pipes/parse-bbox-pipe.ts) requires four non-empty comma-separated finite numbers, trims whitespace, enforces longitude ±180 and latitude ±90, and requires west < east and south < north. Invalid input raises HTTP 400.
- **Rationale:** The validation prevents malformed, inverted and zero-area boxes reaching the repository.
- **Trade-offs:** Antimeridian-crossing boxes are rejected. There is no maximum geographic area limit; syntactically valid requests can span a large region.

## Decision: Parameterized PostGIS SQL through MikroORM

- **Problem:** Query imported geometries by extent and expose point representations of mixed geometry types.
- **Solution:** [PoisRepository](../../backend/src/pois/repositories/pois.repository.ts) uses `EntityManager.execute` with four bound values. SQL intersects non-null, non-empty source geometries with a WGS84 envelope transformed to EPSG:3857. It emits `ST_PointOnSurface(geom)` transformed to EPSG:4326 as GeoJSON with six decimal places, orders by OSM type/id and limits results to 200. [MikroORM configuration](../../backend/mikro-orm.config.ts) reads environment variables, declares entity discovery paths and allows no entities; the import owns the table schema.
- **Rationale:** Explicit SQL expresses PostGIS operations directly while retaining Nest dependency injection and a PostgreSQL connection. Binding coordinates avoids interpolating request values into SQL.
- **Trade-offs:** Queries depend on the imported schema and projection. An intersecting source feature's representative point need not lie inside the bbox. The 200-row limit has no truncation indicator or continuation token. SQL currently applies no additional semantic eligibility filter to imported features.

## Decision: GeoJSON response contract

- **Problem:** Give geographic results a stable representation independent of database rows.
- **Solution:** [PoisService](../../backend/src/pois/pois.service.ts) returns a typed `FeatureCollection`; each feature has a Point geometry, id `${osm_type}/${osm_id}`, and properties containing nullable name and original tags. SQL casts identifiers to text; an empty result is an empty collection.
- **Rationale:** GeoJSON is the selected geographic API contract; service transformation separates response structure from persistence.
- **Trade-offs:** Original lines and areas are represented as points, and all imported tags are exposed. TypeScript interfaces are compile-time contracts, not runtime response validation.

## Decision: Focused Vitest tests and metadata-aware HTTP tests

- **Problem:** The original CommonJS Jest/ts-jest setup encountered MikroORM 7 ESM compatibility issues; Nest HTTP tests also require decorator metadata.
- **Solution:** [Unit configuration](../../backend/vitest.config.mts) runs `src/**/*.spec.ts` in Node. [HTTP configuration](../../backend/vitest.e2e.config.mts) uses `unplugin-swc` and discovers `test/**/*.e2e-spec.ts`. Tests isolate controller delegation, bbox validation, GeoJSON mapping and repository SQL parameters. The health HTTP test uses Supertest and a mocked EntityManager. Vitest configuration files are excluded from the application build; coverage uses the V8 provider. Lint and lint:fix are separate scripts.
- **Rationale:** Vitest supplies the common frontend/backend runner and ESM-capable transformation; SWC preserves metadata needed by Nest injection.
- **Trade-offs:** SQL assertions do not execute PostGIS, and HTTP tests do not prove database integration or POI HTTP behavior. A legacy `jest` configuration block remains in package.json despite the migration; active scripts invoke Vitest. [Validation commands and CI](../reproducibility/application-setup.md#validation).
