# ColMaps — Architectural Decision 01: Precomputed POI Read Model

**Status:** Adopted provisionally · **Date:** 2026-10-17

## Decision

Use `public.pois` as the optimized read model for map and search queries, generated reproducibly from `public.osm_features` using the validated EDA rules. Retain `osm_features` as an intermediate source for now; reassess its necessity once detail and routing requirements are complete.

## Benchmark setup

- **Environment:** PostgreSQL 18 + PostGIS 3.6, local Docker setup.
- **Area:** Medellín viewport, longitude/latitude `(-75.70, 6.10, -75.40, 6.40)` (EPSG:4326; transformed to 3857 for spatial filtering).
- **Filter:** `amenity ∈ {restaurant, cafe, bar}`; spatial intersection with representative POI points.
- **Output:** POI identity, name, subcategory and GeoJSON marker; ordered by `(osm_type, osm_id)`; `LIMIT 200`.
- **Measurement:** `EXPLAIN (ANALYZE, BUFFERS)`, 10 runs per approach, first 2 discarded as warm-up; median of remaining 8 `Execution Time` values.

## Results

| Approach                                                                      | Dataset size | Median SQL execution | Change vs. original |
| ----------------------------------------------------------------------------- | -----------: | -------------------: | ------------------: |
| A — `public.osm_features` (on-request tag filtering and geometry computation) |      209,195 |        **21.646 ms** |            Baseline |
| B — `benchmark.pois_food_3` (experimental subset)                             |       21,421 |         **1.816 ms** |             −91.61% |
| C — `public.pois` (complete 12-category read model)                           |      187,787 |         **4.785 ms** |         **−77.90%** |

Approach C was approximately **4.52× faster** than A for this tested query. All C measured runs fell between **4.603 and 5.042 ms**. The initial C execution of **63.128 ms** was not representative of subsequent runs; timings improved after `ANALYZE public.pois` and repeated execution.

## Interpretation and limitations

Precomputing POI classifications and marker geometries reduced execution time for the tested viewport query, supporting the dedicated read-model decision. The gain combines fewer candidate rows, a spatial index on precomputed points, and avoidance of per-request tag/geometry processing; it cannot be attributed to any one factor.

- These are **database execution times**, not HTTP response or map-rendering times.
- The experiment covers **one viewport and three OSM subcategories**, not all ColMaps workloads.
- The experimental subset B was checked for **200 matching identifiers** against A. **Full A–C identifier/geometry equivalence has not yet been confirmed**; multicategory entities may affect `subcategory` comparisons.
- Storage and reconstruction costs of the complete `pois` table were not benchmarked here.
