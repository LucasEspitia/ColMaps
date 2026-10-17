# Frontend decisions

Source references describe the current implementation. Rationales below follow the original documentation or explicit code comments; no measured accessibility or performance compliance is implied.

## Decision: Request-specific SSR with browser hydration

- **Problem:** Render application content on the server while preserving cookie-based accessibility preferences and avoiding browser-only GIS initialization.
- **Solution:** [Application providers](../../frontend/src/app/app.config.ts) register client hydration, Taiga UI and router scrolling (top restoration and anchors). [Server providers](../../frontend/src/app/app.config.server.ts) merge server rendering and `provideUniversal()` for browser Web APIs such as `matchMedia`. [Server routes](../../frontend/src/app/app.routes.server.ts) use `RenderMode.Server` for every path and `Cache-Control: private, no-store` because preferences depend on request cookies.
- **Rationale:** Server-compatible Web APIs support Taiga UI, and request rendering allows the initial document to contain each user's preferences.
- **Trade-offs:** SSR requires a running server and external dependencies must remain safe during server evaluation. SSG was enabled during scaffolding but is not the current route strategy; personalized responses are not publicly cacheable.

```text
                 Angular Application
                         │
              ┌──────────┴──────────┐
              │                     │
         Server Environment    Browser Environment
              │                     │
             SSR                Hydration
                                    │
                                    ▼
                               MapLibre GL
                                    │
                              WebGL / Worker
```

## Decision: Feature components and shared application infrastructure

- **Problem:** Keep GIS and other feature behavior separate from application-wide composition.
- **Solution:** [Features](../../frontend/src/app/features/) contain home (with hero, explore, discover and highlights components), map, search and about. [Core](../../frontend/src/app/core/) contains accessibility infrastructure and layout components (navbar, footer, accessibility panel). The root composes these with `TuiRoot` and `RouterOutlet`; there is no separate pages layer.
- **Rationale:** The original component-first design places route-level components within their feature and creates supporting directories only as needed.
- **Trade-offs:** `shared/`, guards and interceptors shown in the former architecture were proposed organization, not implemented layers. Search currently has only a component/template shell. This organization alone does not demonstrate SOLID compliance or scalability.

## Decision: Lazy route components and browser-only MapLibre initialization

- **Problem:** Keep the substantial GIS dependency out of the initial route code and avoid WebGL/worker initialization on the server.
- **Solution:** [Routes](../../frontend/src/app/app.routes.ts) lazily load home, search, map and about with `loadComponent`, set page titles and redirect unknown paths home. [MapComponent](../../frontend/src/app/features/map/map.ts) imports MapLibre at module level but checks `isPlatformBrowser()` in `ngAfterViewInit()` before constructing the map. It sets the worker URL to `/maplibre/maplibre-gl-worker.mjs`, uses `https://demotiles.maplibre.org/style.json`, center `[-74.0721, 4.711]` and zoom `4`.
- **Rationale:** Route splitting defers map feature code; the platform guard separates server-renderable HTML from browser-only rendering.
- **Trade-offs:** Lazy loading still incurs a map-route download and the stylesheet is global. The guard protects initialization, not the module import itself. The map has no POI fetch, routing, or destruction cleanup in its current implementation; it depends on external demo resources.

The original production-build comparison is preserved as a historical observation, not a benchmark of this checkout:

| Configuration | Initial bundle | Estimated transfer |
| --- | ---: | ---: |
| Map loaded eagerly | 1.40 MB | 301.55 kB |
| Map loaded lazily | 468.03 kB | 104.00 kB |

The recorded raw reduction was approximately 66.6%. The original text compared this with a 500 kB warning threshold. Current production budgets in [angular.json](../../frontend/angular.json) are **1.5 MB warning / 2 MB error** for initial bundles and **4 kB / 8 kB** for component styles. Neither the measurements nor the former threshold have been revalidated here.

## Decision: Explicit map worker assets

- **Problem:** Development bundling initially produced a visible map container without geographic layers when worker modules could not resolve.
- **Solution:** [Angular configuration](../../frontend/angular.json) excludes `maplibre-gl` from development prebundling and copies `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` from the package distribution to `/maplibre/`.
- **Rationale:** Explicit resource URLs make the worker and its shared module available independently of Angular rendering.
- **Trade-offs:** Asset names and paths depend on the installed MapLibre distribution. A successful HTTP response must contain JavaScript, not the application's HTML fallback. See [worker checks](../reproducibility/application-setup.md#browser-and-worker-checks).

```text
Angular Component → MapLibre GL JS → WebGL rendering
                                  → Web Worker
                                      ├─ maplibre-gl-worker.mjs
                                      └─ maplibre-gl-shared.mjs
```

## Decision: Semantic tokens bridge Taiga UI and Tailwind

- **Problem:** Keep component behavior, layout and accessibility themes visually consistent.
- **Solution:** Taiga UI supplies controls and drawers; Tailwind supplies composition, spacing, sizing and responsive utilities. [styles.css](../../frontend/src/styles.css) defines semantic colors, surfaces, borders, focus and interaction states, typography scaling, Tailwind theme mappings and a Taiga theme bridge. Angular includes MapLibre CSS, Taiga LESS themes/fonts, application CSS and copied Taiga icons.
- **Rationale:** The original design intentionally separates reusable control behavior from layout and centralizes theme values. The palette references Colombia and geographic exploration, with contrast as a design goal.
- **Trade-offs:** The bridge must track both styling systems. Palette selection and token-based focus indicators do not establish measured contrast or WCAG conformance.

## Decision: Signal state and cookie-backed accessibility preferences

- **Problem:** Share preferences across navigation, persist them across visits and prevent the default-theme flash seen on reload.
- **Solution:** [Accessibility](../../frontend/src/app/core/accessibility/accessibility.service.ts) owns private preference/panel signals and exposes readonly signals; navbar menu visibility uses a local signal. Settings cover text scaling (100/110/120/130%), spacing, high contrast, reduced motion, underlined links and default/red-green/blue-yellow/monochrome palettes. [Storage](../../frontend/src/app/core/accessibility/accessibility-storage.ts) reads Angular `REQUEST` cookies during SSR and `document.cookie` in the browser. Malformed/missing values fall back to validated defaults. Cookies use path `/`, one-year `Max-Age`, `SameSite=Lax` and `Secure` on HTTPS.
- **Rationale:** Cookies make preferences available to the server, unlike browser-only storage. The service applies attributes and CSS variables synchronously in its constructor on both platforms; `BEFORE_APP_SERIALIZED` reapplies them before sending server HTML.
- **Trade-offs:** These are browser-readable functional cookies. The earlier description that style changes wait for `afterNextRender()` is outdated; that hook now defers focus restoration. The original report observed no further flicker after restarting Docker development, but production validation remains outstanding.

```text
HTTP Request + Cookies → AccessibilityStorage (REQUEST) → Preference Validation
    → synchronous document initialization → BEFORE_APP_SERIALIZED
    → SSR HTML (CSS Variables + Data Attributes) → Browser Rendering → Hydration
```

## Decision: Shared accessibility panel and explicit focus restoration

- **Problem:** Scrolling did not restore keyboard navigation position; closing the mobile menu could remove the accessibility panel's originating element.
- **Solution:** A single [panel](../../frontend/src/app/core/layout/accessibility-panel/) is opened from navbar or footer. Its template has a named modal dialog, labelled settings and autofocus; Escape closes it. The mobile navbar drawer uses CDK focus trapping and auto-capture. The accessibility service remembers the opener and an optional mobile trigger fallback, restoring focus after rendering only to connected, visible elements outside inert/hidden ancestors. Footer scroll-to-top focuses `header-home-link` with `preventScroll` behind a browser guard.
- **Rationale:** Explicit focus transfer preserves continuity when UI elements disappear or scrolling changes the visible region.
- **Trade-offs:** If neither restoration target is eligible, focus is not restored by the service. The panel declares `tuiFocusTrap` in its template, but its component does not explicitly import a focus-trap directive; effective trapping requires browser verification. Keyboard checks with Tab, Enter and Escape were reported during development; final Windows Narrator validation is planned.

## Decision: Preprocessed responsive imagery

- **Problem:** Avoid transferring unnecessarily large landing-page images and reserve layout space.
- **Solution:** [Sharp script](../../frontend/scripts/optimize-images.mjs) reads `assets-source/`, rotates and resizes without enlargement, and writes WebP at quality `78`, effort `6` into `public/images/`. Hero widths are 640/1280/1920; discover widths are 320/640/960 with attention-based 4:5 cropping. Templates use native picture/srcset/sizes, eager/high-priority critical imagery, lazy secondary imagery, asynchronous decoding and explicit dimensions.
- **Rationale:** A repeatable preprocessing step keeps image generation independent of application startup and avoids a runtime image-loading library. Generated assets can be reused across deployments.
- **Trade-offs:** Source assets must be available, and changes require regeneration. LCP, transferred bytes, responsive selection, CLS and loading behavior remain evaluation tasks, not demonstrated improvements. [Reproduction command](../reproducibility/application-setup.md#image-preparation).

## Decision: Tests at component and accessibility boundaries

- **Problem:** Validate behavior without requiring the full containerized application.
- **Solution:** Angular's `@angular/build:unit-test` builder runs Vitest; Angular ESLint checks TypeScript/templates. Existing tests cover component creation, panel interaction, preference validation/application, cookie parsing/writing and SSR request isolation. App tests supply router/Taiga providers and stub `matchMedia` and jsdom visibility.
- **Rationale:** Separate storage, preference logic and UI make dependencies replaceable in focused tests.
- **Trade-offs:** DOM stubs do not prove real keyboard behavior, WebGL rendering, SSR delivery or assistive-technology compatibility. The map test is a creation check. No coverage percentage or full-browser test result is claimed.
