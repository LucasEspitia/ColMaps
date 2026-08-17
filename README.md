# ColMaps

> A high-performance and accessible Web GIS prototype for exploring tourist routes and points of interest in Colombia.

Colomaps is a bachelor's thesis project focused on the design and development of a **high-performance, accessible, modular, and reproducible Web GIS application**.

The project uses Colombia as a case study, providing an interactive platform for exploring geographic information, tourist points of interest, and routes based on OpenStreetMap data.

Rather than developing new routing or geospatial algorithms, the project focuses on **software engineering practices for modern Web GIS systems**, including performance optimization, modular architecture, accessibility, automated testing, and continuous validation.

## Project Goals

The main goals of Colomaps are to:

- Build a modular Web GIS architecture with clearly separated responsibilities.
- Provide interactive visualization of geographic data and tourist points of interest.
- Support route calculation using OpenStreetMap-based routing.
- Optimize frontend performance according to **Core Web Vitals**.
- Improve accessibility according to **WCAG** recommendations.
- Integrate automated testing and quality validation into the CI/CD pipeline.
- Create a reproducible workflow for preparing and importing geospatial data.
- Evaluate the resulting prototype using measurable performance and quality metrics.

## Planned Architecture

```text
                     CI/CD
                       │
              ┌────────┴────────┐
              │                 │
         Lighthouse         Automated Tests
              │
              ▼
        ┌─────────────┐
        │   Angular   │
        │  MapLibre   │
        └──────┬──────┘
               │
               │ REST API
               ▼
        ┌─────────────┐
        │   NestJS    │
        │   Backend   │
        └──────┬──────┘
               │
          ┌────┴─────┐
          │          │
          ▼          ▼
     PostgreSQL     OSRM
       PostGIS      Routing
          │          │
          └────┬─────┘
               │
               ▼
        OpenStreetMap Data
          GeoFabrik PBF
```

The architecture separates visualization, business logic, spatial storage, routing, and data preparation into independent components.

## Technology Stack

### Frontend

- Angular
- TypeScript
- MapLibre GL
- Progressive Web App technologies

### Backend

- NestJS
- Node.js
- REST API
- GeoJSON / JSON

### Geospatial Infrastructure

- PostgreSQL
- PostGIS
- OpenStreetMap
- GeoFabrik
- osm2pgsql
- OSRM

### Quality & Testing

Planned quality assurance includes:

- Unit testing
- End-to-end testing
- Lighthouse
- Core Web Vitals
- Accessibility validation
- Automated CI/CD checks

## Geospatial Data

Colomaps uses geographic data from **OpenStreetMap**, with Colombia extracts obtained through GeoFabrik.

The planned data pipeline is:

```text
GeoFabrik (.osm.pbf)
        │
        ▼
   Data preparation
        │
        ├── Filtering
        │
        └── osm2pgsql
        │
        ▼
 PostgreSQL + PostGIS
        │
        ▼
     NestJS API
        │
        ▼
     Angular Client
```

Only data relevant to the case study will be processed where appropriate, reducing unnecessary storage and computational overhead while keeping the import process reproducible.

## Routing

Route calculation is planned to be handled by **OSRM (Open Source Routing Machine)** using OpenStreetMap data.

Routing is intentionally treated as a separate service because the objective of the project is not to develop a new pathfinding algorithm, but to study the architecture, performance, accessibility, maintainability, and validation of a Web GIS application.

## Performance

Performance is one of the main evaluation areas of the project.

The application will be evaluated using metrics such as:

| Metric                          | Target   |
| ------------------------------- | -------- |
| Largest Contentful Paint (LCP)  | < 2.5 s  |
| Interaction to Next Paint (INP) | < 200 ms |
| Cumulative Layout Shift (CLS)   | < 0.1    |

Performance measurements and thresholds are intended to become part of the automated validation process.

## Accessibility

Colomaps aims to explore accessibility challenges specific to interactive Web GIS applications.

The project will consider areas such as:

- Keyboard navigation
- Semantic interface structure
- Accessible controls
- Alternative representation of relevant geographic information
- Color and contrast
- Screen-reader compatibility

Accessibility will be evaluated according to applicable **WCAG guidelines**.

## Reproducibility

A major goal of the project is to make the development and data preparation process reproducible.

The repository is expected to include scripts and configuration for:

- Environment setup
- Database initialization
- OpenStreetMap data preparation
- Data import
- OSRM preprocessing
- Application execution
- Automated testing
- Performance validation

The objective is to minimize undocumented manual configuration and allow the system to be recreated from documented steps.

## Repository Structure

The repository is expected to evolve approximately as follows:

```text
colomaps/
│
├── frontend/            # Angular + MapLibre application
├── backend/             # NestJS REST API
├── database/            # PostGIS configuration and initialization
├── routing/             # OSRM configuration
├── data-pipeline/       # OSM preparation and import
├── scripts/             # Development and automation scripts
├── docs/                # Architecture and project documentation
│
├── .editorconfig        # Shared code formatting rules across editors and IDEs
├── .gitignore           # Files and directories excluded from Git version control
├── .nvmrc               # Node.js version used by the project
│
├── docker-compose.yml   # Definition and orchestration of local infrastructure services
├── LICENSE              # Project license and usage conditions
└── README.md            # Project overview, requirements, and basic usage instructions
```

The structure may change as the prototype evolves.

## Project Status

**Status:** Early development / Bachelor's thesis project

The project is currently in the initial architecture, environment setup, and prototype development phase.

Features and architectural decisions documented in this repository may evolve during implementation and evaluation.

## Academic Context

Colomaps is being developed as part of a **Bachelor's Thesis in Informatics at the Slovak University of Technology in Bratislava (STU), Faculty of Informatics and Information Technologies (FIIT)**.

The thesis investigates engineering practices for building Web GIS applications with particular emphasis on:

**performance · accessibility · modularity · automated validation · reproducibility**

Colombia is used as the geographic and tourism-oriented case study.

## License

The source code of this project is licensed under the **MIT License**. See the `LICENSE` file for details.

Geographic data obtained from OpenStreetMap is subject to the applicable **Open Database License (ODbL)** and is not covered by the project's MIT License.

## Author

**Lucas Daniel Espitia Corredor**

Bachelor's Thesis Project
Faculty of Informatics and Information Technologies
Slovak University of Technology in Bratislava

---

_Colomaps — Exploring Colombia through an accessible, performant and reproducible Web GIS._
