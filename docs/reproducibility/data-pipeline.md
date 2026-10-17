# Data preparation and PostGIS import

[Workflow overview](README.md) · [Application setup](application-setup.md) · [Data decisions](../architecture/data-decisions.md)

This document preserves the original local exploration and import record, including Windows-specific procedures. Original section numbers 7–9 are retained for continuity. Commands below use the stated working directories; Windows path and PowerShell syntax are not Bash commands. Recorded versions/counts are historical observations, not results rerun during this documentation refactor.

## Execution and limitations

For container execution, follow [application setup](application-setup.md); it supplies the Python and geospatial tools. For host execution, create the environments below, run download and filtering from `data-pipeline/`, start PostGIS, activate the database environment and run import from the repository root.

- The download script uses [this fixed GeoFabrik URL](https://download.geofabrik.de/south-america/colombia-260901.osm.pbf); its availability has not been tested here.
- `filter_osm.py` executes notebooks 02–04 **in place**, modifying notebook outputs. Notebook 01 is exploratory and is not run by the automation. An existing processed PBF causes filtering to skip; its presence does not prove that it matches current rules. `python scripts/filter_osm.py --force` reruns preparation.
- Import validates input-file existence before considering a skip. Its skip condition is a non-empty `osm_features` table; the original phrase “valid imported dataset” below does not imply checksum, semantic or null-geometry revalidation on that path. Null checks run after a new import. `--force` drops `osm_features` and `osm2pgsql_properties`; unrelated schemas/extensions are retained.
- The pipeline environment file is currently UTF-16 encoded. Whether the Conda/Micromamba versions used can consume it has not been verified. The specification lists Jupyter but not nbconvert explicitly; notebook execution requires the `jupyter nbconvert` command to be available. Dependencies are not fully version-locked.
- Refinement rules remain dataset-dependent. For example, water/wetland secondary values and swimming-pool/garden access restrictions reflect the analyzed snapshot; missing tags being retained is a methodological choice, not proof of public access. Referenced objects retained for geometry reconstruction are not necessarily eligible POIs. The importer and API do not independently apply every refinement rule.

## 7. Data Pipeline Environment

The geospatial data preprocessing and analysis tools are maintained in a
separate Python environment. Miniforge is used to manage the environment and
its native geospatial dependencies through the `conda-forge` channel.

This approach was selected because some of the libraries used for processing OpenStreetMap data include native dependencies that are not reliably installable through `pip` on all development environments.

### 7.1 Install Miniforge

On Windows, Miniforge can be installed using Chocolatey:

```powershell
choco install miniforge3 -y
```

If you do not have the Choco installer installed, you can install it by downloading the official `.exe` file from the Miniforge [website](https://conda-forge.org/download/).

If Conda is not immediately available in PowerShell after the installation,
initialize it explicitly:

```powershell
& "C:\tools\miniforge3\Scripts\conda.exe" init powershell
```

Restart PowerShell and verify the installation:

```powershell
conda --version
```

### 7.2 Create the Data Pipeline Environment from scratch

Prefer the committed specification in section 7.3; the commands here preserve the original environment-creation record.

From the `data-pipeline` directory, create the Python environment:

```powershell
conda create -n colmaps-pipeline python=3.14 -y
conda activate colmaps-pipeline
```

Install the geospatial and data analysis dependencies:

```powershell
conda install -c conda-forge osmium-tool pyrosm pandas jupyter nbconvert -y
```

The environment provides:

- **Osmium Tool** for efficient inspection and preprocessing of raw OpenStreetMap .osm.pbf datasets. It is used for operations that can be performed directly on the native OSM representation before constructing geospatial objects.
- **Pyrosm** for reading filtered OpenStreetMap .osm.pbf datasets and converting OSM entities into structured geospatial data. The original guide attributed out-of-core processing to Pyrosm; this capability has not been established by the repository audit. The implemented workflow reduces the input with Osmium before subsequent geospatial analysis.
- **Pandas** for tabular analysis, statistics, and inspection of extracted OpenStreetMap attributes.
- **Jupyter** for interactive exploration and validation of the intermediate datasets produced by the pipeline.

### 7.3 Reproduce the Environment

The Conda environment definition is stored in:

```text
data-pipeline/environment.yml
```

The environment can be recreated with:

```bash
conda env create -f environment.yml
conda activate colmaps-pipeline
```

Once installed, check Pyrosm and Python with:

```bash
python -c "import pyrosm; print(pyrosm.__version__)"
python --version
```

The original record reported Python 3.14.x and Pyrosm 0.13.1 (not fully pinned by the environment file). The commands above print Pyrosm first, then Python:

```bash
0.13.1
Python 3.14.x
```

### 7.4 Jupyter runtime configuration on Windows

Jupyter is installed as part of the `colmaps-pipeline` Conda environment and is used for the exploratory and validation stages of the data pipeline.

On Windows, Jupyter may fail to start if it cannot create or access its runtime files in the default directory:

```text
C:\Users\<user>\AppData\Roaming\jupyter\runtime\
```

During the initial ColMaps setup, this resulted in a PermissionError when Jupyter attempted to create its server runtime files.

To persist the configuration for subsequent terminal sessions:

```powershell
[Environment]::SetEnvironmentVariable(
    "JUPYTER_RUNTIME_DIR",
    "$HOME\.jupyter-runtime",
    "User"
)
```

Then Jupyter can be started normally:

```powershell
jupyter notebook
```

**This workaround is only necessary when the default Jupyter runtime directory produces permission errors.**

## 8. Data Analysis & Preparation

The exploratory analysis of the OpenStreetMap dataset is performed through Jupyter notebooks stored in:

```text
data-pipeline/notebooks/
```

The notebooks document the exploratory and validation stages used to understand the source data and derive the preprocessing rules applied by the ColMaps data pipeline.

### 8.1 Raw OSM Dataset Inspection

Answers `What's in our data?`

Before defining any filtering rules, the original Colombia GeoFabrik `.osm.pbf` dataset was inspected to determine its structure, scale, and actual OSM tagging characteristics.

The complete exploratory procedure, including the dataset metadata, discovered tag keys, value distributions, and observations, is documented in:

[01 - Raw OSM Dataset Inspection](../../data-pipeline/notebooks/01_inspect_osm.ipynb)

The analysis showed that complete OSM tag families are generally too broad to serve directly as tourism filtering rules. Therefore, subsequent preprocessing stages define the required ColMaps feature categories and map them to explicit OSM `key=value` combinations.

Open the notebook in Jupyter to inspect its narrative, code and outputs.

### 8.2 Dataset Feature Scope Definition

Answers `What does ColMaps actually need?`

After inspecting the structure and tag distribution of the raw OSM dataset, the next stage defines the geographic feature scope required by ColMaps.

Rather than using complete OSM tag families, ColMaps defines application-level categories representing places and services potentially relevant to travelers. These categories are mapped to explicit OSM key=value combinations observed during the raw dataset inspection.

This stage establishes a candidate semantic scope and exports the resulting mapping specification for subsequent validation. The candidate mappings are also used to generate a reduced intermediate OSM extract containing the selected feature population and the referenced OSM elements required to preserve its structure.

The intermediate extraction is performed to reduce the computational cost of subsequent analysis. It does not represent the final ColMaps dataset: individual mappings have not yet undergone targeted validation and may still be retained, refined, or excluded before the final filtering rules are established.

The complete feature-category definition, OSM mapping decisions, consistency checks, intermediate extraction procedure, and methodological rationale are documented in:

[02 - ColMaps Feature Scope Definition](../../data-pipeline/notebooks/02_define_feature_scope.ipynb)

The resulting candidate scope and reduced OSM extract are subsequently used as inputs for targeted data validation, where potentially ambiguous, inconsistent, or overly broad feature classifications are investigated before the final dataset-preparation rules are established.

### 8.3 Dataset Feature Scope Validation

Answers `Is the candidate ColMaps feature scope suitable for the final dataset?`

The candidate feature scope is validated using the reduced OSM extract generated during the previous stage. Rather than manually reviewing every mapping, targeted validation focuses on classifications presenting semantic, descriptive, spatial, representational, or classification-related uncertainty.

The validation determines whether candidate mappings should be **retained**, **refined**, or **excluded**. The resulting decisions and refinement requirements are consolidated into a validated feature-scope specification that can be consumed by the final dataset-preparation pipeline.

The complete profiling process, targeted validation cases, refinement decisions, and methodological rationale are documented in:

[03 - ColMaps Feature Scope Validation](../../data-pipeline/notebooks/03_validate_feature_scope.ipynb)

The validated specification is exported as `filters/02_validated_feature_scope.csv` and serves as the semantic input for the subsequent deterministic preparation of the final OSM dataset.

### 8.4 OSM Dataset Preparation

Answers `How is the validated ColMaps feature scope transformed into a reproducible OSM dataset for subsequent database import?`

The validated feature scope is applied to the original Colombia OSM extract to produce a reduced dataset containing the primary mappings required by ColMaps. Mappings marked as `EXCLUDE` are removed from the active feature scope, while mappings marked as `REFINE` are associated with explicit preparation rules for secondary classification, access restrictions, and semantic reclassification.

The preparation preserves referenced OSM elements required for structural integrity and geometry reconstruction. Therefore, physical presence in the resulting PBF is distinguished from semantic eligibility as a ColMaps feature.

The complete preparation process, refinement rules, validation checks, and resulting dataset statistics are documented in:

[04 - ColMaps OSM Dataset Preparation](../../data-pipeline/notebooks/04_prepare_osm_dataset.ipynb)

The stage produces `processed/colombia-colmaps.osm.pbf` together with `filters/03_preparation_rules.json`, providing the reproducible inputs required for the subsequent PostGIS import stage.

### 8.5 Automated Dataset Preparation

The dataset acquisition and filtering process was automated after validating the required OpenStreetMap features during the exploratory analysis.

To ensure reproducibility, the pipeline does **not** download the latest GeoFabrik extract. Instead, it retrieves the exact dataset version used by ColMaps:

```text
colombia-260901.osm.pbf
```

The downloaded file is verified using its expected SHA-256 checksum:

```text
94f936ae50a2050cdab53103d7ab63ed6bd4b3e9e9b67ebea0ebbe752f115c58
```

The preparation workflow is:

```text
Fixed GeoFabrik snapshot
        │
        ▼
Download and verify dataset
        │
        ▼
Apply validated filtering rules
        │
        ▼
Generate filtered .osm.pbf
```

The scripts can be executed directly from the `data-pipeline` directory:

```bash
python scripts/download_osm.py
python scripts/filter_osm.py
```

The exploratory notebooks document how the filtering rules were selected, while the scripts reproduce those validated decisions automatically.

> [!IMPORTANT]
> **Dataset-dependent validation**
>
> The filtering rules were defined for the Colombian OpenStreetMap dataset and the ColMaps tourism use case. The pipeline structure is reproducible, but applying it to another region or substantially different dataset may require a new exploratory analysis and adjustment of the filtering rules.

## 9. Database Import

After completing the dataset preparation stage, the generated colombia-colmaps.osm.pbf file is imported into PostgreSQL/PostGIS using osm2pgsql.

This stage converts the prepared OpenStreetMap data into spatial database structures that can be queried by the ColMaps backend.

```text
colombia-colmaps.osm.pbf
        │
        ▼
    osm2pgsql
        │
        ▼
PostgreSQL + PostGIS
```

### 9.1 Install osm2pgsql

osm2pgsql is used to import the prepared OpenStreetMap dataset into PostgreSQL/PostGIS.

For the local development environment, version 2.3.1 was installed using the official Windows binary distribution.

The Windows package can be obtained from the official osm2pgsql download page:

```url
https://osm2pgsql.org/download/windows/
```

After downloading the x64 archive, extract it to a local tools directory, for example:

```powershell
C:\Tools\osm2pgsql
```

The directory containing osm2pgsql.exe must then be added to the Windows `PATH` environment variable so that the executable can be called directly from PowerShell or other terminals.

After updating the environment variable, open a new terminal and verify the installation:

```powershell
osm2pgsql --version
```

The expected output should report the installed osm2pgsql version, for example:

```powershell
osm2pgsql version 2.3.1
```

This confirms that the local development environment can invoke osm2pgsql independently of the current project directory.

### 9.2 Import Prepared OSM Data into PostGIS

After installing `osm2pgsql`, the prepared ColMaps OSM dataset can be imported into the running PostgreSQL/PostGIS database.

The import uses the `flex` output mode, which allows the target table structure and geometry handling to be explicitly defined through a Lua configuration file.

The ColMaps configuration is stored in:

```text
database/osm2pgsql/colmaps.lua
```

The configuration defines the `public.osm_features` table with the following main fields:

```text
osm_type
osm_id
name
tags
geom
```

The `tags` column stores the original OSM tags as `JSONB`, while the `geom` column stores the corresponding PostGIS geometry.

The import can be executed from the project root using:

```powershell
osm2pgsql `
  -O flex `
  -S database/osm2pgsql/colmaps.lua `
  -d colmaps `
  -U colmaps `
  -H localhost `
  -P 5432 `
  -W `
  data-pipeline/processed/colombia-colmaps.osm.pbf
```

The `-W` option requests the database password interactively instead of including it directly in the command.

For the current local development configuration, the database is provided by the PostGIS Docker container defined in the root `docker-compose.yml`.

During the validated import, `osm2pgsql` successfully connected to:

```text
PostgreSQL 18.6
PostGIS 3.6
```

and created the `public.osm_features` table together with a GiST spatial index on the geometry column.

The resulting table can be inspected using:

1. Get Inside The Database using the command

```powershell
docker exec -it colmaps-db psql -U colmaps -d colmaps
```

2. Run this Command to inspect the table

```sql
\d osm_features
```

The imported dataset contains OSM nodes, ways, and relations, represented using the following geometry types:

```text
POLYGON
POINT
LINESTRING
MULTIPOLYGON
GEOMETRYCOLLECTION
```

The final validated import contained no null geometries:

```sql
SELECT COUNT(*)
FROM osm_features
WHERE geom IS NULL;
```

Expected result:

```text
0
```

The geometry distribution can be inspected using:

```sql
SELECT
    GeometryType(geom) AS geometry_type,
    COUNT(*)
FROM osm_features
GROUP BY GeometryType(geom)
ORDER BY COUNT(*) DESC;
```

For the validated dataset, the resulting distribution was:

```text
POLYGON             116212
POINT                83575
LINESTRING            8845
MULTIPOLYGON           535
GEOMETRYCOLLECTION      28
```

Relations tagged as `type=multipolygon` are converted to multipolygon geometries, while other relation types such as `site`, `boundary`, `waterway`, and similar composite structures may be represented as geometry collections.

This manual import validates the database schema, geometry conversion strategy, spatial indexing, and compatibility between the prepared OSM dataset and PostGIS before the import process is automated.

### 9.3 Database Automation Environment

The database import automation uses a dedicated Conda environment to keep its Python dependencies isolated from the data-analysis pipeline.

The environment definition is stored in:

```text
database/environment.yml
```

The environment uses the same Python version as the data pipeline in order to keep the project runtime consistent across Python-based components.

The current environment definition is:

```yaml
name: colmaps-database

channels:
  - conda-forge

dependencies:
  - python=3.14
  - psycopg
  - python-dotenv
```

The environment can be created from the `database` directory using:

```powershell
conda env create -f environment.yml
```

After creation, activate it with:

```powershell
conda activate colmaps-database
```

The installation can be verified using:

```powershell
python --version
```

and:

```powershell
python -c "import psycopg; print(psycopg.__version__)"
```

This environment is intentionally kept separate from `data-pipeline/environment.yml`.

The data pipeline environment contains dependencies required for exploratory analysis, Jupyter notebook execution, and dataset preparation, while the database environment contains only the Python dependencies required for database automation.

This separation keeps component responsibilities explicit and reduces unnecessary dependency coupling between pipeline stages.

The same environment definition is reused by the containerized database import stage, allowing the local development environment and the Docker-based environment to derive from the same declared dependency specification.

### 9.4 Automated PostGIS Import

After validating the `osm2pgsql` import manually, the process is automated through:

```text
database/scripts/import_osm.py
```

The script provides a reproducible entry point for importing the prepared OSM dataset into PostGIS using the previously validated `osm2pgsql` Flex configuration.

The import uses:

```text
data-pipeline/processed/colombia-colmaps.osm.pbf
```

together with:

```text
database/osm2pgsql/colmaps.lua
```

Before starting the import, the script validates that both required files exist.

It then connects to the ColMaps PostgreSQL database and checks whether the imported `public.osm_features` table already exists and contains data.

If a valid imported dataset is already present, the import is skipped:

```text
ColMaps dataset is already imported.
Existing features: ...
Skipping PostGIS import.
Use --force to recreate the imported dataset.
```

This prevents the complete OSM dataset from being reimported unnecessarily during repeated development or initialization runs.

The automated import can be executed from the project root using:

```powershell
python database/scripts/import_osm.py
```

If the dataset must be rebuilt, the `--force` option can be used:

```powershell
python database/scripts/import_osm.py --force
```

When forced, the script removes the tables created by the previous ColMaps `osm2pgsql` import and recreates them using the validated Flex configuration.

The script does not remove unrelated PostGIS schemas or extension tables.

After `osm2pgsql` completes, the script performs additional validation against the resulting database state.

It verifies that:

- the expected `public.osm_features` table exists;
- the table contains imported features;
- no imported feature contains a null geometry.

A successful execution therefore validates both the `osm2pgsql` process and the resulting PostGIS dataset before reporting completion.

The automation provides two complementary execution modes:

```text
Normal execution
→ inspect database state
→ existing valid import → skip
→ missing import → import and validate

Forced execution
→ remove previous ColMaps import
→ execute osm2pgsql
→ recreate database dataset
→ validate resulting import
```

This script serves as the reproducible interface between the prepared OSM dataset and the PostGIS database and is used as part of the containerized application initialization workflow.
