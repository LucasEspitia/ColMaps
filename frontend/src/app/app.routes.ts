import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home | ColMaps',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'search',
    title: 'Try it | ColMaps',
    loadComponent: () => import('./features/search/search').then((m) => m.Search),
  },
  {
    path: 'map',
    title: 'Map | ColMaps',
    loadComponent: () => import('./features/map/map').then((m) => m.MapComponent),
    data: {
      fullscreen: true,
    },
  },
  {
    path: 'about',
    title: 'About | ColMaps',
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  {
    path: 'quality',
    title: 'Quality Dashboard | ColMaps',
    loadComponent: () => import('./features/quality/quality').then((m) => m.Quality),
  },
  // * Redirect To Home
  {
    path: '**',
    redirectTo: '',
  },
];
