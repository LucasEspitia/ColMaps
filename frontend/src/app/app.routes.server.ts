import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    // Preferences depend on the incoming request cookie.
    renderMode: RenderMode.Server,
    headers: { 'Cache-Control': 'private, no-store' },
  },
];
