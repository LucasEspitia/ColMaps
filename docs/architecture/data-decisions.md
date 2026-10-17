# Data decisions

## Decision: Fixed OpenStreetMap extract with checksum validation

- **Problem:** A moving latest extract would change the study input between runs.
- **Solution:** [download_osm.py](../../data-pipeline/scripts/download_osm.py) retrieves GeoFabrik's Colombia snapshot `colombia-260901.osm.pbf` and validates SHA-256 `94f936ae50a2050cdab53103d7ab63ed6bd4b3e9e9b67ebea0ebbe752f115c58`. It downloads to a temporary file, verifies before renaming, cleans failed partial downloads and rechecks existing files.
- **Rationale:** A fixed input and integrity check preserve the dataset used for the case study.
- **Trade-offs:** Reproduction depends on upstream snapshot availability or retaining the matching file. Conda specifications and container tags are not complete immutable environment locks. OSM data remains subject to ODbL, separately from the source-code license.

## Decision: Exploratory validation before deterministic preparation

- **Problem:** Whole OSM tag families are too broad for the tourism use case, and candidate mappings may be ambiguous or inaccessible to travelers.
- **Solution:** [Notebooks 01–04](../../data-pipeline/notebooks/) inspect raw tags, define categories, validate mappings as retain/refine/exclude, and prepare a reduced PBF while preserving referenced objects for structural integrity. [Validated scope](../../data-pipeline/filters/02_validated_feature_scope.csv) and [preparation rules](../../data-pipeline/filters/03_preparation_rules.json) record decisions. The automation executes notebooks 02–04 through Jupyter nbconvert in place.
- **Rationale:** Targeted semantic, descriptive, spatial, representational and classification checks reduce uncertainty before final preparation. Keeping referenced objects distinguishes physical PBF membership from semantic eligibility.
- **Trade-offs:** Rules are specific to the analyzed Colombian snapshot and tourism scope. Examples include secondary water/wetland classification and excluding `access=private/no` swimming pools or gardens while retaining missing access tags. These choices require reassessment for another dataset. The Lua import and current POI query do not independently enforce every semantic refinement; pipeline reproducibility does not establish universally valid filtering. See [method and procedures](../reproducibility/data-pipeline.md).

## Decision: Mixed geometry storage with original tags

- **Problem:** Preserve nodes, ways and relations for spatial querying without reducing imported objects to a single geometry class.
- **Solution:** [osm2pgsql Flex configuration](../../database/osm2pgsql/colmaps.lua) creates `osm_features` with OSM identity, name, JSONB tags and geometry. Nodes become points; closed ways attempt polygons then fall back to lines; multipolygon relations use multipolygons and other relations use geometry collections, skipping null relation geometries. The documented import produced a GiST index. The API assumes EPSG:3857 storage and transforms results to WGS84.
- **Rationale:** Flex makes schema and geometry conversion explicit while retaining original tags for later interpretation.
- **Trade-offs:** Closed ways are treated as polygons whenever conversion succeeds, without a separate semantic area test. Geometry collections and preserved dependency objects require care in downstream interpretation. The historical geometry counts and null checks are retained in [import verification](../reproducibility/data-pipeline.md#92-import-prepared-osm-data-into-postgis); they have not been rerun for this refactor.

## Decision: Separate preparation and import environments with reusable artifacts

- **Problem:** Native geospatial dependencies are not reliably installed with pip across development hosts; repeated processing is expensive.
- **Solution:** The pipeline uses a conda-forge Python/Jupyter/geospatial environment; database automation has a smaller Python/psycopg/python-dotenv environment plus osm2pgsql. Micromamba containers reuse those specifications. Compose shares the processed-data volume between preparation and import and persists raw, filtered, processed and database data.
- **Rationale:** Separate environments reduce dependency coupling; reusable volumes avoid embedding large generated datasets in images.
- **Trade-offs:** Filtering skips when its output file exists, without checking changed rules or output integrity. Import skips any non-empty existing table without revalidating null geometries or source identity. `--force` regenerates filtering or drops the two ColMaps import tables before importing; it is not an incremental update mechanism. Post-import validation requires a non-empty table and zero null geometries. [Procedures and limitations](../reproducibility/data-pipeline.md).
