# ColMaps Reproducibility Guide

This document describes the steps required to reproduce the ColMaps development environment and run the project locally.

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
