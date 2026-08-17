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

## 4. Taiga UI Setup

ColMaps uses Taiga UI as its primary Angular component library.

From the `frontend` directory:

```bash
npx ng add taiga-ui
```

The installation configures the required Taiga UI dependencies for the Angular application.

Taiga UI requires the LESS stylesheet preprocessor for its global theme files.

Install it as a development dependency:

```bash
npm install --save-dev less
```

Taiga UI SSR support requires `@ng-web-apis/universal`.

The current version of `@ng-web-apis/universal` requires Node.js type
definitions from the Node 24 branch, therefore the project uses:

```bash
npm install --save-dev @types/node@^24.10.11
npm install @ng-web-apis/universal
```

Verify the installation:

```bash
npm start
npm run build
```
