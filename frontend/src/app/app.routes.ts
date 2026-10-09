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
  },
  {
    path: 'about',
    title: 'About | ColMaps',
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  // * Redirect To Home
  {
    path: '**',
    redirectTo: '',
  },
];
