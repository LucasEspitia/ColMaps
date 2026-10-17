# Data Decisions

## Decision: Fixed OpenStreetMap extract with checksum validation

- **Problem:** A moving `latest` extract would change the study input between runs.
- **Solution:** [`download_osm.py`](../../data-pipeline/scripts/download_osm.py) retrieves GeoFabrik's Colombia snapshot `colombia-260901.osm.pbf` and verifies SHA-256 `94f936ae50a2050cdab53103d7ab63ed6bd4b3e9e9b67ebea0ebbe752f115c58`. It downloads to a temporary file, validates it before renaming, removes failed partial downloads, and rechecks existing files.
- **Rationale:** A fixed, integrity-checked input makes the case-study dataset identifiable and repeatable.
- **Trade-offs:** Reproduction depends on access to the snapshot or a retained matching copy. Container tags and Conda specifications are not fully immutable environment locks. OSM data is subject to the ODbL, separately from the source-code license.

## Decision: Exploratory validation before deterministic preparation

- **Problem:** Broad OSM tag families include ambiguous or unsuitable entities for tourism-oriented route exploration.
- **Solution:** [Notebooks 01–04](../../data-pipeline/notebooks/) inspect tags, define the feature scope, validate mappings, and generate a reduced PBF. The automated filtering step runs notebooks 02–04. The [validated scope](../../data-pipeline/filters/02_validated_feature_scope.csv) and [preparation rules](../../data-pipeline/filters/03_preparation_rules.json) are the canonical classification inputs: **110 `RETAIN`, 4 `REFINE`, and 1 `EXCLUDE`** mappings.
- **Rationale:** Dataset-specific EDA makes inclusion and refinement rules explicit and auditable before import.
- **Trade-offs:** The rules are specific to this Colombia extract and tourism scope; they must be reassessed for different inputs. OSM filtering preserves referenced objects needed for structural integrity, so membership in the filtered PBF or `osm_features` does **not** necessarily mean semantic POI eligibility. The [database preparation stage](database-decisions.md#decision-precomputed-poi-read-model) applies the validated rules again when constructing `public.pois`.

## Decision: Separate preparation and import environments with reusable artifacts

- **Problem:** Native GIS dependencies vary between development hosts, and repeating extraction and filtering is expensive.
- **Solution:** `data-pipeline/` prepares the filtered PBF using its Micromamba/Jupyter environment; `database/` imports the prepared PBF and builds PostGIS tables in a separate environment. Docker Compose shares the processed-data volume, including the PBF and published rule files, and persists raw, filtered, processed, and PostgreSQL data.
- **Rationale:** Explicit artifacts and isolated environments keep responsibilities clear while allowing individual stages to be rerun.
- **Trade-offs:** The filtering stage skips work when its processed PBF exists; that check alone does not detect changes in rules or input content. Use `--force` to regenerate the PBF and republish rules when inputs change. Import can likewise skip an existing dataset, so a successful skipped run is **not** equivalent to a fresh end-to-end reproduction. See [reproducibility procedures](../reproducibility/data-pipeline.md).
