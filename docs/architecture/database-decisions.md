# Database Decisions

## Decision: Mixed geometry storage with original OSM tags

- **Problem:** Imported OSM entities can be points, lines, polygons, multipolygons, and relations. Reducing them immediately to markers would discard geometry and tag information potentially needed for detailed or geometry-sensitive queries.
- **Solution:** The [osm2pgsql Flex configuration](../../database/osm2pgsql/colmaps.lua) imports the filtered PBF into `public.osm_features`, storing `(osm_type, osm_id)`, name, JSONB tags, and mixed geometries in EPSG:3857. A GiST index supports spatial queries.
- **Rationale:** Preserve a useful spatial source representation independently of the application's optimized POI view.
- **Trade-offs:** Mixed geometries and preserved reference objects require downstream semantic filtering. The current Flex conversion attempts polygons for closed ways before falling back to lines; it is not a complete semantic area classifier. Retaining this intermediate table consumes storage and import time. See [import verification](../reproducibility/data-pipeline.md#92-import-prepared-osm-data-into-postgis).

## Decision: Precomputed POI read model

- **Status:** Adopted provisionally · **Date:** 2026-10-17
- **Problem:** Repeated viewport queries against `osm_features` must interpret OSM tags and compute marker positions from mixed geometries on demand.
- **Solution:** [`build_pois.py`](../../database/scripts/build_pois.py) generates `public.pois` from `public.osm_features` using the [validated mappings](../../data-pipeline/filters/02_validated_feature_scope.csv) and [refinement rules](../../data-pipeline/filters/03_preparation_rules.json). It applies `RETAIN`, `REFINE`, and `EXCLUDE` mapping decisions, resolves multiple categories per entity, and precomputes one `marker_geom` point (EPSG:3857) using PostGIS `ST_PointOnSurface()`. The resulting table stores identity, name, `primary_category`, `categories[]`, and `subcategory`, with GiST and GIN indexes. Category priority follows CSV order; `subcategory` belongs to the primary match.
- **Rationale:** Move semantic classification and geometry conversion from repeated API requests into a reproducible database preparation step. The recorded build produced **187,787 POIs across 12 categories**, with no duplicate OSM identities. Construction uses a staged, transactional refresh.
- **Evidence:** In the tested Medellín viewport query, median SQL execution decreased from **21.646 ms** (`osm_features`) to **4.785 ms** (`pois`), a **77.90% reduction**. The earlier three-subcategory experimental table achieved 1.816 ms. See the [benchmark and limitations](../reproducibility/benchmarks/poi-read-model.md).
- **Trade-offs:** `pois` stores representative **points rather than complete source geometries**, and does not duplicate all original tags. `osm_features` remains available for detail or geometry-sensitive operations. The intermediate import and refresh add time and storage. The benchmark covers one viewport; full A–C result equivalence and broader workloads remain to be verified. Direct PBF-to-POI import may be reassessed once application requirements are settled.

### Reproducible database sequence

1. Import the prepared PBF into `public.osm_features` using [`import_osm.py`](../../database/scripts/import_osm.py).
2. Apply [`001_create_pois.sql`](../../database/migrations/001_create_pois.sql).
3. Run `build_pois.py` to validate the rules and refresh `public.pois` transactionally.

The Docker `data-import` service executes these steps in order. Rebuilding `pois` does not require re-downloading or re-filtering OSM when `osm_features` is already available.
