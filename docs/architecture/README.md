# ColMaps architecture

ColMaps is a Bachelor's thesis Web GIS prototype. This overview describes the checked-in implementation; setup procedures are in [Reproducibility](../reproducibility/README.md).

| Component | Implemented responsibility | Source |
| --- | --- | --- |
| Frontend | Angular 22 server rendering and hydration; Taiga UI 5 components, Tailwind CSS 4 styling; browser-only MapLibre GL JS 6 demo map | [frontend](../../frontend/src/app/) |
| Backend | NestJS 11 REST endpoints for database health and bounding-box POI retrieval; MikroORM 7 PostgreSQL connection | [backend](../../backend/src/) |
| Database | PostgreSQL 18 / PostGIS 3.6; osm2pgsql Flex import into `public.osm_features` | [database](../../database/) |
| Data preparation | Python 3.14, Osmium, Pyrosm, Pandas and Jupyter notebooks; fixed GeoFabrik Colombia snapshot and validated scope | [data-pipeline](../../data-pipeline/) |
| Validation | Vitest, ESLint, Husky and GitHub Actions; no database required by current CI tests | [CI workflow](../../.github/workflows/ci.yml) |

```text
GeoFabrik snapshot → Python / notebooks → prepared PBF → osm2pgsql → PostGIS
                                                                       ↑
                                                           MikroORM / spatial SQL
                                                                       ↑
                                                        NestJS /health and /pois

HTTP request + preference cookie → Angular SSR → browser hydration
                                                    ↓
                                         MapLibre → demo style / tiles
```

The frontend currently does not call `/pois`; the API and map are separate working boundaries. Compose orders startup as database health + completed pipeline → import → backend → frontend. This dependency order does not establish frontend/API integration or backend readiness: the frontend waits only for the backend container to start.

The repository separates frontend, backend, spatial storage and data processing. OSRM routing remains planned; no routing service is configured in Compose. PWA support, automated deployment, Lighthouse/Core Web Vitals evaluation, database integration tests and final assistive-technology validation are also future work.

## Decisions

- [Frontend decisions](frontend-decisions.md): rendering, features, lazy loading, map workers, themes, accessibility, images and testing.
- [Backend decisions](backend-decisions.md): REST boundaries, bbox validation, spatial SQL and GeoJSON contracts.
- [Data decisions](data-decisions.md): source snapshot, dataset-dependent filtering, preparation environments and reusable artifacts.
- [Database decisions](database-decisions.md): mixed geometry storage, the precomputed POI read model and its benchmark evidence.

The former architecture document's hypothetical `shared`, guards, interceptors and separate layout tree have been replaced by the actual feature and `core` structure. Historical bundle measurements are retained with their limitations in the frontend decisions.
