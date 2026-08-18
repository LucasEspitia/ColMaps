# ColMaps Architecture

This document describes the current architecture and structural decisions of **ColMaps**.

## 1. Project Architecture

ColMaps follows a modular architecture in which the main responsibilities of the system are separated into independent areas.

The repository is organized as follows:

```text
colmaps/
│
├── frontend/           # Angular + MapLibre application
├── backend/            # REST API
├── database/           # Spatial database configuration
├── routing/            # Routing engine configuration
├── data-pipeline/      # Geographic data preparation and import
├── scripts/            # Development and automation scripts
├── docs/               # Architecture and project documentation
│
├── .editorconfig
├── .gitignore
├── .nvmrc
├── docker-compose.yml
├── LICENSE
└── README.md
```

This separation keeps the frontend application, backend services, spatial infrastructure, routing infrastructure, and data processing responsibilities independent at repository level.

---

## 2. Frontend Architecture

The ColMaps frontend is built with the following stack:

```text
Angular 22
│
├── SSR / SSG
├── Client Hydration
├── Taiga UI
├── Tailwind CSS
└── MapLibre GL JS
```

Each technology has a defined responsibility:

- **Angular** provides the application framework, component model, routing, dependency injection, and rendering infrastructure.
- **Angular SSR/SSG** provides server-side and static rendering capabilities for content that benefits from initial server rendering and indexing.
- **Client Hydration** allows the server-rendered Angular application to become interactive in the browser.
- **Taiga UI** provides the primary reusable UI component system.
- **Tailwind CSS** provides layout, spacing, responsive design, sizing, and other utility-based styling.
- **MapLibre GL JS** provides WebGL-based interactive geographic visualization.

The separation between Taiga UI and Tailwind CSS is intentional. Taiga UI is responsible primarily for UI components and their behavior, while Tailwind is responsible primarily for layout and composition.

---

## 3. Rendering Architecture

The frontend separates server-renderable application content from browser-dependent GIS functionality.

```text
                 Angular Application
                         │
              ┌──────────┴──────────┐
              │                     │
         Server Environment    Browser Environment
              │                     │
           SSR / SSG             Hydration
                                    │
                                    ▼
                               MapLibre GL
                                    │
                              WebGL / Worker
```

MapLibre GL is not initialized during server-side rendering because it depends on browser-specific technologies such as WebGL and Web Workers.

The map component therefore explicitly verifies that it is executing in a browser environment before initializing MapLibre:

```typescript
if (!isPlatformBrowser(this.platformId)) {
  return;
}
```

This creates a clear boundary between Angular's server-rendering environment and browser-only GIS rendering.

---

## 4. Frontend Project Structure

The Angular application follows a **component-first, feature-oriented architecture**.

```text
src/app/
│
├── core/
├── shared/
├── features/
├── layout/
│
├── app.config.ts
├── app.config.server.ts
├── app.routes.ts
└── app.routes.server.ts
```

The project intentionally does not introduce a separate `pages` layer. Route-level functionality is represented by components belonging to their corresponding feature.

### `core/`

Contains application-wide infrastructure and functionality with global responsibility.

```text
core/
├── services/
├── interceptors/
├── guards/
└── models/
```

Feature-specific UI components do not belong in this layer.

### `shared/`

Contains reusable elements that are independent of a particular application feature.

```text
shared/
├── components/
├── directives/
├── pipes/
└── utils/
```

Shared components should remain reusable and should not contain feature-specific business logic.

### `features/`

Contains the functional areas of the application.

Each feature owns the components and supporting code directly related to its responsibility.

```text
features/
└── feature-name/
    ├── components/
    ├── services/
    └── models/
```

Subdirectories are created only when required by the feature rather than being created preemptively.

The map functionality, for example, belongs to:

```text
features/
└── map/
```

This keeps GIS-specific functionality isolated from unrelated application functionality.

### `layout/`

Contains components responsible for the global composition and structure of the application interface.

```text
layout/
└── components/
```

Layout components define application-level composition rather than feature-specific functionality.

---

## 5. Component Responsibility

Components are designed around a clearly defined responsibility.

Feature-specific behavior remains within its corresponding feature, while reusable components remain independent in `shared`.

This organization helps prevent unrelated responsibilities from accumulating inside large components and supports the **Single Responsibility Principle**.

The component-first structure also provides explicit boundaries that make individual parts of the frontend easier to isolate and test.

---

## 6. MapLibre Integration

MapLibre runs exclusively in the browser environment.

Its rendering architecture is:

```text
Angular Component
       │
       ▼
MapLibre GL JS
       │
       ├── WebGL rendering
       │
       └── Web Worker
                │
                ├── maplibre-gl-worker.mjs
                └── maplibre-gl-shared.mjs
```

The required MapLibre worker modules are exposed by the Angular application under:

```text
/maplibre/maplibre-gl-worker.mjs
/maplibre/maplibre-gl-shared.mjs
```

This configuration keeps MapLibre's browser-specific processing separate from Angular's server-rendering environment.

## Lazy Loading Strategy

GIS functionality is loaded lazily at route level to prevent MapLibre GL JS
from becoming part of the initial application bundle.

The map route uses Angular's `loadComponent`:

```typescript
{
  path: 'map',
  loadComponent: () =>
    import('./features/map/map/map').then(
      (m) => m.MapComponent,
    ),
}
```

This creates a separate bundle for the map feature and its MapLibre
dependencies.

The impact of this architectural decision was measured using the Angular
production build:

| Configuration      | Initial Bundle | Estimated Transfer |
| ------------------ | -------------: | -----------------: |
| Map loaded eagerly |        1.40 MB |          301.55 kB |
| Map loaded lazily  |      468.03 kB |          104.00 kB |

This reduced the raw initial browser bundle by approximately 66.6% and kept
the initial bundle below Angular's configured 500 kB warning threshold.
