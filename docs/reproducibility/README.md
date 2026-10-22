# ColMaps reproducibility

This documentation supports reproducing the development environment, the geographic-data preparation process and application execution. It also preserves the original developer's learning and validation record. Historical scaffolding procedures explain how the project was built; they are not commands to repeat inside an existing checkout. The containerized configuration is a **development environment**, not a verified production deployment.

## Prerequisites and execution order

1. Obtain the repository and configure `.env` from [`.env.example`](../../.env.example).
2. For container execution, install Docker with Compose and BuildKit support. The convenience build/start scripts require npm on the host; direct Compose commands are also available in [application setup](application-setup.md).
3. Build and run the data preparation service, then import into healthy PostgreSQL/PostGIS. Compose encodes these dependencies and starts the backend after import, then the frontend.
4. Verify database, API and browser behavior using [application setup](application-setup.md).
5. Run the documented tests, lint and builds when validating application changes.

For host development, use Git, Node.js **24.22.1** from [`.nvmrc`](../../.nvmrc), and npm **11.17.0** (the frontend's declared package manager). The original development record identifies Node 24 LTS/Krypton. With NVM installed, run from the root:

```bash
nvm install
nvm use
node --version
npm --version
```

Expected recorded versions are `v24.22.1` and `11.19.1`; NVM alone does not enforce the npm version. Host data processing additionally requires the Conda environments and osm2pgsql described in the pipeline guide. Containers supply these tools; host Miniforge/Jupyter installations are optional for that workflow. Network access is required for packages, base images, the fixed GeoFabrik dataset and the demo map resources.

## Procedures

- [Data pipeline and import](data-pipeline.md): dependencies, Windows setup/workarounds, notebooks, dataset acquisition, filtering, import commands, verification and limitations.
- [Application setup](application-setup.md): environment configuration, Compose, host execution, workers, images, tests, hooks, CI and historical setup decisions.
- [Architecture](../architecture/README.md): current responsibilities and decisions, kept separate from reproduction steps.
- [Database decisions](../architecture/database-decisions.md): storage and POI read-model decisions, with links to the database sequence and benchmark evidence.

The fixed input and checksum reproduce the analyzed source dataset. Individual filtering decisions are **not universally transferable**: another region or changed snapshot may require new exploration and validation. Notebooks 01–04 retain the detailed research reasoning; their original numbered link labels are preserved in the pipeline guide. No Jupyter Book resource or separate bibliography was linked by the two original documents.

## Verification scope and migration record

The refactor was checked against source, manifests, routes, providers, styles, tests, scripts, Dockerfiles, Compose, hooks and CI configuration. Commands were inspected statically; the full download/import, Docker startup, application test suite and historical measurements were not rerun. Reported previous successes remain historical observations.

| Original content                                                                             | Destination                                                                |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| architecture.md: repository/components and rendering diagrams                                | Architecture overview and frontend decisions                               |
| architecture.md: frontend organization, MapLibre workers, lazy loading and bundle comparison | Frontend decisions, reconciled with source                                 |
| reproducibility.md: introduction, tree and prerequisites (1–2)                               | This overview; current component tree in architecture                      |
| reproducibility.md: frontend/backend scaffolding and database/ORM setup (3–6)                | Application setup, including historical commands and current verification  |
| reproducibility.md: environment, exploration, preparation and import (7–9)                   | Data pipeline; original section numbering and detailed content retained    |
| reproducibility.md: shared environment, containers, Windows/WSL2 and caching (10–11)         | Application setup                                                          |
| reproducibility.md: testing, hooks and CI (12–13)                                            | Application setup; test boundaries in architecture decisions               |
| reproducibility.md: accessibility and imagery (14–15)                                        | Frontend decisions; reproduction and validation steps in application setup |

Repeated Compose fragments, framework tutorials, illustrative code listings and repeated success statements were condensed into source links and procedures. No unique historical measurement, data-method limitation, external URL or numbered notebook reference was intentionally removed. Original entry files now link to these guides to retain incoming links.

Known discrepancies are documented at the relevant procedure: root `.env` loading for host backend execution, internal import port handling, UTF-16 pipeline environment specification, incomplete environment pinning, presence-based skips, legacy Jest metadata, current bundle budgets and unverified focus trapping. OSRM, production deployment, database integration tests, final Windows Narrator checks and Lighthouse/Core Web Vitals measurements remain planned. Original motivations not established by the record or source have not been invented.
