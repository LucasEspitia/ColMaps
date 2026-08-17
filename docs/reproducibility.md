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
