import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'graphs',
    loadComponent: () => import('./features/graphs/graphs.page').then((m) => m.GraphsPage),
  },
  {
    path: 'table',
    loadComponent: () => import('./features/table/table.page').then((m) => m.TablePage),
  },
];
