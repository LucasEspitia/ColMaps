# ColMaps Reproducibility Guide

This document describes the steps done by the developer and it should be used as a roadmap of what has been done, rather than as the primary guide if you intend to run the project locally.

It serves primarily as a learning tool, illustrating the internal process and the decisions made during the creation of ColMaps.

## 1. Repository Structure

The project uses the following base structure:

```text
colmaps/
├── frontend/
├── backend/
├── database/
├── routing/
├── data-pipeline/
├── scripts/
├── docs/
├── docker-compose.yml
├── .editorconfig
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md
```

## 2. Prerequisites

The following tools are required for the development environment:

- Git
- Node.js 24.19.0 LTS (Krypton)
- npm 11.17.0
- Docker
- Docker Compose

### Node.js

ColMaps uses Node.js 24 LTS to provide a stable and reproducible
JavaScript runtime across the frontend and backend environments.

The required Node.js version is specified in the `.nvmrc` file.

Using NVM:

```bash
nvm install
nvm use
```

**Verify Environment**

```bash
node --version
npm --version
```

**Expected Versions**

```bash
v24.19.0
11.17.0
```

## 3. Frontend Setup

The ColMaps frontend is built with Angular 22.

From the project root, navigate to the frontend directory:

```bash
cd frontend
```

Initialize the Angular project:

```bash
npx @angular/cli@22 new frontend --directory=. --skip-git
```

During the Angular CLI setup, the following options were selected:

- Stylesheet system: Tailwind CSS
- Server-Side Rendering (SSR) and Static Site Generation (SSG): Enabled
- AI configuration: None

SSR/SSG support is enabled to allow ColMaps to provide server-rendered or
prerendered content where appropriate, particularly for publicly accessible
and indexable pages.

Interactive GIS functionality will remain client-side where browser-specific
APIs are required.

Verify the installation:

```bash
npm start
npm run build
```

### 3.1 Taiga UI Setup

ColMaps uses **Taiga UI** as its primary Angular component library.

The library provides reusable UI components while keeping the application closely integrated with the Angular ecosystem.

From the `frontend` directory, install Taiga UI using the Angular schematic:

```bash
npx ng add taiga-ui
```

During the installation, no optional add-on packages are required at this stage. Additional packages such as charts or tables can be installed later if they become necessary for the application dashboard or other features.

#### LESS Preprocessor

Taiga UI uses LESS files for some of its global theme styles.

Install the LESS stylesheet preprocessor as a development dependency:

```bash
npm install --save-dev less
```

Without this dependency, Angular may fail to process Taiga UI theme files during the build process.

#### Node.js Type Definitions

Taiga UI SSR support requires `@ng-web-apis/universal`.

The current version of `@ng-web-apis/universal` requires Node.js type definitions from the Node 24 branch. Since ColMaps uses Node.js 24 LTS, update the Node.js type definitions accordingly:

```bash
npm install --save-dev @types/node@^24.10.11
```

#### Server-Side Rendering Support

Install the Web API compatibility package required for Taiga UI when using Angular Server-Side Rendering:

```bash
npm install @ng-web-apis/universal
```

Taiga UI relies on browser Web APIs such as `matchMedia`, which are not natively available in the server environment.

To provide server-compatible implementations of these APIs, register the universal provider in:

```text
frontend/src/app/app.config.server.ts
```

Import the provider:

```typescript
import { provideUniversal } from "@ng-web-apis/universal";
```

Then add `provideUniversal()` to the server-specific providers:

```typescript
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes)), provideUniversal()],
};
```

#### Verify the Installation

Start the Angular development server:

```bash
npm start
npm run build
```

Both commands should complete without LESS preprocessing or SSR-related errors before continuing with additional frontend dependencies.

### 3.2 MapLibre GL Setup

ColMaps uses MapLibre GL JS as the map rendering library for interactive geospatial visualization.

MapLibre GL JS provides WebGL-based rendering for vector maps and will serve as the main visualization layer for geographic data, points of interest, and routes within the application.

From the `frontend` directory, install MapLibre GL JS:

```bash
npm install maplibre-gl
```

MapLibre GL JS includes its own TypeScript definitions, therefore no additional `@types` package is required.

#### Global MapLibre

MapLibre requires its stylesheet for map controls and other built-in UI elements.

Add the MapLibre stylesheet to the global styles configuration inside `angular.json`:

```json
"styles": [
    "node_modules/maplibre-gl/dist/maplibre-gl.css",
    "src/styles.css"
    ]
```

The exact existing application stylesheet entry should be preserved if it differs from `src/styles.css`.

#### Angular Development Server Configuration

MapLibre GL uses a Web Worker for processing map data outside the main browser thread.

When using the Angular development server, MapLibre should be excluded from dependency prebundling to prevent its worker from being incorrectly processed by the underlying development build system.

Inside the `serve` configuration in `angular.json`, add:

```json
"options": {
    "prebundle": {
        "exclude": [
            "maplibre-gl"
        ]
    }
}
```

#### MapLibre Worker Assets

During development, the MapLibre worker and its shared module must be accessible to the browser.

Without this configuration, the Angular development server may fail to correctly resolve the MapLibre worker dependencies. This can result in the map container being rendered while geographic layers fail to appear.

Add the MapLibre worker files to the `assets` configuration in `angular.json`:

```bash
"assets": [
    {
        "glob": "**/*",
        "input": "public"
    },
    {
        "glob": "maplibre-gl-worker.mjs",
        "input": "node_modules/maplibre-gl/dist",
        "output": "/maplibre/"
    },
    {
        "glob": "maplibre-gl-shared.mjs",
        "input": "node_modules/maplibre-gl/dist",
        "output": "/maplibre/"
    }
]
```

This makes both required modules available under:

```text
/maplibre/maplibre-gl-worker.mjs
/maplibre/maplibre-gl-shared.mjs
```

Both files should be served successfully by the Angular development server.

#### SSR-Safe Map Component

Because ColMaps uses Server-Side Rendering, MapLibre must only be initialized in a browser environment.

MapLibre depends on browser-specific functionality such as WebGL and Web Workers, which is not available during server-side rendering.

Generate the initial map component:

```bash
npx ng generate component features/map
```

Angular's `PLATFORM_ID` and `isPlatformBrowser()` can then be used to prevent MapLibre initialization on the server.

A minimal implementation is:

```typescript
import { isPlatformBrowser } from "@angular/common";
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from "@angular/core";

import { Map, setWorkerUrl } from "maplibre-gl";

@Component({
  selector: "app-map",
  imports: [],
  templateUrl: "./map.html",
})
export class MapComponent implements AfterViewInit {
  @ViewChild("mapContainer")
  private mapContainer!: ElementRef<HTMLElement>;

  private map?: Map;

  constructor(
    @Inject(PLATFORM_ID)
    private readonly platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-74.0721, 4.711],
      zoom: 4,
    });
  }
}
```

The corresponding template contains the map container:

```html
<div #mapContainer class="h-screen w-full"></div>
```

The `isPlatformBrowser()` check creates an explicit boundary between Angular's server-rendering environment and MapLibre's browser-only initialization.

The HTML structure of the Angular application can therefore participate in server-side rendering while the interactive WebGL map is initialized after the application runs in the browser.

#### Worker Verification

After starting the development server, verify that the worker files are accessible.

The following resources should return a successful HTTP response:

```text
http://localhost:4200/maplibre/maplibre-gl-worker.mjs
http://localhost:4200/maplibre/maplibre-gl-shared.mjs
```

Both resources should return JavaScript modules rather than the Angular application's HTML document.

If the worker is incorrectly configured, symptoms can include:

- the map container appearing without geographic features;
- only the background color of the map style being visible;
- the MapLibre worker remaining pending in the browser Network panel;
- worker or shared-module requests failing;
- responses containing HTML where JavaScript or JSON is expected.

After changing the worker or Angular build configuration, the Angular cache can be cleared with:

```bash
npx ng cache clean
```

#### Exceding Angular's Bundle Budget

The initial integration of MapLibre GL and Taiga UI may exceed Angular's
default initial bundle budget.

If the default budget causes the build to fail, adjust the initial application
budget in `angular.json` to:

```json
{
  "type": "initial",
  "maximumWarning": "1.5MB",
  "maximumError": "2MB"
}
```

This budget is used during the initial development phase and does not represent
the final performance target of the application. Bundle size will be measured
and optimized during the performance evaluation stage.

#### Verify the Instalation

It's worth mentioning that the created component will need to import the root `app.ts` file using:

```typescript
import { MapComponent } from "./features/map/map";
```

And its import:

```text
 imports: [RouterOutlet, TuiRoot, MapComponent],
```

Then we'll add the reference to its `app.html` file:

```html
<app-map />
```

This will allow us to test the minimal component, initialize it, and verify that the setup was successful.

Then start the development server:

```bash
npm start
npm run build

```

Both the development server and production build should complete successfully before continuing with the implementation of application-specific GIS functionality.

### 3.3 Architecture organization

The frontend follows the architecture documented in `docs/architecture.md`

### 3.4 Lazy Loading

To prevent MapLibre GL JS from being included in the initial application
bundle, the map feature is loaded lazily through Angular routing.

Configure the map route in `app.routes.ts`:

```typescript
{
  path: 'map',
  loadComponent: () =>
    import('./features/map/map/map').then(
      (m) => m.MapComponent,
    ),
}
```

## 4. Backend Setup

ColMaps uses **NestJS** as the backend framework.

The backend is maintained inside the `backend/` directory of the main ColMaps repository and uses the same Node.js environment defined for the project.

### 4.1 Initialize the NestJS Application

From the ColMaps project root, navigate to the backend directory:

```bash
cd backend
```

Initialize a new NestJS application inside the existing directory:

```bash
npx @nestjs/cli new colmaps-backend --directory=. --skip-git --strict
```

During the installation, select:

```bash
Package manager: npm
```

The `--directory=.` option initializes the NestJS application directly inside the existing backend/ directory.

The `--strict` option enables stricter TypeScript compiler settings to improve type safety and maintainability.

The `--skip-git` option prevents NestJS from intentionally initializing a separate Git repository, since the backend belongs to the main ColMaps repository.

### 4.2 Verify the Devlopment Server

Start NestJS in development mode:

```bash
npm run start:dev
```

By default, the backend is available at:

```text
http://localhost:3000
```

The initial NestJS application should respond successfully with the default:

```text
Hello World!
```

### 4.3 Health Endpoint

A basic health endpoint is provided to verify that the backend application is running correctly.

In `app.controller.ts`, define:

```typescript
@Get('health')
getHealth() {
  return {
    status: 'ok',
  };
}
```

With the backend running, verify the endpoint at:

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## 5. PostgreSQL and PostGIS Setup

ColMaps uses **PostgreSQL 18** with **PostGIS 3.6** as its spatial database.

The database runs inside Docker to provide an isolated and reproducible environment without requiring a local PostgreSQL or PostGIS installation.

### 5.1 Docker Compose Configuration

The database service is defined in the root `docker-compose.yml` file:

```yaml
services:
  db:
    image: postgis/postgis:18-3.6
    container_name: colmaps-db
    restart: unless-stopped

    environment:
      POSTGRES_DB: colmaps
      POSTGRES_USER: colmaps
      POSTGRES_PASSWORD: colmaps_pwd

    ports:
      - "5432:5432"

    volumes:
      - colmaps_postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U colmaps -d colmaps"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  colmaps_postgres_data:
```

The database uses PostgreSQL's standard internal port `5432`, which is exposed as port `5432` on the host machine:

```text
localhost:5432 → container:5432
```

The named Docker volume `colmaps_postgres_data` persists the database data between container restarts.

> **PostgreSQL 18 note:** PostgreSQL 18+ Docker images use a version-specific data directory structure. Therefore, the persistent volume is mounted at `/var/lib/postgresql` rather than `/var/lib/postgresql/data`.

### 5.2 Start the Database

From the ColMaps project root, start the database service:

```bash
docker compose up -d db
```

Verify the container status:

```bash
docker compose ps
```

The `colmaps-db` container should report a healthy status:

```text
colmaps-db   ...   Up ... (healthy)
```

The configured health check uses `pg_isready` to verify that PostgreSQL is ready to accept connections.

### 5.3 Verify PostgreSQL and PostGIS

Open a PostgreSQL shell inside the running container:

```bash
docker exec -it colmaps-db psql -U colmaps -d colmaps
```

Verify the PostgreSQL installation:

```sql
SELECT version();
```

Verify that PostGIS is available:

```sql
SELECT PostGIS_Full_Version();
```

Both queries should return version information successfully.

Exit the PostgreSQL shell with:

```text
\q
```

### 5.4 Reset the Development Database

If the database needs to be recreated completely, stop the Compose services and remove their volumes:

```bash
docker compose down -v
```

Then recreate the database:

```bash
docker compose up -d db
```

> Removing the Docker volume permanently deletes the current development database contents. This command should therefore only be used when a complete database reset is intended.

## 6. MikroORM and PostGIS Connection

ColMaps uses **MikroORM** as the Object-Relational Mapper (ORM) for the NestJS backend.

MikroORM connects the backend to the PostgreSQL/PostGIS database while providing integration with NestJS dependency injection and support for PostgreSQL-specific functionality.

### 6.1 nstall MikroORM

From the `backend` directory, install the required dependencies:

```bash
npm install @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql @nestjs/config dotenv
```

The packages provide:

- `@mikro-orm/core` — core ORM functionality.
- `@mikro-orm/nestjs` — NestJS integration.
- `@mikro-orm/postgresql` — PostgreSQL driver.
- `@nestjs/config` — environment configuration.
- `dotenv` — loading environment variables for the standalone MikroORM configuration.

### 6.2 Database Environment Configuration

Create a `.env` file inside `backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=colmaps
DB_USER=colmaps
DB_PASSWORD=colmaps_dev
```

The `.env` file must not be committed to Git.

Make sure the backend `gitignore` does not contain any reference of env.

### 6.3 MikroORM Configuration

Create `mikro-orm.config.ts` in the backend root:

```typescript
import "dotenv/config";

import { defineConfig } from "@mikro-orm/postgresql";

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  entities: ["./dist/**/*.entity.js"],
  entitiesTs: ["./src/**/*.entity.ts"],

  discovery: {
    warnWhenNoEntities: false,
  },

  debug: false,
});
```

`warnWhenNoEntities` is disabled during the initial setup because no persistent entities have been introduced yet.

### 6.4 NestJS Integration

Register MikroORM and the environment configuration in `app.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import mikroOrmConfig from "../mikro-orm.config";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

The resulting connection path is:

```text
NestJS
   ↓
MikroORM
   ↓
PostgreSQL
   ↓
PostGIS
```

### 6.5 Verify the PostGIS Connection

The existing health endpoint can be used to verify that the complete database connection is operational.

Inject the PostgreSQL `EntityManager` and execute a PostGIS query:

```typescript
import { Controller, Get } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/postgresql";

@Controller()
export class AppController {
  constructor(private readonly em: EntityManager) {}

  @Get("health")
  async getHealth() {
    const result = await this.em.getConnection().execute<{ postgis_version: string }[]>("SELECT PostGIS_Version() AS postgis_version");

    return {
      status: "ok",
      database: "connected",
      postgis: result[0].postgis_version,
    };
  }
}
```

Start the backend:

```bash
npm run start:dev
```

Then access:

```text
http://localhost:3000/health
```

A successful setup should return a response similar to:

```json
{
  "status": "ok",
  "database": "connected",
  "postgis": "3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"
}
```

This verifies that NestJS can successfully connect through MikroORM to the PostgreSQL database and execute PostGIS-specific SQL operations.

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

**This step can be skipped and you can go directly to step 7.3!!**

From the `data-pipeline` directory, create the Python environment:

```powershell
conda create -n colmaps-pipeline python=3.14 -y
conda activate colmaps-pipeline
```

Install the geospatial and data analysis dependencies:

```powershell
conda install -c conda-forge osmium-tool pyrosm pyarrow geopandas pandas matplotlib jupyter -y
```

The environment provides:

- **Osmium Tool** for efficient inspection and preprocessing of raw OpenStreetMap .osm.pbf datasets. It is used for operations that can be performed directly on the native OSM representation before constructing geospatial objects.
- **Pyrosm** for reading filtered OpenStreetMap .osm.pbf datasets and converting OSM entities into structured geospatial data. Its out-of-core processing engine is used when working with datasets that should not be fully materialized in memory.
- **PyArrow** as the columnar data processing backend used alongside the out-of-core workflow and for efficient intermediate data representation, including Parquet-based storage.
- **GeoPandas** for manipulating and analysing the geospatial objects produced during the processing pipeline.
- **Pandas** for tabular analysis, statistics, and inspection of extracted OpenStreetMap attributes.
- **Matplotlib** for exploratory data visualisation during dataset analysis.
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

Once the environment is installed, we can check the osm package or python version within it using:

```bash
python -c "import pyrosm; print(pyrosm.__version__)"
python --version
```

We should finish with something like this:

```bash
Python 3.14.x
0.13.1
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

<pre style="background-color: #f6f8fa; padding: 16px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 85%; line-height: 1.45; margin: 0;">
<a href="../data-pipeline/notebooks/01_inspect_osm.ipynb" style="color: #297ad7; text-decoration: none;">[01 - Raw OSM Dataset Inspection](../data-pipeline/notebooks/01_inspect_osm.ipynb)</a>
</pre>

The analysis showed that complete OSM tag families are generally too broad to serve directly as tourism filtering rules. Therefore, subsequent preprocessing stages define the required ColMaps feature categories and map them to explicit OSM `key=value` combinations.

**It is recommended to open the file directly in Jupyter instead of reading its contents directly!!**

### 8.2 Dataset Feature Scope Definition

Answers `What does ColMaps actually need?`

After inspecting the structure and tag distribution of the raw OSM dataset, the next stage defines the geographic feature scope required by ColMaps.

Rather than using complete OSM tag families, ColMaps defines application-level categories representing places and services potentially relevant to travelers. These categories are mapped to explicit OSM key=value combinations observed during the raw dataset inspection.

This stage establishes a candidate semantic scope and exports the resulting mapping specification for subsequent validation. The candidate mappings are also used to generate a reduced intermediate OSM extract containing the selected feature population and the referenced OSM elements required to preserve its structure.

The intermediate extraction is performed to reduce the computational cost of subsequent analysis. It does not represent the final ColMaps dataset: individual mappings have not yet undergone targeted validation and may still be retained, refined, or excluded before the final filtering rules are established.

The complete feature-category definition, OSM mapping decisions, consistency checks, intermediate extraction procedure, and methodological rationale are documented in:

<pre style="background-color: #f6f8fa; padding: 16px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 85%; line-height: 1.45; margin: 0;"> <a href="../data-pipeline/notebooks/02_define_feature_scope.ipynb" style="color: #297ad7; text-decoration: none;">[02 - ColMaps Feature Scope Definition](../data-pipeline/notebooks/02_define_feature_scope.ipynb)</a> </pre>

The resulting candidate scope and reduced OSM extract are subsequently used as inputs for targeted data validation, where potentially ambiguous, inconsistent, or overly broad feature classifications are investigated before the final dataset-preparation rules are established.

### 8.3 Dataset Feature Scope Validation

Answers `Is the candidate ColMaps feature scope suitable for the final dataset?`

The candidate feature scope is validated using the reduced OSM extract generated during the previous stage. Rather than manually reviewing every mapping, targeted validation focuses on classifications presenting semantic, descriptive, spatial, representational, or classification-related uncertainty.

The validation determines whether candidate mappings should be **retained**, **refined**, or **excluded**. The resulting decisions and refinement requirements are consolidated into a validated feature-scope specification that can be consumed by the final dataset-preparation pipeline.

The complete profiling process, targeted validation cases, refinement decisions, and methodological rationale are documented in:

<pre style="background-color: #f6f8fa; padding: 16px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 85%; line-height: 1.45; margin: 0;">
<a href="../data-pipeline/notebooks/03_validate_feature_scope.ipynb" style="color: #297ad7; text-decoration: none;">[03 - ColMaps Feature Scope Validation](../data-pipeline/notebooks/03_validate_feature_scope.ipynb)</a>
</pre>

The validated specification is exported as `filters/02_validated_feature_scope.csv` and serves as the semantic input for the subsequent deterministic preparation of the final OSM dataset.

### 8.4 OSM Dataset Preparation

Answers `How is the validated ColMaps feature scope transformed into a reproducible OSM dataset for subsequent database import?`

The validated feature scope is applied to the original Colombia OSM extract to produce a reduced dataset containing the primary mappings required by ColMaps. Mappings marked as `EXCLUDE` are removed from the active feature scope, while mappings marked as `REFINE` are associated with explicit preparation rules for secondary classification, access restrictions, and semantic reclassification.

The preparation preserves referenced OSM elements required for structural integrity and geometry reconstruction. Therefore, physical presence in the resulting PBF is distinguished from semantic eligibility as a ColMaps feature.

The complete preparation process, refinement rules, validation checks, and resulting dataset statistics are documented in:

<pre>
<a href="../data-pipeline/notebooks/04_prepare_osm_dataset.ipynb">[04 - ColMaps OSM Dataset Preparation](../data-pipeline/notebooks/04_prepare_osm_dataset.ipynb)</a>
</pre>

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
